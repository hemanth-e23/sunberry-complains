from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import schemas, crud, database, auth, models

router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.User])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """List all users (admin only)"""
    return await crud.get_users(db, skip=skip, limit=limit, search=search)

@router.post("/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Create a new user (admin only)"""
    db_user = await crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return await crud.create_user(db=db, user=user)

@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Update user details (admin only)"""
    db_user = await crud.update_user(db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/{user_id}/reset-password", response_model=schemas.User)
async def reset_password(
    user_id: int,
    password_reset: schemas.PasswordReset,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Reset user password (admin only)"""
    db_user = await crud.reset_user_password(db, user_id=user_id, new_password=password_reset.new_password)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/{user_id}/toggle-status", response_model=schemas.User)
async def toggle_status(
    user_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Toggle user active/inactive status (admin only)"""
    db_user = await crud.toggle_user_status(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
