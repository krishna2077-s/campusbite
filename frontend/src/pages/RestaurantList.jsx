import React, { useEffect, useState, useCallback, useRef } from 'react'
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

  const [restaurants, setRestaurants] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState(initialQuery)
  const [cuisine, setCuisine] = useState(initialCuisine)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

    setSearch(urlQuery)
    setCuisine(urlCuisine)
  }, [searchParams])

  // Helper to synchronize active search & cuisine into URL query string
  const syncUrlParams = useCallback(
    (newSearch, newCuisine) => {
      const nextParams = new URLSearchParams()
      const trimmed = (newSearch || '').trim()
      if (trimmed) {
        nextParams.set('search', trimmed)
      }
      if (newCuisine && newCuisine !== 'All') {
        nextParams.set('cuisine', newCuisine)
      }
      setSearchParams(nextParams, { replace: true })
    },
    [setSearchParams]
  )

  // Fetch full restaurant list on mount (and server fallback if direct link with search)
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    // Load initial list with any initial query params
    const initialParams = {}
    if (initialQuery.trim()) {
      initialParams.search = initialQuery.trim()
      initialParams.q = initialQuery.trim()
    }
    if (initialCuisine && initialCuisine !== 'All') {
      initialParams.cuisine = initialCuisine
    }

    getRestaurants(Object.keys(initialParams).length > 0 ? initialParams : undefined)
      .then((res) => {
        if (!isMounted) return
        const data = res.data
        const list = Array.isArray(data)
          ? data
          : data.results || data.restaurants || []
        setRestaurants(list)
        setFiltered(list)
      })
      .catch(() => {
        if (!isMounted) return
        setError('Failed to load restaurants. Please try again.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    // Also fetch all restaurants in background if initial query was specific, so client-side filter is instant
    if (initialQuery.trim() || (initialCuisine && initialCuisine !== 'All')) {
      getRestaurants()
        .then((res) => {
          if (!isMounted) return
          const data = res.data
          const allList = Array.isArray(data)
            ? data
            : data.results || data.restaurants || []
          setRestaurants(allList)
        })
        .catch(() => {})
    }

    return () => {
      isMounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filtering function (instant 0ms feedback)
  const applyClientFilter = useCallback((baseList, queryStr, cuisineStr) => {
    let list = [...baseList]
    const q = (queryStr || '').trim().toLowerCase()
    const c = (cuisineStr || 'All').trim().toLowerCase()

    if (q) {
      list = list.filter((r) => {
        const nameMatch = r.name?.toLowerCase().includes(q)
        const cuisineMatch = r.cuisine_type?.toLowerCase().includes(q)
        const addressMatch = r.address?.toLowerCase().includes(q)
        const descMatch = r.description?.toLowerCase().includes(q)
        return nameMatch || cuisineMatch || addressMatch || descMatch
      })
    }

    if (c && c !== 'all') {
      list = list.filter(
        (r) => r.cuisine_type?.toLowerCase() === c
      )
    }

    return list
  }, [])

  // Run instant client-side filter whenever search, cuisine, or restaurants change
  useEffect(() => {
    const instantList = applyClientFilter(restaurants, search, cuisine)
    setFiltered(instantList)
  }, [restaurants, search, cuisine, applyClientFilter])

  // Debounced server-side query to enrich results (e.g. matching specific dish items across restaurants)
  const debounceRef = useRef(null)

  useEffect(() => {
    const trimmed = search.trim()
    if (!trimmed && cuisine === 'All') return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const serverParams = {}
      if (trimmed) {
        serverParams.search = trimmed
        serverParams.q = trimmed
      }
      if (cuisine && cuisine !== 'All') {
        serverParams.cuisine = cuisine
      }

      getRestaurants(serverParams)
        .then((res) => {
          const data = res.data
          const serverList = Array.isArray(data)
            ? data
            : data.results || data.restaurants || []
          if (serverList.length > 0) {
            setFiltered(serverList)
          } else if (trimmed) {
            // Server confirmed 0 matches for this specific search term
            setFiltered([])
          }
        })
        .catch(() => {
          // Keep current client-filtered results on network glitch
        })
    }, 280)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, cuisine])

  const handleSearchChange = (value) => {
    setSearch(value)
    syncUrlParams(value, cuisine)
  }

  const handleCuisineChange = (value) => {
    setCuisine(value)
    syncUrlParams(search, value)
  }

  const handleClearFilters = () => {
    setSearch('')
    setCuisine('All')
    syncUrlParams('', 'All')
    setFiltered(restaurants)
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

      {error && <div className="alert alert-error">{error}</div>}

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

