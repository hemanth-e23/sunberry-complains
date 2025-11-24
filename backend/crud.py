from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from sqlalchemy.orm import selectinload
import models, schemas, auth

async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    return result.scalars().first()

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(models.User).where(models.User.username == username))
    return result.scalars().first()

async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, password_hash=hashed_password, role=user.role)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_complaints(db: AsyncSession, skip: int = 0, limit: int = 100, search: str = None, status: str = None, priority: str = None, tag_id: int = None):
    query = select(models.Complaint).options(selectinload(models.Complaint.tags))
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (models.Complaint.title.ilike(search_filter)) | 
            (models.Complaint.description.ilike(search_filter))
        )
    
    if status:
        query = query.where(models.Complaint.status == status)
    
    if priority:
        query = query.where(models.Complaint.priority == priority)
    
    if tag_id:
        query = query.join(models.Complaint.tags).where(models.Tag.id == tag_id)
        
    query = query.offset(skip).limit(limit).order_by(models.Complaint.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

async def get_complaint(db: AsyncSession, complaint_id: int):
    result = await db.execute(
        select(models.Complaint)
        .options(selectinload(models.Complaint.tags))
        .where(models.Complaint.id == complaint_id)
    )
    return result.scalars().first()

async def get_audit_logs(db: AsyncSession, complaint_id: int):
    result = await db.execute(select(models.AuditLog).where(models.AuditLog.complaint_id == complaint_id).order_by(models.AuditLog.timestamp.desc()))
    return result.scalars().all()

async def create_complaint(db: AsyncSession, complaint: schemas.ComplaintCreate, user_id: int):
    # Extract tag_ids before creating complaint
    tag_ids = complaint.tag_ids if complaint.tag_ids else []
    complaint_data = complaint.dict(exclude={'tag_ids'})
    
    # Handle Enum conversion if necessary
    if 'priority' in complaint_data and hasattr(complaint_data['priority'], 'value'):
        complaint_data['priority'] = complaint_data['priority'].value
    
    db_complaint = models.Complaint(**complaint_data, created_by_id=user_id)
    
    # Add tags if provided
    if tag_ids:
        tags_result = await db.execute(select(models.Tag).where(models.Tag.id.in_(tag_ids)))
        tags = tags_result.scalars().all()
        db_complaint.tags = tags
    
    db.add(db_complaint)
    await db.commit()
    
    # Eagerly load tags on refresh
    result = await db.execute(
        select(models.Complaint)
        .options(selectinload(models.Complaint.tags))
        .where(models.Complaint.id == db_complaint.id)
    )
    return result.scalars().first()

async def update_complaint(db: AsyncSession, complaint_id: int, complaint_update: schemas.ComplaintUpdate, user_id: int):
    # Fetch existing complaint
    result = await db.execute(
        select(models.Complaint)
        .options(selectinload(models.Complaint.tags))
        .where(models.Complaint.id == complaint_id)
    )
    db_complaint = result.scalars().first()
    
    if not db_complaint:
        return None

    # Extract tag_ids before updating
    tag_ids = complaint_update.tag_ids if complaint_update.tag_ids is not None else None
    update_data = complaint_update.dict(exclude_unset=True, exclude={'tag_ids'})
    
    # Update fields
    for key, value in update_data.items():
        setattr(db_complaint, key, value)
    
    # Update tags if provided
    if tag_ids is not None:
        tags_result = await db.execute(select(models.Tag).where(models.Tag.id.in_(tag_ids)))
        tags = tags_result.scalars().all()
        db_complaint.tags = tags
        update_data['tags'] = f"{len(tag_ids)} tags"
    
    # Create audit log
    audit_log = models.AuditLog(
        complaint_id=complaint_id,
        changed_by_id=user_id,
        change_description=f"Updated: {', '.join(update_data.keys())}"
    )
    db.add(audit_log)
    
    await db.commit()
    
    # Refresh with eager loading
    result = await db.execute(
        select(models.Complaint)
        .options(selectinload(models.Complaint.tags))
        .where(models.Complaint.id == complaint_id)
    )
    return result.scalars().first()

async def get_comments(db: AsyncSession, complaint_id: int):
    result = await db.execute(
        select(models.Comment)
        .where(models.Comment.complaint_id == complaint_id)
        .order_by(models.Comment.created_at.desc())
    )
    comments = result.scalars().all()
    
    # Fetch user details for each comment
    for comment in comments:
        user_result = await db.execute(select(models.User).where(models.User.id == comment.user_id))
        comment.user = user_result.scalars().first()
    
    return comments

async def create_comment(db: AsyncSession, comment: schemas.CommentCreate, complaint_id: int, user_id: int):
    db_comment = models.Comment(
        complaint_id=complaint_id,
        user_id=user_id,
        content=comment.content
    )
    db.add(db_comment)
    await db.commit()
    await db.refresh(db_comment)
    
    # Fetch user details
    user_result = await db.execute(select(models.User).where(models.User.id == user_id))
    db_comment.user = user_result.scalars().first()
    
    return db_comment

# User Management CRUD
async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100, search: str = None):
    query = select(models.User)
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(models.User.username.ilike(search_filter))
    
    query = query.offset(skip).limit(limit).order_by(models.User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

async def update_user(db: AsyncSession, user_id: int, user_update: schemas.UserUpdate):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    db_user = result.scalars().first()
    
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def reset_user_password(db: AsyncSession, user_id: int, new_password: str):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    db_user = result.scalars().first()
    
    if not db_user:
        return None
    
    db_user.password_hash = auth.get_password_hash(new_password)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def toggle_user_status(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    db_user = result.scalars().first()
    
    if not db_user:
        return None
    
    db_user.is_active = not db_user.is_active
    await db.commit()
    await db.refresh(db_user)
    return db_user

# Tag CRUD
async def get_tags(db: AsyncSession):
    result = await db.execute(select(models.Tag).order_by(models.Tag.name))
    return result.scalars().all()

async def get_tag(db: AsyncSession, tag_id: int):
    result = await db.execute(select(models.Tag).where(models.Tag.id == tag_id))
    return result.scalars().first()

async def create_tag(db: AsyncSession, tag: schemas.TagCreate):
    db_tag = models.Tag(**tag.dict())
    db.add(db_tag)
    await db.commit()
    await db.refresh(db_tag)
    return db_tag

async def update_tag(db: AsyncSession, tag_id: int, tag_update: schemas.TagUpdate):
    result = await db.execute(select(models.Tag).where(models.Tag.id == tag_id))
    db_tag = result.scalars().first()
    
    if not db_tag:
        return None
    
    update_data = tag_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tag, key, value)
    
    await db.commit()
    await db.refresh(db_tag)
    return db_tag

async def delete_tag(db: AsyncSession, tag_id: int):
    result = await db.execute(select(models.Tag).where(models.Tag.id == tag_id))
    db_tag = result.scalars().first()
    
    if not db_tag:
        return None
    
    await db.delete(db_tag)
    await db.commit()
    return db_tag
