# Canevas — taskly-api Laravel 12

> Tu vas refaire **les mêmes 10 endpoints** que les versions Node (Hono) et Python (FastAPI) — mais en **Laravel 12**, avec **Sanctum**, **Eloquent**, **Form Requests** et **Pest**.
>
> Comparer les 3 versions après est l'un des exercices qui rapporte le plus dans tout le guide. Laravel n'est pas plus « ancien » que FastAPI ou Hono — c'est une école différente : **maximum d'outillage en standard, minimum de boilerplate à écrire**.

## Ce que tu vas faire

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `POST` | `/api/auth/register` | non | Inscription (email + name + password ≥ 8) |
| `POST` | `/api/auth/login` | non | Connexion → token Sanctum |
| `POST` | `/api/auth/logout` | oui | Révoque le token courant |
| `GET` | `/api/auth/me` | oui | User courant |
| `GET` | `/api/tasks?page=&limit=` | oui | Liste paginée |
| `POST` | `/api/tasks` | oui | Créer |
| `GET` | `/api/tasks/{id}` | oui | Détail (404 si pas owner) |
| `PATCH` | `/api/tasks/{id}` | oui | Mettre à jour |
| `DELETE` | `/api/tasks/{id}` | oui | Supprimer |
| `GET` | `/up` | non | Health (fourni par Laravel 12) |

À la fin, tu auras vécu :
- **`artisan make:model Task -mfr`** (génère migration + factory + ressource d'un coup)
- **Form Requests** — la validation avec retour 422 auto-magique
- **`apiResource('tasks', TaskController::class)`** — 5 routes RESTful en 1 ligne
- **Sanctum tokens Bearer** — l'analogue PHP de JWT
- **Pest** — un syntaxe `it('does X', fn () => …)` infiniment plus lisible que PHPUnit

## Pré-requis

- **PHP 8.3+** + **Composer 2.x** (`php --version`, `composer --version`).

Si pas installé :

| OS | Commande |
|----|----------|
| **macOS** | `brew install php@8.3 composer` |
| **Ubuntu/WSL** | `sudo apt install php8.3 php8.3-{cli,xml,mbstring,pdo,sqlite3,curl,intl}` puis [getcomposer.org](https://getcomposer.org/download/) |
| **Windows** | [Laragon](https://laragon.org/) (recommandé, tout-en-un) ou [XAMPP](https://www.apachefriends.org/) |

> **Astuce Laravel** : `composer global require laravel/installer` puis `laravel new` est aussi rapide que `composer create-project`.

## Démarrer (5 étapes)

### 1. Scaffold Laravel à la racine du canevas

```bash
composer create-project laravel/laravel . "^12.0" --no-interaction
```

### 2. Configurer SQLite (le plus simple, 0 Docker)

Édite `.env` :

```dotenv
DB_CONNECTION=sqlite
# (supprime DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD)
```

```bash
touch database/database.sqlite      # Linux/Mac
# Windows : New-Item -Type File database/database.sqlite
```

### 3. Installer Sanctum (auth API)

```bash
php artisan install:api
```

Cette commande active l'auth API : crée le middleware Sanctum, ajoute les routes `auth:sanctum`, configure `routes/api.php`.

### 4. Migrer

```bash
php artisan migrate
```

### 5. Démarrer

```bash
php artisan serve
# → http://localhost:8000/up    (page de health Laravel par défaut)
```

Si `/up` répond, ton scaffold marche. À toi maintenant d'ajouter les fichiers métier.

## Fichiers à créer (8 étapes)

Suis cet ordre — chaque étape débloque la suivante :

| Étape | Fichier | Sujet |
|-------|---------|-------|
| 1 | `database/migrations/xxxx_create_tasks_table.php` | Schema `tasks` (id, owner_id FK, title, description, done, due_at, timestamps, index) |
| 2 | `app/Models/Task.php` | Model avec `$fillable` + relation `owner()` vers User |
| 3 | `app/Models/User.php` | Ajouter relation `tasks()` (one-to-many) |
| 4 | `app/Http/Requests/{Register,Login,StoreTask,UpdateTask}Request.php` | 4 Form Requests pour validation |
| 5 | `app/Http/Controllers/AuthController.php` | register / login / logout / me |
| 6 | `app/Http/Controllers/TaskController.php` | index / store / show / update / destroy |
| 7 | `routes/api.php` | Routes Bearer-protégées avec `apiResource` |
| 8 | `tests/Feature/AuthTest.php` + `TaskTest.php` | Tests Pest |

## Snippets clés

### Migration (`-m` à artisan génère le fichier)
```php
Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
    $table->string('title', 200);
    $table->text('description')->nullable();
    $table->boolean('done')->default(false);
    $table->timestamp('due_at')->nullable();
    $table->timestamps();
    $table->index(['owner_id', 'created_at']);
});
```

### Form Request — validation déclarative
```php
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

Si la validation échoue, Laravel renvoie **automatiquement 422** avec `{ message, errors }`. Pas une seule ligne à écrire.

### Routes API en 7 lignes
```php
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::apiResource('tasks', TaskController::class);    // ← 5 routes en 1 ligne
});
```

`apiResource` génère **5 routes** (`index`, `store`, `show`, `update`, `destroy`) qui correspondent aux 5 méthodes du `TaskController`. Pas de répétition.

### Throttle natif sur `/login`
`->middleware('throttle:5,1')` = max 5 requêtes par minute par IP. En une ligne. Pas besoin de `slowapi` ou `express-rate-limit`.

## Tester

```bash
php artisan test                       # PHPUnit + Pest unifiés sous artisan
./vendor/bin/pest                      # Pest direct si tu préfères
./vendor/bin/pest --filter=tasks       # filtre par nom
```

## Bloqué ?

- **`composer create-project` plante avec `Could not open input file artisan`** → tu n'as pas lancé la commande **dans un dossier vide**. `composer create-project laravel/laravel .` veut un cwd vide à part `.git`. Si tu as déjà `README.md` etc., commence par `composer create-project laravel/laravel laravel-temp` puis copie le contenu.
- **`php artisan install:api` ne crée pas `routes/api.php`** → tu es probablement sur une version < Laravel 12. Vérifie avec `php artisan --version`. Si c'est < 12, le scaffold a séparé `web.php` et `api.php` différemment ; consulte `bootstrap/app.php`.
- **`Class 'PDO' not found`** → tu manques l'extension PHP `pdo_sqlite`. Sous Linux : `sudo apt install php8.3-sqlite3`. Sous Windows/Laragon : `Menu → PHP → Extensions → cocher pdo_sqlite`.
- **422 retournée même avec un body valide** → 9 fois sur 10, ton header `Content-Type: application/json` manque ou le body n'est pas du JSON valide. Postman et `curl -d '...' -H 'Content-Type: application/json'` doivent tomber juste.
- **Sanctum retourne toujours 401, même avec le token** → vérifie que le header est `Authorization: Bearer <token>` (avec l'espace après `Bearer`), et que tu as bien `auth:sanctum` (pas `auth:api`) sur la route.
- **`Class "App\Http\Controllers\AuthController" does not exist`** → tu as oublié `use App\Http\Controllers\AuthController;` en haut de `routes/api.php`. Laravel ne fait pas d'auto-import dans les routes.
- **Tests Pest qui passent en PHPUnit mais pas en Pest** → vérifie que `tests/Pest.php` existe (généré par `php artisan install:api` ou `composer require pestphp/pest --dev` puis `./vendor/bin/pest --init`).

## Ne commit pas

`vendor/`, `node_modules/`, `.env`, `database/database.sqlite`. Tous dans `.gitignore` par défaut grâce au scaffold Laravel.

## Comparer après avec les autres versions

Une fois tes 10 endpoints fonctionnels, ouvre côte à côte :

- `exercises/08-backend/01-nodejs-typescript/taskly-api/correction/`
- `exercises/08-backend/02-python/fastapi/taskly-api/correction/`
- Ton implémentation Laravel ici

Et observe : combien de **lignes** chacun a écrites pour la même API. Combien de **fichiers** chacun a créés. Combien de **dépendances** chacun pull. C'est l'apprentissage le plus utile que tu peux tirer de l'axe 8.
