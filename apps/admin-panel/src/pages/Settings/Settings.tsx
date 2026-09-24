 
import { useEffect, useState } from "react"
import { adminApi } from "../../api/admin.api"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const Settings = () => {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await adminApi.getSettings()
      setSettings(res.data)
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await adminApi.updateSettings(settings)
      alert("✅ Settings saved successfully!")
    } catch (error) {
      alert("❌ Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />
  }

  return (
    <div>
      <div style={header}>
        <h1 style={title}>⚙️ Settings</h1>
        <p style={subtitle}>Configure platform settings</p>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>General Settings</h2>
        <div style={fieldGroup}>
          <label style={label}>Platform Name</label>
          <input
            type="text"
            value={settings?.platformName || "Electrons B2B"}
            onChange={(e) => handleChange("platformName", e.target.value)}
            style={input}
          />
        </div>
        <div style={fieldGroup}>
          <label style={label}>Contact Email</label>
          <input
            type="email"
            value={settings?.contactEmail || ""}
            onChange={(e) => handleChange("contactEmail", e.target.value)}
            style={input}
          />
        </div>
        <div style={fieldGroup}>
          <label style={label}>Contact Phone</label>
          <input
            type="text"
            value={settings?.contactPhone || ""}
            onChange={(e) => handleChange("contactPhone", e.target.value)}
            style={input}
          />
        </div>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>Commission Settings</h2>
        <div style={fieldGroup}>
          <label style={label}>Commission Percentage (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings?.commissionPercent || 5}
            onChange={(e) => handleChange("commissionPercent", Number(e.target.value))}
            style={input}
          />
          <p style={helperText}>This will be applied to every order</p>
        </div>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>Feature Toggles</h2>
        <div style={toggleGroup}>
          <div style={toggleRow}>
            <label style={toggleLabel}>Enable RFQ</label>
            <input
              type="checkbox"
              checked={settings?.enableRFQ !== false}
              onChange={(e) => handleChange("enableRFQ", e.target.checked)}
              style={checkbox}
            />
          </div>
          <div style={toggleRow}>
            <label style={toggleLabel}>Enable Chat</label>
            <input
              type="checkbox"
              checked={settings?.enableChat !== false}
              onChange={(e) => handleChange("enableChat", e.target.checked)}
              style={checkbox}
            />
          </div>
          <div style={toggleRow}>
            <label style={toggleLabel}>Enable Wishlist</label>
            <input
              type="checkbox"
              checked={settings?.enableWishlist !== false}
              onChange={(e) => handleChange("enableWishlist", e.target.checked)}
              style={checkbox}
            />
          </div>
          <div style={toggleRow}>
            <label style={toggleLabel}>Allow Seller Registration</label>
            <input
              type="checkbox"
              checked={settings?.allowSellerRegistration !== false}
              onChange={(e) => handleChange("allowSellerRegistration", e.target.checked)}
              style={checkbox}
            />
          </div>
        </div>
      </div>

      <button onClick={saveSettings} disabled={saving} style={saveBtn}>
        {saving ? "Saving..." : "💾 Save Settings"}
      </button>
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

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  marginBottom: "20px"
}

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: "0 0 16px 0"
}

const fieldGroup = {
  marginBottom: "16px"
}

const label = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e293b",
  marginBottom: "4px"
}

const input = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  background: "white",
  boxSizing: "border-box" as const
}

const helperText = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "4px"
}

const toggleGroup = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px"
}

const toggleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #f1f5f9"
}

const toggleLabel = {
  fontSize: "14px",
  color: "#1e293b"
}

const checkbox = {
  width: "18px",
  height: "18px",
  cursor: "pointer"
}

const saveBtn = {
  padding: "12px 24px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
  width: "100%",
  transition: "all 0.2s ease"
}

export default Settings