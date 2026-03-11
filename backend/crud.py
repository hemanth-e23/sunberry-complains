from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
import models, schemas, auth


# --- User CRUD ---

async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    return result.scalars().first()


async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(models.User).where(models.User.username == username))
    return result.scalars().first()


async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        role=user.role,
        is_superuser=user.is_superuser,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100, search: str = None):
    query = select(models.User)
    if search:
        query = query.where(models.User.username.ilike(f"%{search}%"))
    query = query.offset(skip).limit(limit).order_by(models.User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def update_user(db: AsyncSession, user_id: int, user_update: schemas.UserUpdate):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    db_user = result.scalars().first()
    if not db_user:
        return None
    update_data = user_update.model_dump(exclude_unset=True)
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


# --- Department CRUD ---

async def get_departments(db: AsyncSession):
    result = await db.execute(select(models.Department).order_by(models.Department.name))
    return result.scalars().all()


async def get_department(db: AsyncSession, department_id: int):
    result = await db.execute(select(models.Department).where(models.Department.id == department_id))
    return result.scalars().first()


async def create_department(db: AsyncSession, department: schemas.DepartmentCreate):
    db_dept = models.Department(**department.model_dump())
    db.add(db_dept)
    await db.commit()
    await db.refresh(db_dept)
    return db_dept


async def update_department(db: AsyncSession, department_id: int, department_update: schemas.DepartmentUpdate):
    result = await db.execute(select(models.Department).where(models.Department.id == department_id))
    db_dept = result.scalars().first()
    if not db_dept:
        return None
    update_data = department_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_dept, key, value)
    await db.commit()
    await db.refresh(db_dept)
    return db_dept


async def delete_department(db: AsyncSession, department_id: int):
    result = await db.execute(select(models.Department).where(models.Department.id == department_id))
    db_dept = result.scalars().first()
    if not db_dept:
        return None
    await db.delete(db_dept)
    await db.commit()
    return db_dept


# --- Complaint CRUD ---

def _complaint_query():
    """Base query with eager loading for complaints"""
    return (
        select(models.Complaint)
        .options(
            selectinload(models.Complaint.tags),
            selectinload(models.Complaint.department),
            selectinload(models.Complaint.creator),
            selectinload(models.Complaint.comments),
            selectinload(models.Complaint.attachments),
        )
    )


async def get_complaints(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    status: str = None,
    priority: str = None,
    tag_id: int = None,
    department_id: int = None,
):
    query = _complaint_query()

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (models.Complaint.title.ilike(search_filter)) |
            (models.Complaint.description.ilike(search_filter)) |
            (models.Complaint.product_name.ilike(search_filter)) |
            (models.Complaint.lot_number.ilike(search_filter)) |
            (models.Complaint.issue_type.ilike(search_filter))
        )

    if status:
        query = query.where(models.Complaint.status == status)

    if priority:
        query = query.where(models.Complaint.priority == priority)

    if tag_id:
        query = query.join(models.Complaint.tags).where(models.Tag.id == tag_id)

    if department_id:
        query = query.where(models.Complaint.department_id == department_id)

    query = query.offset(skip).limit(limit).order_by(models.Complaint.created_at.desc())
    result = await db.execute(query)
    complaints = result.unique().scalars().all()

    # Add computed counts
    for complaint in complaints:
        complaint.comments_count = len(complaint.comments) if complaint.comments else 0
        complaint.attachments_count = len([a for a in (complaint.attachments or []) if a.comment_id is None])

    return complaints


async def get_complaint(db: AsyncSession, complaint_id: int):
    result = await db.execute(
        _complaint_query().where(models.Complaint.id == complaint_id)
    )
    complaint = result.unique().scalars().first()
    if complaint:
        complaint.comments_count = len(complaint.comments) if complaint.comments else 0
        complaint.attachments_count = len([a for a in (complaint.attachments or []) if a.comment_id is None])
    return complaint


async def create_complaint(db: AsyncSession, complaint: schemas.ComplaintCreate, user_id: int):
    tag_ids = complaint.tag_ids if complaint.tag_ids else []
    complaint_data = complaint.model_dump(exclude={'tag_ids'})

    # Handle Enum conversion
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

    # Re-fetch with eager loading
    return await get_complaint(db, db_complaint.id)


async def update_complaint(db: AsyncSession, complaint_id: int, complaint_update: schemas.ComplaintUpdate, user_id: int):
    result = await db.execute(
        _complaint_query().where(models.Complaint.id == complaint_id)
    )
    db_complaint = result.unique().scalars().first()

    if not db_complaint:
        return None

    tag_ids = complaint_update.tag_ids if complaint_update.tag_ids is not None else None
    update_data = complaint_update.model_dump(exclude_unset=True, exclude={'tag_ids'})

    # Handle Enum conversion
    for key in ['status', 'priority']:
        if key in update_data and hasattr(update_data[key], 'value'):
            update_data[key] = update_data[key].value

    # Track changes for audit log
    changes = []
    for key, value in update_data.items():
        old_value = getattr(db_complaint, key, None)
        if str(old_value) != str(value):
            changes.append(f"{key}: {old_value} → {value}")
        setattr(db_complaint, key, value)

    # Update tags if provided
    if tag_ids is not None:
        tags_result = await db.execute(select(models.Tag).where(models.Tag.id.in_(tag_ids)))
        tags = tags_result.scalars().all()
        db_complaint.tags = tags
        changes.append(f"tags updated ({len(tag_ids)} tags)")

    # Create audit log if there are changes
    if changes:
        audit_log = models.AuditLog(
            complaint_id=complaint_id,
            changed_by_id=user_id,
            change_description=", ".join(changes)
        )
        db.add(audit_log)

    await db.commit()
    return await get_complaint(db, complaint_id)


# --- Audit Log CRUD ---

async def get_audit_logs(db: AsyncSession, complaint_id: int):
    result = await db.execute(
        select(models.AuditLog)
        .options(selectinload(models.AuditLog.changed_by))
        .where(models.AuditLog.complaint_id == complaint_id)
        .order_by(models.AuditLog.timestamp.desc())
    )
    return result.scalars().all()


# --- Comment CRUD ---

async def get_comments(db: AsyncSession, complaint_id: int):
    result = await db.execute(
        select(models.Comment)
        .options(
            selectinload(models.Comment.user),
            selectinload(models.Comment.attachments),
        )
        .where(models.Comment.complaint_id == complaint_id)
        .order_by(models.Comment.created_at.asc())
    )
    return result.scalars().all()


async def create_comment(db: AsyncSession, content: str, complaint_id: int, user_id: int):
    db_comment = models.Comment(
        complaint_id=complaint_id,
        user_id=user_id,
        content=content
    )
    db.add(db_comment)
    await db.commit()
    await db.refresh(db_comment)

    # Re-fetch with eager loading
    result = await db.execute(
        select(models.Comment)
        .options(
            selectinload(models.Comment.user),
            selectinload(models.Comment.attachments),
        )
        .where(models.Comment.id == db_comment.id)
    )
    return result.scalars().first()


# --- Tag CRUD ---

async def get_tags(db: AsyncSession):
    result = await db.execute(select(models.Tag).order_by(models.Tag.name))
    return result.scalars().all()


async def get_tag(db: AsyncSession, tag_id: int):
    result = await db.execute(select(models.Tag).where(models.Tag.id == tag_id))
    return result.scalars().first()


async def create_tag(db: AsyncSession, tag: schemas.TagCreate):
    db_tag = models.Tag(**tag.model_dump())
    db.add(db_tag)
    await db.commit()
    await db.refresh(db_tag)
    return db_tag


async def update_tag(db: AsyncSession, tag_id: int, tag_update: schemas.TagUpdate):
    result = await db.execute(select(models.Tag).where(models.Tag.id == tag_id))
    db_tag = result.scalars().first()
    if not db_tag:
        return None
    update_data = tag_update.model_dump(exclude_unset=True)
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


# --- Attachment CRUD ---

async def create_attachment(
    db: AsyncSession,
    filename: str,
    filepath: str,
    file_size: int,
    content_type: str,
    uploaded_by_id: int,
    complaint_id: int = None,
    comment_id: int = None,
):
    db_attachment = models.Attachment(
        filename=filename,
        filepath=filepath,
        file_size=file_size,
        content_type=content_type,
        complaint_id=complaint_id,
        comment_id=comment_id,
        uploaded_by_id=uploaded_by_id,
    )
    db.add(db_attachment)
    await db.commit()
    await db.refresh(db_attachment)
    return db_attachment


async def get_attachments(db: AsyncSession, complaint_id: int):
    """Get all direct attachments for a complaint (not comment attachments)"""
    result = await db.execute(
        select(models.Attachment)
        .where(
            models.Attachment.complaint_id == complaint_id,
            models.Attachment.comment_id.is_(None),
        )
        .order_by(models.Attachment.created_at.asc())
    )
    return result.scalars().all()


async def get_attachment(db: AsyncSession, attachment_id: int):
    result = await db.execute(
        select(models.Attachment).where(models.Attachment.id == attachment_id)
    )
    return result.scalars().first()
