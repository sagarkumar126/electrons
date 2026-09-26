// ================= SellerOrders.tsx (Full Quote Breakdown) =================
// File: seller-app/src/pages/SellerOrders/SellerOrders.tsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const SellerOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`https://electrons-1.onrender.com/api/orders/seller/${user._id}`)
      const data = await res.json()
      console.log("📦 Orders data:", data)
      setOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user._id) {
      fetchOrders()
    }
  }, [user._id])

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!confirm(`Update order status to "${status}"?`)) return

    try {
      const res = await fetch(`https://electrons-1.onrender.com/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        alert(`✅ Order status updated to "${status}"`)
        fetchOrders()
      } else {
        alert("❌ Failed to update order status")
      }
    } catch (error) {
      console.error("Error updating order:", error)
      alert("❌ Server error")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "#f59e0b"
      case "Confirmed": return "#3b82f6"
      case "Processing": return "#8b5cf6"
      case "Shipped": return "#06b6d4"
      case "Delivered": return "#22c55e"
      case "Cancelled": return "#ef4444"
      default: return "#6b7280"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending": return "⏳"
      case "Confirmed": return "✅"
      case "Processing": return "⚙️"
      case "Shipped": return "🚚"
      case "Delivered": return "📦"
      case "Cancelled": return "❌"
      default: return "📋"
    }
  }

  // ============================================
  // ✅ Helper functions — get quote breakdown from order
  // ============================================

  const getQuoteField = (order: any, field: string, fallback: number = 0) => {
    // Try multiple locations
    if (order?.quoteData?.[field] !== undefined && order.quoteData[field] !== null) {
      return Number(order.quoteData[field]) || fallback
    }
    if (order?.[field] !== undefined && order[field] !== null) {
      return Number(order[field]) || fallback
    }
    if (order?.quote?.[field] !== undefined && order.quote[field] !== null) {
      return Number(order.quote[field]) || fallback
    }
    return fallback
  }

  const getAdvancePercent = (order: any) => getQuoteField(order, "advancePercent", 40)
  const getRemainingPercent = (order: any) => getQuoteField(order, "remainingPercent", 60)

  const getAdvanceAmount = (order: any) => {
    const stored = getQuoteField(order, "advanceAmount", 0)
    if (stored > 0) return stored
    const total = order.totalAmount || 0
    const pct = getAdvancePercent(order)
    return (total * pct) / 100
  }

  const getRemainingAmount = (order: any) => {
    const stored = getQuoteField(order, "remainingAmount", 0)
    if (stored > 0) return stored
    const total = order.totalAmount || 0
    const pct = getRemainingPercent(order)
    return (total * pct) / 100
  }

  const getOriginalTotal = (order: any) => getQuoteField(order, "originalTotal", 0)
  const getBulkAmount = (order: any) => getQuoteField(order, "bulkAmount", 0)
  const getBulkGstAmount = (order: any) => getQuoteField(order, "bulkGstAmount", 0)

  // ✅ Check if order has quote breakdown data
  const hasFullQuoteBreakdown = (order: any) => {
    return !!(
      getOriginalTotal(order) > 0 ||
      getBulkAmount(order) > 0 ||
      getBulkGstAmount(order) > 0 ||
      order?.quoteData ||
      order?.quote
    )
  }

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter(o => o.status.toLowerCase() === filter)

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading orders...</div>
  }

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={title}>📋 Orders</h2>
        <div style={filterContainer}>
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              style={filter === status ? filterActive : filterBtn}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({orders.filter(o => filter === "all" || o.status.toLowerCase() === status).length})
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div style={empty}>
          <p>No orders found</p>
        </div>
      ) : (
        <div style={list}>
          {filteredOrders.map((order) => {
            const advanceAmt = getAdvanceAmount(order)
            const remainingAmt = getRemainingAmount(order)
            const advancePct = getAdvancePercent(order)
            const remainingPct = getRemainingPercent(order)

            const originalTotal = getOriginalTotal(order)
            const bulkAmount = getBulkAmount(order)
            const bulkGstAmount = getBulkGstAmount(order)
            const hasQuote = hasFullQuoteBreakdown(order)

            return (
              <div key={order._id} style={card}>
                <div
                  style={cardHeader}
                  onClick={() => toggleExpand(order.orderId || order._id)}
                >
                  <div style={headerLeft}>
                    <span style={orderId}>#{order.orderId || order._id}</span>
                    <span style={productName}>{order.productName}</span>
                  </div>
                  <div style={headerRight}>
                    <span style={orderDate}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{
                      ...statusBadge,
                      background: getStatusColor(order.status)
                    }}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    <span style={expandIcon}>
                      {expandedOrder === (order.orderId || order._id) ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {expandedOrder === (order.orderId || order._id) && (
                  <div style={expandedContent}>
                    <div style={detailsGrid}>
                      <div style={detailItem}>
                        <span style={detailLabel}>Order ID</span>
                        <span style={detailValue}>{order.orderId || order._id}</span>
                      </div>
                      <div style={detailItem}>
                        <span style={detailLabel}>Buyer</span>
                        <span style={detailValue}>{order.buyerName || "Guest"}</span>
                      </div>
                      <div style={detailItem}>
                        <span style={detailLabel}>Quantity</span>
                        <span style={detailValue}>{order.quantity} units</span>
                      </div>
                      <div style={detailItem}>
                        <span style={detailLabel}>Total Amount</span>
                        <span style={detailValue}>₹{order.totalAmount}</span>
                      </div>
                      <div style={detailItem}>
                        <span style={detailLabel}>Payment Status</span>
                        <span style={{
                          ...detailValue,
                          color: order.paymentStatus === "Paid" ? "#22c55e" : "#f59e0b",
                          fontWeight: "bold"
                        }}>
                          {order.paymentStatus === "Paid" ? "✅ Paid" : "⏳ Pending"}
                        </span>
                      </div>
                      <div style={detailItem}>
                        <span style={detailLabel}>Order Date</span>
                        <span style={detailValue}>{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={detailItem}>
                        <span style={detailLabel}>Last Updated</span>
                        <span style={detailValue}>{new Date(order.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* ✅ FULL QUOTE BREAKDOWN — Original + Bulk + GST + Advance + Remaining */}
                    {hasQuote && (
                      <div style={quoteBreakdownBox}>
                        <h4 style={quoteBreakdownTitle}>📊 Quote Breakdown</h4>

                        {/* Original Pricing */}
                        {originalTotal > 0 && (
                          <>
                            <div style={quoteGroupLabel}>🏷️ Original Pricing</div>
                            <div style={quoteRow}>
                              <span style={quoteLabel}>Original Total</span>
                              <span style={quoteValue}>₹{originalTotal.toFixed(2)}</span>
                            </div>
                          </>
                        )}

                        {/* Bulk Pricing */}
                        {(bulkAmount > 0 || bulkGstAmount > 0) && (
                          <>
                            <div style={quoteGroupLabel}>📦 Bulk Pricing</div>
                            {bulkAmount > 0 && (
                              <div style={quoteRow}>
                                <span style={quoteLabel}>Bulk Amount</span>
                                <span style={{ ...quoteValue, color: "#22c55e", fontWeight: "bold" }}>
                                  ₹{bulkAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {bulkGstAmount > 0 && (
                              <div style={quoteRow}>
                                <span style={quoteLabel}>Total Bulk (18% GST)</span>
                                <span style={{ ...quoteValue, color: "#7c3aed", fontWeight: "bold" }}>
                                  ₹{bulkGstAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Final */}
                        <div style={quoteGroupLabel}>💵 Final</div>
                        <div style={{
                          ...quoteRow,
                          borderTop: "2px solid #e2e8f0",
                          paddingTop: "8px",
                          marginTop: "4px"
                        }}>
                          <span style={{ ...quoteLabel, fontWeight: "bold" }}>Price to Pay</span>
                          <span style={{ ...quoteValue, color: "#2563eb", fontSize: "16px", fontWeight: "bold" }}>
                            ₹{Number(order.totalAmount || 0).toFixed(2)}
                          </span>
                        </div>
                        <div style={quoteRow}>
                          <span style={quoteLabel}>📈 Advance ({advancePct}%)</span>
                          <span style={{ ...quoteValue, color: "#f59e0b" }}>
                            ₹{advanceAmt.toFixed(2)}
                          </span>
                        </div>
                        <div style={quoteRow}>
                          <span style={quoteLabel}>📉 Remaining ({remainingPct}%)</span>
                          <span style={{ ...quoteValue, color: "#ef4444", fontWeight: "bold" }}>
                            ₹{remainingAmt.toFixed(2)}
                          </span>
                        </div>

                        {/* Payment Status Line */}
                        <div style={{
                          ...quoteRow,
                          borderBottom: "none",
                          marginTop: "6px",
                          paddingTop: "8px",
                          borderTop: "1px dashed #e2e8f0"
                        }}>
                          <span style={quoteLabel}>Payment Status</span>
                          <span style={{
                            ...quoteValue,
                            color: order.paymentStatus === "Paid" ? "#22c55e" : "#f59e0b",
                            fontWeight: "bold"
                          }}>
                            {order.paymentStatus === "Paid"
                              ? `✅ Advance Paid - ₹${advanceAmt.toFixed(2)}`
                              : `⏳ Pending - ₹${advanceAmt.toFixed(2)} (Advance)`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tracking Timeline */}
                    {order.tracking && order.tracking.length > 0 && (
                      <div style={timelineContainer}>
                        <h4 style={timelineTitle}>📌 Tracking Timeline</h4>
                        <div style={timeline}>
                          {order.tracking.map((event: any, index: number) => (
                            <div key={index} style={timelineItem}>
                              <div style={timelineDot}></div>
                              <div style={timelineContent}>
                                <div style={timelineStatus}>{event.status}</div>
                                <div style={timelineDate}>
                                  {new Date(event.timestamp).toLocaleString()}
                                </div>
                                {event.note && (
                                  <div style={timelineNote}>{event.note}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={actionsContainer}>
                      <h4 style={actionsTitle}>⚡ Update Status</h4>
                      <div style={actionButtons}>
                        {["Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                          <button
                            key={status}
                            style={{
                              ...statusBtn,
                              background: getStatusColor(status),
                              opacity: order.status === status ? 0.5 : 1,
                              cursor: order.status === status ? "default" : "pointer"
                            }}
                            onClick={() => updateOrderStatus(order.orderId || order._id, status)}
                            disabled={order.status === status}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={actionRow}>
                      <button
                        style={invoiceBtn}
                        onClick={() => window.open(`https://electrons-1.onrender.com/api/invoice/${order.orderId}`, '_blank')}
                      >
                        📄 Download Invoice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ================= STYLES =================

const container = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "20px",
  minHeight: "100vh",
  background: "#f1f5f9"
}

const header = { marginBottom: "20px" }

const title = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#0f172a",
  marginBottom: "15px"
}

const filterContainer = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const
}

const filterBtn = {
  padding: "6px 16px",
  background: "white",
  border: "1px solid #d1d5db",
  borderRadius: "20px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
  color: "#1e293b"
}

const filterActive = {
  padding: "6px 16px",
  background: "#2563eb",
  color: "white",
  border: "1px solid #2563eb",
  borderRadius: "20px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500"
}

const empty = {
  textAlign: "center" as const,
  padding: "60px",
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e2e8f0"
}

const list = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px"
}

const card = {
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  overflow: "hidden"
}

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  cursor: "pointer",
  transition: "all 0.2s",
  borderBottom: "1px solid #f1f5f9"
}

const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
}

const orderId = {
  fontWeight: "bold",
  color: "#0f172a",
  fontSize: "14px"
}

const productName = {
  color: "#1e293b",
  fontSize: "14px"
}

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
}

const orderDate = {
  color: "#94a3b8",
  fontSize: "13px"
}

const statusBadge = {
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
  color: "white"
}

const expandIcon = {
  color: "#94a3b8",
  fontSize: "14px",
  marginLeft: "8px"
}

const expandedContent = {
  padding: "20px",
  borderTop: "1px solid #f1f5f9"
}

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "12px",
  marginBottom: "20px"
}

const detailItem = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "2px"
}

const detailLabel = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#94a3b8",
  textTransform: "uppercase" as const
}

const detailValue = {
  fontSize: "14px",
  color: "#0f172a",
  fontWeight: "500"
}

// ✅ QUOTE BREAKDOWN STYLES
const quoteBreakdownBox = {
  background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
  padding: "16px 20px",
  borderRadius: "12px",
  border: "1px solid #bae6fd",
  marginBottom: "16px"
}

const quoteBreakdownTitle = {
  fontSize: "15px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: "0 0 10px 0"
}

const quoteGroupLabel = {
  fontSize: "11px",
  fontWeight: 800,
  color: "#7c3aed",
  letterSpacing: "0.5px",
  textTransform: "uppercase" as const,
  marginTop: 12,
  marginBottom: 6
}

const quoteRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "5px 0",
  borderBottom: "1px dashed #cbd5e1",
  fontSize: "13px"
}

const quoteLabel = {
  color: "#64748b"
}

const quoteValue = {
  fontWeight: "500",
  color: "#0f172a"
}

const timelineContainer = {
  marginBottom: "20px"
}

const timelineTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: "12px"
}

const timeline = {
  paddingLeft: "20px",
  borderLeft: "2px solid #e2e8f0"
}

const timelineItem = {
  display: "flex",
  gap: "15px",
  marginBottom: "15px"
}

const timelineDot = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: "#2563eb",
  marginTop: "4px",
  flexShrink: 0,
  marginLeft: "-26px"
}

const timelineContent = { flex: 1 }

const timelineStatus = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#0f172a"
}

const timelineDate = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "2px"
}

const timelineNote = {
  fontSize: "13px",
  color: "#64748b",
  marginTop: "4px"
}

const actionsContainer = { marginBottom: "20px" }

const actionsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: "10px"
}

const actionButtons = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const
}

const statusBtn = {
  padding: "6px 16px",
  borderRadius: "20px",
  border: "none",
  color: "white",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer"
}

const actionRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const
}

const invoiceBtn = {
  padding: "8px 20px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "14px"
}

export default SellerOrders