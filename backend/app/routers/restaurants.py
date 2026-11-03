from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.menu_item import MenuItem
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import RestaurantCreate, RestaurantOut, RestaurantUpdate, RestaurantWithMenu
from app.utils.dependencies import get_current_owner, get_current_user

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("", response_model=List[RestaurantOut])
def list_restaurants(
    search: Optional[str] = Query(None, description="Search term across name, description, cuisine, address, and menu items"),
    q: Optional[str] = Query(None, description="Alias for search query"),
    name: Optional[str] = Query(None, description="Filter specifically by restaurant name"),
    cuisine: Optional[str] = Query(None, description="Filter by cuisine type"),
    cuisine_type: Optional[str] = Query(None, description="Alias for cuisine"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db),
):
    query = db.query(Restaurant)

    if is_active is not None:
        query = query.filter(Restaurant.is_active == is_active)

    # Cuisine filter (matches either cuisine or cuisine_type parameter)
    target_cuisine = (cuisine or cuisine_type or "").strip()
    if target_cuisine and target_cuisine.lower() != "all":
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{target_cuisine}%"))

    # General search query (supports search, q, or name)
    search_term = (search or q or name or "").strip()
    if search_term:
        term = f"%{search_term}%"
        query = query.filter(
            or_(
                Restaurant.name.ilike(term),
                Restaurant.cuisine_type.ilike(term),
                Restaurant.description.ilike(term),
                Restaurant.address.ilike(term),
                Restaurant.menu_items.any(MenuItem.name.ilike(term)),
                Restaurant.menu_items.any(MenuItem.category.ilike(term)),
                Restaurant.menu_items.any(MenuItem.description.ilike(term)),
            )
        )

    return query.distinct().all()


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
