from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.menu_item import MenuItem
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.menu_item import MenuItemAvailability, MenuItemCreate, MenuItemOut, MenuItemUpdate
from app.utils.dependencies import get_current_owner, get_current_user

router = APIRouter(tags=["menu"])


def _get_restaurant_for_owner(restaurant_id: int, owner: User, db: Session) -> Restaurant:
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    if restaurant.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this restaurant")
    return restaurant


def _get_item_for_owner(item_id: int, owner: User, db: Session) -> MenuItem:
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    restaurant = db.query(Restaurant).filter(Restaurant.id == item.restaurant_id).first()
    if not restaurant or restaurant.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this menu item")
    return item


@router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuItemOut])
def list_menu(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id).all()


@router.post("/restaurants/{restaurant_id}/menu", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
def add_menu_item(
    restaurant_id: int,
    item_in: MenuItemCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    _get_restaurant_for_owner(restaurant_id, current_user, db)
    item = MenuItem(**item_in.model_dump(), restaurant_id=restaurant_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/menu/{item_id}", response_model=MenuItemOut)
def update_menu_item(
    item_id: int,
    item_in: MenuItemUpdate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    item = _get_item_for_owner(item_id, current_user, db)
    for field, value in item_in.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/menu/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    item_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    item = _get_item_for_owner(item_id, current_user, db)
    db.delete(item)
    db.commit()


@router.patch("/menu/{item_id}/availability", response_model=MenuItemOut)
def update_availability(
    item_id: int,
    availability: MenuItemAvailability,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    item = _get_item_for_owner(item_id, current_user, db)
    item.is_available = availability.is_available
    db.commit()
    db.refresh(item)
    return item


@router.patch("/menu/{item_id}/toggle", response_model=MenuItemOut)
def toggle_menu_item(
    item_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    item = _get_item_for_owner(item_id, current_user, db)
    item.is_available = not bool(item.is_available)
    db.commit()
    db.refresh(item)
    return item
