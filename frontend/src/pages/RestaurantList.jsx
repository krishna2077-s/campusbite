import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRestaurants } from '../api/api'
import RestaurantCard from '../components/RestaurantCard'
import LoadingSpinner from '../components/LoadingSpinner'

const CUISINE_TYPES = [
  'All',
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'American',
  'Fast Food',
  'Pizza',
  'Biryani',
  'Desserts',
  'Beverages',
]

export default function RestaurantList() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read initial query params from search, q, name, cuisine, cuisine_type
  const initialQuery =
    searchParams.get('search') ||
    searchParams.get('q') ||
    searchParams.get('name') ||
    ''
  const initialCuisine =
    searchParams.get('cuisine') ||
    searchParams.get('cuisine_type') ||
    'All'

  const [allRestaurants, setAllRestaurants] = useState([])
  const [serverResults, setServerResults] = useState(null)
  const [search, setSearch] = useState(initialQuery)
  const [cuisine, setCuisine] = useState(initialCuisine)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const abortControllerRef = useRef(null)

  const fetchCatalog = (isRetry = false) => {
    setLoading(true)
    setError('')

    getRestaurants()
      .then((res) => {
        const data = res.data
        const list = Array.isArray(data)
          ? data
          : data.results || data.restaurants || []
        setAllRestaurants(list)
        setError('')
      })
      .catch((err) => {
        console.error('Failed to load restaurants:', err)
        if (!isRetry) {
          setError('Server is warming up... retrying automatically in 3s.')
          setTimeout(() => {
            fetchCatalog(true)
          }, 3000)
        } else {
          setError('Failed to connect to backend server. If the server is waking up, please click Retry below.')
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Fetch full restaurant catalog (with menu_items) on mount
  useEffect(() => {
    fetchCatalog(false)
  }, [])

  // Sync state if URL search parameters change externally (e.g. browser back/forward)
  useEffect(() => {
    const urlQuery =
      searchParams.get('search') ||
      searchParams.get('q') ||
      searchParams.get('name') ||
      ''
    const urlCuisine =
      searchParams.get('cuisine') ||
      searchParams.get('cuisine_type') ||
      'All'

    if (urlQuery.trim() !== search.trim()) {
      setSearch(urlQuery)
    }
    if (urlCuisine.trim().toLowerCase() !== cuisine.trim().toLowerCase()) {
      setCuisine(urlCuisine)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced synchronization of state to URL params (prevents cursor jump and space stripping)
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams()
      const trimmed = search.trim()
      if (trimmed) {
        nextParams.set('search', trimmed)
      }
      if (cuisine && cuisine.toLowerCase() !== 'all') {
        nextParams.set('cuisine', cuisine)
      }

      const currentUrlSearch = (
        searchParams.get('search') ||
        searchParams.get('q') ||
        searchParams.get('name') ||
        ''
      ).trim()
      const currentUrlCuisine = (
        searchParams.get('cuisine') ||
        searchParams.get('cuisine_type') ||
        'All'
      ).trim()

      if (trimmed !== currentUrlSearch || cuisine !== currentUrlCuisine) {
        setSearchParams(nextParams, { replace: true })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, cuisine, searchParams, setSearchParams])

  // Optional debounced server query to guarantee synchronization with backend filters
  useEffect(() => {
    const trimmed = search.trim()
    if (!trimmed && (cuisine === 'All' || !cuisine)) {
      setServerResults(null)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const timer = setTimeout(() => {
      const serverParams = {}
      if (trimmed) serverParams.search = trimmed
      if (cuisine && cuisine.toLowerCase() !== 'all') serverParams.cuisine = cuisine

      getRestaurants(serverParams, { signal: controller.signal })
        .then((res) => {
          const data = res.data
          const serverList = Array.isArray(data)
            ? data
            : data.results || data.restaurants || []
          setServerResults(serverList)
        })
        .catch((err) => {
          if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
            return
          }
          // On network glitch, fallback seamlessly to client filtering
        })
    }, 320)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search, cuisine])

  // Instant synchronous filtering (0ms latency, zero flicker, dish-aware, multi-word aware)
  const filtered = useMemo(() => {
    const source = serverResults !== null ? serverResults : allRestaurants
    let list = [...source]
    const q = search.trim().toLowerCase()
    const c = (cuisine || 'All').trim().toLowerCase()

    if (c && c !== 'all') {
      list = list.filter((r) => (r.cuisine_type || '').toLowerCase() === c)
    }

    if (q) {
      const words = q.split(/\s+/).filter(Boolean)
      list = list.filter((r) => {
        const name = (r.name || '').toLowerCase()
        const cuisineType = (r.cuisine_type || '').toLowerCase()
        const desc = (r.description || '').toLowerCase()
        const addr = (r.address || '').toLowerCase()

        // 1. Direct match on restaurant meta
        if (name.includes(q) || cuisineType.includes(q) || desc.includes(q) || addr.includes(q)) {
          return true
        }

        // 2. Dish / menu items match
        if (Array.isArray(r.menu_items)) {
          const dishMatch = r.menu_items.some((item) => {
            const iName = (item.name || '').toLowerCase()
            const iDesc = (item.description || '').toLowerCase()
            const iCat = (item.category || '').toLowerCase()
            return iName.includes(q) || iDesc.includes(q) || iCat.includes(q)
          })
          if (dishMatch) return true
        }

        // 3. Multi-word search
        if (words.length > 1) {
          const allWordsMatch = words.every((word) => {
            const inMeta = name.includes(word) || cuisineType.includes(word) || desc.includes(word) || addr.includes(word)
            const inMenu =
              Array.isArray(r.menu_items) &&
              r.menu_items.some((item) => {
                const iName = (item.name || '').toLowerCase()
                const iDesc = (item.description || '').toLowerCase()
                const iCat = (item.category || '').toLowerCase()
                return iName.includes(word) || iDesc.includes(word) || iCat.includes(word)
              })
            return inMeta || inMenu
          })
          if (allWordsMatch) return true
        }

        return false
      })
    }

    return list
  }, [allRestaurants, serverResults, search, cuisine])

  const handleSearchChange = (value) => {
    setSearch(value)
    setServerResults(null)
  }

  const handleCuisineChange = (value) => {
    setCuisine(value)
    setServerResults(null)
  }

  const handleClearFilters = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setSearch('')
    setCuisine('All')
    setServerResults(null)
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏪 Campus Restaurants</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.92rem', marginTop: 4 }}>
            Order fresh meals delivered straight to your campus location
          </p>
        </div>
        <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem', fontWeight: 600 }}>
          {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search restaurants, cuisines, addresses, or dishes (e.g. Pizza, Noodles)..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => handleSearchChange('')}
              title="Clear search"
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
        </div>
        <select
          className="form-control form-select"
          value={cuisine}
          onChange={(e) => handleCuisineChange(e.target.value)}
          style={{ width: 'auto', minWidth: 160 }}
          aria-label="Filter by cuisine"
        >
          {CUISINE_TYPES.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Cuisines' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Cuisine filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {CUISINE_TYPES.map((c) => {
          const isSelected = cuisine.toLowerCase() === c.toLowerCase()
          return (
            <button
              key={c}
              type="button"
              className="btn btn-sm"
              style={{
                background: isSelected ? 'var(--primary)' : 'var(--white)',
                color: isSelected ? 'white' : 'var(--secondary)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--gray-200)'}`,
                boxShadow: isSelected ? '0 2px 8px rgba(249, 87, 33, 0.3)' : 'var(--shadow-xs)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={() => handleCuisineChange(c)}
            >
              {c}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '12px 16px' }}>
          <div>
            <strong>⚠️ Server Connection:</strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => fetchCatalog(true)}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            🔄 Retry Connection
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Loading campus restaurants..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <h3>No restaurants found</h3>
          <p>
            {search.trim()
              ? `No eateries match "${search}". Try searching for another dish, cuisine, or clearing your filters.`
              : 'Try adjusting your cuisine filter to see available eateries.'}
          </p>
          <button className="btn btn-outline" onClick={handleClearFilters}>
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

