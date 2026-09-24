import axiosInstance from './axiosInstance'

export const productApi = {
  getSellerProducts: (sellerId: string) =>
    axiosInstance.get(`/products/seller/${sellerId}`),
  create: (data: any) => axiosInstance.post('/products', data),
  update: (id: string, data: any) => axiosInstance.put(`/products/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/products/${id}`)
}