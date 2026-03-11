from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from config import CORS_ORIGINS


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: (nothing needed)


app = FastAPI(title="Sunberry Complaint Management System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import users, complaints, admin, tags, departments

app.include_router(users.router)
app.include_router(complaints.router)
app.include_router(admin.router)
app.include_router(tags.router)
app.include_router(departments.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Sunberry Complaint Management System API"}
