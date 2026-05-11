from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: str = "employee"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_hours: Optional[int] = None

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# SOP Schemas
class SOPBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: str
    version: str = "1.0"

class SOPCreate(SOPBase):
    pass

class SOPResponse(SOPBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Quiz Schemas
class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    passing_score: float = 70.0
    max_attempts: int = 3

class QuizCreate(QuizBase):
    course_id: int

class QuizResponse(QuizBase):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Authentication
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# Notification Schemas
class NotificationCreate(BaseModel):
    user_id: int
    notification_type: str
    channel: str = "in_app"
    title: str
    message: str
    related_course_id: Optional[int] = None
    related_quiz_id: Optional[int] = None
    related_user_id: Optional[int] = None
    action_url: Optional[str] = None


class NotificationUpdate(BaseModel):
    is_read: bool


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    notification_type: str
    channel: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    related_course_id: Optional[int] = None
    related_quiz_id: Optional[int] = None
    action_url: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    notifications: List[NotificationResponse]
