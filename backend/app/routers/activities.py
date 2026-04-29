from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.deps import require_admin
from ..database import get_db
from ..models import User
from ..models.activity import UserActivity
from ..schemas.activity import ActivityResponse


router = APIRouter(prefix="/api/admin/activities", tags=["admin-activities"])


@router.get("/", response_model=list[ActivityResponse])
def list_activities(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    user_email: str | None = Query(default=None),
    action: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
):
    query = db.query(UserActivity)

    if user_email:
        query = query.filter(UserActivity.user_email == user_email)
    if action:
        query = query.filter(UserActivity.action == action)

    query = query.order_by(UserActivity.timestamp.desc())
    return query.offset(skip).limit(limit).all()
