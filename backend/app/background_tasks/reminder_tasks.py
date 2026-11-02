from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.order import Order, OrderStatus
from app.models.reminder import Reminder

logger = logging.getLogger("campusbite.reminders")


def check_stale_orders(db: Session | None = None) -> None:
    """Find orders stuck in PLACED or ACCEPTED for >15 minutes and create reminders."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    try:
        threshold = datetime.utcnow() - timedelta(minutes=15)
        stale_orders = (
            db.query(Order)
            .filter(
                Order.status.in_([OrderStatus.PLACED, OrderStatus.ACCEPTED]),
                Order.updated_at <= threshold,
            )
            .all()
        )
        for order in stale_orders:
            # Avoid duplicate reminders created within the last 15 minutes
            recent_reminder = (
                db.query(Reminder)
                .filter(
                    Reminder.order_id == order.id,
                    Reminder.created_at >= threshold,
                )
                .first()
            )
            if not recent_reminder:
                reminder = Reminder(
                    order_id=order.id,
                    restaurant_id=order.restaurant_id,
                    message=(
                        f"Order #{order.id} has been in '{order.status.value}' status "
                        f"for more than 15 minutes. Please take action."
                    ),
                    is_read=False,
                )
                db.add(reminder)
                logger.warning("Created stale-order reminder for order #%d", order.id)
        db.commit()
    except Exception:
        logger.exception("Error in check_stale_orders")
        db.rollback()
    finally:
        if close_db:
            db.close()
