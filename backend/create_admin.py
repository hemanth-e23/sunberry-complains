import asyncio
import asyncpg
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def create_admin():
    user = os.environ.get("USER", "postgres")
    conn = await asyncpg.connect(user=user, database='complaints_db', host='localhost')
    
    username = "admin"
    password = "password123"
    hashed_password = get_password_hash(password)
    
    # Check if user exists
    exists = await conn.fetchval("SELECT 1 FROM users WHERE username = $1", username)
    
    if not exists:
        print(f"Creating user '{username}'...")
        await conn.execute(
            "INSERT INTO users (username, password_hash, role, created_at) VALUES ($1, $2, 'admin', NOW())",
            username, hashed_password
        )
        print("User created.")
    else:
        print(f"User '{username}' already exists.")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
