import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import RestaurantList from './pages/RestaurantList'
import RestaurantMenu from './pages/RestaurantMenu'
import Cart from './pages/Cart'
import CustomerDashboard from './pages/CustomerDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import MenuManagement from './pages/MenuManagement'
import OrderManagement from './pages/OrderManagement'
import DeliveryDashboard from './pages/DeliveryDashboard'
import AIInsights from './pages/AIInsights'

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants" element={<RestaurantList />} />
        <Route path="/restaurants/:id" element={<RestaurantMenu />} />

        {/* Customer only */}
        <Route path="/cart" element={
          <ProtectedRoute requiredRole="customer">
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/customer" element={
          <ProtectedRoute requiredRole="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/ai-insights" element={
          <ProtectedRoute requiredRole="customer">
            <AIInsights />
          </ProtectedRoute>
        } />

        {/* Owner only */}
        <Route path="/dashboard/owner" element={
          <ProtectedRoute requiredRole="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/owner/menu" element={
          <ProtectedRoute requiredRole="owner">
            <MenuManagement />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/owner/orders" element={
          <ProtectedRoute requiredRole="owner">
            <OrderManagement />
          </ProtectedRoute>
        } />

        {/* Delivery only */}
        <Route path="/dashboard/delivery" element={
          <ProtectedRoute requiredRole="delivery">
            <DeliveryDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
