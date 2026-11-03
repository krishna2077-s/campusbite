import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem('campusbite_cart') || '[]')
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  } catch {
    return 0
  }
}

export default function Navbar() {
  const { isAuthenticated, user, isCustomer, isOwner, isDeliveryPartner, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(getCartCount())

  React.useEffect(() => {
    const updateCount = () => setCartCount(getCartCount())
    window.addEventListener('cart-updated', updateCount)
    window.addEventListener('storage', updateCount)
    return () => {
      window.removeEventListener('cart-updated', updateCount)
      window.removeEventListener('storage', updateCount)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">🍕</span>
          <span className="brand-text">
            Campus<span>Bite</span>
          </span>
        </Link>

        {/* Toggle for mobile */}
        <button
          className="navbar-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Nav Links */}
        <div className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/restaurants" onClick={closeMenu}>Restaurants</NavLink>

          {isAuthenticated && isCustomer && (
            <>
              <NavLink to="/dashboard/customer" onClick={closeMenu}>My Orders</NavLink>
              <NavLink to="/ai-insights" onClick={closeMenu}>🤖 AI Insights</NavLink>
            </>
          )}
          {isAuthenticated && isOwner && (
            <>
              <NavLink to="/dashboard/owner" onClick={closeMenu}>Dashboard</NavLink>
              <NavLink to="/dashboard/owner/menu" onClick={closeMenu}>Menu</NavLink>
              <NavLink to="/dashboard/owner/orders" onClick={closeMenu}>Orders</NavLink>
            </>
          )}
          {isAuthenticated && isDeliveryPartner && (
            <NavLink to="/dashboard/delivery" onClick={closeMenu}>Deliveries</NavLink>
          )}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <span className="user-info">
                <span>👤</span> {user?.full_name || user?.name || user?.email?.split('@')[0] || 'User'}
              </span>
              {isCustomer && (
                <Link to="/cart" className="cart-btn" onClick={closeMenu}>
                  <span>🛒</span> Cart
                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount}</span>
                  )}
                </Link>
              )}
              <button className="btn btn-sm btn-ghost" onClick={handleLogout}
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--gray-200)', borderColor: 'rgba(255,255,255,0.15)' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-ghost"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--gray-200)', borderColor: 'rgba(255,255,255,0.15)' }}
                onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary" onClick={closeMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
