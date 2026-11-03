import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/api'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student@campusbite.com', password: 'password123', icon: '🧑‍🎓' },
  { role: 'Owner', email: 'owner@campusbite.com', password: 'password123', icon: '👨‍🍳' },
  { role: 'Delivery', email: 'delivery@campusbite.com', password: 'password123', icon: '🛵' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 4) errs.password = 'Password too short'
    return errs
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleFillDemo = (demo) => {
    setForm({ email: demo.email, password: demo.password })
    setErrors({})
    setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await login(form.email, form.password)
      const { token, access_token, user, role } = res.data

      const jwt = token || access_token
      const userData = user || res.data

      authLogin(jwt, userData)

      // Redirect based on role
      const userRole = (userData?.role || userData?.user_type || role || '').toLowerCase()
      if (userRole === 'owner' || userRole === 'restaurant_owner') {
        navigate('/dashboard/owner')
      } else if (userRole === 'delivery' || userRole === 'delivery_partner') {
        navigate('/dashboard/delivery')
      } else {
        navigate('/restaurants')
      }
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Invalid credentials. Please check your email and password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">🍕</div>
          <h1>Campus<span>Bite</span></h1>
          <p>Sign in to your campus food account</p>
        </div>

        {/* Quick Demo Credentials Helper */}
        <div className="demo-credentials-box">
          <div className="demo-credentials-title">
            <span>⚡</span> Quick Demo Sign-In (Click to Fill)
          </div>
          <div className="demo-btns-grid">
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.role}
                type="button"
                className="demo-role-btn"
                onClick={() => handleFillDemo(demo)}
                title={`Fill ${demo.role} demo credentials`}
              >
                {demo.icon} {demo.role}
              </button>
            ))}
          </div>
        </div>

        {apiError && (
          <div className="alert alert-error">
            <span>⚠️</span> {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder="you@campusbite.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">⚠ {errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error">⚠ {errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔐 Sign In to CampusBite'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 800, color: 'var(--primary)' }}>Create one free</Link>
        </div>
      </div>
    </div>
  )
}
