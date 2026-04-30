from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..database import get_db
from ..models import Expense, User
from ..schemas.expense import (
    CategorySummary,
    ExpenseCreate,
    ExpenseOut,
    ExpenseUpdate,
    MonthlySummary,
)


router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/", response_model=list[ExpenseOut])
def list_expenses(
    q: str | None = None,
    category: str | None = None,
    start: date | None = None,
    end: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(Expense.title).like(like),
                func.lower(Expense.description).like(like),
                func.lower(Expense.category).like(like),
            )
        )
    if category:
        query = query.filter(Expense.category == category)
    if start:
        query = query.filter(Expense.spent_on >= start)
    if end:
        query = query.filter(Expense.spent_on <= end)

    return query.order_by(Expense.spent_on.desc(), Expense.id.desc()).all()


@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = Expense(**payload.model_dump(), user_id=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/categories", response_model=list[str])
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Expense.category)
        .filter(Expense.user_id == current_user.id)
        .distinct()
        .order_by(Expense.category)
        .all()
    )
    return [r[0] for r in rows]


@router.get("/summary/by-category", response_model=list[CategorySummary])
def summary_by_category(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Expense.category,
            func.coalesce(func.sum(Expense.amount), 0.0),
            func.count(Expense.id),
        )
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )
    return [CategorySummary(category=r[0], total=float(r[1]), count=int(r[2])) for r in rows]


@router.get("/summary/by-month", response_model=list[MonthlySummary])
def summary_by_month(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    month_expr = func.strftime("%Y-%m", Expense.spent_on)
    rows = (
        db.query(
            month_expr,
            func.coalesce(func.sum(Expense.amount), 0.0),
            func.count(Expense.id),
        )
        .filter(Expense.user_id == current_user.id)
        .group_by(month_expr)
        .order_by(month_expr)
        .all()
    )
    return [MonthlySummary(month=r[0], total=float(r[1]), count=int(r[2])) for r in rows]


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.get(Expense, expense_id)
    if not expense or expense.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.get(Expense, expense_id)
    if not expense or expense.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Expense not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.get(Expense, expense_id)
    if not expense or expense.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
