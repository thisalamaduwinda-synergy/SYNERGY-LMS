from fastapi import APIRouter, HTTPException, status, File, UploadFile, Form
from bson import ObjectId
from bson.errors import InvalidId
from app.database import sops_col, courses_col, users_col, doc_to_dict
from app.schemas import GenerateSOPQuestionsRequest, SOPCreate, SOPResponse, UploadQuestionsRequest
from datetime import datetime
import os

router = APIRouter(prefix="/api/v1/sops", tags=["sops"])

UPLOAD_DIR = "uploads/sops"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


def _sentence_candidates(text: str) -> list[str]:
    normalized = " ".join((text or "").split())
    sentences = []
    for chunk in normalized.replace("?", ".").replace("!", ".").split("."):
        sentence = chunk.strip()
        if len(sentence) > 30:
            sentences.append(sentence)
    return sentences


def _build_sop_question(sop_title: str, source: str, order: int) -> dict:
    answer = source.split(",")[0].strip() or sop_title
    options = [
        {"option_text": answer, "is_correct": True, "order": 1},
        {"option_text": "Skip the documented procedure when production is urgent", "is_correct": False, "order": 2},
        {"option_text": "Complete the activity without recording evidence", "is_correct": False, "order": 3},
        {"option_text": "Ignore deviations if the final result is acceptable", "is_correct": False, "order": 4},
    ]
    return {
        "question_text": f'According to "{sop_title}", which statement best matches the required procedure?',
        "question_type": "multiple_choice",
        "correct_answer": answer,
        "points": 1.0,
        "order": order,
        "options": options,
    }


@router.post("/", response_model=SOPResponse, status_code=status.HTTP_201_CREATED)
async def create_sop(sop: SOPCreate):
    now = datetime.utcnow()
    sop_doc = {
        **sop.model_dump(),
        "file_url": None,
        "is_active": True,
        "course_ids": [],
        "created_at": now,
        "updated_at": now,
    }
    result = sops_col.insert_one(sop_doc)
    created = sops_col.find_one({"_id": result.inserted_id})
    sop_data = doc_to_dict(created)

    # Notify all active employees about the new SOP
    try:
        from app.routes.notifications import notify_sop_uploaded
        employees = list(users_col.find({"is_active": True, "role": {"$ne": "admin"}}, {"_id": 1}))
        for emp in employees:
            try:
                notify_sop_uploaded(str(emp["_id"]), sop_data["id"], sop.title)
            except Exception:
                pass
    except Exception:
        pass

    return sop_data


@router.get("/", response_model=list)
async def list_sops(skip: int = 0, limit: int = 50):
    sops = list(sops_col.find().skip(skip).limit(limit))
    return [doc_to_dict(s) for s in sops]


# /course/{course_id} must come before /{sop_id} to avoid path conflict
@router.get("/course/{course_id}")
async def get_sops_for_course(course_id: str):
    try:
        course = courses_col.find_one({"_id": ObjectId(course_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    sops = list(sops_col.find({"course_ids": course_id}))
    return [doc_to_dict(s) for s in sops]


@router.get("/{sop_id}", response_model=SOPResponse)
async def get_sop(sop_id: str):
    try:
        sop = sops_col.find_one({"_id": ObjectId(sop_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid SOP ID")
    if not sop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")
    return doc_to_dict(sop)


@router.post("/{sop_id}/upload-file")
async def upload_sop_file(sop_id: str, file: UploadFile = File(...)):
    try:
        sop = sops_col.find_one({"_id": ObjectId(sop_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid SOP ID")
    if not sop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")

    file_extension = file.filename.split(".")[-1]
    file_name = f"sop_{sop_id}_{int(datetime.utcnow().timestamp())}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    file_url = f"/files/sops/{file_name}"
    sops_col.update_one({"_id": ObjectId(sop_id)}, {"$set": {"file_url": file_url}})

    return {"message": "File uploaded successfully", "file_url": file_url, "sop_id": sop_id}


@router.post("/{sop_id}/questions/generate")
async def generate_sop_questions(sop_id: str, payload: GenerateSOPQuestionsRequest):
    try:
        sop = sops_col.find_one({"_id": ObjectId(sop_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid SOP ID")
    if not sop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")

    question_count = max(1, min(payload.question_count, 20))
    source_text = f"{sop['title']}. {sop.get('description') or ''}. {sop.get('content') or ''}"
    candidates = _sentence_candidates(source_text) or [
        sop["title"],
        sop.get("description") or "required SOP compliance steps",
        "employee responsibilities and documentation requirements",
    ]

    questions = [
        _build_sop_question(sop["title"], candidates[i % len(candidates)], i + 1)
        for i in range(question_count)
    ]

    return {"sop_id": sop_id, "difficulty": payload.difficulty, "questions": questions}


@router.post("/{sop_id}/questions/upload", status_code=status.HTTP_201_CREATED)
async def upload_sop_questions(sop_id: str, payload: UploadQuestionsRequest):
    try:
        sop = sops_col.find_one({"_id": ObjectId(sop_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid SOP ID")
    if not sop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")

    return {
        "sop_id": sop_id,
        "uploaded_count": len(payload.questions),
        "questions": payload.questions,
        "message": "SOP questions uploaded successfully",
    }


@router.put("/{sop_id}")
async def update_sop(
    sop_id: str,
    title: str = Form(None),
    description: str = Form(None),
    version: str = Form(None),
):
    try:
        oid = ObjectId(sop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid SOP ID")

    update_fields: dict = {"updated_at": datetime.utcnow()}
    if title:
        update_fields["title"] = title
    if description:
        update_fields["description"] = description
    if version:
        update_fields["version"] = version

    result = sops_col.find_one_and_update(
        {"_id": oid}, {"$set": update_fields}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")
    return doc_to_dict(result)


@router.delete("/{sop_id}")
async def delete_sop(sop_id: str):
    try:
        result = sops_col.delete_one({"_id": ObjectId(sop_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid SOP ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")
    return {"message": "SOP deleted successfully"}


@router.post("/{sop_id}/courses/{course_id}")
async def associate_sop_with_course(sop_id: str, course_id: str):
    try:
        sop = sops_col.find_one({"_id": ObjectId(sop_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid SOP ID")
    if not sop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")

    try:
        course = courses_col.find_one({"_id": ObjectId(course_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    sops_col.update_one({"_id": ObjectId(sop_id)}, {"$addToSet": {"course_ids": course_id}})
    return {"message": "SOP associated with course successfully"}


@router.delete("/{sop_id}/courses/{course_id}")
async def remove_sop_from_course(sop_id: str, course_id: str):
    try:
        sop = sops_col.find_one({"_id": ObjectId(sop_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid SOP ID")
    if not sop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")

    try:
        course = courses_col.find_one({"_id": ObjectId(course_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    sops_col.update_one({"_id": ObjectId(sop_id)}, {"$pull": {"course_ids": course_id}})
    return {"message": "SOP removed from course successfully"}
