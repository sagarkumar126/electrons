// seller-app/src/pages/RFQ/SellerRFQDetail.tsx

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

const SellerRFQDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRfq] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showQuoteForm, setShowQuoteForm] = useState(false)

  // ---- SEND QUOTE FIELDS ----
  const [originalPricePerUnit, setOriginalPricePerUnit] = useState("")
  const [originalTotalAmount, setOriginalTotalAmount] = useState("")
  const [bulkPricePerUnit, setBulkPricePerUnit] = useState("")
  const [bulkAmount, setBulkAmount] = useState("")
  const [advancePercent, setAdvancePercent] = useState("40")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [quoteMessage, setQuoteMessage] = useState("")

  const [calculated, setCalculated] = useState({
    totalQuantity: 0,
    originalTotal: 0,
    bulkAmount: 0,
    bulkGst: 0,
    advanceAmount: 0,
    advancePercent: 40,
    remainingAmount: 0,
    remainingPercent: 60,
    priceToPay: 0
  })

  // ---- EDIT QUOTE FIELDS ----
  const [showEditModal, setShowEditModal] = useState(false)
  const [editQuoteData, setEditQuoteData] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // ---- CHAT ----
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null)
  const [roomId, setRoomId] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const totalQuantity =
    rfq?.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0

  useEffect(() => {
    const originalTotal = Number(originalTotalAmount) || 0
    const bulkAmt = Number(bulkAmount) || 0
    const advPercent = Number(advancePercent) || 40

    const bulkGst = bulkAmt > 0 ? bulkAmt * 1.18 : 0
    const priceToPay = bulkGst || bulkAmt || originalTotal
    const advanceAmt = (priceToPay * advPercent) / 100
    const remainingAmt = priceToPay - advanceAmt
    const remainingPercent = 100 - advPercent

    setCalculated({
      totalQuantity,
      originalTotal,
      bulkAmount: bulkAmt,
      bulkGst,
      advanceAmount: advanceAmt,
      advancePercent: advPercent,
      remainingAmount: remainingAmt,
      remainingPercent,
      priceToPay
    })
  }, [originalTotalAmount, bulkAmount, advancePercent, totalQuantity])

  useEffect(() => {
    if (id) fetchRFQ()
  }, [id])

  // ✅ NEW: Auto-fill original price from product's actual price
  useEffect(() => {
    if (rfq?.items?.[0]?.price && totalQuantity > 0) {
      const productPrice = Number(rfq.items[0].price) || 0
      const totalAmount = productPrice * totalQuantity

      setOriginalPricePerUnit(productPrice.toFixed(2))
      setOriginalTotalAmount(totalAmount.toFixed(2))

      console.log("✅ Auto-filled original price:", productPrice, "×", totalQuantity, "=", totalAmount)
    }
  }, [rfq?.rfqId, totalQuantity])

  // ✅ Mark RFQ as opened when page loads (removes "NEW" badge)
  useEffect(() => {
    if (rfq?.rfqId) {
      localStorage.setItem(`rfq_opened_${rfq.rfqId}`, "true")
      window.dispatchEvent(new Event("rfqs-updated"))
    }
  }, [rfq?.rfqId])

  // ✅ Read unread + subscribe
  useEffect(() => {
    const buyerId = rfq?.buyerId
    if (!buyerId) {
      setUnreadCount(0)
      return
    }

    const readUnread = () => {
      const val = parseInt(localStorage.getItem(`unread_seller_${buyerId}`) || "0")
      setUnreadCount(isNaN(val) ? 0 : val)
    }

    readUnread()
    window.addEventListener("unread-seller-updated", readUnread)

    return () => {
      window.removeEventListener("unread-seller-updated", readUnread)
    }
  }, [rfq?.buyerId])

  useEffect(() => {
    const seller = JSON.parse(localStorage.getItem("user") || "{}")
    if (seller._id) socket.emit("join_seller", seller._id)

    if (roomId && showChat) {
      fetchChatHistory()
      socket.emit("join_room", roomId)
    }

    const handleMsg = (msg: any) => {
      if (msg.roomId === roomId) setChatMessages((prev) => [...prev, msg])
    }

    socket.on("receive_message", handleMsg)

    return () => {
      socket.off("receive_message", handleMsg)
    }
  }, [roomId, showChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const fetchRFQ = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/rfq/${id}`)
      const data = await res.json()
      if (data.success) setRfq(data.data)
    } catch (error) {
      console.error("Error fetching RFQ:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/${roomId}`)
      const data = await res.json()
      setChatMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching chat history:", error)
    }
  }

  const handleOriginalUnitChange = (value: string) => {
    setOriginalPricePerUnit(value)
    const unit = Number(value) || 0
    const qty = totalQuantity
    setOriginalTotalAmount(qty > 0 ? (unit * qty).toFixed(2) : "")
  }

  const handleOriginalTotalChange = (value: string) => {
    setOriginalTotalAmount(value)
    const total = Number(value) || 0
    const qty = totalQuantity
    setOriginalPricePerUnit(qty > 0 ? (total / qty).toFixed(2) : "")
  }

  const handleBulkUnitChange = (value: string) => {
    setBulkPricePerUnit(value)
    const unit = Number(value) || 0
    const qty = totalQuantity
    setBulkAmount(qty > 0 ? (unit * qty).toFixed(2) : "")
  }

  const handleBulkAmountChange = (value: string) => {
    setBulkAmount(value)
    const total = Number(value) || 0
    const qty = totalQuantity
    setBulkPricePerUnit(qty > 0 ? (total / qty).toFixed(2) : "")
  }

  const sendQuote = async () => {
    if (!originalTotalAmount || Number(originalTotalAmount) <= 0) {
      alert("Please enter Original Total Amount")
      return
    }
    if (!bulkAmount || Number(bulkAmount) <= 0) {
      alert("Please enter Bulk Amount")
      return
    }

    try {
      const quoteItems = rfq.items.map((item: any) => ({
        productId: item.productId,
        quotePrice: totalQuantity > 0 ? calculated.priceToPay / totalQuantity : 0
      }))

      const quoteData = {
        quoteItems,
        totalQuote: calculated.priceToPay,
        originalPricePerUnit: Number(originalPricePerUnit) || 0,
        originalTotal: Number(originalTotalAmount),
        bulkPricePerUnit: Number(bulkPricePerUnit) || 0,
        bulkAmount: Number(bulkAmount),
        bulkGstAmount: calculated.bulkGst,
        gstPercent: 18,
        advancePercent: Number(advancePercent),
        advanceAmount: calculated.advanceAmount,
        remainingAmount: calculated.remainingAmount,
        remainingPercent: calculated.remainingPercent,
        priceToPay: calculated.priceToPay,
        totalQuantity,
        deliveryDate,
        message: quoteMessage
      }

      const res = await fetch(`http://localhost:5000/api/rfq/quote/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData)
      })

      const data = await res.json()
      if (data.success) {
        alert("✅ Quote sent successfully!")
        fetchRFQ()
        setShowQuoteForm(false)
        resetForm()
      } else {
        alert("❌ Failed to send quote: " + data.message)
      }
    } catch (error) {
      console.error("Error sending quote:", error)
      alert("❌ Server error")
    }
  }

  const resetForm = () => {
    // ✅ Don't clear originalPrice/Total — keep auto-filled values
    setBulkPricePerUnit("")
    setBulkAmount("")
    setAdvancePercent("40")
    setDeliveryDate("")
    setQuoteMessage("")
  }

  const openEditModal = () => {
    if (rfq.quote) {
      const q = rfq.quote
      const qty = q.totalQuantity || totalQuantity

      const origUnit = Number(q.originalPricePerUnit) || 0
      const origTotal =
        Number(q.originalTotal) ||
        (origUnit > 0 ? origUnit * qty : 0) ||
        Number(q.totalQuote) || 0

      const bulkUnit = Number(q.bulkPricePerUnit) || 0
      const bulkAmt =
        Number(q.bulkAmount) ||
        (bulkUnit > 0 ? bulkUnit * qty : 0) ||
        Number(q.totalQuote) || 0

      setEditQuoteData({
        originalPricePerUnit:
          origUnit > 0 ? origUnit.toFixed(2)
            : (origTotal > 0 && qty > 0 ? (origTotal / qty).toFixed(2) : ""),
        originalTotal: origTotal > 0 ? origTotal.toFixed(2) : "",
        bulkPricePerUnit:
          bulkUnit > 0 ? bulkUnit.toFixed(2)
            : (bulkAmt > 0 && qty > 0 ? (bulkAmt / qty).toFixed(2) : ""),
        bulkAmount: bulkAmt > 0 ? bulkAmt.toFixed(2) : "",
        advancePercent: q.advancePercent?.toString() || "40",
        deliveryDate: q.deliveryDate
          ? (() => {
            try {
              const d = new Date(q.deliveryDate)
              return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : q.deliveryDate
            } catch { return q.deliveryDate }
          })()
          : "",
        message: q.message || ""
      })
      setShowEditModal(true)
    }
  }

  const updateQuote = async () => {
    if (!editQuoteData?.bulkAmount || Number(editQuoteData.bulkAmount) <= 0) {
      alert("Please enter valid Bulk Amount")
      return
    }

    setIsUpdating(true)

    try {
      const bulkAmt = Number(editQuoteData.bulkAmount)
      const bulkGst = bulkAmt * 1.18
      const priceToPay = bulkGst
      const advPercent = Number(editQuoteData.advancePercent) || 40
      const advanceAmt = (priceToPay * advPercent) / 100
      const remainingAmt = priceToPay - advanceAmt

      const res = await fetch(`http://localhost:5000/api/rfq/update-quote/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: user._id,
          totalQuote: priceToPay,
          originalPricePerUnit: Number(editQuoteData.originalPricePerUnit) || 0,
          originalTotal: Number(editQuoteData.originalTotal) || priceToPay,
          bulkPricePerUnit: Number(editQuoteData.bulkPricePerUnit) || 0,
          bulkAmount: bulkAmt,
          bulkGstAmount: bulkGst,
          gstPercent: 18,
          advancePercent: advPercent,
          advanceAmount: advanceAmt,
          remainingAmount: remainingAmt,
          remainingPercent: 100 - advPercent,
          priceToPay,
          deliveryDate: editQuoteData.deliveryDate,
          message: editQuoteData.message
        })
      })

      const data = await res.json()
      if (data.success) {
        alert("✅ Quote updated successfully!")
        setShowEditModal(false)
        fetchRFQ()
      } else {
        alert("❌ Failed to update quote: " + data.message)
      }
    } catch (error) {
      console.error("Error updating quote:", error)
      alert("❌ Server error")
    } finally {
      setIsUpdating(false)
    }
  }

  const openChatPanel = () => {
    const buyerId = rfq.buyerId
    const productId = rfq?.items?.[0]?.productId || "general"
    const newRoomId = [buyerId, user._id, productId].sort().join("_")

    localStorage.removeItem(`unread_seller_${buyerId}`)
    window.dispatchEvent(new Event("unread-seller-updated"))
    setUnreadCount(0)

    setRoomId(newRoomId)
    setSelectedBuyer({
      buyerId,
      buyerName: rfq.buyerName || "Buyer",
      productName: rfq.items?.[0]?.productName || "Product",
      productImage: rfq.items?.[0]?.productImage || "",
      requirementId: rfq.rfqId,
      productId
    })
    setChatMessages([])
    setShowChat(true)
  }

  const closeChatPanel = () => {
    setShowChat(false)
    setChatMessages([])
    setSelectedBuyer(null)
    socket.emit("leave_room", roomId)
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return
    setIsSending(true)

    const productId = selectedBuyer?.productId || selectedBuyer?.requirementId || "general"

    const messageData = {
      roomId,
      senderId: user._id,
      senderRole: "seller",
      senderName: user.companyName || user.name || "Seller",
      receiverId: selectedBuyer.buyerId,
      receiverName: "Buyer",
      message: newMessage,
      productId,
      productName: selectedBuyer.productName || "",
      productImage: selectedBuyer.productImage || "",
      createdAt: new Date()
    }

    socket.emit("send_message", messageData)
    setChatMessages((prev) => [...prev, messageData])
    setNewMessage("")
    setIsSending(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
  if (!rfq) return <div style={{ padding: 40, textAlign: "center" }}>RFQ not found</div>

  const hasQuote = rfq.quote && (
    rfq.quote.totalQuote ||
    rfq.quote.bulkAmount ||
    rfq.quote.bulkGstAmount ||
    rfq.quote.priceToPay
  )

  return (
    <div style={container}>
      <div style={showChat ? mainContentWithChat : mainContentFull}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>

        <div style={header}>
          <div>
            <h2 style={title}>📩 RFQ Details</h2>
            <p style={subtitle}>#{rfq.rfqId}</p>
          </div>
          <span style={{
            ...statusBadge,
            background:
              rfq.status === "Pending" ? "#f59e0b" :
                rfq.status === "Quoted" ? "#3b82f6" :
                  rfq.status === "Accepted" ? "#22c55e" :
                    rfq.status === "Rejected" ? "#ef4444" : "#6b7280",
            color: "white"
          }}>
            {rfq.status === "Pending" ? "⏳ Pending" :
              rfq.status === "Quoted" ? "💰 Quoted" :
                rfq.status === "Accepted" ? "✅ Accepted" :
                  rfq.status === "Rejected" ? "❌ Rejected" : rfq.status}
          </span>
        </div>

        <div style={infoCard}>
          <div style={infoGrid}>
            <div style={infoItem}>
              <span style={infoLabel}>👤 Buyer</span>
              <span style={infoValue}>{rfq.buyerName}</span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>📧 Email</span>
              <span style={infoValue}>{rfq.buyerEmail || "N/A"}</span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>📞 Phone</span>
              <span style={infoValue}>{rfq.buyerPhone || "N/A"}</span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>📅 Date</span>
              <span style={infoValue}>{new Date(rfq.createdAt).toLocaleString()}</span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>💰 Total Amount</span>
              <span style={infoValue}>₹{rfq.totalAmount}</span>
            </div>
            {rfq.deliveryTimeline && (
              <div style={infoItem}>
                <span style={infoLabel}>⏱️ Delivery Timeline</span>
                <span style={infoValue}>{rfq.deliveryTimeline}</span>
              </div>
            )}

            {rfq.paymentTerms && (
              <div style={paymentTermsCard}>
                <span style={paymentTermsLabel}>💳 Payment Terms</span>
                <span style={paymentTermsValue}>
                  {(() => {
                    try {
                      const parsed = typeof rfq.paymentTerms === 'string'
                        ? JSON.parse(rfq.paymentTerms) : rfq.paymentTerms
                      if (parsed && typeof parsed === 'object' && parsed.advancePercent !== undefined) {
                        return `${parsed.advancePercent}% Advance, ${parsed.deliveryPercent || 50}% on Delivery`
                      }
                      return rfq.paymentTerms
                    } catch { return rfq.paymentTerms }
                  })()}
                </span>
              </div>
            )}

            {rfq.message && (
              <div style={messageCard}>
                <span style={messageLabel}>📝 Message</span>
                <span style={messageValue}>"{rfq.message}"</span>
              </div>
            )}
          </div>
        </div>

        <button onClick={openChatPanel} style={chatBtn}>
          💬 Chat with Buyer
          {unreadCount > 0 && (
            <span style={unreadBadge}>
              ({unreadCount} unread message{unreadCount > 1 ? "s" : ""})
            </span>
          )}
        </button>

        <h3 style={sectionTitle}>📦 Products</h3>
        <div style={itemsList}>
          {rfq.items.map((item: any, index: number) => (
            <div key={index} style={itemCard}>
              <div style={itemImgWrapper}>
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} style={itemImg} />
                ) : (
                  <div style={itemImgPlaceholder}>📦</div>
                )}
              </div>
              <div style={itemDetails}>
                <p style={itemName}>{item.productName}</p>
                <div style={itemMeta}>
                  <span style={itemMetaTag}>Qty: {item.quantity} units</span>
                  <span style={itemMetaTag}>₹{item.price}/unit</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(rfq.status === "Pending" || rfq.status === "pending") && (
          <button onClick={() => setShowQuoteForm(!showQuoteForm)} style={quoteBtn}>
            {showQuoteForm ? "✕ Cancel" : "💰 Send Quote"}
          </button>
        )}

        {showQuoteForm && (
          <div style={quoteForm}>
            <h3 style={formTitle}>💰 Send Quote</h3>

            <div style={totalBox}>
              <span style={totalBoxLabel}>📦 Total Quantity</span>
              <span style={totalBoxValue}>{totalQuantity} units</span>
            </div>

            <div style={sectionBox}>
              <h4 style={sectionBoxTitle}>🏷️ Original Pricing</h4>
              <div style={rowStyle}>
                <div style={halfField}>
                  <label style={label}>Price Per Unit (Original)</label>
                  <input
                    type="number"
                    placeholder="Enter unit price"
                    value={originalPricePerUnit}
                    onChange={(e) => handleOriginalUnitChange(e.target.value)}
                    style={input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={halfField}>
                  <label style={label}>Original Total Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Auto-calculated"
                    value={originalTotalAmount}
                    onChange={(e) => handleOriginalTotalChange(e.target.value)}
                    style={input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div style={sectionBox}>
              <h4 style={sectionBoxTitle}>📦 Bulk Pricing</h4>
              <div style={rowStyle}>
                <div style={halfField}>
                  <label style={label}>Bulk Price/Unit (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter bulk unit price"
                    value={bulkPricePerUnit}
                    onChange={(e) => handleBulkUnitChange(e.target.value)}
                    style={input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={halfField}>
                  <label style={label}>Bulk Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="Auto-calculated"
                    value={bulkAmount}
                    onChange={(e) => handleBulkAmountChange(e.target.value)}
                    style={input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={label}>Total Bulk Amount (18% GST)</label>
                <input
                  type="number"
                  value={calculated.bulkGst > 0 ? calculated.bulkGst.toFixed(2) : ""}
                  readOnly
                  placeholder="Auto (Bulk × 1.18)"
                  style={gstInput}
                />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={label}>Advance Payment (%)</label>
              <input
                type="number"
                value={advancePercent}
                onChange={(e) => setAdvancePercent(e.target.value)}
                style={input}
                min="0"
                max="100"
                step="1"
              />
            </div>

            {originalTotalAmount && bulkAmount && (
              <div style={calcBox}>
                <div style={calcRow}>
                  <span>Original Total:</span>
                  <span>₹{calculated.originalTotal.toFixed(2)}</span>
                </div>
                <div style={calcRow}>
                  <span>Bulk Amount:</span>
                  <span style={{ color: "#22c55e", fontWeight: "bold" }}>
                    ₹{calculated.bulkAmount.toFixed(2)}
                  </span>
                </div>
                <div style={calcRow}>
                  <span>Total Bulk (18% GST):</span>
                  <span style={{ color: "#7c3aed", fontWeight: "bold" }}>
                    ₹{calculated.bulkGst.toFixed(2)}
                  </span>
                </div>
                <div style={{ ...calcRow, borderTop: "1px solid #e2e8f0", paddingTop: "8px", fontWeight: "bold" }}>
                  <span>Price to Pay:</span>
                  <span style={{ color: "#2563eb", fontSize: "18px" }}>
                    ₹{calculated.priceToPay.toFixed(2)}
                  </span>
                </div>
                <div style={calcRow}>
                  <span>Advance ({calculated.advancePercent}%):</span>
                  <span style={{ color: "#f59e0b" }}>₹{calculated.advanceAmount.toFixed(2)}</span>
                </div>
                <div style={calcRow}>
                  <span>Remaining ({calculated.remainingPercent}%):</span>
                  <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                    ₹{calculated.remainingAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div style={fieldGroup}>
              <label style={label}>Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={input}
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Message (Optional)</label>
              <textarea
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                placeholder="Add any additional information..."
                style={textarea}
                rows={3}
              />
            </div>

            <button onClick={sendQuote} style={sendBtn}>📤 Send Quote</button>
          </div>
        )}

        {hasQuote && (
          <div style={{
            ...quotedBox,
            background: rfq.status === "Accepted" ? "#f0fdf4" :
              rfq.status === "Rejected" ? "#fef2f2" : "#eff6ff",
            borderColor: rfq.status === "Accepted" ? "#bbf7d0" :
              rfq.status === "Rejected" ? "#fecaca" : "#bfdbfe"
          }}>
            <div style={statusIcon}>
              {rfq.status === "Accepted" ? "🎉" :
                rfq.status === "Rejected" ? "❌" : "✅"}
            </div>
            <div style={statusContent}>
              <h4 style={statusTitle}>
                {rfq.status === "Accepted" ? "Quote Accepted!" :
                  rfq.status === "Rejected" ? "Quote Rejected" : "Quote Sent!"}
              </h4>
              <p style={statusText}>
                {rfq.status === "Accepted" ? "Order will be created soon." :
                  rfq.status === "Rejected" ? "Buyer rejected this quote." :
                    "Waiting for buyer's response."}
              </p>

              <div style={quoteDetails}>
                <div style={quoteGroupLabel}>🏷️ Original Pricing</div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Price / Unit (Original)</span>
                  <span style={quoteDetailValue}>
                    ₹{Number(rfq.quote.originalPricePerUnit || 0).toFixed(2)}
                  </span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Original Total</span>
                  <span style={quoteDetailValue}>
                    ₹{Number(rfq.quote.originalTotal || 0).toFixed(2)}
                  </span>
                </div>

                <div style={quoteGroupLabel}>📦 Bulk Pricing</div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Bulk Price / Unit</span>
                  <span style={quoteDetailValue}>
                    ₹{Number(rfq.quote.bulkPricePerUnit || 0).toFixed(2)}
                  </span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Bulk Amount</span>
                  <span style={{ ...quoteDetailValue, color: "#22c55e", fontWeight: "bold" }}>
                    ₹{Number(rfq.quote.bulkAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Total Bulk (18% GST)</span>
                  <span style={{ ...quoteDetailValue, color: "#7c3aed", fontWeight: "bold" }}>
                    ₹{Number(
                      rfq.quote.bulkGstAmount ||
                      (Number(rfq.quote.bulkAmount) || 0) * 1.18
                    ).toFixed(2)}
                  </span>
                </div>

                <div style={quoteGroupLabel}>💵 Final</div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Total Quantity</span>
                  <span style={quoteDetailValue}>
                    {rfq.quote.totalQuantity || totalQuantity} units
                  </span>
                </div>
                <div style={{ ...quoteDetailRow, borderTop: "2px solid #e2e8f0", paddingTop: "8px", marginTop: "4px" }}>
                  <span style={{ ...quoteDetailLabel, fontWeight: "bold" }}>Price to Pay</span>
                  <span style={{ ...quoteDetailValue, color: "#2563eb", fontSize: "16px", fontWeight: "bold" }}>
                    ₹{Number(
                      rfq.quote.priceToPay ||
                      rfq.quote.bulkGstAmount ||
                      rfq.quote.totalQuote || 0
                    ).toFixed(2)}
                  </span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Advance ({rfq.quote.advancePercent || 40}%)</span>
                  <span style={{ ...quoteDetailValue, color: "#f59e0b" }}>
                    ₹{Number(rfq.quote.advanceAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Remaining ({rfq.quote.remainingPercent || 60}%)</span>
                  <span style={{ ...quoteDetailValue, color: "#ef4444", fontWeight: "bold" }}>
                    ₹{Number(rfq.quote.remainingAmount || 0).toFixed(2)}
                  </span>
                </div>

                <div style={quoteGroupLabel}>📅 Delivery & 📝 Notes</div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Delivery</span>
                  <span style={quoteDetailValue}>
                    {rfq.quote.deliveryDate || "To be confirmed"}
                  </span>
                </div>
                {rfq.quote.message && (
                  <div style={quoteDetailRow}>
                    <span style={quoteDetailLabel}>Message</span>
                    <span style={{ ...quoteDetailValue, fontStyle: "italic" }}>
                      "{rfq.quote.message}"
                    </span>
                  </div>
                )}
              </div>

              {rfq.status === "Quoted" && (
                <button onClick={openEditModal} style={editBtn}>✏️ Edit Quote</button>
              )}

              {rfq.status === "Accepted" && (
                <button onClick={() => navigate("/orders")} style={orderBtn}>
                  📦 View Orders
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showEditModal && editQuoteData && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>✏️ Edit Quote</h3>
              <button onClick={() => setShowEditModal(false)} style={modalCloseBtn}>✕</button>
            </div>
            <div style={modalProductInfo}>
              <p><strong>Product:</strong> {rfq.items?.[0]?.productName || "Product"}</p>
              <p><strong>Buyer:</strong> {rfq.buyerName}</p>
              <p><strong>Quantity:</strong> {totalQuantity} units</p>
            </div>

            <div style={sectionBox}>
              <h4 style={sectionBoxTitle}>🏷️ Original Pricing</h4>
              <div style={rowStyle}>
                <div style={halfField}>
                  <label style={label}>Price Per Unit (Original)</label>
                  <input
                    type="number"
                    value={editQuoteData.originalPricePerUnit}
                    onChange={(e) => {
                      const val = e.target.value
                      setEditQuoteData({
                        ...editQuoteData,
                        originalPricePerUnit: val,
                        originalTotal: totalQuantity > 0
                          ? (Number(val) * totalQuantity).toFixed(2)
                          : editQuoteData.originalTotal
                      })
                    }}
                    style={input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={halfField}>
                  <label style={label}>Original Total Amount (₹)</label>
                  <input
                    type="number"
                    value={editQuoteData.originalTotal}
                    onChange={(e) => {
                      const val = e.target.value
                      setEditQuoteData({
                        ...editQuoteData,
                        originalTotal: val,
                        originalPricePerUnit: totalQuantity > 0
                          ? (Number(val) / totalQuantity).toFixed(2)
                          : editQuoteData.originalPricePerUnit
                      })
                    }}
                    style={input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div style={sectionBox}>
              <h4 style={sectionBoxTitle}>📦 Bulk Pricing</h4>
              <div style={rowStyle}>
                <div style={halfField}>
                  <label style={label}>Bulk Price/Unit (₹)</label>
                  <input
                    type="number"
                    value={editQuoteData.bulkPricePerUnit}
                    onChange={(e) => {
                      const val = e.target.value
                      setEditQuoteData({
                        ...editQuoteData,
                        bulkPricePerUnit: val,
                        bulkAmount: totalQuantity > 0
                          ? (Number(val) * totalQuantity).toFixed(2)
                          : editQuoteData.bulkAmount
                      })
                    }}
                    style={input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={halfField}>
                  <label style={label}>Bulk Amount (₹) *</label>
                  <input
                    type="number"
                    value={editQuoteData.bulkAmount}
                    onChange={(e) => {
                      const val = e.target.value
                      setEditQuoteData({
                        ...editQuoteData,
                        bulkAmount: val,
                        bulkPricePerUnit: totalQuantity > 0
                          ? (Number(val) / totalQuantity).toFixed(2)
                          : editQuoteData.bulkPricePerUnit
                      })
                    }}
                    style={input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={label}>Total Bulk Amount (18% GST)</label>
                <input
                  type="number"
                  value={Number(editQuoteData.bulkAmount) > 0
                    ? (Number(editQuoteData.bulkAmount) * 1.18).toFixed(2)
                    : ""}
                  readOnly
                  style={gstInput}
                  placeholder="Auto"
                />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={label}>Advance Payment (%)</label>
              <input
                type="number"
                value={editQuoteData.advancePercent}
                onChange={(e) => setEditQuoteData({ ...editQuoteData, advancePercent: e.target.value })}
                style={input}
                min="0"
                max="100"
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Delivery Date</label>
              <input
                type="date"
                value={editQuoteData.deliveryDate}
                onChange={(e) => setEditQuoteData({ ...editQuoteData, deliveryDate: e.target.value })}
                style={input}
              />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Message</label>
              <textarea
                value={editQuoteData.message}
                onChange={(e) => setEditQuoteData({ ...editQuoteData, message: e.target.value })}
                style={{ ...input, minHeight: 80, resize: "vertical" }}
              />
            </div>

            <div style={btnRow}>
              <button onClick={updateQuote} disabled={isUpdating} style={updateBtn}>
                {isUpdating ? "Updating..." : "✅ Update Quote"}
              </button>
              <button onClick={() => setShowEditModal(false)} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showChat && selectedBuyer && (
        <div style={chatPanelContainer}>
          <div style={chatPanel}>
            <div style={chatPanelHeader}>
              <div style={chatPanelHeaderInfo}>
                <div style={chatPanelAvatar}>
                  {selectedBuyer.productImage ? (
                    <img src={selectedBuyer.productImage} alt="" style={chatPanelAvatarImg} />
                  ) : (
                    <span style={chatPanelAvatarPlaceholder}>👤</span>
                  )}
                </div>
                <div>
                  <h4 style={chatPanelName}>{selectedBuyer.buyerName}</h4>
                  <p style={chatPanelProduct}>{selectedBuyer.productName}</p>
                </div>
              </div>
              <button onClick={closeChatPanel} style={chatPanelCloseBtn}>✕</button>
            </div>

            <div style={chatPanelMessages}>
              {chatMessages.length === 0 ? (
                <div style={chatPanelEmpty}>No messages yet. Start chatting!</div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isOwn = (() => {
                    if (msg.senderRole === "seller") return true
                    if (msg.senderRole === "buyer") return false
                    if (msg.senderId === user._id && msg.receiverId !== user._id) return true
                    if (msg.receiverId === user._id && msg.senderId !== user._id) return false
                    if (msg.senderId === selectedBuyer?.buyerId) return false
                    return msg.senderId === user._id
                  })()

                  return (
                    <div key={idx} style={{ ...chatPanelBubbleWrapper, justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                      <div style={{
                        ...chatPanelBubble,
                        background: isOwn ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#ffffff",
                        color: isOwn ? "white" : "#0f172a",
                        border: isOwn ? "none" : "1px solid #e2e8f0",
                        borderBottomRightRadius: isOwn ? 4 : 14,
                        borderBottomLeftRadius: isOwn ? 14 : 4,
                        boxShadow: isOwn
                          ? "0 4px 12px rgba(124, 58, 237, 0.25)"
                          : "0 2px 6px rgba(0,0,0,0.04)"
                      }}>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>{msg.message}</p>
                        <small style={{ fontSize: 10, opacity: 0.7, display: "block", marginTop: 4, textAlign: "right" }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={chatPanelInputArea}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                style={chatPanelInput}
              />
              <button onClick={sendMessage} style={chatPanelSendBtn} disabled={isSending}>
                {isSending ? "..." : "➤"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ================= STYLES =================
const container: any = { padding: "20px", maxWidth: "100%", margin: "0", background: "linear-gradient(135deg, #f8fafc, #eef2ff)", minHeight: "100vh", display: "flex", gap: "20px", position: "relative" }
const mainContentFull: any = { flex: 1, maxWidth: "800px", margin: "0 auto", transition: "all 0.3s ease" }
const mainContentWithChat: any = { flex: 1, maxWidth: "800px", margin: "0 auto", transition: "all 0.3s ease" }
const backBtn: any = { padding: "8px 18px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", marginBottom: 20, fontSize: "14px", color: "#1e293b", fontWeight: "500", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }
const header: any = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: "10px", background: "white", padding: "20px 24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }
const title: any = { margin: 0, fontSize: "22px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px" }
const subtitle: any = { margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }
const statusBadge: any = { padding: "6px 18px", borderRadius: "50px", fontSize: "13px", fontWeight: "600", color: "white" }
const infoCard: any = { background: "white", padding: "20px 24px", borderRadius: "16px", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }
const infoGrid: any = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }
const infoItem: any = { display: "flex", flexDirection: "column", gap: "2px" }
const infoLabel: any = { fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }
const infoValue: any = { fontSize: "15px", fontWeight: "500", color: "#0f172a" }
const paymentTermsCard: any = { gridColumn: "1 / -1", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", padding: "12px 18px", borderRadius: "12px", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }
const paymentTermsLabel: any = { fontSize: "12px", fontWeight: "600", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }
const paymentTermsValue: any = { fontSize: "16px", fontWeight: "700", color: "#15803d" }
const messageCard: any = { gridColumn: "1 / -1", background: "linear-gradient(135deg, #eff6ff, #dbeafe)", padding: "12px 18px", borderRadius: "12px", border: "1px solid #bfdbfe", marginTop: "4px" }
const messageLabel: any = { fontSize: "12px", fontWeight: "600", color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.5px" }
const messageValue: any = { fontSize: "15px", fontWeight: "500", color: "#1e3a8a", marginTop: "4px", fontStyle: "italic" }
const chatBtn: any = { width: "100%", padding: "14px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }
const unreadBadge: any = { background: "#ef4444", color: "white", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: "bold" }
const sectionTitle: any = { fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: 12, marginTop: 0 }
const itemsList: any = { display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }
const itemCard: any = { display: "flex", gap: 16, padding: "14px 18px", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", alignItems: "center" }
const itemImgWrapper: any = { flexShrink: 0 }
const itemImg: any = { width: "64px", height: "64px", objectFit: "cover", borderRadius: "10px", border: "1px solid #e2e8f0" }
const itemImgPlaceholder: any = { width: "64px", height: "64px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: "#94a3b8", border: "1px solid #e2e8f0" }
const itemDetails: any = { flex: 1 }
const itemName: any = { fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: "0 0 6px 0" }
const itemMeta: any = { display: "flex", gap: 12, flexWrap: "wrap" }
const itemMetaTag: any = { fontSize: "13px", color: "#64748b", background: "#f1f5f9", padding: "2px 12px", borderRadius: "20px", fontWeight: "500" }
const quoteBtn: any = { width: "100%", padding: "14px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "16px", marginBottom: 15 }
const quoteForm: any = { background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }
const formTitle: any = { fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: "0 0 16px 0" }
const sectionBox: any = { background: "#ffffff", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: 14 }
const sectionBoxTitle: any = { margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "#0f172a" }
const rowStyle: any = { display: "flex", gap: 12, flexWrap: "wrap" }
const halfField: any = { flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 4 }
const calcHint: any = { fontSize: "12px", color: "#64748b", marginTop: 8, marginBottom: 0, fontStyle: "italic" }
const gstInput: any = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #ddd6fe", fontSize: "14px", outline: "none", background: "#f5f3ff", fontWeight: 600, color: "#7c3aed", boxSizing: "border-box", cursor: "not-allowed" }
const fieldGroup: any = { marginBottom: 14 }
const label: any = { display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: 4 }
const input: any = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box" }
const helperText: any = { fontSize: "12px", color: "#94a3b8", marginTop: "4px", display: "block" }
const textarea: any = { ...input, resize: "vertical", fontFamily: "inherit", minHeight: "80px" }
const sendBtn: any = { width: "100%", padding: "14px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "16px" }
const quotedBox: any = { background: "#eff6ff", padding: "20px 24px", borderRadius: "16px", border: "1px solid #bfdbfe", marginBottom: 20, display: "flex", gap: 16, alignItems: "flex-start" }
const statusIcon: any = { fontSize: "28px", flexShrink: 0 }
const statusContent: any = { flex: 1 }
const statusTitle: any = { fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0" }
const statusText: any = { fontSize: "14px", color: "#64748b", margin: "0 0 8px 0" }
const quoteDetails: any = { background: "white", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", marginBottom: "12px" }
const quoteGroupLabel: any = { fontSize: "11px", fontWeight: "800", color: "#7c3aed", letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 12, marginBottom: 6 }
const quoteDetailRow: any = { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dashed #e2e8f0" }
const quoteDetailLabel: any = { color: "#64748b", fontSize: 13 }
const quoteDetailValue: any = { fontWeight: "500", color: "#0f172a", fontSize: 13 }
const editBtn: any = { padding: "8px 20px", background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const totalBox: any = { background: "#f0f9ff", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #bae6fd", display: "flex", justifyContent: "space-between", alignItems: "center" }
const totalBoxLabel: any = { fontSize: "14px", fontWeight: "500", color: "#1e293b" }
const totalBoxValue: any = { fontSize: "16px", fontWeight: "700", color: "#2563eb" }
const calcBox: any = { background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #e2e8f0" }
const calcRow: any = { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "14px" }
const orderBtn: any = { padding: "8px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const modalOverlay: any = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }
const modalContent: any = { background: "white", padding: "25px", borderRadius: "16px", width: 520, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }
const modalHeader: any = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }
const modalCloseBtn: any = { background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }
const modalProductInfo: any = { background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", marginBottom: "15px", border: "1px solid #e2e8f0" }
const btnRow: any = { display: "flex", gap: "10px" }
const updateBtn: any = { flex: 1, padding: "12px", background: "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }
const cancelBtn: any = { flex: 1, padding: "12px", background: "#6b7280", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }

const chatPanelContainer: React.CSSProperties = { position: "fixed", top: 0, right: 0, width: 500, height: "100vh", background: "white", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", zIndex: 1000, display: "flex", flexDirection: "column" }
const chatPanel: React.CSSProperties = { display: "flex", flexDirection: "column", height: "100%" }
const chatPanelHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(135deg, #1e293b, #4c1d95)", color: "white" }
const chatPanelHeaderInfo: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12 }
const chatPanelAvatar: React.CSSProperties = { width: 42, height: 42, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.25)" }
const chatPanelAvatarImg: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" }
const chatPanelAvatarPlaceholder: React.CSSProperties = { fontSize: 20 }
const chatPanelName: React.CSSProperties = { margin: 0, fontSize: 15, fontWeight: 700, color: "white" }
const chatPanelProduct: React.CSSProperties = { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" }
const chatPanelCloseBtn: React.CSSProperties = { background: "rgba(255,255,255,0.15)", border: "none", fontSize: 18, cursor: "pointer", color: "white", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }
const chatPanelMessages: React.CSSProperties = { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc" }
const chatPanelEmpty: React.CSSProperties = { textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: 14 }
const chatPanelBubbleWrapper: React.CSSProperties = { display: "flex" }
const chatPanelBubble: React.CSSProperties = { maxWidth: "80%", padding: "10px 14px", borderRadius: 14, margin: "2px 0", wordBreak: "break-word" }
const chatPanelInputArea: React.CSSProperties = { display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid #e2e8f0", background: "white", alignItems: "center" }
const chatPanelInput: React.CSSProperties = { flex: 1, padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 24, outline: "none", fontSize: 14, background: "#f8fafc" }
const chatPanelSendBtn: React.CSSProperties = { width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", border: "none", borderRadius: "50%", cursor: "pointer", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }

export default SellerRFQDetail