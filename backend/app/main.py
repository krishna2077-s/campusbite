from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.middleware.logging_middleware import LoggingMiddleware
from app.routers import auth, restaurants, menu, orders, delivery, reviews, payments, refunds, ai_insights, stats

# Configure root logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger("campusbite")

app = FastAPI(
    title="CampusBite API",
    description="Restaurant ordering and delivery platform for campus communities",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Logging middleware ────────────────────────────────────────────────────────
app.add_middleware(LoggingMiddleware)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(delivery.router)
app.include_router(reviews.router)
app.include_router(payments.router)
app.include_router(refunds.router)
app.include_router(ai_insights.router)
app.include_router(stats.router)


# ── Startup / shutdown ────────────────────────────────────────────────────────
scheduler = BackgroundScheduler()


@app.on_event("startup")
def startup_event():
    # Import all models so SQLAlchemy can see them before create_all
    from app.models import user, restaurant, menu_item, order, order_item, review, payment, reminder, return_refund  # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created / verified.")

    from app.background_tasks.reminder_tasks import check_stale_orders

    scheduler.add_job(check_stale_orders, "interval", minutes=5, id="stale_order_checker")
    scheduler.start()
    logger.info("APScheduler started – stale-order checker runs every 5 minutes.")


@app.on_event("shutdown")
def shutdown_event():
    if scheduler.running:
        scheduler.shutdown(wait=False)
    logger.info("APScheduler stopped.")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "CampusBite API"}
