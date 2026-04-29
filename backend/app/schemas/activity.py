from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityCreate(BaseModel):
    user_id: int
    user_email: str
    action: str
    ip_address: str


class ActivityResponse(BaseModel):
    # from_attributes=True lets Pydantic read directly off a SQLAlchemy ORM
    # object instead of requiring a plain dict.
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_email: str
    action: str
    timestamp: datetime
    ip_address: str
