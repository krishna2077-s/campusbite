import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRestaurant, getMenu } from '../api/api'
import MenuItemCard from '../components/MenuItemCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

function getCart() {
  try { return JSON.parse(localStorage.getItem('campusbite_cart') || '[]') } catch { return [] }
}

function saveCart(cart) {
  localStorage.setItem('campusbite_cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
}

export default function RestaurantMenu() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isCustomer } = useAuth()

  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cart, setCart] = useState(getCart())
  const [notification, setNotification] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([getRestaurant(id), getMenu(id)])
      .then(([rRes, mRes]) => {
        setRestaurant(rRes.data)
        const mData = mRes.data
        const items = Array.isArray(mData) ? mData : mData.items || mData.menu || []
        setMenuItems(items)
        setFiltered(items)
      })
      .catch(() => setError('Could not load restaurant menu.'))
      .finally(() => setLoading(false))
  }, [id])

  const categories = ['All', ...new Set(menuItems.map(i => i.category).filter(Boolean))]

  const applyFilters = useCallback(() => {
    let list = [...menuItems]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i => i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))
    }
    if (maxPrice) {
      list = list.filter(i => Number(i.price) <= Number(maxPrice))
    }
    if (selectedCategory !== 'All') {
      list = list.filter(i => i.category === selectedCategory)
    }
    setFiltered(list)
  }, [menuItems, search, maxPrice, selectedCategory])

  useEffect(() => { applyFilters() }, [applyFilters])

  const handleAddToCart = (item, qty) => {
    if (!isAuthenticated || !isCustomer) {
      navigate('/login')
      return
    }
    const currentCart = getCart()
    const existing = currentCart.find(c => c.id === item.id)
    let newCart
    if (existing) {
      newCart = currentCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + qty } : c)
    } else {
      newCart = [...currentCart, {
        id: item.id || item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        restaurantId: id,
        restaurantName: restaurant?.name,
        quantity: qty,
      }]
    }
    saveCart(newCart)
    setCart(newCart)
    setNotification(`✅ ${item.name} added to cart!`)
    setTimeout(() => setNotification(''), 2500)
  }

  const cartTotal = cart.filter(c => c.restaurantId === id)
    .reduce((sum, c) => sum + c.price * c.quantity, 0)
  const cartItems = cart.filter(c => c.restaurantId === id)

  if (loading) return <LoadingSpinner text="Loading menu..." />
  if (error) return (
    <div className="page-wrapper">
      <div className="alert alert-error">{error}</div>
    </div>
  )

  return (
    <div className="page-wrapper">
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: 80, right: 20, zIndex: 9999,
          background: 'var(--accent)', color: 'white',
          padding: '12px 20px', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', fontSize: '0.9rem',
          fontWeight: 600, animation: 'slideUp 0.3s ease',
        }}>
          {notification}
        </div>
      )}

      {/* Restaurant Header */}
      {restaurant && (
        <div style={{
          background: 'linear-gradient(135deg, var(--secondary), var(--secondary-light))',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          color: 'white',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius)',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {(restaurant.image || restaurant.image_url) ? (
              <img src={restaurant.image || restaurant.image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            ) : '🍽️'}
          </div>
          <div>
            <h1 style={{ color: 'white', margin: 0, letterSpacing: '-0.02em' }}>{restaurant.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', margin: '6px 0 0', fontSize: '0.92rem' }}>
              {restaurant.cuisine_type && <span>🍴 {restaurant.cuisine_type} &nbsp;|&nbsp; </span>}
              {restaurant.address && <span>📍 {restaurant.address}</span>}
            </p>
          </div>
        </div>
      )}


      <div className="dashboard-layout">
        {/* Menu */}
        <div>
          {/* Search & Filter */}
          <div className="search-filter-bar">
            <div className="search-input-wrapper" style={{ flex: 2 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  title="Clear search"
                  aria-label="Clear menu search"
                >
                  ✕
                </button>
              )}
            </div>
            <input
              type="number"
              className="form-control"
              placeholder="Max price ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ width: 130 }}
            />
          </div>

          {/* Category Pills */}
          {categories.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className="btn btn-sm"
                  style={{
                    background: selectedCategory === cat ? 'var(--primary)' : 'var(--white)',
                    color: selectedCategory === cat ? 'white' : 'var(--secondary)',
                    border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--gray-200)'}`,
                  }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🍽️</span>
              <h3>No items found</h3>
              <p>Try adjusting your search or price filter</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map((item) => (
                <MenuItemCard
                  key={item.id || item._id}
                  item={item}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div>
          <div className="cart-summary">
            <h3 className="cart-summary-title">🛒 Your Cart</h3>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛒</div>
                <p style={{ fontSize: '0.88rem', margin: 0 }}>Your cart is empty</p>
              </div>
            ) : (
              <>
                {cartItems.map(item => (
                  <div key={item.id} className="cart-summary-row">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="cart-summary-total">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  className="btn btn-primary w-full mt-2"
                  onClick={() => navigate('/cart')}
                >
                  Go to Cart →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
