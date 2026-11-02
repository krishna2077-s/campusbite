import React, { useEffect, useState, useCallback } from 'react'
import { getRestaurants } from '../api/api'
import RestaurantCard from '../components/RestaurantCard'
import LoadingSpinner from '../components/LoadingSpinner'

const CUISINE_TYPES = ['All', 'Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Fast Food', 'Pizza', 'Biryani', 'Desserts', 'Beverages']

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [cuisine, setCuisine] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getRestaurants()
      .then((res) => {
        const data = res.data
        const list = Array.isArray(data) ? data : data.results || data.restaurants || []
        setRestaurants(list)
        setFiltered(list)
      })
      .catch(() => setError('Failed to load restaurants. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const applyFilters = useCallback(() => {
    let list = [...restaurants]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.cuisine_type?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q)
      )
    }
    if (cuisine !== 'All') {
      list = list.filter(r =>
        r.cuisine_type?.toLowerCase() === cuisine.toLowerCase()
      )
    }
    setFiltered(list)
  }, [restaurants, search, cuisine])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">🏪 All Restaurants</h1>
        <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
          {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Search & Filter */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search restaurants, cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control form-select"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          style={{ width: 'auto', minWidth: 160 }}
        >
          {CUISINE_TYPES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Cuisine filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {CUISINE_TYPES.map(c => (
          <button
            key={c}
            className="btn btn-sm"
            style={{
              background: cuisine === c ? 'var(--primary)' : 'var(--white)',
              color: cuisine === c ? 'white' : 'var(--secondary)',
              border: `1px solid ${cuisine === c ? 'var(--primary)' : 'var(--gray-200)'}`,
            }}
            onClick={() => setCuisine(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner text="Loading restaurants..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <h3>No restaurants found</h3>
          <p>Try adjusting your search or filter</p>
          <button className="btn btn-outline" onClick={() => { setSearch(''); setCuisine('All') }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-auto">
          {filtered.map((r) => (
            <RestaurantCard key={r.id || r._id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  )
}
