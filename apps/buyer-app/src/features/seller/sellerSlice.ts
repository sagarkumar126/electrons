import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

interface SellerState {
  seller: any | null
  products: any[]
  reviews: any[]
  loading: boolean
  error: string | null
}

const initialState: SellerState = {
  seller: null,
  products: [],
  reviews: [],
  loading: false,
  error: null
}

// ✅ Fetch seller profile
export const fetchSellerProfile = createAsyncThunk(
  'seller/fetchProfile',
  async (sellerId: string) => {
    const response = await axiosInstance.get(`/seller/profile/${sellerId}`)
    return response.data
  }
)

// ✅ Fetch seller products
export const fetchSellerProducts = createAsyncThunk(
  'seller/fetchProducts',
  async (sellerId: string) => {
    const response = await axiosInstance.get(`/products/seller/${sellerId}`)
    return response.data
  }
)

// ✅ Fetch seller reviews
export const fetchSellerReviews = createAsyncThunk(
  'seller/fetchReviews',
  async (sellerId: string) => {
    const response = await axiosInstance.get(`/seller/reviews/${sellerId}`)
    return response.data
  }
)

// ✅ Add review
export const addReview = createAsyncThunk(
  'seller/addReview',
  async ({ sellerId, rating, review, productId }: any) => {
    const response = await axiosInstance.post('/seller/review', {
      sellerId,
      rating,
      review,
      productId
    })
    return response.data
  }
)

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    clearSeller: (state) => {
      state.seller = null
      state.products = []
      state.reviews = []
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchSellerProfile.fulfilled, (state, action) => {
        state.loading = false
        state.seller = action.payload
      })
      .addCase(fetchSellerProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch seller'
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.products = action.payload
      })
      .addCase(fetchSellerReviews.fulfilled, (state, action) => {
        state.reviews = action.payload
      })
  }
})

export const { clearSeller } = sellerSlice.actions
export default sellerSlice.reducer