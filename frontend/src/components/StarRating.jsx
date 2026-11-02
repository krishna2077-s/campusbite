import React, { useState } from 'react'

export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)

  const fontSize = size === 'lg' ? '2rem' : size === 'sm' ? '1rem' : '1.4rem'

  return (
    <div className="star-rating" style={{ cursor: readOnly ? 'default' : 'pointer' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${(hovered || value) >= star ? 'filled' : 'empty'}`}
          style={{ fontSize }}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange && onChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  )
}
