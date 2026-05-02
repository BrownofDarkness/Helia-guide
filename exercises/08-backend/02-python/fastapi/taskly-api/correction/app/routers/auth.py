from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select

from app.deps import DB, CurrentUser, SESSION_COOKIE
from app.models import User
from app.security import hash_password, verify_password, create_access_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterInput(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=200)


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(input: RegisterInput, db: DB) -> User:
    existing = await db.execute(select(User).where(User.email == input.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already used")

    user = User(
        email=input.email,
        name=input.name,
        password_hash=hash_password(input.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=UserOut)
async def login(input: LoginInput, response: Response, db: DB) -> User:
    result = await db.execute(select(User).where(User.email == input.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(input.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    token = create_access_token(user.id)
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=settings.is_prod,
        max_age=86400,
        path="/",
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(user: CurrentUser, response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return None


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user
