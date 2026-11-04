import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRestaurants } from '../api/api'
import RestaurantCard from '../components/RestaurantCard'
import LoadingSpinner from '../components/LoadingSpinner'

const FEATURES = [
  { icon: '🍔', title: 'Curated Campus Eateries', desc: 'Browse fresh menus from verified campus kitchens, cafes, and dining halls in one spot.' },
  { icon: '⚡', title: 'Lightning Dorm Delivery', desc: 'Real-time order tracking delivered directly to your dorm room, library, or faculty center.' },
  { icon: '🤖', title: 'AI-Powered Insights', desc: 'Natural language analysis grounded on your order history and weekly spending patterns.' },
  { icon: '💳', title: 'Frictionless Mock Checkout', desc: 'Instant dummy payments with transparent ledger records and customer refund dispute workflows.' },
]

const QUICK_SEARCH_TAGS = ['Pizza', 'Chinese', 'Indian', 'Fast Food', 'Beverages', 'Desserts']

export default function Home() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let attempts = 0
    const load = () => {
      getRestaurants()
        .then((res) => {
          const data = res.data
          const list = Array.isArray(data) ? data : data.results || data.restaurants || []
          setRestaurants(list)
        })
        .catch(() => {
          if (attempts < 1) {
            attempts++
            setTimeout(load, 3000)
          } else {
            setRestaurants([])
          }
        })
        .finally(() => setLoading(false))
    }
    load()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      navigate(`/restaurants?search=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/restaurants')
    }
  }

  const handleTagClick = (tag) => {
    navigate(`/restaurants?cuisine=${encodeURIComponent(tag)}`)
  }

  // Live filter featured restaurants if user types on the home page (including dish matches)
  const displayedFeatured = useMemo(() => {
    if (!searchQuery.trim()) {
      return restaurants.slice(0, 4)
    }
    const q = searchQuery.toLowerCase().trim()
    const words = q.split(/\s+/).filter(Boolean)

    return restaurants.filter((r) => {
      const name = (r.name || '').toLowerCase()
      const cuisine = (r.cuisine_type || '').toLowerCase()
      const desc = (r.description || '').toLowerCase()
      const addr = (r.address || '').toLowerCase()

      // Direct metadata match
      if (name.includes(q) || cuisine.includes(q) || desc.includes(q) || addr.includes(q)) {
        return true
      }

      // Dish menu item match
      if (Array.isArray(r.menu_items)) {
        const dishMatch = r.menu_items.some(
          (m) =>
            (m.name || '').toLowerCase().includes(q) ||
            (m.category || '').toLowerCase().includes(q) ||
            (m.description || '').toLowerCase().includes(q)
        )
        if (dishMatch) return true
      }

      // Multi-word match across restaurant fields and dish items
      if (words.length > 1) {
        return words.every((word) => {
          const inMeta = name.includes(word) || cuisine.includes(word) || desc.includes(word) || addr.includes(word)
          const inMenu =
            Array.isArray(r.menu_items) &&
            r.menu_items.some(
              (m) =>
                (m.name || '').toLowerCase().includes(word) ||
                (m.category || '').toLowerCase().includes(word) ||
                (m.description || '').toLowerCase().includes(word)
            )
          return inMeta || inMenu
        })
      }

      return false
    })
  }, [restaurants, searchQuery])

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-emoji">🍕</span>
          <h1>
            Hungry on <span>Campus</span>?
          </h1>
          <p>
            Discover and order from your favorite campus restaurants.
            Ultra-fast dorm delivery, seamless mock payments, and AI-powered dining analytics.
          </p>

          {/* Prominent Search Bar */}
          <div className="hero-search-box">
            <form onSubmit={handleSearchSubmit} className="hero-search-form">
              <div className="hero-search-input-wrapper">
                <span className="hero-search-icon">🔍</span>
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="Search campus eateries, cuisines, or favorite dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search restaurants"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="hero-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                    aria-label="Clear search input"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-primary hero-search-submit">
                Find Eateries
              </button>
            </form>
          </div>

          {/* Quick Search Cuisines */}
          <div className="hero-quick-tags">
            <span className="hero-tag-label">Popular:</span>
            {QUICK_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="hero-tag-pill"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="hero-actions">
            <Link to="/restaurants" className="btn btn-primary btn-lg">
              🍽️ Browse All Restaurants
            </Link>
            <Link to="/register" className="btn btn-lg" style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: 'white',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
            }}>
              🚀 Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="section-heading">
            <h2>Why choose <span className="text-primary">CampusBite</span>?</h2>
            <p>Everything you need for an elevated, stress-free campus dining experience</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="section-heading">
            <h2>{searchQuery.trim() ? `Search Results for "${searchQuery}"` : 'Featured Eateries'}</h2>
            <p>
              {searchQuery.trim()
                ? `Showing campus eateries matching your search query`
                : 'Fresh picks from campus kitchens ready to serve hot and delicious meals'}
            </p>
          </div>

          {loading ? (
            <LoadingSpinner text="Fetching campus restaurants..." />
          ) : displayedFeatured.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🔍</span>
              <h3>{searchQuery.trim() ? 'No matching restaurants found' : 'No restaurants registered yet'}</h3>
              <p>
                {searchQuery.trim()
                  ? `No campus eateries matched "${searchQuery}". Try a different dish or view the full restaurant directory.`
                  : 'Sign up as an owner to register your campus eatery and publish your menu!'}
              </p>
              <Link to="/restaurants" className="btn btn-primary">
                Browse Full Directory
              </Link>
            </div>
          ) : (
            <div className="grid grid-auto">
              {displayedFeatured.map((r) => (
                <RestaurantCard key={r.id || r._id} restaurant={r} />
              ))}
            </div>
          )}

          {displayedFeatured.length > 0 && (
            <div className="text-center mt-4">
              <Link
                to={searchQuery.trim() ? `/restaurants?search=${encodeURIComponent(searchQuery.trim())}` : '/restaurants'}
                className="btn btn-outline btn-lg"
              >
                {searchQuery.trim()
                  ? `View All Results for "${searchQuery}" in Directory →`
                  : 'Explore All Campus Eateries →'}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '70px 24px',
        textAlign: 'center',
        color: 'white',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div className="container">
          <h2 style={{ color: 'white', marginBottom: 14, fontSize: '2.2rem', fontWeight: 900 }}>
            Ready to taste the best on campus?
          </h2>
          <p style={{ color: '#cbd5e1', marginBottom: 30, maxWidth: 480, margin: '0 auto 30px', fontSize: '1.05rem' }}>
            Join hundreds of students, faculty, and restaurant owners enjoying seamless campus food delivery.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Sign Up Free Today
            </Link>
            <Link to="/restaurants" className="btn btn-ghost btn-lg" style={{
              background: 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
            }}>
              Browse Menus
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#020617',
        color: 'var(--gray-400)',
        padding: '36px 24px',
        textAlign: 'center',
        fontSize: '0.9rem',
      }}>
        <div className="container">
          <p style={{ margin: '0 0 10px', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
            🍕 CampusBite
          </p>
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.86rem' }}>
            Full-Stack Campus Food Ordering & Delivery Platform &bull; FastAPI + React 18 + SQLite + OpenAI
          </p>
        </div>
      </footer>
    </div>
  )
}
