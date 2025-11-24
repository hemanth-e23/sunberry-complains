from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class ComplaintStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

class ComplaintPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    complaints_created = relationship("Complaint", foreign_keys="[Complaint.created_by_id]", back_populates="creator")
    complaints_assigned = relationship("Complaint", foreign_keys="[Complaint.assigned_to_id]", back_populates="assignee")

# Junction table for many-to-many relationship between complaints and tags
complaint_tags = Table(
    'complaint_tags',
    Base.metadata,
    Column('complaint_id', Integer, ForeignKey('complaints.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    status = Column(String, default=ComplaintStatus.OPEN)
    priority = Column(String, default=ComplaintPriority.MEDIUM)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by_id], back_populates="complaints_created")
    assignee = relationship("User", foreign_keys=[assigned_to_id], back_populates="complaints_assigned")
    audit_logs = relationship("AuditLog", back_populates="complaint")
    comments = relationship("Comment", back_populates="complaint")
    tags = relationship("Tag", secondary=complaint_tags, back_populates="complaints")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    changed_by_id = Column(Integer, ForeignKey("users.id"))
    change_description = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="audit_logs")
    changed_by = relationship("User")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="comments")
    user = relationship("User")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    color = Column(String, default="#3B82F6")  # Default blue color
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    complaints = relationship("Complaint", secondary=complaint_tags, back_populates="tags")
