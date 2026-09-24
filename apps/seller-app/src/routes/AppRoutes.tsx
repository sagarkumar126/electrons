// seller-app/src/routes/AppRoutes.tsx

import {
  Routes,
  Route,
  Navigate
} from "react-router-dom"

import SellerLayout from "../layouts/SellerLayout"
import SellerChat from "../pages/SellerChat/SellerChat"
import SellerHome from "../pages/SellerHome/SellerHome"
import SellerProducts from "../pages/SellerProducts/SellerProducts"
import SellerOrders from "../pages/SellerOrders/SellerOrders"

import SellerAllProducts from "../pages/SellerAllProducts/SellerAllProducts"
import SellerProfile from "../pages/Profile/SellerProfile"

import StockManagement from "../pages/StockManagement/StockManagement"

import Login from "../pages/Auth/Login"
import Register from "../pages/Auth/Register"
import ChatList from "../pages/ChatList/ChatList"

// ✅ RFQ Imports
import SellerRFQDashboard from "../pages/RFQ/SellerRFQDashboard"
import SellerRFQDetail from "../pages/RFQ/SellerRFQDetail"
import SellerProductDetail from "../pages/SellerProductDetail/SellerProductDetail"
import SellerCategoryView from "../pages/SellerCategoryView/SellerCategoryView"

// ✅ BUYER REQUIREMENTS — LIST + DETAIL
import SellerRequirements from "../pages/SellerRequirements/SellerRequirements"
import SellerRequirementDetail from "../pages/SellerRequirementDetail/SellerRequirementDetail"

const AppRoutes = () => {

  const token = localStorage.getItem("token")

  return (

    <Routes>

      <Route
        path="/"
        element={
          token
            ? <Navigate to="/home" />
            : <Navigate to="/login" />
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/home"
        element={
          token ? (
            <SellerLayout>
              <SellerHome />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/products"
        element={
          token ? (
            <SellerLayout>
              <SellerProducts />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/orders"
        element={
          token ? (
            <SellerLayout>
              <SellerOrders />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/all-products"
        element={
          token ? (
            <SellerLayout>
              <SellerAllProducts />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/profile"
        element={
          token ? (
            <SellerLayout>
              <SellerProfile />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/stocks"
        element={
          token ? (
            <SellerLayout>
              <StockManagement />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      {/* ✅ CHATS */}
      <Route
        path="/chats"
        element={
          token ? (
            <SellerLayout>
              <ChatList />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/chat/:roomId"
        element={
          token ? (
            <SellerLayout>
              <SellerChat />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      {/* ✅ RFQ Routes */}
      <Route
        path="/seller/rfqs"
        element={
          token ? (
            <SellerLayout>
              <SellerRFQDashboard />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/seller/rfq/:id"
        element={
          token ? (
            <SellerLayout>
              <SellerRFQDetail />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/seller/category/:category"
        element={
          token ? (
            <SellerLayout>
              <SellerCategoryView />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      <Route
        path="/seller/product/:id"
        element={
          token ? (
            <SellerLayout>
              <SellerProductDetail />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      {/* ✅ BUYER REQUIREMENTS — LIST */}
      <Route
        path="/buyer-requirements"
        element={
          token ? (
            <SellerLayout>
              <SellerRequirements />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

      {/* ✅ BUYER REQUIREMENT — DETAIL (NEW) */}
      <Route
        path="/buyer-requirement/:requirementId"
        element={
          token ? (
            <SellerLayout>
              <SellerRequirementDetail />
            </SellerLayout>
          ) : <Navigate to="/login" />
        }
      />

    </Routes>
  )
}

export default AppRoutes