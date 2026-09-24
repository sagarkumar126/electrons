import axiosInstance from './axiosInstance'

export const cartApi = {
  // Get cart by buyer ID
  get: (buyerId: string) =>
    axiosInstance.get(`/cart/${buyerId}`),

  // Add item to cart
  add: (data: any) =>
    axiosInstance.post('/cart/add', data),

  // Update cart item quantity
  update: (data: any) =>
    axiosInstance.put('/cart/update', data),

  // Remove item from cart
  remove: (buyerId: string, productId: string) =>
    axiosInstance.delete(`/cart/remove/${buyerId}/${productId}`),

  // Clear cart
  clear: (buyerId: string) =>
    axiosInstance.delete(`/cart/clear/${buyerId}`),

  // Request quote for cart items
  requestQuote: (data: any) =>
    axiosInstance.post('/cart/request-quote', data)
}