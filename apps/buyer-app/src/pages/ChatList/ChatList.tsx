// buyer-app/src/pages/ChatList/ChatList.tsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

const ChatList = () => {
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [, setUnreadTick] = useState(0) // ✅ force re-render on unread change
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    if (user._id) {
      socket.emit("join_buyer", user._id)
      fetchChats()
    }
  }, [user._id])

  // ============================================
  // ✅ AUTO-REFRESH: refetch chats when seller sends a message
  // ============================================
  useEffect(() => {
    if (!user._id) return

    const onChatNotification = () => {
      // Seller sent a message → refresh the chat list
      fetchChats()
      setUnreadTick((t) => t + 1)
    }

    const onUnreadUpdate = () => {
      // Unread changed elsewhere (ChatList click, etc.) → re-render
      setUnreadTick((t) => t + 1)
    }

    socket.on("new-chat-notification", onChatNotification)
    socket.on("receive_message", onChatNotification)
    window.addEventListener("unread-rfq-updated", onUnreadUpdate)

    // ✅ Safety net: poll every 8s (in case a socket event is missed)
    const interval = setInterval(fetchChats, 8000)

    return () => {
      socket.off("new-chat-notification", onChatNotification)
      socket.off("receive_message", onChatNotification)
      window.removeEventListener("unread-rfq-updated", onUnreadUpdate)
      clearInterval(interval)
    }
  }, [user._id])

  const fetchChats = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/inbox/buyer/${user._id}`)
      const data = await res.json()
      setChats(data || [])
    } catch (error) {
      console.error("Error fetching chats:", error)
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ Clear unread badge for the RFQ that matches this chat
  const clearUnreadForChat = (chat: any) => {
    try {
      const rfqsStr = localStorage.getItem("buyer_rfqs_cache") || "[]"
      const rfqs: any[] = JSON.parse(rfqsStr)

      const matched =
        rfqs.find(
          (r: any) =>
            r.sellerId === chat.sellerId &&
            (!chat.productId || r.productId === chat.productId)
        ) || rfqs.find((r: any) => r.sellerId === chat.sellerId)

      if (matched?.rfqId) {
        localStorage.removeItem(`unread_rfq_${matched.rfqId}`)
        window.dispatchEvent(new Event("unread-rfq-updated"))
      }
    } catch (e) {
      console.log("clearUnreadForChat error:", e)
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const msgDate = new Date(date)
    const diff = now.getTime() - msgDate.getTime()
    const mins = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (mins < 1) return "Just now"
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  const openChat = (chat: any) => {
    clearUnreadForChat(chat)

    const roomId = chat.roomId || [user._id, chat.sellerId, chat.productId || "general"].sort().join("_")

    navigate(`/chat/${roomId}`, {
      state: {
        sellerId: chat.sellerId,
        productId: chat.productId || "",
        productName: chat.productName || "",
        productImage: chat.productImage || "",
        buyerName: chat.buyerName || user.name,
        roomId: roomId
      }
    })
  }

  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      chat.sellerName?.toLowerCase().includes(q) ||
      chat.productName?.toLowerCase().includes(q) ||
      chat.lastMessage?.toLowerCase().includes(q)
    )
  })

  const activeCount = chats.filter(c => {
    const diff = new Date().getTime() - new Date(c.updatedAt).getTime()
    return diff < 1000 * 60 * 60 * 24
  }).length

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading chats...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>

      {/* HERO */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.heroLeft}>
            <div style={styles.heroIconWrapper}>
              <span style={styles.heroIcon}>💬</span>
            </div>
            <div>
              <h1 style={styles.heroTitle}>My Chats</h1>
              <p style={styles.heroSubtitle}>
                {chats.length} conversation{chats.length !== 1 ? "s" : ""} • {activeCount} active today
              </p>
            </div>
          </div>
          <button style={styles.browseBtn} onClick={() => navigate("/")}>
            🛍️ Browse Products
          </button>
        </div>
      </div>

      {/* SEARCH */}
      {chats.length > 0 && (
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by seller, product or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>
              ✕
            </button>
          )}
        </div>
      )}

      {chats.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIconWrapper}>
            <span style={styles.emptyIcon}>💬</span>
          </div>
          <h3 style={styles.emptyTitle}>No chats yet</h3>
          <p style={styles.emptyText}>
            Start a conversation with sellers by clicking "Chat with Seller" on any product
          </p>
          <button style={styles.shopBtn} onClick={() => navigate("/")}>
            🛍️ Browse Products
          </button>
        </div>
      ) : filteredChats.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIconWrapper}>
            <span style={styles.emptyIcon}>🔍</span>
          </div>
          <h3 style={styles.emptyTitle}>No chats found</h3>
          <p style={styles.emptyText}>Try a different search term</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredChats.map((chat) => {
            const initials = chat.sellerName
              ? chat.sellerName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
              : "S"

            return (
              <div
                key={chat.roomId}
                style={styles.chatCard}
                onClick={() => openChat(chat)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)"
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.10)"
                  e.currentTarget.style.borderColor = "#2563eb"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)"
                  e.currentTarget.style.borderColor = "#e2e8f0"
                }}
              >
                <div style={styles.chatInfo}>
                  <div style={styles.imageWrapper}>
                    {chat.productImage ? (
                      <img src={chat.productImage} alt={chat.productName} style={styles.productImage} />
                    ) : (
                      <div style={styles.avatarFallback}>{initials}</div>
                    )}
                    <span style={styles.onlineDot}></span>
                  </div>

                  <div style={styles.chatContent}>
                    <div style={styles.chatHeader}>
                      <h3 style={styles.chatName}>{chat.sellerName || "Seller"}</h3>
                      <span style={styles.chatTime}>
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    {chat.productName && (
                      <span style={styles.productBadge}>📦 {chat.productName}</span>
                    )}
                    <p style={styles.chatLastMessage}>
                      {chat.lastMessage || (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                          No messages yet
                        </span>
                      )}
                    </p>
                  </div>

                  <div style={styles.arrowWrapper}>
                    <span style={styles.arrow}>→</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {chats.length > 0 && filteredChats.length > 0 && (
        <p style={styles.resultCount}>
          Showing {filteredChats.length} of {chats.length} chat{chats.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}

const styles: any = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "24px 20px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)"
  },

  loadingWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 20px"
  },

  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "15px"
  },

  heroSection: {
    background: "linear-gradient(135deg, #1e293b 0%, #4c1d95 100%)",
    padding: "28px 32px",
    borderRadius: "24px",
    color: "white",
    marginBottom: "20px",
    boxShadow: "0 20px 60px rgba(30, 41, 59, 0.25)"
  },

  heroContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "20px"
  },

  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },

  heroIconWrapper: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.2)"
  },

  heroIcon: { fontSize: "28px" },

  heroTitle: {
    fontSize: "28px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.5px"
  },

  heroSubtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.75)",
    marginTop: "4px",
    fontWeight: "500"
  },

  browseBtn: {
    padding: "12px 24px",
    background: "white",
    color: "#1e293b",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
  },

  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px 18px",
    marginBottom: "20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)"
  },

  searchIcon: { fontSize: "18px", color: "#64748b" },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#0f172a"
  },

  clearSearchBtn: {
    background: "#e2e8f0",
    border: "none",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px"
  },

  chatCard: {
    background: "white",
    padding: "16px 20px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "all 0.25s ease"
  },

  chatInfo: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  },

  imageWrapper: {
    flex: "0 0 60px",
    height: "60px",
    borderRadius: "14px",
    overflow: "hidden" as const,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const
  },

  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const
  },

  avatarFallback: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "1px"
  },

  onlineDot: {
    position: "absolute" as const,
    bottom: "2px",
    right: "2px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#22c55e",
    border: "2px solid white",
    boxShadow: "0 0 0 2px rgba(34, 197, 94, 0.2)"
  },

  chatContent: {
    flex: 1,
    minWidth: 0
  },

  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px"
  },

  chatName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },

  chatTime: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "600",
    whiteSpace: "nowrap" as const,
    flexShrink: 0
  },

  productBadge: {
    display: "inline-block",
    marginBottom: "4px",
    fontSize: "11px",
    color: "#1e40af",
    background: "#dbeafe",
    padding: "2px 10px",
    borderRadius: "20px",
    fontWeight: "600",
    maxWidth: "220px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },

  chatLastMessage: {
    fontSize: "13px",
    color: "#475569",
    margin: 0,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  arrowWrapper: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  arrow: {
    fontSize: "18px",
    color: "#2563eb",
    fontWeight: "bold"
  },

  empty: {
    textAlign: "center" as const,
    padding: "80px 20px",
    background: "white",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
  },

  emptyIconWrapper: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #eef2ff, #dbeafe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px auto"
  },

  emptyIcon: {
    fontSize: "48px",
    opacity: 0.7
  },

  emptyTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0"
  },

  emptyText: {
    fontSize: "15px",
    color: "#64748b",
    margin: "0 auto 24px auto",
    maxWidth: "400px",
    lineHeight: "1.6"
  },

  shopBtn: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)"
  },

  resultCount: {
    textAlign: "center" as const,
    marginTop: "20px",
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "500"
  }
}

export default ChatList