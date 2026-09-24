import express from "express"
import { getDB } from "../db/mongo"
import { ObjectId } from "mongodb"

const router = express.Router()

// ================= CREATE ORDER (DEFAULT ROUTE) =================
router.post("/", async (req, res) => {
  try {
    const {
      productId,
      productName,
      sellerId,
      buyerId,
      quantity,
      price,
      totalAmount,
      address,
      buyerName,
      phone,
      email
    } = req.body

    if (!productId || !sellerId || !buyerId) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const orderId = "ORD" + Date.now() + Math.floor(Math.random() * 1000)

    const order = {
      orderId,
      buyerId,
      sellerId,
      buyerName: buyerName || "Buyer",
      sellerName: "Seller",
      productId,
      productName,
      productImage: "",
      quantity: Number(quantity),
      price: Number(price),
      totalAmount: Number(totalAmount) || Number(quantity) * Number(price),
      status: "Pending",
      orderStatus: "pending",
      shippingAddress: address || "To be confirmed",
      phone: phone || "",
      email: email || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      tracking: [
        {
          status: "Order Created",
          timestamp: new Date(),
          note: "Order has been created successfully"
        }
      ]
    }

    const result = await getDB().collection("orders").insertOne(order)

    const io = req.app.get("io")
    if (io) {
      io.to(`seller_${sellerId}`).emit("new-order", {
        orderId,
        productName,
        buyerName: buyerName || "Buyer",
        totalAmount: Number(totalAmount)
      })
    }

    res.json({
      success: true,
      orderId: result.insertedId,
      orderNo: order.orderId,
      message: "Order created successfully"
    })
  } catch (err) {
    console.error("Order creation error:", err)
    res.status(500).json({ message: "Failed to create order" })
  }
})

// ================= CREATE ORDER FROM CHAT =================
router.post("/create", async (req, res) => {
  try {
    const {
      buyerId,
      sellerId,
      productId,
      productName,
      productImage,
      quantity,
      price,
      totalAmount,
      paymentTerms,
      shippingAddress,
      roomId,
      buyerName,
      sellerName
    } = req.body

    if (!buyerId || !sellerId || !productId || !quantity || !price) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const orderId = "ORD" + Date.now() + Math.floor(Math.random() * 1000)

    const order = {
      orderId,
      buyerId,
      sellerId,
      buyerName: buyerName || "Buyer",
      sellerName: sellerName || "Seller",
      productId,
      productName,
      productImage: productImage || "",
      quantity: Number(quantity),
      price: Number(price),
      totalAmount: Number(totalAmount) || Number(quantity) * Number(price),
      paymentTerms: paymentTerms || "Advance",
      status: "Pending",
      orderStatus: "pending",
      shippingAddress: shippingAddress || "To be confirmed",
      roomId: roomId || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      tracking: [
        {
          status: "Order Created",
          timestamp: new Date(),
          note: "Order has been created successfully"
        }
      ]
    }

    const result = await getDB().collection("orders").insertOne(order)

    const io = req.app.get("io")
    if (io) {
      io.to(`buyer_${buyerId}`).emit("new-order", {
        orderId,
        productName,
        status: "Pending"
      })
    }

    res.json({ 
      success: true, 
      orderId: result.insertedId, 
      orderNo: order.orderId 
    })
  } catch (err) {
    console.error("Create order error:", err)
    res.status(500).json({ message: "Failed to create order" })
  }
})

// ================= DIRECT ORDER CREATE (BUY NOW) =================
router.post("/create-direct", async (req, res) => {
  try {
    const {
      buyerId,
      sellerId,
      productId,
      productName,
      quantity,
      price,
      totalAmount,
      address,
      paymentMethod,
      buyerName,
      productImage
    } = req.body

    if (!buyerId || !sellerId || !productId || !quantity || !price) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const orderId = "ORD" + Date.now() + Math.floor(Math.random() * 1000)

    const order = {
      orderId,
      buyerId,
      sellerId,
      buyerName: buyerName || "Buyer",
      sellerName: "Seller",
      productId,
      productName,
      productImage: productImage || "",
      quantity: Number(quantity),
      price: Number(price),
      totalAmount: Number(totalAmount) || Number(quantity) * Number(price),
      paymentTerms: paymentMethod || "Razorpay",
      paymentMethod: paymentMethod || "Razorpay",
      status: "Pending",
      orderStatus: "pending",
      shippingAddress: address || "To be confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
      tracking: [
        {
          status: "Order Created",
          timestamp: new Date(),
          note: "Order has been created successfully"
        }
      ]
    }

    const result = await getDB().collection("orders").insertOne(order)

    res.json({ 
      success: true, 
      orderId: result.insertedId, 
      orderNo: order.orderId 
    })
  } catch (err) {
    console.error("Create order error:", err)
    res.status(500).json({ message: "Failed to create order" })
  }
})

// ================= GET BUYER ORDERS =================
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const orders = await getDB()
      .collection("orders")
      .find({ buyerId: req.params.buyerId })
      .sort({ createdAt: -1 })
      .toArray()
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" })
  }
})

// ================= GET SELLER ORDERS =================
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const orders = await getDB()
      .collection("orders")
      .find({ sellerId: req.params.sellerId })
      .sort({ createdAt: -1 })
      .toArray()
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" })
  }
})

// ================= GET SINGLE ORDER BY ORDER ID =================
router.get("/:orderId", async (req, res) => {
  try {
    const order = await getDB()
      .collection("orders")
      .findOne({ orderId: req.params.orderId })
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }
    
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" })
  }
})

// ================= UPDATE ORDER STATUS =================
router.put("/status/:orderId", async (req, res) => {
  try {
    const { status, note } = req.body
    
    const validStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    await getDB().collection("orders").updateOne(
      { orderId: req.params.orderId },
      {
        $set: {
          status: status,
          orderStatus: status.toLowerCase(),
          updatedAt: new Date()
        },
        $push: {
          tracking: {
            status,
            timestamp: new Date(),
            note: note || `Order status updated to ${status}`
          }
        }
      }
    )

    const order = await getDB().collection("orders").findOne({ orderId: req.params.orderId })
    
    const io = req.app.get("io")
    if (io && order) {
      io.to(`buyer_${order.buyerId}`).emit("order-status-updated", {
        orderId: req.params.orderId,
        status,
        note
      })
    }

    res.json({ success: true })
  } catch (err) {
    console.error("❌ Error updating order:", err)
    res.status(500).json({ message: "Failed to update order" })
  }
})

// ================= ACCEPT ORDER (BY BUYER) =================
router.put("/accept/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await getDB().collection("orders").findOne({ orderId })
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    await getDB().collection("orders").updateOne(
      { orderId },
      {
        $set: {
          status: "Confirmed",
          orderStatus: "confirmed",
          acceptedAt: new Date(),
          updatedAt: new Date()
        },
        $push: {
          tracking: {
            status: "Order Accepted by Buyer",
            timestamp: new Date(),
            note: "Buyer has accepted the order"
          }
        }
      }
    )

    const io = req.app.get("io")
    if (io) {
      io.to(`seller_${order.sellerId}`).emit("order-accepted", {
        orderId,
        buyerName: order.buyerName,
        productName: order.productName
      })
    }

    res.json({ success: true, message: "Order accepted successfully" })
  } catch (error) {
    console.error("Accept order error:", error)
    res.status(500).json({ success: false, message: "Failed to accept order" })
  }
})

// ================= CANCEL ORDER =================
router.put("/cancel/:orderId", async (req, res) => {
  try {
    const { reason } = req.body

    await getDB().collection("orders").updateOne(
      { orderId: req.params.orderId },
      {
        $set: {
          status: "Cancelled",
          orderStatus: "cancelled",
          cancellationReason: reason || "No reason provided",
          updatedAt: new Date()
        },
        $push: {
          tracking: {
            status: "Cancelled",
            timestamp: new Date(),
            note: reason || "Order cancelled"
          }
        }
      }
    )

    res.json({ success: true })
  } catch (err) {
    console.error("❌ Error cancelling order:", err)
    res.status(500).json({ message: "Failed to cancel order" })
  }
})

export default router