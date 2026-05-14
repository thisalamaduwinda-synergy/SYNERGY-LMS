from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Course, User, QuizAttempt, Enrollment

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_students = db.query(User).filter(User.role == "employee").count()
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    total_enrollments = db.query(Enrollment).count()
    completed_enrollments = db.query(Enrollment).filter(Enrollment.status == "completed").count()
    
    completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
    
    return {
        "total_students": total_students,
        "active_courses": active_courses,
        "total_enrollments": total_enrollments,
        "completion_rate": round(completion_rate, 1),
        "passed_quizzes": db.query(QuizAttempt).filter(QuizAttempt.passed == True).count()
    }

@router.get("/monthly-enrollments")
async def get_monthly_enrollments(db: Session = Depends(get_db)):
    """Get monthly enrollment data"""
    # This would typically come from a more complex query
    return [
        {"month": "Jan", "students": 40},
        {"month": "Feb", "students": 50},
        {"month": "Mar", "students": 60},
        {"month": "Apr", "students": 55},
        {"month": "May", "students": 70},
        {"month": "Jun", "students": 90},
    ]

@router.get("/popular-courses")
async def get_popular_courses(db: Session = Depends(get_db)):
    """Get popular courses with enrollment stats"""
    courses = db.query(Course).filter(Course.is_active == True).limit(5).all()
    
    result = []
    for course in courses:
        enrolled = len(course.enrollments)
        completed = len([e for e in course.enrollments if e.status == "completed"])
        completion = (completed / enrolled * 100) if enrolled > 0 else 0
        
        result.append({
            "id": course.id,
            "title": course.title,
            "employees": enrolled,
            "completion": round(completion, 1),
            "status": "Active"
        })
    
    return result
