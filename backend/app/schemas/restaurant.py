from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.menu_item import MenuItemOut


class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: str
    phone: Optional[str] = None
    image_url: Optional[str] = None


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class RestaurantOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: str
    phone: Optional[str] = None
    image_url: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True
    is_open: Optional[bool] = True
    rating: Optional[float] = 4.8
    owner_id: int
    created_at: datetime

    model_config = {"from_attributes": True}



class RestaurantWithMenu(RestaurantOut):
    menu_items: List[MenuItemOut] = []
