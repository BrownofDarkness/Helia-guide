"""
Dépendances partagées : get_db (session DB) et get_current_user.
"""
from typing import Annotated, AsyncGenerator
from fastapi import Depends, Cookie, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AsyncSessionLocal
from app.models import User
from app.security import verify_access_token

SESSION_COOKIE = "session"


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


DB = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DB,
    session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> User:
    # TODO 5 : si session manquante → 401 Unauthorized
    # TODO 6 : verify_access_token(session). Si invalide → 401 Invalid token
    # TODO 7 : charger le user depuis la DB. Si absent → 401 User not found
    raise NotImplementedError


CurrentUser = Annotated[User, Depends(get_current_user)]
