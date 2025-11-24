import asyncio
import asyncpg
import os

async def create_database():
    user = os.environ.get("USER", "postgres")
    print(f"Trying to connect with user: {user}")
    
    try:
        # Try connecting with system user and no password
        conn = await asyncpg.connect(user=user, database='postgres', host='localhost')
    except Exception as e:
        print(f"Failed with user {user}: {e}")
        try:
            # Try connecting with postgres user and postgres password
            conn = await asyncpg.connect(user='postgres', password='postgres', database='postgres', host='localhost')
        except Exception as e2:
            print(f"Failed with postgres user: {e2}")
            return

    # Check if database exists
    exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'complaints_db'")
    
    if not exists:
        print("Creating database 'complaints_db'...")
        await conn.execute('CREATE DATABASE complaints_db')
    else:
        print("Database 'complaints_db' already exists.")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(create_database())
