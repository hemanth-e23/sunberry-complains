import asyncio
from sqlalchemy import text
from database import engine

async def migrate_database():
    """Add new columns and tables for user management, priority, and tags features"""
    
    async with engine.begin() as conn:
        print("Starting database migration...")
        
        # Add new columns to users table
        try:
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
            """))
            print("✓ Added new columns to users table")
        except Exception as e:
            print(f"Users table columns: {e}")
        
        # Add priority column to complaints table
        try:
            await conn.execute(text("""
                ALTER TABLE complaints 
                ADD COLUMN IF NOT EXISTS priority VARCHAR DEFAULT 'medium';
            """))
            print("✓ Added priority column to complaints table")
        except Exception as e:
            print(f"Complaints priority column: {e}")
        
        # Create tags table
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS tags (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR UNIQUE NOT NULL,
                    color VARCHAR DEFAULT '#3B82F6',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            print("✓ Created tags table")
        except Exception as e:
            print(f"Tags table: {e}")
        
        # Create complaint_tags junction table
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS complaint_tags (
                    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
                    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                    PRIMARY KEY (complaint_id, tag_id)
                );
            """))
            print("✓ Created complaint_tags junction table")
        except Exception as e:
            print(f"Complaint_tags table: {e}")
        
        # Update existing users to be active
        try:
            await conn.execute(text("""
                UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
            """))
            print("✓ Updated existing users to active status")
        except Exception as e:
            print(f"Update users: {e}")
        
        print("\n✅ Database migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate_database())
