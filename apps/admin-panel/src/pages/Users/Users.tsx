 
import { useEffect, useState } from "react"
import { adminApi } from "../../api/admin.api"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { formatDate } from "../../utils/format"

const Users = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getAllUsers()
      setUsers(res.data)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const approveSeller = async (sellerId: string) => {
    if (!confirm("Approve this seller?")) return
    try {
      await adminApi.approveSeller(sellerId)
      fetchUsers()
      alert("✅ Seller approved!")
    } catch (error) {
      alert("❌ Failed to approve seller")
    }
  }

  const blockUser = async (userId: string) => {
    if (!confirm("Block this user?")) return
    try {
      await adminApi.blockUser(userId)
      fetchUsers()
      alert("✅ User blocked!")
    } catch (error) {
      alert("❌ Failed to block user")
    }
  }

  const unblockUser = async (userId: string) => {
    if (!confirm("Unblock this user?")) return
    try {
      await adminApi.unblockUser(userId)
      fetchUsers()
      alert("✅ User unblocked!")
    } catch (error) {
      alert("❌ Failed to unblock user")
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user permanently?")) return
    try {
      await adminApi.deleteUser(userId)
      fetchUsers()
      alert("✅ User deleted!")
    } catch (error) {
      alert("❌ Failed to delete user")
    }
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case "admin": return "#8b5cf6"
      case "seller": return "#3b82f6"
      case "buyer": return "#22c55e"
      default: return "#6b7280"
    }
  }

  const getKYCColor = (status: string) => {
    switch(status) {
      case "Verified": return "#22c55e"
      case "Pending": return "#f59e0b"
      case "Rejected": return "#ef4444"
      default: return "#6b7280"
    }
  }

  const filteredUsers = filter === "all" 
    ? users 
    : users.filter(u => u.role === filter)

  if (loading) {
    return <LoadingSpinner message="Loading users..." />
  }

  return (
    <div>
      <div style={header}>
        <h1 style={title}>👥 Users</h1>
        <p style={subtitle}>Manage all users on the platform</p>
      </div>

      <div style={filterContainer}>
        <button
          style={{ ...filterBtn, background: filter === "all" ? "#2563eb" : "white", color: filter === "all" ? "white" : "#1e293b" }}
          onClick={() => setFilter("all")}
        >
          All ({users.length})
        </button>
        <button
          style={{ ...filterBtn, background: filter === "seller" ? "#2563eb" : "white", color: filter === "seller" ? "white" : "#1e293b" }}
          onClick={() => setFilter("seller")}
        >
          Sellers ({users.filter(u => u.role === "seller").length})
        </button>
        <button
          style={{ ...filterBtn, background: filter === "buyer" ? "#2563eb" : "white", color: filter === "buyer" ? "white" : "#1e293b" }}
          onClick={() => setFilter("buyer")}
        >
          Buyers ({users.filter(u => u.role === "buyer").length})
        </button>
        <button
          style={{ ...filterBtn, background: filter === "admin" ? "#2563eb" : "white", color: filter === "admin" ? "white" : "#1e293b" }}
          onClick={() => setFilter("admin")}
        >
          Admins ({users.filter(u => u.role === "admin").length})
        </button>
      </div>

      <div style={tableWrapper}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>User</th>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>KYC Status</th>
              <th style={th}>Joined</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} style={tr}>
                <td style={td}>
                  <div style={userInfo}>
                    <img 
                      src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                      alt={user.name} 
                      style={avatar} 
                    />
                    <span style={userName}>{user.name}</span>
                  </div>
                </td>
                <td style={td}>{user.email}</td>
                <td style={td}>
                  <span style={{ ...roleBadge, background: getRoleColor(user.role) }}>
                    {user.role}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ ...kycBadge, background: getKYCColor(user.kycStatus) }}>
                    {user.kycStatus || "N/A"}
                  </span>
                </td>
                <td style={td}>{formatDate(user.createdAt)}</td>
                <td style={td}>
                  <div style={actionButtons}>
                    {user.role === "seller" && user.kycStatus === "Pending" && (
                      <button style={{ ...actionBtn, background: "#22c55e" }} onClick={() => approveSeller(user._id)}>
                        ✅ Approve
                      </button>
                    )}
                    {!user.isBlocked ? (
                      <button style={{ ...actionBtn, background: "#ef4444" }} onClick={() => blockUser(user._id)}>
                        🔒 Block
                      </button>
                    ) : (
                      <button style={{ ...actionBtn, background: "#f59e0b" }} onClick={() => unblockUser(user._id)}>
                        🔓 Unblock
                      </button>
                    )}
                    <button style={{ ...actionBtn, background: "#dc2626" }} onClick={() => deleteUser(user._id)}>
                      🗑️ Delete
                    </button>
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
  minWidth: "700px"
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

const userInfo = {
  display: "flex",
  alignItems: "center",
  gap: "8px"
}

const avatar = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  objectFit: "cover" as const
}

const userName = {
  fontWeight: "500"
}

const roleBadge = {
  padding: "4px 12px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold",
  color: "white"
}

const kycBadge = {
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

export default Users