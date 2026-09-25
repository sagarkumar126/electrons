import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../../config"

const PostRequirement = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    quantity: "",
    unit: "Units",
    phone: "",
    email: "",
    additionalNotes: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const units = ["Units", "KGs", "Boxes", "Cartons", "Sets", "Pieces", "Pairs"]

  useEffect(() => {
    if (user._id) {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        phone: user.phone || "",
        buyerName: user.name || "Guest"
      }))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!formData.phone || formData.phone.length < 10) {
      setError("Please enter a valid 10-digit phone number")
      setLoading(false)
      return
    }

    if (!formData.email) {
      setError("Email is required")
      setLoading(false)
      return
    }

    if (!formData.productName.trim()) {
      setError("Please enter product name")
      setLoading(false)
      return
    }
    if (!formData.description.trim()) {
      setError("Please enter description")
      setLoading(false)
      return
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError("Please enter valid quantity")
      setLoading(false)
      return
    }

    try {
      const payload = {
        ...formData,
        buyerId: user._id,
        buyerName: user.name || "Guest",
        buyerEmail: formData.email,
        buyerPhone: formData.phone,
        category: "General"
      }

      console.log("📦 Payload:", payload)

      const res = await fetch(`${API_URL}/buyer-requirement/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate("/my-requirements")
        }, 2000)
      } else {
        setError(data.message || "Failed to post requirement")
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successBox}>
            <span style={styles.successIcon}>✅</span>
            <h2 style={styles.successTitle}>Requirement Posted Successfully!</h2>
            <p style={styles.successText}>
              Your requirement has been sent to verified sellers.
            </p>
            <p style={styles.successSubtext}>Redirecting to your requirements...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📝 Post Buy Requirement</h1>
        <p style={styles.subtitle}>Tell us what you need, get quotes from sellers.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Product/Service Name *</label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              placeholder="e.g., Industrial Laptops, LED TV 55 inch"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Product Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what you need (specifications, features, use case, etc.)"
              rows={4}
              style={styles.textarea}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.halfField}>
              <label style={styles.label}>Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g., 50"
                style={styles.input}
                min="1"
                required
              />
            </div>
            <div style={styles.halfField}>
              <label style={styles.label}>Unit *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                style={styles.input}
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
            <small style={{ color: "#94a3b8", fontSize: "12px" }}>
              Sellers will use this to contact you
            </small>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your 10-digit phone number"
              style={styles.input}
              required
            />
            <small style={{ color: "#94a3b8", fontSize: "12px" }}>
              Sellers will use this to contact you
            </small>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Additional Notes <span style={styles.optional}>(Optional)</span>
            </label>
            <textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              placeholder="Any other requirements or preferences..."
              rows={3}
              style={styles.textarea}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorText}>❌ {error}</span>
            </div>
          )}

          <button
            type="submit"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Posting..." : "📤 Post Requirement"}
          </button>

          <p style={styles.terms}>
            By posting, you agree to our Terms & Conditions and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "0 20px"
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: "8px"
  },
  subtitle: {
    color: "#64748b",
    fontSize: "15px",
    marginBottom: "20px"
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px"
  },
  label: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#1e293b"
  },
  optional: {
    fontWeight: "normal",
    color: "#94a3b8",
    fontSize: "12px"
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    background: "white"
  },
  textarea: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    resize: "vertical" as const,
    fontFamily: "inherit",
    background: "white"
  },
  row: {
    display: "flex",
    gap: "16px"
  },
  halfField: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px"
  },
  submitBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "8px",
    boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)"
  },
  terms: {
    fontSize: "12px",
    color: "#94a3b8",
    textAlign: "center" as const,
    margin: "4px 0 0 0"
  },
  errorBox: {
    background: "#fee2e2",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #fca5a5"
  },
  errorText: {
    color: "#dc2626",
    fontSize: "14px"
  },
  successBox: {
    textAlign: "center" as const,
    padding: "40px 20px"
  },
  successIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px"
  },
  successTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#166534",
    marginBottom: "8px"
  },
  successText: {
    color: "#1e293b",
    fontSize: "16px",
    marginBottom: "8px"
  },
  successSubtext: {
    color: "#64748b",
    fontSize: "14px"
  }
}

export default PostRequirement