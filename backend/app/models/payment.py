from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class PaymentType(str, enum.Enum):
    payment = "payment"
    refund = "refund"


class PaymentRecordStatus(str, enum.Enum):
    success = "success"
    pending = "pending"
    failed = "failed"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_type = Column(Enum(PaymentType), default=PaymentType.payment, nullable=False)
    status = Column(Enum(PaymentRecordStatus), default=PaymentRecordStatus.success, nullable=False)
    transaction_id = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="payment")
