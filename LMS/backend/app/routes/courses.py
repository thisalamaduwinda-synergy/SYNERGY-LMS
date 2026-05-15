from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from app.database import courses_col, doc_to_dict
from app.schemas import CourseCreate, CourseResponse
from datetime import datetime

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(course: CourseCreate):
    course_doc = {
        **course.model_dump(),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = courses_col.insert_one(course_doc)
    created = courses_col.find_one({"_id": result.inserted_id})
    return doc_to_dict(created)


@router.get("/", response_model=list[CourseResponse])
async def list_courses(skip: int = 0, limit: int = 100):
    courses = list(courses_col.find({"is_active": True}).skip(skip).limit(limit))
    return [doc_to_dict(c) for c in courses]


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    try:
        course = courses_col.find_one({"_id": ObjectId(course_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return doc_to_dict(course)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(course_id: str, course: CourseCreate):
    try:
        oid = ObjectId(course_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid course ID")

    result = courses_col.find_one_and_update(
        {"_id": oid},
        {"$set": {**course.model_dump(), "updated_at": datetime.utcnow()}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return doc_to_dict(result)
