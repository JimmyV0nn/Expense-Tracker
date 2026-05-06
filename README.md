# Expense Tracker

Internet Programming - Assignment 2.

A simple web app for tracking personal expenses. Users can sign up, add their
expense items, search/filter them, and see a basic summary by category and
month. Admins can manage user accounts and view activity history.

## Tech

The frontend is built with React, Vite, TypeScript and Tailwind. The backend
uses FastAPI with SQLAlchemy on top of SQLite (the db file lives at
`backend/expense_tracker.db` after seeding). Auth is done with JWT and bcrypt.

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

The API runs on http://localhost:8000. You don't open this in the browser
directly (it's just an API server, the only thing it serves at the root is
a redirect to the Swagger UI at /docs). Keep this terminal running and start
the frontend in another terminal:

```
cd frontend
npm install
npm run dev
```

Now open http://localhost:5173 in the browser. That's the actual app. Vite
will proxy any `/api/*` requests to the backend automatically.

After running the seed script you can log in with `admin / admin123` (admin) or
`demo / demo1234` (normal user).

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

The db file is gitignored, run `python -m app.seed` to recreate it. If you want
to use MySQL instead of SQLite, change `DATABASE_URL` in `backend/.env` and
install the corresponding driver.
