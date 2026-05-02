from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text

from app.db import init_db, AsyncSessionLocal
from app.routers import auth, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="taskly-api", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception as e:
        return {"status": "ok", "db": "down", "error": str(e)}


app.include_router(auth.router)
app.include_router(tasks.router)
