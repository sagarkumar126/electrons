// buyer-app/src/pages/RFQ/RFQDetail.tsx

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

const RFQDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRfq] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [roomId, setRoomId] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const [unreadCount, setUnreadCount] = useState(() => {
    if (!id) return 0
    const stored = localStorage.getItem(`unread_rfq_${id}`)
    return stored ? parseInt(stored) : 0
  })

  const updateUnread = (count: number) => {
    if (!id) return
    setUnreadCount(count)
    if (count <= 0) localStorage.removeItem(`unread_rfq_${id}`)
    else localStorage.setItem(`unread_rfq_${id}`, String(count))
    window.dispatchEvent(new Event("unread-rfq-updated"))
  }

  useEffect(() => {
    const handler = () => {
      if (!id) return
      const stored = localStorage.getItem(`unread_rfq_${id}`)
      setUnreadCount(stored ? parseInt(stored) : 0)
    }
    window.addEventListener("unread-rfq-updated", handler)
    return () => window.removeEventListener("unread-rfq-updated", handler)
  }, [id])

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    if (id) fetchRFQ()
  }, [id])

  useEffect(() => {
    if (user._id) socket.emit("join_buyer", user._id)

    if (roomId && showChat) {
      fetchChatHistory()
      socket.emit("join_room", roomId)
    }

    const handleMessage = (msg: any) => {
      if (msg.roomId === roomId) setChatMessages((prev) => [...prev, msg])
    }

    // ✅ Auto-refresh when seller edits/sends quote
    const handleRFQQuoted = (data: any) => {
      console.log("🔔 RFQ quoted/updated:", data)
      if (data.rfqId === id) fetchRFQ()
    }

    socket.on("receive_message", handleMessage)
    socket.on("rfq-quoted", handleRFQQuoted)
    socket.on("quote-updated", handleRFQQuoted)

    return () => {
      socket.off("receive_message", handleMessage)
      socket.off("rfq-quoted", handleRFQQuoted)
      socket.off("quote-updated", handleRFQQuoted)
    }
  }, [roomId, showChat, user._id, id])

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

  // ============================================
  // ✅ Accept Quote — Sends FULL breakdown to backend
  // ============================================
  const acceptQuote = async (rfqId: string) => {
    const q = rfq?.quote || {}
    const totalQty =
      Number(q.totalQuantity) ||
      rfq?.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) ||
      0

    const originalUnit = Number(q.originalPricePerUnit) || 0
    const originalTotal = Number(q.originalTotal) || 0
    const bulkUnit = Number(q.bulkPricePerUnit) || 0
    const bulkAmt = Number(q.bulkAmount) || 0
    const bulkGst = Number(q.bulkGstAmount) || (bulkAmt * 1.18)
    const advancePct = Number(q.advancePercent) || 40
    const advanceAmt = Number(q.advanceAmount) || (bulkGst * advancePct / 100)
    const remainingPct = Number(q.remainingPercent) || (100 - advancePct)
    const remainingAmt = Number(q.remainingAmount) || (bulkGst - advanceAmt)
    const priceToPay =
      Number(q.priceToPay) || bulkGst || bulkAmt || originalTotal || Number(q.totalQuote) || 0

    const confirmMsg =
      `Accept this quote?\n\n` +
      `Price to Pay: ₹${priceToPay.toFixed(2)}\n` +
      `Advance (${advancePct}%): ₹${advanceAmt.toFixed(2)}\n` +
      `Remaining (${remainingPct}%): ₹${remainingAmt.toFixed(2)}\n\n` +
      `An order will be created.`

    if (!window.confirm(confirmMsg)) return

    try {
      const res = await fetch(`http://localhost:5000/api/rfq/accept/${rfqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ✅ Full breakdown
          originalPricePerUnit: originalUnit,
          originalTotal,
          bulkPricePerUnit: bulkUnit,
          bulkAmount: bulkAmt,
          bulkGstAmount: bulkGst,
          gstPercent: 18,
          advancePercent: advancePct,
          advanceAmount: advanceAmt,
          remainingAmount: remainingAmt,
          remainingPercent: remainingPct,
          priceToPay,
          totalQuantity: totalQty,
          deliveryDate: q.deliveryDate || "",
          message: q.message || ""
        })
      })
      const data = await res.json()
      if (data.success) {
        alert("✅ Quote accepted! Order created.")
        fetchRFQ()
        setTimeout(() => navigate("/orders"), 1500)
      } else {
        alert("❌ Failed to accept quote: " + data.message)
      }
    } catch (error) {
      alert("❌ Server error. Please try again.")
    }
  }

  const rejectQuote = async (rfqId: string) => {
    if (!window.confirm("Reject this quote?")) return
    try {
      const res = await fetch(`http://localhost:5000/api/rfq/reject/${rfqId}`, {
        method: "PUT"
      })
      const data = await res.json()
      if (data.success) {
        alert("❌ Quote rejected")
        navigate("/rfq-dashboard")
      }
    } catch (error) {
      alert("❌ Failed to reject quote")
    }
  }

  const openChatPanel = () => {
    updateUnread(0)
    const productId = rfq?.items?.[0]?.productId || "general"
    const newRoomId = [user._id, rfq.sellerId, productId].sort().join("_")

    setRoomId(newRoomId)
    setSelectedSeller({
      sellerId: rfq.sellerId,
      sellerName: rfq.sellerName || "Seller",
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
    setSelectedSeller(null)
    socket.emit("leave_room", roomId)
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return
    setIsSending(true)

    const productId = selectedSeller?.productId || selectedSeller?.requirementId || "general"
    const messageData = {
      roomId,
      senderId: user._id,
      senderRole: "buyer",
      senderName: user.name || "Buyer",
      receiverId: selectedSeller.sellerId,
      receiverName: "Seller",
      message: newMessage,
      productId,
      productName: selectedSeller.productName || "",
      productImage: selectedSeller.productImage || "",
      createdAt: new Date()
    }

    socket.emit("send_message", messageData)
    setChatMessages((prev) => [...prev, messageData])
    setNewMessage("")
    setIsSending(false)
  }

  const formatDate = (d: string) => {
    if (!d) return "To be confirmed"
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      })
    } catch { return d }
  }

  if (loading) {
    return (
      <div style={loadingContainer}>
        <div style={spinner}></div>
        <p style={{ color: "#64748b", marginTop: 16 }}>Loading RFQ...</p>
      </div>
    )
  }

  if (!rfq) return <div style={loadingStyle}>RFQ not found</div>

  // ============================================
  // Compute full quote breakdown
  // ============================================
  const hasQuote = rfq.quote && (
    rfq.quote.totalQuote ||
    rfq.quote.bulkGstAmount ||
    rfq.quote.bulkAmount ||
    rfq.quote.priceToPay
  )

  const totalQty =
    Number(rfq.quote?.totalQuantity) ||
    rfq.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0

  const originalUnit = Number(rfq.quote?.originalPricePerUnit) || 0
  const originalTotal = Number(rfq.quote?.originalTotal) || 0
  const bulkUnit = Number(rfq.quote?.bulkPricePerUnit) || 0
  const bulkAmt = Number(rfq.quote?.bulkAmount) || 0
  const bulkGst = Number(rfq.quote?.bulkGstAmount) || (bulkAmt * 1.18)
  const advancePct = Number(rfq.quote?.advancePercent) || 40
  const advanceAmt = Number(rfq.quote?.advanceAmount) || (bulkGst * advancePct / 100)
  const remainingPct = Number(rfq.quote?.remainingPercent) || (100 - advancePct)
  const remainingAmt = Number(rfq.quote?.remainingAmount) || (bulkGst - advanceAmt)
  const priceToPay =
    Number(rfq.quote?.priceToPay) || bulkGst || bulkAmt || originalTotal ||
    Number(rfq.quote?.totalQuote) || 0

  const statusConfig = (() => {
    switch (rfq.status) {
      case "Pending":
        return { bg: "linear-gradient(135deg,#f59e0b,#d97706)", label: "⏳ Pending", color: "white" }
      case "Quoted":
        return { bg: "linear-gradient(135deg,#3b82f6,#2563eb)", label: "💰 Quoted", color: "white" }
      case "Accepted":
        return { bg: "linear-gradient(135deg,#22c55e,#16a34a)", label: "✅ Accepted", color: "white" }
      default:
        return { bg: "linear-gradient(135deg,#ef4444,#dc2626)", label: "❌ Rejected", color: "white" }
    }
  })()

  return (
    <div style={pageWrapper}>
      {/* HERO */}
      <div style={heroSection}>
        <div style={heroLeft}>
          <button onClick={() => navigate(-1)} style={backBtn}>←</button>
          <div style={heroAvatar}>
            {rfq.items?.[0]?.productImage ? (
              <img src={rfq.items[0].productImage} alt="" style={heroAvatarImg} />
            ) : (
              <span style={{ fontSize: 22 }}>📋</span>
            )}
          </div>
          <div>
            <h1 style={heroTitle}>RFQ #{rfq.rfqId}</h1>
            <p style={heroSubtitle}>
              🏢 {rfq.sellerName} • 📅 {new Date(rfq.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div style={heroRight}>
          <span style={{ ...statusBadge, background: statusConfig.bg, color: statusConfig.color }}>
            {statusConfig.label}
          </span>

          {rfq.status === "Quoted" && (
            <>
              <button onClick={() => acceptQuote(rfq.rfqId)} style={heroBtnGreen}>
                ✅ Accept
              </button>
              <button onClick={() => rejectQuote(rfq.rfqId)} style={heroBtnRed}>
                ❌ Reject
              </button>
            </>
          )}
          {rfq.status === "Accepted" && (
            <button onClick={() => navigate("/orders")} style={heroBtnBlue}>
              📦 View Order
            </button>
          )}
          <button onClick={openChatPanel} style={heroBtnChat}>
            💬 Chat
            {unreadCount > 0 && <span style={heroBadge}>{unreadCount}</span>}
          </button>
        </div>
      </div>

      <div style={twoColLayout}>
        {/* LEFT */}
        <div style={leftColumn}>
          <div style={card}>
            <div style={cardHeader}>
              <span style={cardIcon}>📌</span>
              <h3 style={cardTitle}>RFQ Information</h3>
            </div>
            <div style={infoGridCompact}>
              <div style={infoItem}>
                <span style={infoLabel}>Seller</span>
                <span style={infoValue}>{rfq.sellerName}</span>
              </div>
              <div style={infoItem}>
                <span style={infoLabel}>Total Amount</span>
                <span style={{ ...infoValue, color: "#16a34a", fontWeight: 700 }}>
                  ₹{rfq.totalAmount}
                </span>
              </div>
              <div style={infoItem}>
                <span style={infoLabel}>Date</span>
                <span style={infoValue}>
                  {new Date(rfq.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={infoItem}>
                <span style={infoLabel}>Phone</span>
                <span style={infoValue}>{rfq.buyerPhone || "N/A"}</span>
              </div>
              {rfq.deliveryTimeline && (
                <div style={infoItem}>
                  <span style={infoLabel}>Delivery</span>
                  <span style={infoValue}>{rfq.deliveryTimeline}</span>
                </div>
              )}
              {rfq.paymentTerms && (
                <div style={infoItem}>
                  <span style={infoLabel}>Payment Terms</span>
                  <span style={infoValue}>{rfq.paymentTerms}</span>
                </div>
              )}
            </div>

            {rfq.message && (
              <div style={messageBox}>
                <span style={infoLabel}>📝 Message</span>
                <p style={messageText}>{rfq.message}</p>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={cardHeader}>
              <span style={cardIcon}>📦</span>
              <h3 style={cardTitle}>Products ({rfq.items.length})</h3>
            </div>
            <div style={itemsListCompact}>
              {rfq.items.map((item: any, index: number) => (
                <div key={index} style={itemRowCompact}>
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
                      <span style={itemMetaTag}>Qty: {item.quantity}</span>
                      <span style={itemMetaTag}>₹{item.price}/unit</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={rightColumn}>
          {/* ✅ FULL QUOTE CARD */}
          {hasQuote && (
            <div style={{
              ...quoteCard,
              borderColor: rfq.status === "Accepted" ? "#86efac" : "#93c5fd",
              background: rfq.status === "Accepted"
                ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                : "linear-gradient(135deg, #eff6ff, #dbeafe)"
            }}>
              <div style={quoteHeader}>
                <span style={quoteIcon}>
                  {rfq.status === "Accepted" ? "🎉" : "💰"}
                </span>
                <h3 style={quoteTitle}>
                  {rfq.status === "Accepted" ? "Quote Accepted" : "Quote Received"}
                </h3>
              </div>

              <div style={quoteDetailsCompact}>
                {/* Original Pricing */}
                <div style={quoteGroupLabel}>🏷️ Original Pricing</div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Price / Unit (Original)</span>
                  <span style={quoteDetailValue}>₹{originalUnit.toFixed(2)}</span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Original Total</span>
                  <span style={quoteDetailValue}>₹{originalTotal.toFixed(2)}</span>
                </div>

                {/* Bulk Pricing */}
                <div style={quoteGroupLabel}>📦 Bulk Pricing</div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Bulk Price / Unit</span>
                  <span style={quoteDetailValue}>₹{bulkUnit.toFixed(2)}</span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Bulk Amount</span>
                  <span style={{ ...quoteDetailValue, color: "#22c55e", fontWeight: "bold" }}>
                    ₹{bulkAmt.toFixed(2)}
                  </span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Total Bulk (18% GST)</span>
                  <span style={{ ...quoteDetailValue, color: "#7c3aed", fontWeight: "bold" }}>
                    ₹{bulkGst.toFixed(2)}
                  </span>
                </div>

                {/* Final */}
                <div style={quoteGroupLabel}>💵 Final</div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Total Quantity</span>
                  <span style={quoteDetailValue}>{totalQty} units</span>
                </div>
                <div style={{
                  ...quoteDetailRow,
                  borderTop: "2px solid #e2e8f0",
                  paddingTop: "8px",
                  marginTop: "6px"
                }}>
                  <span style={{ ...quoteDetailLabel, fontWeight: "bold" }}>Price to Pay</span>
                  <span style={{
                    ...quoteDetailValue,
                    color: "#2563eb",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}>
                    ₹{priceToPay.toFixed(2)}
                  </span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Advance ({advancePct}%)</span>
                  <span style={{ ...quoteDetailValue, color: "#f59e0b" }}>
                    ₹{advanceAmt.toFixed(2)}
                  </span>
                </div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Remaining ({remainingPct}%)</span>
                  <span style={{ ...quoteDetailValue, color: "#ef4444", fontWeight: "bold" }}>
                    ₹{remainingAmt.toFixed(2)}
                  </span>
                </div>

                {/* Delivery & Notes */}
                <div style={quoteGroupLabel}>📅 Delivery & 📝 Notes</div>
                <div style={quoteDetailRow}>
                  <span style={quoteDetailLabel}>Delivery Date</span>
                  <span style={quoteDetailValue}>
                    {rfq.quote.deliveryDate ? formatDate(rfq.quote.deliveryDate) : "To be confirmed"}
                  </span>
                </div>
                <div style={{ ...quoteDetailRow, borderBottom: "none" }}>
                  <span style={quoteDetailLabel}>Message</span>
                  <span style={{ ...quoteDetailValue, fontStyle: "italic" }}>
                    {rfq.quote.message ? `"${rfq.quote.message}"` : "No message"}
                  </span>
                </div>
              </div>

              {rfq.status === "Quoted" && (
                <div style={actionRowBig}>
                  <button onClick={() => acceptQuote(rfq.rfqId)} style={acceptBtnBig}>
                    ✅ Accept Quote
                  </button>
                  <button onClick={() => rejectQuote(rfq.rfqId)} style={rejectBtnBig}>
                    ❌ Reject
                  </button>
                </div>
              )}

              {rfq.status === "Accepted" && (
                <div style={actionRowBig}>
                  <button onClick={() => navigate("/orders")} style={viewOrderBtnBig}>
                    📦 View Order
                  </button>
                </div>
              )}

              <div style={actionRowBig}>
                <button onClick={openChatPanel} style={chatBtnBig}>
                  💬 Chat with Seller
                  {unreadCount > 0 && (
                    <span style={unreadBadge}>{unreadCount} unread</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PENDING */}
          {rfq.status === "Pending" && !hasQuote && (
            <div style={pendingCard}>
              <div style={pendingIconWrapper}>⏳</div>
              <h4 style={pendingTitle}>Waiting for Seller's Quote</h4>
              <p style={pendingText}>
                The seller has been notified and will send a quote shortly.
              </p>
              <button onClick={openChatPanel} style={chatBtnBig}>
                💬 Chat with Seller
                {unreadCount > 0 && (
                  <span style={unreadBadge}>{unreadCount} unread</span>
                )}
              </button>
            </div>
          )}

          {/* REJECTED */}
          {rfq.status === "Rejected" && (
            <div style={rejectedCard}>
              <div style={rejectedIconWrapper}>❌</div>
              <h4 style={rejectedTitle}>Quote Rejected</h4>
              <p style={rejectedText}>This quote has been rejected.</p>
            </div>
          )}
        </div>
      </div>

      {/* CHAT PANEL */}
      {showChat && selectedSeller && (
        <div style={chatPanelContainer}>
          <div style={chatPanel}>
            <div style={chatPanelHeader}>
              <div style={chatPanelHeaderInfo}>
                <div style={chatPanelAvatar}>
                  {selectedSeller.productImage ? (
                    <img src={selectedSeller.productImage} alt="" style={chatPanelAvatarImg} />
                  ) : (
                    <span style={chatPanelAvatarPlaceholder}>🏢</span>
                  )}
                </div>
                <div>
                  <h4 style={chatPanelName}>{selectedSeller.sellerName}</h4>
                  <p style={chatPanelProduct}>{selectedSeller.productName}</p>
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
                    if (msg.senderRole === "buyer") return true
                    if (msg.senderRole === "seller") return false
                    if (msg.senderId === user._id && msg.receiverId !== user._id) return true
                    if (msg.receiverId === user._id && msg.senderId !== user._id) return false
                    if (msg.senderId === selectedSeller?.sellerId) return false
                    if (msg.senderId === user._id) return true
                    return false
                  })()

                  return (
                    <div
                      key={idx}
                      style={{
                        ...chatPanelBubbleWrapper,
                        justifyContent: isOwn ? "flex-end" : "flex-start"
                      }}
                    >
                      <div
                        style={{
                          ...chatPanelBubble,
                          background: isOwn
                            ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                            : "#ffffff",
                          color: isOwn ? "white" : "#0f172a",
                          border: isOwn ? "none" : "1px solid #e2e8f0",
                          borderBottomRightRadius: isOwn ? 4 : 14,
                          borderBottomLeftRadius: isOwn ? 14 : 4
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>{msg.message}</p>
                        <small style={{
                          fontSize: 10,
                          opacity: 0.7,
                          display: "block",
                          marginTop: 4,
                          textAlign: "right"
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
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
                placeholder="Type a message..."
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

const pageWrapper: any = {
  minHeight: "calc(100vh - 130px)",
  background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
  padding: "20px",
  boxSizing: "border-box"
}

const loadingContainer: any = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "calc(100vh - 130px)"
}

const spinner: any = {
  width: 40,
  height: 40,
  border: "4px solid #e2e8f0",
  borderTop: "4px solid #7c3aed",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
}

const loadingStyle: any = {
  padding: 40,
  textAlign: "center",
  fontSize: 18,
  color: "#64748b"
}

const heroSection: any = {
  background: "linear-gradient(135deg, #1e293b 0%, #4c1d95 100%)",
  padding: "20px 24px",
  borderRadius: "20px",
  color: "white",
  marginBottom: "20px",
  boxShadow: "0 20px 60px rgba(30, 41, 59, 0.25)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap"
}

const heroLeft: any = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flex: 1,
  minWidth: 0
}

const heroRight: any = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap"
}

const backBtn: any = {
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "white",
  fontSize: 18,
  width: 42,
  height: 42,
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
}

const heroAvatar: any = {
  width: 56,
  height: 56,
  borderRadius: 14,
  overflow: "hidden",
  background: "rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: "2px solid rgba(255,255,255,0.25)"
}

const heroAvatarImg: any = {
  width: "100%",
  height: "100%",
  objectFit: "cover"
}

const heroTitle: any = {
  fontSize: 22,
  fontWeight: 800,
  margin: 0,
  color: "white"
}

const heroSubtitle: any = {
  fontSize: 13,
  color: "rgba(255,255,255,0.75)",
  marginTop: 4
}

const statusBadge: any = {
  padding: "8px 16px",
  borderRadius: "50px",
  fontSize: "13px",
  fontWeight: "700",
  whiteSpace: "nowrap"
}

const heroBtnGreen: any = {
  padding: "10px 18px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px"
}

const heroBtnRed: any = {
  padding: "10px 18px",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px"
}

const heroBtnBlue: any = {
  padding: "10px 18px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px"
}

const heroBtnChat: any = {
  padding: "10px 18px",
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: 8
}

const heroBadge: any = {
  background: "#ef4444",
  color: "white",
  borderRadius: "20px",
  padding: "1px 8px",
  fontSize: "11px",
  fontWeight: "800"
}

const twoColLayout: any = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr",
  gap: "20px",
  alignItems: "start"
}

const leftColumn: any = {
  display: "flex",
  flexDirection: "column",
  gap: "16px"
}

const rightColumn: any = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  position: "sticky",
  top: "20px"
}

const card: any = {
  background: "white",
  padding: "20px 22px",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: "1px solid #e2e8f0"
}

const cardHeader: any = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "16px",
  paddingBottom: "12px",
  borderBottom: "1px solid #f1f5f9"
}

const cardIcon: any = { fontSize: 20 }

const cardTitle: any = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "#0f172a"
}

const infoGridCompact: any = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px 16px"
}

const infoItem: any = {
  display: "flex",
  flexDirection: "column",
  gap: 4
}

const infoLabel: any = {
  fontSize: 10,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.6
}

const infoValue: any = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a"
}

const messageBox: any = {
  marginTop: 16,
  padding: "12px 14px",
  background: "#f8fafc",
  borderRadius: 10,
  border: "1px solid #e2e8f0"
}

const messageText: any = {
  margin: "6px 0 0 0",
  fontSize: 13,
  color: "#334155",
  lineHeight: 1.5
}

const itemsListCompact: any = {
  display: "flex",
  flexDirection: "column",
  gap: 10
}

const itemRowCompact: any = {
  display: "flex",
  gap: 12,
  padding: "12px 14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  alignItems: "center"
}

const itemImgWrapper: any = { flexShrink: 0 }

const itemImg: any = {
  width: 56,
  height: 56,
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid #e2e8f0"
}

const itemImgPlaceholder: any = {
  width: 56,
  height: 56,
  borderRadius: 10,
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  color: "#94a3b8",
  border: "1px solid #e2e8f0"
}

const itemDetails: any = { flex: 1, minWidth: 0 }

const itemName: any = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 6px 0"
}

const itemMeta: any = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
}

const itemMetaTag: any = {
  fontSize: 11,
  color: "#475569",
  background: "white",
  padding: "3px 12px",
  borderRadius: 20,
  fontWeight: 600,
  border: "1px solid #e2e8f0"
}

const quoteCard: any = {
  padding: "22px",
  borderRadius: "16px",
  border: "2px solid #93c5fd",
  boxShadow: "0 8px 30px rgba(59, 130, 246, 0.12)"
}

const quoteHeader: any = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 16
}

const quoteIcon: any = { fontSize: 30 }

const quoteTitle: any = {
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
  margin: 0
}

const quoteDetailsCompact: any = {
  background: "rgba(255,255,255,0.7)",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(226, 232, 240, 0.8)",
  marginBottom: 14
}

const quoteGroupLabel: any = {
  fontSize: 11,
  fontWeight: 800,
  color: "#7c3aed",
  letterSpacing: 0.5,
  textTransform: "uppercase",
  marginTop: 12,
  marginBottom: 6
}

const quoteDetailRow: any = {
  display: "flex",
  justifyContent: "space-between",
  padding: "5px 0",
  fontSize: 13,
  borderBottom: "1px dashed #e2e8f0"
}

const quoteDetailLabel: any = {
  color: "#64748b"
}

const quoteDetailValue: any = {
  color: "#0f172a",
  fontWeight: 600
}

const actionRowBig: any = {
  display: "flex",
  gap: 10,
  marginTop: 10
}

const acceptBtnBig: any = {
  flex: 1,
  padding: "13px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14
}

const rejectBtnBig: any = {
  flex: 1,
  padding: "13px",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14
}

const viewOrderBtnBig: any = {
  flex: 1,
  padding: "13px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14
}

const chatBtnBig: any = {
  flex: 1,
  padding: "13px",
  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8
}

const unreadBadge: any = {
  background: "#ef4444",
  color: "white",
  borderRadius: 20,
  padding: "2px 10px",
  fontSize: 11,
  fontWeight: 800
}

const pendingCard: any = {
  background: "linear-gradient(135deg, #fef3c7, #fde68a)",
  padding: "24px",
  borderRadius: 16,
  border: "1px solid #fcd34d",
  textAlign: "center"
}

const pendingIconWrapper: any = { fontSize: 44, marginBottom: 12 }

const pendingTitle: any = {
  fontSize: 16,
  fontWeight: 800,
  color: "#92400e",
  margin: "0 0 6px 0"
}

const pendingText: any = {
  fontSize: 13,
  color: "#78350f",
  margin: "0 0 16px 0",
  lineHeight: 1.5
}

const rejectedCard: any = {
  background: "linear-gradient(135deg, #fee2e2, #fecaca)",
  padding: "24px",
  borderRadius: 16,
  border: "1px solid #fca5a5",
  textAlign: "center"
}

const rejectedIconWrapper: any = { fontSize: 44, marginBottom: 12 }

const rejectedTitle: any = {
  fontSize: 16,
  fontWeight: 800,
  color: "#991b1b",
  margin: "0 0 6px 0"
}

const rejectedText: any = {
  fontSize: 13,
  color: "#7f1d1d",
  margin: 0
}

const chatPanelContainer: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "500px",
  height: "100vh",
  background: "white",
  boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column"
}

const chatPanel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%"
}

const chatPanelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  borderBottom: "1px solid #e2e8f0",
  background: "linear-gradient(135deg, #1e293b, #4c1d95)",
  color: "white"
}

const chatPanelHeaderInfo: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12
}

const chatPanelAvatar: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  overflow: "hidden",
  background: "rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid rgba(255,255,255,0.25)"
}

const chatPanelAvatarImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover"
}

const chatPanelAvatarPlaceholder: React.CSSProperties = { fontSize: 20 }

const chatPanelName: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: "white"
}

const chatPanelProduct: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "rgba(255,255,255,0.75)"
}

const chatPanelCloseBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  border: "none",
  fontSize: 18,
  cursor: "pointer",
  color: "white",
  width: 34,
  height: 34,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}

const chatPanelMessages: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  background: "#f8fafc"
}

const chatPanelEmpty: React.CSSProperties = {
  textAlign: "center",
  color: "#94a3b8",
  padding: "40px 0",
  fontSize: 14
}

const chatPanelBubbleWrapper: React.CSSProperties = { display: "flex" }

const chatPanelBubble: React.CSSProperties = {
  maxWidth: "80%",
  padding: "10px 14px",
  borderRadius: 14,
  margin: "2px 0",
  wordBreak: "break-word"
}

const chatPanelInputArea: React.CSSProperties = {
  display: "flex",
  gap: 10,
  padding: "12px 16px",
  borderTop: "1px solid #e2e8f0",
  background: "white",
  alignItems: "center"
}

const chatPanelInput: React.CSSProperties = {
  flex: 1,
  padding: "12px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 24,
  outline: "none",
  fontSize: 14,
  background: "#f8fafc"
}

const chatPanelSendBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
  color: "white",
  border: "none",
  borderRadius: "50%",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}

export default RFQDetail