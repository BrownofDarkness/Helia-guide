# Canevas — taskly-api FastAPI

> Tu vas refaire **exactement la même API** que la version Node (axe 8.1) mais en **Python + FastAPI + SQLAlchemy 2 async + Pydantic v2**. Les endpoints, les règles métier, le comportement des erreurs : identiques. Le but : voir comment les mêmes problèmes se résolvent dans deux écosystèmes différents.
>
> Ne fais pas l'exo Node si tu n'as pas envie — l'exo Python tient debout tout seul. Mais comparer les deux après est un des moments les plus formateurs du guide.

## Ce que tu vas faire

Une API REST avec auth JWT (cookie HttpOnly) :

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `POST` | `/auth/register` | non | Inscription (email + name + password ≥ 8) |
| `POST` | `/auth/login` | non | Connexion → cookie JWT HttpOnly |
| `POST` | `/auth/logout` | oui | Supprime le cookie |
| `GET` | `/auth/me` | oui | User courant |
| `GET` | `/tasks?page=&limit=` | oui | Liste paginée |
| `POST` | `/tasks` | oui | Créer |
| `GET` | `/tasks/{id}` | oui | Détail (404 si pas le proprio) |
| `PATCH` | `/tasks/{id}` | oui | Mettre à jour |
| `DELETE` | `/tasks/{id}` | oui | Supprimer |
| `GET` | `/health` | non | `{ status, db }` |

À la fin, tu auras vécu :
- **`Depends`** (l'injection de dépendances native FastAPI) — vraiment pratique vs « passe le DB en argument partout »
- **Pydantic v2** : `EmailStr`, `Field(min_length)`, `ConfigDict(from_attributes=True)`, `model_dump(exclude_unset=True)`
- **SQLAlchemy 2 async** : `AsyncSession`, `select(...)`, `Mapped[...]`
- **Auto-doc OpenAPI** sur `/docs` — gratuit, sans aucun effort
- **passlib + argon2id** (l'algo recommandé OWASP 2026 pour les passwords)

## Pré-requis

- **Python ≥ 3.12** + **uv** (`uv --version`).

Si uv n'est pas installé :

| OS | Commande |
|----|----------|
| Linux/macOS/WSL | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Windows | `winget install astral-sh.uv` |

uv installera Python 3.12 automatiquement si tu ne l'as pas. Pas besoin de `pyenv`.

## Démarrer

```bash
uv sync                                       # installe deps depuis pyproject.toml
cp .env.example .env
uv run uvicorn app.main:app --reload
# → http://127.0.0.1:8000
# → http://127.0.0.1:8000/docs   (Swagger UI auto-générée)
```

Modifie un fichier `.py`, uvicorn `--reload` redémarre. La page `/docs` est l'écran le plus utile pendant le dev — tu peux tester chaque endpoint depuis le navigateur sans Postman.

## TODO (16 au total)

| # | Fichier | Sujet |
|---|---------|-------|
| 1–2 | `app/security.py` | `hash_password` + `verify_password` (argon2 via passlib) |
| 3–4 | `app/security.py` | `create_access_token` + `verify_access_token` (JWT via python-jose) |
| 5–7 | `app/deps.py` | `get_current_user` (cookie → user) — **dépendance** réutilisable |
| 8–9 | `app/routers/auth.py` | `register` (email unique → 409, hash, insert, return UserOut) |
| 10–11 | `app/routers/auth.py` | `login` (verify password, create token, set cookie HttpOnly) |
| 12–16 | `app/routers/tasks.py` | list / create / get / update / delete |

## Ordre suggéré

```
1. security.py (TODO 1–4)        → fondations crypto avant tout
2. deps.py (TODO 5–7)            → la dep get_current_user réutilisable partout
3. routers/auth.py (TODO 8–11)   → tester /register + /login via /docs
4. routers/tasks.py (TODO 12–16) → testable une fois qu'on a un cookie
```

Le **scope de chaque TODO est petit**. Si tu sèches plus de 20 minutes sur un TODO, regarde la correction du fichier précédent — souvent le blocage vient d'un import ou d'un type mal compris en amont.

## TODO clés

### Hash argon2id (passlib)
```python
from passlib.context import CryptContext
pwd = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd.verify(plain, hashed)
```

### JWT avec algorithme explicite
```python
from datetime import UTC, datetime, timedelta
from jose import jwt
from app.config import settings

ALG = "HS256"

def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(UTC) + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALG)

def verify_access_token(token: str) -> int:
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALG])
    return int(payload["sub"])
```

> ⚠️ **Toujours préciser `algorithm=` ET `algorithms=`**. Sans, certaines libs acceptent `alg=none` (token forgé sans signature) — c'est l'attaque **alg-confusion** classique.

### Dependency `get_current_user`
```python
from typing import Annotated
from fastapi import Cookie, Depends, HTTPException

SESSION_COOKIE = "session"

async def get_current_user(
    db: DB,
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> User:
    if not session:
        raise HTTPException(401, "Unauthorized")
    try:
        user_id = verify_access_token(session)
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(401, "User not found")
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]
```

Ensuite dans les routes : `async def me(user: CurrentUser): ...`. **Une fois écrite cette dep, elle est réutilisée sans copier-coller dans toutes les routes protégées.**

## Tester

```bash
uv run pytest
```

3 tests pytest async qui couvrent :
- `/health` répond 200
- Inscription → connexion → `/auth/me` retourne le bon user
- Création de tâches → user A ne voit pas les tâches de user B (404, pas 403)

## Bloqué ?

- **`uv sync` plante avec `email-validator is not installed`** → ton `pyproject.toml` a `pydantic` au lieu de `pydantic[email]`. Le canevas l'a corrigé, mais si tu démarres un nouveau projet, ajoute toujours `[email]` quand tu utilises `EmailStr`.
- **`PydanticDeprecatedSince20: Support for class-based Config is deprecated`** → tu utilises l'ancienne syntaxe `class Config: from_attributes = True`. La nouvelle est `model_config = ConfigDict(from_attributes=True)` (en haut de la classe). Pydantic v2 prefere ça.
- **`utcnow() is deprecated`** → en Python 3.12+, `datetime.utcnow()` n'est plus recommandé. Utilise `datetime.now(UTC)` (avec `from datetime import UTC`).
- **Le cookie n'est pas envoyé après `set_cookie`** → vérifie que tu fais `response.set_cookie(...)` (avec `response: Response` en paramètre de la route) et **pas** `Response(...)` retourné directement. FastAPI renvoie ton `response_model` mais ajoute les cookies si tu utilises l'objet Response injecté.
- **`/auth/me` retourne toujours 401 même après login** → soit le cookie ne se pose pas (voir ci-dessus), soit ton client de test ne le renvoie pas (httpx est cookie-aware par défaut, mais vérifie `client = AsyncClient(transport=ASGITransport(app), base_url="http://test")` plutôt que `AsyncClient(app=app, ...)`).
- **Tests async qui ne tournent pas** → ajoute `[tool.pytest.ini_options] asyncio_mode = "auto"` dans `pyproject.toml` (sinon il faut décorer chaque test avec `@pytest.mark.asyncio`).
- **`AttributeError: type object 'User' has no attribute '_sa_class_manager'`** → tu as oublié d'appeler `init_db()` au démarrage. Le `lifespan` du `main.py` doit créer les tables avant que les routes acceptent des requêtes.

## Ne commit pas

`.env`, `.venv/`, `*.db`, `__pycache__/`. Tous dans `.gitignore` par défaut, mais vérifie après ta première run que tu n'as pas un `taskly.db` traînant qui se ferait commiter.
