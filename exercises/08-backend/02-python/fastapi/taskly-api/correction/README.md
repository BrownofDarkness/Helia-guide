# Correction — taskly-api FastAPI

> Correction parallèle à la version Node (axe 8.1) : **mêmes endpoints, mêmes règles métier, mêmes codes de retour**. C'est la même API vue par deux écosystèmes — Python/FastAPI ici, Node/Hono là-bas.
>
> Lis-la **après avoir tenté le canevas**. Comparer les deux corrections (FastAPI vs Hono) après avoir fait *au moins une* est l'exercice qui rapporte le plus.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Architecture en 7 modules](#2-architecture-en-7-modules)
3. [Sécurité — argon2 + JWT + cookie](#3-sécurité--argon2--jwt--cookie)
4. [Pydantic v2 — validation idiomatique](#4-pydantic-v2--validation-idiomatique)
5. [SQLAlchemy 2 async](#5-sqlalchemy-2-async)
6. [Validation : 3/3 tests](#6-validation--33-tests)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Comparer Node vs FastAPI](#8-comparer-node-vs-fastapi)

---

## 1. Pré-requis et lancement

```bash
uv sync                                       # crée .venv + installe deps
cp .env.example .env
uv run uvicorn app.main:app --reload          # → http://127.0.0.1:8000
# → http://127.0.0.1:8000/docs   (Swagger UI)
# → http://127.0.0.1:8000/redoc  (ReDoc)
```

Tests :

```bash
uv run pytest                # 3 tests async, ~1 s total
uv run pytest -v             # avec détails
uv run pytest --cov=app      # avec couverture
```

## 2. Architecture en 7 modules

```
app/
├── main.py        ← entry, FastAPI() avec lifespan (init_db au démarrage)
├── config.py      ← settings via pydantic-settings (lit .env)
├── db.py          ← engine + AsyncSession + Base
├── models.py      ← User, Task (SQLAlchemy 2 Mapped)
├── deps.py        ← Depends helpers (DB, CurrentUser, SESSION_COOKIE)
├── security.py    ← hash, JWT (HS256), création/vérif tokens
└── routers/
    ├── auth.py    ← POST /auth/register|login|logout, GET /auth/me
    └── tasks.py   ← CRUD complet sur /tasks
```

Une responsabilité par fichier. **Pas de business logic dans `main.py`** — uniquement le câblage. Pas de queries SQL dans les routers — uniquement `await db.execute(...)`.

## 3. Sécurité — argon2 + JWT + cookie

### 3.1 Hashing des mots de passe

```python
# app/security.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False
```

Pourquoi argon2 et pas bcrypt :

| Critère | argon2id | bcrypt |
|---------|----------|--------|
| Recommandation OWASP 2025+ | ✅ Premier choix | Acceptable |
| Résistance GPU/ASIC | ✅ Memory-hard | Faible |
| Limite de mot de passe | Aucune | 72 octets (silencieusement tronqué) |
| Configuration | Memory + iterations + parallelism | Cost factor |

`deprecated="auto"` permet à passlib de re-hasher avec le nouveau scheme si on fait évoluer la config (par exemple ajouter scrypt en futur secondaire). Petit détail, gros confort en migration.

### 3.2 JWT avec algorithme **explicite**

```python
ALGORITHM = "HS256"
ACCESS_TOKEN_TTL = timedelta(hours=24)

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + ACCESS_TOKEN_TTL
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)

def verify_access_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e
    return int(payload["sub"])
```

> ⚠️ **Toujours** passer `algorithm=` à `encode` ET `algorithms=[...]` (au pluriel, en liste blanche) à `decode`. Sans, certaines libs acceptent `alg=none` (token forgé sans signature) ou des confusions HS256/RS256 où on signe avec une clé publique.

### 3.3 Cookie HttpOnly + Secure + SameSite

```python
response.set_cookie(
    SESSION_COOKIE,
    token,
    httponly=True,                          # pas accessible à JS
    samesite="lax",                         # CSRF-safe pour navigations top-level
    secure=settings.is_prod,                # HTTPS only en prod
    max_age=86400,                          # 24h
    path="/",
)
```

La même config que la version Node — c'est un standard OWASP, pas un détail FastAPI.

### 3.4 Pourquoi un cookie et pas Authorization Bearer

| Approche | Avantage | Inconvénient |
|----------|----------|--------------|
| **Cookie HttpOnly** | Inaccessible à JS → résistant XSS | Vulnérable CSRF (mitigé par SameSite=Lax) |
| **Authorization Bearer** | Pas vulnérable CSRF | Stocké en JS (localStorage / mémoire) → vol par XSS |

Pour une web app, **cookie HttpOnly est généralement plus sûr** : un XSS sur ton site est un game-over de toute façon, mais beaucoup d'attaques XSS visent justement à voler des tokens. SameSite=Lax couvre ~99% des CSRF.

Pour une API publique (mobile, autres consumers), **Bearer est plus simple**. C'est un choix contextuel.

## 4. Pydantic v2 — validation idiomatique

### 4.1 Types riches

```python
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class RegisterInput(BaseModel):
    email: EmailStr                                  # validation auto
    name: str = Field(min_length=1, max_length=100)  # contraintes
    password: str = Field(min_length=8, max_length=200)
```

`EmailStr` valide le format (regex + tests DNS basiques). Si l'email est `not-an-email`, FastAPI répond automatiquement **422 Unprocessable Entity** avec le détail de l'erreur — sans une ligne de validation à écrire.

### 4.2 `model_config = ConfigDict(from_attributes=True)` — la nouvelle syntaxe v2

```python
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
```

Permet de sérialiser **un objet SQLAlchemy** directement comme `UserOut.model_validate(user)`. L'ancienne syntaxe `class Config: from_attributes = True` est deprecated en Pydantic v2 — `ConfigDict` est plus typé.

### 4.3 `model_dump(exclude_unset=True)` pour le PATCH

```python
@router.patch("/{task_id}")
async def update_task(task_id: int, input: UpdateTaskInput, ...):
    task = await _get_owned_task(...)
    data = input.model_dump(exclude_unset=True)   # ← ne retient que les champs envoyés
    for key, value in data.items():
        setattr(task, key, value)
    await db.commit()
    return task
```

Sans `exclude_unset=True`, les champs absents seraient `None` dans le dict, et tu **écraserais** des colonnes existantes avec `NULL`. C'est le bug classique du PATCH. Toujours `exclude_unset=True` pour les updates partiels.

## 5. SQLAlchemy 2 async

### 5.1 Style 2.0 avec `Mapped[...]`

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
    )
```

C'est le style **2.0+**, plus typé que l'ancien `Column(...)`. Le `Mapped[...]` informe le type-checker (mypy/pyright) du type de chaque attribut.

### 5.2 `default=utcnow` (callable, pas valeur)

```python
from datetime import UTC, datetime

def utcnow() -> datetime:
    return datetime.now(UTC)

class User(Base):
    created_at: Mapped[datetime] = mapped_column(default=utcnow)   # ← pas utcnow()
```

Si on passait `default=utcnow()` (avec les parenthèses), la valeur serait calculée **une seule fois** au chargement du module — toutes les instances auraient le même `created_at`. En passant la **fonction** sans parenthèses, SQLAlchemy l'appelle au moment de l'insert.

> ⚠️ Si tu vois `created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)` dans du code 2024 — `utcnow()` est **deprecated** depuis Python 3.12. Utiliser `datetime.now(UTC)` (timezone-aware) à la place.

### 5.3 Pattern queries async

```python
result = await db.execute(
    select(Task)
    .where(Task.owner_id == user.id)
    .order_by(Task.created_at.desc())
    .limit(limit)
    .offset(offset)
)
tasks = list(result.scalars())   # ou .scalar_one_or_none() pour 1 résultat
```

Trois choses à mémoriser :

1. `await db.execute(...)` — toujours `await` car la session est async.
2. `select(Model)` — l'API 2.0 (l'ancien `db.query(Model).filter(...)` est deprecated).
3. `result.scalars()` — extrait les objets ORM. Sans `.scalars()`, tu obtiens des tuples.

### 5.4 `expire_on_commit=False` dans `async_sessionmaker`

```python
async_session = async_sessionmaker(engine, expire_on_commit=False)
```

Par défaut, après un commit, SQLAlchemy expire les objets en session — la moindre lecture nécessite un nouveau query. En async, c'est une catastrophe : tu reviens d'un `await db.commit()` et `task.id` re-déclenche du SQL en arrière-plan.

`expire_on_commit=False` désactive ça. Trade-off : tu dois `await db.refresh(obj)` explicitement si tu veux les data côté serveur (ex. après un INSERT pour récupérer l'id auto). Acceptable.

## 6. Validation : 3/3 tests

```bash
uv run pytest -v
```

```
tests/test_api.py::test_health PASSED                              [ 33%]
tests/test_api.py::test_register_login_flow PASSED                 [ 66%]
tests/test_api.py::test_tasks_crud_and_isolation PASSED            [100%]

============================== 3 passed, 1 warning in 0.97s ==============================
```

Le 1 warning restant vient de `passlib` qui accède à `argon2.__version__` d'une façon dépréciée — c'est dans `passlib`, pas dans notre code.

Couverture des 3 tests :

| Test | Vérifie |
|------|---------|
| `test_health` | `/health` répond 200 + `{ status: "ok", db: "ok" }` |
| `test_register_login_flow` | POST /register → 201, POST /login → 200 + cookie posé, GET /auth/me avec cookie → 200 |
| `test_tasks_crud_and_isolation` | User A crée une tâche, User B essaie de la voir → **404** (pas 403, pour éviter de leak l'existence) |

Le **404 vs 403** est subtil : pour un user qui n'est pas owner, on retourne 404 plutôt que 403. Sinon un attaquant peut énumérer quelles tâches existent (« 403 = existe, 404 = n'existe pas »). C'est le **« infosec by ambiguity »** appliqué à juste titre.

## 7. Pièges réels rencontrés

Quatre pièges, dont un nouveau à enregistrer dans `pieges.ts` :

1. **`pydantic` au lieu de `pydantic[email]`** → erreur `email-validator is not installed` au premier import. Fix : toujours `pydantic[email]` quand on utilise `EmailStr`.
2. **`class Config: from_attributes = True` (Pydantic v1)** → deprecated en Pydantic v2. Fix : `model_config = ConfigDict(from_attributes=True)`.
3. **`datetime.utcnow()` deprecated en Python 3.12+** → fix : `datetime.now(UTC)` avec `from datetime import UTC`.
4. **`default=datetime.utcnow()` au lieu de `default=utcnow`** → la valeur est calculée une seule fois au chargement du module, toutes les rows ont le même timestamp. Fix : passer la **fonction**, pas son résultat.

Le piège #1 est suffisamment générique pour mériter une entrée dans `pieges.ts` (toute API FastAPI moderne tombe dessus).

## 8. Comparer Node vs FastAPI

Cette correction est **structurellement parallèle** à `exercises/08-backend/01-nodejs-typescript/taskly-api/correction/`. Les différences à observer :

| Aspect | Node / Hono | Python / FastAPI |
|--------|-------------|-------------------|
| **Validation entrées** | Zod schémas | Pydantic models |
| **ORM** | Drizzle (SQL en TS) | SQLAlchemy 2 async (Python idiomatique) |
| **DI** | Pas natif (passé en argument ou `c.set/get`) | `Depends` + `Annotated[T, Depends(...)]` |
| **Doc OpenAPI** | Pas auto (chanfana possible) | **Auto à `/docs` et `/redoc`** |
| **Hash** | argon2 (`@node-rs/argon2`) | argon2 (passlib) |
| **JWT** | `hono/jwt` | `python-jose[cryptography]` |
| **Tests** | Vitest + `app.request()` | pytest + httpx async |
| **Concurrence** | Event loop V8 | asyncio (event loop CPython) |
| **Verbosité** | Compact (`async (c) => c.json(...)`) | Plus explicite (séparation routes/schemas/models) |
| **Edge / serverless** | Excellent (Hono → Cloudflare Workers, Vercel Edge) | Pas natif (uvicorn + ASGI) |
| **Écosystème ML / data** | Limité | Énorme (numpy, pandas, scikit-learn, …) |

**Conclusion pragmatique** : les deux livrent la même valeur pour cette API. Choisis :

- **FastAPI** si tu fais du Python ailleurs (data/ML), si la doc auto t'intéresse, si tu apprécies la DI explicite.
- **Hono / Node** si tu cibles l'edge, si tu veux une stack mono-langage front + back, ou si la concurrence I/O est critique.

L'exercice de comparer **les mêmes 10 endpoints implémentés deux fois** est probablement l'apprentissage le plus utile de l'axe 8.
