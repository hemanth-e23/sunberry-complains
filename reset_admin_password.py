
import asyncio
from backend.database import AsyncSessionLocal
from backend.models import User
from backend.auth import get_password_hash
from sqlalchemy import select

async def reset_password():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == "admin"))
        user = result.scalars().first()
        if user:
            print(f"User 'admin' found. ID: {user.id}")
            new_hash = get_password_hash("admin")
            user.password_hash = new_hash
            await session.commit()
            print("Password reset to 'admin'.")
        else:
            print("User 'admin' NOT found.")

if __name__ == "__main__":
    asyncio.run(reset_password())
