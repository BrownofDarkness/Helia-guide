"""
À COMPLÉTER : helpers password (argon2 via passlib) + JWT (python-jose).
"""
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from jose import jwt, JWTError

from app.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
ALGORITHM = "HS256"
ACCESS_TOKEN_TTL = timedelta(hours=24)


def hash_password(plain: str) -> str:
    # TODO 1
    raise NotImplementedError


def verify_password(plain: str, hashed: str) -> bool:
    # TODO 2 : retourner False si l'algorithme passlib lève une exception (mauvais hash)
    raise NotImplementedError


def create_access_token(user_id: int) -> str:
    # TODO 3 : encoder un JWT { sub: str(user_id), exp: now + ACCESS_TOKEN_TTL }
    raise NotImplementedError


def verify_access_token(token: str) -> int:
    # TODO 4 : décoder, retourner int(payload["sub"]). Lever ValueError si invalide.
    raise NotImplementedError
