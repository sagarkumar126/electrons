// buyer-app/src/components/Navbar/Navbar.tsx

import { Link, useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import NotificationBell from "../NotificationBell/NotificationBell"  // ✅ NEW

const socket = io("http://localhost:5000")

const Navbar = () => {
  const [user, setUser] = useState<any>(null)
  const [query, setQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [totalUnread, setTotalUnread] = useState(0)

  const navigate = useNavigate()
  const location = useLocation()

  const computeTotalUnread = () => {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("unread_requirement_")) {
        const val = parseInt(localStorage.getItem(key) || "0")
        if (!isNaN(val) && val > 0) count += 1
      }
    }
    return count
  }

  useEffect(() => {
    const data = localStorage.getItem("user")
    if (data) {
      const userData = JSON.parse(data)
      setUser(userData)
      fetchCounts(userData._id)
      socket.emit("join_buyer", userData._id)
    }

    setTotalUnread(computeTotalUnread())

    socket.on("new-chat-notification", (payload: any) => {
      if (!payload?.roomId) return

      if (payload.from) {
        const key = `unread_requirement_${payload.from}`
        const current = parseInt(localStorage.getItem(key) || "0")
        localStorage.setItem(key, String(current + 1))
      }

      let rfqId: string = payload.rfqId || ""
      if (!rfqId) {
        try {
          const rfqsStr = localStorage.getItem("buyer_rfqs_cache") || "[]"
          const rfqs: any[] = JSON.parse(rfqsStr)
          const matched = rfqs.find(
            (r: any) =>
              r.sellerId === payload.from &&
              (!payload.productId || r.productId === payload.productId)
          )
          if (matched) rfqId = matched.rfqId
        } catch (e) {
          console.log("RFQ cache parse error:", e)
        }
      }

      if (rfqId) {
        const key = `unread_rfq_${rfqId}`
        const current = parseInt(localStorage.getItem(key) || "0")
        localStorage.setItem(key, String(current + 1))
        window.dispatchEvent(new Event("unread-rfq-updated"))
      }

      setTotalUnread(computeTotalUnread())
      window.dispatchEvent(new Event("unread-requirement-updated"))
    })

    const onUnreadUpdate = () => setTotalUnread(computeTotalUnread())
    window.addEventListener("unread-requirement-updated", onUnreadUpdate)
    window.addEventListener("unread-rfq-updated", onUnreadUpdate)

    return () => {
      socket.off("new-chat-notification")
      window.removeEventListener("unread-requirement-updated", onUnreadUpdate)
      window.removeEventListener("unread-rfq-updated", onUnreadUpdate)
    }
  }, [])

  const fetchCounts = async (buyerId: string) => {
    try {
      const cartRes = await fetch(`http://localhost:5000/api/cart/${buyerId}`)
      const cartData = await cartRes.json()
      setCartCount(cartData.totalItems || 0)

      const wishlistRes = await fetch(`http://localhost:5000/api/wishlist/${buyerId}`)
      const wishlistData = await wishlistRes.json()
      setWishlistCount(wishlistData.items?.length || 0)
    } catch (err) {
      console.error("Failed to fetch counts", err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
    window.location.href = "/login"
  }

  const hideCategoryPages = ["/profile", "/blog", "/contact", "/help", "/faq", "/cart", "/wishlist", "/orders", "/my-enquiries", "/chats", "/rfq-dashboard", "/post-requirement", "/my-requirements"]
  const hideCategories = hideCategoryPages.includes(location.pathname)

  const isActive = (path: string) => location.pathname === path

  // ============================================================
  // ✅ LOGGED-OUT NAVBAR — Fixed: sticky properly working
  // ============================================================
  if (!user) {
    return (
      // ✅ OUTER WRAPPER — sticky (position: relative is not applied here)
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%"
        }}
      >
        {/* ✅ INNER CONTAINER — with relative for glow orbs */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%)",
            boxShadow: "0 10px 40px rgba(15, 23, 42, 0.4)",
            padding: "20px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Glow orbs */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "15%",
              width: "220px",
              height: "220px",
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none"
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-80px",
              left: "25%",
              width: "180px",
              height: "180px",
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none"
            }}
          />

          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              position: "relative",
              zIndex: 2
            }}
          >
            <span
              style={{
                fontSize: "32px",
                filter: "drop-shadow(0 4px 12px rgba(56, 189, 248, 0.5))"
              }}
            >
              ⚡
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                background: "linear-gradient(135deg, #38bdf8, #a78bfa, #f472b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              yourElectronics
            </h2>
          </div>

          {/* Login + Register Buttons */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "center",
              position: "relative",
              zIndex: 2
            }}
          >
            <Link to="/login" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "12px 30px",
                  borderRadius: "50px",
                  border: "2px solid rgba(148, 163, 184, 0.3)",
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  letterSpacing: "0.3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)"
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(148, 163, 184, 0.3)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
                  e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)"
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                🔐 Login
              </button>
            </Link>

            <Link to="/register" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "12px 30px",
                  borderRadius: "50px",
                  border: "none",
                  background: "linear-gradient(135deg, #8b5cf6, #6d28d9, #4c1d95)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  letterSpacing: "0.3px",
                  boxShadow: "0 8px 25px rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(139, 92, 246, 0.65)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)"
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.45)"
                }}
              >
                ✨ Register
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // ✅ LOGGED-IN NAVBAR — sticky removed (MainLayout wrapper handles it)
  // ============================================================
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}
    >
      {/* ROW 1 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 40px",
          color: "white",
          flexWrap: "wrap",
          gap: "15px",
          borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        <h2
          onClick={() => navigate("/")}
          style={{
            cursor: "pointer",
            margin: 0,
            color: "#38bdf8",
            fontSize: "28px",
            fontWeight: "800",
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #38bdf8, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          ⚡ yourElectronics
        </h2>

        <div style={{ display: "flex", gap: "8px", flex: 1, maxWidth: 450, minWidth: 200 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            style={{
              padding: "12px 18px",
              width: "100%",
              borderRadius: "50px",
              border: "none",
              outline: "none",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              fontSize: "14px"
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query)}`)
              }
            }}
          />
          <button
            onClick={() => query.trim() && navigate(`/search?q=${encodeURIComponent(query)}`)}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: "50px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)"
            }}
          >
            Search
          </button>
        </div>

        <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
          {/* ✅ NOTIFICATION BELL — Added here */}
          <NotificationBell />

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link to="/profile">
              <span
                style={{
                  padding: "8px 18px",
                  borderRadius: "50px",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.06)"
                }}
              >
                👤 {user.name}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 18px",
                borderRadius: "50px",
                border: "none",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.25)"
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 40px",
          background: "rgba(0,0,0,0.2)",
          flexWrap: "wrap",
          gap: "15px",
          borderTop: "1px solid rgba(255,255,255,0.05)"
        }}
      >
        <Link
          to="/"
          style={{
            ...navLink,
            color: isActive("/") ? "#38bdf8" : "#cbd5e1",
            fontWeight: isActive("/") ? "600" : "400"
          }}
        >
          🏠 Home
        </Link>

        <div style={{ display: "flex", gap: "20px" }}>
          {["/blog", "/help", "/faq", "/contact"].map((path) => {
            const names: { [key: string]: string } = {
              "/blog": "📝 Blog",
              "/help": "❓ Help",
              "/faq": "💡 FAQ",
              "/contact": "📞 Contact"
            }
            return (
              <Link
                key={path}
                to={path}
                style={{
                  ...navLink,
                  color: isActive(path) ? "#38bdf8" : "#cbd5e1",
                  fontWeight: isActive(path) ? "600" : "400"
                }}
              >
                {names[path]}
              </Link>
            )
          })}
        </div>

        <div style={{ display: "flex", gap: "18px", alignItems: "center", flexWrap: "wrap" }}>
          <Link
            to="/my-requirements"
            style={{
              ...navLink,
              color: isActive("/my-requirements") ? "#38bdf8" : "#cbd5e1",
              fontWeight: isActive("/my-requirements") ? "600" : "400"
            }}
          >
            📋 My Requirements
          </Link>

          <Link
            to="/wishlist"
            style={{
              ...navLink,
              color: isActive("/wishlist") ? "#38bdf8" : "#cbd5e1",
              fontWeight: isActive("/wishlist") ? "600" : "400"
            }}
          >
            ❤️ Wishlist
          </Link>

          <Link
            to="/orders"
            style={{
              ...navLink,
              color: isActive("/orders") ? "#38bdf8" : "#cbd5e1",
              fontWeight: isActive("/orders") ? "600" : "400"
            }}
          >
            📦 Orders
          </Link>

          <Link
            to="/chats"
            style={{
              ...navLink,
              color: isActive("/chats") ? "#38bdf8" : "#cbd5e1",
              fontWeight: isActive("/chats") ? "600" : "400"
            }}
          >
            💬 Chats {totalUnread > 0 && <span style={badge}>{totalUnread}</span>}
          </Link>

          <Link
            to="/rfq-dashboard"
            style={{
              ...navLink,
              color: isActive("/rfq-dashboard") ? "#38bdf8" : "#cbd5e1",
              fontWeight: isActive("/rfq-dashboard") ? "600" : "400"
            }}
          >
            📩 RFQs
          </Link>
        </div>
      </div>

      {!hideCategories && (
        <div style={{ padding: "8px 40px", background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.04)" }} />
      )}
    </div>
  )
}

const navLink = {
  color: "#cbd5e1",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "400",
  transition: "all 0.3s ease",
  padding: "6px 12px",
  borderRadius: "8px"
}

const badge = {
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "white",
  borderRadius: "50%",
  padding: "2px 8px",
  fontSize: "11px",
  fontWeight: "600",
  marginLeft: "4px",
  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)"
}

export default Navbar