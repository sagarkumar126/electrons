import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useNotifications } from "../../context/NotificationContext"

const NotificationBell = () => {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // ✅ Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  // ✅ Request browser notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const handleClick = (n: any) => {
    markAsRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const formatTime = (date: string | Date) => {
    const d = new Date(date)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    if (hrs < 24) return `${hrs}h ago`
    return `${days}d ago`
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "chat": return "💬"
      case "rfq": return "📩"
      case "requirement": return "📋"
      case "order": return "🛒"
      case "quote": return "💰"
      default: return "🔔"
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case "chat": return "#3b82f6"
      case "rfq": return "#8b5cf6"
      case "requirement": return "#f59e0b"
      case "order": return "#10b981"
      case "quote": return "#ec4899"
      default: return "#64748b"
    }
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      {/* ✅ Bell Button — same style as your existing Navbar bell */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "rgba(255,255,255,0.08)",
          color: "white",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.18)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)"
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "#ef4444",
              borderRadius: "50%",
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: "bold",
              color: "white",
              minWidth: "18px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ✅ Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "0",
            width: "380px",
            maxWidth: "90vw",
            background: "white",
            borderRadius: "14px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>
              🔔 Notifications
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: "4px 10px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "32px" }}>🔕</div>
                <p style={{ marginTop: "8px", color: "#94a3b8", fontSize: "13px" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "12px 16px",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    background: n.read ? "white" : "#eff6ff",
                    borderLeft: `4px solid ${getColor(n.type)}`,
                    transition: "background 0.2s",
                    alignItems: "flex-start",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>
                    {getIcon(n.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#0f172a",
                      }}
                    >
                      {n.title}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 4px",
                        fontSize: "12px",
                        color: "#475569",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {n.message}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
                      {formatTime(n.timestamp)}
                    </p>
                  </div>
                  {!n.read && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#2563eb",
                        flexShrink: 0,
                        marginTop: "4px",
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid #f1f5f9",
                background: "#f8fafc",
                textAlign: "center",
              }}
            >
              <button
                onClick={clearAll}
                style={{
                  padding: "6px 16px",
                  background: "transparent",
                  color: "#ef4444",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell