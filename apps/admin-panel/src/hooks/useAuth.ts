import { useSelector, useDispatch } from "react-redux"
import { RootState, AppDispatch } from "../store/store"
import { adminGoogleLogin, logout, setUser } from "../features/auth/authSlice"

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  )

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    adminGoogleLogin: async (email: string, name: string, photo?: string) => {
      const result = await dispatch(adminGoogleLogin({ email, name, photo }))
      return result
    },
    logout: () => dispatch(logout()),
    setUser: (user: any, token: string) =>
      dispatch(setUser({ user, token }))
  }
}