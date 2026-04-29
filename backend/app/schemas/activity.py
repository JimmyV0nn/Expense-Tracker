from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityCreate(BaseModel):
    user_id: int
    user_email: str
    action: str
    ip_address: str


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_email: str
    action: str
    timestamp: datetime
    ip_address: str
