import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/api'

const ROLES = [
  { value: 'customer', label: '🛒 Customer', desc: 'Browse campus eateries, customize orders, and get food delivered.' },
  { value: 'owner', label: '🏪 Restaurant Owner', desc: 'Manage menus, accept orders, track revenue, and assign deliveries.' },
  { value: 'delivery', label: '🏍 Delivery Partner', desc: 'Pick up orders and deliver fresh meals across campus buildings.' },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    role: 'customer',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Full name is required'
    else if (form.full_name.trim().length < 2) errs.full_name = 'Name must be at least 2 characters'
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (!form.confirm_password) errs.confirm_password = 'Please confirm your password'
    else if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match'
    if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number'
    return errs
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setSuccess('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const roleMap = {
        customer: 'customer',
        owner: 'restaurant_owner',
        delivery: 'delivery_partner',
      }
      const mappedRole = roleMap[form.role] || form.role

      const payload = {
        full_name: form.full_name.trim(),
        name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        role: mappedRole,
        user_type: mappedRole,
      }
      await register(payload)
      setSuccess('🎉 Account created successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Registration failed. Please check your inputs and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="logo-icon">🍕</div>
          <h1>Campus<span>Bite</span></h1>
          <p>Create your campus dining account</p>
        </div>

        {apiError && (
          <div className="alert alert-error">
            <span>⚠️</span> {apiError}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <span>✅</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="full_name"
              className={`form-control ${errors.full_name ? 'error' : ''}`}
              placeholder="e.g. Alex Johnson"
              value={form.full_name}
              onChange={handleChange}
              autoComplete="name"
            />
            {errors.full_name && <span className="form-error">⚠ {errors.full_name}</span>}
          </div>

          <div className="form-row">
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
              <label className="form-label">Phone (optional)</label>
              <input
                type="tel"
                name="phone"
                className={`form-control ${errors.phone ? 'error' : ''}`}
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
              {errors.phone && <span className="form-error">⚠ {errors.phone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <span className="form-error">⚠ {errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                className={`form-control ${errors.confirm_password ? 'error' : ''}`}
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirm_password && <span className="form-error">⚠ {errors.confirm_password}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Your Role</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLES.map((r) => (
                <label key={r.value} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  border: `2px solid ${form.role === r.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: form.role === r.value ? 'var(--primary-subtle)' : 'var(--white)',
                  transition: 'var(--transition)',
                  boxShadow: form.role === r.value ? '0 0 0 1px var(--primary-border)' : 'none',
                }}>
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={handleChange}
                    style={{ accentColor: 'var(--primary)', marginTop: 3 }}
                  />
                  <div>
                    <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--secondary)', display: 'block' }}>
                      {r.label}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)', lineHeight: 1.4 }}>
                      {r.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? '⏳ Creating account...' : '🚀 Create CampusBite Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 800, color: 'var(--primary)' }}>Sign in here</Link>
        </div>
      </div>
    </div>
  )
}
