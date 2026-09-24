import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { sellerGoogleLogin, logout, setUser } from '../features/auth/authSlice'

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
    sellerGoogleLogin: (email: string, name: string, photo?: string) =>
      dispatch(sellerGoogleLogin({ email, name, photo })),
    logout: () => dispatch(logout()),
    setUser: (user: any, token: string) =>
      dispatch(setUser({ user, token }))
  }
}