import { useEffect, useState } from "react"
import { socket } from "../../socket"
import { useNavigate } from "react-router-dom"

const SellerHome = () => {
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [rfqs, setRfqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem("user") || "null")

  // ============================================
  // ✅ Fetch all data in parallel
  // ============================================
  const fetchAllData = async () => {
    try {
      const [productsRes, ordersRes, rfqsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/products/seller/${user._id}`),
        fetch(`http://localhost:5000/api/orders/seller/${user._id}`),
        fetch(`http://localhost:5000/api/rfq/seller/${user._id}`)
      ])

      const productsData = await productsRes.json()
      const ordersData = await ordersRes.json()
      const rfqsData = await rfqsRes.json()

      setProducts(Array.isArray(productsData) ? productsData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setRfqs(rfqsData?.data && Array.isArray(rfqsData.data) ? rfqsData.data : [])

      // 🔔 Stock alerts
      const lowStockItems = productsData.filter(
        (p: any) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 15
      )
      const outStockItems = productsData.filter(
        (p: any) => Number(p.stock || 0) === 0
      )

      if ("Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission()
        } else if (Notification.permission === "granted") {
          if (outStockItems.length > 0) {
            new Notification("Out of Stock Alert", {
              body: `${outStockItems.length} products are out of stock`
            })
          }
          if (lowStockItems.length > 0) {
            new Notification("Low Stock Alert", {
              body: `${lowStockItems.length} products are running low (≤15)`
            })
          }
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()

    socket.on("new-product", fetchAllData)
    socket.on("new-order", fetchAllData)
    socket.on("new-rfq", fetchAllData)

    return () => {
      socket.off("new-product", fetchAllData)
      socket.off("new-order", fetchAllData)
      socket.off("new-rfq", fetchAllData)
    }
  }, [])

  // ============================================
  // ✅ Computed stats
  // ============================================
  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0)
  const totalValue = products.reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
    0
  )

  const lowStockCount = products.filter(
    p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 15
  ).length
  const outStockCount = products.filter(p => Number(p.stock || 0) === 0).length

  const pendingOrders = orders.filter(o => o.status === "Pending").length
  const pendingRfqs = rfqs.filter(r => r.status === "Pending").length

  // ✅ Total unread chats across all buyers
  const totalUnreadChats = (() => {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("unread_seller_")) {
        const val = parseInt(localStorage.getItem(key) || "0")
        if (!isNaN(val) && val > 0) count += 1
      }
    }
    return count
  })()

  const totalRevenue = orders
    .filter(o => ["Confirmed", "Processing", "Shipped", "Delivered"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentRfqs = [...rfqs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const timeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMins = Math.floor((now.getTime() - past.getTime()) / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return { bg: "#fef3c7", text: "#92400e" }
      case "Confirmed": return { bg: "#dbeafe", text: "#1e40af" }
      case "Processing": return { bg: "#ede9fe", text: "#5b21b6" }
      case "Shipped": return { bg: "#cffafe", text: "#155e75" }
      case "Delivered": return { bg: "#dcfce7", text: "#166534" }
      case "Cancelled": return { bg: "#fee2e2", text: "#991b1b" }
      case "Quoted": return { bg: "#dbeafe", text: "#1e40af" }
      case "Accepted": return { bg: "#dcfce7", text: "#166534" }
      default: return { bg: "#f3f4f6", text: "#6b7280" }
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontSize: 18, color: "#64748b" }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* HERO / WELCOME */}
      <div
        style={{
          background: "linear-gradient(135deg,#0f172a,#2563eb,#4f46e5)",
          borderRadius: "20px",
          padding: "28px 32px",
          color: "white",
          boxShadow: "0 10px 30px rgba(37, 99, 235, 0.25)"
        }}
      >
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800 }}>
          👋 Welcome back, {user?.companyName || user?.name || "Seller"}!
        </h1>
        <p style={{ margin: "6px 0 20px 0", color: "#bfdbfe", fontSize: "14px" }}>
          Here's what's happening with your business today
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/products")} style={quickBtn}>
            ➕ Add Product
          </button>
          <button onClick={() => navigate("/orders")} style={quickBtn}>
            🛒 View Orders
          </button>
          <button onClick={() => navigate("/seller/rfqs")} style={quickBtn}>
            📩 View RFQs
          </button>
          <button onClick={() => navigate("/chats")} style={quickBtn}>
            💬 Open Chats
          </button>
          <button onClick={() => navigate("/stocks")} style={quickBtn}>
            📊 Check Stocks
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={statsGrid}>
        <StatCard
          icon="📦"
          label="Total Products"
          value={totalProducts}
          color="#2563eb"
          bg="#dbeafe"
        />
        <StatCard
          icon="🛒"
          label="Total Orders"
          value={orders.length}
          color="#16a34a"
          bg="#dcfce7"
        />
        <StatCard
          icon="📩"
          label="Total RFQs"
          value={rfqs.length}
          color="#8b5cf6"
          bg="#ede9fe"
        />
        <StatCard
          icon="💰"
          label="Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          color="#f59e0b"
          bg="#fef3c7"
        />
      </div>

      {/* STOCK ALERTS + QUICK SNAPSHOT */}
      <div style={twoColRow}>

        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>⚠️ Stock Alerts</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={alertRow}>
              <div style={{ ...alertIcon, background: "#fee2e2", color: "#dc2626" }}>
                ❌
              </div>
              <div style={{ flex: 1 }}>
                <p style={alertTitle}>{outStockCount} Out of Stock</p>
                <p style={alertSub}>
                  {outStockCount > 0 ? "Restock these products urgently" : "All good!"}
                </p>
              </div>
            </div>

            <div style={alertRow}>
              <div style={{ ...alertIcon, background: "#fef3c7", color: "#d97706" }}>
                ⚠️
              </div>
              <div style={{ flex: 1 }}>
                <p style={alertTitle}>{lowStockCount} Low Stock</p>
                <p style={alertSub}>
                  {lowStockCount > 0 ? "Products with ≤ 15 units left" : "All good!"}
                </p>
              </div>
            </div>

            <button onClick={() => navigate("/stocks")} style={panelBtn}>
              📊 Check Stocks →
            </button>
          </div>
        </div>

        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>📊 Quick Snapshot</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SnapshotRow
              icon="📦"
              label="Total Stock Units"
              value={totalStock.toLocaleString()}
              color="#2563eb"
            />
            <SnapshotRow
              icon="💎"
              label="Inventory Value"
              value={`₹${totalValue.toLocaleString()}`}
              color="#16a34a"
            />
            <SnapshotRow
              icon="⏳"
              label="Pending Orders"
              value={pendingOrders}
              color="#f59e0b"
            />
            <SnapshotRow
              icon="⏳"
              label="Pending RFQs"
              value={pendingRfqs}
              color="#8b5cf6"
            />
            <SnapshotRow
              icon="💬"
              label="Unread Chats"
              value={totalUnreadChats}
              color="#ec4899"
            />
          </div>
        </div>
      </div>

      {/* RECENT ORDERS + RECENT RFQs */}
      <div style={twoColRow}>

        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>🛒 Recent Orders</h3>
            <button onClick={() => navigate("/orders")} style={viewAllBtn}>
              View All →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState icon="🛒" text="No orders yet" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentOrders.map((o) => {
                const sc = getStatusColor(o.status)
                return (
                  <div key={o.orderId || o._id} style={listRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={listTitle}>
                        #{o.orderId || o._id?.slice(-6)}
                      </p>
                      <p style={listSub}>
                        {o.buyerName || "Buyer"} • {o.quantity || 1} units
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ ...listAmount, color: "#16a34a" }}>
                        ₹{Number(o.totalAmount || 0).toLocaleString()}
                      </p>
                      <span style={{ ...statusPill, background: sc.bg, color: sc.text }}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>📩 Recent RFQs</h3>
            <button onClick={() => navigate("/seller/rfqs")} style={viewAllBtn}>
              View All →
            </button>
          </div>

          {recentRfqs.length === 0 ? (
            <EmptyState icon="📩" text="No RFQs yet" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentRfqs.map((r) => {
                const sc = getStatusColor(r.status)
                return (
                  <div key={r.rfqId || r._id} style={listRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={listTitle}>
                        {r.items?.[0]?.productName || "Product"}
                      </p>
                      <p style={listSub}>
                        {r.buyerName || "Buyer"} • {r.items?.[0]?.quantity || 0} units
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ ...statusPill, background: sc.bg, color: sc.text }}>
                        {r.status}
                      </span>
                      <p style={listTime}>{timeAgo(r.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

// ================= SUB-COMPONENTS =================

const StatCard = ({ icon, label, value, color, bg }: any) => (
  <div style={statCard}>
    <div style={{ ...statIcon, background: bg, color }}>
      {icon}
    </div>
    <div>
      <p style={statLabel}>{label}</p>
      <p style={statValue}>{value}</p>
    </div>
  </div>
)

const SnapshotRow = ({ icon, label, value, color }: any) => (
  <div style={snapshotRow}>
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span style={{ flex: 1, fontSize: 13, color: "#475569", fontWeight: 500 }}>
      {label}
    </span>
    <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
  </div>
)

const EmptyState = ({ icon, text }: any) => (
  <div style={emptyState}>
    <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.5 }}>{icon}</div>
    <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>{text}</p>
  </div>
)

// ================= STYLES =================
const quickBtn: React.CSSProperties = {
  padding: "9px 16px",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.12)",
  color: "white",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  backdropFilter: "blur(10px)",
  transition: "all 0.2s"
}

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
  marginTop: 22
}

const statCard: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: "18px 20px",
  display: "flex",
  alignItems: "center",
  gap: 14,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  border: "1px solid #f1f5f9"
}

const statIcon: React.CSSProperties = {
  width: 50,
  height: 50,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  flexShrink: 0
}

const statLabel: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.3
}

const statValue: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a"
}

const twoColRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginTop: 22
}

const panelCard: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: "20px 22px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  border: "1px solid #f1f5f9"
}

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
  paddingBottom: 12,
  borderBottom: "1px solid #f1f5f9"
}

const panelTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "#0f172a"
}

const panelBtn: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
  marginTop: 6,
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
}

const alertRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  background: "#f8fafc",
  borderRadius: 12
}

const alertIcon: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  flexShrink: 0
}

const alertTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a"
}

const alertSub: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: 12,
  color: "#64748b"
}

const snapshotRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  background: "#f8fafc",
  borderRadius: 10
}

const viewAllBtn: React.CSSProperties = {
  padding: "6px 14px",
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700
}

const listRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  background: "#f8fafc",
  borderRadius: 10
}

const listTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  color: "#0f172a",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

const listSub: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: 12,
  color: "#64748b"
}

const listAmount: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 800
}

const listTime: React.CSSProperties = {
  margin: "3px 0 0 0",
  fontSize: 11,
  color: "#94a3b8"
}

const statusPill: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
  marginTop: 3
}

const emptyState: React.CSSProperties = {
  textAlign: "center",
  padding: "32px 20px",
  background: "#f8fafc",
  borderRadius: 12,
  border: "1px dashed #cbd5e1"
}

export default SellerHome