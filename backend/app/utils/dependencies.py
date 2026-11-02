from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.utils.auth import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if not payload:
        raise credentials_exception
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(*roles: UserRole) -> Callable:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}",
            )
        return current_user

    return dependency


def get_current_customer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.customer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer access required")
    return current_user


def get_current_owner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.restaurant_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Restaurant owner access required")
    return current_user


def get_current_delivery_partner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.delivery_partner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Delivery partner access required")
    return current_user
