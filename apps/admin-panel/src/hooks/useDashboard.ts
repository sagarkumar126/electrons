 
import { useSelector, useDispatch } from "react-redux"
import { RootState, AppDispatch } from "../store/store"
import { fetchDashboardStats } from "../features/dashboard/dashboardSlice"

export const useDashboard = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { stats, loading, error } = useSelector(
    (state: RootState) => state.dashboard
  )

  return {
    stats,
    loading,
    error,
    fetchDashboardStats: () => dispatch(fetchDashboardStats())
  }
}