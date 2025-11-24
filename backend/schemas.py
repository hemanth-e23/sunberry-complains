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

class ComplaintPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UserBase(BaseModel):
    username: str
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        orm_mode = True

class ComplaintBase(BaseModel):
    title: str
    description: str

class ComplaintCreate(ComplaintBase):
    priority: Optional[ComplaintPriority] = ComplaintPriority.MEDIUM
    tag_ids: Optional[List[int]] = []

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    assigned_to_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None

# Tag schemas
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

    class Config:
        orm_mode = True

class Complaint(ComplaintBase):
    id: int
    status: ComplaintStatus
    priority: ComplaintPriority
    created_by_id: int
    assigned_to_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    tags: List[Tag] = []

    class Config:
        orm_mode = True

class AuditLogBase(BaseModel):
    change_description: str

class AuditLog(AuditLogBase):
    id: int
    complaint_id: int
    changed_by_id: int
    timestamp: datetime

    class Config:
        orm_mode = True

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    complaint_id: int
    user_id: int
    created_at: datetime
    user: Optional[User] = None # To include user details in response

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User management schemas
class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class PasswordReset(BaseModel):
    new_password: str
