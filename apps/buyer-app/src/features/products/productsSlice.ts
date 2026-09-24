import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

interface ProductsState {
  products: any[]
  filteredProducts: any[]
  loading: boolean
  error: string | null
  currentProduct: any | null
  filters: any
  sortBy: string
}

const initialState: ProductsState = {
  products: [],
  filteredProducts: [],
  loading: false,
  error: null,
  currentProduct: null,
  filters: {},
  sortBy: 'newest'
}

// ✅ Fetch all products
export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const response = await axiosInstance.get('/products')
  return response.data
})

// ✅ Fetch single product
export const fetchProductById = createAsyncThunk('products/fetchProductById', async (id: string) => {
  const response = await axiosInstance.get(`/products/${id}`)
  return response.data
})

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload
      state.filteredProducts = applyFilters(state.products, state.filters, state.sortBy)
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload
      state.filteredProducts = applyFilters(state.products, state.filters, state.sortBy)
    },
    clearFilters: (state) => {
      state.filters = {}
      state.filteredProducts = state.products
    },
    applySearch: (state, action) => {
      const query = action.payload.toLowerCase()
      state.filteredProducts = state.products.filter((p: any) =>
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.company?.toLowerCase().includes(query)
      )
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload
        state.filteredProducts = applyFilters(action.payload, state.filters, state.sortBy)
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch products'
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentProduct = action.payload
      })
  }
})

// ✅ Filter function
const applyFilters = (products: any[], filters: any, sortBy: string) => {
  let result = [...products]

  // Category filter
  if (filters.category) {
    result = result.filter(p => p.category === filters.category)
  }

  // Price range
  if (filters.priceRange?.min) {
    result = result.filter(p => Number(p.price) >= Number(filters.priceRange.min))
  }
  if (filters.priceRange?.max) {
    result = result.filter(p => Number(p.price) <= Number(filters.priceRange.max))
  }

  // MOQ filter
  if (filters.moq) {
    result = result.filter(p => Number(p.moq) <= Number(filters.moq))
  }

  // In stock
  if (filters.inStock) {
    result = result.filter(p => Number(p.stock) > 0)
  }

  // Verified sellers
  if (filters.verifiedSellers) {
    result = result.filter(p => p.sellerVerified === true)
  }

  // Sorting
  switch(sortBy) {
    case 'priceLow':
      result.sort((a, b) => Number(a.price) - Number(b.price))
      break
    case 'priceHigh':
      result.sort((a, b) => Number(b.price) - Number(a.price))
      break
    case 'popular':
      result.sort((a, b) => (b.orders || 0) - (a.orders || 0))
      break
    case 'rating':
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break
    default: // newest
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return result
}

export const { setFilters, setSortBy, clearFilters, applySearch } = productsSlice.actions
export default productsSlice.reducer