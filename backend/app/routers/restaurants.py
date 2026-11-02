from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import RestaurantCreate, RestaurantOut, RestaurantUpdate, RestaurantWithMenu
from app.utils.dependencies import get_current_owner, get_current_user

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("", response_model=List[RestaurantOut])
def list_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(Restaurant.is_active == True).all()


@router.get("/{restaurant_id}", response_model=RestaurantWithMenu)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant


@router.post("", response_model=RestaurantOut, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    restaurant_in: RestaurantCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    restaurant = Restaurant(**restaurant_in.model_dump(), owner_id=current_user.id)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    # Link owner to the restaurant
    current_user.restaurant_id = restaurant.id
    db.commit()
    return restaurant


@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: int,
    restaurant_in: RestaurantUpdate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    if restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this restaurant")
    for field, value in restaurant_in.model_dump(exclude_unset=True).items():
        setattr(restaurant, field, value)
    db.commit()
    db.refresh(restaurant)
    return restaurant
