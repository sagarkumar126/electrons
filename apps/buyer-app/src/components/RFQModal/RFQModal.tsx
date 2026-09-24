// ================= RFQModal.tsx (Buyer Side) =================
// File: buyer-app/src/components/RFQModal/RFQModal.tsx

import { useState } from "react"

interface RFQModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: any[]
  sellerId: string
  sellerName: string
  buyerId: string
  buyerName: string
  totalAmount: number
  moq?: number
  maxStock?: number
  buyerEmail?: string
  buyerPhone?: string
}

const RFQModal = ({
  isOpen,
  onClose,
  cartItems,
  sellerId,
  sellerName,
  buyerId,
  buyerName,
  totalAmount,
  moq = 1,
  maxStock = 999999,
  buyerEmail = "",
  buyerPhone = ""
}: RFQModalProps) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    quantity: moq.toString(),
    deliveryTimeline: "",
    paymentTerms: "",
    quoteValidity: "30 days",
    message: "",
    email: buyerEmail,
    phone: buyerPhone
  })
  const [quantityError, setQuantityError] = useState("")

  if (!isOpen) return null

  const validateQuantity = (value: number) => {
    if (value < moq) {
      setQuantityError(`⚠️ Minimum order quantity is ${moq} units`)
      return false
    } else if (value > maxStock) {
      setQuantityError(`⚠️ Only ${maxStock} units available in stock`)
      return false
    } else {
      setQuantityError("")
      return true
    }
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (isNaN(value) || value < 0) {
      setFormData(prev => ({ ...prev, quantity: "" }))
      setQuantityError("Please enter valid quantity")
      return
    }
    setFormData(prev => ({ ...prev, quantity: value.toString() }))
    validateQuantity(value)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    const qty = Number(formData.quantity)
    
    if (!formData.quantity || formData.quantity === "") {
      alert("❌ Please enter quantity")
      return
    }
    if (isNaN(qty) || qty <= 0) {
      alert("❌ Please enter a valid quantity")
      return
    }
    if (qty < moq) {
      alert(`❌ Minimum order quantity is ${moq} units`)
      return
    }
    if (qty > maxStock) {
      alert(`❌ Only ${maxStock} units available in stock`)
      return
    }
    if (!formData.deliveryTimeline.trim()) {
      alert("❌ Please enter delivery timeline")
      return
    }
    if (!formData.email.trim()) {
      alert("❌ Please enter email")
      return
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      alert("❌ Please enter valid phone number")
      return
    }

    setLoading(true)

    const rfqData = {
      buyerId,
      sellerId,
      items: cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: qty,
        price: item.price
      })),
      buyerName,
      sellerName,
      totalAmount: qty * (cartItems[0]?.price || 0),
      message: formData.message,
      deliveryLocation: "",
      deliveryTimeline: formData.deliveryTimeline,
      paymentTerms: formData.paymentTerms,
      quoteValidity: formData.quoteValidity,
      buyerEmail: formData.email,
      buyerPhone: formData.phone
    }

    try {
      const res = await fetch("http://localhost:5000/api/rfq/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rfqData)
      })

      const data = await res.json()

      if (data.success) {
        alert("✅ RFQ sent successfully!")
        onClose()
      } else {
        alert("❌ Failed to send RFQ: " + data.message)
      }
    } catch (error) {
      console.error("❌ RFQ Error:", error)
      alert("❌ Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <h2 style={title}>📩 Request Quote (RFQ)</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <p style={subText}>Get formal price quote from seller</p>

        <div style={summary}>
          <p><strong>Seller:</strong> {sellerName}</p>
          <p><strong>Items:</strong> {cartItems.length} products</p>
          <p><strong>Total Amount:</strong> ₹{totalAmount}</p>
        </div>

        <div style={itemsList}>
          {cartItems.map((item, index) => (
            <div key={index} style={itemRow}>
              {item.productImage && (
                <img src={item.productImage} alt={item.productName} style={itemImg} />
              )}
              <div style={itemInfo}>
                <p><strong>{item.productName}</strong></p>
                <p>Price: ₹{item.price}/unit</p>
              </div>
            </div>
          ))}
        </div>

        <div style={formContainer}>
          <div style={fieldGroup}>
            <label style={label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={input}
              required
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your 10-digit phone number"
              style={input}
              required
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>
              Quantity *
              <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                (MOQ: {moq} | Stock: {maxStock})
              </span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleQuantityChange}
              placeholder={`Enter quantity (min ${moq})`}
              style={input}
              min={moq}
              max={maxStock}
              required
            />
            {quantityError && (
              <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                {quantityError}
              </p>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={label}>Delivery Timeline *</label>
            <input
              type="text"
              name="deliveryTimeline"
              value={formData.deliveryTimeline}
              onChange={handleChange}
              placeholder="e.g., Within 15 days"
              style={input}
              required
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Payment Terms</label>
            <input
              type="text"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              placeholder="e.g., 20% Advance, 80% on Delivery"
              style={input}
            />
            <small style={{ color: "#64748b", fontSize: "12px" }}>
              Leave empty for no payment terms
            </small>
          </div>

          <div style={fieldGroup}>
            <label style={label}>Quote Validity</label>
            <select
              name="quoteValidity"
              value={formData.quoteValidity}
              onChange={handleChange}
              style={input}
            >
              <option value="7 days">7 days</option>
              <option value="15 days">15 days</option>
              <option value="30 days">30 days</option>
              <option value="45 days">45 days</option>
              <option value="60 days">60 days</option>
              <option value="90 days">90 days</option>
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={label}>Additional Message (Optional)</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Add any specific requirements..."
              style={textarea}
              rows={3}
            />
          </div>
        </div>

        <div style={btnRow}>
          <button onClick={handleSubmit} style={submitBtn} disabled={loading}>
            {loading ? "Sending..." : "📤 Send RFQ"}
          </button>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "20px"
}

const modal = {
  background: "white",
  padding: 25,
  borderRadius: 16,
  width: 520,
  maxWidth: "100%",
  maxHeight: "85vh",
  overflowY: "auto" as const
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4
}

const title = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "bold",
  color: "#0f172a"
}

const closeBtn = {
  background: "none",
  border: "none",
  fontSize: 20,
  cursor: "pointer",
  color: "#94a3b8"
}

const subText = {
  color: "#64748b",
  marginBottom: 15,
  fontSize: "14px"
}

const summary = {
  background: "#f3f4f6",
  padding: 12,
  borderRadius: 8,
  marginBottom: 15
}

const itemsList = {
  maxHeight: 150,
  overflowY: "auto" as const,
  marginBottom: 15
}

const itemRow = {
  display: "flex",
  gap: 12,
  padding: 10,
  borderBottom: "1px solid #eee",
  alignItems: "center"
}

const itemImg = {
  width: 50,
  height: 50,
  objectFit: "cover" as const,
  borderRadius: 6
}

const itemInfo = {
  flex: 1
}

const formContainer = {
  marginBottom: 15
}

const fieldGroup = {
  marginBottom: 12
}

const label = {
  display: "block",
  fontWeight: "bold",
  fontSize: "13px",
  color: "#1e293b",
  marginBottom: 4
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

const btnRow = {
  display: "flex",
  gap: 10
}

const submitBtn = {
  flex: 1,
  padding: "12px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold"
}

const cancelBtn = {
  flex: 1,
  padding: "12px 20px",
  background: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold"
}

export default RFQModal