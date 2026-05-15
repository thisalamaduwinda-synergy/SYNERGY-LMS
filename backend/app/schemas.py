from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# ── User Schemas ──────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: str = "employee"
    department: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ── Course / SOP Training Schemas ─────────────────────────────────────────────

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_hours: Optional[int] = None
    sop_code: Optional[str] = None
    version: str = "1.0"
    department: Optional[str] = None
    owner: Optional[str] = None
    training_status: str = "Active"   # Active | Draft | Review
    priority: str = "Mandatory"        # Mandatory | Recommended | Role Based
    passing_score: float = 70.0
    due_date: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    enrolled: int = 0
    completed: int = 0
    questions: int = 0

    class Config:
        from_attributes = True

# ── SOP Schemas ───────────────────────────────────────────────────────────────

class SOPBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = ""
    version: str = "1.0"

class SOPCreate(SOPBase):
    created_by: Optional[str] = None

class SOPResponse(SOPBase):
    id: str
    file_url: Optional[str] = None
    is_active: bool = True
    course_ids: List[str] = []
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ── Quiz Schemas ──────────────────────────────────────────────────────────────

class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    passing_score: float = 70.0
    max_attempts: int = 3

class QuizCreate(QuizBase):
    course_id: str

class QuizResponse(QuizBase):
    id: str
    course_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionOptionCreate(BaseModel):
    option_text: str
    is_correct: bool = False
    order: Optional[int] = None

class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    correct_answer: Optional[str] = None
    points: float = 1.0
    order: Optional[int] = None
    options: Optional[List[QuestionOptionCreate]] = []

class UploadQuestionsRequest(BaseModel):
    questions: List[QuestionCreate]

class GenerateSOPQuestionsRequest(BaseModel):
    question_count: int = 5
    difficulty: str = "medium"

class SOPQuestionsResponse(BaseModel):
    sop_id: str
    questions: List[QuestionCreate]

# ── Authentication ─────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# ── Notification Schemas ───────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    user_id: str
    notification_type: str
    channel: str = "in_app"
    title: str
    message: str
    related_course_id: Optional[str] = None
    related_quiz_id: Optional[str] = None
    related_user_id: Optional[str] = None
    action_url: Optional[str] = None

class NotificationUpdate(BaseModel):
    is_read: bool

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    notification_type: str
    channel: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    related_course_id: Optional[str] = None
    related_quiz_id: Optional[str] = None
    action_url: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    notifications: List[NotificationResponse]
