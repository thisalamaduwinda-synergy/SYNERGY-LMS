from fastapi import APIRouter
from bson import ObjectId
from app.database import certificates_col, courses_col, doc_to_dict

router = APIRouter(prefix="/api/v1/certificates", tags=["certificates"])


@router.get("/user/{user_id}")
async def get_user_certificates(user_id: str):
    certs = list(certificates_col.find({"user_id": user_id}).sort("issued_at", -1))
    result = []
    for c in certs:
        d = doc_to_dict(c)
        course = courses_col.find_one({"_id": ObjectId(c["course_id"])})
        if course:
            d["course_title"] = course.get("title", "Unknown Course")
            d["course_department"] = course.get("department", "")
        result.append(d)
    return result
