 
export interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "seller" | "buyer"
  phone?: string
  companyName?: string
  gstNumber?: string
  kycStatus?: "Pending" | "Verified" | "Rejected"
  isBlocked?: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  _id: string
  name: string
  price: number
  stock: number
  category: string
  subCategory?: string
  company: string
  image: string
  sellerId: string
  sellerName?: string
  isApproved?: boolean
  createdAt: string
  updatedAt: string
}

export interface Order {
  _id: string
  orderId: string
  productName: string
  quantity: number
  totalAmount: number
  buyerName: string
  sellerName: string
  status: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
  paymentStatus: "Pending" | "Paid"
  tracking: any[]
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalUsers: number
  totalSellers: number
  totalBuyers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingSellers: number
  pendingProducts: number
  pendingOrders: number
}