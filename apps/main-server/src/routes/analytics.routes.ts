import express from "express"
import { analyticsService } from "../services/analytics.service"
import { authMiddleware, roleMiddleware } from "../middleware/auth.middleware"

const router = express.Router()

// ✅ All analytics routes require authentication and admin role
router.use(authMiddleware)
router.use(roleMiddleware(["admin"]))

// 📊 Dashboard stats
router.get("/dashboard", async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats()
    res.json({ success: true, data: stats })
  } catch (err) {
    console.error("Dashboard stats error:", err)
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" })
  }
})

// 📈 Monthly revenue
router.get("/revenue/monthly/:year", async (req, res) => {
  try {
    const year = parseInt(req.params.year) || new Date().getFullYear()
    const data = await analyticsService.getMonthlyRevenue(year)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch monthly revenue" })
  }
})

// 🏆 Top products
router.get("/products/top/:limit?", async (req, res) => {
  try {
    const limit = parseInt(req.params.limit as string) || 10
    const data = await analyticsService.getTopProducts(limit)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch top products" })
  }
})

// 👥 Seller performance
router.get("/sellers/performance", async (req, res) => {
  try {
    const data = await analyticsService.getSellerPerformance()
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch seller performance" })
  }
})

// 📦 Category stats
router.get("/categories/stats", async (req, res) => {
  try {
    const data = await analyticsService.getCategoryStats()
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch category stats" })
  }
})

// 📊 Order status distribution
router.get("/orders/status-distribution", async (req, res) => {
  try {
    const data = await analyticsService.getOrderStatusDistribution()
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch order status distribution" })
  }
})

// 💰 Revenue by payment method
router.get("/revenue/payment-method", async (req, res) => {
  try {
    const data = await analyticsService.getRevenueByPaymentMethod()
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch revenue by payment method" })
  }
})

// 📅 Daily orders (last 30 days)
router.get("/orders/daily/:days?", async (req, res) => {
  try {
    const days = parseInt(req.params.days as string) || 30
    const data = await analyticsService.getDailyOrders(days)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch daily orders" })
  }
})

// 📊 KYC status distribution
router.get("/kyc/status-distribution", async (req, res) => {
  try {
    const data = await analyticsService.getKYCStatusDistribution()
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch KYC status distribution" })
  }
})

export default router