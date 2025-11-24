
import sys
print(sys.executable)
print(sys.path)
import asyncio
from sqlalchemy import select
from backend.database import AsyncSessionLocal, engine
from backend.models import User
from backend.auth import verify_password, get_password_hash

async def check_admin():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == "admin"))
        user = result.scalars().first()
        if user:
            print(f"User 'admin' found. ID: {user.id}")
            # Verify password 'admin'
            is_valid = verify_password("admin", user.password_hash)
            print(f"Password 'admin' is valid: {is_valid}")
        else:
            print("User 'admin' NOT found.")

if __name__ == "__main__":
    asyncio.run(check_admin())
