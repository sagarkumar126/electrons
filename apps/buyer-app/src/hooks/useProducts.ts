import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import {
  fetchProducts,
  fetchProductById,
  fetchProductsByCategory,
  fetchDiscountedProducts
} from '../features/products/productsSlice'

export const useProducts = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { products, currentProduct, loading, error, categories } = useSelector(
    (state: RootState) => state.products
  )

  return {
    products,
    currentProduct,
    loading,
    error,
    categories,
    fetchProducts: () => dispatch(fetchProducts()),
    fetchProductById: (id: string) => dispatch(fetchProductById(id)),
    fetchProductsByCategory: (category: string) =>
      dispatch(fetchProductsByCategory(category)),
    fetchDiscountedProducts: () => dispatch(fetchDiscountedProducts())
  }
}