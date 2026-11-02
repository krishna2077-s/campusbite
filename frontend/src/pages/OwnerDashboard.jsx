import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getRestaurantStats, getOrders, getReminders } from '../api/api'
import OrderCard from '../components/OrderCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, ordersRes] = await Promise.all([
        getRestaurantStats().catch(() => ({ data: {} })),
        getOrders({ limit: 10 }).catch(() => ({ data: [] })),
      ])
      const sData = statsRes.data || {}
      setStats(sData)
      const oData = ordersRes.data
      const oList = Array.isArray(oData) ? oData : oData.orders || oData.results || []
      setRecentOrders(oList.slice(0, 10))

      // Reminders
      getReminders()
        .then(r => {
          const rd = r.data
          setReminders(Array.isArray(rd) ? rd : rd.reminders || [])
        })
        .catch(() => {})
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">🏪 Owner Dashboard</h1>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll}>🔄 Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats */}
      <div className="stats-grid mb-3">
        <div className="stat-card primary">
          <div className="stat-card-icon">📦</div>
          <div className="stat-card-value">{stats?.total_orders ?? '—'}</div>
          <div className="stat-card-label">Total Orders</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-card-icon">💰</div>
          <div className="stat-card-value">₹{stats?.total_revenue ? Number(stats.total_revenue).toFixed(0) : '—'}</div>
          <div className="stat-card-label">Total Revenue</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-value">{stats?.pending_orders ?? recentOrders.filter(o => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status)).length}</div>
          <div className="stat-card-label">Pending Orders</div>
        </div>
        <div className="stat-card info">
          <div className="stat-card-icon">🍽️</div>
          <div className="stat-card-value">{stats?.menu_items ?? '—'}</div>
          <div className="stat-card-label">Menu Items</div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link to="/dashboard/owner/menu" className="btn btn-primary">
          🍽️ Manage Menu
        </Link>
        <Link to="/dashboard/owner/orders" className="btn btn-secondary">
          📦 Manage Orders
        </Link>
      </div>

      <div className="dashboard-layout">
        {/* Recent Orders */}
        <div>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Recent Orders</h2>
            <Link to="/dashboard/owner/orders" style={{ fontSize: '0.85rem' }}>View All →</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📦</span>
              <h3>No orders yet</h3>
              <p>Orders from customers will appear here</p>
            </div>
          ) : (
            recentOrders.map(order => (
              <OrderCard
                key={order.id || order._id}
                order={order}
                showCustomer
              />
            ))
          )}
        </div>

        {/* Reminders Sidebar */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>⏰ Reminders</h2>
          {reminders.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 28 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.88rem' }}>
                  No pending reminders!
                </p>
              </div>
            </div>
          ) : (
            reminders.map((r, i) => (
              <div key={i} className="reminder-banner">
                <span className="reminder-icon">⚠️</span>
                <div className="reminder-text">
                  <strong>Order #{String(r.order_id || r.id || '').slice(-8).toUpperCase()} is stale</strong>
                  <span>Waiting for {r.minutes_waiting || '15+'} minutes — please update status</span>
                </div>
              </div>
            ))
          )}

          {/* Today's Summary */}
          {stats?.today && (
            <div className="card mt-2">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>📊 Today's Summary</h3>
              </div>
              <div className="card-body">
                <div className="cart-summary-row">
                  <span>Orders Today</span>
                  <strong>{stats.today.orders || 0}</strong>
                </div>
                <div className="cart-summary-row">
                  <span>Revenue Today</span>
                  <strong>₹{Number(stats.today.revenue || 0).toFixed(0)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
