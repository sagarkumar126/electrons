import express from "express"
import { getDB } from "../db/mongo"
import { ObjectId } from "mongodb"

const router = express.Router()

export default (io: any) => {

  // ================= CREATE ENQUIRY =================
  // ================= CREATE ENQUIRY =================
router.post("/", async (req, res) => {
  try {
    const {
      buyerId,
      sellerId,
      productId,
      productName,
      productImage,  // ✅ NAYA
      message,
      buyerName,
      quantity,
      unit,
      deliveryLocation,
      deliveryTimeline,
      email,
      phone
    } = req.body

    console.log("📦 Enquiry data with image:", req.body) // ✅ Debug

    const enquiry = {
      buyerId,
      sellerId,
      productId,
      productName,
      productImage: productImage || "",  // ✅ NAYA
      message,
      buyerName,
      quantity: quantity || 0,
      unit: unit || "Pieces",
      deliveryLocation: deliveryLocation || "",
      deliveryTimeline: deliveryTimeline || "",
      email: email || "",
      phone: phone || "",
      status: "Pending",
      quote: {
        price: null,
        deliveryDate: null,
        message: null,
        status: "pending",
        sentAt: null
      },
      createdAt: new Date()
    }

    const result = await getDB()
      .collection("enquiries")
      .insertOne(enquiry)

    io.to(`seller_${sellerId}`).emit("receive_enquiry", {
      ...enquiry,
      _id: result.insertedId
    })

    res.json({
      success: true,
      enquiryId: result.insertedId
    })

  } catch (err) {
    console.error("❌ Create enquiry error:", err)
    res.status(500).json({ message: "Failed to create enquiry" })
  }
})

  // ================= GET SELLER ENQUIRIES =================
  router.get("/seller/:sellerId", async (req, res) => {
    try {
      const data = await getDB()
        .collection("enquiries")
        .find({ sellerId: req.params.sellerId })
        .sort({ createdAt: -1 })
        .toArray()

      res.json(data)
    } catch (err) {
      console.error("❌ Error fetching seller enquiries:", err)
      res.status(500).json({ message: "Failed to fetch enquiries" })
    }
  })

  // ================= GET BUYER ENQUIRIES =================
  router.get("/buyer/:buyerId", async (req, res) => {
    try {
      const data = await getDB()
        .collection("enquiries")
        .find({ buyerId: req.params.buyerId })
        .sort({ createdAt: -1 })
        .toArray()

      res.json(data)
    } catch (err) {
      console.error("❌ Error fetching buyer enquiries:", err)
      res.status(500).json({ message: "Failed to fetch enquiries" })
    }
  })

  // ================= GET SINGLE ENQUIRY BY ID =================
  router.get("/:id", async (req, res) => {
    try {
      const enquiry = await getDB().collection("enquiries").findOne({
        _id: new ObjectId(req.params.id)
      })
      
      if (!enquiry) {
        return res.status(404).json({ message: "Enquiry not found" })
      }
      
      res.json(enquiry)
    } catch (err) {
      console.error("❌ Error fetching enquiry:", err)
      res.status(500).json({ message: "Failed to fetch enquiry" })
    }
  })

  // ================= SEND QUOTE FROM SELLER =================
  router.post("/send-quote/:id", async (req, res) => {
    try {
      const { price, deliveryDate, message } = req.body
      const enquiryId = req.params.id

      if (!price) {
        return res.status(400).json({ message: "Price is required" })
      }

      await getDB().collection("enquiries").updateOne(
        { _id: new ObjectId(enquiryId) },
        { 
          $set: { 
            quote: {
              price: Number(price),
              deliveryDate: deliveryDate || "",
              message: message || "",
              status: "pending",
              sentAt: new Date()
            },
            status: "Quoted"
          } 
        }
      )
      
      const enquiry = await getDB().collection("enquiries").findOne({ 
        _id: new ObjectId(enquiryId) 
      })
      
      if (enquiry && enquiry.buyerId) {
        io.to(`buyer_${enquiry.buyerId}`).emit("new-quote", {
          enquiryId: enquiryId,
          productName: enquiry.productName,
          quote: { 
            price: Number(price), 
            deliveryDate: deliveryDate || "", 
            message: message || "" 
          }
        })
      }
      
      res.json({ success: true, message: "Quote sent successfully" })
      
    } catch (err) {
      console.error("❌ Error sending quote:", err)
      res.status(500).json({ message: "Failed to send quote" })
    }
  })

  // ================= BUYER ACCEPTS QUOTE =================
  router.put("/accept-quote/:id", async (req, res) => {
    try {
      await getDB().collection("enquiries").updateOne(
        { _id: new ObjectId(req.params.id) },
        { 
          $set: { 
            "quote.status": "accepted",
            status: "Quote Accepted"
          } 
        }
      )
      
      const enquiry = await getDB().collection("enquiries").findOne({ 
        _id: new ObjectId(req.params.id) 
      })
      
      if (enquiry && enquiry.sellerId) {
        io.to(`seller_${enquiry.sellerId}`).emit("quote-accepted", {
          enquiryId: req.params.id,
          productName: enquiry.productName
        })
      }
      
      res.json({ success: true })
    } catch (err) {
      console.error("❌ Error accepting quote:", err)
      res.status(500).json({ message: "Failed to accept quote" })
    }
  })

  // ================= BUYER REJECTS QUOTE =================
  router.put("/reject-quote/:id", async (req, res) => {
    try {
      await getDB().collection("enquiries").updateOne(
        { _id: new ObjectId(req.params.id) },
        { 
          $set: { 
            "quote.status": "rejected",
            status: "Quote Rejected"
          } 
        }
      )
      
      res.json({ success: true })
    } catch (err) {
      console.error("❌ Error rejecting quote:", err)
      res.status(500).json({ message: "Failed to reject quote" })
    }
  })

  // ================= BUYER SENDS COUNTER OFFER =================
  router.post("/counter-quote/:id", async (req, res) => {
    try {
      const { price, message } = req.body
      
      await getDB().collection("enquiries").updateOne(
        { _id: new ObjectId(req.params.id) },
        { 
          $set: { 
            "quote.price": Number(price),
            "quote.message": message,
            "quote.status": "negotiated",
            status: "Negotiation"
          } 
        }
      )
      
      const enquiry = await getDB().collection("enquiries").findOne({ 
        _id: new ObjectId(req.params.id) 
      })
      
      if (enquiry && enquiry.sellerId) {
        io.to(`seller_${enquiry.sellerId}`).emit("counter-offer", {
          enquiryId: req.params.id,
          price: Number(price),
          message: message
        })
      }
      
      res.json({ success: true })
    } catch (err) {
      console.error("❌ Error sending counter offer:", err)
      res.status(500).json({ message: "Failed to send counter offer" })
    }
  })

  // ================= ACCEPT ENQUIRY (OLD) =================
  router.put("/accept/:id", async (req, res) => {
    try {
      await getDB().collection("enquiries").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "Accepted" } }
      )
      res.json({ success: true })
    } catch (err) {
      console.error("❌ Error accepting enquiry:", err)
      res.status(500).json({ message: "Failed" })
    }
  })

  // ================= REJECT ENQUIRY (OLD) =================
  router.put("/reject/:id", async (req, res) => {
    try {
      await getDB().collection("enquiries").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "Rejected" } }
      )
      res.json({ success: true })
    } catch (err) {
      console.error("❌ Error rejecting enquiry:", err)
      res.status(500).json({ message: "Failed" })
    }
  })

  return router
}