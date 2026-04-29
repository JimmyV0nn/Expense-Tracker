<<<<<<< HEAD
from fastapi import APIRouter

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])
=======
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.deps import require_admin
from ..database import get_db
from ..models import User
from ..schemas.user import UserOut, UserUpdate


router = APIRouter(prefix="/api/users", tags=["admin-users"])


@router.get("/", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only update fields that were actually sent — exclude_unset means a
    # client sending {"email": "x@y.com"} won't accidentally reset is_admin.
    updates = payload.model_dump(exclude_unset=True)

    # Enforce uniqueness for username and email changes without relying on the
    # database error, so we can return a friendly message instead of a 500.
    if "username" in updates and updates["username"] != user.username:
        if db.query(User).filter(User.username == updates["username"]).first():
            raise HTTPException(status_code=400, detail="Username already taken")

    if "email" in updates and updates["email"] != user.email:
        if db.query(User).filter(User.email == updates["email"]).first():
            raise HTTPException(status_code=400, detail="Email already in use")

    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent an admin from deleting their own account — losing all admin
    # access mid-session would be very hard to recover from.
    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own admin account",
        )

    db.delete(user)
    db.commit()
>>>>>>> feature/user-activity
