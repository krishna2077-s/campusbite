import React from 'react'

const STATUS_LABELS = {
  PLACED: '🔵 Placed',
  ACCEPTED: '🟠 Accepted',
  PREPARING: '🟡 Preparing',
  READY: '🟡 Ready',
  ASSIGNED: '🟡 Assigned',
  OUT_FOR_DELIVERY: '🟣 Out for Delivery',
  DELIVERED: '🟢 Delivered',
  CANCELLED: '🔴 Cancelled',
  REFUNDED: '⚪ Refunded',
}

const NEXT_STATUSES = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['ASSIGNED'],
  ASSIGNED: [],
  OUT_FOR_DELIVERY: [],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderCard({
  order,
  onStatusUpdate,
  onCancel,
  onReview,
  onRefund,
  showCustomer = false,
  deliveryPartners = [],
  onAssignDelivery,
  onRefundAction,
}) {
  const {
    id,
    _id,
    status = 'PLACED',
    items = [],
    total_amount,
    total,
    created_at,
    delivery_address,
    restaurant,
    customer,
    refund_request,
  } = order

  const orderId = id || _id
  const totalAmt = total_amount || total || 0

  return (
    <div className="order-card animate-fade">
      {/* Header */}
      <div className="order-card-header">
        <div>
          <div className="order-id">Order #{String(orderId).slice(-8).toUpperCase()}</div>
          <div className="order-date">{formatDate(created_at)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>
          {refund_request && (
            <span className={`badge badge-${refund_request.status || 'PENDING'}`}>
              Refund: {refund_request.status || 'PENDING'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="order-card-body">
        {restaurant && (
          <div style={{ marginBottom: 10, color: 'var(--gray-500)', fontSize: '0.85rem' }}>
            🏪 {restaurant.name || restaurant}
          </div>
        )}
        {showCustomer && customer && (
          <div style={{ marginBottom: 10, color: 'var(--gray-500)', fontSize: '0.85rem' }}>
            👤 {customer.name || customer.full_name || customer.email}
          </div>
        )}
        {delivery_address && (
          <div style={{ marginBottom: 10, color: 'var(--gray-500)', fontSize: '0.85rem' }}>
            📍 {delivery_address}
          </div>
        )}

        {/* Items */}
        <div className="order-items-list">
          {items.map((item, i) => (
            <div key={i} className="order-item-row">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="order-total-row">
          <span>Total</span>
          <span>₹{Number(totalAmt).toFixed(2)}</span>
        </div>

        {/* Refund request info */}
        {refund_request && refund_request.reason && onRefundAction && (
          <div className="alert alert-warning mt-2">
            <strong>Refund requested:</strong> {refund_request.reason}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-sm btn-success" onClick={() => onRefundAction(orderId, 'APPROVED')}>
                ✓ Approve
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => onRefundAction(orderId, 'REJECTED')}>
                ✕ Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="order-card-footer">
        {/* Owner status updates */}
        {onStatusUpdate && NEXT_STATUSES[status]?.map((nextStatus) => (
          <button
            key={nextStatus}
            className="btn btn-sm btn-primary"
            onClick={() => onStatusUpdate(orderId, nextStatus)}
          >
            → {nextStatus}
          </button>
        ))}

        {/* Assign delivery */}
        {onAssignDelivery && status === 'READY' && deliveryPartners.length > 0 && (
          <select
            className="form-control form-select"
            style={{ padding: '6px 32px 6px 10px', width: 'auto', fontSize: '0.82rem' }}
            defaultValue=""
            onChange={(e) => e.target.value && onAssignDelivery(orderId, e.target.value)}
          >
            <option value="">Assign Delivery...</option>
            {deliveryPartners.map((dp) => (
              <option key={dp.id || dp._id} value={dp.id || dp._id}>
                {dp.name || dp.full_name}
              </option>
            ))}
          </select>
        )}

        {/* Customer actions */}
        {onCancel && ['PLACED', 'ACCEPTED'].includes(status) && (
          <button className="btn btn-sm btn-danger" onClick={() => onCancel(orderId)}>
            Cancel Order
          </button>
        )}

        {onReview && status === 'DELIVERED' && (
          <button className="btn btn-sm btn-success" onClick={() => onReview(order)}>
            ⭐ Write Review
          </button>
        )}

        {onRefund && status === 'DELIVERED' && !refund_request && (
          <button className="btn btn-sm btn-ghost" onClick={() => onRefund(order)}>
            💰 Request Refund
          </button>
        )}
      </div>
    </div>
  )
}
