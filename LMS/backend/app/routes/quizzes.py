from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from app.database import quizzes_col, quiz_attempts_col, doc_to_dict
from app.schemas import QuizCreate, QuizResponse
from datetime import datetime

router = APIRouter(prefix="/api/v1/quizzes", tags=["quizzes"])


@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(quiz: QuizCreate):
    quiz_doc = {**quiz.model_dump(), "created_at": datetime.utcnow()}
    result = quizzes_col.insert_one(quiz_doc)
    created = quizzes_col.find_one({"_id": result.inserted_id})
    return doc_to_dict(created)


# /course/{course_id} must come before /{quiz_id} to avoid path conflict
@router.get("/course/{course_id}")
async def list_quizzes_by_course(course_id: str):
    quizzes = list(quizzes_col.find({"course_id": course_id}))
    return [doc_to_dict(q) for q in quizzes]


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(quiz_id: str):
    try:
        quiz = quizzes_col.find_one({"_id": ObjectId(quiz_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return doc_to_dict(quiz)


@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, user_id: str, score: float):
    try:
        quiz = quizzes_col.find_one({"_id": ObjectId(quiz_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    passed = score >= quiz["passing_score"]

    quiz_attempts_col.insert_one(
        {
            "user_id": user_id,
            "quiz_id": quiz_id,
            "score": score,
            "passed": passed,
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
        }
    )

    return {"score": score, "passed": passed, "required_score": quiz["passing_score"]}
