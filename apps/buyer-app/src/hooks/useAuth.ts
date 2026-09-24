import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { googleLogin, logout, setUser } from '../features/auth/authSlice'

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
    googleLogin: (email: string, name: string) =>
      dispatch(googleLogin({ email, name })),
    logout: () => dispatch(logout()),
    setUser: (user: any, token: string) =>
      dispatch(setUser({ user, token }))
  }
}