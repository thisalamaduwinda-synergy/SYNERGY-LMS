import calendar
import csv
import io
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.database import (
    users_col,
    courses_col,
    enrollments_col,
    quiz_attempts_col,
    certificates_col,
    quizzes_col,
    doc_to_dict,
)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _safe_oid(val: str):
    try:
        return ObjectId(val)
    except (InvalidId, Exception):
        return None


def _month_range(year: int, month: int):
    first = datetime(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    last = datetime(year, month, last_day, 23, 59, 59)
    return first, last


def _prev_month(year: int, month: int, delta: int):
    month -= delta
    while month <= 0:
        month += 12
        year -= 1
    return year, month


def _user_stats(user_id: str) -> dict:
    enrollments = enrollments_col.count_documents({"user_id": user_id})
    completed = enrollments_col.count_documents({"user_id": user_id, "status": "completed"})
    certificates = certificates_col.count_documents({"user_id": user_id})
    attempts = list(quiz_attempts_col.find({"user_id": user_id}, {"score": 1, "passed": 1}))
    avg_score = round(sum(a["score"] for a in attempts) / len(attempts), 1) if attempts else 0
    return {
        "enrollments": enrollments,
        "completed_courses": completed,
        "certificates": certificates,
        "quiz_attempts": len(attempts),
        "avg_quiz_score": avg_score,
        "completion_rate": round((completed / enrollments * 100) if enrollments > 0 else 0, 1),
    }


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/overview")
async def get_overview():
    total_users = users_col.count_documents({})
    active_users = users_col.count_documents({"is_active": True})
    total_courses = courses_col.count_documents({})
    active_courses = courses_col.count_documents({"is_active": True})
    total_enrollments = enrollments_col.count_documents({})
    completed_enrollments = enrollments_col.count_documents({"status": "completed"})
    total_certificates = certificates_col.count_documents({})
    total_attempts = quiz_attempts_col.count_documents({})
    passed_attempts = quiz_attempts_col.count_documents({"passed": True})

    completion_rate = round(
        (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0, 1
    )
    quiz_pass_rate = round(
        (passed_attempts / total_attempts * 100) if total_attempts > 0 else 0, 1
    )

    now = datetime.utcnow()
    monthly_enrollments = []
    monthly_completions = []
    for i in range(11, -1, -1):
        y, m = _prev_month(now.year, now.month, i)
        first, last = _month_range(y, m)
        enroll_count = enrollments_col.count_documents(
            {"enrolled_at": {"$gte": first, "$lte": last}}
        )
        complete_count = enrollments_col.count_documents(
            {"completed_at": {"$gte": first, "$lte": last}}
        )
        label = first.strftime("%b %Y")
        monthly_enrollments.append({"month": label, "count": enroll_count})
        monthly_completions.append({"month": label, "count": complete_count})

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_courses": total_courses,
        "active_courses": active_courses,
        "total_enrollments": total_enrollments,
        "completed_enrollments": completed_enrollments,
        "completion_rate": completion_rate,
        "total_certificates": total_certificates,
        "total_quiz_attempts": total_attempts,
        "passed_attempts": passed_attempts,
        "quiz_pass_rate": quiz_pass_rate,
        "monthly_enrollments": monthly_enrollments,
        "monthly_completions": monthly_completions,
    }


# ── User Report ───────────────────────────────────────────────────────────────

@router.get("/users")
async def get_user_report():
    users = list(users_col.find({}, {"hashed_password": 0}))
    result = []
    for user in users:
        user_id = str(user["_id"])
        d = doc_to_dict(user)
        d.update(_user_stats(user_id))
        result.append(d)
    return result


# ── Course Report ─────────────────────────────────────────────────────────────

@router.get("/courses")
async def get_course_report():
    courses = list(courses_col.find())
    result = []
    for course in courses:
        course_id = str(course["_id"])
        enrollments = enrollments_col.count_documents({"course_id": course_id})
        completed = enrollments_col.count_documents({"course_id": course_id, "status": "completed"})
        certificates = certificates_col.count_documents({"course_id": course_id})

        quiz_ids = [str(q["_id"]) for q in quizzes_col.find({"course_id": course_id}, {"_id": 1})]
        attempts = (
            list(quiz_attempts_col.find({"quiz_id": {"$in": quiz_ids}}, {"score": 1, "passed": 1}))
            if quiz_ids
            else []
        )
        avg_score = round(sum(a["score"] for a in attempts) / len(attempts), 1) if attempts else 0
        passed = sum(1 for a in attempts if a.get("passed"))

        d = doc_to_dict(course)
        d["enrollments"] = enrollments
        d["completed"] = completed
        d["completion_rate"] = round((completed / enrollments * 100) if enrollments > 0 else 0, 1)
        d["certificates_issued"] = certificates
        d["quiz_attempts"] = len(attempts)
        d["avg_quiz_score"] = avg_score
        d["quiz_pass_rate"] = round((passed / len(attempts) * 100) if attempts else 0, 1)
        result.append(d)
    return result


# ── Quiz Report ───────────────────────────────────────────────────────────────

@router.get("/quizzes")
async def get_quiz_report():
    quizzes = list(quizzes_col.find())
    result = []
    for quiz in quizzes:
        quiz_id = str(quiz["_id"])
        attempts = list(
            quiz_attempts_col.find({"quiz_id": quiz_id}, {"score": 1, "passed": 1})
        )
        passed = sum(1 for a in attempts if a.get("passed"))
        avg_score = round(sum(a["score"] for a in attempts) / len(attempts), 1) if attempts else 0

        course = None
        course_oid = _safe_oid(quiz.get("course_id", ""))
        if course_oid:
            course = courses_col.find_one({"_id": course_oid}, {"title": 1})

        d = doc_to_dict(quiz)
        d["total_attempts"] = len(attempts)
        d["passed_attempts"] = passed
        d["failed_attempts"] = len(attempts) - passed
        d["pass_rate"] = round((passed / len(attempts) * 100) if attempts else 0, 1)
        d["avg_score"] = avg_score
        d["course_title"] = course.get("title", "Unknown") if course else "Unknown"
        result.append(d)
    return result


# ── Department Report ─────────────────────────────────────────────────────────

@router.get("/departments")
async def get_department_report():
    users = list(users_col.find({}, {"hashed_password": 0}))
    dept_map: dict[str, dict] = {}

    for user in users:
        dept = (user.get("department") or "").strip() or "Unknown"
        user_id = str(user["_id"])

        if dept not in dept_map:
            dept_map[dept] = {
                "department": dept,
                "total_users": 0,
                "active_users": 0,
                "total_enrollments": 0,
                "completed_enrollments": 0,
                "certificates": 0,
            }

        dept_map[dept]["total_users"] += 1
        if user.get("is_active"):
            dept_map[dept]["active_users"] += 1

        dept_map[dept]["total_enrollments"] += enrollments_col.count_documents({"user_id": user_id})
        dept_map[dept]["completed_enrollments"] += enrollments_col.count_documents(
            {"user_id": user_id, "status": "completed"}
        )
        dept_map[dept]["certificates"] += certificates_col.count_documents({"user_id": user_id})

    result = []
    for data in dept_map.values():
        data["completion_rate"] = round(
            (data["completed_enrollments"] / data["total_enrollments"] * 100)
            if data["total_enrollments"] > 0
            else 0,
            1,
        )
        result.append(data)

    return sorted(result, key=lambda x: x["total_users"], reverse=True)


# ── Certificate Report ────────────────────────────────────────────────────────

@router.get("/certificates")
async def get_certificate_report():
    certs = list(certificates_col.find().sort("issued_at", -1))
    result = []
    for cert in certs:
        d = doc_to_dict(cert)

        user_oid = _safe_oid(cert.get("user_id", ""))
        if user_oid:
            user = users_col.find_one({"_id": user_oid}, {"full_name": 1, "email": 1, "department": 1})
            if user:
                d["user_name"] = user.get("full_name", "Unknown")
                d["user_email"] = user.get("email", "")
                d["department"] = user.get("department", "")

        course_oid = _safe_oid(cert.get("course_id", ""))
        if course_oid:
            course = courses_col.find_one({"_id": course_oid}, {"title": 1})
            if course:
                d["course_title"] = course.get("title", "Unknown")

        result.append(d)
    return result


# ── CSV Exports ───────────────────────────────────────────────────────────────

@router.get("/export/users")
async def export_users_csv():
    users = list(users_col.find({}, {"hashed_password": 0}))
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Full Name", "Email", "Username", "Department", "Role",
        "Status", "Enrollments", "Completed Courses", "Certificates",
        "Quiz Attempts", "Avg Quiz Score (%)", "Completion Rate (%)", "Joined Date",
    ])
    for user in users:
        user_id = str(user["_id"])
        stats = _user_stats(user_id)
        joined = user.get("created_at", "")
        if isinstance(joined, datetime):
            joined = joined.strftime("%Y-%m-%d")
        writer.writerow([
            user.get("full_name", ""),
            user.get("email", ""),
            user.get("username", ""),
            user.get("department", ""),
            user.get("role", ""),
            "Active" if user.get("is_active") else "Inactive",
            stats["enrollments"],
            stats["completed_courses"],
            stats["certificates"],
            stats["quiz_attempts"],
            stats["avg_quiz_score"],
            stats["completion_rate"],
            joined,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_report.csv"},
    )


@router.get("/export/courses")
async def export_courses_csv():
    courses = list(courses_col.find())
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Course Title", "Department", "Status", "Enrollments",
        "Completed", "Completion Rate (%)", "Certificates Issued",
        "Quiz Attempts", "Avg Quiz Score (%)", "Quiz Pass Rate (%)",
    ])
    for course in courses:
        course_id = str(course["_id"])
        enrollments = enrollments_col.count_documents({"course_id": course_id})
        completed = enrollments_col.count_documents({"course_id": course_id, "status": "completed"})
        certificates = certificates_col.count_documents({"course_id": course_id})
        quiz_ids = [str(q["_id"]) for q in quizzes_col.find({"course_id": course_id}, {"_id": 1})]
        attempts = (
            list(quiz_attempts_col.find({"quiz_id": {"$in": quiz_ids}}, {"score": 1, "passed": 1}))
            if quiz_ids else []
        )
        avg_score = round(sum(a["score"] for a in attempts) / len(attempts), 1) if attempts else 0
        passed = sum(1 for a in attempts if a.get("passed"))
        writer.writerow([
            course.get("title", ""),
            course.get("department", ""),
            "Active" if course.get("is_active") else "Inactive",
            enrollments,
            completed,
            round((completed / enrollments * 100) if enrollments > 0 else 0, 1),
            certificates,
            len(attempts),
            avg_score,
            round((passed / len(attempts) * 100) if attempts else 0, 1),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=courses_report.csv"},
    )


@router.get("/export/certificates")
async def export_certificates_csv():
    certs = list(certificates_col.find().sort("issued_at", -1))
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Certificate Number", "Employee Name", "Email", "Department",
        "Course Title", "Issued Date",
    ])
    for cert in certs:
        user_name = user_email = department = course_title = ""
        user_oid = _safe_oid(cert.get("user_id", ""))
        if user_oid:
            user = users_col.find_one({"_id": user_oid}, {"full_name": 1, "email": 1, "department": 1})
            if user:
                user_name = user.get("full_name", "")
                user_email = user.get("email", "")
                department = user.get("department", "")
        course_oid = _safe_oid(cert.get("course_id", ""))
        if course_oid:
            course = courses_col.find_one({"_id": course_oid}, {"title": 1})
            if course:
                course_title = course.get("title", "")
        issued = cert.get("issued_at", "")
        if isinstance(issued, datetime):
            issued = issued.strftime("%Y-%m-%d")
        writer.writerow([
            cert.get("certificate_number", ""),
            user_name,
            user_email,
            department,
            course_title,
            issued,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=certificates_report.csv"},
    )
