from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool = True


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class MenuItemAvailability(BaseModel):
    is_available: bool


class MenuItemOut(BaseModel):
    id: int
    restaurant_id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    category: Optional[str] = None
    image_url: Optional[str] = None
    image: Optional[str] = None
    is_available: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}

