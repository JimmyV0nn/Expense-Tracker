from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class UserActivity(Base):
    __tablename__ = "user_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Which user performed the action. Cascade delete on the User model means
    # these rows vanish automatically when the user is deleted.
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # We snapshot the email at the time of the event so the history stays
    # readable even if the user later changes their address.
    user_email: Mapped[str] = mapped_column(String(120), nullable=False)

    # One of "register", "login", or "logout" — kept as a plain string so
    # adding new action types later doesn't require a schema migration.
    action: Mapped[str] = mapped_column(String(20), nullable=False)

    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # 45 characters is enough to hold a full IPv6 address.
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)

    user = relationship("User", back_populates="activities")
