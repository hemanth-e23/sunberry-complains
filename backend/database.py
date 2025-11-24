from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

user = os.environ.get("USER", "postgres")
# Assuming no password for local dev on Mac, or change as needed
DATABASE_URL = os.getenv("DATABASE_URL", f"postgresql+asyncpg://{user}@localhost/complaints_db")

# Fallback to postgres user if needed (commented out)
# DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/complaints_db"

engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
