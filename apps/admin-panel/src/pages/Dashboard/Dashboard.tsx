import { useEffect } from "react"
import { useDashboard } from "../../hooks/useDashboard"
import StatCard from "../../components/common/StatCard"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { formatCurrency } from "../../utils/format"

const Dashboard = () => {
  const { stats, loading, fetchDashboardStats } = useDashboard()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />
  }

  const statsData = [
    { title: "Total Users", value: stats?.totalUsers || 0, icon: "👥", color: "#dbeafe" },
    { title: "Total Sellers", value: stats?.totalSellers || 0, icon: "🏪", color: "#dcfce7" },
    { title: "Total Buyers", value: stats?.totalBuyers || 0, icon: "🛒", color: "#fef3c7" },
    { title: "Total Products", value: stats?.totalProducts || 0, icon: "📦", color: "#fce7f3" },
    { title: "Total Orders", value: stats?.totalOrders || 0, icon: "📋", color: "#e0e7ff" },
    { title: "Total Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: "💰", color: "#ccfbf1" },
  ]

  return (
    <div>
      <div style={header}>
        <h1 style={title}>📊 Dashboard</h1>
        <p style={subtitle}>Welcome back, Admin! Here's what's happening today.</p>
      </div>

      <div style={statsGrid}>
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div style={pendingSection}>
        <h2 style={pendingTitle}>⏳ Pending Approvals</h2>
        <div style={pendingGrid}>
          <div style={pendingCard}>
            <span style={pendingIcon}>👤</span>
            <div>
              <h3 style={pendingNumber}>{stats?.pendingSellers || 0}</h3>
              <p style={pendingLabel}>Sellers waiting for KYC approval</p>
            </div>
          </div>
          <div style={pendingCard}>
            <span style={pendingIcon}>📦</span>
            <div>
              <h3 style={pendingNumber}>{stats?.pendingProducts || 0}</h3>
              <p style={pendingLabel}>Products waiting for approval</p>
            </div>
          </div>
          <div style={pendingCard}>
            <span style={pendingIcon}>🛒</span>
            <div>
              <h3 style={pendingNumber}>{stats?.pendingOrders || 0}</h3>
              <p style={pendingLabel}>Orders pending processing</p>
            </div>
          </div>
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
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "16px",
  marginBottom: "24px"
}

const pendingSection = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  marginBottom: "24px"
}

const pendingTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: "0 0 16px 0"
}

const pendingGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "16px"
}

const pendingCard = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  background: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #e2e8f0"
}

const pendingIcon = {
  fontSize: "24px"
}

const pendingNumber = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: 0
}

const pendingLabel = {
  fontSize: "12px",
  color: "#64748b",
  margin: 0
}

export default Dashboard