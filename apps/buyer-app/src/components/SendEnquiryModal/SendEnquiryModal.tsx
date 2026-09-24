import { useState, useEffect } from "react"

const SendEnquiryModal = ({ product, onClose }: any) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    quantity: "",
    unit: "Pieces",
    deliveryLocation: "",
    deliveryTimeline: "",
    message: ""
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product?.moq) {
      setForm(prev => ({ ...prev, quantity: String(product.moq) }))
    }
  }, [product])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!form.phone || form.phone.length < 10) {
      alert("Please enter valid phone number")
      return
    }
    if (!form.message.trim()) {
      alert("Please enter your message")
      return
    }

    setLoading(true)

    try {
      const buyer = JSON.parse(localStorage.getItem("user") || "{}")

      const enquiryData = {
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        sellerId: product.sellerId,
        buyerId: buyer._id || "",
        buyerName: form.name || buyer.name || "Guest",
        email: form.email || buyer.email || "",
        phone: form.phone,
        quantity: Number(form.quantity) || 0,
        unit: form.unit,
        deliveryLocation: form.deliveryLocation,
        deliveryTimeline: form.deliveryTimeline,
        message: form.message,
        status: "Pending",
        createdAt: new Date()
      }

      const res = await fetch("http://localhost:5000/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enquiryData)
      })

      if (res.ok) {
        alert("✅ Enquiry sent successfully!")
        onClose()
      } else {
        const error = await res.json()
        alert(error.message || "Failed to send enquiry")
      }
    } catch (error) {
      console.error("Error sending enquiry:", error)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={modalTitle}>📧 Send Enquiry</h2>
        <p style={subText}>Get best price and details from seller</p>

        {/* ✅ Product Box with Image */}
        <div style={productBox}>
          {product?.image && (
            <img 
              src={product.image} 
              alt={product.name} 
              style={{
                width: "100%",
                height: "120px",
                objectFit: "contain",
                borderRadius: "8px",
                marginBottom: "10px",
                background: "#f8fafc"
              }}
            />
          )}
          <p><strong>Product:</strong> {product?.name}</p>
          <p><strong>Category:</strong> {product?.category}</p>
          <p><strong>Price:</strong> ₹{product?.price}/unit</p>
          {product?.moq && (
            <p style={{ color: "#f59e0b", fontWeight: "bold" }}>
              📦 MOQ: {product.moq} units
            </p>
          )}
        </div>

        <div style={fieldGroup}>
          <label style={label}>Your Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your name"
            style={input}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            style={input}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            style={input}
            required
          />
        </div>

        <div style={row}>
          <div style={halfField}>
            <label style={label}>Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Enter quantity"
              style={input}
              min="1"
              required
            />
            {product?.moq && (
              <small style={{ color: "#f59e0b", fontSize: "12px" }}>
                ⚡ MOQ: {product.moq} units
              </small>
            )}
          </div>
          <div style={halfField}>
            <label style={label}>Unit</label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              style={input}
            >
              <option value="Pieces">Pieces</option>
              <option value="Units">Units</option>
              <option value="KGs">KGs</option>
              <option value="Boxes">Boxes</option>
              <option value="Cartons">Cartons</option>
              <option value="Sets">Sets</option>
            </select>
          </div>
        </div>

        <div style={fieldGroup}>
          <label style={label}>Delivery Location</label>
          <input
            type="text"
            name="deliveryLocation"
            value={form.deliveryLocation}
            onChange={handleChange}
            placeholder="City, State, Country"
            style={input}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>Delivery Timeline</label>
          <input
            type="text"
            name="deliveryTimeline"
            value={form.deliveryTimeline}
            onChange={handleChange}
            placeholder="e.g., Within 15 days"
            style={input}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>Message *</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Ask about price, availability, MOQ, delivery, etc."
            style={textarea}
            rows={3}
            required
          />
        </div>

        <div style={actions}>
          <button 
            onClick={handleSubmit} 
            style={sendBtn}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Enquiry"}
          </button>
          <button 
            onClick={onClose} 
            style={cancelBtn}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ================= STYLES =================

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "20px"
}

const modal = {
  background: "#fff",
  padding: "28px",
  maxWidth: "520px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto" as const,
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
}

const modalTitle = {
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 4px 0",
  color: "#0f172a"
}

const subText = {
  color: "#64748b",
  marginBottom: "18px",
  fontSize: "14px"
}

const productBox = {
  background: "#f8fafc",
  padding: "12px 16px",
  borderRadius: "10px",
  marginBottom: "18px",
  border: "1px solid #e5e7eb"
}

const fieldGroup = {
  marginBottom: "14px"
}

const label = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#1e293b",
  marginBottom: "4px"
}

const input = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  background: "white",
  boxSizing: "border-box" as const
}

const textarea = {
  ...input,
  resize: "vertical" as const,
  fontFamily: "inherit"
}

const row = {
  display: "flex",
  gap: "12px"
}

const halfField = {
  flex: 1,
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px"
}

const actions = {
  display: "flex",
  gap: "10px",
  marginTop: "18px"
}

const sendBtn = {
  flex: 1,
  padding: "12px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px"
}

const cancelBtn = {
  padding: "12px 20px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px",
  color: "#1e293b"
}

export default SendEnquiryModal