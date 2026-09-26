import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { io } from "socket.io-client"

const socket = io("https://electrons-1.onrender.com")

const SellerChat = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  
  // ✅ ORDER MODAL STATES
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [totalPrice, setTotalPrice] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")
  const [perUnitPrice, setPerUnitPrice] = useState<number>(0)
  const [paymentTerms, setPaymentTerms] = useState<string>("Advance")
  const [deliveryDate, setDeliveryDate] = useState<string>("")
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [productDetails, setProductDetails] = useState<any>(null)

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  
  // ✅ YAHI SE PRODUCT DETAILS LO - LOCATION.STATE SE
  const buyerId = location.state?.buyerId || ""
  const productName = location.state?.productName || "Product"
  const productId = location.state?.productId || ""
  const productImage = location.state?.productImage || ""
  const currentRoomId = roomId || location.state?.roomId || ""

  // ✅ FETCH PRODUCT DETAILS FOR ORDER
  useEffect(() => {
    if (productId) {
      fetchProductDetails()
    }
  }, [productId])

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`https://electrons-1.onrender.com/api/products/${productId}`)
      const data = await res.json()
      setProductDetails(data)
    } catch (error) {
      console.error("Error fetching product:", error)
    }
  }

  useEffect(() => {
    if (!currentRoomId) {
      navigate("/chats")
      return
    }

    console.log("🔵 Seller Chat Room ID:", currentRoomId)
    console.log("🔵 Product ID:", productId)
    console.log("🔵 Product Name:", productName)

    socket.emit("join_room", currentRoomId)

    fetchChatHistory()

    socket.on("receive_message", (msg) => {
      console.log("🔵 Seller received:", msg)
      if (msg.roomId === currentRoomId) {
        setMessages((prev) => [...prev, msg])
      }
    })

    return () => {
      socket.off("receive_message")
    }
  }, [currentRoomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`https://electrons-1.onrender.com/api/chat/${currentRoomId}`)
      const data = await res.json()
      console.log("🔵 Seller chat history:", data)
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching chat:", error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !currentRoomId) return

    const finalProductId = productId || location.state?.productId || "general"

    const messageData = {
      roomId: currentRoomId,
      senderId: user._id,
      senderRole: "seller",
      senderName: user.companyName || user.name || "Seller",
      receiverId: buyerId,
      receiverName: "Buyer",
      message: newMessage,
      productId: finalProductId,
      productName: productName || "",
      productImage: location.state?.productImage || "",
      createdAt: new Date()
    }

    console.log("🔵 SELLER SENDING:", messageData)
    socket.emit("send_message", messageData)
    setMessages((prev) => [...prev, messageData])
    setNewMessage("")
  }

  // ============================================================
  // ✅ HANDLE TOTAL PRICE CHANGE
  // ============================================================
  const handleTotalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTotalPrice(value)
      calculatePerUnitPrice(value, quantity)
    }
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d*$/.test(value)) {
      setQuantity(value)
      calculatePerUnitPrice(totalPrice, value)
    }
  }

  const calculatePerUnitPrice = (price: string, qty: string) => {
    const total = parseFloat(price) || 0
    const q = parseInt(qty) || 1
    const perUnit = q > 0 ? total / q : 0
    setPerUnitPrice(perUnit)
  }

  const preventArrowKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
    }
  }

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentTerms(e.target.value)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryDate(e.target.value)
  }

  // ============================================================
  // ✅ CREATE ORDER - SAME PRODUCT SE (FIXED)
  // ============================================================
  const createOrder = async () => {
    const total = parseFloat(totalPrice)
    const qty = parseInt(quantity) || 0
    
    if (!totalPrice || total <= 0) {
      alert("Please enter a valid total price")
      return
    }
    if (!quantity || qty <= 0) {
      alert("Please enter valid quantity")
      return
    }

    setCreatingOrder(true)

    try {
      const perUnit = total / qty

      // ✅ FIXED: DIRECTLY USE productId, productName, productImage FROM LOCATION.STATE
      const finalProductId = productId || "general"
      const finalProductName = productName || "Product"
      const finalProductImage = productImage || ""

      const orderData = {
        buyerId: buyerId,
        sellerId: user._id,
        productId: finalProductId,
        productName: finalProductName,
        productImage: finalProductImage,
        quantity: qty,
        price: perUnit,
        totalAmount: total,
        paymentTerms: paymentTerms,
        shippingAddress: "To be confirmed by buyer",
        roomId: currentRoomId,
        buyerName: location.state?.buyerName || "Buyer",
        sellerName: user.companyName || user.name || "Seller",
        deliveryDate: deliveryDate || ""
      }

      console.log("📦 Creating Order:", orderData)

      const res = await fetch("https://electrons-1.onrender.com/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (data.success) {
        // ✅ SEND ORDER CONFIRMATION MESSAGE IN CHAT
        const confirmMessage = {
          roomId: currentRoomId,
          senderId: user._id,
          senderRole: "seller",
          senderName: user.companyName || user.name || "Seller",
          receiverId: buyerId,
          receiverName: "Buyer",
          message: `📦 Order #${data.orderNo} created! Product: ${finalProductName}, Qty: ${qty}, Total: ₹${total.toFixed(2)}. Please confirm shipping address.`,
          productId: finalProductId,
          productName: finalProductName,
          productImage: finalProductImage,
          createdAt: new Date()
        }

        socket.emit("send_message", confirmMessage)
        setMessages((prev) => [...prev, confirmMessage])

        alert(`✅ Order #${data.orderNo} created successfully!`)
        
        setShowOrderModal(false)
        setTotalPrice("")
        setQuantity("1")
        setPerUnitPrice(0)
        setPaymentTerms("Advance")
        setDeliveryDate("")
        
        navigate("/orders")
      } else {
        alert("❌ Failed to create order: " + data.message)
      }
    } catch (error) {
      console.error("❌ Order creation error:", error)
      alert("❌ Server error. Please try again.")
    } finally {
      setCreatingOrder(false)
    }
  }

  const closeModal = () => {
    setShowOrderModal(false)
    setTotalPrice("")
    setQuantity("1")
    setPerUnitPrice(0)
    setPaymentTerms("Advance")
    setDeliveryDate("")
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
  }

  return (
    <div style={container}>
      {/* ✅ CHAT HEADER WITH CREATE ORDER BUTTON */}
      <div style={header}>
        <div style={headerLeft}>
          <button onClick={() => navigate("/chats")} style={backBtn}>← Back</button>
          <div style={headerInfo}>
            {productImage ? (
              <img src={productImage} alt={productName} style={headerProductImage} />
            ) : (
              <div style={headerProductImagePlaceholder}>📦</div>
            )}
            <div style={headerText}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>
                💬 {productName || "Chat"}
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                {location.state?.buyerName || "Buyer"}
              </p>
            </div>
          </div>
        </div>
        
        <button
          style={createOrderBtn}
          onClick={() => {
            console.log("🔵 Create Order clicked!")
            console.log("🔵 productId:", productId)
            console.log("🔵 productName:", productName)
            console.log("🔵 buyerId:", buyerId)
            
            if (!productId || productId === "") {
              alert("⚠️ Product ID not found. Please select a product to create order.")
              return
            }
            if (!buyerId) {
              alert("⚠️ Buyer ID not found. Please refresh and try again.")
              return
            }
            setShowOrderModal(true)
          }}
        >
          📦 Create Order
        </button>
      </div>

      {/* MESSAGES AREA */}
      <div style={messagesArea}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>
            No messages yet. Start chatting!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...messageBubble,
                justifyContent: msg.senderId === user._id ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  ...bubble,
                  background: msg.senderId === user._id ? "#2563eb" : "#e5e7eb",
                  color: msg.senderId === user._id ? "white" : "black"
                }}
              >
                <strong>{msg.senderName || (msg.senderId === user._id ? "You" : "Buyer")}</strong>
                <p style={{ margin: "5px 0" }}>{msg.message}</p>
                <small style={{ fontSize: 10 }}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </small>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div style={inputArea}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          style={input}
        />
        <button onClick={sendMessage} style={sendBtn}>
          Send
        </button>
      </div>

      {/* ============================================================ */}
      {/* ✅ ORDER MODAL */}
      {/* ============================================================ */}
      {showOrderModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>📦 Create Order</h3>
              <button onClick={closeModal} style={modalCloseBtn}>✕</button>
            </div>

            {/* Product Summary - SAME PRODUCT */}
            <div style={productSummary}>
              {productImage && (
                <img src={productImage} alt={productName} style={summaryImage} />
              )}
              <div style={summaryDetails}>
                <p><strong>{productName || "Product"}</strong></p>
                <p style={{ fontSize: "13px", color: "#64748b" }}>
                  Buyer: {location.state?.buyerName || "Buyer"}
                </p>
                {productDetails?.price && (
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Listed Price: ₹{productDetails.price}/unit
                  </p>
                )}
              </div>
            </div>

            <div style={formGroup}>
              <label style={label}>Total Price (₹) *</label>
              <input
                type="text"
                value={totalPrice}
                onChange={handleTotalPriceChange}
                onKeyDown={preventArrowKeys}
                placeholder="Enter total price for this order"
                style={inputField}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Quantity *</label>
              <input
                type="text"
                value={quantity}
                onChange={handleQuantityChange}
                onKeyDown={preventArrowKeys}
                placeholder="Enter quantity"
                style={inputField}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Per Unit Price (Auto-calculated)</label>
              <input
                type="text"
                value={perUnitPrice > 0 ? `₹${perUnitPrice.toFixed(2)}` : "₹0.00"}
                disabled
                style={{ ...inputField, background: "#f3f4f6", fontWeight: "500" }}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Payment Terms</label>
              <select value={paymentTerms} onChange={handlePaymentChange} style={inputField}>
                <option value="Advance">Advance</option>
                <option value="Partial">Partial (50% advance)</option>
                <option value="COD">Cash on Delivery</option>
                <option value="Credit">Credit (30 days)</option>
                <option value="LC">Letter of Credit</option>
              </select>
            </div>

            <div style={formGroup}>
              <label style={label}>Expected Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={handleDateChange}
                style={inputField}
              />
            </div>

            <div style={addressNote}>
              <span style={addressNoteIcon}>📍</span>
              <span style={addressNoteText}>
                Buyer will confirm shipping address after order creation
              </span>
            </div>

            {totalPrice && parseFloat(totalPrice) > 0 && (
              <div style={summaryBox}>
                <div style={summaryRow}>
                  <span>Total Price:</span>
                  <span style={summaryAmount}>₹{parseFloat(totalPrice).toFixed(2)}</span>
                </div>
                <div style={summaryRow}>
                  <span>Quantity:</span>
                  <span>{quantity || 0} units</span>
                </div>
                <div style={summaryRow}>
                  <span>Per Unit:</span>
                  <span>₹{perUnitPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={modalActions}>
              <button onClick={createOrder} disabled={creatingOrder} style={createBtn}>
                {creatingOrder ? "Creating..." : "📦 Create Order"}
              </button>
              <button onClick={closeModal} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ================= STYLES =================

const container = {
  display: "flex",
  flexDirection: "column" as const,
  height: "100vh",
  maxWidth: 800,
  margin: "auto",
  background: "#fff"
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  gap: "12px"
}

const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flex: 1,
  minWidth: 0
}

const backBtn = {
  padding: "6px 12px",
  background: "none",
  border: "1px solid #ddd",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "14px",
  color: "#2563eb",
  flexShrink: 0
}

const headerInfo = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: 0
}

const headerProductImage = {
  width: "40px",
  height: "40px",
  objectFit: "cover" as const,
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "white",
  flexShrink: 0
}

const headerProductImagePlaceholder = {
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#f1f5f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  color: "#94a3b8",
  flexShrink: 0
}

const headerText = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "2px",
  minWidth: 0,
  overflow: "hidden"
}

const createOrderBtn = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
  whiteSpace: "nowrap" as const,
  flexShrink: 0
}

const messagesArea = {
  flex: 1,
  overflowY: "auto" as const,
  padding: 15,
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
  background: "#f9fafb"
}

const messageBubble = {
  display: "flex"
}

const bubble = {
  maxWidth: "70%",
  padding: "10px 15px",
  borderRadius: 12,
  margin: "5px 0"
}

const inputArea = {
  display: "flex",
  gap: 10,
  padding: 12,
  borderTop: "1px solid #e2e8f0",
  background: "white"
}

const input = {
  flex: 1,
  padding: "10px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  outline: "none",
  fontSize: "14px"
}

const sendBtn = {
  padding: "10px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "14px"
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
  zIndex: 9999,
  padding: "20px"
}

const modalContent = {
  background: "white",
  padding: "24px",
  borderRadius: "16px",
  width: "480px",
  maxWidth: "100%",
  maxHeight: "90vh",
  overflowY: "auto" as const
}

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px"
}

const modalCloseBtn = {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#94a3b8"
}

const productSummary = {
  display: "flex",
  gap: "12px",
  padding: "12px",
  background: "#f8fafc",
  borderRadius: "8px",
  marginBottom: "16px",
  border: "1px solid #e2e8f0"
}

const summaryImage = {
  width: "60px",
  height: "60px",
  objectFit: "cover" as const,
  borderRadius: "8px"
}

const summaryDetails = {
  flex: 1
}

const formGroup = {
  marginBottom: "14px"
}

const label = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#1e293b",
  marginBottom: "4px"
}

const inputField = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  background: "white",
  boxSizing: "border-box" as const
}

const addressNote = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 14px",
  background: "#fef3c7",
  borderRadius: "8px",
  border: "1px solid #fbbf24",
  marginBottom: "16px"
}

const addressNoteIcon = {
  fontSize: "18px"
}

const addressNoteText = {
  fontSize: "13px",
  color: "#92400e",
  fontWeight: "500"
}

const summaryBox = {
  background: "#f0fdf4",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #bbf7d0",
  marginBottom: "16px"
}

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "4px 0",
  fontSize: "14px"
}

const summaryAmount = {
  fontWeight: "bold",
  color: "#16a34a",
  fontSize: "16px"
}

const modalActions = {
  display: "flex",
  gap: "10px",
  marginTop: "4px"
}

const createBtn = {
  flex: 2,
  padding: "12px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px"
}

const cancelBtn = {
  flex: 1,
  padding: "12px",
  background: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px"
}

export default SellerChat