from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.order import Order
from app.models.user import User, UserRole
from app.schemas.ai_insights import AIInsightRequest, AIInsightResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["ai_insights"])


@router.post("/insights", response_model=AIInsightResponse)
def get_ai_insights(
    insight_in: AIInsightRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI insights are not configured. Please set OPENAI_API_KEY.",
        )

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to initialize OpenAI client: {exc}",
        )

    # Fetch user's order history as context
    if current_user.role == UserRole.customer:
        orders = db.query(Order).filter(Order.customer_id == current_user.id).limit(20).all()
        order_summaries = [
            {
                "order_id": o.id,
                "restaurant_id": o.restaurant_id,
                "status": o.status.value,
                "total_amount": float(o.total_amount),
                "payment_status": o.payment_status.value,
                "created_at": o.created_at.isoformat(),
                "items": [
                    {
                        "menu_item_id": item.menu_item_id,
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price),
                        "subtotal": float(item.subtotal),
                    }
                    for item in o.items
                ],
            }
            for o in orders
        ]
    elif current_user.role == UserRole.restaurant_owner:
        orders = (
            db.query(Order).filter(Order.restaurant_id == current_user.restaurant_id).limit(20).all()
        )
        order_summaries = [
            {
                "order_id": o.id,
                "customer_id": o.customer_id,
                "status": o.status.value,
                "total_amount": float(o.total_amount),
                "created_at": o.created_at.isoformat(),
            }
            for o in orders
        ]
    else:
        order_summaries = []

    system_prompt = (
        "You are CampusBite AI, a helpful assistant for a food ordering platform. "
        "You help users understand their order history, get food recommendations, "
        "and answer questions about their account activity. "
        "Be concise, friendly, and helpful."
    )

    context_message = (
        f"Here is the user's recent order data (last 20 orders):\n{order_summaries}\n\n"
        f"User role: {current_user.role.value}\n"
        f"User name: {current_user.full_name}"
    )

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context_message},
                {"role": "user", "content": insight_in.query},
            ],
            max_tokens=512,
            temperature=0.7,
        )
        response_text = completion.choices[0].message.content or ""
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {exc}",
        )

    return AIInsightResponse(response=response_text)
