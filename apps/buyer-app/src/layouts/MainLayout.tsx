import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar/Navbar"
import CategoriesBar from "../components/CategoriesBar/CategoriesBar"
import { io } from "socket.io-client"
import { SOCKET_URL } from "../config"

const socket = io(SOCKET_URL)

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  // ✅ NAYA: Toast notification state
  const [toast, setToast] = useState<{ title: string; message: string; rfqId: string } | null>(null)

  useEffect(() => {
    if (user._id) {
      socket.emit("join_buyer", user._id)
      console.log("✅ Buyer joined socket room:", user._id)

      // ✅ NAYA: Listen for quote from seller
      socket.on("rfq-quoted", (data) => {
        console.log("🔔 RFQ Quoted notification:", data)

        // Browser notification
        if (Notification.permission === "granted") {
          new Notification("💰 New Quote Received!", {
            body: `${data.sellerName} sent you a quote for ₹${data.quote?.totalQuote || 0}`,
            icon: "🔔"
          })
        } else if (Notification.permission === "default") {
          Notification.requestPermission()
        }

        // Toast notification
        setToast({
          title: "💰 NEW QUOTE RECEIVED!",
          message: `${data.sellerName} sent you a quote for ₹${data.quote?.totalQuote || 0}`,
          rfqId: data.rfqId
        })

        // Auto-hide after 8 seconds
        setTimeout(() => setToast(null), 8000)
      })

      // ✅ Listen for quote update
      socket.on("rfq-quote-updated", (data) => {
        console.log("🔔 RFQ Quote Updated:", data)

        if (Notification.permission === "granted") {
          new Notification("💰 Quote Updated!", {
            body: `Seller updated the quote`,
            icon: "🔔"
          })
        }

        setToast({
          title: "💰 QUOTE UPDATED!",
          message: `Seller has updated the quote. Check details.`,
          rfqId: data.rfqId
        })

        setTimeout(() => setToast(null), 8000)
      })
    }

    return () => {
      socket.off("rfq-quoted")
      socket.off("rfq-quote-updated")
    }
  }, [user._id])

  const hideCategories = [
    "/profile",
    "/blog",
    "/contact",
    "/help",
    "/faq"
  ]

  const shouldHideCategories = hideCategories.includes(location.pathname)

  return (
    <div>
      <Navbar />

      {!shouldHideCategories && <CategoriesBar />}

      <div>{children}</div>

      {/* ✅ NAYA: TOAST NOTIFICATION */}
      {toast && (
        <div style={toastContainer}>
          <div style={toastHeader}>
            <span style={toastIcon}>💰</span>
            <h4 style={toastTitle}>{toast.title}</h4>
            <button
              onClick={() => setToast(null)}
              style={toastCloseBtn}
            >
              ✕
            </button>
          </div>
          <p style={toastMessage}>{toast.message}</p>

          <div style={toastActions}>
            <button
              onClick={() => {
                navigate(`/rfq/${toast.rfqId}`)
                setToast(null)
              }}
              style={toastBtn}
            >
              📄 View Quote
            </button>
            <button
              onClick={() => {
                navigate("/rfq-dashboard")
                setToast(null)
              }}
              style={{ ...toastBtn, background: "#6b7280" }}
            >
              📋 All RFQs
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ TOAST STYLES
const toastContainer: React.CSSProperties = {
  position: "fixed",
  top: "20px",
  right: "20px",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  padding: "16px 20px",
  minWidth: "340px",
  maxWidth: "420px",
  zIndex: 99999,
  animation: "slideInRight 0.4s ease",
  border: "1px solid #e2e8f0",
  borderLeft: "5px solid #2563eb"
}

const toastHeader = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "10px"
}

const toastIcon = {
  fontSize: "24px"
}

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

const toastActions = {
  display: "flex",
  gap: "8px"
}

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

export default MainLayout