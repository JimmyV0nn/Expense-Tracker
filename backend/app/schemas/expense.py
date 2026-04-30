from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    spent_on: date
    description: str = Field(default="", max_length=500)


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: float | None = Field(default=None, gt=0)
    spent_on: date | None = None
    description: str | None = Field(default=None, max_length=500)


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    category: str
    amount: float
    spent_on: date
    description: str
    created_at: datetime


class CategorySummary(BaseModel):
    category: str
    total: float
    count: int


class MonthlySummary(BaseModel):
    month: str
    total: float
    count: int
