// ================= RFQDashboard.tsx (Buyer Side) =================
// File: buyer-app/src/pages/RFQ/RFQDashboard.tsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const RFQDashboard = () => {
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [, setUnreadTick] = useState(0) // force re-render on unread update

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  // ✅ Read unread by RFQ ID from localStorage (matches RFQDetail)
  const getUnreadCount = (rfqId: string) => {
    const stored = localStorage.getItem(`unread_rfq_${rfqId}`)
    return stored ? parseInt(stored) : 0
  }

  const fetchRFQs = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/rfq/buyer/${user._id}`)
      const data = await res.json()

      if (data.success && data.data) {
        setRfqs(data.data)
        // ✅ Cache RFQs in localStorage so Navbar can map roomId -> rfqId
        localStorage.setItem("buyer_rfqs_cache", JSON.stringify(
          data.data.map((r: any) => ({
            rfqId: r.rfqId,
            sellerId: r.sellerId,
            productId: r.items?.[0]?.productId || "general"
          }))
        ))
      } else {
        setRfqs([])
      }
    } catch (error) {
      console.error("❌ Error fetching RFQs:", error)
      setRfqs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user._id) {
      fetchRFQs()
    } else {
      setLoading(false)
    }
  }, [user._id])

  // ✅ Re-render when unread changes (from Navbar socket listener)
  useEffect(() => {
    const handler = () => setUnreadTick((t) => t + 1)
    window.addEventListener("unread-rfq-updated", handler)
    return () => window.removeEventListener("unread-rfq-updated", handler)
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
    return past.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  }

  const stats = {
    total: rfqs.length,
    pending: rfqs.filter(r => r.status === "Pending").length,
    quoted: rfqs.filter(r => r.status === "Quoted").length,
    accepted: rfqs.filter(r => r.status === "Accepted").length
  }

  const filteredRFQs = rfqs.filter(rfq => {
    if (filter !== "all" && rfq.status.toLowerCase() !== filter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const productName = rfq.items?.[0]?.productName?.toLowerCase() || ""
      const sellerName = rfq.sellerName?.toLowerCase() || ""
      const rfqId = rfq.rfqId?.toLowerCase() || ""
      return productName.includes(q) || sellerName.includes(q) || rfqId.includes(q)
    }

    return true
  })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", label: "⏳ Pending" }
      case "Quoted":
        return { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6", label: "💰 Quoted" }
      case "Accepted":
        return { bg: "#dcfce7", text: "#166534", dot: "#22c55e", label: "✅ Accepted" }
      case "Rejected":
        return { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", label: "❌ Rejected" }
      default:
        return { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af", label: status }
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your RFQs...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* ✅ HERO HEADER */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div>
            <h1 style={styles.heroTitle}>📋 My RFQs</h1>
            <p style={styles.heroSubtitle}>
              Track your quote requests and connect with sellers
            </p>
          </div>
          <button style={styles.newRfqBtn} onClick={() => navigate("/")}>
            ➕ New RFQ
          </button>
        </div>

        <div style={styles.statsGrid}>
          <div
            style={{
              ...styles.statCard,
              borderColor: filter === "all" ? "#4f46e5" : "#e2e8f0",
              background: filter === "all" ? "#eef2ff" : "rgba(255,255,255,0.98)",
              cursor: "pointer",
              transform: filter === "all" ? "scale(1.03)" : "scale(1)",
              boxShadow: filter === "all" ? "0 8px 20px rgba(79, 70, 229, 0.25)" : "none"
            }}
            onClick={() => setFilter("all")}
          >
            <div style={{ ...styles.statIcon, background: "#eef2ff", color: "#4f46e5" }}>📊</div>
            <div>
              <p style={styles.statValue}>{stats.total}</p>
              <p style={styles.statLabel}>Total RFQs</p>
            </div>
          </div>

          <div
            style={{
              ...styles.statCard,
              borderColor: filter === "pending" ? "#d97706" : "#fef3c7",
              background: filter === "pending" ? "#fef3c7" : "rgba(255,255,255,0.98)",
              cursor: "pointer",
              transform: filter === "pending" ? "scale(1.03)" : "scale(1)",
              boxShadow: filter === "pending" ? "0 8px 20px rgba(217, 119, 6, 0.25)" : "none"
            }}
            onClick={() => setFilter("pending")}
          >
            <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#d97706" }}>⏳</div>
            <div>
              <p style={styles.statValue}>{stats.pending}</p>
              <p style={styles.statLabel}>Pending</p>
            </div>
          </div>

          <div
            style={{
              ...styles.statCard,
              borderColor: filter === "quoted" ? "#2563eb" : "#dbeafe",
              background: filter === "quoted" ? "#dbeafe" : "rgba(255,255,255,0.98)",
              cursor: "pointer",
              transform: filter === "quoted" ? "scale(1.03)" : "scale(1)",
              boxShadow: filter === "quoted" ? "0 8px 20px rgba(37, 99, 235, 0.25)" : "none"
            }}
            onClick={() => setFilter("quoted")}
          >
            <div style={{ ...styles.statIcon, background: "#dbeafe", color: "#2563eb" }}>💰</div>
            <div>
              <p style={styles.statValue}>{stats.quoted}</p>
              <p style={styles.statLabel}>Quoted</p>
            </div>
          </div>

          <div
            style={{
              ...styles.statCard,
              borderColor: filter === "accepted" ? "#16a34a" : "#dcfce7",
              background: filter === "accepted" ? "#dcfce7" : "rgba(255,255,255,0.98)",
              cursor: "pointer",
              transform: filter === "accepted" ? "scale(1.03)" : "scale(1)",
              boxShadow: filter === "accepted" ? "0 8px 20px rgba(22, 163, 74, 0.25)" : "none"
            }}
            onClick={() => setFilter("accepted")}
          >
            <div style={{ ...styles.statIcon, background: "#dcfce7", color: "#16a34a" }}>✅</div>
            <div>
              <p style={styles.statValue}>{stats.accepted}</p>
              <p style={styles.statLabel}>Accepted</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SEARCH & FILTER BAR */}
      <div style={styles.searchFilterBar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by product, seller or RFQ ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>✕</button>
          )}
        </div>

        <div style={styles.filterTabs}>
          {[
            { key: "all", label: "All", count: stats.total },
            { key: "pending", label: "⏳ Pending", count: stats.pending },
            { key: "quoted", label: "💰 Quoted", count: stats.quoted },
            { key: "accepted", label: "✅ Accepted", count: stats.accepted }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                ...styles.filterTab,
                background: filter === tab.key ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "white",
                color: filter === tab.key ? "white" : "#64748b",
                borderColor: filter === tab.key ? "#2563eb" : "#e2e8f0",
                boxShadow: filter === tab.key ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "0 1px 2px rgba(0,0,0,0.04)"
              }}
            >
              {tab.label}
              <span style={{
                ...styles.filterCount,
                background: filter === tab.key ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                color: filter === tab.key ? "white" : "#64748b"
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ✅ RFQs LIST */}
      {filteredRFQs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📩</div>
          <h3 style={styles.emptyTitle}>
            {searchQuery || filter !== "all" ? "No matching RFQs found" : "No RFQs yet"}
          </h3>
          <p style={styles.emptyText}>
            {searchQuery || filter !== "all"
              ? "Try changing filters or search query"
              : "Start by requesting a quote from any product"}
          </p>
          <button onClick={() => navigate("/")} style={styles.emptyBtn}>
            🛍️ Browse Products
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredRFQs.map((rfq) => {
            const status = getStatusStyle(rfq.status)
            const hasQuote = rfq.quote?.totalQuote
            const unread = getUnreadCount(rfq.rfqId)

            return (
              <div
                key={rfq._id}
                style={styles.card}
                onClick={() => navigate(`/rfq/${rfq.rfqId}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.10)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)"
                }}
              >
                {/* LEFT: IMAGE */}
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

                  {rfq.status === "Quoted" && (
                    <span style={styles.newBadge}>NEW</span>
                  )}
                </div>

                {/* MIDDLE: DETAILS */}
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <div style={styles.titleSection}>
                      <h3 style={styles.productName}>
                        {rfq.items?.[0]?.productName || "Product"}
                      </h3>
                      <p style={styles.rfqId}>#{rfq.rfqId}</p>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      background: status.bg,
                      color: status.text
                    }}>
                      <span style={{
                        ...styles.statusDot,
                        background: status.dot
                      }}></span>
                      {status.label}
                    </span>
                  </div>

                  <div style={styles.metaGrid}>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>🏢 Seller</span>
                      <span style={styles.metaValue}>{rfq.sellerName || "N/A"}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>📦 Quantity</span>
                      <span style={styles.metaValue}>
                        {rfq.items?.[0]?.quantity || 0} units
                      </span>
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>💰 Total</span>
                      <span style={styles.metaValue}>₹{rfq.totalAmount?.toLocaleString() || 0}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>🕐 Created</span>
                      <span style={styles.metaValue}>{timeAgo(rfq.createdAt)}</span>
                    </div>
                  </div>

                  {/* ✅ Unread chat text with box */}
                  {unread > 0 && (
                    <div style={styles.unreadBox}>
                      <span style={styles.unreadIcon}>💬</span>
                      <span style={styles.unreadTextInline}>
                        You have <b>{unread}</b> unread message{unread > 1 ? "s" : ""} from this seller
                      </span>
                    </div>
                  )}

                  {hasQuote && (
                    <div style={styles.quotePreview}>
                      <div style={styles.quotePreviewLeft}>
                        <span style={styles.quotePreviewIcon}>💰</span>
                        <div>
                          <p style={styles.quotePreviewLabel}>Quote Received</p>
                          <p style={styles.quotePreviewValue}>
                            ₹{rfq.quote.totalQuote?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div style={styles.quotePreviewRight}>
                        {rfq.quote.deliveryDate && (
                          <span style={styles.quoteMeta}>
                            📅 {new Date(rfq.quote.deliveryDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short"
                            })}
                          </span>
                        )}
                        <span style={styles.quoteMeta}>
                          📈 Advance: ₹{rfq.quote.advanceAmount?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: ACTION */}
                <div style={styles.actionSection}>
                  <div style={styles.actionArrow}>→</div>
                  <p style={styles.actionText}>View Details</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredRFQs.length > 0 && (
        <p style={styles.resultCount}>
          Showing {filteredRFQs.length} of {rfqs.length} RFQs
        </p>
      )}
    </div>
  )
}

// ================= STYLES =================

const styles: any = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 20px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)"
  },
  loadingWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 20px"
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "15px"
  },
  heroSection: {
    background: "linear-gradient(135deg, #1e293b 0%, #4c1d95 100%)",
    padding: "32px",
    borderRadius: "24px",
    color: "white",
    marginBottom: "24px",
    boxShadow: "0 20px 60px rgba(30, 41, 59, 0.25)",
    position: "relative" as const,
    overflow: "hidden"
  },
  heroContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "20px",
    marginBottom: "28px",
    position: "relative" as const,
    zIndex: 1
  },
  heroTitle: {
    fontSize: "32px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  heroSubtitle: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.75)",
    marginTop: "6px"
  },
  newRfqBtn: {
    padding: "12px 24px",
    background: "white",
    color: "#1e293b",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    transition: "all 0.2s ease"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "12px",
    position: "relative" as const,
    zIndex: 1
  },
  statCard: {
    background: "rgba(255,255,255,0.98)",
    padding: "16px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "2px solid transparent",
    transition: "all 0.25s ease"
  },
  statIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "600"
  },
  statValue: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    lineHeight: 1
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    margin: "4px 0 0 0",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px"
  },
  searchFilterBar: {
    background: "white",
    padding: "16px 20px",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px"
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "10px 16px",
    transition: "all 0.2s ease"
  },
  searchIcon: {
    fontSize: "18px",
    color: "#64748b"
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#0f172a"
  },
  clearSearchBtn: {
    background: "#e2e8f0",
    border: "none",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  filterTabs: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const
  },
  filterTab: {
    padding: "8px 16px",
    borderRadius: "50px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease"
  },
  filterCount: {
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    minWidth: "22px",
    textAlign: "center" as const
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px"
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    cursor: "pointer",
    display: "flex",
    gap: "20px",
    alignItems: "center",
    transition: "all 0.25s ease"
  },
  imageWrapper: {
    flexShrink: 0,
    width: "100px",
    height: "100px",
    borderRadius: "14px",
    overflow: "hidden" as const,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const
  },
  noImage: {
    fontSize: "40px",
    color: "#94a3b8"
  },
  newBadge: {
    position: "absolute" as const,
    top: "6px",
    right: "6px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "white",
    fontSize: "9px",
    fontWeight: "800",
    padding: "3px 8px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
  },
  cardContent: {
    flex: 1,
    minWidth: 0
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap" as const
  },
  titleSection: {
    flex: 1,
    minWidth: 0
  },
  productName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  rfqId: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "4px 0 0 0",
    fontFamily: "monospace"
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "50px",
    fontSize: "12px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap" as const
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    display: "inline-block"
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "10px",
    marginBottom: "12px"
  },
  metaItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px"
  },
  metaLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px"
  },
  metaValue: {
    fontSize: "13px",
    color: "#0f172a",
    fontWeight: "600"
  },
  unreadBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
    padding: "8px 14px",
    borderRadius: "10px",
    marginBottom: "12px",
    border: "1px solid #fca5a5",
    boxShadow: "0 2px 6px rgba(220, 38, 38, 0.08)"
  },
  unreadIcon: {
    fontSize: "16px"
  },
  unreadTextInline: {
    fontSize: "13px",
    color: "#991b1b",
    fontWeight: "500"
  },
  quotePreview: {
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #bfdbfe",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap" as const
  },
  quotePreviewLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  quotePreviewIcon: {
    fontSize: "22px"
  },
  quotePreviewLabel: {
    fontSize: "11px",
    color: "#1e40af",
    fontWeight: "700",
    margin: 0,
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px"
  },
  quotePreviewValue: {
    fontSize: "16px",
    color: "#1e3a8a",
    fontWeight: "800",
    margin: "2px 0 0 0"
  },
  quotePreviewRight: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const
  },
  quoteMeta: {
    fontSize: "11px",
    color: "#1e40af",
    fontWeight: "600",
    background: "rgba(255,255,255,0.7)",
    padding: "4px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap" as const
  },
  actionSection: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    minWidth: "60px",
    opacity: 0.7
  },
  actionArrow: {
    fontSize: "24px",
    color: "#2563eb",
    fontWeight: "bold"
  },
  actionText: {
    fontSize: "10px",
    color: "#64748b",
    fontWeight: "600",
    margin: 0,
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px"
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "80px 20px",
    background: "white",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
  },
  emptyIcon: {
    fontSize: "64px",
    display: "block",
    marginBottom: "20px",
    opacity: 0.5
  },
  emptyTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0"
  },
  emptyText: {
    fontSize: "15px",
    color: "#64748b",
    margin: "0 0 24px 0"
  },
  emptyBtn: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)"
  },
  resultCount: {
    textAlign: "center" as const,
    marginTop: "24px",
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "500"
  }
}

export default RFQDashboard