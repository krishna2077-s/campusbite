from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReviewCreate(BaseModel):
    order_id: int
    rating: int
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    order_id: int
    customer_id: int
    restaurant_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
