from typing import Annotated, AsyncGenerator
from fastapi import Depends, Cookie, HTTPException, status
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
    if not session:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unauthorized")
    try:
        user_id = verify_access_token(session)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
