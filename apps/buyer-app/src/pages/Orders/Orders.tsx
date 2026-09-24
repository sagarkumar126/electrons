import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const Orders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const timeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError("")
      
      const res = await fetch(`http://localhost:5000/api/orders/buyer/${user._id}`)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("❌ Error fetching orders:", error)
      setError("Failed to load orders. Please try again.")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user._id) {
      fetchOrders()
    } else {
      setLoading(false)
      setError("Please login to view orders")
    }
  }, [user._id])

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Pending": return { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" }
      case "Confirmed": return { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" }
      case "Processing": return { bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6" }
      case "Shipped": return { bg: "#d1fae5", text: "#065f46", dot: "#10b981" }
      case "Delivered": return { bg: "#d1fae5", text: "#065f46", dot: "#22c55e" }
      case "Cancelled": return { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" }
      default: return { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" }
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Pending": return "⏳"
      case "Confirmed": return "✅"
      case "Processing": return "⚙️"
      case "Shipped": return "🚚"
      case "Delivered": return "📦"
      case "Cancelled": return "❌"
      default: return "📋"
    }
  }

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status?.toLowerCase() === filter)

  const proceedToNext = (orderId: string) => {
    navigate(`/order-tracking/${orderId}`)
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>📋 My Orders</h2>
        <div style={styles.errorBox}>
          <p>❌ {error}</p>
          <button style={styles.retryBtn} onClick={fetchOrders}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <div>
          <h2 style={styles.title}>📋 My Orders</h2>
          <p style={styles.subtitle}>
            {orders.length} order{orders.length > 1 ? 's' : ''} placed
          </p>
        </div>
        <button
          style={styles.refreshBtn}
          onClick={fetchOrders}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={styles.filterTabs}>
        {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => {
          const count = status === "all" 
            ? orders.length 
            : orders.filter(o => o.status?.toLowerCase() === status).length
          return (
            <button
              key={status}
              style={{
                ...styles.filterTab,
                background: filter === status ? "#7c3aed" : "white",
                color: filter === status ? "white" : "#64748b",
                borderColor: filter === status ? "#7c3aed" : "#e2e8f0"
              }}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {count > 0 && (
                <span style={{
                  ...styles.filterCount,
                  background: filter === status ? "rgba(255,255,255,0.2)" : "#f1f5f9"
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📦</span>
          <p style={styles.emptyText}>No orders found</p>
          <button style={styles.shopBtn} onClick={() => navigate("/")}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredOrders.map((order) => {
            const status = getStatusColor(order.status || "Pending")
            
            return (
              <div key={order._id || order.orderId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.orderIdSection}>
                    <span style={styles.orderId}>#{order.orderId || order._id}</span>
                    <span style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span style={styles.orderTime}>
                      ⏰ {timeAgo(order.createdAt)}
                    </span>
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    background: status.bg,
                    color: status.text
                  }}>
                    <span style={{
                      ...styles.statusDot,
                      background: status.dot
                    }}></span>
                    {getStatusIcon(order.status)} {order.status || "Pending"}
                  </div>
                </div>

                <div style={styles.cardContent}>
                  <div style={styles.imageWrapper}>
                    {order.productImage ? (
                      <img 
                        src={order.productImage} 
                        alt={order.productName} 
                        style={styles.productImage} 
                      />
                    ) : (
                      <div style={styles.noImage}>📦</div>
                    )}
                  </div>

                  <div style={styles.productDetails}>
                    <h3 style={styles.productName}>{order.productName}</h3>
                    <div style={styles.productMeta}>
                      <span style={styles.metaItem}>📦 {order.quantity} units</span>
                      <span style={styles.metaItem}>💰 ₹{order.totalAmount}</span>
                      <span style={styles.metaItem}>💳 {order.paymentStatus || "Pending"}</span>
                    </div>
                  </div>

                  <div style={styles.cardActions}>
                    {order.status === "Pending" && (
                      <button 
                        style={styles.proceedBtn}
                        onClick={() => proceedToNext(order.orderId || order._id)}
                      >
                        📍 Proceed to Next Step →
                      </button>
                    )}
                    <button 
                      style={styles.viewBtn}
                      onClick={() => navigate(`/order-tracking/${order.orderId || order._id}`)}
                    >
                      📄 View Details
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles: any = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc, #eef2ff)"
  },
  
  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap" as const,
    gap: "10px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#0f172a",
    margin: 0,
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0"
  },
  refreshBtn: {
    padding: "8px 16px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#64748b",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },

  filterTabs: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    marginBottom: "20px"
  },
  filterTab: {
    padding: "6px 16px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    background: "white"
  },
  filterCount: {
    padding: "0px 6px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "600"
  },

  empty: {
    textAlign: "center" as const,
    padding: "60px 20px",
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
  },
  emptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px"
  },
  emptyText: {
    fontSize: "16px",
    color: "#64748b",
    marginBottom: "16px"
  },

  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px"
  },
  card: {
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    overflow: "hidden",
    transition: "all 0.2s",
    ":hover": {
      boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
      transform: "translateY(-2px)"
    }
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #fafafa, #f8fafc)",
    borderBottom: "1px solid #f1f5f9",
    flexWrap: "wrap" as const,
    gap: "8px"
  },
  orderIdSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap" as const
  },
  orderId: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: "14px",
    letterSpacing: "-0.5px"
  },
  orderDate: {
    color: "#64748b",
    fontSize: "13px"
  },
  orderTime: {
    color: "#94a3b8",
    fontSize: "12px"
  },

  statusBadge: {
    padding: "4px 14px",
    borderRadius: "50px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    display: "inline-block"
  },

  cardContent: {
    display: "flex",
    gap: "16px",
    padding: "16px 20px",
    alignItems: "center",
    flexWrap: "wrap" as const
  },

  imageWrapper: {
    flex: "0 0 80px",
    height: "80px",
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
    fontSize: "32px",
    color: "#94a3b8"
  },

  productDetails: {
    flex: 1,
    minWidth: "160px"
  },
  productName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    marginBottom: "6px"
  },
  productMeta: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap" as const
  },
  metaItem: {
    fontSize: "13px",
    color: "#64748b",
    background: "#f8fafc",
    padding: "2px 12px",
    borderRadius: "20px",
    fontWeight: "500"
  },

  cardActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    marginLeft: "auto" as const
  },
  proceedBtn: {
    padding: "8px 18px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.2)",
    ":hover": {
      transform: "scale(1.02)",
      boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)"
    }
  },
  viewBtn: {
    padding: "8px 18px",
    background: "#f1f5f9",
    color: "#1e293b",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
    transition: "all 0.2s",
    ":hover": {
      background: "#e2e8f0"
    }
  },

  loading: {
    textAlign: "center" as const,
    padding: "80px 20px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "16px"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  errorBox: {
    textAlign: "center" as const,
    padding: "40px",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
  },
  retryBtn: {
    marginTop: "12px",
    padding: "10px 24px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)"
  },

  shopBtn: {
    marginTop: "12px",
    padding: "10px 24px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)",
    transition: "all 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(37, 99, 235, 0.4)"
    }
  }
}

export default Orders