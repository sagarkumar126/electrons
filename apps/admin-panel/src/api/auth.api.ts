import axiosInstance from "./axiosInstance"

export const authApi = {
  adminGoogleLogin: (email: string, name: string, photo?: string) =>
    axiosInstance.post("/auth/admin/google-login", { email, name, photo }),

  adminRegister: (data: any) =>
    axiosInstance.post("/auth/admin/register", data),

  logout: () =>
    axiosInstance.post("/auth/admin/logout"),

  getCurrentAdmin: () =>
    axiosInstance.get("/auth/admin/me")
}