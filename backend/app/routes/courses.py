from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from app.database import courses_col, enrollments_col, quizzes_col, questions_col, doc_to_dict
from app.schemas import CourseCreate, CourseResponse
from datetime import datetime

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])


def _course_with_counts(course: dict) -> dict:
    course_id = str(course["_id"])
    enrolled = enrollments_col.count_documents({"course_id": course_id})
    completed = enrollments_col.count_documents({"course_id": course_id, "status": "completed"})
    quiz_ids = [str(q["_id"]) for q in quizzes_col.find({"course_id": course_id}, {"_id": 1})]
    question_count = questions_col.count_documents({"quiz_id": {"$in": quiz_ids}}) if quiz_ids else 0
    d = doc_to_dict(course)
    d["enrolled"] = enrolled
    d["completed"] = completed
    d["questions"] = question_count
    return d


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(course: CourseCreate):
    now = datetime.utcnow()
    course_doc = {
        **course.model_dump(),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = courses_col.insert_one(course_doc)
    created = courses_col.find_one({"_id": result.inserted_id})
    return _course_with_counts(created)


@router.get("/", response_model=list[CourseResponse])
async def list_courses(skip: int = 0, limit: int = 100):
    courses = list(courses_col.find().skip(skip).limit(limit))
    return [_course_with_counts(c) for c in courses]


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    try:
        course = courses_col.find_one({"_id": ObjectId(course_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return _course_with_counts(course)


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
    return _course_with_counts(result)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: str):
    try:
        result = courses_col.delete_one({"_id": ObjectId(course_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
