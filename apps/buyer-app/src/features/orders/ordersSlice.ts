import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

interface OrdersState {
  orders: any[]
  loading: boolean
  error: string | null
  currentOrder: any | null
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
  currentOrder: null
}

// ✅ Fetch buyer orders
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (buyerId: string) => {
    const response = await axiosInstance.get(`/orders/buyer/${buyerId}`)
    return response.data
  }
)

// ✅ Create order (Buy Now)
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: any) => {
    const response = await axiosInstance.post('/orders/create-direct', orderData)
    return response.data
  }
)

// ✅ Create order from chat
export const createOrderFromChat = createAsyncThunk(
  'orders/createOrderFromChat',
  async (orderData: any) => {
    const response = await axiosInstance.post('/orders/create', orderData)
    return response.data
  }
)

// ✅ Get single order by ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId: string) => {
    const response = await axiosInstance.get(`/orders/${orderId}`)
    return response.data
  }
)

// ✅ Accept order
export const acceptOrder = createAsyncThunk(
  'orders/acceptOrder',
  async (orderId: string) => {
    const response = await axiosInstance.put(`/orders/accept/${orderId}`)
    return response.data
  }
)

// ✅ Cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId: string) => {
    const response = await axiosInstance.put(`/orders/cancel/${orderId}`)
    return response.data
  }
)

// ✅ Update order status
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
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch orders'
      })

      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create order'
      })

      // Create order from chat
      .addCase(createOrderFromChat.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrderFromChat.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
      })
      .addCase(createOrderFromChat.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create order'
      })

      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch order'
      })

      // Accept order
      .addCase(acceptOrder.fulfilled, (state, action) => {
        // Update order in list
        const updatedOrder = action.payload
        state.orders = state.orders.map((order: any) =>
          order.orderId === updatedOrder.orderId ? updatedOrder : order
        )
      })

      // Cancel order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload
        state.orders = state.orders.map((order: any) =>
          order.orderId === updatedOrder.orderId ? updatedOrder : order
        )
      })

      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updatedOrder = action.payload
        state.orders = state.orders.map((order: any) =>
          order.orderId === updatedOrder.orderId ? updatedOrder : order
        )
        if (state.currentOrder?.orderId === updatedOrder.orderId) {
          state.currentOrder = updatedOrder
        }
      })
  }
})

export const { clearCurrentOrder, clearError } = ordersSlice.actions
export default ordersSlice.reducer