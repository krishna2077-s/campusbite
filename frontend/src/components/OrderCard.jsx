import React from 'react'

const STATUS_LABELS = {
  PLACED: 'Order Placed',
  ACCEPTED: 'Accepted by Kitchen',
  PREPARING: 'Kitchen Preparing',
  READY: 'Food Ready for Pickup',
  ASSIGNED: 'Delivery Partner Assigned',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered Successfully',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refund Processed',
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
          <div className="order-id">📦 Order #{String(orderId).slice(-8).toUpperCase()}</div>
          <div className="order-date">{formatDate(created_at)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge badge-${status}`}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'currentColor',
            }} />
            {STATUS_LABELS[status] || status}
          </span>
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
          <div style={{ marginBottom: 8, color: 'var(--gray-600)', fontSize: '0.88rem', fontWeight: 600 }}>
            🏪 <span style={{ color: 'var(--secondary)' }}>{restaurant.name || restaurant}</span>
          </div>
        )}
        {showCustomer && customer && (
          <div style={{ marginBottom: 8, color: 'var(--gray-600)', fontSize: '0.88rem' }}>
            👤 Customer: <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{customer.full_name || customer.name || customer.email}</span>
            {customer.phone && <span style={{ color: 'var(--gray-400)', marginLeft: 6 }}>({customer.phone})</span>}
          </div>
        )}
        {delivery_address && (
          <div style={{ marginBottom: 12, color: 'var(--gray-600)', fontSize: '0.86rem' }}>
            📍 <span style={{ color: 'var(--secondary-light)' }}>{delivery_address}</span>
          </div>
        )}

        {/* Items */}
        <div className="order-items-list">
          {items.map((item, i) => (
            <div key={i} className="order-item-row">
              <span>{item.name || item.item_name || `Dish Item #${item.menu_item_id || i + 1}`} × {item.quantity}</span>
              <span>₹{Number((item.price || item.unit_price || 0) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="order-total-row">
          <span>Total Amount</span>
          <span style={{ color: 'var(--primary)' }}>₹{Number(totalAmt).toFixed(2)}</span>
        </div>

        {/* Refund request info */}
        {refund_request && refund_request.reason && onRefundAction && (
          <div className="alert alert-warning mt-2">
            <div>
              <strong>Refund Claim:</strong> {refund_request.reason}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-sm btn-success" onClick={() => onRefundAction(orderId, 'APPROVED')}>
                  ✓ Approve Refund
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => onRefundAction(orderId, 'REJECTED')}>
                  ✕ Reject Claim
                </button>
              </div>
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
            Advance to {nextStatus.replace(/_/g, ' ')} →
          </button>
        ))}

        {/* Assign delivery */}
        {onAssignDelivery && status === 'READY' && deliveryPartners.length > 0 && (
          <select
            className="form-control form-select"
            style={{ padding: '6px 34px 6px 12px', width: 'auto', fontSize: '0.84rem', fontWeight: 600 }}
            defaultValue=""
            onChange={(e) => e.target.value && onAssignDelivery(orderId, e.target.value)}
          >
            <option value="">🛵 Assign Delivery Partner...</option>
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
            ✕ Cancel Order
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
