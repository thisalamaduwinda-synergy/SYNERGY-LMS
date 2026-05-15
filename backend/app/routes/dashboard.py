from fastapi import APIRouter
from bson import ObjectId
from app.database import courses_col, users_col, quiz_attempts_col, enrollments_col, certificates_col, doc_to_dict

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

    result = []
    for course in courses:
        course_id = str(course["_id"])
        enrolled = enrollments_col.count_documents({"course_id": course_id})
        completed = enrollments_col.count_documents({"course_id": course_id, "status": "completed"})
        completion = (completed / enrolled * 100) if enrolled > 0 else 0

        result.append(
            {
                "id": course_id,
                "title": course["title"],
                "employees": enrolled,
                "completion": round(completion, 1),
                "status": "Active",
            }
        )

    return result


@router.get("/user-stats/{user_id}")
async def get_user_dashboard_stats(user_id: str):
    total_enrolled = enrollments_col.count_documents({"user_id": user_id})
    completed = enrollments_col.count_documents({"user_id": user_id, "status": "completed"})
    certificates = certificates_col.count_documents({"user_id": user_id})
    attempts = list(quiz_attempts_col.find({"user_id": user_id}))
    passed = sum(1 for a in attempts if a.get("passed"))
    avg_score = round(sum(a.get("score", 0) for a in attempts) / len(attempts), 1) if attempts else 0
    completion_rate = round((completed / total_enrolled * 100), 1) if total_enrolled else 0

    recent_enrollments = list(
        enrollments_col.find({"user_id": user_id}).sort("enrolled_at", -1).limit(5)
    )
    recent_courses = []
    for e in recent_enrollments:
        course = courses_col.find_one({"_id": ObjectId(e["course_id"])})
        if course:
            recent_courses.append({
                "course_id": e["course_id"],
                "title": course.get("title"),
                "status": e.get("status"),
                "department": course.get("department"),
            })

    return {
        "total_enrolled": total_enrolled,
        "completed": completed,
        "certificates": certificates,
        "passed_quizzes": passed,
        "avg_score": avg_score,
        "completion_rate": completion_rate,
        "recent_courses": recent_courses,
    }
