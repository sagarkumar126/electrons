// seller-app/src/pages/SellerRequirements/SellerRequirements.tsx

import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"

const socket = io("https://electrons-1.onrender.com")

const SellerRequirements = () => {
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const navigate = useNavigate()

  // ✅ CHAT
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null)
  const [roomId, setRoomId] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  // ✅ UNREAD
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})

  // ✅ NEW: Force re-render when opened state changes
  const [, forceUpdate] = useState(0)

  const seller = JSON.parse(localStorage.getItem("user") || "{}")

  // ============================================
  // ✅ Helper — is requirement opened?
  // ============================================
  const isRequirementOpened = (requirementId: string) => {
    return !!localStorage.getItem(`requirement_opened_${requirementId}`)
  }

  // ============================================
  const reloadUnreadCounts = () => {
    const counts: { [key: string]: number } = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("unread_seller_")) {
        const buyerId = key.replace("unread_seller_", "")
        const val = parseInt(localStorage.getItem(key) || "0")
        if (val > 0) counts[buyerId] = val
      }
    }
    setUnreadCounts(counts)
  }

  useEffect(() => { reloadUnreadCounts() }, [])

  useEffect(() => {
    const onUnreadUpdate = () => reloadUnreadCounts()
    window.addEventListener("unread-seller-updated", onUnreadUpdate)

    const onChatNotify = () => reloadUnreadCounts()
    socket.on("new-chat-notification", onChatNotify)

    // ✅ NEW: Listen for requirements-opened event
    const onOpened = () => forceUpdate(t => t + 1)
    window.addEventListener("requirements-updated", onOpened)

    return () => {
      window.removeEventListener("unread-seller-updated", onUnreadUpdate)
      socket.off("new-chat-notification", onChatNotify)
      window.removeEventListener("requirements-updated", onOpened)
    }
  }, [])

  useEffect(() => {
    if (seller?._id) fetchRequirements()
  }, [seller?._id])

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

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const res = await fetch(`https://electrons-1.onrender.com/api/buyer-requirement/seller/${seller._id}`)
      const data = await res.json()
      setRequirements(data.success ? data.data : [])
    } catch (error) {
      console.error("Error fetching requirements:", error)
      setRequirements([])
    } finally {
      setLoading(false)
    }
  }

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`https://electrons-1.onrender.com/api/chat/${roomId}`)
      const data = await res.json()
      setChatMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching chat history:", error)
    }
  }

  const openChatPanel = (buyerId: string, req: any) => {
    const productId = req.productId || req.requirementId || "general"
    const newRoomId = [buyerId, seller._id, productId].sort().join("_")
    localStorage.removeItem(`unread_seller_${buyerId}`)
    window.dispatchEvent(new Event("unread-seller-updated"))
    reloadUnreadCounts()
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
      roomId, senderId: seller._id, senderRole: "seller",
      senderName: seller.companyName || seller.name || "Seller",
      receiverId: selectedBuyer.buyerId, receiverName: "Buyer",
      message: newMessage, productId,
      productName: selectedBuyer.productName || "",
      productImage: selectedBuyer.productImage || "",
      createdAt: new Date()
    }
    socket.emit("send_message", messageData)
    setChatMessages((prev) => [...prev, messageData])
    setNewMessage("")
    setIsSending(false)
  }

  // ✅ NEW: Open detail page + mark as opened
  const openRequirementDetail = (requirementId: string) => {
    // Mark as opened before navigating
    localStorage.setItem(`requirement_opened_${requirementId}`, "true")
    window.dispatchEvent(new Event("requirements-updated"))
    navigate(`/buyer-requirement/${requirementId}`)
  }

  const formatDateTime = (date: string) => {
    const d = new Date(date)
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    }
  }

  const timeAgo = (date: string) => {
    const now = new Date(); const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "#f59e0b"
      case "Verified": return "#3b82f6"
      case "Quoted": return "#8b5cf6"
      case "Closed": return "#22c55e"
      case "Accepted": return "#22c55e"
      default: return "#6b7280"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending": return "⏳ Pending"
      case "Verified": return "✅ Verified"
      case "Quoted": return "💰 Quoted"
      case "Closed": return "🔒 Closed"
      case "Accepted": return "✅ Accepted"
      default: return status
    }
  }

  const filteredRequirements = filter === "all"
    ? requirements
    : requirements.filter(r => {
      if (filter === "closed") return r.status === "Closed" || r.status === "Accepted"
      return r.status.toLowerCase() === filter
    })

  if (loading) return <div style={styles.loading}>Loading buyer requirements...</div>

  return (
    <div style={styles.container}>
      <div style={showChat ? styles.mainContentWithChat : styles.mainContentFull}>
        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={styles.title}>📩 Buyer Requirements</h2>
          <div style={styles.stats}>
            <span style={styles.statBadge}>Total: {requirements.length}</span>
            <span style={{ ...styles.statBadge, background: "#fef3c7", color: "#92400e" }}>
              Pending: {requirements.filter(r => r.status === "Pending").length}
            </span>
            <span style={{ ...styles.statBadge, background: "#dbeafe", color: "#1e40af" }}>
              Quoted: {requirements.filter(r => r.status === "Quoted").length}
            </span>
            <span style={{ ...styles.statBadge, background: "#dcfce7", color: "#166534" }}>
              Closed: {requirements.filter(r => r.status === "Closed" || r.status === "Accepted").length}
            </span>
          </div>
        </div>

        {/* FILTERS */}
        <div style={styles.filterContainer}>
          {["all", "pending", "quoted", "closed"].map((status) => (
            <button key={status} style={filter === status ? styles.filterActive : styles.filterBtn} onClick={() => setFilter(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              ({requirements.filter(r => {
                if (status === "all") return true
                if (status === "closed") return r.status === "Closed" || r.status === "Accepted"
                return r.status.toLowerCase() === status
              }).length})
            </button>
          ))}
        </div>

        {/* LIST */}
        {filteredRequirements.length === 0 ? (
          <div style={styles.empty}>
            <p>No buyer requirements found.</p>
            <p style={styles.emptySubtext}>Check back later for new requirements from buyers.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {filteredRequirements.map((req) => {
              const { date, time } = formatDateTime(req.createdAt)
              const unread = unreadCounts[req.buyerId] || 0
              const hasQuoted = req.quotes?.some((q: any) => q.sellerId === seller._id)
              const isOpened = isRequirementOpened(req.requirementId)

              return (
                <div
                  key={req.requirementId}
                  style={{
                    ...styles.card,
                    borderLeft: !isOpened ? "5px solid #ef4444" : "1px solid #e2e8f0"
                  }}
                >
                  <div
                    style={styles.cardRow}
                    onClick={() => openRequirementDetail(req.requirementId)}
                  >
                    <div style={styles.cardLeft}>
                      {/* ✅ BADGES ROW */}
                      <div style={styles.badgesRow}>
                        {!isOpened && (
                          <span style={styles.newBadge}>🔴 NEW</span>
                        )}
                        {unread > 0 && (
                          <span style={styles.unreadBadgeTop}>
                            💬 {unread} unread message{unread > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <div style={styles.productName}>{req.productName}</div>
                      <div style={styles.metaRow}>
                        <span style={styles.metaItem}>👤 {req.buyerName || "Unknown"}</span>
                        <span style={styles.metaDot}>•</span>
                        <span style={styles.metaItem}>📞 {req.buyerPhone || "N/A"}</span>
                        <span style={styles.metaDot}>•</span>
                        <span style={styles.metaItem}>📦 {req.quantity} {req.unit}</span>
                      </div>
                      <div style={styles.metaRowSmall}>
                        📅 {date} ⏰ {time} <span style={styles.agoText}>({timeAgo(req.createdAt)})</span>
                        {req.quotes?.length > 0 && (
                          <span style={styles.quoteCount}>💰 {req.quotes.length} quote{req.quotes.length > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>

                    <div style={styles.cardRight}>
                      <span style={{ ...styles.statusBadge, background: getStatusColor(req.status) }}>
                        {getStatusLabel(req.status)}
                      </span>
                      <span style={styles.viewArrow}>›</span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div style={styles.actionsRow}>
                    <button
                      style={styles.chatBtn}
                      onClick={(e) => { e.stopPropagation(); openChatPanel(req.buyerId, req) }}
                    >
                      💬 Chat with Buyer
                      {unread > 0 && (
                        <span style={styles.unreadText}>
                          ({unread} unread message{unread > 1 ? "s" : ""})
                        </span>
                      )}
                    </button>

                    <button
                      style={styles.detailBtn}
                      onClick={(e) => { e.stopPropagation(); openRequirementDetail(req.requirementId) }}
                    >
                      {hasQuoted ? "👁️ View Quote" : "📄 View Details"}
                    </button>
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
                    <div key={idx} style={{ ...chatPanelBubbleWrapper, justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                      <div style={{
                        ...chatPanelBubble,
                        background: isOwn ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#ffffff",
                        color: isOwn ? "white" : "#0f172a",
                        border: isOwn ? "none" : "1px solid #e2e8f0",
                        borderBottomRightRadius: isOwn ? 4 : 14,
                        borderBottomLeftRadius: isOwn ? 14 : 4
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
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..." style={chatPanelInput} />
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
const styles: any = {
  container: { maxWidth: "100%", margin: "0", padding: "20px", minHeight: "100vh", background: "#f1f5f9", display: "flex", gap: "20px", position: "relative" as const },
  mainContentFull: { flex: 1, transition: "all 0.3s ease" },
  mainContentWithChat: { flex: 1, marginRight: "520px", transition: "all 0.3s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" as const, gap: "10px" },
  title: { fontSize: "24px", fontWeight: "bold", color: "#0f172a", margin: 0 },
  stats: { display: "flex", gap: "8px", flexWrap: "wrap" as const },
  statBadge: { padding: "4px 12px", background: "#e2e8f0", borderRadius: "20px", fontSize: "13px", fontWeight: "500", color: "#1e293b" },
  filterContainer: { display: "flex", gap: "8px", flexWrap: "wrap" as const, marginBottom: "20px" },
  filterBtn: { padding: "6px 14px", background: "white", border: "1px solid #d1d5db", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "500" },
  filterActive: { padding: "6px 14px", background: "#2563eb", color: "white", border: "1px solid #2563eb", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "500" },
  list: { display: "flex", flexDirection: "column" as const, gap: "12px" },
  card: { background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.2s" },

  // ✅ NEW: badges row
  badgesRow: { display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" as const },
  newBadge: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "white",
    padding: "3px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.5px",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
  },
  unreadBadgeTop: {
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "white",
    padding: "3px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.4)"
  },

  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: "12px" },
  cardLeft: { flex: 1, minWidth: 0 },
  cardRight: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  productName: { fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" },
  metaRow: { display: "flex", gap: "10px", flexWrap: "wrap" as const, alignItems: "center", marginBottom: "4px" },
  metaItem: { fontSize: "13px", color: "#475569" },
  metaDot: { color: "#cbd5e1" },
  metaRowSmall: { fontSize: "12px", color: "#94a3b8", display: "flex", gap: "10px", flexWrap: "wrap" as const, alignItems: "center" },
  agoText: { color: "#94a3b8" },
  quoteCount: { background: "#f0f9ff", color: "#0369a1", padding: "2px 8px", borderRadius: "10px", fontWeight: "500" },
  statusBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: "white" },
  viewArrow: { fontSize: "22px", color: "#cbd5e1", fontWeight: "bold" },
  actionsRow: { display: "flex", gap: "8px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" as const, alignItems: "center" },
  chatBtn: { padding: "7px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" },
  unreadText: { background: "#ef4444", color: "white", borderRadius: "20px", padding: "1px 8px", fontSize: "11px", fontWeight: "bold" as const, marginLeft: "4px" },
  detailBtn: { padding: "7px 14px", background: "#f59e0b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: "13px" },

  empty: { textAlign: "center" as const, padding: "60px", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" },
  emptySubtext: { color: "#94a3b8", fontSize: "14px" },
  loading: { textAlign: "center" as const, padding: "60px", fontSize: "18px", color: "#64748b" }
}

const chatPanelContainer: React.CSSProperties = { position: "fixed", top: 0, right: 0, width: "500px", height: "100vh", background: "white", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", zIndex: 1000, display: "flex", flexDirection: "column" }
const chatPanel: React.CSSProperties = { display: "flex", flexDirection: "column", height: "100%" }
const chatPanelHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(135deg, #1e293b, #4c1d95)", color: "white" }
const chatPanelHeaderInfo: React.CSSProperties = { display: "flex", alignItems: "center", gap: "12px" }
const chatPanelAvatar: React.CSSProperties = { width: 42, height: 42, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.25)" }
const chatPanelAvatarImg: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" }
const chatPanelAvatarPlaceholder: React.CSSProperties = { fontSize: 20 }
const chatPanelName: React.CSSProperties = { margin: 0, fontSize: 15, fontWeight: 700, color: "white" }
const chatPanelProduct: React.CSSProperties = { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" }
const chatPanelCloseBtn: React.CSSProperties = { background: "rgba(255,255,255,0.15)", border: "none", fontSize: 18, cursor: "pointer", color: "white", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }
const chatPanelMessages: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", background: "#f8fafc" }
const chatPanelEmpty: React.CSSProperties = { textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: "14px" }
const chatPanelBubbleWrapper: React.CSSProperties = { display: "flex" }
const chatPanelBubble: React.CSSProperties = { maxWidth: "80%", padding: "10px 14px", borderRadius: 14, margin: "2px 0", wordBreak: "break-word" }
const chatPanelInputArea: React.CSSProperties = { display: "flex", gap: "10px", padding: "12px 16px", borderTop: "1px solid #e2e8f0", background: "white", alignItems: "center" }
const chatPanelInput: React.CSSProperties = { flex: 1, padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 24, outline: "none", fontSize: 14, background: "#f8fafc" }
const chatPanelSendBtn: React.CSSProperties = { width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", border: "none", borderRadius: "50%", cursor: "pointer", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }

export default SellerRequirements