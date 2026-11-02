from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.order import OrderOut, OrderStatusUpdate
from app.utils.dependencies import get_current_delivery_partner

router = APIRouter(prefix="/delivery", tags=["delivery"])

DELIVERY_TRANSITIONS = {
    OrderStatus.ASSIGNED: [OrderStatus.OUT_FOR_DELIVERY],
    OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
}


@router.get("/orders", response_model=List[OrderOut])
def list_delivery_orders(current_user: User = Depends(get_current_delivery_partner), db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.delivery_partner_id == current_user.id).all()


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_delivery_status(
    order_id: int,
    update: OrderStatusUpdate,
    current_user: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.delivery_partner_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or not assigned to you")

    allowed = DELIVERY_TRANSITIONS.get(order.status, [])
    if update.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {order.status.value} to {update.status.value}",
        )
    order.status = update.status
    db.commit()
    db.refresh(order)
    return order
