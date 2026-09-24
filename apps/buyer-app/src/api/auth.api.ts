import axiosInstance from './axiosInstance'

export const authApi = {
  // Google Login
  googleLogin: (email: string, name: string) =>
    axiosInstance.post('/auth/google', { email, name }),

  // Refresh Token
  refreshToken: (refreshToken: string) =>
    axiosInstance.post('/auth/refresh', { refreshToken }),

  // Logout
  logout: () =>
    axiosInstance.post('/auth/logout'),

  // Get current user
  getCurrentUser: () =>
    axiosInstance.get('/auth/me')
}