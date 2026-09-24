// seller-app/src/pages/SellerRequirementDetail/SellerRequirementDetail.tsx

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

const SellerRequirementDetail = () => {
  const { requirementId } = useParams()
  const navigate = useNavigate()

  const seller = JSON.parse(localStorage.getItem("user") || "{}")

  const [req, setReq] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<any>(null)
  const [sending, setSending] = useState(false)

  // ---- SEND QUOTE FIELDS ----
  const [originalPricePerUnit, setOriginalPricePerUnit] = useState("")
  const [originalTotalAmount, setOriginalTotalAmount] = useState("")
  const [bulkPricePerUnit, setBulkPricePerUnit] = useState("")
  const [bulkAmount, setBulkAmount] = useState("")
  const [bulkGstAmount, setBulkGstAmount] = useState("")
  const [advancePercent, setAdvancePercent] = useState("40")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [quoteMessage, setQuoteMessage] = useState("")

  // ---- EDIT QUOTE FIELDS ----
  const [editOriginalPricePerUnit, setEditOriginalPricePerUnit] = useState("")
  const [editOriginalTotal, setEditOriginalTotal] = useState("")
  const [editBulkPricePerUnit, setEditBulkPricePerUnit] = useState("")
  const [editBulkAmount, setEditBulkAmount] = useState("")
  const [editBulkGstAmount, setEditBulkGstAmount] = useState("")
  const [editAdvancePercent, setEditAdvancePercent] = useState("40")
  const [editDeliveryDate, setEditDeliveryDate] = useState("")
  const [editMessage, setEditMessage] = useState("")

  // ---- CALCULATED (Send) ----
  const [calculated, setCalculated] = useState({
    totalQuantity: 0, originalTotal: 0, bulkAmount: 0, bulkGst: 0,
    advanceAmount: 0, advancePercent: 40, remainingAmount: 0,
    remainingPercent: 60, priceToPay: 0
  })

  // ---- CHAT ----
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null)
  const [roomId, setRoomId] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  // ✅ UNREAD COUNT FOR THIS SPECIFIC BUYER
  const [unreadCount, setUnreadCount] = useState(0)

  // ============================================
  // Fetch requirement
  // ============================================
  useEffect(() => {
    if (requirementId) fetchRequirement()
  }, [requirementId])

  const fetchRequirement = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/api/buyer-requirement/seller/${seller._id}`)
      const data = await res.json()
      const found = data.data?.find((r: any) => r.requirementId === requirementId)
      setReq(found || null)
    } catch (err) {
      console.error("Error fetching requirement:", err)
      setReq(null)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // ✅ Read unread count — persists across mounts
  // ============================================
  useEffect(() => {
    const buyerId = req?.buyerId
    if (!buyerId) {
      setUnreadCount(0)
      return
    }

    const readUnread = () => {
      const val = parseInt(localStorage.getItem(`unread_seller_${buyerId}`) || "0")
      setUnreadCount(isNaN(val) ? 0 : val)
    }

    // Initial read
    readUnread()

    // Listen for updates
    const handler = () => readUnread()
    window.addEventListener("unread-seller-updated", handler)

    // ✅ Also listen for socket notifications directly (in case window event missed)
    const onChatNotify = () => readUnread()
    socket.on("new-chat-notification", onChatNotify)

    return () => {
      window.removeEventListener("unread-seller-updated", handler)
      socket.off("new-chat-notification", onChatNotify)
    }
  }, [req?.buyerId])

  // ============================================
  // Send modal calculated
  // ============================================
  useEffect(() => {
    if (req) {
      const qty = req.quantity || 0
      const originalTotal = Number(originalTotalAmount) || 0
      const bulkAmt = Number(bulkAmount) || 0
      const bulkGst = Number(bulkGstAmount) || 0
      const advPercent = Number(advancePercent) || 40

      const priceToPay = bulkGst || bulkAmt || originalTotal
      const advanceAmt = (priceToPay * advPercent) / 100
      const remainingAmt = priceToPay - advanceAmt

      setCalculated({
        totalQuantity: qty,
        originalTotal,
        bulkAmount: bulkAmt,
        bulkGst,
        advanceAmount: advanceAmt,
        advancePercent: advPercent,
        remainingAmount: remainingAmt,
        remainingPercent: 100 - advPercent,
        priceToPay
      })
    }
  }, [originalTotalAmount, bulkAmount, bulkGstAmount, advancePercent, req])

  // ============================================
  // Chat listeners
  // ============================================
  useEffect(() => {
    if (roomId && showChat) {
      fetchChatHistory()
      socket.emit("join_room", roomId)
    }
    const handleMsg = (msg: any) => {
      if (msg.roomId === roomId) setChatMessages((prev) => [...prev, msg])
    }
    socket.on("receive_message", handleMsg)
    return () => socket.off("receive_message", handleMsg)
  }, [roomId, showChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // ============================================
  // Handlers — Send
  // ============================================
  const handleOriginalUnitChange = (value: string) => {
    setOriginalPricePerUnit(value)
    const qty = req?.quantity || 0
    setOriginalTotalAmount(qty > 0 ? (Number(value) * qty).toFixed(2) : "")
  }

  const handleOriginalTotalChange = (value: string) => {
    setOriginalTotalAmount(value)
    const qty = req?.quantity || 0
    setOriginalPricePerUnit(qty > 0 ? (Number(value) / qty).toFixed(2) : "")
  }

  const handleBulkUnitChange = (value: string) => {
    setBulkPricePerUnit(value)
    const qty = req?.quantity || 0
    const newAmount = Number(value) * qty
    setBulkAmount(qty > 0 ? newAmount.toFixed(2) : "")
    setBulkGstAmount(newAmount > 0 ? (newAmount * 1.18).toFixed(2) : "")
  }

  const handleBulkAmountChange = (value: string) => {
    setBulkAmount(value)
    const qty = req?.quantity || 0
    setBulkPricePerUnit(qty > 0 ? (Number(value) / qty).toFixed(2) : "")
    setBulkGstAmount(Number(value) > 0 ? (Number(value) * 1.18).toFixed(2) : "")
  }

  const handleBulkGstChange = (value: string) => {
    setBulkGstAmount(value)
    const baseBulk = Number(value) / 1.18
    setBulkAmount(baseBulk > 0 ? baseBulk.toFixed(2) : "")
    const qty = req?.quantity || 0
    setBulkPricePerUnit(qty > 0 && baseBulk > 0 ? (baseBulk / qty).toFixed(2) : "")
  }

  // ============================================
  // Handlers — Edit
  // ============================================
  const handleEditOriginalUnitChange = (value: string) => {
    setEditOriginalPricePerUnit(value)
    const qty = req?.quantity || 0
    setEditOriginalTotal(qty > 0 ? (Number(value) * qty).toFixed(2) : "")
  }

  const handleEditOriginalTotalChange = (value: string) => {
    setEditOriginalTotal(value)
    const qty = req?.quantity || 0
    setEditOriginalPricePerUnit(qty > 0 ? (Number(value) / qty).toFixed(2) : "")
  }

  const handleEditBulkUnitChange = (value: string) => {
    setEditBulkPricePerUnit(value)
    const qty = req?.quantity || 0
    const newAmount = Number(value) * qty
    setEditBulkAmount(qty > 0 ? newAmount.toFixed(2) : "")
    setEditBulkGstAmount(newAmount > 0 ? (newAmount * 1.18).toFixed(2) : "")
  }

  const handleEditBulkAmountChange = (value: string) => {
    setEditBulkAmount(value)
    const qty = req?.quantity || 0
    setEditBulkPricePerUnit(qty > 0 ? (Number(value) / qty).toFixed(2) : "")
    setEditBulkGstAmount(Number(value) > 0 ? (Number(value) * 1.18).toFixed(2) : "")
  }

  const handleEditBulkGstChange = (value: string) => {
    setEditBulkGstAmount(value)
    const baseBulk = Number(value) / 1.18
    setEditBulkAmount(baseBulk > 0 ? baseBulk.toFixed(2) : "")
    const qty = req?.quantity || 0
    setEditBulkPricePerUnit(qty > 0 && baseBulk > 0 ? (baseBulk / qty).toFixed(2) : "")
  }

  // ============================================
  // Send Quote
  // ============================================
  const sendQuote = async () => {
    if (!originalTotalAmount || Number(originalTotalAmount) <= 0) { alert("Please enter Original Total Amount"); return }
    if (!bulkAmount || Number(bulkAmount) <= 0) { alert("Please enter Bulk Amount"); return }

    setSending(true)
    try {
      const res = await fetch("http://localhost:5000/api/buyer-requirement/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementId: req.requirementId,
          sellerId: seller._id,
          sellerName: seller.companyName || seller.name,

          originalPricePerUnit: Number(originalPricePerUnit) || 0,
          originalTotal: Number(originalTotalAmount),

          bulkPricePerUnit: Number(bulkPricePerUnit) || 0,
          bulkAmount: Number(bulkAmount),
          bulkGstAmount: Number(bulkGstAmount) || 0,
          gstPercent: 18,

          advancePercent: Number(advancePercent),
          advanceAmount: calculated.advanceAmount,
          remainingAmount: calculated.remainingAmount,
          remainingPercent: calculated.remainingPercent,

          priceToPay: calculated.priceToPay,
          totalQuantity: calculated.totalQuantity,
          price: calculated.priceToPay / calculated.totalQuantity,
          totalPrice: calculated.priceToPay,

          deliveryDate,
          message: quoteMessage
        })
      })
      const data = await res.json()
      if (data.success) {
        alert("✅ Quote sent successfully!")
        setShowQuoteModal(false)
        resetSendForm()
        fetchRequirement()
      } else {
        alert("❌ Failed: " + data.message)
      }
    } catch (err) {
      console.error(err)
      alert("❌ Server error")
    } finally {
      setSending(false)
    }
  }

  const resetSendForm = () => {
    setOriginalPricePerUnit(""); setOriginalTotalAmount("")
    setBulkPricePerUnit(""); setBulkAmount(""); setBulkGstAmount("")
    setAdvancePercent("40"); setDeliveryDate(""); setQuoteMessage("")
  }

  // ============================================
  // Open Edit Modal
  // ============================================
  const openEditModal = (quote: any) => {
    setEditingQuote(quote)
    const qty = Number(req.quantity) || 0

    const origUnit = Number(quote.originalPricePerUnit) || 0
    const origTotal =
      Number(quote.originalTotal) ||
      (origUnit > 0 ? origUnit * qty : 0) ||
      Number(quote.totalPrice) || 0

    setEditOriginalPricePerUnit(
      origUnit > 0 ? origUnit.toFixed(2)
        : (origTotal > 0 && qty > 0 ? (origTotal / qty).toFixed(2) : "")
    )
    setEditOriginalTotal(origTotal > 0 ? origTotal.toFixed(2) : "")

    const bulkUnit = Number(quote.bulkPricePerUnit) || 0
    const bulkAmt =
      Number(quote.bulkAmount) ||
      (bulkUnit > 0 ? bulkUnit * qty : 0) ||
      origTotal

    setEditBulkPricePerUnit(
      bulkUnit > 0 ? bulkUnit.toFixed(2)
        : (bulkAmt > 0 && qty > 0 ? (bulkAmt / qty).toFixed(2) : "")
    )
    setEditBulkAmount(bulkAmt > 0 ? bulkAmt.toFixed(2) : "")

    const gst = Number(quote.bulkGstAmount) || (bulkAmt > 0 ? bulkAmt * 1.18 : 0)
    setEditBulkGstAmount(gst > 0 ? gst.toFixed(2) : "")

    setEditAdvancePercent(quote.advancePercent?.toString() || "40")

    const rawDate = quote.deliveryDate || ""
    let normDate = ""
    if (rawDate) {
      try {
        const d = new Date(rawDate)
        if (!isNaN(d.getTime())) normDate = d.toISOString().split("T")[0]
        else normDate = rawDate
      } catch { normDate = rawDate }
    }
    setEditDeliveryDate(normDate)

    setEditMessage(quote.message || "")
    setShowEditModal(true)
  }

  // ============================================
  // Update Quote
  // ============================================
  const updateQuote = async () => {
    if (!editBulkAmount || Number(editBulkAmount) <= 0) { alert("Please enter Bulk Amount"); return }
    setSending(true)
    try {
      const gstTotal = Number(editBulkGstAmount) || (Number(editBulkAmount) * 1.18)
      const priceToPay = gstTotal
      const advPercent = Number(editAdvancePercent) || 40
      const advanceAmt = (priceToPay * advPercent) / 100
      const remainingAmt = priceToPay - advanceAmt

      const res = await fetch(
        `http://localhost:5000/api/buyer-requirement/update-quote/${req.requirementId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId: seller._id,
            oldPrice: editingQuote.price,
            originalPricePerUnit: Number(editOriginalPricePerUnit) || 0,
            originalTotal: Number(editOriginalTotal) || priceToPay,
            bulkPricePerUnit: Number(editBulkPricePerUnit) || 0,
            bulkAmount: Number(editBulkAmount),
            bulkGstAmount: gstTotal,
            gstPercent: 18,
            advancePercent: advPercent,
            advanceAmount: advanceAmt,
            remainingAmount: remainingAmt,
            remainingPercent: 100 - advPercent,
            priceToPay,
            deliveryDate: editDeliveryDate,
            message: editMessage
          })
        }
      )
      const data = await res.json()
      if (data.success) {
        alert("✅ Quote updated successfully!")
        setShowEditModal(false)
        setEditingQuote(null)
        fetchRequirement()
      } else {
        alert("❌ Failed: " + data.message)
      }
    } catch (err) {
      console.error(err)
      alert("❌ Server error")
    } finally {
      setSending(false)
    }
  }

  // ============================================
  // Chat helpers
  // ============================================
  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/${roomId}`)
      const data = await res.json()
      setChatMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching chat history:", error)
    }
  }

  // ✅ Clear unread when opening chat
  const openChatPanel = () => {
    const buyerId = req.buyerId
    const productId = req.productId || req.requirementId || "general"
    const newRoomId = [buyerId, seller._id, productId].sort().join("_")

    // ✅ CLEAR UNREAD
    localStorage.removeItem(`unread_seller_${buyerId}`)
    window.dispatchEvent(new Event("unread-seller-updated"))
    setUnreadCount(0)

    setRoomId(newRoomId)
    setSelectedBuyer({
      buyerId,
      buyerName: req.buyerName || "Buyer",
      productName: req.productName || "Product",
      productImage: req.productImage || "",
      requirementId: req.requirementId,
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
      senderId: seller._id,
      senderRole: "seller",
      senderName: seller.companyName || seller.name || "Seller",
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

  // ============================================
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "#f59e0b"
      case "Quoted": return "#8b5cf6"
      case "Closed": return "#22c55e"
      case "Accepted": return "#22c55e"
      default: return "#6b7280"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending": return "⏳ Pending"
      case "Quoted": return "💰 Quoted"
      case "Closed": return "🔒 Closed"
      case "Accepted": return "✅ Accepted"
      default: return status
    }
  }

  const formatDate = (d: string) => {
    if (!d) return "To be confirmed"
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    } catch { return d }
  }

  const formatDateTime = (date: string) => {
    const d = new Date(date)
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    }
  }

  if (loading) return <div style={styles.loading}>Loading requirement...</div>
  if (!req) return <div style={styles.loading}>Requirement not found</div>

  const { date, time } = formatDateTime(req.createdAt)
  const hasMyQuote = req.quotes?.find((q: any) => q.sellerId === seller._id)

  return (
    <div style={styles.page}>
      {/* BACK */}
      <button onClick={() => navigate("/buyer-requirements")} style={styles.backBtn}>
        ← Back to Requirements
      </button>

      {/* BUYER REQUIREMENT HEADER */}
      <div style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.productTitle}>{req.productName}</h1>
            <div style={styles.headerMeta}>
              <span>👤 <b>{req.buyerName || "Unknown"}</b></span>
              <span>📧 {req.buyerEmail || "N/A"}</span>
              <span>📞 <b style={{ color: "#2563eb" }}>{req.buyerPhone || "N/A"}</b></span>
            </div>
            <div style={styles.headerMetaSmall}>
              📅 {date} ⏰ {time}
            </div>
          </div>
          <span style={{ ...styles.statusBadge, background: getStatusColor(req.status) }}>
            {getStatusLabel(req.status)}
          </span>
        </div>

        <div style={styles.detailGrid}>
          <DetailItem label="📦 Quantity" value={`${req.quantity} ${req.unit}`} />
          <DetailItem label="📝 Description" value={req.description || "N/A"} />
          {req.additionalNotes && (
            <DetailItem label="📝 Additional Notes" value={req.additionalNotes} />
          )}
          {req.deliveryLocation && (
            <DetailItem label="📍 Delivery Location" value={req.deliveryLocation} />
          )}
          {req.deliveryTimeline && (
            <DetailItem label="⏱️ Timeline" value={req.deliveryTimeline} />
          )}
        </div>

        {/* Actions */}
        <div style={styles.headerActions}>
          {/* ✅ CHAT BUTTON WITH UNREAD BADGE TEXT */}
          <button style={styles.chatHeaderBtn} onClick={openChatPanel}>
            💬 Chat with Buyer
            {unreadCount > 0 && (
              <span style={styles.unreadText}>
                ({unreadCount} unread message{unreadCount > 1 ? "s" : ""})
              </span>
            )}
          </button>

          {!hasMyQuote && req.status === "Pending" && (
            <button
              style={styles.primaryBtn}
              onClick={() => {
                resetSendForm()
                setShowQuoteModal(true)
              }}
            >
              💰 Send Quote
            </button>
          )}
          {hasMyQuote && (
            <span style={styles.alreadyQuoted}>✅ You already sent a quote</span>
          )}
        </div>
      </div>

      {/* ALL QUOTES */}
      <div style={styles.quotesSection}>
        <h2 style={styles.sectionTitle}>💰 Quotes ({req.quotes?.length || 0})</h2>

        {(!req.quotes || req.quotes.length === 0) ? (
          <div style={styles.empty}>
            <p>No quotes yet. Be the first to send one!</p>
          </div>
        ) : (
          <div style={styles.quoteList}>
            {req.quotes.map((quote: any, idx: number) => {
              const isOwner = quote.sellerId === seller._id
              const totalQty = quote.totalQuantity || req.quantity || 0
              const originalUnit = Number(quote.originalPricePerUnit) || 0
              const originalTotal = Number(quote.originalTotal) || 0
              const bulkUnit = Number(quote.bulkPricePerUnit) || 0
              const bulkAmt = Number(quote.bulkAmount) || 0
              const bulkGst = Number(quote.bulkGstAmount) || (bulkAmt * 1.18)
              const advancePct = Number(quote.advancePercent) || 40
              const advanceAmt = Number(quote.advanceAmount) || (bulkGst * advancePct / 100)
              const remainingPct = Number(quote.remainingPercent) || (100 - advancePct)
              const remainingAmt = Number(quote.remainingAmount) || (bulkGst - advanceAmt)
              const priceToPay = Number(quote.priceToPay) || bulkGst || bulkAmt || originalTotal

              return (
                <div key={idx} style={{ ...styles.quoteCard, borderColor: isOwner ? "#3b82f6" : "#e2e8f0", borderWidth: isOwner ? 2 : 1 }}>
                  <div style={styles.quoteHeader}>
                    <span style={styles.quoteSeller}>
                      {isOwner && "👤 "}{quote.sellerName}
                      {isOwner && <span style={styles.yourTag}>YOUR QUOTE</span>}
                    </span>
                    <span style={styles.quotePrice}>
                      ₹{totalQty > 0 ? (priceToPay / totalQty).toFixed(2) : "0.00"}/unit
                    </span>
                  </div>

                  <div style={styles.quoteGroupLabel}>🏷️ Original Pricing</div>
                  <QuoteRow label="Price / Unit (Original)" value={`₹${originalUnit.toFixed(2)}`} />
                  <QuoteRow label="Original Total" value={`₹${originalTotal.toFixed(2)}`} />

                  <div style={styles.quoteGroupLabel}>📦 Bulk Pricing</div>
                  <QuoteRow label="Bulk Price / Unit" value={`₹${bulkUnit.toFixed(2)}`} />
                  <QuoteRow label="Bulk Amount" value={`₹${bulkAmt.toFixed(2)}`} color="#22c55e" bold />
                  <QuoteRow label="Total Bulk (18% GST)" value={`₹${bulkGst.toFixed(2)}`} color="#7c3aed" bold />

                  <div style={styles.quoteGroupLabel}>💵 Final</div>
                  <QuoteRow label="Total Quantity" value={`${totalQty} units`} />
                  <div style={{ ...styles.quoteDetailRow, borderTop: "2px solid #e2e8f0", paddingTop: "8px", marginTop: "6px" }}>
                    <span style={{ ...styles.quoteDetailLabel, fontWeight: "bold" }}>Price to Pay</span>
                    <span style={{ ...styles.quoteDetailValue, color: "#2563eb", fontSize: "16px", fontWeight: "bold" }}>
                      ₹{priceToPay.toFixed(2)}
                    </span>
                  </div>
                  <QuoteRow label={`Advance (${advancePct}%)`} value={`₹${advanceAmt.toFixed(2)}`} color="#f59e0b" />
                  <QuoteRow label={`Remaining (${remainingPct}%)`} value={`₹${remainingAmt.toFixed(2)}`} color="#ef4444" bold />

                  <div style={styles.quoteGroupLabel}>📅 Delivery & 📝 Notes</div>
                  <QuoteRow label="Delivery Date" value={quote.deliveryDate ? formatDate(quote.deliveryDate) : "To be confirmed"} />
                  <QuoteRow label="Message" value={quote.message ? `"${quote.message}"` : "No message"} italic />

                  <div style={styles.quoteFooter}>
                    <span style={{
                      ...styles.quoteStatus,
                      color: quote.status === "Quoted" ? "#3b82f6"
                        : quote.status === "Accepted" ? "#22c55e" : "#6b7280"
                    }}>
                      {quote.status === "Quoted" ? "💰 Quoted"
                        : quote.status === "Accepted" ? "✅ Accepted" : quote.status}
                    </span>
                    {isOwner && quote.status === "Quoted" && (
                      <button style={styles.editBtn} onClick={() => openEditModal(quote)}>
                        ✏️ Edit Quote
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CHAT PANEL */}
      {showChat && selectedBuyer && (
        <div style={chatPanelContainer}>
          <div style={chatPanel}>
            <div style={chatPanelHeader}>
              <div style={chatPanelHeaderInfo}>
                <div style={chatPanelAvatar}>
                  {selectedBuyer.productImage ? (
                    <img src={selectedBuyer.productImage} alt="" style={chatPanelAvatarImg} />
                  ) : (
                    <span style={chatPanelAvatarPlaceholder}>🏢</span>
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
                    if (msg.senderId === seller._id && msg.receiverId !== seller._id) return true
                    if (msg.receiverId === seller._id && msg.senderId !== seller._id) return false
                    if (msg.senderId === selectedBuyer?.buyerId) return false
                    if (msg.senderId === seller._id) return true
                    return false
                  })()

                  return (
                    <div
                      key={idx}
                      style={{ ...chatPanelBubbleWrapper, justifyContent: isOwn ? "flex-end" : "flex-start" }}
                    >
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

      {/* SEND QUOTE MODAL */}
      {showQuoteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>💰 Send Quote</h3>
              <button onClick={() => setShowQuoteModal(false)} style={styles.modalCloseBtn}>✕</button>
            </div>

            <div style={styles.modalProductInfo}>
              <p><strong>Product:</strong> {req.productName}</p>
              <p><strong>Buyer:</strong> {req.buyerName}</p>
              <p><strong>Quantity:</strong> {req.quantity} {req.unit}</p>
            </div>

            <div style={sectionBox}>
              <h4 style={sectionTitle}>🏷️ Original Pricing</h4>
              <div style={rowStyle}>
                <div style={halfField}>
                  <label style={label}>Price Per Unit (Original)</label>
                  <input type="number" value={originalPricePerUnit}
                    onChange={(e) => handleOriginalUnitChange(e.target.value)}
                    style={inputStyle} min="0" step="0.01" placeholder="0.00" />
                </div>
                <div style={halfField}>
                  <label style={label}>Original Total Amount (₹)</label>
                  <input type="number" value={originalTotalAmount}
                    onChange={(e) => handleOriginalTotalChange(e.target.value)}
                    style={inputStyle} min="0" step="0.01" placeholder="Auto" />
                </div>
              </div>
            </div>

            <div style={sectionBox}>
              <h4 style={sectionTitle}>📦 Bulk Pricing</h4>
              <div style={rowStyle}>
                <div style={halfField}>
                  <label style={label}>Bulk Price/Unit (₹)</label>
                  <input type="number" value={bulkPricePerUnit}
                    onChange={(e) => handleBulkUnitChange(e.target.value)}
                    style={inputStyle} min="0" step="0.01" placeholder="0.00" />
                </div>
                <div style={halfField}>
                  <label style={label}>Bulk Amount (₹) *</label>
                  <input type="number" value={bulkAmount}
                    onChange={(e) => handleBulkAmountChange(e.target.value)}
                    style={inputStyle} min="0" step="0.01" placeholder="Auto" />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={label}>Total Bulk Amount (18% GST)</label>
                <input type="number" value={bulkGstAmount}
                  onChange={(e) => handleBulkGstChange(e.target.value)}
                  style={{ ...inputStyle, background: "#f5f3ff", fontWeight: "600", color: "#7c3aed" }}
                  min="0" step="0.01" placeholder="Auto (Bulk × 1.18)" />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={label}>Advance Payment (%)</label>
              <input type="number" value={advancePercent}
                onChange={(e) => setAdvancePercent(e.target.value)}
                style={inputStyle} min="0" max="100" step="1" />
            </div>

            {(originalTotalAmount || bulkAmount) && (
              <div style={calcBox}>
                {originalTotalAmount && <div style={calcRow}><span>Original Total:</span><span>₹{calculated.originalTotal.toFixed(2)}</span></div>}
                {bulkAmount && <div style={calcRow}><span>Bulk Amount:</span><span style={{ color: "#22c55e", fontWeight: "bold" }}>₹{calculated.bulkAmount.toFixed(2)}</span></div>}
                {bulkGstAmount && <div style={calcRow}><span>Total Bulk (18% GST):</span><span style={{ color: "#7c3aed", fontWeight: "bold" }}>₹{calculated.bulkGst.toFixed(2)}</span></div>}
                <div style={{ ...calcRow, borderTop: "1px solid #e2e8f0", paddingTop: 8, fontWeight: "bold" }}>
                  <span>Price to Pay:</span>
                  <span style={{ color: "#2563eb", fontSize: 18 }}>₹{calculated.priceToPay.toFixed(2)}</span>
                </div>
                <div style={calcRow}><span>Advance ({calculated.advancePercent}%):</span><span style={{ color: "#f59e0b" }}>₹{calculated.advanceAmount.toFixed(2)}</span></div>
                <div style={calcRow}><span>Remaining ({calculated.remainingPercent}%):</span><span style={{ color: "#ef4444", fontWeight: "bold" }}>₹{calculated.remainingAmount.toFixed(2)}</span></div>
              </div>
            )}

            <div style={fieldGroup}>
              <label style={label}>Delivery Date</label>
              <input type="date" value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)} style={inputStyle} />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Message (Optional)</label>
              <textarea value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                style={{ ...inputStyle, minHeight: 80 }} placeholder="Add any notes..." />
            </div>

            <div style={btnRow}>
              <button onClick={sendQuote} disabled={sending} style={sendBtn}>
                {sending ? "Sending..." : "📤 Send Quote"}
              </button>
              <button onClick={() => setShowQuoteModal(false)} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT QUOTE MODAL */}
      {showEditModal && editingQuote && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>✏️ Edit Quote</h3>
              <button onClick={() => { setShowEditModal(false); setEditingQuote(null) }} style={styles.modalCloseBtn}>✕</button>
            </div>

            <div style={styles.modalProductInfo}>
              <p><strong>Product:</strong> {req.productName}</p>
              <p><strong>Buyer:</strong> {req.buyerName}</p>
              <p><strong>Quantity:</strong> {req.quantity} {req.unit}</p>
            </div>

            <div style={sectionBox}>
              <h4 style={sectionTitle}>🏷️ Original Pricing</h4>
              <div style={rowStyle}>
                <div style={halfField}>
                  <label style={label}>Price Per Unit (Original)</label>
                  <input type="number" value={editOriginalPricePerUnit}
                    onChange={(e) => handleEditOriginalUnitChange(e.target.value)}
                    style={inputStyle} min="0" step="0.01" />
                </div>
                <div style={halfField}>
                  <label style={label}>Original Total Amount (₹)</label>
                  <input type="number" value={editOriginalTotal}
                    onChange={(e) => handleEditOriginalTotalChange(e.target.value)}
                    style={inputStyle} min="0" step="0.01" />
                </div>
              </div>
            </div>

            <div style={sectionBox}>
              <h4 style={sectionTitle}>📦 Bulk Pricing</h4>
              <div style={rowStyle}>
                <div style={halfField}>
                  <label style={label}>Bulk Price/Unit (₹)</label>
                  <input type="number" value={editBulkPricePerUnit}
                    onChange={(e) => handleEditBulkUnitChange(e.target.value)}
                    style={inputStyle} min="0" step="0.01" />
                </div>
                <div style={halfField}>
                  <label style={label}>Bulk Amount (₹) *</label>
                  <input type="number" value={editBulkAmount}
                    onChange={(e) => handleEditBulkAmountChange(e.target.value)}
                    style={inputStyle} min="0" step="0.01" />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={label}>Total Bulk Amount (18% GST)</label>
                <input type="number" value={editBulkGstAmount}
                  onChange={(e) => handleEditBulkGstChange(e.target.value)}
                  style={{ ...inputStyle, background: "#f5f3ff", fontWeight: "600", color: "#7c3aed" }}
                  min="0" step="0.01" />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={label}>Advance Payment (%)</label>
              <input type="number" value={editAdvancePercent}
                onChange={(e) => setEditAdvancePercent(e.target.value)}
                style={inputStyle} min="0" max="100" />
            </div>

            {editBulkAmount && Number(editBulkAmount) > 0 && (
              <div style={calcBox}>
                <div style={calcRow}><span>Total Bulk (18% GST):</span><span style={{ color: "#7c3aed", fontWeight: "bold" }}>₹{(Number(editBulkGstAmount) || Number(editBulkAmount) * 1.18).toFixed(2)}</span></div>
                <div style={calcRow}><span>Price to Pay:</span><span style={{ color: "#2563eb", fontWeight: "bold" }}>₹{(Number(editBulkGstAmount) || Number(editBulkAmount) * 1.18).toFixed(2)}</span></div>
                <div style={calcRow}><span>Advance ({Number(editAdvancePercent) || 40}%):</span><span style={{ color: "#f59e0b" }}>₹{((Number(editBulkGstAmount) || Number(editBulkAmount) * 1.18) * (Number(editAdvancePercent) || 40) / 100).toFixed(2)}</span></div>
                <div style={calcRow}><span>Remaining ({100 - (Number(editAdvancePercent) || 40)}%):</span><span style={{ color: "#ef4444", fontWeight: "bold" }}>₹{((Number(editBulkGstAmount) || Number(editBulkAmount) * 1.18) * (100 - (Number(editAdvancePercent) || 40)) / 100).toFixed(2)}</span></div>
              </div>
            )}

            <div style={fieldGroup}>
              <label style={label}>Delivery Date</label>
              <input type="date" value={editDeliveryDate}
                onChange={(e) => setEditDeliveryDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Message</label>
              <textarea value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                style={{ ...inputStyle, minHeight: 80 }} />
            </div>

            <div style={btnRow}>
              <button onClick={updateQuote} disabled={sending} style={sendBtn}>
                {sending ? "Updating..." : "✅ Update Quote"}
              </button>
              <button onClick={() => { setShowEditModal(false); setEditingQuote(null) }} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Small reusable ----
const DetailItem = ({ label, value }: any) => (
  <div style={styles.detailItem}>
    <div style={styles.detailItemLabel}>{label}</div>
    <div style={styles.detailItemValue}>{value}</div>
  </div>
)

const QuoteRow = ({ label, value, color, bold, italic }: any) => (
  <div style={styles.quoteDetailRow}>
    <span style={styles.quoteDetailLabel}>{label}</span>
    <span style={{
      ...styles.quoteDetailValue,
      color: color || "#0f172a",
      fontWeight: bold ? "bold" : "500",
      fontStyle: italic ? "italic" : "normal"
    }}>{value}</span>
  </div>
)

// ================= STYLES =================
const styles: any = {
  page: { padding: 24, maxWidth: 1000, margin: "0 auto", minHeight: "100vh", background: "#f1f5f9" },
  backBtn: { padding: "8px 16px", background: "white", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", marginBottom: 20, fontSize: 14, fontWeight: 500 },

  headerCard: { background: "white", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 20 },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" },
  productTitle: { fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" },
  headerMeta: { display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14, color: "#475569", marginBottom: 4 },
  headerMetaSmall: { fontSize: 12, color: "#94a3b8" },
  statusBadge: { padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "white" },

  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 },
  detailItem: { background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #f1f5f9" },
  detailItemLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  detailItemValue: { fontSize: 14, color: "#0f172a", fontWeight: 500, lineHeight: 1.5 },

  headerActions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  chatHeaderBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6
  },
  unreadText: {
    background: "#ef4444",
    color: "white",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
    marginLeft: 6,
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
  },
  primaryBtn: { padding: "10px 20px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" },
  alreadyQuoted: { padding: "10px 16px", background: "#dcfce7", color: "#166534", borderRadius: 10, fontWeight: 600, fontSize: 13 },

  quotesSection: { background: "white", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 16 },
  quoteList: { display: "flex", flexDirection: "column", gap: 16 },

  quoteCard: { background: "#ffffff", padding: "16px 18px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" },
  quoteHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" },
  quoteSeller: { fontWeight: 700, color: "#0f172a", fontSize: 15, display: "flex", alignItems: "center", gap: 8 },
  yourTag: { background: "#dbeafe", color: "#1e40af", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 8, letterSpacing: 0.5 },
  quotePrice: { fontWeight: 700, color: "#16a34a", fontSize: 15, background: "#dcfce7", padding: "4px 12px", borderRadius: 12 },

  quoteGroupLabel: { fontSize: 11, fontWeight: 800, color: "#7c3aed", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 12, marginBottom: 6 },
  quoteDetailRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderBottom: "1px dashed #f1f5f9" },
  quoteDetailLabel: { color: "#64748b" },
  quoteDetailValue: { color: "#0f172a", fontWeight: 500 },

  quoteFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: 8 },
  quoteStatus: { fontSize: 13, fontWeight: 700 },
  editBtn: { padding: "6px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 },

  empty: { textAlign: "center", padding: 40, color: "#94a3b8" },
  loading: { textAlign: "center", padding: 60, fontSize: 18, color: "#64748b" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 },
  modalContent: { background: "white", padding: 25, borderRadius: 12, width: 520, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalCloseBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" },
  modalProductInfo: { background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 15 }
}

const fieldGroup: React.CSSProperties = { marginBottom: 12 }
const label: React.CSSProperties = { display: "block", fontWeight: "bold", fontSize: 13, color: "#1e293b", marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "white" }
const btnRow: React.CSSProperties = { display: "flex", gap: 10 }
const sendBtn: React.CSSProperties = { flex: 1, padding: 10, background: "#22c55e", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }
const cancelBtn: React.CSSProperties = { flex: 1, padding: 10, background: "#6b7280", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }
const calcBox: React.CSSProperties = { background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 14 }
const calcRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }
const sectionBox: React.CSSProperties = { background: "#ffffff", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 14 }
const sectionTitle: React.CSSProperties = { margin: "0 0 12px 0", fontSize: 14, fontWeight: "bold", color: "#0f172a" }
const rowStyle: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap" }
const halfField: React.CSSProperties = { flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 4 }

// ================= CHAT PANEL STYLES =================
const chatPanelContainer: React.CSSProperties = {
  position: "fixed", top: 0, right: 0, width: 500, height: "100vh",
  background: "white", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
  zIndex: 1000, display: "flex", flexDirection: "column"
}
const chatPanel: React.CSSProperties = { display: "flex", flexDirection: "column", height: "100%" }
const chatPanelHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(135deg, #1e293b, #4c1d95)", color: "white"
}
const chatPanelHeaderInfo: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12 }
const chatPanelAvatar: React.CSSProperties = {
  width: 42, height: 42, borderRadius: "50%", overflow: "hidden",
  background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center",
  justifyContent: "center", border: "2px solid rgba(255,255,255,0.25)"
}
const chatPanelAvatarImg: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" }
const chatPanelAvatarPlaceholder: React.CSSProperties = { fontSize: 20 }
const chatPanelName: React.CSSProperties = { margin: 0, fontSize: 15, fontWeight: 700, color: "white" }
const chatPanelProduct: React.CSSProperties = { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" }
const chatPanelCloseBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)", border: "none", fontSize: 18, cursor: "pointer",
  color: "white", width: 34, height: 34, borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center"
}
const chatPanelMessages: React.CSSProperties = {
  flex: 1, overflowY: "auto", padding: 16, display: "flex",
  flexDirection: "column", gap: 8, background: "#f8fafc"
}
const chatPanelEmpty: React.CSSProperties = { textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: 14 }
const chatPanelBubbleWrapper: React.CSSProperties = { display: "flex" }
const chatPanelBubble: React.CSSProperties = { maxWidth: "80%", padding: "10px 14px", borderRadius: 14, margin: "2px 0", wordBreak: "break-word" }
const chatPanelInputArea: React.CSSProperties = {
  display: "flex", gap: 10, padding: "12px 16px",
  borderTop: "1px solid #e2e8f0", background: "white", alignItems: "center"
}
const chatPanelInput: React.CSSProperties = {
  flex: 1, padding: "12px 16px", border: "1px solid #d1d5db",
  borderRadius: 24, outline: "none", fontSize: 14, background: "#f8fafc"
}
const chatPanelSendBtn: React.CSSProperties = {
  width: 44, height: 44,
  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
  color: "white", border: "none", borderRadius: "50%", cursor: "pointer",
  fontWeight: 700, fontSize: 16, display: "flex",
  alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)"
}

export default SellerRequirementDetail