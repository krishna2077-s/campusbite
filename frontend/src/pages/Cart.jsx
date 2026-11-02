import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { placeOrder } from '../api/api'
import CartItem from '../components/CartItem'
import { useAuth } from '../context/AuthContext'

const DELIVERY_FEE = 30

function getCart() {
  try { return JSON.parse(localStorage.getItem('campusbite_cart') || '[]') } catch { return [] }
}
function saveCart(cart) {
  localStorage.setItem('campusbite_cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
}

export default function Cart() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cart, setCart] = useState(getCart())
  const [address, setAddress] = useState('')
  const [addressError, setAddressError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const onUpdate = () => setCart(getCart())
    window.addEventListener('cart-updated', onUpdate)
    return () => window.removeEventListener('cart-updated', onUpdate)
  }, [])

  const handleUpdateQty = (id, newQty) => {
    if (newQty <= 0) {
      handleRemove(id)
      return
    }
    const updated = cart.map(item => item.id === id ? { ...item, quantity: newQty } : item)
    saveCart(updated)
    setCart(updated)
  }

  const handleRemove = (id) => {
    const updated = cart.filter(item => item.id !== id)
    saveCart(updated)
    setCart(updated)
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + (cart.length > 0 ? DELIVERY_FEE : 0)

  const handlePlaceOrder = async () => {
    setError('')
    if (!address.trim()) {
      setAddressError('Delivery address is required')
      return
    }
    setAddressError('')

    // Group by restaurant
    const restaurantId = cart[0]?.restaurantId
    if (!restaurantId) { setError('Cart error: no restaurant found'); return }

    setPlacing(true)
    try {
      const payload = {
        restaurant_id: restaurantId,
        items: cart.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        delivery_address: address.trim(),
        total_amount: total,
        payment_method: 'DUMMY',
      }

      const res = await placeOrder(payload)
      const order = res.data

      // Clear cart
      saveCart([])
      setCart([])
      setOrderSuccess(order)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to place order. Please try again.'
      )
    } finally {
      setPlacing(false)
    }
  }

  // Order Confirmation Screen
  if (orderSuccess) {
    return (
      <div className="page-wrapper" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 36px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-200)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: 'var(--accent)', marginBottom: 8 }}>Order Placed!</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
            Your order has been placed successfully and is being processed.
          </p>
          <div style={{
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius)',
            padding: '18px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Order ID</span>
              <strong>#{String(orderSuccess.id || orderSuccess._id || 'N/A').slice(-8).toUpperCase()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Total</span>
              <strong>₹{Number(orderSuccess.total_amount || total).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Status</span>
              <span className="badge badge-PLACED">Placed</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard/customer')}>
              📦 Track Order
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/restaurants')}>
              🍽️ Order More
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">🛒 Your Cart</h1>
        {cart.length > 0 && (
          <button className="btn btn-sm btn-danger" onClick={() => { saveCart([]); setCart([]) }}>
            Clear Cart
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🛒</span>
          <h3>Your cart is empty</h3>
          <p>Browse restaurants and add items to get started</p>
          <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* Cart Items */}
          <div>
            <div className="card">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>
                  🏪 {cart[0]?.restaurantName || 'Restaurant'}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="card-body">
                {cart.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQty={handleUpdateQty}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="card mt-2">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>📍 Delivery Address</h3>
              </div>
              <div className="card-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <textarea
                    className={`form-control ${addressError ? 'error' : ''}`}
                    placeholder="Enter your full delivery address (dorm name, room number, landmark...)"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setAddressError('') }}
                    rows={3}
                  />
                  {addressError && <span className="form-error">⚠ {addressError}</span>}
                </div>
              </div>
            </div>

            {/* Payment Note */}
            <div className="alert alert-info mt-2">
              <span>💳</span>
              <span>Payment will be processed on delivery. This is a demo payment flow.</span>
            </div>

            {error && <div className="alert alert-error mt-2">{error}</div>}
          </div>

          {/* Order Summary */}
          <div>
            <div className="cart-summary">
              <h3 className="cart-summary-title">Order Summary</h3>

              {cart.map(item => (
                <div key={item.id} className="cart-summary-row">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              <div className="divider" />

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Delivery Fee</span>
                <span>₹{DELIVERY_FEE.toFixed(2)}</span>
              </div>

              <div className="cart-summary-total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <button
                className="btn btn-primary w-full btn-lg mt-2"
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? '⏳ Placing Order...' : '🛍️ Place Order'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: 10 }}>
                🔒 Secure checkout
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
