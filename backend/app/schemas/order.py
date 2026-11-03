from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel

from app.models.order import OrderStatus, PaymentStatus


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int


class OrderItemOut(BaseModel):
    id: int
    menu_item_id: int
    name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    price: Optional[Decimal] = None
    subtotal: Decimal

    model_config = {"from_attributes": True}


class RestaurantSummary(BaseModel):
    id: int
    name: str
    cuisine_type: Optional[str] = None
    address: Optional[str] = None

    model_config = {"from_attributes": True}


class CustomerSummary(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    restaurant_id: int
    delivery_address: str
    items: List[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    delivery_partner_id: Optional[int] = None


class OrderOut(BaseModel):
    id: int
    customer_id: int
    restaurant_id: int
    delivery_partner_id: Optional[int] = None
    status: OrderStatus
    total_amount: Decimal
    total: Optional[Decimal] = None
    delivery_address: str
    payment_status: PaymentStatus
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []
    restaurant: Optional[RestaurantSummary] = None
    customer: Optional[CustomerSummary] = None

    model_config = {"from_attributes": True}



class ReminderOut(BaseModel):
    id: int
    order_id: int
    restaurant_id: int
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
