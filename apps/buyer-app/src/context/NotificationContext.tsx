import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { io, Socket } from "socket.io-client"

interface Notification {
  id: string
  type: "chat" | "rfq" | "requirement" | "order" | "quote"
  title: string
  message: string
  timestamp: Date
  read: boolean
  link?: string
  meta?: any
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  chatCount: number
  rfqCount: number
  requirementCount: number
  orderCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearByType: (type: Notification["type"]) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

let socket: Socket | null = null

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem("buyerNotifications")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const user = JSON.parse(localStorage.getItem("user") || "null")

  // ✅ Persist notifications in localStorage
  useEffect(() => {
    localStorage.setItem("buyerNotifications", JSON.stringify(notifications))
  }, [notifications])

  // ✅ Socket connection
  useEffect(() => {
    if (!user?._id) return

    if (!socket) {
      socket = io("http://localhost:5000", {
        transports: ["websocket"],
      })
    }

    socket.emit("join_buyer", user._id)
    console.log("🔔 Buyer joined notification room:", user._id)

    // ✅ 1. CHAT MESSAGE
    const handleChat = (data: any) => {
      console.log("💬 Notification - chat:", data)
      if (data.senderId === user._id) return // Ignore own messages

      addNotification({
        type: "chat",
        title: "💬 New Message",
        message: `${data.senderName || "Seller"}: ${data.message?.slice(0, 60) || ""}`,
        link: data.roomId ? `/chat/${data.roomId}` : "/chats",
        meta: data,
      })
    }

    // ✅ 2. RFQ QUOTED (seller sent quote)
    const handleRFQQuoted = (data: any) => {
      console.log("📩 Notification - rfq quoted:", data)
      addNotification({
        type: "rfq",
        title: "📩 RFQ Quoted",
        message: `${data.sellerName || "Seller"} sent a quote of ₹${data.totalQuote || 0}`,
        link: "/rfq-dashboard",
        meta: data,
      })
    }

    // ✅ 3. RFQ UPDATED
    const handleRFQUpdated = (data: any) => {
      addNotification({
        type: "rfq",
        title: "📩 RFQ Updated",
        message: `${data.sellerName || "Seller"} updated your RFQ`,
        link: "/rfq-dashboard",
        meta: data,
      })
    }

    // ✅ 4. NEW QUOTE ON REQUIREMENT
    const handleRequirementQuote = (data: any) => {
      console.log("💰 Notification - requirement quote:", data)
      addNotification({
        type: "requirement",
        title: "💰 New Quote Received",
        message: `${data.sellerName || "Seller"} quoted ₹${data.price || 0} for "${data.productName || "your requirement"}"`,
        link: "/my-requirements",
        meta: data,
      })
    }

    // ✅ 5. ORDER STATUS UPDATED
    const handleOrderUpdate = (data: any) => {
      console.log("🛒 Notification - order:", data)
      addNotification({
        type: "order",
        title: "🛒 Order Update",
        message: `Order ${data.orderId} is now "${data.status}"${data.note ? ` - ${data.note}` : ""}`,
        link: `/order-tracking/${data.orderId}`,
        meta: data,
      })
    }

    // ✅ 6. ORDER ACCEPTED / NEW ORDER
    const handleNewOrder = (data: any) => {
      addNotification({
        type: "order",
        title: "🛒 New Order",
        message: `Order for "${data.productName || "Product"}" created`,
        link: data.orderId ? `/order-tracking/${data.orderId}` : "/orders",
        meta: data,
      })
    }

    // ✅ 7. QUOTE ACCEPTED (from requirement flow)
    const handleQuoteAccepted = (data: any) => {
      addNotification({
        type: "quote",
        title: "✅ Quote Accepted",
        message: `Seller ${data.sellerName || ""} accepted your quote`,
        link: "/orders",
        meta: data,
      })
    }

    socket.on("receive_message", handleChat)
    socket.on("rfq-quoted", handleRFQQuoted)
    socket.on("rfq-updated", handleRFQUpdated)
    socket.on("new-quote-on-requirement", handleRequirementQuote)
    socket.on("new-quote", handleRequirementQuote)
    socket.on("order-status-updated", handleOrderUpdate)
    socket.on("new-order", handleNewOrder)
    socket.on("quote-accepted", handleQuoteAccepted)

    return () => {
      socket?.off("receive_message", handleChat)
      socket?.off("rfq-quoted", handleRFQQuoted)
      socket?.off("rfq-updated", handleRFQUpdated)
      socket?.off("new-quote-on-requirement", handleRequirementQuote)
      socket?.off("new-quote", handleRequirementQuote)
      socket?.off("order-status-updated", handleOrderUpdate)
      socket?.off("new-order", handleNewOrder)
      socket?.off("quote-accepted", handleQuoteAccepted)
    }
  }, [user?._id])

  const addNotification = (n: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotif: Notification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
      read: false,
    }
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50)) // keep last 50

    // ✅ Browser notification
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(newNotif.title, { body: newNotif.message, icon: "/vite.svg" })
      }
    } catch {}
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearByType = (type: Notification["type"]) => {
    setNotifications((prev) => prev.filter((n) => n.type !== type))
  }

  const clearAll = () => setNotifications([])

  const unreadCount = notifications.filter((n) => !n.read).length
  const chatCount = notifications.filter((n) => n.type === "chat" && !n.read).length
  const rfqCount = notifications.filter((n) => n.type === "rfq" && !n.read).length
  const requirementCount = notifications.filter((n) => n.type === "requirement" && !n.read).length
  const orderCount = notifications.filter((n) => n.type === "order" && !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        chatCount,
        rfqCount,
        requirementCount,
        orderCount,
        markAsRead,
        markAllAsRead,
        clearByType,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider")
  return ctx
}