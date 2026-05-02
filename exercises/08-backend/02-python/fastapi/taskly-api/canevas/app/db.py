from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    """Crée les tables si elles n'existent pas. À appeler au démarrage."""
    from app import models  # noqa: F401  enregistre les modèles

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
