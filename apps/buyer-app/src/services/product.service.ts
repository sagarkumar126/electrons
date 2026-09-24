import apiClient from "./apiClient"

export const searchProducts = (q: string) => {
  return apiClient.get(`/products/search?q=${q}`)
}