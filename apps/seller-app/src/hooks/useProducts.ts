import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchSellerProducts, addProduct, updateProduct, deleteProduct } from '../features/products/productsSlice'

export const useProducts = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { products, loading, error } = useSelector(
    (state: RootState) => state.products
  )

  return {
    products,
    loading,
    error,
    fetchSellerProducts: (sellerId: string) =>
      dispatch(fetchSellerProducts(sellerId)),
    addProduct: (data: any) => dispatch(addProduct(data)),
    updateProduct: (id: string, data: any) =>
      dispatch(updateProduct({ id, data })),
    deleteProduct: (id: string) => dispatch(deleteProduct(id))
  }
}