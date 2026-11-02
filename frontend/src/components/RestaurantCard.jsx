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
    rating,
    is_open,
  } = restaurant

  const rid = id || _id

  return (
    <div className="restaurant-card animate-slide">
      {/* Image / Placeholder */}
      <div className="restaurant-card-img">
        {image ? (
          <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '3.5rem' }}>{getCuisineEmoji(cuisine_type)}</span>
        )}
      </div>

      <div className="restaurant-card-body">
        {/* Status badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="restaurant-card-cuisine">{cuisine_type || 'Restaurant'}</span>
          {is_open !== undefined && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              background: is_open ? '#dcfce7' : '#fee2e2',
              color: is_open ? '#15803d' : '#b91c1c',
            }}>
              {is_open ? 'OPEN' : 'CLOSED'}
            </span>
          )}
        </div>

        <h3 className="restaurant-card-name">{name}</h3>

        {rating !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>★</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{Number(rating).toFixed(1)}</span>
          </div>
        )}

        {address && (
          <p className="restaurant-card-address">
            <span>📍</span> {address}
          </p>
        )}

        <Link to={`/restaurants/${rid}`} className="btn btn-primary w-full" style={{ marginTop: 4 }}>
          View Menu
        </Link>
      </div>
    </div>
  )
}
