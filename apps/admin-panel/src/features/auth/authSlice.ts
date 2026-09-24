import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authApi } from "../../api/auth.api"

interface AuthState {
  user: any | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("adminUser") || "null"),
  token: localStorage.getItem("adminToken"),
  isAuthenticated: !!localStorage.getItem("adminToken"),
  loading: false,
  error: null
}

export const adminGoogleLogin = createAsyncThunk(
  "auth/adminGoogleLogin",
  async ({ email, name, photo }: { email: string; name: string; photo?: string }) => {
    const response = await authApi.adminGoogleLogin(email, name, photo)
    console.log("📦 adminGoogleLogin response:", response.data)
    return response.data
  }
)

export const logout = createAsyncThunk("auth/logout", async () => {
  await authApi.logout()
  localStorage.removeItem("adminToken")
  localStorage.removeItem("adminUser")
  return null
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem("adminToken", action.payload.token)
      localStorage.setItem("adminUser", JSON.stringify(action.payload.user))
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminGoogleLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(adminGoogleLogin.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload?.success) {
          state.user = action.payload.user
          state.token = action.payload.accessToken
          state.isAuthenticated = true
          localStorage.setItem("adminToken", action.payload.accessToken)
          localStorage.setItem("adminUser", JSON.stringify(action.payload.user))
        } else {
          state.error = action.payload?.message || "Login failed"
        }
      })
      .addCase(adminGoogleLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Login failed"
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  }
})

export const { setUser, clearError } = authSlice.actions
export default authSlice.reducer