from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional
from pydantic import BaseModel
from app.database import training_sessions_col, courses_col, doc_to_dict

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


class SessionCreate(BaseModel):
    title: str
    date: str                        # "YYYY-MM-DD"
    time: str = "09:00 AM"
    duration: str = "1h"
    department: str = "General"
    trainer: str = ""
    location: str = ""
    delivery: str = "Classroom"      # Classroom | Virtual | Practical | Workshop
    capacity: int = 30
    status: str = "Draft"            # Draft | Confirmed | Pending | Cancelled
    priority: str = "Mandatory"      # Mandatory | Recommended | Role Based
    type: str = "Compliance"         # Compliance | SOP | Practical | Role Based | Quality
    course_id: Optional[str] = None  # linked course (optional)
    description: Optional[str] = None


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    department: Optional[str] = None
    trainer: Optional[str] = None
    location: Optional[str] = None
    delivery: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    type: Optional[str] = None
    course_id: Optional[str] = None
    description: Optional[str] = None


def _oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid session ID")


def _enrich(session: dict) -> dict:
    d = doc_to_dict(session)
    # attach enrolled count from linked course if available
    if d.get("course_id"):
        from app.database import enrollments_col
        d["attendees"] = enrollments_col.count_documents({"course_id": d["course_id"]})
    else:
        d.setdefault("attendees", 0)
    return d


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_session(payload: SessionCreate):
    doc = {
        **payload.model_dump(),
        "attendees": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    # if linked to a course, fetch real enrolled count
    if payload.course_id:
        from app.database import enrollments_col
        doc["attendees"] = enrollments_col.count_documents({"course_id": payload.course_id})

    result = training_sessions_col.insert_one(doc)
    created = training_sessions_col.find_one({"_id": result.inserted_id})
    return _enrich(created)


@router.get("/")
async def list_sessions():
    sessions = list(training_sessions_col.find().sort("date", 1))
    return [_enrich(s) for s in sessions]


@router.get("/{session_id}")
async def get_session(session_id: str):
    s = training_sessions_col.find_one({"_id": _oid(session_id)})
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return _enrich(s)


@router.put("/{session_id}")
async def update_session(session_id: str, payload: SessionUpdate):
    oid = _oid(session_id)
    if not training_sessions_col.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Session not found")

    fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    fields["updated_at"] = datetime.utcnow()
    updated = training_sessions_col.find_one_and_update(
        {"_id": oid}, {"$set": fields}, return_document=True
    )
    return _enrich(updated)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str):
    oid = _oid(session_id)
    if not training_sessions_col.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Session not found")
    training_sessions_col.delete_one({"_id": oid})
