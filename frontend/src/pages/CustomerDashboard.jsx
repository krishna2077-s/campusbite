import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getOrders, updateOrderStatus, getPayments, submitReview, requestRefund } from '../api/api'
import OrderCard from '../components/OrderCard'
import LoadingSpinner from '../components/LoadingSpinner'
import StarRating from '../components/StarRating'

const STATUS_FILTERS = ['All', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const ORDER_TIMELINE = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED']

function getTimelineIndex(status) {
  return ORDER_TIMELINE.indexOf(status)
}

export default function CustomerDashboard() {
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('orders')
  const [error, setError] = useState('')

  // Review Modal
  const [reviewOrder, setReviewOrder] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  // Refund Modal
  const [refundOrder, setRefundOrder] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)

  const fetchOrders = useCallback(() => {
    setLoading(true)
    getOrders()
      .then((res) => {
        const data = res.data
        const list = Array.isArray(data) ? data : data.orders || data.results || []
        setOrders(list)
      })
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  const fetchPayments = useCallback(() => {
    getPayments()
      .then((res) => {
        const data = res.data
        setPayments(Array.isArray(data) ? data : data.payments || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchPayments()
  }, [fetchOrders, fetchPayments])

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return
    try {
      await updateOrderStatus(orderId, { status: 'CANCELLED' })
      fetchOrders()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to cancel order')
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewOrder) return
    setReviewLoading(true)
    try {
      await submitReview({
        order_id: reviewOrder.id || reviewOrder._id,
        restaurant_id: reviewOrder.restaurant?.id || reviewOrder.restaurant_id,
        rating: reviewRating,
        comment: reviewComment,
      })
      setReviewOrder(null)
      setReviewRating(5)
      setReviewComment('')
      alert('Review submitted! Thank you.')
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to submit review')
    } finally {
      setReviewLoading(false)
    }
  }

  const handleSubmitRefund = async () => {
    if (!refundOrder || !refundReason.trim()) {
      alert('Please provide a reason for the refund')
      return
    }
    setRefundLoading(true)
    try {
      await requestRefund({
        order_id: refundOrder.id || refundOrder._id,
        reason: refundReason.trim(),
      })
      setRefundOrder(null)
      setRefundReason('')
      fetchOrders()
      alert('Refund request submitted!')
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to submit refund request')
    } finally {
      setRefundLoading(false)
    }
  }

  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter(o => o.status === statusFilter)

  const totalSpend = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0)

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">📦 My Dashboard</h1>
        <Link to="/ai-insights" className="btn btn-primary">
          🤖 AI Insights
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-3">
        <div className="stat-card primary">
          <div className="stat-card-icon">📦</div>
          <div className="stat-card-value">{orders.length}</div>
          <div className="stat-card-label">Total Orders</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-value">{orders.filter(o => o.status === 'DELIVERED').length}</div>
          <div className="stat-card-label">Delivered</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-value">
            {orders.filter(o => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length}
          </div>
          <div className="stat-card-label">Active Orders</div>
        </div>
        <div className="stat-card info">
          <div className="stat-card-icon">💰</div>
          <div className="stat-card-value">₹{totalSpend.toFixed(0)}</div>
          <div className="stat-card-label">Total Spent</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['orders', '📦 My Orders'], ['payments', '💳 Payments']].map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                className="btn btn-sm"
                style={{
                  background: statusFilter === s ? 'var(--primary)' : 'var(--white)',
                  color: statusFilter === s ? 'white' : 'var(--secondary)',
                  border: `1px solid ${statusFilter === s ? 'var(--primary)' : 'var(--gray-200)'}`,
                }}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <LoadingSpinner text="Loading orders..." />
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📦</span>
              <h3>No orders found</h3>
              <p>
                {statusFilter === 'All'
                  ? "You haven't placed any orders yet"
                  : `No orders with status: ${statusFilter}`}
              </p>
              <Link to="/restaurants" className="btn btn-primary">Order Now</Link>
            </div>
          ) : (
            <div>
              {filteredOrders.map(order => (
                <div key={order.id || order._id}>
                  {/* Order Timeline */}
                  {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 6,
                      overflowX: 'auto',
                      paddingBottom: 4,
                    }}>
                      {ORDER_TIMELINE.map((step, i) => {
                        const current = getTimelineIndex(order.status)
                        const isDone = i < current
                        const isActive = i === current
                        return (
                          <React.Fragment key={step}>
                            <div style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              whiteSpace: 'nowrap',
                              background: isDone ? 'var(--accent-subtle)' : isActive ? 'var(--primary-subtle)' : 'var(--gray-100)',
                              color: isDone ? 'var(--accent-dark)' : isActive ? 'var(--primary-dark)' : 'var(--gray-500)',
                              border: `1px solid ${isDone ? 'var(--accent-border)' : isActive ? 'var(--primary-border)' : 'var(--gray-200)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              {isDone ? '✓ ' : isActive ? '● ' : ''}{step.replace(/_/g, ' ')}
                            </div>
                            {i < ORDER_TIMELINE.length - 1 && (
                              <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem', fontWeight: 700 }}>→</span>
                            )}
                          </React.Fragment>
                        )
                      })}

                    </div>
                  )}
                  <OrderCard
                    order={order}
                    onCancel={handleCancel}
                    onReview={setReviewOrder}
                    onRefund={setRefundOrder}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'payments' && (
        <div>
          {payments.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">💳</span>
              <h3>No payment history</h3>
              <p>Your payment records will appear here</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                      {['Date', 'Order', 'Amount', 'Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: 'var(--gray-600)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                          #{String(p.order_id || p.id || '').slice(-8).toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700 }}>
                          ₹{Number(p.amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge badge-${p.status || 'PAID'}`}>
                            {p.status || 'PAID'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <div className="modal-overlay" onClick={() => setReviewOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⭐ Write a Review</h3>
              <button className="modal-close" onClick={() => setReviewOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>
                How was your experience with order #{String(reviewOrder.id || reviewOrder._id || '').slice(-8).toUpperCase()}?
              </p>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="form-control"
                  placeholder="Share your experience..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setReviewOrder(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitReview} disabled={reviewLoading}>
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundOrder && (
        <div className="modal-overlay" onClick={() => setRefundOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">💰 Request Refund</h3>
              <button className="modal-close" onClick={() => setRefundOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>
                Order #{String(refundOrder.id || refundOrder._id || '').slice(-8).toUpperCase()} — ₹{Number(refundOrder.total_amount || refundOrder.total || 0).toFixed(2)}
              </p>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Reason for Refund *</label>
                <textarea
                  className="form-control"
                  placeholder="Explain why you're requesting a refund..."
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRefundOrder(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitRefund} disabled={refundLoading}>
                {refundLoading ? 'Submitting...' : 'Request Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
