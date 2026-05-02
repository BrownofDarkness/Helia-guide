# Exercice 8.3 — taskly-api en Laravel 12

> **Axe** : 8 — Backend (parcours PHP / Laravel)
> **Difficulté** : avancé
> **Durée estimée** : 8 à 16 heures
> **Prérequis** : axe 8 lu (parcours PHP), **PHP 8.3+**, **Composer**

## ⚙️ Avant de commencer — outils nécessaires

### PHP 8.3+ et Composer

| OS | Comment |
|----|---------|
| **macOS** | `brew install php@8.3 composer` |
| **Linux/WSL Ubuntu** | `sudo apt install php8.3 php8.3-{cli,xml,mbstring,pdo,sqlite3,curl} && curl -sS https://getcomposer.org/installer \| php && sudo mv composer.phar /usr/local/bin/composer` |
| **Windows (hors WSL)** | [Laragon](https://laragon.org/) (recommandé) ou [XAMPP](https://www.apachefriends.org/) qui inclut tout |

**Vérifie** :

```bash
php --version       # PHP 8.3.x ou plus
composer --version  # Composer 2.x
```

### Laravel installer (optionnel mais pratique)

```bash
composer global require laravel/installer
```

## 🎯 Objectifs pédagogiques

- Construire **les mêmes endpoints** que les versions Node et FastAPI, en Laravel 12
- Utiliser **Eloquent ORM** + SQLite (ou PostgreSQL)
- Authentifier avec **Laravel Sanctum** (mode API tokens — équivalent JWT pour Laravel)
- Valider via **Form Requests**
- Tester avec **Pest**

## 📋 Énoncé

Implémente les **mêmes endpoints** que les autres versions de taskly-api :

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `POST` | `/api/auth/register` | non | Inscription |
| `POST` | `/api/auth/login` | non | Connexion → token Sanctum |
| `POST` | `/api/auth/logout` | oui | Révoque le token |
| `GET` | `/api/auth/me` | oui | User courant |
| `GET` | `/api/tasks` | oui | Liste paginée |
| `POST` | `/api/tasks` | oui | Créer |
| `GET` | `/api/tasks/{id}` | oui | Détail |
| `PATCH` | `/api/tasks/{id}` | oui | Mettre à jour |
| `DELETE` | `/api/tasks/{id}` | oui | Supprimer |
| `GET` | `/up` | non | Health (fourni par Laravel 12 par défaut) |

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| `composer install && php artisan migrate && php artisan serve` démarre | |
| `php artisan test` passe (tests Pest) | |
| Mots de passe **jamais** retournés | |
| Un user ne voit pas les tâches d'un autre | 404 |
| Validation → 422 avec détails | Laravel le fait automatiquement avec FormRequest |
| Token révoqué au logout | |

### Bonus

- Migration vers **Sanctum SPA** (cookies) au lieu de tokens.
- **Rate-limit** sur `/auth/login` avec `Route::middleware('throttle:5,1')`.
- **Laravel Pint** + **PHPStan** en CI.
- **OpenAPI** auto via `darkaonline/l5-swagger`.

## 🛠 Comment commencer — scaffold Laravel

```bash
# Dans canevas/, scaffolder Laravel
cd canevas/
composer create-project laravel/laravel . "^12.0" --no-interaction

# Configurer SQLite
sed -i 's|DB_CONNECTION=mysql|DB_CONNECTION=sqlite|' .env
sed -i '/DB_HOST/d; /DB_PORT/d; /DB_DATABASE=/d; /DB_USERNAME/d; /DB_PASSWORD/d' .env
touch database/database.sqlite

# Installer Sanctum
php artisan install:api

# Migrer
php artisan migrate

# Démarrer
php artisan serve
# http://localhost:8000/up doit afficher la page de health Laravel
```

Une fois Laravel scaffolded, complète les fichiers TODO listés dans le canevas.

## 🧪 S'auto-valider

```bash
php artisan test
```

## 💡 Indices

<details>
<summary>1. Migration tasks</summary>

```bash
php artisan make:model Task -mf
# -m : migration, -f : factory
```

```php
// database/migrations/xxxx_create_tasks_table.php
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
</details>

<details>
<summary>2. Form Request pour valider</summary>

```bash
php artisan make:request StoreTaskRequest
php artisan make:request UpdateTaskRequest
```

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
    return true;
}
```
</details>

<details>
<summary>3. Auth controller avec Sanctum (token mode)</summary>

```php
// app/Http/Controllers/AuthController.php
public function register(RegisterRequest $request)
{
    $user = User::create([
        'email'    => $request->email,
        'name'     => $request->name,
        'password' => Hash::make($request->password),
    ]);
    return response()->json($user, 201);
}

public function login(LoginRequest $request)
{
    if (!Auth::attempt($request->only('email', 'password'))) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }
    $user = Auth::user();
    $token = $user->createToken('api')->plainTextToken;
    return response()->json(['user' => $user, 'token' => $token]);
}

public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();
    return response()->noContent();
}
```
</details>

<details>
<summary>4. Routes API</summary>

```php
// routes/api.php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      fn(Request $r) => $r->user());
    Route::apiResource('tasks', TaskController::class);
});
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — fichiers clés (Models, Controllers, Requests, Migrations, Tests).

> Note : la correction ne contient **pas** tout le scaffold Laravel (qui ferait 200+ fichiers). Tu scaffolds Laravel toi-même puis tu copies les fichiers de correction par-dessus.

## 📚 Pour aller plus loin

- Refais en **Symfony 7.4 LTS** + API Platform — annote les entités, l'API se génère seule.
- Bascule de tokens Sanctum à **Sanctum SPA** (cookies) pour matcher la version FastAPI/Hono.
- Déploie via **Laravel Forge** sur un VPS.
- Active **Laravel Octane + Frankenphp** pour ×3-10 perfs.
