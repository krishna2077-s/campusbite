from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.payment import Payment, PaymentRecordStatus, PaymentType
from app.models.return_refund import RefundStatus, ReturnRefund
from app.models.user import User, UserRole
from app.schemas.payment import RefundRequestCreate, RefundRequestOut, RefundRequestUpdate
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/refunds", tags=["refunds"])


@router.post("", response_model=RefundRequestOut, status_code=status.HTTP_201_CREATED)
def request_refund(
    refund_in: RefundRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.customer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can request refunds")

    order = db.query(Order).filter(Order.id == refund_in.order_id, Order.customer_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != OrderStatus.DELIVERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Refunds can only be requested for delivered orders"
        )

    existing = db.query(ReturnRefund).filter(ReturnRefund.order_id == refund_in.order_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Refund request already exists for this order"
        )

    refund_request = ReturnRefund(
        order_id=refund_in.order_id,
        customer_id=current_user.id,
        reason=refund_in.reason,
        status=RefundStatus.pending,
    )
    db.add(refund_request)
    db.commit()
    db.refresh(refund_request)
    return refund_request


@router.get("", response_model=List[RefundRequestOut])
def list_refunds(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.customer:
        return db.query(ReturnRefund).filter(ReturnRefund.customer_id == current_user.id).all()
    elif current_user.role == UserRole.restaurant_owner:
        return (
            db.query(ReturnRefund)
            .join(Order, ReturnRefund.order_id == Order.id)
            .filter(Order.restaurant_id == current_user.restaurant_id)
            .all()
        )
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.patch("/{refund_id}", response_model=RefundRequestOut)
def handle_refund(
    refund_id: int,
    update: RefundRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.restaurant_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only restaurant owners can handle refunds")

    refund_request = db.query(ReturnRefund).filter(ReturnRefund.id == refund_id).first()
    if not refund_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refund request not found")

    order = db.query(Order).filter(Order.id == refund_request.order_id).first()
    if not order or order.restaurant_id != current_user.restaurant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if refund_request.status != RefundStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Refund request already processed"
        )

    if update.status not in [RefundStatus.approved, RefundStatus.rejected]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'approved' or 'rejected'"
        )

    refund_request.status = update.status

    if update.status == RefundStatus.approved:
        # Update order payment status and create refund payment record
        order.status = OrderStatus.REFUNDED
        order.payment_status = PaymentStatus.refunded
        refund_payment = Payment(
            order_id=order.id,
            amount=order.total_amount,
            payment_type=PaymentType.refund,
            status=PaymentRecordStatus.success,
        )
        db.add(refund_payment)

    db.commit()
    db.refresh(refund_request)
    return refund_request
