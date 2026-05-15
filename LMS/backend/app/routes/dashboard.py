from fastapi import APIRouter
from app.database import courses_col, users_col, quiz_attempts_col, enrollments_col, doc_to_dict

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats():
    total_students = users_col.count_documents({"role": "employee"})
    active_courses = courses_col.count_documents({"is_active": True})
    total_enrollments = enrollments_col.count_documents({})
    completed_enrollments = enrollments_col.count_documents({"status": "completed"})

    completion_rate = (
        (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
    )

    return {
        "total_students": total_students,
        "active_courses": active_courses,
        "total_enrollments": total_enrollments,
        "completion_rate": round(completion_rate, 1),
        "passed_quizzes": quiz_attempts_col.count_documents({"passed": True}),
    }


@router.get("/monthly-enrollments")
async def get_monthly_enrollments():
    return [
        {"month": "Jan", "students": 40},
        {"month": "Feb", "students": 50},
        {"month": "Mar", "students": 60},
        {"month": "Apr", "students": 55},
        {"month": "May", "students": 70},
        {"month": "Jun", "students": 90},
    ]


@router.get("/popular-courses")
async def get_popular_courses():
    courses = list(courses_col.find({"is_active": True}).limit(5))
    return [doc_to_dict(c) for c in courses]
