import express from "express"
import { getDB } from "../db/mongo"
import { ObjectId } from "mongodb"

const router = express.Router()

// =====================================================
// ✅ DASHBOARD STATS
// =====================================================
router.get("/dashboard/stats", async (req, res) => {
  try {
    const db = getDB()
    
    const totalUsers = await db.collection("users").countDocuments()
    const totalSellers = await db.collection("users").countDocuments({ role: "seller" })
    const totalBuyers = await db.collection("users").countDocuments({ role: "buyer" })
    const totalProducts = await db.collection("products").countDocuments()
    const totalOrders = await db.collection("orders").countDocuments()
    
    const pendingSellers = await db.collection("users").countDocuments({ 
      role: "seller", 
      kycStatus: "Pending" 
    })
    const pendingProducts = await db.collection("products").countDocuments({ 
      isApproved: { $ne: true } 
    })
    const pendingOrders = await db.collection("orders").countDocuments({ 
      status: "Pending" 
    })
    
    const revenueResult = await db.collection("orders").aggregate([
      { $match: { status: { $in: ["Confirmed", "Processing", "Shipped", "Delivered"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]).toArray()
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalBuyers,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingSellers,
        pendingProducts,
        pendingOrders
      }
    })
  } catch (err) {
    console.error("Dashboard stats error:", err)
    res.status(500).json({ success: false, message: "Failed to fetch stats" })
  }
})

// =====================================================
// ✅ GET ALL USERS
// =====================================================
router.get("/users", async (req, res) => {
  try {
    const db = getDB()
    const users = await db.collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    res.json(users)
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch users" })
  }
})

// =====================================================
// ✅ APPROVE SELLER
// =====================================================
router.put("/users/approve-seller/:id", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { kycStatus: "Verified", updatedAt: new Date() } }
    )
    res.json({ success: true, message: "Seller approved" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to approve seller" })
  }
})

// =====================================================
// ✅ BLOCK USER
// =====================================================
router.put("/users/block/:id", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isBlocked: true, updatedAt: new Date() } }
    )
    res.json({ success: true, message: "User blocked" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to block user" })
  }
})

// =====================================================
// ✅ UNBLOCK USER
// =====================================================
router.put("/users/unblock/:id", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isBlocked: false, updatedAt: new Date() } }
    )
    res.json({ success: true, message: "User unblocked" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to unblock user" })
  }
})

// =====================================================
// ✅ DELETE USER
// =====================================================
router.delete("/users/:id", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ success: true, message: "User deleted" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete user" })
  }
})

// =====================================================
// ✅ GET ALL PRODUCTS
// =====================================================
router.get("/products", async (req, res) => {
  try {
    const db = getDB()
    const products = await db.collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    res.json(products)
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch products" })
  }
})

// =====================================================
// ✅ APPROVE PRODUCT
// =====================================================
router.put("/products/approve/:id", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("products").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isApproved: true, updatedAt: new Date() } }
    )
    res.json({ success: true, message: "Product approved" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to approve product" })
  }
})

// =====================================================
// ✅ REJECT PRODUCT
// =====================================================
router.put("/products/reject/:id", async (req, res) => {
  try {
    const db = getDB()
    const { reason } = req.body
    await db.collection("products").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isApproved: false, rejectionReason: reason, updatedAt: new Date() } }
    )
    res.json({ success: true, message: "Product rejected" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reject product" })
  }
})

// =====================================================
// ✅ DELETE PRODUCT
// =====================================================
router.delete("/products/:id", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("products").deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ success: true, message: "Product deleted" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete product" })
  }
})

// =====================================================
// ✅ GET ALL ORDERS
// =====================================================
router.get("/orders", async (req, res) => {
  try {
    const db = getDB()
    const orders = await db.collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    res.json(orders)
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" })
  }
})

// =====================================================
// ✅ UPDATE ORDER STATUS
// =====================================================
router.put("/orders/status/:orderId", async (req, res) => {
  try {
    const db = getDB()
    const { status } = req.body
    await db.collection("orders").updateOne(
      { orderId: req.params.orderId },
      { $set: { status, updatedAt: new Date() } }
    )
    res.json({ success: true, message: "Order status updated" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update order" })
  }
})

// =====================================================
// ✅ GET CATEGORIES
// =====================================================
router.get("/categories", async (req, res) => {
  try {
    const db = getDB()
    const categories = await db.collection("categories")
      .find({})
      .sort({ name: 1 })
      .toArray()
    
    for (let cat of categories) {
      const count = await db.collection("products").countDocuments({ category: cat.name })
      cat.productCount = count
    }
    
    res.json(categories)
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch categories" })
  }
})

// =====================================================
// ✅ ADD CATEGORY
// =====================================================
router.post("/categories", async (req, res) => {
  try {
    const db = getDB()
    const { name } = req.body
    await db.collection("categories").insertOne({
      name,
      subCategories: [],
      createdAt: new Date()
    })
    res.json({ success: true, message: "Category added" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add category" })
  }
})

// =====================================================
// ✅ UPDATE CATEGORY
// =====================================================
router.put("/categories/:id", async (req, res) => {
  try {
    const db = getDB()
    const { name } = req.body
    await db.collection("categories").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name, updatedAt: new Date() } }
    )
    res.json({ success: true, message: "Category updated" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update category" })
  }
})

// =====================================================
// ✅ DELETE CATEGORY
// =====================================================
router.delete("/categories/:id", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("categories").deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ success: true, message: "Category deleted" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete category" })
  }
})

// =====================================================
// ✅ BULK ADD SUB-CATEGORIES
// Body: { subCategories: ["A", "B", "C"] }  OR  { name: "A" }
// =====================================================
router.post("/categories/:id/subcategories", async (req, res) => {
  try {
    const db = getDB()
    const { name, subCategories } = req.body

    // ✅ Accept BOTH: single "name" OR bulk "subCategories" array
    let list: string[] = []
    if (Array.isArray(subCategories)) {
      list = subCategories.map((s: string) => String(s).trim()).filter(Boolean)
    } else if (name && typeof name === "string") {
      list = [name.trim()].filter(Boolean)
    }

    if (list.length === 0) {
      return res.status(400).json({ success: false, message: "No valid sub-categories provided" })
    }

    await db.collection("categories").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $addToSet: { subCategories: { $each: list } },
        $set: { updatedAt: new Date() }
      }
    )

    const updated = await db.collection("categories").findOne({ _id: new ObjectId(req.params.id) })

    res.json({
      success: true,
      message: `${list.length} sub-category(ies) added`,
      subCategories: updated?.subCategories || []
    })
  } catch (err) {
    console.error("Add sub-category error:", err)
    res.status(500).json({ success: false, message: "Failed to add sub-category" })
  }
})

// =====================================================
// ✅ DELETE SUB-CATEGORY
// =====================================================
router.delete("/categories/:id/subcategories/:subName", async (req, res) => {
  try {
    const db = getDB()
    const subName = decodeURIComponent(req.params.subName)

    await db.collection("categories").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $pull: { subCategories: subName } as any,
        $set: { updatedAt: new Date() }
      }
    )

    res.json({ success: true, message: "Sub-category deleted" })
  } catch (err) {
    console.error("Delete sub-category error:", err)
    res.status(500).json({ success: false, message: "Failed to delete sub-category" })
  }
})

// =====================================================
// ✅ SEND NOTIFICATION
// =====================================================
router.post("/notifications", async (req, res) => {
  try {
    const { subject, message, type, role } = req.body
    const db = getDB()
    
    await db.collection("notifications").insertOne({
      subject,
      message,
      type: type || "all",
      role: role || "all",
      createdAt: new Date(),
      readBy: []
    })
    
    res.json({ success: true, message: "Notification sent" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send notification" })
  }
})

// =====================================================
// ✅ GET SETTINGS
// =====================================================
router.get("/settings", async (req, res) => {
  try {
    const db = getDB()
    let settings = await db.collection("settings").findOne({})
    
    if (!settings) {
      settings = {
        platformName: "Electrons B2B",
        contactEmail: "admin@electrons.com",
        contactPhone: "+91 98765 43210",
        commissionPercent: 5,
        currency: "INR",
        enableRFQ: true,
        enableChat: true,
        enableWishlist: true,
        allowSellerRegistration: true
      }
    }
    
    res.json(settings)
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch settings" })
  }
})

// =====================================================
// ✅ UPDATE SETTINGS
// =====================================================
router.put("/settings", async (req, res) => {
  try {
    const db = getDB()
    await db.collection("settings").updateOne(
      {},
      { $set: { ...req.body, updatedAt: new Date() } },
      { upsert: true }
    )
    res.json({ success: true, message: "Settings updated" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update settings" })
  }
})

export default router