import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRestaurants } from '../api/api'
import RestaurantCard from '../components/RestaurantCard'
import LoadingSpinner from '../components/LoadingSpinner'

const FEATURES = [
  { icon: '🍔', title: 'Wide Selection', desc: 'Browse menus from all campus restaurants in one place' },
  { icon: '⚡', title: 'Fast Delivery', desc: 'Your food delivered right to your dorm or classroom' },
  { icon: '🤖', title: 'AI Insights', desc: 'Smart analytics about your ordering habits' },
  { icon: '💳', title: 'Easy Payments', desc: 'Secure and seamless payment processing' },
]

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRestaurants()
      .then((res) => {
        const data = res.data
        const list = Array.isArray(data) ? data : data.results || data.restaurants || []
        setFeatured(list.slice(0, 4))
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false))
  }, [])

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
            Discover and order from your favourite campus restaurants.
            Fast delivery, easy payments, and AI-powered insights.
          </p>
          <div className="hero-actions">
            <Link to="/restaurants" className="btn btn-primary btn-lg">
              🍽️ Browse Restaurants
            </Link>
            <Link to="/register" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
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
            <p>Everything you need for the perfect campus dining experience</p>
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
            <h2>Featured Restaurants</h2>
            <p>Fresh picks from campus kitchens ready to serve you</p>
          </div>

          {loading ? (
            <LoadingSpinner text="Fetching restaurants..." />
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🏪</span>
              <h3>No restaurants yet</h3>
              <p>Check back soon — campus restaurants are joining!</p>
              <Link to="/restaurants" className="btn btn-primary">Browse All</Link>
            </div>
          ) : (
            <div className="grid grid-auto">
              {featured.map((r) => (
                <RestaurantCard key={r.id || r._id} restaurant={r} />
              ))}
            </div>
          )}

          {featured.length > 0 && (
            <div className="text-center mt-3">
              <Link to="/restaurants" className="btn btn-outline">
                View All Restaurants →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'white',
      }}>
        <div className="container">
          <h2 style={{ color: 'white', marginBottom: 12 }}>Ready to order?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
            Join thousands of campus students already using CampusBite
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-lg" style={{
              background: 'white',
              color: 'var(--primary)',
              border: 'none',
              fontWeight: 700,
            }}>
              Sign Up Free
            </Link>
            <Link to="/restaurants" className="btn btn-lg" style={{
              background: 'transparent',
              border: '2px solid white',
              color: 'white',
            }}>
              Browse Restaurants
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--secondary)',
        color: 'var(--gray-400)',
        padding: '28px 20px',
        textAlign: 'center',
        fontSize: '0.88rem',
      }}>
        <p style={{ margin: 0 }}>
          🍕 <strong style={{ color: 'white' }}>CampusBite</strong> — Campus Food Ordering Platform
          &nbsp;|&nbsp; Built with ❤️ for students
        </p>
      </footer>
    </div>
  )
}
