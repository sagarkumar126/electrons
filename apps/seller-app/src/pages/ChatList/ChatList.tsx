import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const ChatList = () => {
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    if (user._id) {
      fetchChats()
    }
  }, [user._id])

  const fetchChats = async () => {
    try {
      const res = await fetch(`https://electrons-1.onrender.com/api/chat/inbox/${user._id}`)
      const data = await res.json()
      setChats(data || [])
    } catch (error) {
      console.error("Error fetching chats:", error)
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const msgDate = new Date(date)
    const diff = now.getTime() - msgDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${Math.floor(diff / (1000 * 60))}m ago`
  }

  const openChat = (chat: any) => {
    const roomId = chat.roomId || [chat.buyerId, user._id, chat.productId || "general"].sort().join("_")
    
    navigate(`/chat/${roomId}`, {
      state: {
        buyerId: chat.buyerId,
        productId: chat.productId || "",
        productName: chat.productName || "",
        productImage: chat.productImage || "",
        buyerName: chat.buyerName || "Buyer",
        roomId: roomId
      }
    })
  }

  if (loading) {
    return <div style={styles.loading}>Loading chats...</div>
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💬 My Chats</h2>

      {chats.length === 0 ? (
        <div style={styles.empty}>
          <p>No chats yet</p>
          <button style={styles.shopBtn} onClick={() => navigate("/")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {chats.map((chat) => (
            <div
              key={chat.roomId}
              style={styles.chatCard}
              onClick={() => openChat(chat)}
            >
              <div style={styles.chatInfo}>
                <div style={styles.imageWrapper}>
                  {chat.productImage ? (
                    <img src={chat.productImage} alt={chat.productName} style={styles.productImage} />
                  ) : (
                    <div style={styles.noImage}>📦</div>
                  )}
                </div>

                <div style={styles.chatContent}>
                  <div style={styles.chatHeader}>
                    <h3 style={styles.chatName}>{chat.buyerName || "Buyer"}</h3>
                    <span style={styles.chatTime}>
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <p style={styles.chatProduct}>{chat.productName}</p>
                  <p style={styles.chatLastMessage}>
                    {chat.lastMessage || "No messages yet"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: any = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    minHeight: "100vh",
    background: "#f1f5f9"
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: "20px"
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px"
  },
  chatCard: {
    background: "white",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  chatInfo: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  },
  imageWrapper: {
    flex: "0 0 60px",
    height: "60px",
    borderRadius: "10px",
    overflow: "hidden" as const,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const
  },
  noImage: {
    fontSize: "24px",
    color: "#94a3b8"
  },
  chatContent: {
    flex: 1,
    minWidth: 0
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2px"
  },
  chatName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0
  },
  chatTime: {
    fontSize: "12px",
    color: "#94a3b8"
  },
  chatProduct: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 2px 0"
  },
  chatLastMessage: {
    fontSize: "14px",
    color: "#475569",
    margin: 0,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  loading: {
    textAlign: "center" as const,
    padding: "60px",
    fontSize: "18px",
    color: "#64748b"
  },
  empty: {
    textAlign: "center" as const,
    padding: "60px",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0"
  },
  shopBtn: {
    marginTop: "12px",
    padding: "10px 24px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  }
}

export default ChatList