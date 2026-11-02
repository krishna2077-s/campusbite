from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.payment import PaymentRecordStatus, PaymentType
from app.models.return_refund import RefundStatus


class PaymentOut(BaseModel):
    id: int
    order_id: int
    amount: Decimal
    payment_type: PaymentType
    status: PaymentRecordStatus
    transaction_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class RefundRequestCreate(BaseModel):
    order_id: int
    reason: str


class RefundRequestUpdate(BaseModel):
    status: RefundStatus


class RefundRequestOut(BaseModel):
    id: int
    order_id: int
    customer_id: int
    reason: str
    status: RefundStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
