// ================= RequirementDetail.tsx (Buyer Side) =================
// File: buyer-app/src/pages/MyRequirements/RequirementDetail.tsx

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { API_URL, SOCKET_URL } from "../../config"

const socket = io(SOCKET_URL)

const RequirementDetail = () => {
  const { requirementId } = useParams()
  const navigate = useNavigate()

  const [requirement, setRequirement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [, setUnreadTick] = useState(0)

  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [roomId, setRoomId] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const getUnread = (sellerId: string) => {
    if (!sellerId) return 0
    const stored = localStorage.getItem(`unread_requirement_${sellerId}`)
    return stored ? parseInt(stored) : 0
  }

  useEffect(() => {
    if (requirementId && user._id) fetchRequirement()

    const onUnread = () => setUnreadTick(t => t + 1)
    window.addEventListener("unread-requirement-updated", onUnread)
    return () => window.removeEventListener("unread-requirement-updated", onUnread)
  }, [requirementId, user._id])

  useEffect(() => {
    if (user._id) socket.emit("join_buyer", user._id)

    const handleQuoteUpdated = (data: any) => {
      console.log("🔔 Quote updated by seller:", data)
      if (data.requirementId === requirementId) {
        fetchRequirement()
      }
    }

    const handleNewQuote = (data: any) => {
      console.log("🔔 New quote received:", data)
      if (data.requirementId === requirementId) {
        fetchRequirement()
      }
    }

    socket.on("quote-updated", handleQuoteUpdated)
    socket.on("new-quote-on-requirement", handleNewQuote)
    socket.on("new-quote", handleNewQuote)

    const handleMessage = (msg: any) => {
      if (msg.roomId === roomId) setChatMessages((prev) => [...prev, msg])
    }
    socket.on("receive_message", handleMessage)

    return () => {
      socket.off("quote-updated", handleQuoteUpdated)
      socket.off("new-quote-on-requirement", handleNewQuote)
      socket.off("new-quote", handleNewQuote)
      socket.off("receive_message", handleMessage)
    }
  }, [requirementId, user._id, roomId])

  useEffect(() => {
    if (roomId && showChat) {
      fetchChatHistory()
      socket.emit("join_room", roomId)
    }
  }, [roomId, showChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const fetchRequirement = async () => {
    try {
      const res = await fetch(`${API_URL}/buyer-requirement/buyer/${user._id}`)
      const data = await res.json()
      if (data.success) {
        const found = data.data.find((r: any) => r.requirementId === requirementId)
        setRequirement(found || null)
      }
    } catch (error) {
      console.error("Error fetching requirement:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/${roomId}`)
      const data = await res.json()
      setChatMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching chat history:", error)
    }
  }

  const acceptQuote = async (reqId: string, quote: any) => {
    if (!window.confirm(`Accept quote from ${quote.sellerName} for ₹${quote.price}/unit?`)) return
    try {
      const res = await fetch(`${API_URL}/buyer-requirement/accept-quote/${reqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: quote.sellerId,
          price: quote.price,
          sellerName: quote.sellerName
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert("✅ Quote accepted successfully!")
        fetchRequirement()
      } else {
        alert("❌ Failed to accept quote: " + data.message)
      }
    } catch (error: any) {
      alert("❌ Failed to accept quote: " + error.message)
    }
  }

  const openChatPanel = (sellerId: string, quote: any) => {
    const productId = requirement.productId || requirement.requirementId || "general"
    const newRoomId = [user._id, sellerId, productId].sort().join("_")

    localStorage.removeItem(`unread_requirement_${sellerId}`)
    window.dispatchEvent(new Event("unread-requirement-updated"))

    setRoomId(newRoomId)
    setSelectedSeller({
      sellerId,
      sellerName: quote?.sellerName || "Seller",
      productName: requirement.productName || "Product",
      productImage: requirement.productImage || "",
      requirementId: requirement.requirementId,
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

  if (loading) {
    return (
      <div style={loadingContainer}>
        <div style={spinner}></div>
        <p style={{ color: "#64748b", marginTop: 16 }}>Loading requirement...</p>
      </div>
    )
  }

  if (!requirement) {
    return (
      <div style={loadingContainer}>
        <p style={{ fontSize: 18, color: "#64748b" }}>Requirement not found</p>
        <button onClick={() => navigate("/my-requirements")} style={emptyBtn}>
          ← Back to Requirements
        </button>
      </div>
    )
  }

  const quotes = requirement.quotes || []
  const statusConfig = (() => {
    switch (requirement.status) {
      case "Pending":
        return { bg: "linear-gradient(135deg,#f59e0b,#d97706)", label: "⏳ Pending" }
      case "Verified":
        return { bg: "linear-gradient(135deg,#3b82f6,#2563eb)", label: "✅ Verified" }
      case "Quoted":
        return { bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)", label: "💰 Quoted" }
      case "Closed":
        return { bg: "linear-gradient(135deg,#22c55e,#16a34a)", label: "🎉 Closed" }
      default:
        return { bg: "linear-gradient(135deg,#6b7280,#4b5563)", label: requirement.status }
    }
  })()

  const formatDateTime = (date: string) => {
    const d = new Date(date)
    return {
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    }
  }

  const formatDate = (d: string) => {
    if (!d) return "To be confirmed"
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      })
    } catch { return d }
  }

  const created = formatDateTime(requirement.createdAt)

  return (
    <div style={pageWrapper}>
      <div style={heroSection}>
        <div style={heroLeft}>
          <button onClick={() => navigate("/my-requirements")} style={backBtn}>←</button>
          <div style={heroAvatar}>
            {requirement.productImage ? (
              <img src={requirement.productImage} alt="" style={heroAvatarImg} />
            ) : (
              <span style={{ fontSize: 22 }}>📋</span>
            )}
          </div>
          <div>
            <h1 style={heroTitle}>{requirement.productName}</h1>
            <p style={heroSubtitle}>
              #{requirement.requirementId} • 📅 {created.date} ⏰ {created.time}
            </p>
          </div>
        </div>

        <div style={heroRight}>
          <span style={{ ...statusBadge, background: statusConfig.bg }}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div style={twoColLayout}>
        <div style={leftColumn}>
          <div style={card}>
            <div style={cardHeader}>
              <span style={cardIcon}>📌</span>
              <h3 style={cardTitle}>Requirement Information</h3>
            </div>
            <div style={infoGrid}>
              <div style={infoItem}>
                <span style={infoLabel}>Buyer</span>
                <span style={infoValue}>{requirement.buyerName || "You"}</span>
              </div>
              <div style={infoItem}>
                <span style={infoLabel}>Quantity</span>
                <span style={infoValue}>{requirement.quantity} {requirement.unit}</span>
              </div>
              <div style={infoItem}>
                <span style={infoLabel}>Phone</span>
                <span style={infoValue}>{requirement.buyerPhone || "N/A"}</span>
              </div>
              <div style={infoItem}>
                <span style={infoLabel}>Email</span>
                <span style={infoValue}>{requirement.buyerEmail || "N/A"}</span>
              </div>
              {requirement.category && (
                <div style={infoItem}>
                  <span style={infoLabel}>Category</span>
                  <span style={infoValue}>{requirement.category}</span>
                </div>
              )}
              {requirement.budget && (
                <div style={infoItem}>
                  <span style={infoLabel}>Budget</span>
                  <span style={infoValue}>₹{requirement.budget}</span>
                </div>
              )}
            </div>

            {requirement.description && (
              <div style={messageBox}>
                <span style={infoLabel}>📝 Description</span>
                <p style={messageText}>{requirement.description}</p>
              </div>
            )}

            {requirement.additionalNotes && (
              <div style={messageBox}>
                <span style={infoLabel}>📎 Additional Notes</span>
                <p style={messageText}>{requirement.additionalNotes}</p>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={cardHeader}>
              <span style={cardIcon}>💰</span>
              <h3 style={cardTitle}>Quotes Received ({quotes.length})</h3>
            </div>

            {quotes.length === 0 ? (
              <div style={noQuotesBox}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  No quotes yet. Sellers have been notified.
                </p>
              </div>
            ) : (
              <div style={quotesList}>
                {quotes.map((quote: any, idx: number) => {
                  const qDate = formatDateTime(quote.createdAt)
                  const unread = getUnread(quote.sellerId)

                  const totalQty = quote.totalQuantity || requirement.quantity || 0
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
                    <div key={idx} style={quoteItem}>
                      <div style={quoteItemHeader}>
                        <div style={quoteItemSeller}>
                          <div style={quoteSellerAvatar}>
                            {quote.sellerName?.[0]?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <p style={quoteSellerName}>{quote.sellerName}</p>
                            <p style={quoteSellerDate}>📅 {qDate.date} ⏰ {qDate.time}</p>
                          </div>
                        </div>
                        <span style={quotePrice}>
                          ₹{totalQty > 0 ? (priceToPay / totalQty).toFixed(2) : "0.00"}/unit
                        </span>
                      </div>

                      <div style={quoteGroupLabel}>🏷️ Original Pricing</div>
                      <div style={quoteDetailRow}>
                        <span style={quoteDetailLabel}>Price / Unit (Original)</span>
                        <span style={quoteDetailValue}>₹{originalUnit.toFixed(2)}</span>
                      </div>
                      <div style={quoteDetailRow}>
                        <span style={quoteDetailLabel}>Original Total</span>
                        <span style={quoteDetailValue}>₹{originalTotal.toFixed(2)}</span>
                      </div>

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

                      <div style={quoteGroupLabel}>📅 Delivery & 📝 Notes</div>
                      <div style={quoteDetailRow}>
                        <span style={quoteDetailLabel}>Delivery Date</span>
                        <span style={quoteDetailValue}>
                          {quote.deliveryDate ? formatDate(quote.deliveryDate) : "To be confirmed"}
                        </span>
                      </div>
                      <div style={quoteDetailRow}>
                        <span style={quoteDetailLabel}>Message</span>
                        <span style={{ ...quoteDetailValue, fontStyle: "italic" }}>
                          {quote.message ? `"${quote.message}"` : "No message"}
                        </span>
                      </div>

                      <div style={quoteActions}>
                        <button
                          style={chatSmallBtn}
                          onClick={() => openChatPanel(quote.sellerId, quote)}
                        >
                          💬 Chat
                          {unread > 0 && (
                            <span style={unreadBadge}>
                              {unread} unread
                            </span>
                          )}
                        </button>

                        {quote.status === "Quoted" && (
                          <button
                            style={acceptSmallBtn}
                            onClick={() => acceptQuote(requirement.requirementId, quote)}
                          >
                            ✅ Accept Quote
                          </button>
                        )}

                        {quote.status === "Accepted" && (
                          <>
                            <span style={acceptedBadge}>✅ Accepted</span>
                            <button
                              style={viewOrderSmallBtn}
                              onClick={() => navigate("/orders")}
                            >
                              📦 Orders
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div style={rightColumn}>
          <div style={summaryCard}>
            <div style={summaryHeader}>
              <span style={summaryIcon}>📊</span>
              <h3 style={summaryTitle}>Summary</h3>
            </div>

            <div style={summaryRow}>
              <span style={summaryLabel}>Status</span>
              <span style={{ ...summaryValue, color: "#7c3aed" }}>
                {statusConfig.label}
              </span>
            </div>
            <div style={summaryRow}>
              <span style={summaryLabel}>Quotes</span>
              <span style={summaryValue}>{quotes.length}</span>
            </div>
            <div style={summaryRow}>
              <span style={summaryLabel}>Quantity</span>
              <span style={summaryValue}>{requirement.quantity} {requirement.unit}</span>
            </div>
            <div style={{ ...summaryRow, borderBottom: "none" }}>
              <span style={summaryLabel}>Posted</span>
              <span style={summaryValue}>{created.date}</span>
            </div>

            <button
              onClick={() => navigate("/post-requirement")}
              style={postNewBtn}
            >
              ➕ Post New Requirement
            </button>
          </div>
        </div>
      </div>

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
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>
                          {msg.message}
                        </p>
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

const emptyBtn: any = {
  marginTop: 20,
  padding: "12px 24px",
  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  boxShadow: "0 8px 20px rgba(124, 58, 237, 0.3)"
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
  letterSpacing: "-0.5px",
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
  color: "white",
  whiteSpace: "nowrap",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
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

const infoGrid: any = {
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

const noQuotesBox: any = {
  textAlign: "center",
  padding: "32px 20px",
  background: "#f8fafc",
  borderRadius: 12,
  border: "1px dashed #cbd5e1"
}

const quotesList: any = {
  display: "flex",
  flexDirection: "column",
  gap: 12
}

const quoteItem: any = {
  padding: "16px",
  background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
  border: "1px solid #e2e8f0",
  borderRadius: 12
}

const quoteItemHeader: any = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
  flexWrap: "wrap"
}

const quoteItemSeller: any = {
  display: "flex",
  alignItems: "center",
  gap: 12
}

const quoteSellerAvatar: any = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 800,
  flexShrink: 0
}

const quoteSellerName: any = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: "#0f172a"
}

const quoteSellerDate: any = {
  margin: "2px 0 0 0",
  fontSize: 11,
  color: "#94a3b8"
}

const quotePrice: any = {
  fontSize: 18,
  fontWeight: 800,
  color: "#16a34a",
  background: "#dcfce7",
  padding: "4px 12px",
  borderRadius: 20
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

const quoteActions: any = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 14,
  paddingTop: 12,
  borderTop: "1px solid #e2e8f0",
  alignItems: "center"
}

const chatSmallBtn: any = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
  display: "inline-flex",
  alignItems: "center",
  gap: 6
}

const unreadBadge: any = {
  background: "#ef4444",
  color: "white",
  borderRadius: 20,
  padding: "2px 10px",
  fontSize: 11,
  fontWeight: 700,
  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
}

const acceptSmallBtn: any = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)"
}

const viewOrderSmallBtn: any = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.25)"
}

const acceptedBadge: any = {
  padding: "8px 14px",
  background: "#dcfce7",
  color: "#166534",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700
}

const summaryCard: any = {
  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
  padding: "22px",
  borderRadius: "16px",
  border: "2px solid #e0e7ff",
  boxShadow: "0 8px 24px rgba(99, 102, 241, 0.1)"
}

const summaryHeader: any = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: "1px solid #e2e8f0"
}

const summaryIcon: any = { fontSize: 22 }

const summaryTitle: any = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#0f172a"
}

const summaryRow: any = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #f1f5f9"
}

const summaryLabel: any = {
  fontSize: 13,
  color: "#64748b",
  fontWeight: 600
}

const summaryValue: any = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a"
}

const postNewBtn: any = {
  width: "100%",
  marginTop: 16,
  padding: "12px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.3)"
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

const chatPanelAvatarPlaceholder: React.CSSProperties = {
  fontSize: 20
}

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
  background: `#f8fafc`
}

const chatPanelEmpty: React.CSSProperties = {
  textAlign: "center",
  color: "#94a3b8",
  padding: "40px 0",
  fontSize: 14
}

const chatPanelBubbleWrapper: React.CSSProperties = {
  display: "flex"
}

const chatPanelBubble: React.CSSProperties = {
  maxWidth: "80%",
  padding: "10px 14px",
  borderRadius: 14,
  margin: "2px 0",
  wordBreak: "break-word",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
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
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)"
}

export default RequirementDetail