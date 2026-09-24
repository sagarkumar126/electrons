 import { useEffect, useState } from "react"
import { adminApi } from "../../api/admin.api"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { formatCurrency } from "../../utils/format"

const Revenue = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenue()
  }, [])

  const fetchRevenue = async () => {
    try {
      const res = await adminApi.getDashboardStats()
      setStats(res.data)
    } catch (error) {
      console.error("Error fetching revenue:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading revenue data..." />
  }

  return (
    <div>
      <div style={header}>
        <h1 style={title}>💰 Revenue</h1>
        <p style={subtitle}>Track platform earnings and commissions</p>
      </div>

      <div style={statsGrid}>
        <div style={statCard}>
          <span style={statIcon}>💰</span>
          <div>
            <h3 style={statValue}>{formatCurrency(stats?.totalRevenue || 0)}</h3>
            <p style={statLabel}>Total Revenue</p>
          </div>
        </div>
        <div style={statCard}>
          <span style={statIcon}>🛒</span>
          <div>
            <h3 style={statValue}>{stats?.totalOrders || 0}</h3>
            <p style={statLabel}>Total Orders</p>
          </div>
        </div>
        <div style={statCard}>
          <span style={statIcon}>🏪</span>
          <div>
            <h3 style={statValue}>{stats?.totalSellers || 0}</h3>
            <p style={statLabel}>Active Sellers</p>
          </div>
        </div>
        <div style={statCard}>
          <span style={statIcon}>📦</span>
          <div>
            <h3 style={statValue}>{stats?.totalProducts || 0}</h3>
            <p style={statLabel}>Total Products</p>
          </div>
        </div>
      </div>

      <div style={commissionSection}>
        <h2 style={sectionTitle}>💳 Commission Settings</h2>
        <div style={commissionCard}>
          <div style={commissionRow}>
            <span style={commissionLabel}>Current Commission Rate</span>
            <span style={commissionValue}>5%</span>
          </div>
          <div style={commissionRow}>
            <span style={commissionLabel}>Platform Earnings</span>
            <span style={commissionValue}>{formatCurrency(stats?.totalRevenue * 0.05 || 0)}</span>
          </div>
          <p style={commissionNote}>* Commission is applied to every order placed on the platform</p>
        </div>
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

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px"
}

const statCard = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  gap: "16px"
}

const statIcon = {
  fontSize: "32px"
}

const statValue = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: 0
}

const statLabel = {
  fontSize: "14px",
  color: "#64748b",
  margin: 0
}

const commissionSection = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0"
}

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: "0 0 16px 0"
}

const commissionCard = {
  background: "#f8fafc",
  padding: "16px",
  borderRadius: "8px"
}

const commissionRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #e2e8f0"
}

const commissionLabel = {
  fontSize: "14px",
  color: "#64748b"
}

const commissionValue = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#0f172a"
}

const commissionNote = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "8px",
  marginBottom: 0
}

export default Revenue
