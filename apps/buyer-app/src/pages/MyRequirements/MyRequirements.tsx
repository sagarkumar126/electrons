// ================= MyRequirements.tsx (Buyer Side) - LIST ONLY =================
// File: buyer-app/src/pages/MyRequirements/MyRequirements.tsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"

// ✅ Socket for live quote updates
const socket = io("http://localhost:5000")

const MyRequirements = () => {
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [, setUnreadTick] = useState(0)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const getUnread = (sellerId: string) => {
    if (!sellerId) return 0
    const stored = localStorage.getItem(`unread_requirement_${sellerId}`)
    return stored ? parseInt(stored) : 0
  }

  useEffect(() => {
    if (user._id) {
      fetchRequirements()
    } else {
      navigate("/login")
    }

    // ✅ Re-render when unread changes
    const onUnread = () => setUnreadTick(t => t + 1)
    window.addEventListener("unread-requirement-updated", onUnread)
    return () => window.removeEventListener("unread-requirement-updated", onUnread)
  }, [user._id])

  // ✅ Listen for quote edits from seller — auto-refresh list
  useEffect(() => {
    const handleQuoteUpdated = (data: any) => {
      console.log("🔔 Quote updated by seller:", data)
      fetchRequirements()
    }

    const handleNewQuote = (data: any) => {
      console.log("🔔 New quote received:", data)
      fetchRequirements()
    }

    socket.on("quote-updated", handleQuoteUpdated)
    socket.on("new-quote-on-requirement", handleNewQuote)

    return () => {
      socket.off("quote-updated", handleQuoteUpdated)
      socket.off("new-quote-on-requirement", handleNewQuote)
    }
  }, [user._id])

  const fetchRequirements = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/buyer-requirement/buyer/${user._id}`)
      const data = await res.json()
      if (data.success) {
        setRequirements(data.data)
      }
    } catch (error) {
      console.error("Error fetching requirements:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return { bg: "linear-gradient(135deg,#f59e0b,#d97706)", label: "⏳ Pending" }
      case "Verified":
        return { bg: "linear-gradient(135deg,#3b82f6,#2563eb)", label: "✅ Verified" }
      case "Quoted":
        return { bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)", label: "💰 Quoted" }
      case "Closed":
        return { bg: "linear-gradient(135deg,#22c55e,#16a34a)", label: "🔒 Closed" }
      default:
        return { bg: "linear-gradient(135deg,#6b7280,#4b5563)", label: status }
    }
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  }

  const stats = {
    total: requirements.length,
    pending: requirements.filter(r => r.status === "Pending").length,
    quoted: requirements.filter(r => r.status === "Quoted").length,
    closed: requirements.filter(r => r.status === "Closed").length,
    totalQuotes: requirements.reduce((sum, r) => sum + (r.quotes?.length || 0), 0)
  }

  const filteredRequirements = requirements.filter(req => {
    if (filter !== "all" && req.status.toLowerCase() !== filter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const productName = req.productName?.toLowerCase() || ""
      const category = req.category?.toLowerCase() || ""
      const desc = req.description?.toLowerCase() || ""
      const reqId = req.requirementId?.toLowerCase() || ""
      return productName.includes(q) || category.includes(q) || desc.includes(q) || reqId.includes(q)
    }
    return true
  })

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your requirements...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div>
            <h1 style={styles.heroTitle}>📋 My Requirements</h1>
            <p style={styles.heroSubtitle}>
              Manage your posted requirements and get quotes from sellers
            </p>
          </div>
          <button
            style={styles.newReqBtn}
            onClick={() => navigate("/post-requirement")}
          >
            ➕ New Requirement
          </button>
        </div>

        <div style={styles.statsGrid}>
          {[
            { key: "all", label: "Total", value: stats.total, icon: "📊", color: "#4f46e5", bg: "#eef2ff" },
            { key: "pending", label: "Pending", value: stats.pending, icon: "⏳", color: "#d97706", bg: "#fef3c7" },
            { key: "quoted", label: "Quoted", value: stats.quoted, icon: "💰", color: "#8b5cf6", bg: "#ede9fe" },
            { key: "closed", label: "Closed", value: stats.closed, icon: "🔒", color: "#16a34a", bg: "#dcfce7" }
          ].map(s => (
            <div
              key={s.key}
              style={{
                ...styles.statCard,
                borderColor: filter === s.key ? s.color : "transparent",
                background: filter === s.key ? s.bg : "rgba(255,255,255,0.98)",
                cursor: "pointer",
                transform: filter === s.key ? "scale(1.03)" : "scale(1)",
                boxShadow: filter === s.key ? `0 8px 20px ${s.color}40` : "none"
              }}
              onClick={() => setFilter(s.key)}
            >
              <div style={{ ...styles.statIcon, background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <p style={styles.statValue}>{s.value}</p>
                <p style={styles.statLabel}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.searchFilterBar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by product, category or requirement ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>
              ✕
            </button>
          )}
        </div>

        <div style={styles.filterTabs}>
          {[
            { key: "all", label: "All", count: stats.total },
            { key: "pending", label: "⏳ Pending", count: stats.pending },
            { key: "quoted", label: "💰 Quoted", count: stats.quoted },
            { key: "closed", label: "🔒 Closed", count: stats.closed }
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

      {filteredRequirements.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <h3 style={styles.emptyTitle}>
            {searchQuery || filter !== "all" ? "No matching requirements" : "No requirements yet"}
          </h3>
          <p style={styles.emptyText}>
            {searchQuery || filter !== "all"
              ? "Try changing filters or search query"
              : "Post your first requirement to get quotes from sellers"}
          </p>
          <button onClick={() => navigate("/post-requirement")} style={styles.emptyBtn}>
            📝 Post Requirement
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredRequirements.map((req) => {
            const status = getStatusStyle(req.status)
            const quoteCount = req.quotes?.length || 0
            const unreadTotal = (req.quotes || []).reduce(
              (sum: number, q: any) => sum + getUnread(q.sellerId),
              0
            )

            return (
              <div
                key={req.requirementId}
                style={styles.card}
                onClick={() => navigate(`/my-requirements/${req.requirementId}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.1)"
                  e.currentTarget.style.borderColor = "#7c3aed"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)"
                  e.currentTarget.style.borderColor = "#e2e8f0"
                }}
              >
                <div style={styles.imageBox}>
                  {req.productImage ? (
                    <img src={req.productImage} alt={req.productName} style={styles.cardImage} />
                  ) : (
                    <div style={styles.imagePlaceholder}>📦</div>
                  )}
                  {quoteCount > 0 && (
                    <span style={styles.quoteBadge}>
                      💰 {quoteCount} quote{quoteCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {unreadTotal > 0 && (
                    <span style={styles.unreadBadge}>
                      💬 {unreadTotal} unread
                    </span>
                  )}
                </div>

                <div style={styles.cardContent}>
                  <div style={styles.cardTopRow}>
                    <span style={{ ...styles.statusPill, background: status.bg }}>
                      {status.label}
                    </span>
                    <span style={styles.cardTime}>
                      {timeAgo(req.createdAt)}
                    </span>
                  </div>

                  <h3 style={styles.cardTitle}>{req.productName}</h3>

                  <div style={styles.cardMetaRow}>
                    <span style={styles.metaTag}>📦 {req.quantity} {req.unit}</span>
                    {req.category && (
                      <span style={styles.metaTag}>🏷️ {req.category}</span>
                    )}
                  </div>

                  <div style={styles.cardFooter}>
                    <span style={styles.viewBtnText}>View Details</span>
                    <span style={styles.arrowIcon}>→</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredRequirements.length > 0 && (
        <p style={styles.resultCount}>
          Showing {filteredRequirements.length} of {requirements.length} requirement{requirements.length !== 1 ? "s" : ""}
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
    borderTop: "4px solid #7c3aed",
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
    boxShadow: "0 20px 60px rgba(30, 41, 59, 0.25)"
  },
  heroContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "20px",
    marginBottom: "28px"
  },
  heroTitle: { fontSize: "32px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" },
  heroSubtitle: { fontSize: "15px", color: "rgba(255,255,255,0.75)", marginTop: "6px" },
  newReqBtn: {
    padding: "12px 24px",
    background: "white",
    color: "#1e293b",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
  },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" },
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
  statIcon: { width: "46px", height: "46px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "600" },
  statValue: { fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0, lineHeight: 1 },
  statLabel: { fontSize: "12px", color: "#64748b", margin: "4px 0 0 0", fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: "0.3px" },
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
  searchWrapper: { display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px 16px" },
  searchIcon: { fontSize: "18px", color: "#64748b" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#0f172a" },
  clearSearchBtn: { background: "#e2e8f0", border: "none", width: "24px", height: "24px", borderRadius: "50%", cursor: "pointer", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" },
  filterTabs: { display: "flex", gap: "8px", flexWrap: "wrap" as const },
  filterTab: { padding: "8px 16px", borderRadius: "50px", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s ease" },
  filterCount: { padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", minWidth: "22px", textAlign: "center" as const },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" },
  card: {
    background: "white",
    borderRadius: "18px",
    overflow: "hidden",
    cursor: "pointer",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    transition: "all 0.25s ease",
    display: "flex",
    flexDirection: "column" as const
  },
  imageBox: {
    position: "relative" as const,
    height: "180px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #f1f5f9"
  },
  cardImage: { width: "100%", height: "100%", objectFit: "contain" as const, padding: "16px" },
  imagePlaceholder: { fontSize: "56px", color: "#cbd5e1" },
  quoteBadge: {
    position: "absolute" as const,
    top: "10px",
    right: "10px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)"
  },
  unreadBadge: {
    position: "absolute" as const,
    bottom: "10px",
    right: "10px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)"
  },
  cardContent: { padding: "14px 16px 16px", display: "flex", flexDirection: "column" as const, gap: "8px", flex: 1 },
  cardTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statusPill: { padding: "3px 10px", borderRadius: "20px", color: "white", fontSize: "11px", fontWeight: "700" },
  cardTime: { fontSize: "11px", color: "#94a3b8", fontWeight: "600" },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box" as any,
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as any
  },
  cardMetaRow: { display: "flex", gap: "6px", flexWrap: "wrap" as const },
  metaTag: { fontSize: "11px", color: "#475569", background: "#f1f5f9", padding: "3px 10px", borderRadius: "20px", fontWeight: "600" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid #f1f5f9" },
  viewBtnText: { fontSize: "12px", fontWeight: "700", color: "#7c3aed", letterSpacing: "0.3px" },
  arrowIcon: { fontSize: "16px", color: "#7c3aed", fontWeight: "bold" },
  emptyState: { textAlign: "center" as const, padding: "80px 20px", background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" },
  emptyIcon: { fontSize: "64px", display: "block", marginBottom: "20px", opacity: 0.5 },
  emptyTitle: { fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  emptyText: { fontSize: "15px", color: "#64748b", margin: "0 0 24px 0" },
  emptyBtn: { padding: "12px 28px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "14px", boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)" },
  resultCount: { textAlign: "center" as const, marginTop: "24px", fontSize: "13px", color: "#94a3b8", fontWeight: "500" }
}

export default MyRequirements