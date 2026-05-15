from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.database import users_col, doc_to_dict
from app.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(credentials: LoginRequest):
    user = users_col.find_one({"email": credentials.email})
    if not user or not pwd_context.verify(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token_data = {
        "sub": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "employee"),
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    access_token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    user_dict = doc_to_dict(user)
    user_dict.pop("hashed_password", None)

    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}
