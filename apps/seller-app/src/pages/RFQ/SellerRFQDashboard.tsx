// seller-app/src/pages/RFQ/SellerRFQDashboard.tsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const SellerRFQDashboard = () => {
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [, forceUpdate] = useState(0)

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  // ✅ Is RFQ opened by seller?
  const isRfqOpened = (rfqId: string) => {
    return !!localStorage.getItem(`rfq_opened_${rfqId}`)
  }

  // ✅ Unread message count for a buyer
  const getUnreadCount = (buyerId: string) => {
    if (!buyerId) return 0
    const val = parseInt(localStorage.getItem(`unread_seller_${buyerId}`) || "0")
    return isNaN(val) ? 0 : val
  }

  const fetchRFQs = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching RFQs for seller:", user._id)

      const res = await fetch(`https://electrons-1.onrender.com/api/rfq/seller/${user._id}`)
      const data = await res.json()
      console.log("📦 RFQs Response:", data)

      if (data.success) {
        setRfqs(data.data || [])

        // ✅ Cache RFQs for layout count
        localStorage.setItem("seller_rfqs_cache", JSON.stringify(
          data.data.map((r: any) => ({
            rfqId: r.rfqId,
            buyerId: r.buyerId
          }))
        ))
        window.dispatchEvent(new Event("rfqs-updated"))
      } else {
        setRfqs([])
      }
    } catch (error) {
      console.error("Error fetching RFQs:", error)
      setRfqs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user._id) fetchRFQs()
  }, [user._id])

  // ✅ Re-render on unread/opened changes
  useEffect(() => {
    const handler = () => forceUpdate(t => t + 1)
    window.addEventListener("unread-seller-updated", handler)
    window.addEventListener("rfqs-updated", handler)
    return () => {
      window.removeEventListener("unread-seller-updated", handler)
      window.removeEventListener("rfqs-updated", handler)
    }
  }, [])

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

  const filteredRFQs = filter === "all"
    ? rfqs
    : rfqs.filter(r => r.status.toLowerCase() === filter)

  if (loading) {
    return <div style={styles.loading}>Loading RFQs...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📩 RFQs Received</h2>
        <span style={styles.count}>{rfqs.length} RFQs</span>
      </div>

      <div style={styles.filterContainer}>
        {["all", "pending", "quoted", "accepted", "rejected"].map((status) => (
          <button
            key={status}
            style={filter === status ? styles.filterActive : styles.filterBtn}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            ({rfqs.filter(r => {
              if (status === "all") return true
              return r.status.toLowerCase() === status
            }).length})
          </button>
        ))}
      </div>

      {filteredRFQs.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📩</span>
          <p style={styles.emptyText}>No RFQs received yet</p>
          <p style={styles.emptySubtext}>When buyers send RFQs, they'll appear here.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredRFQs.map((rfq) => {
            const opened = isRfqOpened(rfq.rfqId)
            const unread = getUnreadCount(rfq.buyerId)

            return (
              <div
                key={rfq._id}
                style={{
                  ...styles.card,
                  borderLeft: !opened ? "5px solid #ef4444" : "1px solid #e2e8f0"
                }}
              >
                <div style={styles.cardInner}>
                  <div style={styles.imageWrapper}>
                    {rfq.items?.[0]?.productImage ? (
                      <img
                        src={rfq.items[0].productImage}
                        alt={rfq.items[0].productName}
                        style={styles.productImage}
                      />
                    ) : (
                      <div style={styles.noImage}>📦</div>
                    )}
                  </div>

                  <div style={styles.cardContent}>
                    {/* ✅ Badges row */}
                    <div style={styles.badgesRow}>
                      {!opened && (
                        <span style={styles.newBadge}>🔴 NEW</span>
                      )}
                      {unread > 0 && (
                        <span style={styles.unreadBadge}>
                          💬 {unread} unread message{unread > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div style={styles.cardHeader}>
                      <div>
                        <h3 style={styles.productName}>
                          {rfq.items?.[0]?.productName || "Product"}
                        </h3>
                        <p style={styles.buyerName}>👤 {rfq.buyerName}</p>
                      </div>
                      <span style={{
                        ...styles.statusBadge,
                        background: rfq.status === "Pending" ? "#fef3c7" :
                          rfq.status === "Quoted" ? "#dbeafe" :
                            rfq.status === "Accepted" ? "#dcfce7" : "#fee2e2",
                        color: rfq.status === "Pending" ? "#92400e" :
                          rfq.status === "Quoted" ? "#1e40af" :
                            rfq.status === "Accepted" ? "#166534" : "#991b1b"
                      }}>
                        {rfq.status === "Pending" ? "⏳ Pending" :
                          rfq.status === "Quoted" ? "💰 Quoted" :
                            rfq.status === "Accepted" ? "✅ Accepted" :
                              rfq.status === "Rejected" ? "❌ Rejected" : rfq.status}
                      </span>
                    </div>

                    <div style={styles.details}>
                      <p><strong>Items:</strong> {rfq.items?.length || 1}</p>
                      <p><strong>Total:</strong> ₹{rfq.totalAmount}</p>
                      <p style={styles.timeAgo}>🕐 {timeAgo(rfq.createdAt)}</p>
                    </div>

                    <div style={styles.actions}>
                      <button
                        style={styles.viewBtn}
                        onClick={() => navigate(`/seller/rfq/${rfq.rfqId}`)}
                      >
                        📄 View Details
                      </button>

                      {(rfq.status === "Pending" || rfq.status === "pending") && (
                        <button
                          style={styles.quoteBtn}
                          onClick={() => navigate(`/seller/rfq/${rfq.rfqId}`)}
                        >
                          💰 Send Quote
                        </button>
                      )}
                    </div>
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
  container: { maxWidth: "1000px", margin: "0 auto", padding: "20px", minHeight: "100vh", background: "#f1f5f9" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" as const, gap: "10px" },
  title: { fontSize: "24px", fontWeight: "bold", color: "#0f172a", margin: 0 },
  count: { padding: "4px 16px", background: "white", borderRadius: "20px", fontSize: "14px", color: "#64748b", border: "1px solid #e2e8f0", fontWeight: "500" },
  filterContainer: { display: "flex", gap: "8px", flexWrap: "wrap" as const, marginBottom: "20px" },
  filterBtn: { padding: "6px 14px", background: "white", border: "1px solid #d1d5db", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "500" },
  filterActive: { padding: "6px 14px", background: "#2563eb", color: "white", border: "1px solid #2563eb", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "500" },
  list: { display: "flex", flexDirection: "column" as const, gap: "16px" },
  card: { background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardInner: { display: "flex", gap: "16px", alignItems: "flex-start" as const },
  imageWrapper: { flex: "0 0 80px", height: "80px", borderRadius: "8px", overflow: "hidden" as const, background: "#f8fafc", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" },
  productImage: { width: "100%", height: "100%", objectFit: "cover" as const },
  noImage: { fontSize: "32px", color: "#94a3b8" },
  cardContent: { flex: 1, minWidth: 0 },
  badgesRow: { display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" as const },
  newBadge: { background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)", letterSpacing: "0.5px" },
  unreadBadge: { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", boxShadow: "0 2px 8px rgba(124, 58, 237, 0.4)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap" as const, gap: "8px" },
  productName: { fontSize: "18px", fontWeight: "bold", color: "#0f172a", margin: 0 },
  buyerName: { fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" },
  statusBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  details: { marginBottom: "10px" },
  timeAgo: { fontSize: "13px", color: "#64748b", margin: "4px 0", display: "flex", alignItems: "center", gap: "4px" },
  actions: { display: "flex", gap: "10px", flexWrap: "wrap" as const },
  viewBtn: { padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" },
  quoteBtn: { padding: "8px 16px", background: "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", boxShadow: "0 2px 8px rgba(34, 197, 94, 0.2)" },
  loading: { textAlign: "center" as const, padding: "60px", fontSize: "18px", color: "#64748b" },
  empty: { textAlign: "center" as const, padding: "60px 20px", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" },
  emptyIcon: { fontSize: "48px", display: "block", marginBottom: "16px" },
  emptyText: { fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" },
  emptySubtext: { fontSize: "14px", color: "#94a3b8", margin: "0" }
}

export default SellerRFQDashboard