import axiosInstance from "./axiosInstance"

export const adminApi = {
  // ===== USERS =====
  getAllUsers: () =>
    axiosInstance.get("/admin/users"),

  approveSeller: (sellerId: string) =>
    axiosInstance.put(`/admin/users/approve-seller/${sellerId}`),

  blockUser: (userId: string) =>
    axiosInstance.put(`/admin/users/block/${userId}`),

  unblockUser: (userId: string) =>
    axiosInstance.put(`/admin/users/unblock/${userId}`),

  deleteUser: (userId: string) =>
    axiosInstance.delete(`/admin/users/${userId}`),

  // ===== PRODUCTS =====
  getAllProducts: () =>
    axiosInstance.get("/admin/products"),

  approveProduct: (productId: string) =>
    axiosInstance.put(`/admin/products/approve/${productId}`),

  rejectProduct: (productId: string) =>
    axiosInstance.put(`/admin/products/reject/${productId}`),

  deleteProduct: (productId: string) =>
    axiosInstance.delete(`/admin/products/${productId}`),

  // ===== ORDERS =====
  getAllOrders: () =>
    axiosInstance.get("/admin/orders"),

  updateOrderStatus: (orderId: string, status: string) =>
    axiosInstance.put(`/admin/orders/status/${orderId}`, { status }),

  // ===== CATEGORIES =====
  getCategories: () =>
    axiosInstance.get("/admin/categories"),

  addCategory: (name: string) =>
    axiosInstance.post("/admin/categories", { name }),

  updateCategory: (id: string, name: string) =>
    axiosInstance.put(`/admin/categories/${id}`, { name }),

  deleteCategory: (id: string) =>
    axiosInstance.delete(`/admin/categories/${id}`),

  // ✅ BULK: Add multiple sub-categories at once
  addSubCategories: (categoryId: string, subCategories: string[]) =>
    axiosInstance.post(`/admin/categories/${categoryId}/subcategories`, { subCategories }),

  // ✅ SINGLE: still works for backwards compat
  addSubCategory: (categoryId: string, name: string) =>
    axiosInstance.post(`/admin/categories/${categoryId}/subcategories`, { name }),

  // ✅ DELETE single sub-category
  removeSubCategory: (categoryId: string, subName: string) =>
    axiosInstance.delete(
      `/admin/categories/${categoryId}/subcategories/${encodeURIComponent(subName)}`
    ),

  // ===== DASHBOARD =====
  getDashboardStats: () =>
    axiosInstance.get("/admin/dashboard/stats"),

  // ===== SETTINGS =====
  getSettings: () =>
    axiosInstance.get("/admin/settings"),

  updateSettings: (data: any) =>
    axiosInstance.put("/admin/settings", data),

  // ===== NOTIFICATIONS =====
  sendNotification: (data: any) =>
    axiosInstance.post("/admin/notifications", data)
}