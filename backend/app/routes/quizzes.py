from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Course, Quiz, Question, QuestionOption, QuizAttempt, Certificate, Enrollment, Progress
from app.routes.notifications import notify_quiz_completed, notify_certificate_generated
from app.schemas import (
    QuizCreate,
    QuizResponse,
    QuestionCreate,
    QuestionOptionCreate,
    UploadQuestionsRequest,
)

router = APIRouter(prefix="/api/v1/quizzes", tags=["quizzes"])

@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(quiz: QuizCreate, db: Session = Depends(get_db)):
    """Create a new quiz"""
    db_quiz = Quiz(**quiz.dict())
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Get quiz by ID"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    return quiz

@router.get("/course/{course_id}")
async def list_quizzes_by_course(course_id: int, db: Session = Depends(get_db)):
    """List quizzes for a course"""
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    return quizzes

@router.post("/{quiz_id}/questions", status_code=status.HTTP_201_CREATED)
async def upload_quiz_questions(
    quiz_id: int,
    payload: UploadQuestionsRequest,
    db: Session = Depends(get_db)
):
    """Upload trainer questions for an existing quiz"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    created_questions = []

    for question_data in payload.questions:
        db_question = Question(
            quiz_id=quiz_id,
            question_text=question_data.question_text,
            question_type=question_data.question_type,
            correct_answer=question_data.correct_answer,
            points=question_data.points,
            order=question_data.order,
        )
        db.add(db_question)
        db.commit()
        db.refresh(db_question)

        if question_data.options:
            for option_data in question_data.options:
                db_option = QuestionOption(
                    question_id=db_question.id,
                    option_text=option_data.option_text,
                    is_correct=option_data.is_correct,
                    order=option_data.order,
                )
                db.add(db_option)
            db.commit()

        created_questions.append({
            "id": db_question.id,
            "question_text": db_question.question_text,
            "question_type": db_question.question_type,
            "correct_answer": db_question.correct_answer,
            "points": db_question.points,
            "order": db_question.order,
        })

    return {"created_questions": created_questions}


@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: int, user_id: int, score: float, db: Session = Depends(get_db)):
    """Submit quiz attempt"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    passed = score >= quiz.passing_score
    
    attempt = QuizAttempt(
        user_id=user_id,
        quiz_id=quiz_id,
        score=score,
        passed=passed
    )
    db.add(attempt)

    if passed:
        certificate = db.query(Certificate).filter(
            Certificate.user_id == user_id,
            Certificate.course_id == quiz.course_id
        ).first()

        if not certificate:
            certificate_number = f"SYNERGY-{quiz.course_id}-{user_id}-{int(datetime.utcnow().timestamp())}"
            certificate = Certificate(
                user_id=user_id,
                course_id=quiz.course_id,
                certificate_number=certificate_number
            )
            db.add(certificate)

        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == user_id,
            Enrollment.course_id == quiz.course_id
        ).first()
        if enrollment:
            enrollment.completed_at = datetime.utcnow()
            enrollment.status = "completed"

        progress = db.query(Progress).filter(
            Progress.user_id == user_id,
            Progress.course_id == quiz.course_id
        ).first()
        if progress:
            progress.completion_percentage = 100.0
            progress.updated_at = datetime.utcnow()
        else:
            progress = Progress(
                user_id=user_id,
                course_id=quiz.course_id,
                completion_percentage=100.0,
                last_accessed_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(progress)

    db.commit()
    db.refresh(attempt)

    notify_quiz_completed(db, user_id, quiz_id, score, passed)

    certificate_data = None
    if passed:
        certificate_record = db.query(Certificate).filter(
            Certificate.user_id == user_id,
            Certificate.course_id == quiz.course_id
        ).first()
        if certificate_record:
            notify_certificate_generated(
                db,
                user_id,
                quiz.course_id,
                quiz.title,
                certificate_record.certificate_number,
            )
            certificate_data = {
                "certificate_number": certificate_record.certificate_number,
                "issued_at": certificate_record.issued_at,
            }

    return {
        "score": score,
        "passed": passed,
        "required_score": quiz.passing_score,
        "certificate": certificate_data,
    }
