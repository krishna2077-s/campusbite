import React, { useEffect, useState, useCallback } from 'react'
import { getDeliveryOrders, updateDeliveryStatus } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_TRANSITIONS = {
  ASSIGNED: { next: 'OUT_FOR_DELIVERY', label: '🏍 Pick Up & Start Delivery', btnClass: 'btn-primary' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: '✅ Mark as Delivered', btnClass: 'btn-success' },
  DELIVERED: { next: null, label: 'Delivered', btnClass: 'btn-ghost' },
}

const STATUS_FILTERS = ['All', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED']

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [updating, setUpdating] = useState(null)

  const fetchOrders = useCallback(() => {
    setLoading(true)
    getDeliveryOrders()
      .then((res) => {
        const data = res.data
        setOrders(Array.isArray(data) ? data : data.orders || data.results || [])
      })
      .catch(() => setError('Failed to load delivery orders.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await updateDeliveryStatus(orderId, { status: newStatus })
      fetchOrders()
    } catch (e) {
      alert(e.response?.data?.detail || `Failed to update status to ${newStatus}`)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = statusFilter === 'All'
    ? orders
    : orders.filter(o => o.status === statusFilter)

  const activeCount = orders.filter(o => ['ASSIGNED', 'OUT_FOR_DELIVERY'].includes(o.status)).length
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">🏍 Delivery Dashboard</h1>
        <button className="btn btn-ghost btn-sm" onClick={fetchOrders}>🔄 Refresh</button>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card warning">
          <div className="stat-card-icon">📦</div>
          <div className="stat-card-value">{activeCount}</div>
          <div className="stat-card-label">Active Deliveries</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-value">{deliveredCount}</div>
          <div className="stat-card-label">Delivered</div>
        </div>
        <div className="stat-card info">
          <div className="stat-card-icon">📋</div>
          <div className="stat-card-value">{orders.length}</div>
          <div className="stat-card-label">Total Assigned</div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            className={`tab-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'All' ? `All (${orders.length})` : `${s.replace(/_/g, ' ')} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner text="Loading delivery orders..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🏍</span>
          <h3>No orders found</h3>
          <p>
            {statusFilter === 'All'
              ? 'You have no assigned deliveries yet'
              : `No orders with status: ${statusFilter.replace(/_/g, ' ')}`}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map(order => {
            const { next, label, btnClass } = STATUS_TRANSITIONS[order.status] || {}
            const orderId = order.id || order._id
            const isUpdating = updating === orderId

            return (
              <div key={orderId} className="order-card animate-fade">
                <div className="order-card-header">
                  <div>
                    <div className="order-id">Order #{String(orderId).slice(-8).toUpperCase()}</div>
                    <div className="order-date">{formatDate(order.created_at)}</div>
                  </div>
                  <span className={`badge badge-${order.status}`}>
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="order-card-body">
                  {/* Restaurant */}
                  {order.restaurant && (
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🏪</span>
                      <strong style={{ fontSize: '0.92rem' }}>
                        {order.restaurant?.name || order.restaurant}
                      </strong>
                    </div>
                  )}

                  {/* Customer & Delivery Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontWeight: 700, marginBottom: 4 }}>CUSTOMER</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        {order.customer?.name || order.customer?.full_name || 'Customer'}
                      </div>
                      {order.customer?.phone && (
                        <a href={`tel:${order.customer.phone}`} style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
                          📱 {order.customer.phone}
                        </a>
                      )}
                    </div>

                    <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontWeight: 700, marginBottom: 4 }}>DELIVER TO</div>
                      <div style={{ fontSize: '0.85rem' }}>
                        📍 {order.delivery_address || 'Address not provided'}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 700, marginBottom: 6 }}>ITEMS</div>
                    {(order.items || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '3px 0', borderBottom: '1px dashed var(--gray-200)' }}>
                        <span>{item.name} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', paddingTop: 8, borderTop: '2px solid var(--gray-200)' }}>
                    <span>Total</span>
                    <span>₹{Number(order.total_amount || order.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="order-card-footer">
                  {next && (
                    <button
                      className={`btn ${btnClass}`}
                      onClick={() => handleUpdateStatus(orderId, next)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? '⏳ Updating...' : label}
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                      ✅ Delivery Complete
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
