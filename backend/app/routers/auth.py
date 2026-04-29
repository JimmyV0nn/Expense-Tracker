<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, status
=======
from fastapi import APIRouter, Depends, HTTPException, Request, status
>>>>>>> feature/user-activity
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..core.security import create_access_token, hash_password, verify_password
from ..database import get_db
from ..models import User
<<<<<<< HEAD
=======
from ..models.activity import UserActivity
>>>>>>> feature/user-activity
from ..schemas.user import Token, UserCreate, UserLogin, UserOut


router = APIRouter(prefix="/api/auth", tags=["auth"])


<<<<<<< HEAD
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first():
=======
def _log_activity(db: Session, user: User, action: str, request: Request) -> None:
    """Write a single row to user_activities.

    We extract the client IP from the ASGI request object. In production
    behind a proxy you'd read X-Forwarded-For instead, but for this project
    request.client.host is fine.
    """
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
    # Bail early if the username or email is already taken — the OR filter
    # catches both in a single query instead of two round-trips.
    if db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first():
>>>>>>> feature/user-activity
        raise HTTPException(status_code=400, detail="Username or email already in use")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

<<<<<<< HEAD
=======
    _log_activity(db, user, "register", request)

>>>>>>> feature/user-activity
    token = create_access_token(user.id, extra={"is_admin": user.is_admin})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
<<<<<<< HEAD
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
=======
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    # Intentionally use the same error message for "user not found" and
    # "wrong password" — telling an attacker which one failed is a
    # user-enumeration vulnerability.
>>>>>>> feature/user-activity
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

<<<<<<< HEAD
=======
    _log_activity(db, user, "login", request)

>>>>>>> feature/user-activity
    token = create_access_token(user.id, extra={"is_admin": user.is_admin})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/logout")
<<<<<<< HEAD
def logout(current_user: User = Depends(get_current_user)):
=======
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # JWTs are stateless so we can't truly invalidate the token here,
    # but we still record the intent so admins can audit when users logged out.
    _log_activity(db, current_user, "logout", request)
>>>>>>> feature/user-activity
    return {"message": "logged out"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
