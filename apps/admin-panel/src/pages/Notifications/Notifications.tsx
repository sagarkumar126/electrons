import { useState } from "react"
import { adminApi } from "../../api/admin.api"

const Notifications = () => {
  const [form, setForm] = useState({
    subject: "",
    message: "",
    type: "all",
    role: "all"
  })
  const [sending, setSending] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const sendNotification = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      alert("Please fill subject and message")
      return
    }

    setSending(true)
    try {
      await adminApi.sendNotification(form)
      alert("✅ Notification sent successfully!")
      setForm({ subject: "", message: "", type: "all", role: "all" })
    } catch (error) {
      alert("❌ Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div style={header}>
        <h1 style={title}>🔔 Notifications</h1>
        <p style={subtitle}>Send announcements to users</p>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>📤 Send Announcement</h2>

        <div style={fieldGroup}>
          <label style={label}>Subject *</label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Enter notification subject..."
            style={input}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>Message *</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Type your announcement message..."
            style={textarea}
            rows={6}
          />
        </div>

        <div style={row}>
          <div style={halfField}>
            <label style={label}>Send To</label>
            <select name="type" value={form.type} onChange={handleChange} style={select}>
              <option value="all">All Users</option>
              <option value="buyers">Buyers Only</option>
              <option value="sellers">Sellers Only</option>
            </select>
          </div>
          <div style={halfField}>
            <label style={label}>Role (Optional)</label>
            <select name="role" value={form.role} onChange={handleChange} style={select}>
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>
        </div>

        <button onClick={sendNotification} disabled={sending} style={sendBtn}>
          {sending ? "Sending..." : "📤 Send Notification"}
        </button>
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

const card = {
  background: "white",
  padding: "24px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  maxWidth: "600px"
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

const textarea = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  background: "white",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
  resize: "vertical" as const
}

const row = {
  display: "flex",
  gap: "16px",
  marginBottom: "16px"
}

const halfField = {
  flex: 1
}

const select = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  background: "white"
}

const sendBtn = {
  width: "100%",
  padding: "12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
  transition: "all 0.2s ease"
}

export default Notifications