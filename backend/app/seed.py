from .core.security import hash_password
from .database import Base, SessionLocal, engine
from .models import User


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded.")
            return

        db.add_all([
            User(
                username="admin",
                email="admin@example.com",
                hashed_password=hash_password("admin123"),
                is_admin=True,
            ),
            User(
                username="demo",
                email="demo@example.com",
                hashed_password=hash_password("demo1234"),
            ),
        ])
        db.commit()
        print("Seeded users: admin/admin123, demo/demo1234")
    finally:
        db.close()


if __name__ == "__main__":
    run()
