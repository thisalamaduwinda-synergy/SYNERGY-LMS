from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Quiz, Question, QuizAttempt
from app.schemas import QuizCreate, QuizResponse

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
    db.commit()
    db.refresh(attempt)
    
    return {
        "score": score,
        "passed": passed,
        "required_score": quiz.passing_score
    }
