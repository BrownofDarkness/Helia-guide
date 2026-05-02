from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field
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
    id: int
    email: str
    name: str

    class Config:
        from_attributes = True


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(input: RegisterInput, db: DB) -> User:
    # TODO 8 : vérifier qu'aucun user n'a cet email, sinon 409 Conflict
    # TODO 9 : hasher le mot de passe et insérer
    raise NotImplementedError


@router.post("/login", response_model=UserOut)
async def login(input: LoginInput, response: Response, db: DB) -> User:
    # TODO 10 : trouver le user par email, vérifier le password
    # TODO 11 : créer un token, poser le cookie SESSION_COOKIE
    # Indice : response.set_cookie(SESSION_COOKIE, token, httponly=True,
    #          samesite="lax", secure=settings.is_prod, max_age=86400)
    raise NotImplementedError


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(user: CurrentUser, response: Response):
    response.delete_cookie(SESSION_COOKIE)
    return None


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user
