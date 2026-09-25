import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../../config"

const Profile = () => {
  const [form, setForm] = useState<Record<string, string>>({})
  const [originalForm, setOriginalForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [ordersCount, setOrdersCount] = useState(0)
  const [unreadChatsCount, setUnreadChatsCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const loadProfile = async () => {
      const cachedUser: Record<string, string> = JSON.parse(localStorage.getItem("user") || "{}")
      if (!cachedUser._id) {
        setForm(cachedUser)
        setOriginalForm(cachedUser)
        return
      }

      setForm(cachedUser)
      setOriginalForm(cachedUser)

      try {
        const res = await fetch(`${API_URL}/auth/buyer/profile/${cachedUser._id}`)
        const data: { success?: boolean; data?: Record<string, string> } = await res.json()

        if (data.success && data.data) {
          const fresh = data.data
          setForm(fresh)
          setOriginalForm(fresh)
          localStorage.setItem("user", JSON.stringify({ ...cachedUser, ...fresh }))
        }
      } catch (err) {
        console.log("Profile fetch error:", err)
      }

      try {
        const ordersRes = await fetch(`${API_URL}/orders/buyer/${cachedUser._id}`)
        const ordersData: unknown = await ordersRes.json()
        if (Array.isArray(ordersData)) {
          setOrdersCount(ordersData.length)
        }
      } catch (err) {
        console.log("Orders fetch error:", err)
      }

      let unreadCount = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("unread_requirement_")) {
          const val = parseInt(localStorage.getItem(key) || "0")
          if (!isNaN(val) && val > 0) unreadCount += 1
        }
      }
      setUnreadChatsCount(unreadCount)
    }

    loadProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/auth/buyer/profile/${form._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      )

      const data: { user?: Record<string, string>; data?: Record<string, string>; [key: string]: unknown } = await res.json()
      const updatedUser: Record<string, string> = data.user || data.data || { ...form }
      const merged: Record<string, string> = { ...form, ...updatedUser }

      setForm(merged)
      setOriginalForm(merged)

      const cached: Record<string, string> = JSON.parse(localStorage.getItem("user") || "{}")
      localStorage.setItem("user", JSON.stringify({ ...cached, ...merged }))

      setIsEditing(false)
      alert("✅ Profile Updated Successfully!")
    } catch (err) {
      console.log("Save error:", err)
      alert("❌ Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setForm(originalForm)
    setIsEditing(false)
  }

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "N/A"
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    } catch {
      return "N/A"
    }
  }

  const getInitials = (): string => {
    const name = form.name || form.email || "B"
    return name
      .split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  return (
    <div style={pageWrapper}>

      {/* HERO HEADER — full width */}
      <div style={heroSection}>
        <div style={heroLeft}>
          <div style={avatar}>{getInitials()}</div>
          <div>
            <h1 style={heroTitle}>{form.name || "Buyer"}</h1>
            <p style={heroSubtitle}>{form.email || "No email"}</p>
            <span style={roleBadge}>🛒 Buyer</span>
          </div>
        </div>

        <div style={heroRight}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={editBtn}>
              ✏️ Edit Profile
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveProfile} disabled={loading} style={saveBtnTop}>
                {loading ? "Saving..." : "💾 Save"}
              </button>
              <button onClick={cancelEdit} style={cancelBtnTop}>
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STATS — 3 cards in a row */}
      <div style={statsGrid}>
        <div style={statCard}>
          <div style={{ ...statIcon, background: "#dbeafe", color: "#2563eb" }}>📅</div>
          <div>
            <p style={statLabel}>Member Since</p>
            <p style={statValue}>{formatDate(form.createdAt)}</p>
          </div>
        </div>

        <div style={statCard}>
          <div style={{ ...statIcon, background: "#dcfce7", color: "#16a34a" }}>📦</div>
          <div>
            <p style={statLabel}>Total Orders</p>
            <p style={statValue}>{ordersCount}</p>
          </div>
        </div>

        <div style={statCard}>
          <div style={{
            ...statIcon,
            background: unreadChatsCount > 0 ? "#fee2e2" : "#f1f5f9",
            color: unreadChatsCount > 0 ? "#dc2626" : "#64748b"
          }}>💬</div>
          <div>
            <p style={statLabel}>Unread Chats</p>
            <p style={{
              ...statValue,
              color: unreadChatsCount > 0 ? "#dc2626" : "#16a34a"
            }}>
              {unreadChatsCount}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN GRID — 2 columns, full width */}
      <div style={mainGrid}>

        {/* LEFT COLUMN */}
        <div style={column}>
          {/* BASIC INFO */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={cardIcon}>👤</span>
              <h3 style={cardTitle}>Basic Information</h3>
            </div>

            <div style={fieldGroup}>
              <label style={label}>Full Name *</label>
              <input
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                style={isEditing ? input : inputDisabled}
                disabled={!isEditing}
                required
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Email *</label>
              <input
                name="email"
                value={form.email || ""}
                onChange={handleChange}
                style={isEditing ? input : inputDisabled}
                disabled={!isEditing}
                required
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Phone Number *</label>
              <input
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                placeholder={isEditing ? "Enter 10-digit phone number" : ""}
                style={isEditing ? input : inputDisabled}
                disabled={!isEditing}
                required
              />
            </div>
          </div>

          {/* BUSINESS / GST */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={cardIcon}>🧾</span>
              <h3 style={cardTitle}>Business Information</h3>
            </div>

            <div style={fieldGroup}>
              <label style={label}>GST Number</label>
              <input
                name="gstNumber"
                value={form.gstNumber || ""}
                onChange={handleChange}
                placeholder={isEditing ? "e.g., 27AAPFU0939F1ZV (optional)" : ""}
                style={isEditing ? input : inputDisabled}
                disabled={!isEditing}
              />
              <small style={gstNote}>
                💡 <b>Business/dukaan</b> ke liye kharid rahe ho? Toh GST number daalo.
                Isse <b>Input Tax Credit (ITC)</b> claim kar sakte ho.
              </small>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={column}>
          {/* SHIPPING ADDRESS */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={cardIcon}>📍</span>
              <h3 style={cardTitle}>Shipping Address</h3>
            </div>

            <div style={fieldGroup}>
              <label style={label}>Company Name</label>
              <input
                name="companyName"
                value={form.companyName || ""}
                onChange={handleChange}
                style={isEditing ? input : inputDisabled}
                disabled={!isEditing}
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Address Line 1 *</label>
              <input
                name="addressLine1"
                value={form.addressLine1 || ""}
                onChange={handleChange}
                placeholder={isEditing ? "House number, building name" : ""}
                style={isEditing ? input : inputDisabled}
                disabled={!isEditing}
                required
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Address Line 2</label>
              <input
                name="addressLine2"
                value={form.addressLine2 || ""}
                onChange={handleChange}
                placeholder={isEditing ? "Street, area, landmark" : ""}
                style={isEditing ? input : inputDisabled}
                disabled={!isEditing}
              />
            </div>

            <div style={row}>
              <div style={halfField}>
                <label style={label}>City *</label>
                <input
                  name="city"
                  value={form.city || ""}
                  onChange={handleChange}
                  style={isEditing ? input : inputDisabled}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div style={halfField}>
                <label style={label}>State *</label>
                <input
                  name="state"
                  value={form.state || ""}
                  onChange={handleChange}
                  style={isEditing ? input : inputDisabled}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div style={row}>
              <div style={halfField}>
                <label style={label}>Pincode *</label>
                <input
                  name="pincode"
                  value={form.pincode || ""}
                  onChange={handleChange}
                  placeholder={isEditing ? "6-digit pincode" : ""}
                  style={isEditing ? input : inputDisabled}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div style={halfField}>
                <label style={label}>Country</label>
                <input
                  name="country"
                  value={form.country || "India"}
                  onChange={handleChange}
                  style={isEditing ? input : inputDisabled}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      {isEditing && (
        <div style={bottomActions}>
          <button onClick={saveProfile} disabled={loading} style={saveBtnBottom}>
            {loading ? "Saving..." : "💾 Save Profile"}
          </button>
          <button onClick={cancelEdit} style={cancelBtnBottom}>
            Cancel
          </button>
        </div>
      )}

    </div>
  )
}

// ================= STYLES =================

const pageWrapper: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
  padding: "24px 32px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  boxSizing: "border-box",
  width: "100%"
}

const heroSection: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e293b 0%, #4c1d95 100%)",
  padding: "28px 36px",
  borderRadius: "20px",
  color: "white",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
  boxShadow: "0 20px 60px rgba(30, 41, 59, 0.25)",
  width: "100%",
  boxSizing: "border-box"
}

const heroLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  flex: 1,
  minWidth: 0
}

const avatar: React.CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #38bdf8, #818cf8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: "800",
  color: "white",
  flexShrink: 0,
  border: "3px solid rgba(255,255,255,0.25)",
  boxShadow: "0 8px 24px rgba(56, 189, 248, 0.35)"
}

const heroTitle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: "800",
  margin: 0,
  color: "white",
  letterSpacing: "-0.3px"
}

const heroSubtitle: React.CSSProperties = {
  fontSize: "14px",
  color: "rgba(255,255,255,0.75)",
  margin: "4px 0 6px 0"
}

const roleBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 12px",
  background: "rgba(255,255,255,0.15)",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "700",
  color: "white",
  border: "1px solid rgba(255,255,255,0.2)",
  letterSpacing: "0.5px"
}

const heroRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexShrink: 0
}

const editBtn: React.CSSProperties = {
  padding: "12px 26px",
  background: "white",
  color: "#1e293b",
  border: "none",
  borderRadius: "50px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
}

const saveBtnTop: React.CSSProperties = {
  padding: "12px 26px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  border: "none",
  borderRadius: "50px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  boxShadow: "0 8px 20px rgba(34, 197, 94, 0.35)"
}

const cancelBtnTop: React.CSSProperties = {
  padding: "12px 22px",
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "50px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px"
}

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "20px",
  width: "100%"
}

const statCard: React.CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "22px 24px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  border: "1px solid #f1f5f9"
}

const statIcon: React.CSSProperties = {
  width: "54px",
  height: "54px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  flexShrink: 0
}

const statLabel: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.4px"
}

const statValue: React.CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: "18px",
  fontWeight: "800",
  color: "#0f172a"
}

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  width: "100%"
}

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
}

const card: React.CSSProperties = {
  background: "white",
  padding: "26px 30px",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: "1px solid #e2e8f0",
  width: "100%",
  boxSizing: "border-box"
}

const cardHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px",
  paddingBottom: "14px",
  borderBottom: "1px solid #f1f5f9"
}

const cardIcon: React.CSSProperties = {
  fontSize: "20px"
}

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "17px",
  fontWeight: "700",
  color: "#0f172a"
}

const fieldGroup: React.CSSProperties = {
  marginBottom: "16px"
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#1e293b",
  marginBottom: "6px"
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  background: "white",
  boxSizing: "border-box"
}

const inputDisabled: React.CSSProperties = {
  ...input,
  background: "#f8fafc",
  color: "#475569",
  cursor: "not-allowed",
  border: "1px solid #e2e8f0"
}

const row: React.CSSProperties = {
  display: "flex",
  gap: "16px"
}

const halfField: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column"
}

const gstNote: React.CSSProperties = {
  display: "block",
  marginTop: "8px",
  fontSize: "12px",
  color: "#64748b",
  lineHeight: "1.5",
  background: "#f8fafc",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0"
}

const bottomActions: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  background: "white",
  padding: "20px 24px",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: "1px solid #e2e8f0",
  width: "100%",
  boxSizing: "border-box"
}

const saveBtnBottom: React.CSSProperties = {
  flex: 2,
  padding: "14px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)"
}

const cancelBtnBottom: React.CSSProperties = {
  flex: 1,
  padding: "14px",
  background: "#f1f5f9",
  color: "#1e293b",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer"
}

export default Profile