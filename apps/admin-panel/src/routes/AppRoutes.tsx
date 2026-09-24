import { Routes, Route, Navigate } from "react-router-dom"
import AdminLayout from "../layouts/AdminLayout"
import ProtectedRoute from "./ProtectedRoute"
import Login from "../pages/Login/Login"
import Register from "../pages/Register/Register"
import Dashboard from "../pages/Dashboard/Dashboard"
import Users from "../pages/Users/Users"
import Products from "../pages/Products/Products"
import Orders from "../pages/Orders/Orders"
import Categories from "../pages/Categories/Categories"
import Revenue from "../pages/Revenue/Revenue"
import Settings from "../pages/Settings/Settings"
import Notifications from "../pages/Notifications/Notifications"

const AppRoutes = () => {
  const token = localStorage.getItem("adminToken")

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Users />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Products />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Orders />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Categories />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/revenue"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Revenue />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Settings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Notifications />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes