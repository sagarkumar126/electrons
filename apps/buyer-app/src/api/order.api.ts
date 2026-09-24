import axiosInstance from './axiosInstance'

export const orderApi = {
  // Get buyer orders
  getBuyerOrders: (buyerId: string) =>
    axiosInstance.get(`/orders/buyer/${buyerId}`),

  // Get seller orders
  getSellerOrders: (sellerId: string) =>
    axiosInstance.get(`/orders/seller/${sellerId}`),

  // Get single order by ID
  getById: (orderId: string) =>
    axiosInstance.get(`/orders/${orderId}`),

  // Create order (Buy Now)
  createDirect: (data: any) =>
    axiosInstance.post('/orders/create-direct', data),

  // Create order from chat
  createFromChat: (data: any) =>
    axiosInstance.post('/orders/create', data),

  // Accept order
  accept: (orderId: string) =>
    axiosInstance.put(`/orders/accept/${orderId}`),

  // Cancel order
  cancel: (orderId: string) =>
    axiosInstance.put(`/orders/cancel/${orderId}`),

  // Update order status
  updateStatus: (orderId: string, status: string, note?: string) =>
    axiosInstance.put(`/orders/status/${orderId}`, { status, note })
}