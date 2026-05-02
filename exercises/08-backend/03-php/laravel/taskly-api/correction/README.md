# Correction — taskly-api Laravel 12

> Cette correction présente la 3e implémentation des **mêmes 10 endpoints** : Hono (Node), FastAPI (Python), maintenant Laravel (PHP). Mêmes contrats, mêmes codes HTTP, mêmes règles métier — trois philosophies différentes.
>
> Ce dossier ne contient **pas** tout le scaffold Laravel (qui ferait 200+ fichiers). Tu scaffolds Laravel toi-même puis tu copies `correction/files/` par-dessus.

## Sommaire

1. [Application en 3 commandes](#1-application-en-3-commandes)
2. [Structure des fichiers fournis](#2-structure-des-fichiers-fournis)
3. [Routes — `apiResource` est ton ami](#3-routes--apiresource-est-ton-ami)
4. [Sanctum tokens vs JWT](#4-sanctum-tokens-vs-jwt)
5. [Form Requests — validation déclarative](#5-form-requests--validation-déclarative)
6. [Tests Pest — l'expressivité PHP](#6-tests-pest--lexpressivité-php)
7. [Comparatif Hono vs FastAPI vs Laravel](#7-comparatif-hono-vs-fastapi-vs-laravel)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Application en 3 commandes

```bash
# Depuis canevas/ (vide)
composer create-project laravel/laravel . "^12.0" --no-interaction

# Configure SQLite (cf. canevas README pour le détail .env)
php artisan install:api          # active Sanctum

# Copie les fichiers de correction par-dessus le scaffold
cp -r ../correction/files/* .

php artisan migrate
php artisan test                  # Pest
php artisan serve                 # → http://localhost:8000
```

## 2. Structure des fichiers fournis

```
files/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php       ← register/login/logout/me (50 lignes)
│   │   │   └── TaskController.php       ← index/store/show/update/destroy
│   │   └── Requests/
│   │       ├── RegisterRequest.php      ← validation register
│   │       ├── LoginRequest.php
│   │       ├── StoreTaskRequest.php     ← validation POST /tasks
│   │       └── UpdateTaskRequest.php
│   └── Models/
│       ├── Task.php                     ← $fillable, $casts, relation owner()
│       └── User.php                     ← relation tasks()
├── database/
│   ├── factories/
│   │   └── TaskFactory.php              ← pour les tests Pest
│   └── migrations/
│       └── 2026_04_29_000000_create_tasks_table.php
├── routes/
│   └── api.php                          ← 7 lignes pour 10 endpoints
└── tests/
    └── Feature/
        ├── AuthTest.php                 ← Pest
        └── TaskTest.php                 ← Pest
```

Total : **13 fichiers**. À comparer aux ~30 fichiers de la version FastAPI et aux ~25 de la version Hono. Laravel s'appuie sur l'auto-loading + les conventions pour réduire le code à écrire.

## 3. Routes — `apiResource` est ton ami

```php
// routes/api.php
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::apiResource('tasks', TaskController::class);    // ← 5 routes
});
```

`Route::apiResource('tasks', TaskController::class)` génère **automatiquement** ces 5 routes :

| Méthode | URL | Action contrôleur |
|---------|-----|---------------------|
| `GET` | `/api/tasks` | `index` |
| `POST` | `/api/tasks` | `store` |
| `GET` | `/api/tasks/{task}` | `show` |
| `PATCH/PUT` | `/api/tasks/{task}` | `update` |
| `DELETE` | `/api/tasks/{task}` | `destroy` |

Le **{task}** est le **route model binding** : Laravel reçoit l'id, fait `Task::findOrFail($id)`, et passe l'instance à la méthode du contrôleur. Si la tâche n'existe pas → 404 automatique. Pas une ligne à écrire.

`->middleware('throttle:5,1')` : max 5 requêtes/minute par IP sur `/login`. Une ligne pour rate-limit.

## 4. Sanctum tokens vs JWT

```php
// AuthController::login
public function login(LoginRequest $request): JsonResponse
{
    if (!Auth::attempt($request->only('email', 'password'))) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }

    $user = Auth::user();
    $token = $user->createToken('api')->plainTextToken;

    return response()->json([
        'user'  => $user,
        'token' => $token,
    ]);
}
```

### 4.1 Sanctum tokens (mode utilisé ici)

C'est l'analogue PHP de **JWT Bearer token** :

- Login → `$user->createToken('api')` insère une row dans `personal_access_tokens` (table créée par `install:api`) et retourne la string lisible (`plainTextToken`).
- Le client envoie ensuite `Authorization: Bearer <token>` à chaque requête.
- Au logout, `$request->user()->currentAccessToken()->delete()` supprime la row → token instantanément invalide côté serveur.

### 4.2 Différence importante avec JWT

| Aspect | JWT (Hono / FastAPI) | Sanctum tokens (Laravel) |
|--------|-----------------------|---------------------------|
| Stockage | Pas en DB — vérification cryptographique | En DB (table `personal_access_tokens`) |
| Révocation | Pas immédiate (token reste valide jusqu'à exp) | Immédiate (DELETE de la row) |
| Performance | 0 query DB par requête authentifiée | 1 query par requête authentifiée |
| Stateful ? | Non | Oui |

**Quand préférer Sanctum** : besoin de révoquer instantanément (logout d'urgence, suspect compromis).
**Quand préférer JWT** : edge / serverless où une DB par requête est cher.

### 4.3 Sanctum mode "SPA" (cookies)

L'autre mode de Sanctum, **non utilisé ici**, pose un cookie httpOnly comme la version FastAPI/Hono. Il est plus sûr (pas de stockage côté JS) mais nécessite que front et back soient sur le même domaine. C'est ce que ferait un dashboard Next.js sur le même Vercel/serveur.

**Règle simple** : API publique consommée par mobiles ou clients tiers → tokens Bearer. SPA web sur le même domaine → cookies SPA.

## 5. Form Requests — validation déclarative

```php
// app/Http/Requests/StoreTaskRequest.php
public function rules(): array
{
    return [
        'title'       => 'required|string|min:1|max:200',
        'description' => 'nullable|string|max:2000',
        'due_at'      => 'nullable|date',
    ];
}

public function authorize(): bool
{
    return true;     // l'auth est gérée par middleware('auth:sanctum')
}
```

Puis dans le contrôleur :

```php
public function store(StoreTaskRequest $request): JsonResponse
{
    $task = $request->user()->tasks()->create($request->validated());
    return response()->json($task, Response::HTTP_CREATED);
}
```

### 5.1 Ce qui se passe

1. Laravel détecte `StoreTaskRequest $request` dans la signature → instancie le Form Request
2. Avant que la méthode du contrôleur soit appelée, Laravel exécute `rules()`
3. Si validation échoue → **réponse 422 automatique** avec `{ message, errors: { title: ["..."], … } }`
4. Si validation réussit → la méthode du contrôleur reçoit le request validé
5. `$request->validated()` retourne **uniquement** les champs déclarés dans `rules()` — pas de risque d'injection de champs non prévus

### 5.2 Pourquoi c'est puissant

- **Aucune ligne de code** dans le contrôleur pour la validation. Pas de `try/catch`, pas de check manuel.
- **422 conforme** par défaut (le statut sémantique correct, pas 400).
- **`$request->validated()`** est la version "safe" — `$request->all()` peut contenir des champs non validés.
- **Mass-assignment protection** via `$fillable` du model — impossible d'écrire `owner_id` depuis le client même s'il est dans le JSON.

C'est l'équivalent PHP de Pydantic ou Zod, mais **intégré au framework** sans dépendance externe.

## 6. Tests Pest — l'expressivité PHP

```php
// tests/Feature/TaskTest.php
uses(RefreshDatabase::class);

it('lists tasks of the authenticated user only', function () {
    $alice = User::factory()->create();
    $bob   = User::factory()->create();
    Task::factory()->count(3)->for($alice, 'owner')->create();
    Task::factory()->count(2)->for($bob, 'owner')->create();

    $response = $this->actingAs($alice, 'sanctum')->getJson('/api/tasks');

    $response->assertOk()->assertJsonPath('pagination.total', 3);
});

it('returns 404 when fetching another user\'s task', function () {
    $alice = User::factory()->create();
    $bob   = User::factory()->create();
    $bobsTask = Task::factory()->for($bob, 'owner')->create();

    $this->actingAs($alice, 'sanctum')
        ->getJson("/api/tasks/{$bobsTask->id}")
        ->assertNotFound();
});
```

### Trois choses à observer

1. **`User::factory()->create()`** : génère un user complet (email random valide, password hashé, etc.) en 1 ligne. Plus besoin d'écrire des fixtures.
2. **`Task::factory()->count(3)->for($alice, 'owner')->create()`** : 3 tâches dont l'owner est Alice. Le `'owner'` désigne le nom de la relation dans le model — `for` sait quelle FK utiliser.
3. **`actingAs($alice, 'sanctum')`** : simule l'auth sans passer par `/login`. Utile pour tester les routes protégées sans setup.
4. **`assertJsonPath('pagination.total', 3)`** : assertion sur un chemin JSON précis. Plus lisible que `assertEquals($response->json('pagination.total'), 3)`.

C'est ce qui fait la productivité Laravel : **tout est intégré**. Pas besoin de configurer un mocker, de hash manuellement les passwords, de simuler l'auth — chaque outil a un raccourci de première classe.

## 7. Comparatif Hono vs FastAPI vs Laravel

Les trois versions implémentent les **mêmes 10 endpoints** avec la **même sécurité** (argon2 / bcrypt, isolation par owner, validation, rate-limit sur login). Les différences :

| Critère | Hono (Node 24) | FastAPI (Py 3.12) | Laravel 12 (PHP 8.3) |
|---------|-----------------|-------------------|------------------------|
| **Lignes de code app/** | ~600 | ~700 | ~400 |
| **Fichiers** | ~25 | ~30 | ~13 (hors scaffold) |
| **Validation** | Zod (TS) | Pydantic v2 | Form Requests |
| **Sérialisation** | Manuel | Pydantic `model_validate` | Eloquent auto |
| **Auth** | JWT cookie HttpOnly | JWT cookie HttpOnly | Sanctum tokens (Bearer) |
| **ORM** | Drizzle | SQLAlchemy 2 async | Eloquent (sync) |
| **Migrations** | drizzle-kit | À ajouter (Alembic) | `artisan migrate` natif |
| **Doc OpenAPI** | Manuel | Auto à `/docs` | À ajouter (`l5-swagger`) |
| **CLI dev** | `npm run dev` | `uvicorn --reload` | `artisan serve` (+ tinker, queue, cache, …) |
| **Tests** | Vitest | pytest async | Pest |
| **Boilerplate à écrire** | Moyen | Moyen | **Minimal** |
| **Surprise positive** | Edge-ready (Cloudflare) | Async + doc auto | Tout intégré, factories Eloquent |
| **Surprise négative** | Pas de DI | Plus verbeux | Magic ("où est défini l'objet `$this->user`?") |

### Mon take pragmatique

- **Laravel** : le plus rapide à écrire, le plus dur à comprendre dans les détails internes (la "magic"). Si tu veux livrer une API en 2 jours et avoir tous les outils intégrés (auth, queue, cache, migrations, mailer, broadcasting), c'est imbattable.
- **FastAPI** : l'équilibre entre productivité et lisibilité. Tu écris explicitement les schemas, mais tu gagnes la doc auto et le typage Python. Excellent pour data/ML.
- **Hono** : le plus minimal, le plus rapide à exécuter, le plus portable (Node, Bun, Deno, edge runtimes). Idéal pour des micro-services et l'edge.

**Aucun n'est "meilleur"**. Le bon choix dépend de l'écosystème de ton équipe et de tes contraintes (edge, ML, productivité, communauté locale, recrutement).

## 8. Pour aller plus loin

- **Sanctum SPA** : refais le mode SPA (cookies) pour matcher le comportement FastAPI/Hono. Plus sûr quand le front est sur le même domaine.
- **Symfony 7.4 LTS + API Platform** : encore plus déclaratif que Laravel — annote les entités Doctrine, l'API se génère seule (avec OpenAPI, GraphQL, JSON-LD). Refaire `taskly-api` en Symfony pour comparer 2 frameworks PHP.
- **Laravel Octane + FrankenPHP** : x3-10 perfs vs `artisan serve`. Garde l'app en mémoire entre requêtes (comme uvicorn ou Node). Désactive certains comportements (singletons à reset) — bon exercice de compréhension du cycle de vie.
- **Laravel Forge** : déploiement automatisé sur VPS DigitalOcean/Hetzner. Domaine, HTTPS, queue worker, cron — tout configuré en 5 clics.
- **Laravel Pulse** : monitoring intégré (slow queries, exceptions, jobs lents). Gratuit, dashboard sympa.
- **Pest v3** : couverture, parallel runner, dépendances entre tests, snapshots — toutes les features de Vitest et plus, pour PHP.
