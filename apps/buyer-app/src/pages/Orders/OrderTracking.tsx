import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { API_URL } from "../../config"

const OrderTracking = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)

  const [addressData, setAddressData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  })

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    if (user._id) {
      setAddressData({
        fullName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        addressLine1: user.addressLine1 || "",
        addressLine2: user.addressLine2 || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        country: user.country || "India"
      })
    }
  }, [])

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`)
      const data = await res.json()
      setOrder(data)
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Pending": return "#f59e0b"
      case "Confirmed": return "#3b82f6"
      case "Processing": return "#8b5cf6"
      case "Shipped": return "#06b6d4"
      case "Delivered": return "#22c55e"
      case "Cancelled": return "#ef4444"
      default: return "#6b7280"
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Pending": return "⏳"
      case "Confirmed": return "✅"
      case "Processing": return "⚙️"
      case "Shipped": return "🚚"
      case "Delivered": return "📦"
      case "Cancelled": return "❌"
      default: return "📋"
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAddressData(prev => ({ ...prev, [name]: value }))
  }

  const validateAddress = () => {
    const { fullName, phone, addressLine1, city, state, pincode } = addressData
    if (!fullName.trim()) { alert("Please enter full name"); return false }
    if (!phone.trim() || phone.length < 10) { alert("Please enter valid phone number"); return false }
    if (!addressLine1.trim()) { alert("Please enter address"); return false }
    if (!city.trim()) { alert("Please enter city"); return false }
    if (!state.trim()) { alert("Please enter state"); return false }
    if (!pincode.trim() || pincode.length < 6) { alert("Please enter valid pincode"); return false }
    return true
  }

  const saveAddress = async () => {
    if (!validateAddress()) return

    const fullAddress = `${addressData.addressLine1}, ${addressData.addressLine2 || ""}, ${addressData.city}, ${addressData.state}, ${addressData.pincode}, ${addressData.country}`

    try {
      const res = await fetch(`${API_URL}/orders/status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Confirmed",
          note: `Address confirmed: ${fullAddress}`
        })
      })

      if (res.ok) {
        alert("✅ Address saved successfully!")
        setShowAddressForm(false)
        setIsEditingAddress(false)
        fetchOrder()
        
        await fetch(`${API_URL}/auth/buyer/profile/${user._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressData)
        })
        
        const updatedUser = { ...user, ...addressData }
        localStorage.setItem("user", JSON.stringify(updatedUser))
      }
    } catch (error) {
      alert("❌ Failed to save address")
    }
  }

  const getAdvanceAmount = () => {
    if (order?.advanceAmount) return order.advanceAmount
    if (order?.quoteData?.advanceAmount) return order.quoteData.advanceAmount
    const total = order?.totalAmount || 0
    const advancePercent = order?.advancePercent || order?.quoteData?.advancePercent || 40
    return total * advancePercent / 100
  }

  const getRemainingAmount = () => {
    if (order?.remainingAmount) return order.remainingAmount
    if (order?.quoteData?.remainingAmount) return order.quoteData.remainingAmount
    const total = order?.totalAmount || 0
    const remainingPercent = order?.remainingPercent || order?.quoteData?.remainingPercent || 60
    return total * remainingPercent / 100
  }

  const proceedToPayment = () => {
    const advanceAmount = getAdvanceAmount()
    navigate(`/payment?orderId=${orderId}&amount=${advanceAmount}`)
  }

  const cancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert("Please enter a reason for cancellation")
      return
    }

    if (!window.confirm("Are you sure you want to cancel this order?")) return

    try {
      const res = await fetch(`${API_URL}/orders/cancel/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (res.ok) {
        alert("❌ Order cancelled successfully!")
        setShowCancelModal(false)
        fetchOrder()
      }
    } catch (error) {
      alert("❌ Failed to cancel order")
    }
  }

  const toggleEditAddress = () => {
    setIsEditingAddress(!isEditingAddress)
    setShowAddressForm(true)
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
  if (!order) return <div style={{ padding: 40, textAlign: "center" }}>Order not found</div>

  const isPaymentDone = order?.paymentStatus === "Paid"
  const hasAddress = order.shippingAddress && order.shippingAddress !== "To be confirmed"
  const canCancel = ["Pending", "Confirmed"].includes(order.status) && !isPaymentDone
  
  const advanceAmount = getAdvanceAmount()
  const remainingAmount = getRemainingAmount()

  return (
    <div style={container}>
      <div style={card}>
        <div style={headerRow}>
          <h2 style={title}>📦 Order Tracking</h2>
          <span style={{ fontSize: "14px", color: "#64748b" }}>
            Order ID: {order.orderId}
          </span>
        </div>

        <div style={statusBar}>
          <span style={{
            ...statusBadge,
            background: getStatusColor(order.status)
          }}>
            {getStatusIcon(order.status)} {order.status}
          </span>
          <span style={date}>{new Date(order.createdAt).toLocaleString()}</span>
        </div>

        <div style={detailsGrid}>
          <div><strong>Product:</strong> {order.productName}</div>
          <div><strong>Quantity:</strong> {order.quantity} units</div>
          <div><strong>Total:</strong> ₹{order.totalAmount}</div>
          <div>
            <strong>Payment Status:</strong> 
            <span style={{
              marginLeft: "8px",
              padding: "2px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold",
              background: isPaymentDone ? "#dcfce7" : "#fef3c7",
              color: isPaymentDone ? "#166534" : "#92400e"
            }}>
              {isPaymentDone ? "✅ Paid" : "⏳ Pending"}
            </span>
          </div>
        </div>

        <div style={paymentBreakdownBox}>
          <h4 style={paymentBreakdownTitle}>💰 Payment Breakdown</h4>
          <div style={paymentBreakdownGrid}>
            <div style={paymentBreakdownItem}>
              <span style={paymentBreakdownLabel}>📈 Advance Payment ({order?.advancePercent || order?.quoteData?.advancePercent || 40}%)</span>
              <span style={{...paymentBreakdownValue, color: "#f59e0b", fontWeight: "bold"}}>
                ₹{advanceAmount.toFixed(2)}
              </span>
            </div>
            <div style={paymentBreakdownItem}>
              <span style={paymentBreakdownLabel}>📉 Remaining Amount ({order?.remainingPercent || order?.quoteData?.remainingPercent || 60}%)</span>
              <span style={{...paymentBreakdownValue, color: "#ef4444", fontWeight: "bold"}}>
                ₹{remainingAmount.toFixed(2)}
              </span>
            </div>
            {isPaymentDone && (
              <div style={paymentBreakdownItem}>
                <span style={paymentBreakdownLabel}>✅ Paid Status</span>
                <span style={{...paymentBreakdownValue, color: "#22c55e", fontWeight: "bold"}}>
                  Advance Paid - ₹{advanceAmount.toFixed(2)}
                </span>
              </div>
            )}
            {!isPaymentDone && (
              <div style={paymentBreakdownItem}>
                <span style={paymentBreakdownLabel}>⏳ Pending Payment</span>
                <span style={{...paymentBreakdownValue, color: "#ef4444", fontWeight: "bold"}}>
                  ₹{advanceAmount.toFixed(2)} (Advance)
                </span>
              </div>
            )}
          </div>
        </div>

        {(order.quoteData || order.originalTotal) && (
          <div style={quoteDataBox}>
            <h3 style={quoteDataTitle}>📋 Quote Details</h3>
            <div style={quoteDataGrid}>
              <div style={quoteDataItem}>
                <span style={quoteDataLabel}>📦 Total Quantity</span>
                <span style={quoteDataValue}>{order.quoteData?.totalQuantity || order.quantity || 0} units</span>
              </div>
              <div style={quoteDataItem}>
                <span style={quoteDataLabel}>💰 Original Total</span>
                <span style={quoteDataValue}>₹{(order.quoteData?.originalTotal || order.originalTotal || order.totalAmount)?.toFixed(2)}</span>
              </div>
              <div style={quoteDataItem}>
                <span style={quoteDataLabel}>🏷️ Bulk Amount</span>
                <span style={{ ...quoteDataValue, color: "#22c55e", fontWeight: "bold" }}>
                  ₹{(order.quoteData?.bulkAmount || order.bulkAmount || order.totalAmount)?.toFixed(2)}
                </span>
              </div>
              <div style={{ ...quoteDataItem, borderTop: "2px solid #e2e8f0", paddingTop: "10px", marginTop: "4px" }}>
                <span style={{ ...quoteDataLabel, fontWeight: "bold" }}>💵 Price to Pay</span>
                <span style={{ ...quoteDataValue, color: "#2563eb", fontSize: "18px", fontWeight: "bold" }}>
                  ₹{(order.quoteData?.totalQuote || order.totalAmount)?.toFixed(2)}
                </span>
              </div>
              <div style={{ ...quoteDataItem, background: "#fef3c7", borderRadius: "6px", padding: "8px 12px", marginTop: "4px" }}>
                <span style={{ ...quoteDataLabel, fontWeight: "bold", color: "#92400e" }}>📈 Advance Payment ({order.quoteData?.advancePercent || order.advancePercent || 40}%)</span>
                <span style={{ ...quoteDataValue, color: "#f59e0b", fontWeight: "bold", fontSize: "16px" }}>
                  ₹{advanceAmount.toFixed(2)}
                </span>
              </div>
              <div style={quoteDataItem}>
                <span style={quoteDataLabel}>📉 Remaining ({order.quoteData?.remainingPercent || order.remainingPercent || 60}%)</span>
                <span style={{ ...quoteDataValue, color: "#ef4444", fontWeight: "bold" }}>
                  ₹{remainingAmount.toFixed(2)}
                </span>
              </div>
              <div style={quoteDataItem}>
                <span style={quoteDataLabel}>📅 Delivery</span>
                <span style={quoteDataValue}>
                  {order.quoteData?.deliveryDate || order.deliveryDate 
                    ? new Date(order.quoteData?.deliveryDate || order.deliveryDate).toLocaleDateString() 
                    : "To be confirmed"}
                </span>
              </div>
              {(order.quoteData?.quoteMessage || order.quoteMessage) && (
                <div style={quoteDataItem}>
                  <span style={quoteDataLabel}>📝 Message</span>
                  <span style={{ ...quoteDataValue, fontStyle: "italic" }}>
                    "{order.quoteData?.quoteMessage || order.quoteMessage}"
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {isPaymentDone && (
          <div style={paymentSuccessBanner}>
            <span style={paymentSuccessIcon}>✅</span>
            <span style={paymentSuccessText}>Advance Payment Completed Successfully!</span>
          </div>
        )}

        <div style={stepBox}>
          <div style={stepHeader}>
            <span style={stepNumber}>1</span>
            <span style={stepTitle}>📍 Shipping Address</span>
            {hasAddress && <span style={stepDone}>✅ Done</span>}
          </div>

          {!hasAddress ? (
            <>
              {!showAddressForm ? (
                <button
                  style={{ ...actionBtn, background: "#2563eb" }}
                  onClick={() => setShowAddressForm(true)}
                >
                  Edit Address
                </button>
              ) : (
                <div style={formContainer}>
                  <div style={fieldGroup}>
                    <label style={label}>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={addressData.fullName}
                      onChange={handleAddressChange}
                      style={input}
                    />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={addressData.phone}
                      onChange={handleAddressChange}
                      style={input}
                    />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Address Line 1 *</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={addressData.addressLine1}
                      onChange={handleAddressChange}
                      style={input}
                    />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Address Line 2</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={addressData.addressLine2}
                      onChange={handleAddressChange}
                      style={input}
                    />
                  </div>
                  <div style={row}>
                    <div style={halfField}>
                      <label style={label}>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={addressData.city}
                        onChange={handleAddressChange}
                        style={input}
                      />
                    </div>
                    <div style={halfField}>
                      <label style={label}>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={addressData.state}
                        onChange={handleAddressChange}
                        style={input}
                      />
                    </div>
                  </div>
                  <div style={row}>
                    <div style={halfField}>
                      <label style={label}>Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={addressData.pincode}
                        onChange={handleAddressChange}
                        style={input}
                      />
                    </div>
                    <div style={halfField}>
                      <label style={label}>Country</label>
                      <input
                        type="text"
                        name="country"
                        value={addressData.country}
                        onChange={handleAddressChange}
                        style={input}
                        readOnly
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                    <button onClick={saveAddress} style={saveBtn}>
                      ✅ Save Address
                    </button>
                    <button onClick={() => setShowAddressForm(false)} style={cancelBtn}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={addressDisplay}>
                <p><strong>Shipping Address:</strong></p>
                <p>{order.shippingAddress}</p>
                {order.status === "Pending" && !isPaymentDone && (
                  <button
                    style={editAddressBtn}
                    onClick={toggleEditAddress}
                  >
                    ✏️ Edit Address
                  </button>
                )}
              </div>
              {isEditingAddress && (
                <div style={formContainer}>
                  <h4 style={{ marginTop: 0 }}>✏️ Edit Address</h4>
                  <div style={fieldGroup}>
                    <label style={label}>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={addressData.fullName}
                      onChange={handleAddressChange}
                      style={input}
                    />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={addressData.phone}
                      onChange={handleAddressChange}
                      style={input}
                    />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Address Line 1 *</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={addressData.addressLine1}
                      onChange={handleAddressChange}
                      style={input}
                    />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Address Line 2</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={addressData.addressLine2}
                      onChange={handleAddressChange}
                      style={input}
                    />
                  </div>
                  <div style={row}>
                    <div style={halfField}>
                      <label style={label}>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={addressData.city}
                        onChange={handleAddressChange}
                        style={input}
                      />
                    </div>
                    <div style={halfField}>
                      <label style={label}>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={addressData.state}
                        onChange={handleAddressChange}
                        style={input}
                      />
                    </div>
                  </div>
                  <div style={row}>
                    <div style={halfField}>
                      <label style={label}>Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={addressData.pincode}
                        onChange={handleAddressChange}
                        style={input}
                      />
                    </div>
                    <div style={halfField}>
                      <label style={label}>Country</label>
                      <input
                        type="text"
                        name="country"
                        value={addressData.country}
                        onChange={handleAddressChange}
                        style={input}
                        readOnly
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                    <button onClick={saveAddress} style={saveBtn}>
                      ✅ Update Address
                    </button>
                    <button onClick={() => setIsEditingAddress(false)} style={cancelBtn}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={stepBox}>
          <div style={stepHeader}>
            <span style={stepNumber}>2</span>
            <span style={stepTitle}>💳 Make Advance Payment</span>
            {isPaymentDone && <span style={stepDone}>✅ Paid</span>}
          </div>

          {isPaymentDone ? (
            <div style={paymentSuccessBox}>
              <span style={paymentSuccessIcon}>✅</span>
              <span style={paymentSuccessText}>
                Advance Payment of ₹{advanceAmount.toFixed(2)} completed successfully!
              </span>
            </div>
          ) : (
            <button
              style={{ ...actionBtn, background: "#22c55e" }}
              onClick={proceedToPayment}
            >
              💳 Pay Advance - ₹{advanceAmount.toFixed(2)}
            </button>
          )}
        </div>

        <div style={stepBox}>
          <div style={stepHeader}>
            <span style={stepNumber}>3</span>
            <span style={stepTitle}>✅ Order Complete</span>
            {order.status === "Delivered" && <span style={stepDone}>🎉 Delivered!</span>}
          </div>

          {order.status === "Delivered" && (
            <div style={successBox}>
              <span>🎉 Your order has been delivered successfully!</span>
            </div>
          )}

          {isPaymentDone && order.status !== "Delivered" && (
            <div style={processingBox}>
              <span>⏳ Your order is being processed. Track status below.</span>
            </div>
          )}
        </div>

        {canCancel && (
          <div style={actionButtons}>
            <button
              style={{ ...actionBtn, background: "#ef4444" }}
              onClick={() => setShowCancelModal(true)}
            >
              ❌ Cancel Order
            </button>
          </div>
        )}

        {showCancelModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3 style={{ marginTop: 0 }}>❌ Cancel Order</h3>
              <p><b>Order:</b> {order.orderId}</p>
              <p><b>Product:</b> {order.productName}</p>
              <div style={fieldGroup}>
                <label style={label}>Reason for cancellation *</label>
                <textarea
                  placeholder="Please tell us why you want to cancel..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ ...input, minHeight: 80, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                <button onClick={cancelOrder} style={{ ...saveBtn, background: "#ef4444" }}>
                  ❌ Confirm Cancel
                </button>
                <button onClick={() => setShowCancelModal(false)} style={cancelBtn}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <h3 style={{ marginTop: 20 }}>📌 Tracking Timeline</h3>
        <div style={timeline}>
          {order.tracking?.map((event: any, index: number) => (
            <div key={index} style={timelineItem}>
              <div style={timelineDot}></div>
              <div style={timelineContent}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>{event.status}</h4>
                <p style={{ margin: '5px 0', color: '#64748b', fontSize: 12 }}>
                  {new Date(event.timestamp).toLocaleString()}
                </p>
                {event.note && (
                  <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>{event.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.open(`${API_URL}/invoice/${order.orderId}`, '_blank')}
          style={invoiceBtn}
        >
          📄 Download Invoice
        </button>

        <button
          onClick={() => navigate("/orders")}
          style={backBtn}
        >
          ← Back to Orders
        </button>
      </div>
    </div>
  )
}

const container = {
  padding: 20,
  maxWidth: 700,
  margin: "auto",
  minHeight: "100vh",
  background: "#f1f5f9"
}

const card = {
  background: "white",
  padding: 25,
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
}

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10
}

const title = {
  margin: 0,
  color: "#1e293b"
}

const statusBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20
}

const statusBadge = {
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: "bold",
  color: "white"
}

const date = {
  color: "#64748b",
  fontSize: 14
}

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  padding: 15,
  background: "#f8fafc",
  borderRadius: 10,
  marginBottom: 20
}

const paymentBreakdownBox = {
  background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
  padding: "16px 20px",
  borderRadius: "12px",
  border: "1px solid #bae6fd",
  marginBottom: "16px"
}

const paymentBreakdownTitle = {
  fontSize: "15px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: "0 0 10px 0"
}

const paymentBreakdownGrid = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px"
}

const paymentBreakdownItem = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid #e2e8f0"
}

const paymentBreakdownLabel = {
  fontSize: "14px",
  color: "#64748b"
}

const paymentBreakdownValue = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#0f172a"
}

const quoteDataBox = {
  background: "#f0f9ff",
  padding: "16px 20px",
  borderRadius: "12px",
  border: "1px solid #bae6fd",
  marginBottom: 20
}

const quoteDataTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 12px 0"
}

const quoteDataGrid = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px"
}

const quoteDataItem = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid #e2e8f0"
}

const quoteDataLabel = {
  fontSize: "13px",
  color: "#64748b"
}

const quoteDataValue = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#0f172a"
}

const paymentSuccessBanner = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 16px",
  background: "#dcfce7",
  borderRadius: "10px",
  border: "1px solid #86efac",
  marginBottom: "16px"
}

const paymentSuccessIcon = {
  fontSize: "20px"
}

const paymentSuccessText = {
  fontWeight: "bold",
  color: "#166534",
  fontSize: "15px"
}

const paymentSuccessBox = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 16px",
  background: "#dcfce7",
  borderRadius: "10px",
  border: "1px solid #86efac"
}

const stepBox = {
  padding: "16px",
  marginBottom: "12px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "#fafafa"
}

const stepHeader = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "10px"
}

const stepNumber = {
  background: "#2563eb",
  color: "white",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: "bold"
}

const stepTitle = {
  fontWeight: "bold",
  color: "#0f172a",
  fontSize: "16px"
}

const stepDone = {
  color: "#22c55e",
  fontWeight: "bold",
  fontSize: "13px",
  marginLeft: "auto"
}

const actionBtn = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
  width: "100%"
}

const editAddressBtn = {
  padding: "6px 14px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
  marginTop: "8px"
}

const actionButtons = {
  display: "flex",
  gap: 10,
  marginBottom: 10,
  flexWrap: "wrap" as const
}

const formContainer = {
  marginTop: 10,
  padding: 15,
  background: "#f8fafc",
  borderRadius: 10,
  border: "1px solid #e2e8f0"
}

const fieldGroup = {
  marginBottom: 12
}

const label = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
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

const row = {
  display: "flex",
  gap: "16px"
}

const halfField = {
  flex: 1,
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px"
}

const saveBtn = {
  padding: "10px 20px",
  background: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
  flex: 1
}

const cancelBtn = {
  padding: "10px 20px",
  background: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold"
}

const addressDisplay = {
  padding: "12px 16px",
  background: "#f0fdf4",
  borderRadius: "8px",
  border: "1px solid #bbf7d0"
}

const successBox = {
  padding: "12px 16px",
  background: "#dcfce7",
  borderRadius: "8px",
  color: "#166534",
  fontWeight: "bold"
}

const processingBox = {
  padding: "12px 16px",
  background: "#dbeafe",
  borderRadius: "8px",
  color: "#1e40af"
}

const modalOverlay = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
}

const modalContent = {
  background: "white",
  padding: 25,
  borderRadius: 12,
  width: 450,
  maxWidth: "95%"
}

const timeline = {
  marginTop: 10,
  paddingLeft: 20,
  borderLeft: "2px solid #e2e8f0"
}

const timelineItem = {
  display: "flex",
  gap: 15,
  marginBottom: 20
}

const timelineDot = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: "#3b82f6",
  marginTop: 5,
  flexShrink: 0
}

const timelineContent = {
  flex: 1
}

const invoiceBtn = {
  width: "100%",
  padding: 12,
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: 10
}

const backBtn = {
  width: "100%",
  padding: 12,
  background: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: 10
}

export default OrderTracking