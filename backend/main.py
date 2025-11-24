from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Complaint Management System API")

origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
    "*", # Allow all origins for Cloudflare Tunnel / GitHub Pages
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import users, complaints, admin, tags
from database import engine, Base

app.include_router(users.router)
app.include_router(complaints.router)
app.include_router(admin.router)
app.include_router(tags.router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Complaint Management System API"}
