import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

const Payment = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [orderDetails, setOrderDetails] = useState<any>(null)

  const orderId = searchParams.get("orderId")

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`)
      const data = await res.json()
      setOrderDetails(data)
      
      // ✅ AGAR PAYMENT PAID HAI TOH DIRECT ORDERS PE BHEJO
      if (data.paymentStatus === "Paid") {
        navigate("/orders")
      }
    } catch (error) {
      console.error("Error fetching order:", error)
    }
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // ✅ REAL PAYMENT
  const processPayment = async () => {
    setLoading(true)
    try {
      console.log("🔴 Loading Razorpay script...")
      const isScriptLoaded = await loadRazorpayScript()
      
      if (!isScriptLoaded) {
        alert("❌ Razorpay SDK failed to load.")
        setLoading(false)
        return
      }

      const options = {
        key: "rzp_test_T9S3YNNo2H2x2i",
        amount: Math.round(orderDetails.totalAmount * 100),
        currency: "INR",
        name: "B2B Electronics",
        description: `Order #${orderDetails.orderId}`,
        prefill: {
          name: orderDetails.buyerName || "Test User",
          email: orderDetails.email || "test@example.com",
          contact: orderDetails.phone || "9876543210"
        },
        theme: {
          color: "#2563eb"
        },
        handler: async function(response: any) {
          console.log("✅ Payment success:", response)
          
          // ✅ VERIFY PAYMENT
          const verifyRes = await fetch("http://localhost:5000/api/payment/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_payment_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              orderNo: orderDetails.orderId
            })
          })

          const verifyData = await verifyRes.json()
          console.log("🔵 Verify response:", verifyData)
          
          if (verifyData.success) {
            alert("✅ Payment successful!")
            // ✅ UPDATE LOCAL STATE
            setOrderDetails(prev => ({
              ...prev,
              paymentStatus: "Paid"
            }))
            setTimeout(() => navigate("/orders"), 1500)
          } else {
            alert("❌ Payment verification failed")
          }
          setLoading(false)
        },
        modal: {
          ondismiss: function() {
            alert("Payment cancelled")
            setLoading(false)
          }
        }
      }
      
      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
      
    } catch (error: any) {
      console.error("❌ Payment error:", error)
      alert("❌ Payment failed: " + error.message)
      setLoading(false)
    }
  }

  // ✅ FAKE PAYMENT
  const processFakePayment = async () => {
    if (!window.confirm("⚠️ This is a FAKE payment for testing. Proceed?")) return
    
    setLoading(true)
    
    try {
      console.log("🔵 Processing fake payment for order:", orderDetails.orderId)
      
      const res = await fetch("http://localhost:5000/api/payment/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "fake_" + Date.now(),
          paymentId: "fake_pay_" + Date.now(),
          signature: "fake_sig",
          orderNo: orderDetails.orderId
        })
      })

      const data = await res.json()
      console.log("🔵 Fake payment response:", data)
      
      if (data.success) {
        alert("✅ Payment successful! (Fake)")
        // ✅ UPDATE LOCAL STATE
        setOrderDetails(prev => ({
          ...prev,
          paymentStatus: "Paid"
        }))
        setTimeout(() => {
          navigate("/orders")
        }, 1500)
      } else {
        alert("❌ Payment failed: " + data.message)
        setLoading(false)
      }
    } catch (error) {
      console.error("❌ Fake payment error:", error)
      alert("❌ Payment failed")
      setLoading(false)
    }
  }

  // ✅ AGAR PAID HAI TOH PAYMENT OPTION MAT DIKHAO
  if (orderDetails?.paymentStatus === "Paid") {
    return (
      <div style={container}>
        <div style={card}>
          <div style={alreadyPaidBox}>
            <span style={alreadyPaidIcon}>✅</span>
            <h2 style={alreadyPaidTitle}>Payment Already Completed!</h2>
            <p style={alreadyPaidText}>Order #{orderDetails.orderId} has been paid.</p>
            <button onClick={() => navigate("/orders")} style={gotoOrdersBtn}>
              📋 Go to Orders
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
  }

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={title}>💳 Payment</h2>
        <p style={subtitle}>Order ID: {orderDetails.orderId}</p>

        <div style={summaryBox}>
          <p><b>Product:</b> {orderDetails.productName}</p>
          <p><b>Quantity:</b> {orderDetails.quantity} units</p>
          <p><b>Total:</b> ₹{orderDetails.totalAmount}</p>
        </div>

        <button onClick={processPayment} style={payBtn} disabled={loading}>
          {loading ? "Processing..." : "💳 Pay with Razorpay"}
        </button>

        <button 
          onClick={processFakePayment} 
          style={{...payBtn, background: "#8b5cf6", marginTop: "10px"}} 
          disabled={loading}
        >
          {loading ? "Processing..." : "🔴 Fake Payment (Test)"}
        </button>
      </div>
    </div>
  )
}

// ================= STYLES =================

const container = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "#f1f5f9",
  padding: 20
}

const card = {
  background: "white",
  padding: 30,
  borderRadius: 16,
  maxWidth: 500,
  width: "100%",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
}

const title = {
  margin: 0,
  color: "#1e293b",
  fontSize: 24
}

const subtitle = {
  color: "#64748b",
  marginBottom: 20
}

const summaryBox = {
  background: "#f8fafc",
  padding: 15,
  borderRadius: 10,
  marginBottom: 20
}

const payBtn = {
  width: "100%",
  padding: 14,
  background: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer"
}

// ✅ ALREADY PAID STYLES
const alreadyPaidBox = {
  textAlign: "center" as const,
  padding: "20px 0"
}

const alreadyPaidIcon = {
  fontSize: "48px",
  display: "block",
  marginBottom: "12px"
}

const alreadyPaidTitle = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#166534",
  marginBottom: "8px"
}

const alreadyPaidText = {
  color: "#64748b",
  marginBottom: "20px"
}

const gotoOrdersBtn = {
  padding: "10px 24px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px"
}

export default Payment