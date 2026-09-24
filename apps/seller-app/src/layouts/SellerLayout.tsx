// seller-app/src/layouts/SellerLayout.tsx

import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import logo from "../assets/logo.png"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

const SellerLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const userRef = useRef<any>(null)
  if (!userRef.current) {
    try {
      userRef.current = JSON.parse(localStorage.getItem("user") || "{}")
    } catch {
      userRef.current = {}
    }
  }
  const user = userRef.current

  const [rfqCount, setRfqCount] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [requirementCount, setRequirementCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [totalUnreadChats, setTotalUnreadChats] = useState(0)

  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null)

  const computeTotalUnread = () => {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("unread_seller_")) {
        const val = parseInt(localStorage.getItem(key) || "0")
        if (!isNaN(val)) total += val
      }
    }
    return total
  }

  const computeUnopenedRFQs = () => {
    try {
      const cacheRaw = localStorage.getItem("seller_rfqs_cache")
      if (!cacheRaw) return 0
      const cache = JSON.parse(cacheRaw)
      if (!Array.isArray(cache) || cache.length === 0) return 0
      let count = 0
      for (const rfq of cache) {
        if (rfq?.rfqId && !localStorage.getItem(`rfq_opened_${rfq.rfqId}`)) count++
      }
      return count
    } catch { return 0 }
  }

  const computeUnopenedRequirements = () => {
    try {
      const cacheRaw = localStorage.getItem("seller_requirements_cache")
      if (!cacheRaw) return 0
      const cache = JSON.parse(cacheRaw)
      if (!Array.isArray(cache) || cache.length === 0) return 0
      let count = 0
      for (const req of cache) {
        if (req?.requirementId && !localStorage.getItem(`requirement_opened_${req.requirementId}`)) {
          count++
        }
      }
      return count
    } catch { return 0 }
  }

  const markAllRFQsOpened = () => {
    try {
      const cacheRaw = localStorage.getItem("seller_rfqs_cache")
      if (!cacheRaw) return
      const cache = JSON.parse(cacheRaw)
      if (!Array.isArray(cache)) return
      for (const rfq of cache) {
        if (rfq?.rfqId) localStorage.setItem(`rfq_opened_${rfq.rfqId}`, "1")
      }
    } catch {}
    setRfqCount(0)
  }

  const markAllRequirementsOpened = () => {
    try {
      const cacheRaw = localStorage.getItem("seller_requirements_cache")
      if (!cacheRaw) return
      const cache = JSON.parse(cacheRaw)
      if (!Array.isArray(cache)) return
      for (const req of cache) {
        if (req?.requirementId) localStorage.setItem(`requirement_opened_${req.requirementId}`, "1")
      }
    } catch {}
    setRequirementCount(0)
  }

  const resetAllUnreadChats = () => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("unread_seller_")) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setTotalUnreadChats(0)
    setChatCount(0)
    try { localStorage.removeItem(`seller_chat_count_${user._id}`) } catch {}
    window.dispatchEvent(new Event("unread-seller-updated"))
  }

  const resetOrderCount = () => {
    setOrderCount(0)
    try { localStorage.removeItem(`seller_order_count_${user._id}`) } catch {}
  }

  useEffect(() => {
    if (!user._id) return

    const primeCaches = async () => {
      try {
        const rfqRes = await fetch(`http://localhost:5000/api/rfq/seller/${user._id}`)
        const rfqData = await rfqRes.json()
        if (rfqData.success && Array.isArray(rfqData.data)) {
          localStorage.setItem("seller_rfqs_cache", JSON.stringify(
            rfqData.data.map((r: any) => ({ rfqId: r.rfqId, buyerId: r.buyerId }))
          ))
          setRfqCount(computeUnopenedRFQs())
        }

        const reqRes = await fetch(`http://localhost:5000/api/buyer-requirement/seller/${user._id}`)
        const reqData = await reqRes.json()
        if (reqData.success && Array.isArray(reqData.data)) {
          localStorage.setItem("seller_requirements_cache", JSON.stringify(
            reqData.data.map((r: any) => ({ requirementId: r.requirementId, buyerId: r.buyerId }))
          ))
          setRequirementCount(computeUnopenedRequirements())
        }
      } catch (err) {
        console.error("Prime caches failed:", err)
      }
    }

    primeCaches()
  }, [user._id])

  useEffect(() => {
    setTotalUnreadChats(computeTotalUnread())
    setRfqCount(computeUnopenedRFQs())
    setRequirementCount(computeUnopenedRequirements())

    try {
      const savedChat = parseInt(localStorage.getItem(`seller_chat_count_${user._id}`) || "0")
      if (!isNaN(savedChat)) setChatCount(savedChat)
    } catch {}
    try {
      const savedOrder = parseInt(localStorage.getItem(`seller_order_count_${user._id}`) || "0")
      if (!isNaN(savedOrder)) setOrderCount(savedOrder)
    } catch {}

    if (!user._id) return

    socket.emit("join_seller", user._id)
    console.log("✅ Seller joined socket room:", user._id)

    const handleNewRfq = (data: any) => {
      try {
        const cacheRaw = localStorage.getItem("seller_rfqs_cache")
        const cache = cacheRaw ? JSON.parse(cacheRaw) : []
        if (data?.rfqId && !cache.some((r: any) => r.rfqId === data.rfqId)) {
          cache.push({ rfqId: data.rfqId, buyerId: data.buyerId || "" })
          localStorage.setItem("seller_rfqs_cache", JSON.stringify(cache))
        }
      } catch {}
      setRfqCount(computeUnopenedRFQs())
      showBrowserNotification("📩 New RFQ", `${data.buyerName} sent a new RFQ`)
      showToast("📩 NEW RFQ RECEIVED!", `${data.buyerName} sent an RFQ for ${data.productName || "Product"} (₹${data.totalAmount || 0})`, "rfq")
    }

    const handleNewChatNotification = (data: any) => {
      if (data?.from) {
        const key = `unread_seller_${data.from}`
        const current = parseInt(localStorage.getItem(key) || "0")
        localStorage.setItem(key, String(current + 1))
        setTotalUnreadChats(computeTotalUnread())
        window.dispatchEvent(new Event("unread-seller-updated"))
      }
      setChatCount(prev => {
        const next = prev + 1
        try { localStorage.setItem(`seller_chat_count_${user._id}`, String(next)) } catch {}
        return next
      })
      showBrowserNotification("💬 New Message", `${data.fromName || "Buyer"}: ${data.message}`)
      showToast("💬 NEW MESSAGE", `${data.fromName || "Buyer"}: ${data.message}`, "chat")
    }

    const handleReceiveMessage = () => {}

    const handleNewOrder = (data: any) => {
      setOrderCount(prev => {
        const next = prev + 1
        try { localStorage.setItem(`seller_order_count_${user._id}`, String(next)) } catch {}
        return next
      })
      showBrowserNotification("🛒 New Order", `${data.buyerName} placed an order`)
      showToast("🛒 NEW ORDER RECEIVED!", `${data.buyerName} placed an order for ₹${data.totalAmount || 0}`, "order")
    }

    const handleNewRequirement = (data: any) => {
      try {
        const cacheRaw = localStorage.getItem("seller_requirements_cache")
        const cache = cacheRaw ? JSON.parse(cacheRaw) : []
        if (data?.requirementId && !cache.some((r: any) => r.requirementId === data.requirementId)) {
          cache.push({ requirementId: data.requirementId, buyerId: data.buyerId || "" })
          localStorage.setItem("seller_requirements_cache", JSON.stringify(cache))
        }
      } catch {}

      setRequirementCount(computeUnopenedRequirements())
      showBrowserNotification("📩 New Requirement", `${data.buyerName} needs ${data.productName}`)
      showToast("📩 NEW BUYER REQUIREMENT!", `${data.buyerName} needs ${data.productName || "Product"}`, "requirement")
    }

    const handleOrderStatusUpdated = (data: any) => {
      showBrowserNotification("📦 Order Updated", `Order ${data.orderId} status: ${data.status}`)
    }

    socket.on("new-rfq", handleNewRfq)
    socket.on("new-chat-notification", handleNewChatNotification)
    socket.on("receive_message", handleReceiveMessage)
    socket.on("new-order", handleNewOrder)
    socket.on("new-buyer-requirement", handleNewRequirement)
    socket.on("order-status-updated", handleOrderStatusUpdated)

    const onUnread = () => setTotalUnreadChats(computeTotalUnread())
    const onRfqsUpdated = () => setRfqCount(computeUnopenedRFQs())
    const onRequirementsUpdated = () => setRequirementCount(computeUnopenedRequirements())

    window.addEventListener("unread-seller-updated", onUnread)
    window.addEventListener("rfqs-updated", onRfqsUpdated)
    window.addEventListener("requirements-updated", onRequirementsUpdated)

    return () => {
      socket.off("new-rfq", handleNewRfq)
      socket.off("new-chat-notification", handleNewChatNotification)
      socket.off("receive_message", handleReceiveMessage)
      socket.off("new-order", handleNewOrder)
      socket.off("new-buyer-requirement", handleNewRequirement)
      socket.off("order-status-updated", handleOrderStatusUpdated)
      window.removeEventListener("unread-seller-updated", onUnread)
      window.removeEventListener("rfqs-updated", onRfqsUpdated)
      window.removeEventListener("requirements-updated", onRequirementsUpdated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id])

  const showToast = (title: string, message: string, type: string) => {
    setToast({ title, message, type })
    setTimeout(() => setToast(null), 6000)
  }

  const showBrowserNotification = (title: string, body: string) => {
    try {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "🔔" })
      } else if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    } catch (error) {
      console.log("Browser notification error:", error)
    }
  }

  const totalNotifications = rfqCount + chatCount + orderCount + requirementCount

  const clearNotifications = (type: string) => {
    if (type === "rfq") {
      markAllRFQsOpened()
    } else if (type === "chat") {
      resetAllUnreadChats()
    } else if (type === "order") {
      resetOrderCount()
    } else if (type === "requirement") {
      markAllRequirementsOpened()
    }
  }

  const logout = () => {
    if (!window.confirm("Do you really want to logout?")) return
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const menuItems = [
    { name: "Dashboard", path: "/home", icon: "🏠" },
    { name: "Products", path: "/products", icon: "📦" },
    { name: "All Products", path: "/all-products", icon: "🛍️" },
    { name: "Orders", path: "/orders", icon: "🛒" },
    { name: "RFQs", path: "/seller/rfqs", icon: "📩" },
    { name: "Chats", path: "/chats", icon: "💭" },
    { name: "Profile", path: "/profile", icon: "👤" },
    { name: "Buyer Requirements", path: "/buyer-requirements", icon: "📩" }
  ]

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(to right,#eef2ff,#f8fafc)"
      }}
    >
      <div style={sidebarStyle}>
        <div style={sidebarTop}>
          <div style={logoContainer}>
            <img src={logo} alt="logo" style={logoStyle} />
          </div>

          <div style={actionBar}>
            <div style={bellWrapper}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  ...bellBtn,
                  background: showNotifications
                    ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
                    : "rgba(255,255,255,0.10)",
                  boxShadow: showNotifications
                    ? "0 6px 20px rgba(139, 92, 246, 0.5)"
                    : "none",
                  transform: showNotifications ? "scale(1.05)" : "scale(1)"
                }}
              >
                🔔
                {totalNotifications > 0 && (
                  <span style={bellBadge}>{totalNotifications}</span>
                )}
              </button>

              {showNotifications && (
                <div style={dropdown}>
                  <div style={dropdownHeader}>
                    <div style={dropdownHeaderLeft}>
                      <div style={dropdownIconBox}>🔔</div>
                      <div>
                        <h4 style={dropdownTitle}>Notifications</h4>
                        <p style={dropdownSubtitle}>
                          {totalNotifications > 0
                            ? `${totalNotifications} new`
                            : "All caught up!"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {totalNotifications === 0 ? (
                    <div style={dropdownEmptyWrapper}>
                      <div style={dropdownEmptyIcon}>🔕</div>
                      <p style={dropdownEmptyTitle}>No new notifications</p>
                      <p style={dropdownEmptyText}>
                        You're all caught up!
                      </p>
                    </div>
                  ) : (
                    <div style={dropdownList}>
                      {rfqCount > 0 && (
                        <div
                          style={dropdownItem}
                          onClick={() => {
                            navigate("/seller/rfqs")
                            setShowNotifications(false)
                            clearNotifications("rfq")
                          }}
                        >
                          <div style={dropdownItemIconRfq}>📩</div>
                          <div style={dropdownItemContent}>
                            <span style={dropdownItemTitle}>
                              {rfqCount} new RFQ{rfqCount > 1 ? "s" : ""}
                            </span>
                            <span style={dropdownItemSub}>
                              Buyer requests for quotes
                            </span>
                          </div>
                          <span style={dropdownItemArrow}>→</span>
                        </div>
                      )}
                      {chatCount > 0 && (
                        <div
                          style={dropdownItem}
                          onClick={() => {
                            navigate("/chats")
                            setShowNotifications(false)
                            clearNotifications("chat")
                          }}
                        >
                          <div style={dropdownItemIconChat}>💬</div>
                          <div style={dropdownItemContent}>
                            <span style={dropdownItemTitle}>
                              {chatCount} new message{chatCount > 1 ? "s" : ""}
                            </span>
                            <span style={dropdownItemSub}>
                              Chat with buyers
                            </span>
                          </div>
                          <span style={dropdownItemArrow}>→</span>
                        </div>
                      )}
                      {orderCount > 0 && (
                        <div
                          style={dropdownItem}
                          onClick={() => {
                            navigate("/orders")
                            setShowNotifications(false)
                            clearNotifications("order")
                          }}
                        >
                          <div style={dropdownItemIconOrder}>🛒</div>
                          <div style={dropdownItemContent}>
                            <span style={dropdownItemTitle}>
                              {orderCount} new order{orderCount > 1 ? "s" : ""}
                            </span>
                            <span style={dropdownItemSub}>
                              Recent orders placed
                            </span>
                          </div>
                          <span style={dropdownItemArrow}>→</span>
                        </div>
                      )}
                      {requirementCount > 0 && (
                        <div
                          style={dropdownItem}
                          onClick={() => {
                            navigate("/buyer-requirements")
                            setShowNotifications(false)
                            clearNotifications("requirement")
                          }}
                        >
                          <div style={dropdownItemIconReq}>📩</div>
                          <div style={dropdownItemContent}>
                            <span style={dropdownItemTitle}>
                              {requirementCount} new requirement
                              {requirementCount > 1 ? "s" : ""}
                            </span>
                            <span style={dropdownItemSub}>
                              Buyer product needs
                            </span>
                          </div>
                          <span style={dropdownItemArrow}>→</span>
                        </div>
                      )}
                    </div>
                  )}

                  {totalNotifications > 0 && (
                    <div style={dropdownFooter}>
                      <button
                        style={markAllBtn}
                        onClick={() => {
                          markAllRFQsOpened()
                          resetAllUnreadChats()
                          markAllRequirementsOpened()
                          resetOrderCount()
                          setShowNotifications(false)
                        }}
                      >
                        ✓ Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={logout} style={logoutBtn}>
              🚪 Logout
            </button>
          </div>
        </div>

        <div style={profileCard}>
          <img
            src={
              user?.photo ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
            alt="profile"
            style={profileImg}
          />
          <div>
            <h3 style={profileName}>{user?.name || "Seller"}</h3>
            <p style={profileEmail}>{user?.email}</p>
          </div>
        </div>

        <div style={menuContainer}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{ textDecoration: "none" }}
            >
              <button
                style={{
                  ...menuBtn,
                  background:
                    location.pathname === item.path
                      ? "white"
                      : "rgba(255,255,255,0.08)",
                  color: location.pathname === item.path ? "#111827" : "white",
                  boxShadow:
                    location.pathname === item.path
                      ? "0 4px 10px rgba(255,255,255,0.12)"
                      : "none",
                  position: "relative" as const
                }}
              >
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                {item.name}

                {item.path === "/seller/rfqs" && rfqCount > 0 && (
                  <span style={badgeStyle}>{rfqCount}</span>
                )}
                {item.path === "/chats" && totalUnreadChats > 0 && (
                  <span style={badgeStyle}>{totalUnreadChats}</span>
                )}
                {item.path === "/orders" && orderCount > 0 && (
                  <span style={{ ...badgeStyle, background: "#22c55e" }}>
                    {orderCount}
                  </span>
                )}
                {item.path === "/buyer-requirements" && requirementCount > 0 && (
                  <span style={{ ...badgeStyle, background: "#8b5cf6" }}>
                    {requirementCount}
                  </span>
                )}
              </button>
            </Link>
          ))}
        </div>
      </div>

      <div style={mainContent}>
        <div>{children}</div>
      </div>

      {toast && (
        <div
          style={{
            ...toastContainer,
            borderLeft: `5px solid ${
              toast.type === "rfq"
                ? "#3b82f6"
                : toast.type === "chat"
                ? "#7c3aed"
                : toast.type === "order"
                ? "#22c55e"
                : "#8b5cf6"
            }`
          }}
        >
          <div style={toastHeader}>
            <span style={toastIcon}>
              {toast.type === "rfq"
                ? "📩"
                : toast.type === "chat"
                ? "💬"
                : toast.type === "order"
                ? "🛒"
                : "📩"}
            </span>
            <h4 style={toastTitle}>{toast.title}</h4>
            <button onClick={() => setToast(null)} style={toastCloseBtn}>
              ✕
            </button>
          </div>
          <p style={toastMessage}>{toast.message}</p>

          <div style={toastActions}>
            {toast.type === "rfq" && (
              <button
                onClick={() => {
                  navigate("/seller/rfqs")
                  setToast(null)
                  markAllRFQsOpened()
                }}
                style={toastBtn}
              >
                📄 View RFQ
              </button>
            )}
            {toast.type === "chat" && (
              <button
                onClick={() => {
                  navigate("/chats")
                  setToast(null)
                  resetAllUnreadChats()
                }}
                style={toastBtn}
              >
                💬 Open Chat
              </button>
            )}
            {toast.type === "order" && (
              <button
                onClick={() => {
                  navigate("/orders")
                  setToast(null)
                  resetOrderCount()
                }}
                style={toastBtn}
              >
                📦 View Order
              </button>
            )}
            {toast.type === "requirement" && (
              <button
                onClick={() => {
                  navigate("/buyer-requirements")
                  setToast(null)
                  markAllRequirementsOpened()
                }}
                style={toastBtn}
              >
                📋 View Requirements
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ Global Animations */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-10deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-6deg); }
          80% { transform: rotate(6deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ================= STYLES =================

const sidebarStyle = {
  width: "240px",
  background: "linear-gradient(180deg, #0f172a, #1e1b4b, #1e3a5f)",
  padding: "18px 14px",
  color: "white",
  display: "flex",
  flexDirection: "column" as const,
  boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
  minHeight: "100vh",
  position: "sticky" as const,
  top: 0,
  overflowY: "auto" as const,
  zIndex: 100
}

const sidebarTop = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginBottom: "16px"
}

const logoContainer = { textAlign: "center" as const }

const logoStyle = {
  width: "180px",
  height: "70px",
  borderRadius: "8px",
  objectFit: "cover" as const
}

const actionBar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "8px 12px",
  background: "rgba(255,255,255,0.06)",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.06)"
}

const bellWrapper = { position: "relative" as const }

const bellBtn = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "50%",
  width: "38px",
  height: "38px",
  fontSize: "18px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  transition: "all 0.3s ease"
}

const bellBadge = {
  position: "absolute" as const,
  top: "-4px",
  right: "-4px",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "white",
  borderRadius: "50%",
  padding: "2px 6px",
  fontSize: "10px",
  fontWeight: "bold",
  minWidth: "18px",
  textAlign: "center" as const,
  boxShadow: "0 2px 12px rgba(239, 68, 68, 0.6)",
  animation: "pulse 2s infinite"
}

const logoutBtn = {
  padding: "6px 14px",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
  whiteSpace: "nowrap" as const,
  display: "flex",
  alignItems: "center",
  gap: "4px"
}

const profileCard = {
  background: "rgba(255,255,255,0.06)",
  padding: "12px",
  borderRadius: "12px",
  marginBottom: "16px",
  backdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  border: "1px solid rgba(255,255,255,0.05)"
}

const profileImg = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  objectFit: "cover" as const,
  border: "2px solid rgba(255,255,255,0.2)"
}

const profileName = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "600"
}

const profileEmail = {
  marginTop: "2px",
  fontSize: "10px",
  color: "#cbd5e1",
  wordBreak: "break-word" as const
}

const menuContainer = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  flex: 1
}

const menuBtn = {
  width: "100%",
  padding: "10px 14px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  transition: "0.2s",
  textAlign: "left" as const,
  display: "flex",
  alignItems: "center",
  gap: "10px"
}

const badgeStyle = {
  position: "absolute" as const,
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "#ef4444",
  color: "white",
  borderRadius: "50%",
  padding: "2px 8px",
  fontSize: "10px",
  fontWeight: "bold",
  minWidth: "18px",
  textAlign: "center" as const
}

const mainContent = { flex: 1, padding: "18px" }

// ============ PREMIUM NOTIFICATION DROPDOWN ============

const dropdown: React.CSSProperties = {
  position: "fixed",              // ✅ absolute → fixed
  top: "80px",                    // ✅ 50px → 80px
  left: "260px",                  // ✅ right: 0 → left: 260px (sidebar 240px + 20px gap)
  background: "white",
  borderRadius: "18px",
  boxShadow: "0 25px 70px rgba(15, 23, 42, 0.25), 0 8px 20px rgba(15, 23, 42, 0.12)",
  width: "360px",
  maxWidth: "calc(100vw - 280px)", // ✅ sidebar ke baad bacha hua space
  zIndex: 1000,
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  animation: "slideDown 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
}

const dropdownHeader: React.CSSProperties = {
  padding: "18px 18px 14px",
  background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
  borderBottom: "1px solid #e2e8f0"
}

const dropdownHeaderLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
}

const dropdownIconBox: React.CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  boxShadow: "0 8px 20px rgba(139, 92, 246, 0.45)"
}

const dropdownTitle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "16px",
  fontWeight: "800",
  letterSpacing: "-0.3px"
}

const dropdownSubtitle: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "500"
}

const dropdownEmptyWrapper: React.CSSProperties = {
  padding: "36px 20px",
  textAlign: "center"
}

const dropdownEmptyIcon: React.CSSProperties = {
  fontSize: "48px",
  marginBottom: "12px",
  opacity: 0.6
}

const dropdownEmptyTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "700",
  color: "#0f172a"
}

const dropdownEmptyText: React.CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: "12px",
  color: "#94a3b8"
}

const dropdownList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  padding: "10px"
}

const dropdownItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  background: "white",
  transition: "all 0.2s ease",
  border: "1px solid #f1f5f9",
  animation: "fadeInUp 0.3s ease"
}

const dropdownItemIconRfq: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #06b6d4, #0891b2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "17px",
  boxShadow: "0 4px 12px rgba(6, 182, 212, 0.35)",
  flexShrink: 0
}

const dropdownItemIconChat: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "17px",
  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)",
  flexShrink: 0
}

const dropdownItemIconOrder: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #22c55e, #15803d)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "17px",
  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.35)",
  flexShrink: 0
}

const dropdownItemIconReq: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #ec4899, #be185d)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "17px",
  boxShadow: "0 4px 12px rgba(236, 72, 153, 0.35)",
  flexShrink: 0
}

const dropdownItemContent: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0
}

const dropdownItemTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0f172a"
}

const dropdownItemSub: React.CSSProperties = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "500"
}

const dropdownItemArrow: React.CSSProperties = {
  fontSize: "16px",
  color: "#cbd5e1",
  fontWeight: "bold"
}

const dropdownFooter: React.CSSProperties = {
  padding: "10px 14px",
  borderTop: "1px solid #f1f5f9",
  background: "#fafafa"
}

const markAllBtn: React.CSSProperties = {
  padding: "10px 14px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "12px",
  width: "100%",
  fontWeight: "700",
  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
  transition: "all 0.2s ease"
}

// ============ TOAST ============

const toastContainer: React.CSSProperties = {
  position: "fixed",
  top: "20px",
  right: "20px",
  background: "white",
  borderRadius: "14px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  padding: "16px 20px",
  minWidth: "340px",
  maxWidth: "420px",
  zIndex: 99999,
  animation: "slideInRight 0.4s ease",
  border: "1px solid #e2e8f0",
  borderLeftWidth: "5px",
  borderLeftStyle: "solid"
}

const toastHeader = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "10px"
}

const toastIcon = { fontSize: "24px" }

const toastTitle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "700",
  color: "#0f172a",
  flex: 1
}

const toastCloseBtn = {
  background: "none",
  border: "none",
  fontSize: "16px",
  cursor: "pointer",
  color: "#94a3b8",
  padding: "2px 6px",
  borderRadius: "4px"
}

const toastMessage = {
  margin: "0 0 12px 0",
  fontSize: "14px",
  color: "#475569",
  lineHeight: "1.5"
}

const toastActions = { display: "flex", gap: "8px" }

const toastBtn = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
}



export default SellerLayout