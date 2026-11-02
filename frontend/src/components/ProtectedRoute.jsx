import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * requiredRole: 'customer' | 'owner' | 'delivery' | null (any authenticated)
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, loading, isCustomer, isOwner, isDeliveryPartner, role } = useAuth()

  if (loading) return <LoadingSpinner text="Checking access..." />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole) {
    const roleMap = {
      customer: isCustomer,
      owner: isOwner,
      delivery: isDeliveryPartner,
    }
    const hasRole = roleMap[requiredRole]
    if (!hasRole) {
      return (
        <div className="page-wrapper">
          <div className="empty-state">
            <span className="empty-state-icon">🚫</span>
            <h3>Access Denied</h3>
            <p>You don't have permission to view this page.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
              Your role: <strong>{role || 'unknown'}</strong>
            </p>
          </div>
        </div>
      )
    }
  }

  return children
}
