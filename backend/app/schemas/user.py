from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    is_admin: bool
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
<<<<<<< HEAD
=======
    username: str | None = Field(default=None, min_length=3, max_length=50)
>>>>>>> feature/user-activity
    email: EmailStr | None = None
    is_active: bool | None = None
    is_admin: bool | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
