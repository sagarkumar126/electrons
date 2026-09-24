import { Routes, Route } from "react-router-dom"

import MainLayout from "../layouts/MainLayout"

import Home from "../pages/Home/Home"

import Products from "../pages/Products/Products"
import ProductDetail from "../pages/Products/ProductDetail"
import CategoryProducts from "../pages/Products/CategoryProducts"
import Discount from "../pages/Products/Discount"

import Login from "../pages/Login/Login"
import Register from "../pages/Register/Register"

import ProtectedRoute from "./ProtectedRoute"

import BuyerChat from "../pages/BuyerChat/BuyerChat"

import Blog from "../pages/Blog/Blog"
import Help from "../pages/Help/Help"
import FAQ from "../pages/FAQ/FAQ"
import Contact from "../pages/Contact/Contact"
import Search from "../pages/Search/Search"

import Order from "../pages/Orders/Orders"
import Profile from "../pages/Profile/Profile"

import Wishlist from "../pages/Wishlist/Wishlist"

import Payment from "../pages/Payment/Payment"
import OrderTracking from "../pages/Orders/OrderTracking"
import SellerStore from "../pages/SellerStore/SellerStore"

import CategoryPage from "../pages/CategoryPage/CategoryPage"
import RFQDetail from "../pages/RFQ/RFQDetail"
import RFQDashboard from "../pages/RFQ/RFQDashboard"

import ChatList from "../pages/ChatList/ChatList"
import MyRequirements from "../pages/MyRequirements/MyRequirements"
import PostRequirement from "../pages/PostRequirement/PostRequirement"

// ✅ NEW IMPORT — Requirement Detail
import RequirementDetail from "../pages/MyRequirements/RequirementDetail"

const AppRoutes = () => {
  return (
    <MainLayout>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/category/:name"
          element={
            <ProtectedRoute>
              <CategoryProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/category-page/:category"
          element={
            <ProtectedRoute>
              <CategoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discount"
          element={
            <ProtectedRoute>
              <Discount />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Order />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-tracking/:orderId"
          element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:sellerId"
          element={
            <ProtectedRoute>
              <BuyerChat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/:sellerId"
          element={
            <ProtectedRoute>
              <SellerStore />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfq-dashboard"
          element={
            <ProtectedRoute>
              <RFQDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfq/:id"
          element={
            <ProtectedRoute>
              <RFQDetail />
            </ProtectedRoute>
          }
        />

        <Route path="/blog" element={<Blog />} />
        <Route path="/help" element={<Help />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />

        <Route path="/profile" element={<Profile />} />

        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <ChatList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/post-requirement"
          element={
            <ProtectedRoute>
              <PostRequirement />
            </ProtectedRoute>
          }
        />

        {/* ✅ My Requirements — LIST */}
        <Route
          path="/my-requirements"
          element={
            <ProtectedRoute>
              <MyRequirements />
            </ProtectedRoute>
          }
        />

        {/* ✅ My Requirements — DETAIL (NEW) */}
        <Route
          path="/my-requirements/:requirementId"
          element={
            <ProtectedRoute>
              <RequirementDetail />
            </ProtectedRoute>
          }
        />

      </Routes>
    </MainLayout>
  )
}

export default AppRoutes