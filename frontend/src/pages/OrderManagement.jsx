import React, { useEffect, useState, useCallback } from 'react'
import { getOrders, updateOrderStatus, getRefunds, updateRefund, getDeliveryPartners } from '../api/api'
import OrderCard from '../components/OrderCard'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_FILTERS = ['All', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
const PAGE_SIZE = 10

const DEFAULT_DELIVERY_PARTNERS = [
  { id: 3, name: 'Ravi Kumar (Campus Fleet)' },
]

export default function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [deliveryPartners, setDeliveryPartners] = useState(DEFAULT_DELIVERY_PARTNERS)
  const [refundOrders, setRefundOrders] = useState([])

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

  const fetchRefunds = useCallback(() => {
    getRefunds()
      .then((res) => {
        const data = res.data
        const list = Array.isArray(data) ? data : data.refunds || []
        setRefundOrders(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchRefunds()
    getDeliveryPartners()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : []
        if (list.length > 0) {
          setDeliveryPartners(list.map(dp => ({ id: dp.id, name: dp.full_name || dp.email })))
        }
      })
      .catch(() => {})
  }, [fetchOrders, fetchRefunds])

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus })
      fetchOrders()
    } catch (e) {
      alert(e.response?.data?.detail || `Failed to update to ${newStatus}`)
    }
  }

  const handleAssignDelivery = async (orderId, partnerId) => {
    try {
      const pid = partnerId ? Number(String(partnerId).replace(/\D/g, '')) || partnerId : null
      await updateOrderStatus(orderId, { status: 'ASSIGNED', delivery_partner_id: pid })
      fetchOrders()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to assign delivery')
    }
  }

  const handleRefundAction = async (orderId, action) => {
    try {
      const refund = refundOrders.find(r => r.order_id === orderId || r.orderId === orderId)
      if (refund) {
        await updateRefund(refund.id || refund._id, { status: action })
      } else {
        // Fallback: update order refund inline
        await updateRefund(orderId, { status: action })
      }
      fetchOrders()
      fetchRefunds()
    } catch (e) {
      alert(e.response?.data?.detail || `Refund ${action} failed`)
    }
  }

  // Filter & Paginate
  let filtered = [...orders]
  if (statusFilter !== 'All') {
    filtered = filtered.filter(o => o.status === statusFilter)
  }
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(o =>
      String(o.id || o._id).toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q)
    )
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Merge refund data into orders
  const ordersWithRefunds = paginated.map(order => {
    const refund = refundOrders.find(r => r.order_id === (order.id || order._id))
    return refund ? { ...order, refund_request: refund } : order
  })

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">📦 Order Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', alignSelf: 'center' }}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => { fetchOrders(); fetchRefunds() }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="form-control form-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          style={{ width: 'auto', minWidth: 160 }}
        >
          {STATUS_FILTERS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            className="btn btn-sm"
            style={{
              background: statusFilter === s ? 'var(--primary)' : 'var(--white)',
              color: statusFilter === s ? 'white' : 'var(--secondary)',
              border: `1px solid ${statusFilter === s ? 'var(--primary)' : 'var(--gray-200)'}`,
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              fontWeight: 700,
              boxShadow: statusFilter === s ? '0 2px 8px rgba(249, 87, 33, 0.3)' : 'var(--shadow-xs)',
            }}
            onClick={() => { setStatusFilter(s); setPage(1) }}
          >
            {s === 'All' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>

        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner text="Loading orders..." />
      ) : ordersWithRefunds.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📦</span>
          <h3>No orders found</h3>
          <p>
            {statusFilter !== 'All'
              ? `No orders with status: ${statusFilter}`
              : 'Orders will appear here when customers place them'}
          </p>
        </div>
      ) : (
        <>
          {ordersWithRefunds.map(order => (
            <OrderCard
              key={order.id || order._id}
              order={order}
              showCustomer
              onStatusUpdate={handleStatusUpdate}
              deliveryPartners={deliveryPartners}
              onAssignDelivery={handleAssignDelivery}
              onRefundAction={handleRefundAction}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={page === p ? 'active' : ''}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
