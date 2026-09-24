import { getDB } from "../db/mongo"

export const analyticsService = {

  // 📊 Dashboard stats
  getDashboardStats: async () => {
    const db = getDB()
    
    const totalUsers = await db.collection("users").countDocuments()
    const totalSellers = await db.collection("users").countDocuments({ role: "seller" })
    const totalBuyers = await db.collection("users").countDocuments({ role: "buyer" })
    const totalProducts = await db.collection("products").countDocuments()
    const totalOrders = await db.collection("orders").countDocuments()
    
    const revenueResult = await db.collection("orders").aggregate([
      { $match: { status: { $in: ["Confirmed", "Processing", "Shipped", "Delivered"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]).toArray()
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0
    
    return { totalUsers, totalSellers, totalBuyers, totalProducts, totalOrders, totalRevenue }
  },

  getMonthlyRevenue: async (year: number) => {
    const db = getDB()
    const result = await db.collection("orders").aggregate([
      {
        $match: {
          status: { $in: ["Confirmed", "Processing", "Shipped", "Delivered"] },
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray()
    return result
  },

  getTopProducts: async (limit: number = 10) => {
    const db = getDB()
    const result = await db.collection("orders").aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } }
    ]).toArray()
    return result
  },

  getSellerPerformance: async () => {
    const db = getDB()
    const result = await db.collection("orders").aggregate([
      {
        $group: {
          _id: "$sellerId",
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: "$quantity" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller"
        }
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } }
    ]).toArray()
    return result
  },

  getCategoryStats: async () => {
    const db = getDB()
    const result = await db.collection("products").aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: { $toDouble: "$price" } },
          totalStock: { $sum: { $toInt: "$stock" } }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()
    return result
  },

  getOrderStatusDistribution: async () => {
    const db = getDB()
    const result = await db.collection("orders").aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()
    return result
  },

  getRevenueByPaymentMethod: async () => {
    const db = getDB()
    const result = await db.collection("orders").aggregate([
      {
        $match: {
          status: { $in: ["Confirmed", "Processing", "Shipped", "Delivered"] }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalRevenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]).toArray()
    return result
  },

  getDailyOrders: async (days: number = 30) => {
    const db = getDB()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const result = await db.collection("orders").aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray()
    return result
  },

  getKYCStatusDistribution: async () => {
    const db = getDB()
    const result = await db.collection("users").aggregate([
      {
        $match: { role: "seller" }
      },
      {
        $group: {
          _id: "$kycStatus",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()
    return result
  }
}

export default analyticsService