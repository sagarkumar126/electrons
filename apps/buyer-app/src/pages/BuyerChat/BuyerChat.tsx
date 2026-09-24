// buyer-app/src/pages/BuyerChat/BuyerChat.tsx

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

const BuyerChat = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState<Record<string, unknown>[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const unreadDividerRef = useRef<null | HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)

  // ✅ Unread tracking
  const [unreadFromIndex, setUnreadFromIndex] = useState<number>(-1)

  // ✅ Order state (preserved)
  const [showOrderButton, setShowOrderButton] = useState(false)
  const [latestOrderId, setLatestOrderId] = useState("")

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const sellerId = location.state?.sellerId || ""
  const productName = location.state?.productName || "Product"
  const productId = location.state?.productId || ""
  const productImage = location.state?.productImage || ""
  const currentRoomId = roomId || location.state?.roomId || ""

  // ============================================
  // ✅ Clear unread badges on chat open
  //     - unread_rfq_<rfqId> (RFQ dashboard)
  //     - unread_requirement_<sellerId> (My Requirements + Navbar)
  // ============================================
  useEffect(() => {
    try {
      // 1. Clear seller-based unread (used by Navbar + MyRequirements + RequirementDetail)
      if (sellerId) {
        localStorage.removeItem(`unread_requirement_${sellerId}`)
        window.dispatchEvent(new Event("unread-requirement-updated"))
      }

      // 2. Clear rfq-based unread (used by RFQDashboard + RFQDetail)
      const rfqsStr = localStorage.getItem("buyer_rfqs_cache") || "[]"
      const rfqs: Record<string, unknown>[] = JSON.parse(rfqsStr)

      const matched =
        rfqs.find(
          (r) =>
            r.sellerId === sellerId &&
            (!productId || r.productId === productId)
        ) || rfqs.find((r) => r.sellerId === sellerId)

      if (matched?.rfqId) {
        localStorage.removeItem(`unread_rfq_${matched.rfqId}`)
        window.dispatchEvent(new Event("unread-rfq-updated"))
      }
    } catch (e) {
      console.log("clearUnread on chat open error:", e)
    }
  }, [sellerId, productId])

  // ============================================
  // ✅ Load chat + socket listeners
  // ============================================
  useEffect(() => {
    if (!currentRoomId) {
      navigate("/chats")
      return
    }

    console.log("🔵 Buyer Chat Room ID:", currentRoomId)

    socket.emit("join_room", currentRoomId)
    console.log("✅ Buyer joined room:", currentRoomId)

    fetchChatHistory()

    socket.on("receive_message", (msg: Record<string, unknown>) => {
      console.log("🔵 Buyer received:", msg)
      if (msg.roomId === currentRoomId) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) =>
              m.senderId === msg.senderId &&
              m.message === msg.message &&
              new Date(m.createdAt as string).getTime() ===
                new Date(msg.createdAt as string).getTime()
          )
          if (exists) return prev
          return [...prev, msg]
        })

        // ✅ CHECK IF ORDER CREATED MESSAGE
        const msgText = msg.message as string
        if (msgText && msgText.includes("Order #")) {
          setShowOrderButton(true)
          const match = msgText.match(/Order #([^\s]+)/)
          if (match) {
            setLatestOrderId(match[1])
          }
        }
      }
    })

    return () => {
      socket.off("receive_message")
    }
  }, [currentRoomId])

  // ============================================
  // ✅ Auto-scroll logic
  // ============================================
  useEffect(() => {
    if (loading) return
    if (hasScrolledRef.current) return

    if (unreadFromIndex !== -1 && unreadDividerRef.current) {
      unreadDividerRef.current.scrollIntoView({
        behavior: "instant" as ScrollBehavior,
        block: "start"
      })
    } else {
      messagesEndRef.current?.scrollIntoView({
        behavior: "instant" as ScrollBehavior
      })
    }

    hasScrolledRef.current = true
  }, [loading, unreadFromIndex])

  useEffect(() => {
    if (loading) return
    if (!hasScrolledRef.current) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // ============================================
  // ✅ Mark unread as read after 2s
  // ============================================
  useEffect(() => {
    if (unreadFromIndex === -1) return
    if (messages.length === 0) return

    const timer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m, i) =>
          i >= unreadFromIndex &&
          m.senderRole !== "buyer" &&
          m.senderId !== user._id
            ? { ...m, read: true }
            : m
        )
      )
      setUnreadFromIndex(-1)

      if (currentRoomId) {
        fetch(`http://localhost:5000/api/chat/read/${currentRoomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readerId: user._id })
        }).catch(() => {})
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [unreadFromIndex, messages.length, currentRoomId, user._id])

  // ============================================
  // ✅ Fetch history + compute first unread
  // ============================================
  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/${currentRoomId}`)
      const data = await res.json()
      console.log("🔵 Chat history:", data)

      const msgs: Record<string, unknown>[] = data.messages || []
      setMessages(msgs)

      const firstUnreadIdx = msgs.findIndex(
        (m) =>
          m.senderRole !== "buyer" &&
          m.senderId !== user._id &&
          m.read === false
      )
      setUnreadFromIndex(firstUnreadIdx !== -1 ? firstUnreadIdx : -1)

      const orderMsg = msgs.find(
        (msg) =>
          typeof msg.message === "string" && msg.message.includes("Order #")
      )
      if (orderMsg) {
        setShowOrderButton(true)
        const match = (orderMsg.message as string).match(/Order #([^\s]+)/)
        if (match) {
          setLatestOrderId(match[1])
        }
      }
    } catch (error) {
      console.error("Error fetching chat:", error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // ✅ Send
  // ============================================
  const sendMessage = () => {
    if (!newMessage.trim() || !currentRoomId) return

    const finalProductId = productId || location.state?.productId || "general"

    const messageData: Record<string, unknown> = {
      roomId: currentRoomId,
      senderId: user._id,
      senderRole: "buyer",
      senderName: user.name || "Buyer",
      receiverId: sellerId,
      receiverName: "Seller",
      message: newMessage,
      productId: finalProductId,
      productName: productName || "",
      productImage: productImage || "",
      createdAt: new Date()
    }

    console.log("🔵 BUYER SENDING:", messageData)
    socket.emit("send_message", messageData)
    setMessages((prev) => [...prev, { ...messageData, read: true }])
    setNewMessage("")
  }

  const goToOrders = () => {
    navigate("/orders")
  }

  const goToOrderTracking = () => {
    if (latestOrderId) {
      navigate(`/order-tracking/${latestOrderId}`)
    } else {
      navigate("/orders")
    }
  }

  // ============================================
  // ✅ Helpers
  // ============================================
  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return "Today"
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
    return d.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  const shouldShowDateSeparator = (idx: number) => {
    if (idx === 0) return true
    const prev = new Date(messages[idx - 1].createdAt as string).toDateString()
    const curr = new Date(messages[idx].createdAt as string).toDateString()
    return prev !== curr
  }

  if (loading) {
    return (
      <div style={loadingContainer}>
        <div style={spinner}></div>
        <p style={{ color: "#64748b", marginTop: 16 }}>Loading chat...</p>
      </div>
    )
  }

  return (
    <div style={pageWrapper}>
      <div style={container}>

        {/* ============ HEADER ============ */}
        <div style={header}>
          <button onClick={() => navigate("/chats")} style={backBtn}>←</button>

          <div style={headerInfo}>
            <div style={headerAvatar}>
              {productImage ? (
                <img src={productImage} alt={productName} style={headerAvatarImg} />
              ) : (
                <span style={headerAvatarPlaceholder}>🏢</span>
              )}
              <span style={onlineDot}></span>
            </div>
            <div style={headerText}>
              <h3 style={headerTitle}>Seller</h3>
              <p style={headerSubtitle}>{productName}</p>
            </div>
          </div>

          {showOrderButton && (
            <span style={orderBadge}>✅ Order Created</span>
          )}
        </div>

        {/* ✅ Order Banner */}
        {showOrderButton && (
          <div style={orderBanner}>
            <div style={orderBannerContent}>
              <span style={orderBannerIcon}>📦</span>
              <div>
                <p style={orderBannerTitle}>Order Created Successfully!</p>
                {latestOrderId && (
                  <p style={orderBannerId}>ID: #{latestOrderId}</p>
                )}
              </div>
            </div>
            <div style={orderBannerButtons}>
              <button onClick={goToOrderTracking} style={trackBtn}>
                📍 Track
              </button>
              <button onClick={goToOrders} style={ordersBtn}>
                📋 Orders
              </button>
            </div>
          </div>
        )}

        {/* ============ MESSAGES ============ */}
        <div style={messagesArea}>
          {messages.length === 0 ? (
            <div style={emptyChat}>
              <div style={emptyChatIcon}>💬</div>
              <h3 style={emptyChatTitle}>No messages yet</h3>
              <p style={emptyChatText}>Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const msgText = msg.message as string
              const isOrderMsg = msgText && msgText.includes("Order #")

              const isOwn =
                msg.senderRole === "buyer" ||
                (msg.senderRole !== "seller" && msg.senderId === user._id)

              const isUnread =
                !isOwn && unreadFromIndex !== -1 && idx >= unreadFromIndex

              return (
                <div key={idx}>
                  {shouldShowDateSeparator(idx) && (
                    <div style={dateSeparator}>
                      <span style={dateSeparatorText}>
                        {formatDate(msg.createdAt as string)}
                      </span>
                    </div>
                  )}

                  {idx === unreadFromIndex && (
                    <div ref={unreadDividerRef} style={unreadDivider}>
                      <span style={unreadDividerText}>⬇ New messages</span>
                    </div>
                  )}

                  <div
                    style={{
                      ...messageRow,
                      justifyContent: isOwn ? "flex-end" : "flex-start"
                    }}
                  >
                    {!isOwn && (
                      <div style={msgAvatar}>
                        {productImage ? (
                          <img src={productImage} alt="" style={msgAvatarImg} />
                        ) : (
                          <span style={{ fontSize: 14 }}>🏢</span>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        ...bubble,
                        background: isOrderMsg
                          ? "#dcfce7"
                          : isOwn
                            ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                            : isUnread
                              ? "#fffbeb"
                              : "#ffffff",
                        color: isOrderMsg
                          ? "#166534"
                          : isOwn
                            ? "white"
                            : "#0f172a",
                        border: isOrderMsg
                          ? "1px solid #86efac"
                          : isUnread
                            ? "1.5px solid #fbbf24"
                            : "1px solid #e2e8f0",
                        borderBottomRightRadius: isOwn ? 4 : 16,
                        borderBottomLeftRadius: isOwn ? 16 : 4,
                        boxShadow: isUnread
                          ? "0 4px 12px rgba(251, 191, 36, 0.15)"
                          : "0 2px 6px rgba(0,0,0,0.04)"
                      }}
                    >
                      {!isOwn && (
                        <div
                          style={{
                            ...bubbleName,
                            color: isOrderMsg
                              ? "#166534"
                              : isUnread
                                ? "#92400e"
                                : "#7c3aed"
                          }}
                        >
                          {(msg.senderName as string) || "Seller"}
                          {isUnread && <span style={newDot}></span>}
                        </div>
                      )}

                      <p style={bubbleText}>{msgText}</p>

                      <div
                        style={{
                          ...bubbleMeta,
                          color: isOwn ? "rgba(255,255,255,0.75)" : "#94a3b8"
                        }}
                      >
                        <span>{formatTime(msg.createdAt as string)}</span>
                        {isOwn && (
                          <span style={tickIcon}>{msg.read ? "✓✓" : "✓"}</span>
                        )}
                      </div>

                      {isOrderMsg && (
                        <div style={orderMsgActions}>
                          <button onClick={goToOrderTracking} style={orderMsgTrackBtn}>
                            📍 Track
                          </button>
                          <button onClick={goToOrders} style={orderMsgViewBtn}>
                            📋 Orders
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ============ INPUT ============ */}
        <div style={inputArea}>
          <div style={inputWrapper}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Type a message..."
              style={input}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            style={{
              ...sendBtn,
              opacity: !newMessage.trim() ? 0.5 : 1,
              cursor: !newMessage.trim() ? "not-allowed" : "pointer"
            }}
          >
            <span style={{ fontSize: 18 }}>➤</span>
          </button>
        </div>

      </div>
    </div>
  )
}

// ============================================
// ✅ STYLES — Chat box stays fully on screen
// ============================================
const pageWrapper: React.CSSProperties = {
  height: "calc(100vh - 140px)",
  maxHeight: "calc(100vh - 140px)",
  background: "#e5ddd5",
  padding: "12px 16px",
  display: "flex",
  justifyContent: "center",
  alignItems: "stretch",
  overflow: "hidden",
  boxSizing: "border-box"
}

const container: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  maxHeight: "100%",
  width: "100%",
  maxWidth: "900px",
  background: "#f0f2f5",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
}

const loadingContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "calc(100vh - 140px)"
}

const spinner: React.CSSProperties = {
  width: 40,
  height: 40,
  border: "4px solid #e2e8f0",
  borderTop: "4px solid #7c3aed",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
}

// ============ HEADER ============
const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 20px",
  background: "linear-gradient(135deg, #1e293b, #4c1d95)",
  color: "white",
  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
  zIndex: 10,
  flexShrink: 0
}

const backBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  border: "none",
  color: "white",
  fontSize: 18,
  width: 36,
  height: 36,
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
}

const headerInfo: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flex: 1,
  minWidth: 0
}

const headerAvatar: React.CSSProperties = {
  position: "relative",
  width: 44,
  height: 44,
  borderRadius: "50%",
  overflow: "hidden",
  background: "rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: "2px solid rgba(255,255,255,0.25)"
}

const headerAvatarImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover"
}

const headerAvatarPlaceholder: React.CSSProperties = { fontSize: 20 }

const onlineDot: React.CSSProperties = {
  position: "absolute",
  bottom: 2,
  right: 2,
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#22c55e",
  border: "2px solid #1e293b"
}

const headerText: React.CSSProperties = {
  flex: 1,
  minWidth: 0
}

const headerTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "white",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

const headerSubtitle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "rgba(255,255,255,0.75)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

// ============ ORDER BADGE + BANNER ============
const orderBadge: React.CSSProperties = {
  padding: "4px 12px",
  background: "#dcfce7",
  color: "#166534",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "600",
  border: "1px solid #86efac",
  whiteSpace: "nowrap"
}

const orderBanner: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 16px",
  background: "#dcfce7",
  borderBottom: "1px solid #86efac",
  flexWrap: "wrap",
  gap: "8px",
  flexShrink: 0
}

const orderBannerContent: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
}

const orderBannerIcon: React.CSSProperties = { fontSize: "20px" }

const orderBannerTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "bold",
  color: "#166534"
}

const orderBannerId: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#15803d"
}

const orderBannerButtons: React.CSSProperties = {
  display: "flex",
  gap: "6px"
}

const trackBtn: React.CSSProperties = {
  padding: "5px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "500"
}

const ordersBtn: React.CSSProperties = {
  padding: "5px 12px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "500"
}

// ============ MESSAGES AREA ============
const messagesArea: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "20px 20px 10px 20px",
  background: `
    radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.03) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.03) 0%, transparent 40%),
    #f8fafc
  `,
  display: "flex",
  flexDirection: "column",
  gap: 4
}

const emptyChat: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#94a3b8",
  padding: 40,
  textAlign: "center"
}

const emptyChatIcon: React.CSSProperties = {
  fontSize: 56,
  marginBottom: 16,
  opacity: 0.5
}

const emptyChatTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#64748b",
  margin: "0 0 6px 0"
}

const emptyChatText: React.CSSProperties = {
  fontSize: 14,
  color: "#94a3b8",
  margin: 0
}

const dateSeparator: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  margin: "16px 0 8px 0"
}

const dateSeparatorText: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.08)",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  padding: "4px 12px",
  borderRadius: 20,
  textTransform: "uppercase",
  letterSpacing: 0.5
}

const unreadDivider: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  margin: "16px 0"
}

const unreadDividerText: React.CSSProperties = {
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "white",
  fontSize: 11,
  fontWeight: 700,
  padding: "5px 14px",
  borderRadius: 20,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)"
}

const messageRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
  marginBottom: 8
}

const msgAvatar: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  overflow: "hidden",
  background: "#e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginBottom: 4
}

const msgAvatarImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover"
}

const bubble: React.CSSProperties = {
  maxWidth: "75%",
  padding: "10px 14px",
  borderRadius: 16,
  position: "relative",
  transition: "all 0.2s"
}

const bubbleName: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  marginBottom: 4,
  display: "flex",
  alignItems: "center",
  gap: 6,
  letterSpacing: 0.3
}

const newDot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#f59e0b",
  display: "inline-block",
  animation: "pulse 1.5s ease-in-out infinite"
}

const bubbleText: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.45,
  wordBreak: "break-word",
  whiteSpace: "pre-wrap"
}

const bubbleMeta: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 4,
  fontSize: 10,
  marginTop: 4,
  fontWeight: 500
}

const tickIcon: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: -2
}

// ============ ORDER MESSAGE ACTIONS ============
const orderMsgActions: React.CSSProperties = {
  display: "flex",
  gap: "6px",
  marginTop: "8px",
  paddingTop: "8px",
  borderTop: "1px solid #bbf7d0"
}

const orderMsgTrackBtn: React.CSSProperties = {
  padding: "4px 10px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "500"
}

const orderMsgViewBtn: React.CSSProperties = {
  padding: "4px 10px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "500"
}

// ============ INPUT ============
const inputArea: React.CSSProperties = {
  display: "flex",
  gap: 10,
  padding: "12px 16px",
  background: "#f0f2f5",
  borderTop: "1px solid #e2e8f0",
  alignItems: "center",
  flexShrink: 0
}

const inputWrapper: React.CSSProperties = {
  flex: 1,
  background: "white",
  borderRadius: 24,
  padding: "0 4px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  border: "none",
  outline: "none",
  borderRadius: 24,
  fontSize: 14,
  background: "transparent",
  color: "#0f172a"
}

const sendBtn: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
  color: "white",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
  transition: "all 0.2s",
  flexShrink: 0
}

export default BuyerChat