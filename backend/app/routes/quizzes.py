from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from app.database import (
    quizzes_col,
    questions_col,
    question_options_col,
    quiz_attempts_col,
    certificates_col,
    enrollments_col,
    progress_col,
    doc_to_dict,
)
from app.routes.notifications import notify_quiz_completed, notify_certificate_generated
from app.schemas import (
    QuizCreate,
    QuizResponse,
    QuestionCreate,
    UploadQuestionsRequest,
)

router = APIRouter(prefix="/api/v1/quizzes", tags=["quizzes"])


def _oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")


def _build_question(q: dict) -> dict:
    qd = doc_to_dict(q)
    options = list(question_options_col.find({"question_id": str(q["_id"])}).sort("order", 1))
    qd["options"] = [doc_to_dict(o) for o in options]
    return qd


# ── Quiz CRUD ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(quiz: QuizCreate):
    quiz_doc = {**quiz.model_dump(), "created_at": datetime.utcnow()}
    result = quizzes_col.insert_one(quiz_doc)
    created = quizzes_col.find_one({"_id": result.inserted_id})
    return doc_to_dict(created)


@router.get("/course/{course_id}")
async def list_quizzes_by_course(course_id: str):
    quizzes = list(quizzes_col.find({"course_id": course_id}))
    return [doc_to_dict(q) for q in quizzes]


# ── Question CRUD (fixed paths before /{quiz_id}) ─────────────────────────────

@router.put("/question/{question_id}")
async def update_question(question_id: str, payload: QuestionCreate):
    oid = _oid(question_id)
    if not questions_col.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Question not found")

    questions_col.update_one({"_id": oid}, {"$set": {
        "question_text": payload.question_text,
        "question_type": payload.question_type,
        "correct_answer": payload.correct_answer,
        "points": payload.points,
        "order": payload.order,
    }})

    question_options_col.delete_many({"question_id": question_id})
    if payload.options:
        question_options_col.insert_many([
            {"question_id": question_id, "option_text": o.option_text, "is_correct": o.is_correct, "order": o.order}
            for o in payload.options
        ])

    updated = questions_col.find_one({"_id": oid})
    return _build_question(updated)


@router.delete("/question/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(question_id: str):
    oid = _oid(question_id)
    if not questions_col.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Question not found")
    question_options_col.delete_many({"question_id": question_id})
    questions_col.delete_one({"_id": oid})


# ── Quiz by ID ─────────────────────────────────────────────────────────────────

@router.get("/{quiz_id}/questions")
async def get_quiz_questions(quiz_id: str):
    quiz = quizzes_col.find_one({"_id": _oid(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = list(questions_col.find({"quiz_id": quiz_id}).sort("order", 1))
    return [_build_question(q) for q in questions]


@router.post("/{quiz_id}/question", status_code=status.HTTP_201_CREATED)
async def add_question(quiz_id: str, payload: QuestionCreate):
    quiz = quizzes_col.find_one({"_id": _oid(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    q_doc = {
        "quiz_id": quiz_id,
        "question_text": payload.question_text,
        "question_type": payload.question_type,
        "correct_answer": payload.correct_answer,
        "points": payload.points,
        "order": payload.order,
    }
    result = questions_col.insert_one(q_doc)
    q_id = str(result.inserted_id)

    if payload.options:
        question_options_col.insert_many([
            {"question_id": q_id, "option_text": o.option_text, "is_correct": o.is_correct, "order": o.order}
            for o in payload.options
        ])

    created = questions_col.find_one({"_id": result.inserted_id})
    return _build_question(created)


@router.post("/{quiz_id}/questions", status_code=status.HTTP_201_CREATED)
async def upload_quiz_questions(quiz_id: str, payload: UploadQuestionsRequest):
    quiz = quizzes_col.find_one({"_id": _oid(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    created_questions = []
    for question_data in payload.questions:
        q_doc = {
            "quiz_id": quiz_id,
            "question_text": question_data.question_text,
            "question_type": question_data.question_type,
            "correct_answer": question_data.correct_answer,
            "points": question_data.points,
            "order": question_data.order,
        }
        q_result = questions_col.insert_one(q_doc)
        q_id = str(q_result.inserted_id)

        if question_data.options:
            question_options_col.insert_many([
                {"question_id": q_id, "option_text": o.option_text, "is_correct": o.is_correct, "order": o.order}
                for o in question_data.options
            ])

        created_questions.append({"id": q_id, "question_text": question_data.question_text})

    return {"created_questions": created_questions}


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(quiz_id: str):
    quiz = quizzes_col.find_one({"_id": _oid(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return doc_to_dict(quiz)


@router.put("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(quiz_id: str, data: QuizCreate):
    oid = _oid(quiz_id)
    if not quizzes_col.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Quiz not found")
    quizzes_col.update_one({"_id": oid}, {"$set": {
        "title": data.title,
        "description": data.description,
        "passing_score": data.passing_score,
        "max_attempts": data.max_attempts,
    }})
    return doc_to_dict(quizzes_col.find_one({"_id": oid}))


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(quiz_id: str):
    oid = _oid(quiz_id)
    if not quizzes_col.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Quiz not found")
    q_ids = [str(q["_id"]) for q in questions_col.find({"quiz_id": quiz_id}, {"_id": 1})]
    for qid in q_ids:
        question_options_col.delete_many({"question_id": qid})
    questions_col.delete_many({"quiz_id": quiz_id})
    quizzes_col.delete_one({"_id": oid})


@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, user_id: str, score: float):
    quiz = quizzes_col.find_one({"_id": _oid(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    passed = score >= quiz["passing_score"]
    course_id = quiz["course_id"]

    quiz_attempts_col.insert_one({
        "user_id": user_id,
        "quiz_id": quiz_id,
        "score": score,
        "passed": passed,
        "started_at": datetime.utcnow(),
        "completed_at": datetime.utcnow(),
    })

    if passed:
        existing_cert = certificates_col.find_one({"user_id": user_id, "course_id": course_id})
        if not existing_cert:
            certificate_number = f"SYNERGY-{course_id}-{user_id}-{int(datetime.utcnow().timestamp())}"
            certificates_col.insert_one({
                "user_id": user_id,
                "course_id": course_id,
                "certificate_number": certificate_number,
                "issued_at": datetime.utcnow(),
                "valid_until": None,
            })

        enrollment = enrollments_col.find_one({"user_id": user_id, "course_id": course_id})
        if enrollment:
            enrollments_col.update_one(
                {"_id": enrollment["_id"]},
                {"$set": {"completed_at": datetime.utcnow(), "status": "completed"}},
            )

        existing_progress = progress_col.find_one({"user_id": user_id, "course_id": course_id})
        if existing_progress:
            progress_col.update_one(
                {"_id": existing_progress["_id"]},
                {"$set": {"completion_percentage": 100.0, "updated_at": datetime.utcnow()}},
            )
        else:
            progress_col.insert_one({
                "user_id": user_id,
                "course_id": course_id,
                "completion_percentage": 100.0,
                "last_accessed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            })

    notify_quiz_completed(user_id, quiz_id, score, passed)

    certificate_data = None
    if passed:
        cert = certificates_col.find_one({"user_id": user_id, "course_id": course_id})
        if cert:
            notify_certificate_generated(user_id, course_id, quiz["title"], cert["certificate_number"])
            certificate_data = {"certificate_number": cert["certificate_number"], "issued_at": cert["issued_at"]}

    return {"score": score, "passed": passed, "required_score": quiz["passing_score"], "certificate": certificate_data}
