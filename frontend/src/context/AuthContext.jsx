import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('campusbite_token')
    const storedUser = localStorage.getItem('campusbite_user')
    if (storedToken) {
      setToken(storedToken)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          // Try parsing JWT
          const decoded = parseJwt(storedToken)
          if (decoded) setUser(decoded)
        }
      } else {
        const decoded = parseJwt(storedToken)
        if (decoded) setUser(decoded)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((newToken, userData = null) => {
    setToken(newToken)
    localStorage.setItem('campusbite_token', newToken)
    let userObj = userData
    if (!userObj) {
      userObj = parseJwt(newToken)
    }
    if (userObj) {
      setUser(userObj)
      localStorage.setItem('campusbite_user', JSON.stringify(userObj))
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('campusbite_token')
    localStorage.removeItem('campusbite_user')
    localStorage.removeItem('campusbite_cart')
  }, [])

  const isAuthenticated = Boolean(token)

  // Role helpers — normalise to lowercase for comparison
  const role = user?.role?.toLowerCase() || user?.user_type?.toLowerCase() || ''

  const isCustomer = role === 'customer'
  const isOwner = role === 'owner' || role === 'restaurant_owner'
  const isDeliveryPartner = role === 'delivery' || role === 'delivery_partner'

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      login,
      logout,
      isAuthenticated,
      isCustomer,
      isOwner,
      isDeliveryPartner,
      role,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
