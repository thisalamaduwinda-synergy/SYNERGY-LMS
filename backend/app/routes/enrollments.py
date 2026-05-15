from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from app.database import enrollments_col, courses_col, users_col, doc_to_dict
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/enrollments", tags=["enrollments"])


class EnrollRequest(BaseModel):
    user_id: str
    course_id: str


def _oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")


@router.post("/", status_code=status.HTTP_201_CREATED)
async def enroll(payload: EnrollRequest):
    if not users_col.find_one({"_id": _oid(payload.user_id)}):
        raise HTTPException(status_code=404, detail="User not found")
    if not courses_col.find_one({"_id": _oid(payload.course_id)}):
        raise HTTPException(status_code=404, detail="Course not found")

    existing = enrollments_col.find_one({"user_id": payload.user_id, "course_id": payload.course_id})
    if existing:
        return doc_to_dict(existing)

    doc = {
        "user_id": payload.user_id,
        "course_id": payload.course_id,
        "status": "enrolled",
        "enrolled_at": datetime.utcnow(),
        "completed_at": None,
    }
    result = enrollments_col.insert_one(doc)
    return doc_to_dict(enrollments_col.find_one({"_id": result.inserted_id}))


# Fixed-segment routes must be declared before /{enrollment_id}

@router.get("/user/{user_id}")
async def get_user_enrollments(user_id: str):
    enrollments = list(enrollments_col.find({"user_id": user_id}))
    result = []
    for e in enrollments:
        d = doc_to_dict(e)
        course = courses_col.find_one({"_id": _oid(e["course_id"])})
        if course:
            d["course"] = doc_to_dict(course)
        result.append(d)
    return result


@router.get("/course/{course_id}")
async def get_course_enrollments(course_id: str):
    enrollments = list(enrollments_col.find({"course_id": course_id}))
    result = []
    for e in enrollments:
        d = doc_to_dict(e)
        user = users_col.find_one({"_id": _oid(e["user_id"])})
        if user:
            u = doc_to_dict(user)
            u.pop("hashed_password", None)
            d["user"] = u
        result.append(d)
    return result


@router.get("/check")
async def check_enrollment(user_id: str, course_id: str):
    enrollment = enrollments_col.find_one({"user_id": user_id, "course_id": course_id})
    return {"enrolled": enrollment is not None, "enrollment": doc_to_dict(enrollment) if enrollment else None}


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_enrollment(enrollment_id: str):
    oid = _oid(enrollment_id)
    if not enrollments_col.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Enrollment not found")
    enrollments_col.delete_one({"_id": oid})
