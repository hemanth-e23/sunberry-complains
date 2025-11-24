from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import schemas, crud, database, auth, models

router = APIRouter(
    prefix="/tags",
    tags=["tags"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.Tag])
async def list_tags(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """List all tags"""
    return await crud.get_tags(db)

@router.post("/", response_model=schemas.Tag)
async def create_tag(
    tag: schemas.TagCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new tag"""
    return await crud.create_tag(db=db, tag=tag)

@router.put("/{tag_id}", response_model=schemas.Tag)
async def update_tag(
    tag_id: int,
    tag_update: schemas.TagUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update a tag"""
    db_tag = await crud.update_tag(db, tag_id=tag_id, tag_update=tag_update)
    if db_tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return db_tag

@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a tag"""
    db_tag = await crud.delete_tag(db, tag_id=tag_id)
    if db_tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted successfully"}
