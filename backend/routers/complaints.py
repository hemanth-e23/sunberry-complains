from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import schemas, crud, database, auth, models

router = APIRouter(
    prefix="/complaints",
    tags=["complaints"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Complaint)
async def create_complaint(
    complaint: schemas.ComplaintCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return await crud.create_complaint(db=db, complaint=complaint, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Complaint])
async def read_complaints(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    status: str = None,
    priority: str = None,
    tag_id: int = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return await crud.get_complaints(db, skip=skip, limit=limit, search=search, status=status, priority=priority, tag_id=tag_id)

@router.put("/{complaint_id}", response_model=schemas.Complaint)
async def update_complaint(
    complaint_id: int,
    complaint_update: schemas.ComplaintUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_complaint = await crud.update_complaint(db, complaint_id=complaint_id, complaint_update=complaint_update, user_id=current_user.id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return db_complaint

@router.get("/{complaint_id}", response_model=schemas.Complaint)
async def read_complaint(
    complaint_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_complaint = await crud.get_complaint(db, complaint_id=complaint_id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return db_complaint

@router.get("/{complaint_id}/audit-logs", response_model=List[schemas.AuditLog])
async def read_audit_logs(
    complaint_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return await crud.get_audit_logs(db, complaint_id=complaint_id)

@router.get("/{complaint_id}/comments", response_model=List[schemas.Comment])
async def read_comments(
    complaint_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return await crud.get_comments(db, complaint_id=complaint_id)

@router.post("/{complaint_id}/comments", response_model=schemas.Comment)
async def create_comment(
    complaint_id: int,
    comment: schemas.CommentCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify complaint exists
    db_complaint = await crud.get_complaint(db, complaint_id=complaint_id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return await crud.create_comment(db, comment=comment, complaint_id=complaint_id, user_id=current_user.id)
