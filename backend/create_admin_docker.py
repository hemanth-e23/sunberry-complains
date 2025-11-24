import asyncio
import asyncpg
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def create_admin():
    # For Docker, use the connection details from docker-compose
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:sunberry_secure_password_change_me@localhost:5433/sunberry")
    
    # Parse the URL (simple approach)
    # postgresql://user:pass@host:port/db
    conn = await asyncpg.connect(database_url.replace("postgresql+asyncpg://", "postgresql://"))
    
    username = "admin"
    password = "admin"
    hashed_password = get_password_hash(password)
    
    # Check if user exists
    exists = await conn.fetchval("SELECT 1 FROM users WHERE username = $1", username)
    
    if not exists:
        print(f"Creating admin user '{username}'...")
        await conn.execute(
            "INSERT INTO users (username, password_hash, role, is_active, created_at) VALUES ($1, $2, 'admin', true, NOW())",
            username, hashed_password
        )
        print("✅ Admin user created successfully!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
    else:
        print(f"⚠️  User '{username}' already exists.")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
