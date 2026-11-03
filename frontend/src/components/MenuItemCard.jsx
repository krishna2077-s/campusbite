import React, { useState } from 'react'

export default function MenuItemCard({ item, onAddToCart, isOwner, onEdit, onDelete, onToggle }) {
  const [qty, setQty] = useState(1)

  const {
    id,
    _id,
    name,
    description,
    price,
    image,
    image_url,
    is_available = true,
    category,
  } = item

  const itemId = id || _id
  const imgSrc = image || image_url

  const handleAdd = () => {
    onAddToCart && onAddToCart({ ...item, id: itemId }, qty)
    setQty(1)
  }

  return (
    <div className={`menu-item-card ${!is_available && !isOwner ? 'menu-item-unavailable' : ''}`}>
      {/* Image */}
      <div className="menu-item-img">
        {imgSrc ? (
          <img src={imgSrc} alt={name} />
        ) : (
          <span>🍽️</span>
        )}
      </div>

      {/* Info */}
      <div className="menu-item-info">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h4 className="menu-item-name">{name}</h4>
          {!is_available && (
            <span className="unavailable-badge">Unavailable</span>
          )}
        </div>

        {category && (
          <span style={{
            fontSize: '0.74rem',
            color: 'var(--primary)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'inline-block',
            marginBottom: 4,
          }}>
            {category}
          </span>
        )}

        {description && <p className="menu-item-desc">{description}</p>}

        <div className="menu-item-price">₹{Number(price).toFixed(2)}</div>

        {/* Customer: Add to Cart */}
        {!isOwner && is_available && onAddToCart && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div className="quantity-control">
              <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
              <span className="qty-value">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(qty + 1)} aria-label="Increase quantity">+</button>
            </div>
            <button className="btn btn-sm btn-primary" onClick={handleAdd}>
              🛍️ Add to Cart
            </button>
          </div>
        )}

        {/* Owner controls */}
        {isOwner && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-sm btn-ghost" onClick={() => onEdit && onEdit(item)}>
              ✏️ Edit
            </button>
            <button
              className="btn btn-sm"
              style={{
                background: is_available ? 'var(--warning-subtle)' : 'var(--accent-subtle)',
                color: is_available ? 'var(--warning-dark)' : 'var(--accent-dark)',
                border: `1px solid ${is_available ? 'var(--warning-border)' : 'var(--accent-border)'}`,
                fontWeight: 700,
              }}
              onClick={() => onToggle && onToggle(itemId)}
            >
              {is_available ? '⏸ Disable' : '▶ Enable'}
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => onDelete && onDelete(itemId)}>
              🗑 Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
