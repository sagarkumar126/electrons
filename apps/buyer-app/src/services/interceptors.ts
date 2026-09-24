import apiClient from "./apiClient"

export const setupInterceptors = () => {
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const res = await apiClient.post("/auth/refresh")

          localStorage.setItem("accessToken", res.data.accessToken)

          originalRequest.headers.Authorization =
            `Bearer ${res.data.accessToken}`

          return apiClient(originalRequest)
        } catch (err) {
          localStorage.removeItem("accessToken")
          window.location.href = "/login"
        }
      }

      return Promise.reject(error)
    }
  )
}