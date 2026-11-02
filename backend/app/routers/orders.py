from __future__ import annotations

import uuid
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.menu_item import MenuItem
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.payment import Payment, PaymentRecordStatus, PaymentType
from app.models.reminder import Reminder
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate, ReminderOut
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

# Valid status transitions per role
CUSTOMER_TRANSITIONS = {
    OrderStatus.PLACED: [OrderStatus.CANCELLED],
}
OWNER_TRANSITIONS = {
    OrderStatus.PLACED: [OrderStatus.ACCEPTED],
    OrderStatus.ACCEPTED: [OrderStatus.PREPARING],
    OrderStatus.PREPARING: [OrderStatus.READY],
    OrderStatus.READY: [OrderStatus.ASSIGNED],
}
DELIVERY_TRANSITIONS = {
    OrderStatus.ASSIGNED: [OrderStatus.OUT_FOR_DELIVERY],
    OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
}


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.customer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can place orders")

    restaurant = db.query(Restaurant).filter(
        Restaurant.id == order_in.restaurant_id, Restaurant.is_active == True
    ).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found or inactive")

    if not order_in.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must contain at least one item")

    # Validate and price items
    order_items = []
    total = Decimal("0.00")
    for item_in in order_in.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == item_in.menu_item_id,
            MenuItem.restaurant_id == order_in.restaurant_id,
            MenuItem.is_available == True,
        ).first()
        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item {item_in.menu_item_id} not found or unavailable",
            )
        if item_in.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be > 0")
        unit_price = Decimal(str(menu_item.price))
        subtotal = unit_price * item_in.quantity
        total += subtotal
        order_items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                quantity=item_in.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )
        )

    order = Order(
        customer_id=current_user.id,
        restaurant_id=order_in.restaurant_id,
        delivery_address=order_in.delivery_address,
        total_amount=total,
        status=OrderStatus.PLACED,
        payment_status=PaymentStatus.mock_paid,
    )
    db.add(order)
    db.flush()  # get order.id

    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    # Create a mock payment record
    payment = Payment(
        order_id=order.id,
        amount=total,
        payment_type=PaymentType.payment,
        status=PaymentRecordStatus.success,
        transaction_id=str(uuid.uuid4()),
    )
    db.add(payment)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=List[OrderOut])
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.customer:
        orders = db.query(Order).filter(Order.customer_id == current_user.id).all()
    elif current_user.role == UserRole.restaurant_owner:
        if not current_user.restaurant_id:
            return []
        orders = db.query(Order).filter(Order.restaurant_id == current_user.restaurant_id).all()
    else:  # delivery_partner
        orders = db.query(Order).filter(Order.delivery_partner_id == current_user.id).all()
    return orders


@router.get("/owner/reminders", response_model=List[ReminderOut])
def get_owner_reminders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.restaurant_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Restaurant owner access required")
    if not current_user.restaurant_id:
        return []
    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.restaurant_id == current_user.restaurant_id,
            Reminder.is_read == False,
        )
        .order_by(Reminder.created_at.desc())
        .all()
    )
    # Mark as read
    for r in reminders:
        r.is_read = True
    db.commit()
    return reminders


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role == UserRole.customer and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.restaurant_owner and order.restaurant_id != current_user.restaurant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.delivery_partner and order.delivery_partner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    update: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    new_status = update.status

    if current_user.role == UserRole.customer:
        if order.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        allowed = CUSTOMER_TRANSITIONS.get(order.status, [])
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from {order.status.value} to {new_status.value} as customer",
            )

    elif current_user.role == UserRole.restaurant_owner:
        if order.restaurant_id != current_user.restaurant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        allowed = OWNER_TRANSITIONS.get(order.status, [])
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from {order.status.value} to {new_status.value} as owner",
            )
        if new_status == OrderStatus.ASSIGNED:
            if not update.delivery_partner_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="delivery_partner_id required when assigning order",
                )
            partner = db.query(User).filter(
                User.id == update.delivery_partner_id,
                User.role == UserRole.delivery_partner,
            ).first()
            if not partner:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Delivery partner not found"
                )
            order.delivery_partner_id = update.delivery_partner_id

    elif current_user.role == UserRole.delivery_partner:
        if order.delivery_partner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        allowed = DELIVERY_TRANSITIONS.get(order.status, [])
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from {order.status.value} to {new_status.value} as delivery partner",
            )

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
