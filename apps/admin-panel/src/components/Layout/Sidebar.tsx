import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/users", label: "Users", icon: "👥" },
    { path: "/products", label: "Products", icon: "📦" },
    { path: "/orders", label: "Orders", icon: "🛒" },
    { path: "/categories", label: "Categories", icon: "🏷️" },
    { path: "/revenue", label: "Revenue", icon: "💰" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
    { path: "/notifications", label: "Notifications", icon: "🔔" }
  ]

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div style={sidebarStyle}>
      <div style={logoContainer}>
        <h2 style={logo}>⚡ Admin</h2>
        <p style={subLogo}>Electrons B2B</p>
      </div>

      <div style={profileCard}>
        <img 
          src={user?.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
          alt="Admin" 
          style={profileImg} 
        />
        <div>
          <h4 style={profileName}>{user?.name || "Admin"}</h4>
          <p style={profileEmail}>{user?.email || "admin@electrons.com"}</p>
        </div>
      </div>

      <nav style={navContainer}>
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} style={{ textDecoration: "none" }}>
            <div
              style={{
                ...navItem,
                background: isActive(item.path) ? "white" : "transparent",
                color: isActive(item.path) ? "#1e293b" : "#94a3b8",
                boxShadow: isActive(item.path) ? "0 2px 8px rgba(0,0,0,0.08)" : "none"
              }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <button onClick={handleLogout} style={logoutBtn}>
        🚪 Logout
      </button>
    </div>
  )
}

const sidebarStyle = {
  width: "250px",
  background: "linear-gradient(180deg, #0f172a, #1e293b)",
  color: "white",
  padding: "20px",
  height: "100vh",
  position: "fixed" as const,
  top: 0,
  left: 0,
  overflowY: "auto" as const,
  display: "flex",
  flexDirection: "column" as const
}

const logoContainer = {
  marginBottom: "20px",
  textAlign: "center" as const
}

const logo = {
  fontSize: "24px",
  fontWeight: "bold",
  margin: 0,
  color: "#38bdf8"
}

const subLogo = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "4px"
}

const profileCard = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  background: "rgba(255,255,255,0.06)",
  borderRadius: "12px",
  marginBottom: "20px"
}

const profileImg = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  objectFit: "cover" as const
}

const profileName = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "600"
}

const profileEmail = {
  margin: 0,
  fontSize: "11px",
  color: "#94a3b8"
}

const navContainer = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  flex: 1
}

const navItem = {
  padding: "10px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  transition: "all 0.2s ease",
  fontSize: "14px",
  fontWeight: "500"
}

const logoutBtn = {
  padding: "10px",
  background: "rgba(239, 68, 68, 0.15)",
  color: "#ef4444",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  marginTop: "10px",
  transition: "all 0.2s ease"
}

export default Sidebar