from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.customer

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, v):
        if isinstance(v, str):
            v_lower = v.strip().lower()
            if v_lower in ("owner", "restaurant_owner"):
                return UserRole.restaurant_owner
            if v_lower in ("delivery", "delivery_partner"):
                return UserRole.delivery_partner
            if v_lower == "customer":
                return UserRole.customer
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    restaurant_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserOut] = None
    role: Optional[str] = None


class TokenData(BaseModel):
    user_id: Optional[int] = None

