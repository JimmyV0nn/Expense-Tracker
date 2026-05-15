import random
from datetime import date, timedelta

from .core.security import hash_password
from .database import Base, SessionLocal, engine
from .models import Expense, User


SAMPLE_ITEMS = {
    "Food": ["Lunch at cafe", "Grocery run", "Dinner takeaway", "Coffee", "Snacks"],
    "Transport": ["Bus card top-up", "Uber ride", "Petrol", "Train ticket"],
    "Shopping": ["T-shirt", "Headphones", "Notebook", "Sneakers"],
    "Bills": ["Electricity", "Internet", "Phone plan", "Water"],
    "Entertainment": ["Movie ticket", "Concert", "Game subscription", "Streaming"],
    "Health": ["Pharmacy", "Gym membership", "Vitamins"],
    "Education": ["Textbook", "Online course", "Stationery"],
}


def _seed_expenses(db, user, count: int) -> None:
    today = date.today()
    for _ in range(count):
        category = random.choice(list(SAMPLE_ITEMS.keys()))
        title = random.choice(SAMPLE_ITEMS[category])
        amount = round(random.uniform(3, 250), 2)
        spent_on = today - timedelta(days=random.randint(0, 150))
        db.add(
            Expense(
                user_id=user.id,
                title=title,
                category=category,
                amount=amount,
                spent_on=spent_on,
                description="",
            )
        )


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded.")
            return

        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=hash_password("admin123"),
            is_admin=True,
        )
        demo = User(
            username="demo",
            email="demo@example.com",
            hashed_password=hash_password("demo1234"),
        )
        alice = User(username="alice", email="alice@example.com", hashed_password=hash_password("alice1234"))
        bob = User(username="bob", email="bob@example.com", hashed_password=hash_password("bob1234"))
        charlie = User(username="charlie", email="charlie@example.com", hashed_password=hash_password("charlie1234"))
        diana = User(username="diana", email="diana@example.com", hashed_password=hash_password("diana1234"))
        evan = User(username="evan", email="evan@example.com", hashed_password=hash_password("evan1234"))
        fiona = User(username="fiona", email="fiona@example.com", hashed_password=hash_password("fiona1234"))
        george = User(username="george", email="george@example.com", hashed_password=hash_password("george1234"))
        hannah = User(username="hannah", email="hannah@example.com", hashed_password=hash_password("hannah1234"))
        ivan = User(username="ivan", email="ivan@example.com", hashed_password=hash_password("ivan1234"))
        julia = User(username="julia", email="julia@example.com", hashed_password=hash_password("julia1234"))
        kevin = User(username="kevin", email="kevin@example.com", hashed_password=hash_password("kevin1234"))
        laura = User(username="laura", email="laura@example.com", hashed_password=hash_password("laura1234"))
        michael = User(username="michael", email="michael@example.com", hashed_password=hash_password("michael1234"))
        db.add_all([admin, demo, alice, bob, charlie, diana, evan, fiona, george, hannah, ivan, julia, kevin, laura, michael])
        db.add_all([admin, demo])
        db.commit()
        db.refresh(admin)
        db.refresh(demo)

        random.seed(42)
        _seed_expenses(db, admin, 40)
        _seed_expenses(db, demo, 60)
        db.commit()

        print("Seeded users: admin/admin123, demo/demo1234")
    finally:
        db.close()


if __name__ == "__main__":
    run()
