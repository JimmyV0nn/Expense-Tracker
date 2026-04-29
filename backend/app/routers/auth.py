from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..core.security import create_access_token, hash_password, verify_password
from ..database import get_db
from ..models import User
from ..models.activity import UserActivity
from ..schemas.user import Token, UserCreate, UserLogin, UserOut


router = APIRouter(prefix="/api/auth", tags=["auth"])


def _log_activity(db: Session, user: User, action: str, request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    activity = UserActivity(
        user_id=user.id,
        user_email=user.email,
        action=action,
        ip_address=ip,
    )
    db.add(activity)
    db.commit()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first():
        raise HTTPException(status_code=400, detail="Username or email already in use")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _log_activity(db, user, "register", request)

    token = create_access_token(user.id, extra={"is_admin": user.is_admin})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    _log_activity(db, user, "login", request)

    token = create_access_token(user.id, extra={"is_admin": user.is_admin})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _log_activity(db, current_user, "logout", request)
    return {"message": "logged out"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
