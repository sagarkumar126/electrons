import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

interface RFQState {
  rfqs: any[]
  currentRFQ: any | null
  loading: boolean
  error: string | null
}

const initialState: RFQState = {
  rfqs: [],
  currentRFQ: null,
  loading: false,
  error: null
}

// ✅ Fetch all RFQs for buyer
export const fetchRFQs = createAsyncThunk(
  'rfq/fetchAll',
  async (buyerId: string) => {
    const response = await axiosInstance.get(`/rfq/buyer/${buyerId}`)
    return response.data
  }
)

// ✅ Create RFQ from cart
export const createRFQ = createAsyncThunk(
  'rfq/create',
  async (data: any) => {
    const response = await axiosInstance.post('/rfq/create', data)
    return response.data
  }
)

// ✅ Get single RFQ
export const fetchRFQById = createAsyncThunk(
  'rfq/fetchById',
  async (rfqId: string) => {
    const response = await axiosInstance.get(`/rfq/${rfqId}`)
    return response.data
  }
)

// ✅ Accept quote
export const acceptQuote = createAsyncThunk(
  'rfq/acceptQuote',
  async (rfqId: string) => {
    const response = await axiosInstance.put(`/rfq/accept/${rfqId}`)
    return response.data
  }
)

// ✅ Reject quote
export const rejectQuote = createAsyncThunk(
  'rfq/rejectQuote',
  async (rfqId: string) => {
    const response = await axiosInstance.put(`/rfq/reject/${rfqId}`)
    return response.data
  }
)

const rfqSlice = createSlice({
  name: 'rfq',
  initialState,
  reducers: {
    clearCurrentRFQ: (state) => {
      state.currentRFQ = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRFQs.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchRFQs.fulfilled, (state, action) => {
        state.loading = false
        state.rfqs = action.payload
      })
      .addCase(fetchRFQs.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch RFQs'
      })
      .addCase(createRFQ.fulfilled, (state, action) => {
        state.rfqs.unshift(action.payload)
      })
      .addCase(fetchRFQById.fulfilled, (state, action) => {
        state.currentRFQ = action.payload
      })
      .addCase(acceptQuote.fulfilled, (state, action) => {
        if (state.currentRFQ) {
          state.currentRFQ.status = 'Accepted'
        }
      })
      .addCase(rejectQuote.fulfilled, (state, action) => {
        if (state.currentRFQ) {
          state.currentRFQ.status = 'Rejected'
        }
      })
  }
})

export const { clearCurrentRFQ } = rfqSlice.actions
export default rfqSlice.reducer