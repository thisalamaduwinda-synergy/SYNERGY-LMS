from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Course
from app.schemas import CourseCreate, CourseResponse

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])

@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """Create a new course"""
    db_course = Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get course by ID"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course

@router.get("/", response_model=list[CourseResponse])
async def list_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all courses"""
    courses = db.query(Course).filter(Course.is_active == True).offset(skip).limit(limit).all()
    return courses

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    """Update a course"""
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    for key, value in course.dict().items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course
