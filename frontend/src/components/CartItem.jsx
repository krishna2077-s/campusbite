import React from 'react'

export default function CartItem({ item, onUpdateQty, onRemove }) {
  const subtotal = (item.price * item.quantity).toFixed(2)

  return (
    <div className="cart-item">
      {/* Item image / emoji */}
      <div style={{
        width: 48,
        height: 48,
        background: 'var(--gray-100)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : '🍽️'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cart-item-name">{item.name}</div>
        <div className="cart-item-price">₹{Number(item.price).toFixed(2)} each</div>
      </div>

      {/* Qty Controls */}
      <div className="quantity-control">
        <button className="qty-btn" onClick={() => onUpdateQty(item.id, item.quantity - 1)}>−</button>
        <span className="qty-value">{item.quantity}</span>
        <button className="qty-btn" onClick={() => onUpdateQty(item.id, item.quantity + 1)}>+</button>
      </div>

      {/* Subtotal */}
      <div className="cart-subtotal">₹{subtotal}</div>

      {/* Remove */}
      <button
        className="btn-icon"
        onClick={() => onRemove(item.id)}
        title="Remove item"
        style={{ color: 'var(--danger)', background: '#fee2e2' }}
      >
        ✕
      </button>
    </div>
  )
}
