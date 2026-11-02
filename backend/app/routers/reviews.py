from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderStatus
from app.models.review import Review
from app.models.user import User, UserRole
from app.schemas.review import ReviewCreate, ReviewOut
from app.utils.dependencies import get_current_user

router = APIRouter(tags=["reviews"])


@router.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def submit_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.customer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can submit reviews")

    if not (1 <= review_in.rating <= 5):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating must be between 1 and 5")

    order = db.query(Order).filter(Order.id == review_in.order_id, Order.customer_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != OrderStatus.DELIVERED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only review delivered orders")

    existing = db.query(Review).filter(Review.order_id == review_in.order_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Review already submitted for this order")

    review = Review(
        order_id=review_in.order_id,
        customer_id=current_user.id,
        restaurant_id=order.restaurant_id,
        rating=review_in.rating,
        comment=review_in.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/restaurants/{restaurant_id}/reviews", response_model=List[ReviewOut])
def list_restaurant_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.restaurant_id == restaurant_id).order_by(Review.created_at.desc()).all()
