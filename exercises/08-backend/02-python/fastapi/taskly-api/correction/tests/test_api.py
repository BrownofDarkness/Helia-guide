import os
# Configurer l'env AVANT d'importer l'app
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret-min-16-chars-long")
os.environ.setdefault("ENV", "test")

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db import init_db


@pytest.fixture(scope="session")
async def initialized_app():
    await init_db()
    return app


@pytest.fixture
async def client(initialized_app):
    transport = ASGITransport(app=initialized_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


async def test_register_login_flow(client: AsyncClient):
    # Register
    r = await client.post(
        "/auth/register",
        json={"email": "alice@example.com", "name": "Alice", "password": "password123"},
    )
    assert r.status_code == 201
    user = r.json()
    assert user["email"] == "alice@example.com"
    assert "password" not in user
    assert "password_hash" not in user

    # Register avec même email → 409
    r = await client.post(
        "/auth/register",
        json={"email": "alice@example.com", "name": "Alice", "password": "password123"},
    )
    assert r.status_code == 409

    # Validation 422
    r = await client.post(
        "/auth/register",
        json={"email": "not-an-email", "name": "", "password": "123"},
    )
    assert r.status_code == 422

    # Login
    r = await client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert r.status_code == 200
    assert "session" in r.cookies

    # /me sans cookie
    fresh = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    r = await fresh.get("/auth/me")
    assert r.status_code == 401
    await fresh.aclose()

    # /me avec cookie
    r = await client.get("/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "alice@example.com"


async def test_tasks_crud_and_isolation(client: AsyncClient):
    # Créer Bob (Alice est déjà connectée du test précédent — tests partagent une DB)
    r = await client.post(
        "/auth/register",
        json={"email": "bob@example.com", "name": "Bob", "password": "password456"},
    )
    assert r.status_code == 201

    # Login Alice (re-pose le cookie sur la session)
    r = await client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert r.status_code == 200

    # Créer une tâche Alice
    r = await client.post("/tasks", json={"title": "Tâche d'Alice"})
    assert r.status_code == 201
    alice_task_id = r.json()["id"]

    # Lister
    r = await client.get("/tasks")
    assert r.status_code == 200
    body = r.json()
    assert body["pagination"]["total"] >= 1

    # Bob se connecte (override le cookie)
    bob = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    r = await bob.post(
        "/auth/login",
        json={"email": "bob@example.com", "password": "password456"},
    )
    assert r.status_code == 200

    # Bob ne voit pas la tâche d'Alice
    r = await bob.get(f"/tasks/{alice_task_id}")
    assert r.status_code == 404

    # Bob list = vide
    r = await bob.get("/tasks")
    assert r.json()["pagination"]["total"] == 0

    await bob.aclose()

    # Alice update
    r = await client.patch(f"/tasks/{alice_task_id}", json={"done": True})
    assert r.status_code == 200
    assert r.json()["done"] is True

    # Alice delete
    r = await client.delete(f"/tasks/{alice_task_id}")
    assert r.status_code == 204

    r = await client.get(f"/tasks/{alice_task_id}")
    assert r.status_code == 404
