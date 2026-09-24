import express from "express"
import { getDB } from "../db/mongo"
import { ObjectId } from "mongodb"
import { 
  createRFQ, getRFQById, getRFQsByBuyer, getRFQsBySeller, 
  updateRFQStatus, addQuoteToRFQ, getPendingRFQsBySeller, getRFQStats
} from "../db/rfq.collection"

const router = express.Router()

// ================= CREATE RFQ (Fixed - Debug Version) =================
router.post("/create", async (req, res) => {
  try {
    console.log("📦 RFQ Request Body:", JSON.stringify(req.body, null, 2))
    
    const { 
      buyerId, 
      sellerId, 
      items, 
      buyerName, 
      sellerName, 
      totalAmount, 
      message,
      deliveryLocation,
      deliveryTimeline,
      paymentTerms,
      quoteValidity
    } = req.body

    // ✅ Check required fields
    if (!buyerId) {
      console.log("❌ Missing buyerId")
      return res.status(400).json({ success: false, message: "Missing buyerId" })
    }
    
    if (!sellerId) {
      console.log("❌ Missing sellerId")
      return res.status(400).json({ success: false, message: "Missing sellerId" })
    }
    
    if (!items || items.length === 0) {
      console.log("❌ Missing items")
      return res.status(400).json({ success: false, message: "Missing items" })
    }

    const rfqId = "RFQ" + Date.now() + Math.floor(Math.random() * 1000)

    const rfqData = {
      rfqId,
      buyerId,
      sellerId,
      buyerName: buyerName || "Buyer",
      sellerName: sellerName || "Seller",
      items: items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage || "",
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
        quotePrice: null,
        quoteTotal: null
      })),
      totalAmount: totalAmount || 0,
      message: message || "",
      deliveryLocation: deliveryLocation || "",
      deliveryTimeline: deliveryTimeline || "",
      paymentTerms: paymentTerms || "",
      quoteValidity: quoteValidity || "30 days",
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log("📦 RFQ Data to save:", JSON.stringify(rfqData, null, 2))

    const db = getDB()
    const result = await db.collection("rfqs").insertOne(rfqData)

    console.log("✅ RFQ created with ID:", result.insertedId)

    // Socket notification to seller
    const io = req.app.get("io")
    if (io) {
      io.to(`seller_${sellerId}`).emit("new-rfq", {
        rfqId,
        buyerName: rfqData.buyerName,
        items: rfqData.items.length,
        totalAmount: rfqData.totalAmount
      })
    }

    res.json({
      success: true,
      message: "RFQ created successfully",
      rfqId: result.insertedId,
      rfqNo: rfqId
    })

  } catch (error: any) {
    console.error("❌ Create RFQ error:", error)
    console.error("❌ Error stack:", error.stack)
    res.status(500).json({ 
      success: false, 
      message: "Failed to create RFQ: " + error.message,
      stack: error.stack
    })
  }
})

// ================= GET BUYER RFQs =================
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const db = getDB()
    const rfqs = await db.collection("rfqs")
      .find({ buyerId: req.params.buyerId })
      .sort({ createdAt: -1 })
      .toArray()
    
    console.log("📦 Buyer RFQs found:", rfqs.length)
    res.json({ success: true, data: rfqs })
  } catch (error: any) {
    console.error("❌ Error fetching buyer RFQs:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= GET SELLER RFQs =================
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const db = getDB()
    const rfqs = await db.collection("rfqs")
      .find({ sellerId: req.params.sellerId })
      .sort({ createdAt: -1 })
      .toArray()
    
    console.log("📦 Seller RFQs found:", rfqs.length)
    res.json({ success: true, data: rfqs })
  } catch (error: any) {
    console.error("❌ Error fetching seller RFQs:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= GET PENDING RFQs (Seller Dashboard) =================
router.get("/seller/:sellerId/pending", async (req, res) => {
  try {
    const db = getDB()
    const rfqs = await db.collection("rfqs")
      .find({ 
        sellerId: req.params.sellerId, 
        status: { $in: ["Pending", "Quoted"] } 
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    res.json({ success: true, data: rfqs })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= GET RFQ STATS (Seller Dashboard) =================
router.get("/seller/:sellerId/stats", async (req, res) => {
  try {
    const db = getDB()
    const total = await db.collection("rfqs").countDocuments({ sellerId: req.params.sellerId })
    const pending = await db.collection("rfqs").countDocuments({ sellerId: req.params.sellerId, status: "Pending" })
    const quoted = await db.collection("rfqs").countDocuments({ sellerId: req.params.sellerId, status: "Quoted" })
    const accepted = await db.collection("rfqs").countDocuments({ sellerId: req.params.sellerId, status: "Accepted" })
    
    res.json({ success: true, data: { total, pending, quoted, accepted } })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= GET SINGLE RFQ =================
router.get("/:rfqId", async (req, res) => {
  try {
    const db = getDB()
    const rfq = await db.collection("rfqs").findOne({ rfqId: req.params.rfqId })
    
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" })
    }
    
    res.json({ success: true, data: rfq })
  } catch (error: any) {
    console.error("❌ Error fetching RFQ:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= SELLER SENDS QUOTE =================
router.post("/quote/:rfqId", async (req, res) => {
  try {
    const { rfqId } = req.params
    const { quoteItems, totalQuote, deliveryDate, message } = req.body

    const db = getDB()
    const rfq = await db.collection("rfqs").findOne({ rfqId })

    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" })
    }

    // Update items with quote prices
    const updatedItems = rfq.items.map((item: any) => {
      const quoteItem = quoteItems.find((qi: any) => qi.productId === item.productId)
      if (quoteItem) {
        return {
          ...item,
          quotePrice: quoteItem.quotePrice,
          quoteTotal: quoteItem.quotePrice * item.quantity
        }
      }
      return item
    })

    const quoteData = {
      items: updatedItems,
      totalQuote,
      deliveryDate: deliveryDate || "To be confirmed",
      message: message || "",
      sentAt: new Date()
    }

    await db.collection("rfqs").updateOne(
      { rfqId },
      { 
        $set: { 
          quote: quoteData,
          status: "Quoted",
          updatedAt: new Date() 
        } 
      }
    )

    const io = req.app.get("io")
    if (io) {
      io.to(`buyer_${rfq.buyerId}`).emit("rfq-quoted", {
        rfqId,
        sellerName: rfq.sellerName,
        totalQuote
      })
    }

    res.json({ 
      success: true, 
      message: "Quote sent successfully" 
    })

  } catch (error: any) {
    console.error("❌ Send quote error:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= BUYER ACCEPTS QUOTE =================
router.put("/accept/:rfqId", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("rfqs").updateOne(
      { rfqId: req.params.rfqId },
      { 
        $set: { 
          status: "Accepted",
          updatedAt: new Date() 
        } 
      }
    )

    const rfq = await db.collection("rfqs").findOne({ rfqId: req.params.rfqId })
    
    const io = req.app.get("io")
    if (io && rfq) {
      io.to(`seller_${rfq.sellerId}`).emit("rfq-accepted", {
        rfqId: req.params.rfqId,
        buyerName: rfq.buyerName
      })
    }

    res.json({ 
      success: true, 
      message: "Quote accepted successfully" 
    })

  } catch (error: any) {
    console.error("❌ Accept quote error:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= BUYER REJECTS QUOTE =================
router.put("/reject/:rfqId", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("rfqs").updateOne(
      { rfqId: req.params.rfqId },
      { 
        $set: { 
          status: "Rejected",
          updatedAt: new Date() 
        } 
      }
    )
    res.json({ success: true, message: "Quote rejected" })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= SELLER DECLINES RFQ =================
router.put("/decline/:rfqId", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("rfqs").updateOne(
      { rfqId: req.params.rfqId },
      { 
        $set: { 
          status: "Declined",
          updatedAt: new Date() 
        } 
      }
    )
    res.json({ success: true, message: "RFQ declined" })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router