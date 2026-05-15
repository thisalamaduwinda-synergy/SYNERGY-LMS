from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from passlib.context import CryptContext
from app.database import users_col, doc_to_dict
from app.schemas import UserCreate, UserUpdate, UserResponse
from datetime import datetime

router = APIRouter(prefix="/api/v1/users", tags=["users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _oid(user_id: str) -> ObjectId:
    try:
        return ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    if users_col.find_one({"email": user.email}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if users_col.find_one({"username": user.username}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    now = datetime.utcnow()
    user_doc = {
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "department": user.department,
        "phone": user.phone,
        "hashed_password": _hash_password(user.password),
        "is_active": True,
        "is_admin": False,
        "created_at": now,
        "updated_at": now,
    }
    result = users_col.insert_one(user_doc)
    return doc_to_dict(users_col.find_one({"_id": result.inserted_id}))


@router.get("/", response_model=list[UserResponse])
async def list_users(skip: int = 0, limit: int = 100):
    users = list(users_col.find().skip(skip).limit(limit))
    return [doc_to_dict(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = users_col.find_one({"_id": _oid(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return doc_to_dict(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, updates: UserUpdate):
    oid = _oid(user_id)
    if not users_col.find_one({"_id": oid}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    fields = {k: v for k, v in updates.model_dump().items() if v is not None}

    if "password" in fields:
        fields["hashed_password"] = _hash_password(fields.pop("password"))

    if "email" in fields:
        clash = users_col.find_one({"email": fields["email"], "_id": {"$ne": oid}})
        if clash:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")

    fields["updated_at"] = datetime.utcnow()
    updated = users_col.find_one_and_update({"_id": oid}, {"$set": fields}, return_document=True)
    return doc_to_dict(updated)


@router.patch("/{user_id}/activate", response_model=UserResponse)
async def activate_user(user_id: str):
    oid = _oid(user_id)
    updated = users_col.find_one_and_update(
        {"_id": oid},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}},
        return_document=True,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return doc_to_dict(updated)


@router.patch("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(user_id: str):
    oid = _oid(user_id)
    updated = users_col.find_one_and_update(
        {"_id": oid},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}},
        return_document=True,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return doc_to_dict(updated)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str):
    result = users_col.delete_one({"_id": _oid(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
