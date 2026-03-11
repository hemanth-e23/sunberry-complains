from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import schemas, crud, database, auth, models
import os
import uuid

# Directory for uploaded files
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- File upload constraints ---
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB per file
MAX_FILES_PER_UPLOAD = 5  # Max photos per request

router = APIRouter(
    prefix="/complaints",
    tags=["complaints"],
    responses={404: {"description": "Not found"}},
)


def validate_upload_file(file: UploadFile):
    """Validate file type and extension before saving. Raises HTTPException if invalid."""
    # Check content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' is not allowed. Only images are accepted (JPG, PNG, GIF, WebP)."
        )

    # Check file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' is not allowed. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


async def save_upload_file(file: UploadFile, subfolder: str = "") -> dict:
    """Validate, save an uploaded file, and return metadata"""
    # Validate file type and extension
    validate_upload_file(file)

    # Read content and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        size_mb = round(len(content) / (1024 * 1024), 1)
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is {size_mb}MB. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{ext}"

    # Create subfolder if needed
    save_dir = os.path.join(UPLOAD_DIR, subfolder) if subfolder else UPLOAD_DIR
    os.makedirs(save_dir, exist_ok=True)

    filepath = os.path.join(save_dir, unique_name)

    # Save file
    with open(filepath, "wb") as f:
        f.write(content)

    return {
        "filename": file.filename,
        "filepath": filepath,
        "file_size": len(content),
        "content_type": file.content_type,
    }


# --- Create complaint (supports JSON or multipart) ---

@router.post("/", response_model=schemas.Complaint)
async def create_complaint(
    title: str = Form(None),
    description: str = Form(None),
    product_name: Optional[str] = Form(None),
    lot_number: Optional[str] = Form(None),
    issue_type: Optional[str] = Form(None),
    priority: Optional[str] = Form("medium"),
    department_id: Optional[int] = Form(None),
    tag_ids: Optional[List[int]] = Form(None),
    photos: Optional[List[UploadFile]] = File(None),
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    # Validate required fields
    if not title or not description:
        raise HTTPException(status_code=400, detail="Title and description are required")

    # Create complaint schema
    complaint_data = schemas.ComplaintCreate(
        title=title,
        description=description,
        product_name=product_name,
        lot_number=lot_number,
        issue_type=issue_type,
        priority=priority or "medium",
        department_id=department_id,
        tag_ids=tag_ids or [],
    )

    db_complaint = await crud.create_complaint(db=db, complaint=complaint_data, user_id=current_user.id)

    # Handle photo uploads
    if photos:
        valid_photos = [p for p in photos if p.filename]
        if len(valid_photos) > MAX_FILES_PER_UPLOAD:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {MAX_FILES_PER_UPLOAD} photos allowed per upload. You sent {len(valid_photos)}."
            )
        for photo in valid_photos:
            file_info = await save_upload_file(photo, subfolder=f"complaints/{db_complaint.id}")
            await crud.create_attachment(
                db=db,
                filename=file_info["filename"],
                filepath=file_info["filepath"],
                file_size=file_info["file_size"],
                content_type=file_info["content_type"],
                complaint_id=db_complaint.id,
                uploaded_by_id=current_user.id,
            )

    # Re-fetch to include attachments
    return await crud.get_complaint(db, db_complaint.id)


@router.get("/", response_model=List[schemas.Complaint])
async def read_complaints(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    status: str = None,
    priority: str = None,
    tag_id: int = None,
    department_id: int = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return await crud.get_complaints(
        db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        priority=priority,
        tag_id=tag_id,
        department_id=department_id,
    )


@router.get("/{complaint_id}", response_model=schemas.Complaint)
async def read_complaint(
    complaint_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_complaint = await crud.get_complaint(db, complaint_id=complaint_id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return db_complaint


@router.put("/{complaint_id}", response_model=schemas.Complaint)
async def update_complaint(
    complaint_id: int,
    complaint_update: schemas.ComplaintUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_complaint = await crud.get_complaint(db, complaint_id=complaint_id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    is_admin = current_user.role == "admin"
    update_data = complaint_update.model_dump(exclude_unset=True)

    # Non-admin users can only change the status field
    if not is_admin:
        non_status_fields = {k for k in update_data if k != "status"}
        if non_status_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can edit complaint details. You can only update the status."
            )

    # Only admins can close a ticket or reopen a closed one
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == schemas.ComplaintStatus.CLOSED and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can close a complaint."
            )
        if db_complaint.status == schemas.ComplaintStatus.CLOSED and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can reopen a closed complaint."
            )

    return await crud.update_complaint(
        db, complaint_id=complaint_id, complaint_update=complaint_update, user_id=current_user.id
    )


# --- Attachments ---

@router.get("/{complaint_id}/attachments", response_model=List[schemas.Attachment])
async def read_attachments(
    complaint_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return await crud.get_attachments(db, complaint_id=complaint_id)


@router.get("/{complaint_id}/attachments/{attachment_id}")
async def get_attachment_file(
    complaint_id: int,
    attachment_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    attachment = await crud.get_attachment(db, attachment_id=attachment_id)
    if not attachment or attachment.complaint_id != complaint_id:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if not os.path.exists(attachment.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        attachment.filepath,
        media_type=attachment.content_type,
        filename=attachment.filename,
    )


# --- Audit Logs ---

@router.get("/{complaint_id}/audit-logs", response_model=List[schemas.AuditLog])
async def read_audit_logs(
    complaint_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return await crud.get_audit_logs(db, complaint_id=complaint_id)


# --- Comments ---

@router.get("/{complaint_id}/comments", response_model=List[schemas.Comment])
async def read_comments(
    complaint_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return await crud.get_comments(db, complaint_id=complaint_id)


@router.post("/{complaint_id}/comments", response_model=schemas.Comment)
async def create_comment(
    complaint_id: int,
    content: str = Form(""),
    photos: Optional[List[UploadFile]] = File(None),
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Verify complaint exists
    db_complaint = await crud.get_complaint(db, complaint_id=complaint_id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Create comment
    db_comment = await crud.create_comment(
        db, content=content, complaint_id=complaint_id, user_id=current_user.id
    )

    # Handle photo uploads
    if photos:
        valid_photos = [p for p in photos if p.filename]
        if len(valid_photos) > MAX_FILES_PER_UPLOAD:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {MAX_FILES_PER_UPLOAD} photos allowed per upload. You sent {len(valid_photos)}."
            )
        for photo in valid_photos:
            file_info = await save_upload_file(photo, subfolder=f"comments/{db_comment.id}")
            await crud.create_attachment(
                db=db,
                filename=file_info["filename"],
                filepath=file_info["filepath"],
                file_size=file_info["file_size"],
                content_type=file_info["content_type"],
                complaint_id=complaint_id,
                comment_id=db_comment.id,
                uploaded_by_id=current_user.id,
            )

    # Re-fetch comment with attachments
    from sqlalchemy.orm import selectinload
    from sqlalchemy import select
    result = await db.execute(
        select(models.Comment)
        .options(
            selectinload(models.Comment.user),
            selectinload(models.Comment.attachments),
        )
        .where(models.Comment.id == db_comment.id)
    )
    return result.scalars().first()


# --- Comment Attachment serving ---

@router.get("/{complaint_id}/comments/{comment_id}/attachments/{attachment_id}")
async def get_comment_attachment_file(
    complaint_id: int,
    comment_id: int,
    attachment_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    attachment = await crud.get_attachment(db, attachment_id=attachment_id)
    if not attachment or attachment.comment_id != comment_id:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if not os.path.exists(attachment.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        attachment.filepath,
        media_type=attachment.content_type,
        filename=attachment.filename,
    )
