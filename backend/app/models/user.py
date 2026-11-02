from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    restaurant_owner = "restaurant_owner"
    delivery_partner = "delivery_partner"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", foreign_keys=[restaurant_id], back_populates="staff")
    owned_restaurants = relationship("Restaurant", foreign_keys="Restaurant.owner_id", back_populates="owner")
    orders = relationship("Order", foreign_keys="Order.customer_id", back_populates="customer")
    delivered_orders = relationship("Order", foreign_keys="Order.delivery_partner_id", back_populates="delivery_partner")
    reviews = relationship("Review", back_populates="customer")
    refund_requests = relationship("ReturnRefund", back_populates="customer")
