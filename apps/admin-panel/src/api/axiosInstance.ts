import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
})

// Request Interceptor - Add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log("📤 Request:", config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor - Handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("📥 Response:", response.status, response.config.url)
    return response
  },
  (error) => {
    console.error("❌ Response Error:", error.response?.status, error.response?.data)
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken")
      localStorage.removeItem("adminUser")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default axiosInstance