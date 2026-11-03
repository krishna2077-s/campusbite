import React from 'react'
import { Link } from 'react-router-dom'

const CUISINE_EMOJI = {
  indian: '🍛',
  chinese: '🍜',
  italian: '🍕',
  mexican: '🌮',
  american: '🍔',
  fast_food: '🍟',
  desserts: '🍰',
  beverages: '☕',
  pizza: '🍕',
  biryani: '🍚',
  south_indian: '🥘',
  default: '🍽️',
}

function getCuisineEmoji(cuisine = '') {
  const key = cuisine.toLowerCase().replace(/\s+/g, '_')
  return CUISINE_EMOJI[key] || CUISINE_EMOJI.default
}

export default function RestaurantCard({ restaurant }) {
  const {
    id,
    _id,
    name = 'Restaurant',
    cuisine_type = '',
    address = '',
    image,
    image_url,
    rating,
    is_open,
    is_active,
  } = restaurant

  const rid = id || _id
  const imgSrc = image || image_url
  const openStatus = is_open !== undefined ? is_open : (is_active !== undefined ? is_active : true)
  const displayRating = rating !== undefined && rating !== null ? Number(rating).toFixed(1) : '4.8'

  return (
    <div className="restaurant-card animate-slide">
      {/* Image / Placeholder */}
      <div className="restaurant-card-img">
        {imgSrc ? (
          <img src={imgSrc} alt={name} />
        ) : (
          <span>{getCuisineEmoji(cuisine_type)}</span>
        )}
      </div>

      <div className="restaurant-card-body">
        {/* Status badge & Cuisine */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="restaurant-card-cuisine">{cuisine_type || 'Campus Dine'}</span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: openStatus ? 'var(--accent-subtle)' : 'var(--danger-subtle)',
            color: openStatus ? 'var(--accent-dark)' : 'var(--danger-dark)',
            border: `1px solid ${openStatus ? 'var(--accent-border)' : 'var(--danger-border)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            letterSpacing: '0.5px',
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: openStatus ? 'var(--accent)' : 'var(--danger)',
            }} />
            {openStatus ? 'OPEN' : 'CLOSED'}
          </span>
        </div>

        <h3 className="restaurant-card-name">{name}</h3>

        {/* Rating row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--warning-subtle)',
            border: '1px solid var(--warning-border)',
            padding: '2px 8px',
            borderRadius: '6px',
          }}>
            <span style={{ color: 'var(--warning-dark)', fontSize: '0.85rem' }}>★</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--warning-dark)' }}>{displayRating}</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>• 20-30 mins delivery</span>
        </div>

        {address && (
          <p className="restaurant-card-address">
            <span>📍</span> {address}
          </p>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 6 }}>
          <Link to={`/restaurants/${rid}`} className="btn btn-primary w-full">
            View Menu & Order →
          </Link>
        </div>
      </div>
    </div>
  )
}
