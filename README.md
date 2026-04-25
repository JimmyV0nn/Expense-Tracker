# Expense Tracker

Web app that lets users record and review their daily spending.

Stack: React + Vite + TypeScript + Tailwind on the frontend; FastAPI + SQLAlchemy +
SQLite on the backend; JWT for auth.

## Project layout

```
backend/
  app/
    core/       security and auth dependencies
    models/     SQLAlchemy models
    routers/    API endpoints
    schemas/    Pydantic schemas
    config.py
    database.py
    main.py
    seed.py
  requirements.txt
  .env.example
frontend/
  src/
    api/        axios client
    components/ Layout, Navbar, ProtectedRoute
    pages/      Login, Register, Dashboard, Expenses, Analytics, Admin
    stores/     auth store
    types/
    App.tsx
    main.tsx
  index.html
  package.json
```

## Run

Backend:

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

API docs at http://localhost:8000/docs.

Frontend:

```
cd frontend
npm install
npm run dev
```

App at http://localhost:5173. Vite proxies `/api/*` to the backend on port 8000.

Default accounts after seeding: `admin / admin123` and `demo / demo1234`.

## Switching the database

Set `DATABASE_URL` in `backend/.env`. Examples:

```
DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/expense_tracker
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/expense_tracker
```

For non-SQLite databases, change the monthly summary expression from
`strftime('%Y-%m', spent_on)` to the equivalent in your database.
