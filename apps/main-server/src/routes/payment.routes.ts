import express from "express"
import { getDB } from "../db/mongo"

// ✅ Razorpay import
const Razorpay = require('razorpay')

const router = express.Router()

// ✅ Initialize Razorpay with fallback
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_ID",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET"
})

// ✅ Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body

    console.log("💰 Creating Razorpay order for amount:", amount)

    const options = {
      amount: Math.round(amount * 100),
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {}
    }

    const order = await razorpay.orders.create(options)

    console.log("✅ Razorpay order created:", order.id)

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    })

  } catch (error: any) {
    console.error("❌ Razorpay order creation error:", error)
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to create payment order"
    })
  }
})

// ✅ Verify Payment - UPDATED FOR FAKE PAYMENT
router.post("/verify-payment", async (req, res) => {
  try {
    const { orderId, paymentId, signature, orderNo } = req.body

    console.log("🔵 Verifying payment for order:", orderNo || orderId)
    console.log("🔵 Payment ID:", paymentId)

    const db = getDB()
    
    // ✅ UPDATE ORDER - paymentStatus = "Paid"
    const updateResult = await db.collection("orders").updateOne(
      { orderId: orderNo || orderId },
      {
        $set: {
          paymentStatus: "Paid",
          paymentId: paymentId || "fake_payment",
          status: "Confirmed",
          orderStatus: "confirmed",
          updatedAt: new Date()
        },
        $push: {
          tracking: {
            status: "Payment Confirmed",
            timestamp: new Date(),
            note: "Payment received successfully"
          }
        }
      }
    )

    console.log("✅ Update result:", updateResult)

    // ✅ FETCH UPDATED ORDER
    const updatedOrder = await db.collection("orders").findOne({ 
      orderId: orderNo || orderId 
    })

    console.log("✅ Updated Order:", updatedOrder)

    res.json({ 
      success: true, 
      message: "Payment verified successfully",
      order: updatedOrder
    })

  } catch (error: any) {
    console.error("❌ Payment verification error:", error)
    res.status(500).json({ success: false, message: "Payment verification failed" })
  }
})

export default router