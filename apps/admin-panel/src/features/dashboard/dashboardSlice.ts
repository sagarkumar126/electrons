import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { adminApi } from "../../api/admin.api"

interface DashboardState {
  stats: any | null
  loading: boolean
  error: string | null
}

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: null
}

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async () => {
    const response = await adminApi.getDashboardStats()
    console.log("📥 Dashboard API response:", response.data)
    return response.data
  }
)

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false
        // ✅ FIX: Backend response { success: true, data: {...} } format mein hai
        // Isliye action.payload.data use karo
        state.stats = action.payload.data || action.payload
        console.log("📊 Stats saved in Redux:", state.stats)
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch stats"
      })
  }
})

export default dashboardSlice.reducer