from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class ComplaintStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ComplaintPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# --- User Schemas ---

class UserBase(BaseModel):
    username: str
    role: UserRole = UserRole.USER


class UserCreate(UserBase):
    password: str
    is_superuser: bool = False


class User(UserBase):
    id: int
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class PasswordReset(BaseModel):
    new_password: str


# --- Department Schemas ---

class DepartmentBase(BaseModel):
    name: str
    color: str = "#3B82F6"


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class Department(DepartmentBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Tag Schemas ---

class TagBase(BaseModel):
    name: str
    color: str = "#3B82F6"


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class Tag(TagBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Attachment Schemas ---

class Attachment(BaseModel):
    id: int
    filename: str
    file_size: Optional[int] = None
    content_type: Optional[str] = None
    complaint_id: Optional[int] = None
    comment_id: Optional[int] = None
    uploaded_by_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Complaint Schemas ---

class ComplaintBase(BaseModel):
    title: str
    description: str


class ComplaintCreate(ComplaintBase):
    product_name: Optional[str] = None
    lot_number: Optional[str] = None
    issue_type: Optional[str] = None
    priority: Optional[ComplaintPriority] = ComplaintPriority.MEDIUM
    department_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []


class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    product_name: Optional[str] = None
    lot_number: Optional[str] = None
    issue_type: Optional[str] = None
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    department_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class Complaint(ComplaintBase):
    id: int
    product_name: Optional[str] = None
    lot_number: Optional[str] = None
    issue_type: Optional[str] = None
    status: ComplaintStatus
    priority: ComplaintPriority
    created_by_id: int
    department_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    tags: List[Tag] = []
    department: Optional[Department] = None
    creator: Optional[User] = None
    comments_count: int = 0
    attachments_count: int = 0

    model_config = {"from_attributes": True}


# --- Audit Log Schemas ---

class AuditLogBase(BaseModel):
    change_description: str


class AuditLog(AuditLogBase):
    id: int
    complaint_id: int
    changed_by_id: int
    timestamp: datetime
    changed_by: Optional[User] = None

    model_config = {"from_attributes": True}


# --- Comment Schemas ---

class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class Comment(CommentBase):
    id: int
    complaint_id: int
    user_id: int
    created_at: datetime
    user: Optional[User] = None
    attachments: List[Attachment] = []

    model_config = {"from_attributes": True}


# --- Auth Schemas ---

class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[User] = None


class TokenData(BaseModel):
    username: Optional[str] = None
