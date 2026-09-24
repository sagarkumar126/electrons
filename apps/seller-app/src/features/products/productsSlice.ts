import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

interface ProductsState {
  products: any[]
  loading: boolean
  error: string | null
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null
}

export const fetchSellerProducts = createAsyncThunk(
  'products/fetchSellerProducts',
  async (sellerId: string) => {
    const response = await axiosInstance.get(`/products/seller/${sellerId}`)
    return response.data
  }
)

export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData: any) => {
    const response = await axiosInstance.post('/products', productData)
    return response.data
  }
)

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await axiosInstance.put(`/products/${id}`, data)
    return response.data
  }
)

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: string) => {
    await axiosInstance.delete(`/products/${id}`)
    return id
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch products'
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.push(action.payload)
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p._id === action.payload._id)
        if (index !== -1) state.products[index] = action.payload
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p._id !== action.payload)
      })
  }
})

export default productsSlice.reducer