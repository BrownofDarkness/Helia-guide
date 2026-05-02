from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
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
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    done: bool
    due_at: str | None
    created_at: datetime


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
    page = max(1, page)
    limit = max(1, min(limit, 100))
    offset = (page - 1) * limit

    total_result = await db.execute(
        select(func.count(Task.id)).where(Task.owner_id == user.id)
    )
    total = int(total_result.scalar_one() or 0)

    result = await db.execute(
        select(Task)
        .where(Task.owner_id == user.id)
        .order_by(Task.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    tasks = list(result.scalars())
    return TaskListOut(
        data=[TaskOut.model_validate(t) for t in tasks],
        pagination=Pagination(total=total, page=page, limit=limit),
    )


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(input: CreateTaskInput, user: CurrentUser, db: DB) -> Task:
    task = Task(
        owner_id=user.id,
        title=input.title,
        description=input.description,
        due_at=input.due_at,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def _get_owned_task(db, task_id: int, user_id: int) -> Task:
    result = await db.execute(
        select(Task).where(and_(Task.id == task_id, Task.owner_id == user_id))
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return task


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: int, user: CurrentUser, db: DB) -> Task:
    return await _get_owned_task(db, task_id, user.id)


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, input: UpdateTaskInput, user: CurrentUser, db: DB) -> Task:
    task = await _get_owned_task(db, task_id, user.id)
    data = input.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, user: CurrentUser, db: DB):
    task = await _get_owned_task(db, task_id, user.id)
    await db.delete(task)
    await db.commit()
    return None
