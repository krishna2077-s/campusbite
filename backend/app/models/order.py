from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class OrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY = "READY"
    ASSIGNED = "ASSIGNED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    mock_paid = "mock_paid"
    refunded = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    delivery_partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PLACED, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    delivery_address = Column(Text, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.mock_paid, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
    delivery_partner = relationship("User", foreign_keys=[delivery_partner_id], back_populates="delivered_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    review = relationship("Review", back_populates="order", uselist=False)
    payment = relationship("Payment", back_populates="order", uselist=False)
    reminders = relationship("Reminder", back_populates="order")
    refund_request = relationship("ReturnRefund", back_populates="order", uselist=False)

    @property
    def total(self) -> Numeric:
        return self.total_amount

