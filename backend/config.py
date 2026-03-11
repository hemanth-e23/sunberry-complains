import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (one level up from backend/)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- Database ---
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file.")

# --- JWT Auth ---
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set. Check your .env file.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# --- CORS ---
_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
CORS_ORIGINS = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]
