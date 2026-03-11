from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import schemas, crud, database, auth, models

router = APIRouter(
    prefix="/departments",
    tags=["departments"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[schemas.Department])
async def list_departments(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """List all departments"""
    return await crud.get_departments(db)


@router.post("/", response_model=schemas.Department)
async def create_department(
    department: schemas.DepartmentCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    """Create a new department (admin only)"""
    return await crud.create_department(db=db, department=department)


@router.put("/{department_id}", response_model=schemas.Department)
async def update_department(
    department_id: int,
    department_update: schemas.DepartmentUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    """Update a department (admin only)"""
    db_dept = await crud.update_department(db, department_id=department_id, department_update=department_update)
    if db_dept is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return db_dept


@router.delete("/{department_id}")
async def delete_department(
    department_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    """Delete a department (admin only)"""
    db_dept = await crud.delete_department(db, department_id=department_id)
    if db_dept is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}
