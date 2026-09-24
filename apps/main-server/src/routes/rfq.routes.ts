// ================= BACKEND - rfq.routes.ts =================
// File: main-server/src/routes/rfq.routes.ts

import express from "express"
import { getDB } from "../db/mongo"

const router = express.Router()

// ================= CREATE RFQ =================
router.post("/create", async (req, res) => {
  try {
    console.log("📦 RFQ Request:", req.body)

    const {
      buyerId, sellerId, items, buyerName, sellerName,
      totalAmount, message, deliveryLocation, deliveryTimeline,
      paymentTerms, quoteValidity, buyerEmail, buyerPhone
    } = req.body

    if (!buyerId || !sellerId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields" })
    }

    const db = getDB()
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" })
    }

    const rfqId = "RFQ" + Date.now() + Math.floor(Math.random() * 1000)

    const rfqData = {
      rfqId,
      buyerId,
      sellerId,
      buyerName: buyerName || "Buyer",
      buyerEmail: buyerEmail || "",
      buyerPhone: buyerPhone || "",
      sellerName: sellerName || "Seller",
      items: items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage || "",
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity
      })),
      totalAmount: totalAmount || 0,
      message: message || "",
      deliveryLocation: deliveryLocation || "",
      deliveryTimeline: deliveryTimeline || "",
      paymentTerms: paymentTerms || "",
      quoteValidity: quoteValidity || "30 days",
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      quote: null
    }

    const result = await db.collection("rfqs").insertOne(rfqData)

    const io = req.app.get("io")
    if (io) {
      console.log(`📤 Emitting new-rfq to seller_${sellerId}`)
      io.to(`seller_${sellerId}`).emit("new-rfq", {
        rfqId,
        buyerName: rfqData.buyerName,
        buyerPhone: rfqData.buyerPhone || "N/A",
        items: rfqData.items.length,
        productName: rfqData.items[0]?.productName || "Product",
        productImage: rfqData.items[0]?.productImage || "",
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
    res.status(500).json({
      success: false,
      message: "Failed to create RFQ: " + error.message
    })
  }
})

// ================= GET BUYER RFQs =================
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const db = getDB()
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" })
    }

    const rfqs = await db.collection("rfqs")
      .find({ buyerId: req.params.buyerId })
      .sort({ createdAt: -1 })
      .toArray()

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
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" })
    }

    const rfqs = await db.collection("rfqs")
      .find({ sellerId: req.params.sellerId })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`📦 Found ${rfqs.length} RFQs for seller ${req.params.sellerId}`)

    res.json({ success: true, data: rfqs })
  } catch (error: any) {
    console.error("❌ Error fetching seller RFQs:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= GET SINGLE RFQ =================
router.get("/:rfqId", async (req, res) => {
  try {
    const db = getDB()
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" })
    }

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

// ================= SELLER SENDS QUOTE — SAVES FULL BREAKDOWN =================
router.post("/quote/:rfqId", async (req, res) => {
  try {
    const { rfqId } = req.params

    console.log("📥 RFQ Quote received — FULL BODY:")
    console.log(JSON.stringify(req.body, null, 2))

    const {
      quoteItems, totalQuote,

      // ✅ NEW — full breakdown from frontend
      originalPricePerUnit, originalTotal,
      bulkPricePerUnit, bulkAmount, bulkGstAmount, gstPercent,
      advancePercent, advanceAmount, remainingAmount, remainingPercent,
      priceToPay, totalQuantity,
      deliveryDate, message
    } = req.body

    const db = getDB()
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" })
    }

    const rfq = await db.collection("rfqs").findOne({ rfqId })
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" })
    }

    const totalQty =
      Number(totalQuantity) ||
      rfq.items.reduce((sum: number, item: any) => sum + item.quantity, 0)

    const perUnitPrice = totalQty > 0 ? Number(totalQuote) / totalQty : 0

    const updatedItems = rfq.items.map((item: any) => {
      const quoteItem = quoteItems?.find((qi: any) => qi.productId === item.productId)
      const price = quoteItem?.quotePrice || perUnitPrice
      return {
        ...item,
        quotePrice: price,
        quoteTotal: price * item.quantity
      }
    })

    // ✅ Save ALL fields
    const quoteData = {
      items: updatedItems,

      // Original
      originalPricePerUnit: Number(originalPricePerUnit) || 0,
      originalTotal: Number(originalTotal) || 0,

      // Bulk
      bulkPricePerUnit: Number(bulkPricePerUnit) || 0,
      bulkAmount: Number(bulkAmount) || 0,
      bulkGstAmount: Number(bulkGstAmount) || 0,
      gstPercent: Number(gstPercent) || 18,

      // Advance / Remaining
      advancePercent: Number(advancePercent) || 40,
      advanceAmount: Number(advanceAmount) || 0,
      remainingAmount: Number(remainingAmount) || 0,
      remainingPercent: Number(remainingPercent) || 60,

      // Final
      priceToPay: Number(priceToPay) || Number(totalQuote) || 0,
      totalQuote: Number(totalQuote) || 0,
      perUnitPrice: perUnitPrice,
      totalQuantity: totalQty,

      // Extras
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

    const updatedRFQ = await db.collection("rfqs").findOne({ rfqId })

    const io = req.app.get("io")
    if (io) {
      io.to(`buyer_${rfq.buyerId}`).emit("rfq-quoted", {
        rfqId,
        sellerName: rfq.sellerName,
        quote: quoteData
      })
    }

    res.json({
      success: true,
      message: "Quote sent successfully",
      data: updatedRFQ
    })

  } catch (error: any) {
    console.error("❌ Send quote error:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= UPDATE QUOTE — FULL BREAKDOWN =================
router.put("/update-quote/:rfqId", async (req, res) => {
  try {
    const { rfqId } = req.params

    console.log("🔵 Update RFQ Quote — FULL BODY:")
    console.log(JSON.stringify(req.body, null, 2))

    const {
      sellerId, totalQuote,

      // ✅ Full breakdown
      originalPricePerUnit, originalTotal,
      bulkPricePerUnit, bulkAmount, bulkGstAmount, gstPercent,
      advancePercent, advanceAmount, remainingAmount, remainingPercent,
      priceToPay, totalQuantity,
      deliveryDate, message
    } = req.body

    const db = getDB()

    const rfq = await db.collection("rfqs").findOne({ rfqId })
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" })
    }

    const totalQty =
      Number(totalQuantity) ||
      rfq.quote?.totalQuantity ||
      rfq.items.reduce((sum: number, item: any) => sum + item.quantity, 0)

    const perUnitPrice = totalQty > 0 ? Number(totalQuote) / totalQty : 0

    // ✅ Update ALL fields
    const updatedQuote = {
      ...rfq.quote,

      // Original
      originalPricePerUnit:
        originalPricePerUnit !== undefined
          ? Number(originalPricePerUnit) || 0
          : rfq.quote?.originalPricePerUnit || 0,
      originalTotal:
        originalTotal !== undefined
          ? Number(originalTotal) || 0
          : rfq.quote?.originalTotal || 0,

      // Bulk
      bulkPricePerUnit:
        bulkPricePerUnit !== undefined
          ? Number(bulkPricePerUnit) || 0
          : rfq.quote?.bulkPricePerUnit || 0,
      bulkAmount:
        bulkAmount !== undefined
          ? Number(bulkAmount) || 0
          : rfq.quote?.bulkAmount || 0,
      bulkGstAmount:
        bulkGstAmount !== undefined
          ? Number(bulkGstAmount) || 0
          : rfq.quote?.bulkGstAmount || 0,
      gstPercent:
        gstPercent !== undefined
          ? Number(gstPercent) || 18
          : rfq.quote?.gstPercent || 18,

      // Advance / Remaining
      advancePercent:
        advancePercent !== undefined
          ? Number(advancePercent) || 40
          : rfq.quote?.advancePercent || 40,
      advanceAmount:
        advanceAmount !== undefined
          ? Number(advanceAmount) || 0
          : rfq.quote?.advanceAmount || 0,
      remainingAmount:
        remainingAmount !== undefined
          ? Number(remainingAmount) || 0
          : rfq.quote?.remainingAmount || 0,
      remainingPercent:
        remainingPercent !== undefined
          ? Number(remainingPercent) || 60
          : rfq.quote?.remainingPercent || 60,

      // Final
      priceToPay:
        priceToPay !== undefined
          ? Number(priceToPay) || 0
          : rfq.quote?.priceToPay || Number(totalQuote) || 0,
      totalQuote: Number(totalQuote) || rfq.quote?.totalQuote || 0,
      perUnitPrice,
      totalQuantity: totalQty,

      // Extras
      deliveryDate:
        deliveryDate !== undefined
          ? deliveryDate || "To be confirmed"
          : rfq.quote?.deliveryDate || "To be confirmed",
      message:
        message !== undefined
          ? message || ""
          : rfq.quote?.message || "",
      updatedAt: new Date()
    }

    await db.collection("rfqs").updateOne(
      { rfqId },
      { $set: { quote: updatedQuote, updatedAt: new Date() } }
    )

    const updatedRFQ = await db.collection("rfqs").findOne({ rfqId })

    const io = req.app.get("io")
    if (io) {
      io.to(`buyer_${rfq.buyerId}`).emit("rfq-quote-updated", {
        rfqId,
        quote: updatedQuote
      })
    }

    res.json({
      success: true,
      message: "Quote updated successfully!",
      data: updatedRFQ
    })
  } catch (error: any) {
    console.error("❌ Error updating RFQ quote:", error)
    res.status(500).json({ success: false, message: error.message || "Server error" })
  }
})

// ================= BUYER REJECTS QUOTE =================
router.put("/reject/:rfqId", async (req, res) => {
  try {
    const db = getDB()
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" })
    }

    await db.collection("rfqs").updateOne(
      { rfqId: req.params.rfqId },
      { $set: { status: "Rejected", updatedAt: new Date() } }
    )

    const updatedRFQ = await db.collection("rfqs").findOne({ rfqId: req.params.rfqId })

    res.json({
      success: true,
      message: "Quote rejected",
      data: updatedRFQ
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= SELLER DECLINES RFQ =================
router.put("/decline/:rfqId", async (req, res) => {
  try {
    const db = getDB()
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" })
    }

    await db.collection("rfqs").updateOne(
      { rfqId: req.params.rfqId },
      { $set: { status: "Declined", updatedAt: new Date() } }
    )

    const updatedRFQ = await db.collection("rfqs").findOne({ rfqId: req.params.rfqId })

    res.json({
      success: true,
      message: "RFQ declined",
      data: updatedRFQ
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ================= BUYER ACCEPTS QUOTE =================
router.put("/accept/:rfqId", async (req, res) => {
  try {
    const db = getDB()
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" })
    }

    const rfq = await db.collection("rfqs").findOne({ rfqId: req.params.rfqId })
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" })
    }

    if (!rfq.quote) {
      return res.status(400).json({
        success: false,
        message: "No quote found to accept"
      })
    }

    await db.collection("rfqs").updateOne(
      { rfqId: req.params.rfqId },
      { $set: { status: "Accepted", updatedAt: new Date() } }
    )

    const orderId = "ORD" + Date.now() + Math.floor(Math.random() * 1000)

    const totalAmount = rfq.quote?.priceToPay || rfq.quote?.totalQuote || rfq.totalAmount
    const quantity = rfq.quote?.totalQuantity || rfq.items[0]?.quantity || 1
    const unitPrice = quantity > 0 ? totalAmount / quantity : 0

    const orderData = {
      orderId,
      buyerId: rfq.buyerId,
      sellerId: rfq.sellerId,
      buyerName: rfq.buyerName || "Buyer",
      sellerName: rfq.sellerName || "Seller",
      productId: rfq.items[0]?.productId || "",
      productName: rfq.items[0]?.productName || "Product",
      productImage: rfq.items[0]?.productImage || "",
      quantity,
      price: unitPrice,
      totalAmount,

      // ✅ Full pricing breakdown in order
      originalTotal: rfq.quote?.originalTotal || 0,
      bulkAmount: rfq.quote?.bulkAmount || 0,
      bulkGstAmount: rfq.quote?.bulkGstAmount || 0,
      advancePercent: rfq.quote?.advancePercent || 40,
      advanceAmount: rfq.quote?.advanceAmount || 0,
      remainingAmount: rfq.quote?.remainingAmount || 0,
      remainingPercent: rfq.quote?.remainingPercent || 60,

      status: "Pending",
      paymentStatus: "Pending",
      paymentTerms: rfq.paymentTerms || "To be confirmed",
      shippingAddress: rfq.deliveryLocation || "To be confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
      tracking: [
        {
          status: "Order Created from RFQ",
          timestamp: new Date(),
          note: `Order created after RFQ acceptance. Advance: ${rfq.quote?.advancePercent || 40}%, Remaining: ${rfq.quote?.remainingPercent || 60}%`
        }
      ]
    }

    console.log("📦 Creating Order from RFQ with full breakdown:", orderData)

    const orderResult = await db.collection("orders").insertOne(orderData)

    const updatedRFQ = await db.collection("rfqs").findOne({ rfqId: req.params.rfqId })

    const io = req.app.get("io")
    if (io) {
      io.to(`seller_${rfq.sellerId}`).emit("new-order", {
        orderId,
        productName: rfq.items[0]?.productName,
        buyerName: rfq.buyerName,
        totalAmount
      })

      io.to(`buyer_${rfq.buyerId}`).emit("order-created", {
        orderId,
        productName: rfq.items[0]?.productName,
        totalAmount
      })
    }

    res.json({
      success: true,
      message: "Quote accepted! Order created.",
      orderId: orderResult.insertedId,
      orderNo: orderId,
      data: updatedRFQ,
      order: orderData
    })

  } catch (error: any) {
    console.error("❌ Accept quote error:", error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router