from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


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
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    is_active: bool | None = None
    is_admin: bool | None = None

    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str | None) -> str | None:
        return v.strip().lower() if v else v


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
