from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select

from app.deps import DB, CurrentUser
from app.models import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])


class CreateTaskInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    due_at: str | None = None


class UpdateTaskInput(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    due_at: str | None = None
    done: bool | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: str | None
    done: bool
    due_at: str | None
    created_at: str

    class Config:
        from_attributes = True


class Pagination(BaseModel):
    total: int
    page: int
    limit: int


class TaskListOut(BaseModel):
    data: list[TaskOut]
    pagination: Pagination


@router.get("", response_model=TaskListOut)
async def list_tasks(
    user: CurrentUser,
    db: DB,
    page: int = 1,
    limit: int = 20,
) -> TaskListOut:
    # TODO 12 : retourner data + pagination, filtré par owner_id
    # Astuce : limit = max(1, min(limit, 100)), offset = (page - 1) * limit
    raise NotImplementedError


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(input: CreateTaskInput, user: CurrentUser, db: DB) -> Task:
    # TODO 13
    raise NotImplementedError


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: int, user: CurrentUser, db: DB) -> Task:
    # TODO 14 : 404 si la tâche n'existe pas ou n'appartient pas au user
    raise NotImplementedError


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, input: UpdateTaskInput, user: CurrentUser, db: DB) -> Task:
    # TODO 15
    raise NotImplementedError


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, user: CurrentUser, db: DB):
    # TODO 16
    raise NotImplementedError
