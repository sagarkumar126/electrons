 import { useEffect, useState } from "react"
import { adminApi } from "../../api/admin.api"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { formatCurrency, formatDateTime, getStatusColor } from "../../utils/format"

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await adminApi.getAllOrders()
      setOrders(res.data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    if (!confirm(`Update order status to "${status}"?`)) return
    try {
      await adminApi.updateOrderStatus(orderId, status)
      fetchOrders()
      alert(`✅ Order status updated to "${status}"!`)
    } catch (error) {
      alert("❌ Failed to update order status")
    }
  }

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status.toLowerCase() === filter)

  if (loading) {
    return <LoadingSpinner message="Loading orders..." />
  }

  return (
    <div>
      <div style={header}>
        <h1 style={title}>🛒 Orders</h1>
        <p style={subtitle}>View and manage all orders</p>
      </div>

      <div style={filterContainer}>
        {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
          <button
            key={status}
            style={{ ...filterBtn, background: filter === status ? "#2563eb" : "white", color: filter === status ? "white" : "#1e293b" }}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({orders.filter(o => filter === "all" || o.status.toLowerCase() === status).length})
          </button>
        ))}
      </div>

      <div style={tableWrapper}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Order ID</th>
              <th style={th}>Product</th>
              <th style={th}>Buyer</th>
              <th style={th}>Amount</th>
              <th style={th}>Status</th>
              <th style={th}>Payment</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id} style={tr}>
                <td style={td}>
                  <span style={orderIdStyle}>#{order.orderId}</span>
                </td>
                <td style={td}>{order.productName}</td>
                <td style={td}>{order.buyerName}</td>
                <td style={td}>{formatCurrency(order.totalAmount)}</td>
                <td style={td}>
                  <span style={{ ...statusBadge, background: getStatusColor(order.status) }}>
                    {order.status}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ ...paymentBadge, background: order.paymentStatus === "Paid" ? "#22c55e" : "#f59e0b" }}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td style={td}>
                  <div style={actionButtons}>
                    {["Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                      <button
                        key={status}
                        style={{ ...actionBtn, background: getStatusColor(status), opacity: order.status === status ? 0.5 : 1 }}
                        onClick={() => updateStatus(order.orderId, status)}
                        disabled={order.status === status}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const header = {
  marginBottom: "24px"
}

const title = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: 0
}

const subtitle = {
  fontSize: "14px",
  color: "#64748b",
  marginTop: "4px"
}

const filterContainer = {
  display: "flex",
  gap: "8px",
  marginBottom: "20px",
  flexWrap: "wrap" as const
}

const filterBtn = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.2s ease"
}

const tableWrapper = {
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  overflow: "auto" as const
}

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "800px"
}

const th = {
  padding: "12px 16px",
  textAlign: "left" as const,
  borderBottom: "1px solid #e2e8f0",
  fontWeight: "600",
  color: "#64748b",
  fontSize: "12px",
  textTransform: "uppercase" as const
}

const td = {
  padding: "12px 16px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "14px",
  color: "#0f172a"
}

const tr = {
  transition: "all 0.2s ease"
}

const orderIdStyle = {
  fontWeight: "600",
  color: "#0f172a"
}

const statusBadge = {
  padding: "4px 12px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold",
  color: "white"
}

const paymentBadge = {
  padding: "4px 12px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold",
  color: "white"
}

const actionButtons = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap" as const
}

const actionBtn = {
  padding: "4px 10px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "bold",
  color: "white",
  transition: "all 0.2s ease"
}

export default Orders
