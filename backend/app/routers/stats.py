from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.menu_item import MenuItem
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.user import User
from app.utils.dependencies import get_current_owner

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/restaurant", response_model=Dict[str, Any])
def get_restaurant_stats(
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    if not current_user.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No restaurant associated with your account",
        )

    restaurant_id = current_user.restaurant_id

    # Total orders
    total_orders = db.query(func.count(Order.id)).filter(Order.restaurant_id == restaurant_id).scalar() or 0

    # Total revenue (only from non-cancelled, non-refunded orders)
    revenue = (
        db.query(func.sum(Order.total_amount))
        .filter(
            Order.restaurant_id == restaurant_id,
            Order.status.not_in([OrderStatus.CANCELLED, OrderStatus.REFUNDED]),
        )
        .scalar()
        or 0
    )

    # Pending orders (PLACED or ACCEPTED)
    pending_orders = (
        db.query(func.count(Order.id))
        .filter(
            Order.restaurant_id == restaurant_id,
            Order.status.in_([OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY]),
        )
        .scalar()
        or 0
    )

    # Top 5 dishes by quantity sold
    top_dishes_query = (
        db.query(
            MenuItem.id,
            MenuItem.name,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.subtotal).label("total_revenue"),
        )
        .join(OrderItem, MenuItem.id == OrderItem.menu_item_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.restaurant_id == restaurant_id,
            Order.status.not_in([OrderStatus.CANCELLED, OrderStatus.REFUNDED]),
        )
        .group_by(MenuItem.id, MenuItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    top_dishes: List[Dict[str, Any]] = [
        {
            "menu_item_id": row.id,
            "name": row.name,
            "total_sold": int(row.total_sold),
            "total_revenue": float(row.total_revenue),
        }
        for row in top_dishes_query
    ]

    return {
        "restaurant_id": restaurant_id,
        "total_orders": total_orders,
        "total_revenue": float(revenue),
        "pending_orders": pending_orders,
        "top_dishes": top_dishes,
    }
