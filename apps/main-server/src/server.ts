// ================= main-server/src/server.ts =================

import dotenv from 'dotenv'
dotenv.config()

import express from "express"
import cors from "cors"
import path from "path"
import http from "http"
import { Server } from "socket.io"
import { ObjectId } from "mongodb"

import authRoutes from "./routes/auth.routes"
import uploadRoutes from "./routes/upload"
import orderRoutes from "./routes/order.routes"
import invoiceRoutes from "./routes/invoice.routes"
import paymentRoutes from "./routes/payment.routes"
import cartRoutes from "./routes/cart.routes"
import wishlistRoutes from "./routes/wishlist.routes"
import enquiryRoutes from "./routes/enquiry.routes"
import sellerRoutes from "./routes/seller.routes"
import rfqRoutes from "./routes/rfq.routes"

import buyerRequirementRoutes from "./routes/buyer-requirement.routes"
import adminRoutes from "./routes/admin.routes"

import { connectDB, getDB } from "./db/mongo"
import { products } from "./db/product.collection"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join_seller", (sellerId) => {
    console.log("SELLER JOINED:", sellerId)
    socket.join(`seller_${sellerId}`)
  })

  socket.on("join_buyer", (buyerId) => {
    console.log("BUYER JOINED:", buyerId)
    socket.join(`buyer_${buyerId}`)
  })

  socket.on("join_room", (roomId) => {
    if (!roomId) return
    socket.join(roomId)
    console.log("Room joined:", roomId)
  })

  socket.on("send_message", async (data) => {
    console.log("📨 ========================================")
    console.log("📨 MESSAGE RECEIVED:", data)
    console.log("📨 ========================================")

    try {
      if (!data?.roomId || !data?.message) {
        console.log("❌ Missing roomId or message")
        return
      }

      const msg = {
        roomId: data.roomId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderRole: data.senderRole || "",
        senderName: data.senderName || "User",
        message: data.message,
        productId: data.productId || "",
        productName: data.productName || "",
        productImage: data.productImage || "",
        createdAt: new Date(),
        read: false
      }

      const db = getDB()
      const existingChat = await db.collection("chats").findOne({ roomId: data.roomId })

      if (!existingChat) {
        await db.collection("chats").insertOne({
          roomId: data.roomId,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessage: msg.message,
          lastMessageAt: new Date(),
          buyerId: data.senderRole === "buyer" ? data.senderId : data.receiverId,
          buyerName: data.senderRole === "buyer" ? data.senderName : data.receiverName,
          sellerId: data.senderRole === "buyer" ? data.receiverId : data.senderId,
          productId: data.productId || "",
          productName: data.productName || "",
          productImage: data.productImage || "",
          messages: [msg]
        })
        console.log("✅ New chat created")
      } else {
        await db.collection("chats").updateOne(
          { roomId: data.roomId },
          {
            $push: { messages: msg },
            $set: {
              updatedAt: new Date(),
              lastMessage: msg.message,
              lastMessageAt: new Date()
            }
          }
        )
        console.log("✅ Message added to existing chat")
      }

      io.to(data.roomId).emit("receive_message", msg)
      console.log("✅ Message emitted to room:", data.roomId)

      // ✅ ALSO emit to personal rooms so notification bell works even if user not on chat page
      if (data.receiverId) {
        io.to(`buyer_${data.receiverId}`).emit("receive_message", msg)
        io.to(`seller_${data.receiverId}`).emit("receive_message", msg)
        console.log(`✅ Also emitted to buyer_${data.receiverId} and seller_${data.receiverId}`)
      }

      if (data.senderRole === "buyer") {
        io.to(`seller_${data.receiverId}`).emit("new-chat-notification", {
          from: data.senderId,
          fromName: data.senderName,
          message: data.message,
          roomId: data.roomId,
          productId: data.productId || "",
          productName: data.productName || "Product"
        })
        console.log(`🔔 Notification sent to seller ${data.receiverId}`)
      }

      if (data.senderRole === "seller") {
        let rfqId = ""
        try {
          let rfq: any = null

          if (data.productId) {
            rfq = await db.collection("rfqs").findOne({
              sellerId: data.senderId,
              buyerId: data.receiverId,
              "items.productId": data.productId
            })
          }

          if (!rfq) {
            rfq = await db.collection("rfqs").findOne({
              sellerId: data.senderId,
              buyerId: data.receiverId
            })
          }

          if (rfq) rfqId = rfq.rfqId
        } catch (e) {
          console.log("RFQ lookup error:", e)
        }

        io.to(`buyer_${data.receiverId}`).emit("new-chat-notification", {
          from: data.senderId,
          fromName: data.senderName,
          message: data.message,
          roomId: data.roomId,
          productId: data.productId || "",
          productName: data.productName || "Product",
          rfqId: rfqId
        })
        console.log(`🔔 Notification sent to buyer ${data.receiverId} for RFQ ${rfqId || "(no match)"}`)
      }

    } catch (err) {
      console.log("❌ Socket message error:", err)
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json())
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

app.use("/api/upload", uploadRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/enquiries", enquiryRoutes(io))
app.use("/api/orders", orderRoutes)
app.use("/api/invoice", invoiceRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/wishlist", wishlistRoutes)
app.use("/api/payment", paymentRoutes)
app.use("/api/seller", sellerRoutes)
app.use("/api/rfq", rfqRoutes)
app.use("/api/buyer-requirement", buyerRequirementRoutes)
app.use("/api/admin", adminRoutes)

app.get("/", (req, res) => {
  res.send("Main Server Running 🚀")
})

// =====================================================
// ✅ CATEGORIES + SUB-CATEGORIES
// Uses existing "categories" collection (created by admin panel)
// =====================================================

// GET all categories WITH their sub-categories (public - seller/buyer apps read this)
app.get("/api/categories/all", async (req, res) => {
  try {
    const data = await getDB()
      .collection("categories")
      .find({})
      .sort({ createdAt: 1 })
      .toArray()
    res.json({ success: true, data })
  } catch (err) {
    console.error("Get all categories error:", err)
    res.status(500).json({ success: false, message: "Failed to fetch categories" })
  }
})

// GET sub-categories of one category
app.get("/api/categories/:id/subcategories", async (req, res) => {
  try {
    const cat = await getDB()
      .collection("categories")
      .findOne({ _id: new ObjectId(req.params.id) })

    if (!cat) {
      return res.status(404).json({ success: false, message: "Category not found" })
    }
    res.json({ success: true, data: cat.subCategories || [] })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch" })
  }
})

// ADD sub-category to a category
app.post("/api/categories/:id/subcategories", async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name required" })
    }

    const cat = await getDB()
      .collection("categories")
      .findOne({ _id: new ObjectId(req.params.id) })

    if (!cat) {
      return res.status(404).json({ success: false, message: "Category not found" })
    }

    if ((cat.subCategories || []).includes(name.trim())) {
      return res.status(400).json({ success: false, message: "Sub-category already exists" })
    }

    await getDB().collection("categories").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $push: { subCategories: name.trim() } as any,
        $set: { updatedAt: new Date() }
      }
    )

    res.json({ success: true, message: "Sub-category added" })
  } catch (err) {
    console.error("Add sub-category error:", err)
    res.status(500).json({ success: false, message: "Failed to add" })
  }
})

// REMOVE sub-category from a category
app.delete("/api/categories/:id/subcategories/:subName", async (req, res) => {
  try {
    const subName = decodeURIComponent(req.params.subName)

    await getDB().collection("categories").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $pull: { subCategories: subName } as any,
        $set: { updatedAt: new Date() }
      }
    )

    res.json({ success: true, message: "Sub-category removed" })
  } catch (err) {
    console.error("Remove sub-category error:", err)
    res.status(500).json({ success: false, message: "Failed to remove" })
  }
})

// ================= CREATE PRODUCT =================
app.post("/api/products", async (req, res) => {
  try {
    const product = req.body
    if (!product?.sellerId) {
      return res.status(400).json({ message: "sellerId required" })
    }
    const result = await products().insertOne({
      ...product,
      createdAt: new Date()
    })
    res.json({ success: true, productId: result.insertedId })
  } catch (err) {
    res.status(500).json({ message: "Failed to create product" })
  }
})

app.get("/api/products/category/:category", async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category)
    const data = await products().find({ category }).sort({ createdAt: -1 }).limit(8).toArray()
    res.json(data)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to load category products" })
  }
})

// ================= UPDATE PRODUCT =================
app.put("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id
    await products().updateOne({ _id: new ObjectId(id) }, { $set: req.body })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: "Update failed" })
  }
})

// ================= DELETE PRODUCT =================
app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id
    const result = await products().deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" })
    }
    res.json({ success: true, message: "Product deleted" })
  } catch (err) {
    res.status(500).json({ message: "Delete failed" })
  }
})

// ================= CHAT HISTORY =================
app.get("/api/chat/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId
    const chat = await getDB().collection("chats").findOne({ roomId })

    if (!chat || !chat.messages) {
      return res.json({ roomId, messages: [] })
    }

    const messages = chat.messages.map((m: any) => {
      let role = m.senderRole || ""
      if (!role) {
        if (m.senderId === chat.buyerId) role = "buyer"
        else if (m.senderId === chat.sellerId) role = "seller"
      }

      return {
        senderId: m.senderId || "",
        receiverId: m.receiverId || "",
        senderRole: role,
        message: m.message || "",
        productId: m.productId || "",
        productName: m.productName || "",
        productImage: m.productImage || "",
        createdAt: m.createdAt || new Date(),
        read: m.read || false
      }
    })

    return res.json({ roomId, messages })
  } catch (err) {
    return res.status(500).json({ message: "Failed to load chat" })
  }
})

// ================= INBOX API =================
app.get("/api/chat/inbox/:sellerId", async (req, res) => {
  try {
    const sellerId = req.params.sellerId
    const chats = await getDB().collection("chats").find({ sellerId }).sort({ updatedAt: -1 }).toArray()

    const formatted = chats.map((chat: any) => ({
      roomId: chat.roomId,
      buyerId: chat.buyerId,
      buyerName: chat.buyerName || "Buyer",
      productId: chat.productId || "",
      productName: chat.productName || "",
      productImage: chat.productImage || "",
      lastMessage: chat.lastMessage || "",
      updatedAt: chat.updatedAt || new Date()
    }))

    res.json(formatted)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to load chats" })
  }
})

// ================= SELLER PROFILE =================
app.get("/api/seller/profile/:id", async (req, res) => {
  try {
    const user = await getDB().collection("users").findOne({ _id: new ObjectId(req.params.id) })
    if (!user) {
      return res.status(404).json({ message: "Seller not found" })
    }
    res.json({
      _id: user._id,
      companyName: user.companyName || "",
      email: user.email || "",
      phone: user.phone || "",
      gstNumber: user.gstNumber || "",
      yearsInBusiness: user.yearsInBusiness || "",
      kycStatus: user.kycStatus || "Pending",
      panNumber: user.panNumber || "",
      businessRegNumber: user.businessRegNumber || "",
      address: user.address || "",
      storeDescription: user.storeDescription || "",
      isDistributor: user.isDistributor || false
    })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch seller profile" })
  }
})

app.put("/api/seller/update-profile", async (req, res) => {
  try {
    const user = req.body
    if (!user?._id) {
      return res.status(400).json({ message: "User ID missing" })
    }
    const id = new ObjectId(user._id)
    delete user._id

    await getDB().collection("users").updateOne({ _id: id }, { $set: { ...user, updatedAt: new Date() } })

    const updated = await getDB().collection("users").findOne({ _id: id })

    return res.json({
      success: true,
      user: {
        _id: updated?._id,
        companyName: updated?.companyName || "",
        email: updated?.email || "",
        phone: updated?.phone || "",
        gstNumber: updated?.gstNumber || "",
        yearsInBusiness: updated?.yearsInBusiness || "",
        kycStatus: updated?.kycStatus || "Pending",
        panNumber: updated?.panNumber || "",
        businessRegNumber: updated?.businessRegNumber || "",
        address: updated?.address || "",
        storeDescription: updated?.storeDescription || "",
        isDistributor: updated?.isDistributor || false
      }
    })
  } catch (err) {
    console.log("PROFILE UPDATE ERROR:", err)
    res.status(500).json({ message: "Failed to update profile" })
  }
})

// ================= PRODUCT ROUTES =================
app.get("/api/products", async (req, res) => {
  const data = await products().find({}).toArray()
  res.json(data)
})

app.get("/api/products/:id", async (req, res) => {
  const data = await products().findOne({ _id: new ObjectId(req.params.id) })
  res.json(data)
})

app.get("/api/products/seller/:sellerId", async (req, res) => {
  try {
    const sellerId = req.params.sellerId
    console.log("🔍 Fetching products for sellerId:", sellerId)

    // ✅ Match BOTH string and ObjectId (jaisa bhi save ho)
    const data = await products().find({
      $or: [
        { sellerId: sellerId },
        { sellerId: new ObjectId(sellerId) as any }
      ]
    }).toArray()

    console.log(`✅ Found ${data.length} products`)
    res.json(data)
  } catch (err) {
    console.error("❌ Fetch seller products error:", err)
    // fallback - sirf string match
    try {
      const data = await products().find({ sellerId: req.params.sellerId }).toArray()
      res.json(data)
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch products" })
    }
  }
})

app.set("io", io)

// ================= BUYER INBOX API =================
app.get("/api/chat/inbox/buyer/:buyerId", async (req, res) => {
  try {
    const buyerId = req.params.buyerId
    const chats = await getDB().collection("chats").find({ buyerId }).sort({ updatedAt: -1 }).toArray()

    const formatted = chats.map((chat: any) => ({
      roomId: chat.roomId,
      sellerId: chat.sellerId,
      sellerName: chat.sellerName || "Seller",
      productId: chat.productId || "",
      productName: chat.productName || "",
      productImage: chat.productImage || "",
      lastMessage: chat.lastMessage || "",
      updatedAt: chat.updatedAt || new Date()
    }))

    res.json(formatted)
  } catch (err) {
    console.log("❌ Error fetching buyer chats:", err)
    res.status(500).json({ message: "Failed to load chats" })
  }
})

server.listen(5000, async () => {
  await connectDB()
  console.log("Server running on port 5000")
})