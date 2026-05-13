from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import SOP, Course
from app.schemas import SOPCreate, SOPResponse
from datetime import datetime
import os

router = APIRouter(prefix="/api/v1/sops", tags=["sops"])

UPLOAD_DIR = "uploads/sops"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


@router.post("/", response_model=SOPResponse, status_code=status.HTTP_201_CREATED)
async def create_sop(sop: SOPCreate, db: Session = Depends(get_db)):
    """Create a new SOP"""
    db_sop = SOP(**sop.dict())
    db.add(db_sop)
    db.commit()
    db.refresh(db_sop)
    return db_sop


@router.get("/", response_model=list)
async def list_sops(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all SOPs"""
    sops = db.query(SOP).offset(skip).limit(limit).all()
    return sops


@router.get("/{sop_id}", response_model=SOPResponse)
async def get_sop(sop_id: int, db: Session = Depends(get_db)):
    """Get SOP by ID"""
    sop = db.query(SOP).filter(SOP.id == sop_id).first()
    if not sop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOP not found"
        )
    return sop


@router.post("/{sop_id}/upload-file")
async def upload_sop_file(
    sop_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a file for an SOP"""
    sop = db.query(SOP).filter(SOP.id == sop_id).first()
    if not sop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOP not found"
        )
    
    file_extension = file.filename.split(".")[-1]
    file_name = f"sop_{sop_id}_{int(datetime.utcnow().timestamp())}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    
    sop.file_url = f"/files/sops/{file_name}"
    db.commit()
    db.refresh(sop)
    
    return {
        "message": "File uploaded successfully",
        "file_url": sop.file_url,
        "sop_id": sop_id
    }


@router.put("/{sop_id}")
async def update_sop(
    sop_id: int,
    title: str = Form(None),
    description: str = Form(None),
    version: str = Form(None),
    db: Session = Depends(get_db)
):
    """Update SOP metadata"""
    sop = db.query(SOP).filter(SOP.id == sop_id).first()
    if not sop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOP not found"
        )
    
    if title:
        sop.title = title
    if description:
        sop.description = description
    if version:
        sop.version = version
    
    sop.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sop)
    
    return sop


@router.delete("/{sop_id}")
async def delete_sop(sop_id: int, db: Session = Depends(get_db)):
    """Delete an SOP"""
    sop = db.query(SOP).filter(SOP.id == sop_id).first()
    if not sop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOP not found"
        )
    
    db.delete(sop)
    db.commit()
    
    return {"message": "SOP deleted successfully"}


@router.post("/{sop_id}/courses/{course_id}")
async def associate_sop_with_course(
    sop_id: int,
    course_id: int,
    db: Session = Depends(get_db)
):
    """Associate SOP with a course"""
    sop = db.query(SOP).filter(SOP.id == sop_id).first()
    if not sop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOP not found"
        )
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course not in sop.courses:
        sop.courses.append(course)
        db.commit()
        db.refresh(sop)
    
    return {"message": "SOP associated with course successfully"}


@router.delete("/{sop_id}/courses/{course_id}")
async def remove_sop_from_course(
    sop_id: int,
    course_id: int,
    db: Session = Depends(get_db)
):
    """Remove SOP from a course"""
    sop = db.query(SOP).filter(SOP.id == sop_id).first()
    if not sop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOP not found"
        )
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course in sop.courses:
        sop.courses.remove(course)
        db.commit()
        db.refresh(sop)
    
    return {"message": "SOP removed from course successfully"}


@router.get("/course/{course_id}")
async def get_sops_for_course(course_id: int, db: Session = Depends(get_db)):
    """Get all SOPs for a specific course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return course.sops
