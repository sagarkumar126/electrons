import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

interface OrdersState {
  orders: any[]
  loading: boolean
  error: string | null
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null
}

export const fetchSellerOrders = createAsyncThunk(
  'orders/fetchSellerOrders',
  async (sellerId: string) => {
    const response = await axiosInstance.get(`/orders/seller/${sellerId}`)
    return response.data
  }
)

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status, note }: { orderId: string; status: string; note?: string }) => {
    const response = await axiosInstance.put(`/orders/status/${orderId}`, { status, note })
    return response.data
  }
)

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerOrders.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch orders'
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o._id === action.payload._id)
        if (index !== -1) state.orders[index] = action.payload
      })
  }
})

export default ordersSlice.reducer