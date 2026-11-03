from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import Token, UserCreate, UserOut
from app.utils.auth import create_access_token, get_password_hash, verify_password
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    clean_email = str(user_in.email).strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed = get_password_hash(user_in.password)
    user = User(
        email=clean_email,
        password_hash=hashed,
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)):
    email = None
    password = None
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            pass
    if not email or not password:
        try:
            form = await request.form()
            email = form.get("username") or form.get("email") or email
            password = form.get("password") or password
        except Exception:
            pass

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required",
        )

    clean_email = str(email).strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    user_out = UserOut.model_validate(user)
    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    return Token(
        access_token=access_token,
        token=access_token,
        token_type="bearer",
        user=user_out,
        role=role_str,
    )



@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
