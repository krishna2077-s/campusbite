from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.payment import Payment
from app.models.order import Order
from app.models.user import User, UserRole
from app.schemas.payment import PaymentOut
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=List[PaymentOut])
def list_payments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.customer:
        # Join with orders to get only current user's payments
        payments = (
            db.query(Payment)
            .join(Order, Payment.order_id == Order.id)
            .filter(Order.customer_id == current_user.id)
            .all()
        )
    elif current_user.role == UserRole.restaurant_owner:
        payments = (
            db.query(Payment)
            .join(Order, Payment.order_id == Order.id)
            .filter(Order.restaurant_id == current_user.restaurant_id)
            .all()
        )
    else:
        payments = []
    return payments
