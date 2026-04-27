# Expense Tracker

Internet Programming - Assignment 2.

A simple web app for tracking personal expenses. Users can sign up, add their
expense items, search/filter them, and see a basic summary by category and
month. Admins can manage user accounts and view activity history.

## Tech

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: FastAPI + SQLAlchemy
- Database: SQLite (the file lives at `backend/expense_tracker.db` after seeding)
- Auth: JWT + bcrypt

## How to run

You need Python 3.11+ and Node.js 18+.

Backend:

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m app.seed
uvicorn app.main:app --reload
```

The API runs on http://localhost:8000 (Swagger UI at /docs).

Frontend (in another terminal):

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

After running the seed script you can log in with:

- admin / admin123 (admin account)
- demo / demo1234 (normal user)

## Files

```
backend/
  app/
    core/       password hashing, JWT, auth dependencies
    models/     database tables
    routers/    api endpoints
    schemas/    request/response shapes
    main.py     app entry point
    seed.py     creates the two default users
frontend/
  src/
    api/        axios client
    components/ shared layout / navbar / route guard
    pages/      Login, Register, Dashboard, Expenses, Analytics, Admin
    stores/     auth state (zustand)
  index.html
```

## Notes

- The DB file is gitignored. Run `python -m app.seed` to recreate it.
- If you want to use MySQL instead of SQLite, change `DATABASE_URL` in
  `backend/.env` and install the corresponding driver.
