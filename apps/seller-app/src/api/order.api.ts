import axiosInstance from './axiosInstance'

export const orderApi = {
  getSellerOrders: (sellerId: string) =>
    axiosInstance.get(`/orders/seller/${sellerId}`),
  updateStatus: (orderId: string, status: string, note?: string) =>
    axiosInstance.put(`/orders/status/${orderId}`, { status, note })
}