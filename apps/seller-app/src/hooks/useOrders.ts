import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchSellerOrders, updateOrderStatus } from '../features/orders/ordersSlice'

export const useOrders = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { orders, loading, error } = useSelector(
    (state: RootState) => state.orders
  )

  return {
    orders,
    loading,
    error,
    fetchSellerOrders: (sellerId: string) =>
      dispatch(fetchSellerOrders(sellerId)),
    updateOrderStatus: (orderId: string, status: string, note?: string) =>
      dispatch(updateOrderStatus({ orderId, status, note }))
  }
}