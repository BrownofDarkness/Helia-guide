# Exercice 8.2 — taskly-api en FastAPI

> **Axe** : 8 — Backend (parcours Python / FastAPI)
> **Difficulté** : avancé
> **Durée estimée** : 8 à 16 heures
> **Prérequis** : axe 8 lu (parcours Python), **Python 3.12+**, **uv**

## ⚙️ Avant de commencer — outils nécessaires

### Python 3.12+ et uv

| OS | Comment |
|----|---------|
| **Linux / macOS / WSL** | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **Windows (hors WSL)** | `winget install astral-sh.uv` ou installeur depuis [docs.astral.sh/uv](https://docs.astral.sh/uv/) |

uv installera la version Python automatiquement si nécessaire.

**Vérifie** :

```bash
uv --version          # uv 0.5.x ou plus
uv python list        # liste les versions Python installables
```

## 🎯 Objectifs pédagogiques

- Construire la **même API** que la version Node, en FastAPI
- Utiliser **SQLAlchemy 2 async** + **SQLite (aiosqlite)**
- Authentifier avec **JWT en cookie HttpOnly**, hasher avec **argon2id**
- Valider avec **Pydantic v2**
- Tester avec **pytest** + **httpx**

## 📋 Énoncé

Implémente exactement les **mêmes endpoints** que la version Node de taskly-api :

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `POST` | `/auth/register` | non | Inscription |
| `POST` | `/auth/login` | non | Connexion → cookie JWT |
| `POST` | `/auth/logout` | oui | Supprime le cookie |
| `GET` | `/auth/me` | oui | User courant |
| `GET` | `/tasks` | oui | Liste paginée (`?page=&limit=`) |
| `POST` | `/tasks` | oui | Créer |
| `GET` | `/tasks/{id}` | oui | Détail (404 si pas le proprio) |
| `PATCH` | `/tasks/{id}` | oui | Mettre à jour |
| `DELETE` | `/tasks/{id}` | oui | Supprimer |
| `GET` | `/health` | non | `{ status, db }` |

Comparer **côté à côté** les deux implémentations (Node/TS vs Python/FastAPI) est très formateur.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| `uv sync` puis `uv run uvicorn app.main:app` démarre sur `:8000` | |
| `/docs` affiche la spec OpenAPI Swagger UI gratuitement | |
| `uv run pytest` passe | tests pytest async sur les routes |
| Les **mots de passe ne sont jamais retournés** | |
| Un user ne voit pas les tâches d'un autre | 404 |
| Validation Pydantic → 422 avec détails | |

### Bonus

- Gérer les erreurs avec un **handler global** plutôt que try/except dans chaque route.
- Ajouter **rate-limiting** sur `/auth/login` avec `slowapi`.
- Ajouter **type-checking strict** avec mypy ou pyright.

## 🛠 Comment commencer

```bash
cd canevas/
uv sync          # installe Python + deps depuis uv.lock
cp .env.example .env
uv run uvicorn app.main:app --reload
# http://127.0.0.1:8000/docs
```

## 🧪 S'auto-valider

```bash
uv run pytest
```

## 💡 Indices

<details>
<summary>1. Structure suggérée</summary>

```
app/
├── main.py                ← entry, instancie FastAPI()
├── config.py              ← settings via pydantic-settings
├── db.py                  ← engine + session async
├── models.py              ← SQLAlchemy 2 (Task, User)
├── deps.py                ← Depends helpers (get_db, get_current_user)
├── security.py            ← hash, JWT helpers
└── routers/
    ├── auth.py
    └── tasks.py
```
</details>

<details>
<summary>2. Hashing argon2id avec passlib</summary>

```python
from passlib.context import CryptContext

pwd = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd.verify(plain, hashed)
```
</details>

<details>
<summary>3. JWT et cookie HttpOnly</summary>

```python
from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi import Response, Cookie, HTTPException, Depends

SECRET = settings.JWT_SECRET
ALG = "HS256"

def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET, algorithm=ALG)

def verify_token(token: str) -> int:
    payload = jwt.decode(token, SECRET, algorithms=[ALG])
    return int(payload["sub"])

# Pose le cookie
response.set_cookie("session", token, httponly=True, samesite="lax",
                    secure=settings.is_prod, max_age=86400)
```
</details>

<details>
<summary>4. Dependency get_current_user</summary>

```python
async def get_current_user(
    session: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not session:
        raise HTTPException(401, "Unauthorized")
    try:
        user_id = verify_token(session)
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(401, "User not found")
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/).

## 📚 Pour aller plus loin

- Compare la version FastAPI à la version Node (`exercises/08-backend/01-nodejs-typescript/taskly-api/`).
- Migre de SQLite à PostgreSQL en changeant `DATABASE_URL` (asyncpg).
- Ajoute Alembic pour les migrations versionnées.
- Déploie sur Render ou Fly.io.
