import axiosInstance from './axiosInstance'

export const productApi = {
  // Get all products
  getAll: () =>
    axiosInstance.get('/products'),

  // Get single product by ID
  getById: (id: string) =>
    axiosInstance.get(`/products/${id}`),

  // Get products by category
  getByCategory: (category: string) =>
    axiosInstance.get(`/products/category/${category}`),

  // Get discounted products
  getDiscounted: () =>
    axiosInstance.get('/products/discounted'),

  // Get products by seller
  getBySeller: (sellerId: string) =>
    axiosInstance.get(`/products/seller/${sellerId}`)
}