import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../features/cart/cartSlice'

export const useCart = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { items, totalItems, totalAmount, loading, error } = useSelector(
    (state: RootState) => state.cart
  )

  return {
    items,
    totalItems,
    totalAmount,
    loading,
    error,
    fetchCart: (buyerId: string) => dispatch(fetchCart(buyerId)),
    addToCart: (data: any) => dispatch(addToCart(data)),
    updateQuantity: (data: any) => dispatch(updateCartItem(data)),
    removeItem: (buyerId: string, productId: string) =>
      dispatch(removeFromCart({ buyerId, productId })),
    clearCart: (buyerId: string) => dispatch(clearCart(buyerId))
  }
}