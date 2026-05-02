# Canevas — Taskly API (Node.js / TypeScript)

> Ton point de départ. Suis les étapes ci-dessous pour démarrer, puis attaque la liste des TODO.

## 🎯 Ce que tu vas faire

Construire une **API REST sécurisée** de gestion de tâches :

- **Authentification** : inscription, connexion, déconnexion, route `/me`.
- **Tâches** : CRUD complet, isolation par utilisateur (un user ne voit que ses tâches).
- **Sécurité** : mots de passe hashés en argon2id, JWT en cookie HttpOnly + SameSite, validation Zod sur toutes les entrées.
- **Tests** : 13 tests d'intégration qui doivent tous passer à la fin.

Stack : **Hono** (Node 24) + **Drizzle ORM** + **SQLite** + **Zod** + **argon2** + **Vitest**.

## 📦 Pré-requis

| Outil | Version | Comment vérifier |
|-------|---------|------------------|
| Node.js | ≥ 20 (idéalement 24) | `node --version` |
| npm | ≥ 10 | `npm --version` |
| Un éditeur | VS Code recommandé | — |

> Si Node n'est pas installé, voir la section « Installer Node.js » dans l'axe 2.1 du guide.

## ⚡ Démarrer en 4 étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement
cp .env.example .env
# (sur Windows PowerShell : copy .env.example .env)

# 3. Créer la base SQLite et les tables
npm run db:migrate

# 4. Lancer le serveur de dev
npm run dev
```

Vérifie que ça tourne :

```bash
# Dans un autre terminal :
curl http://localhost:3000/health
# {"status":"ok"}
```

## 🗂 Ce qui est déjà en place dans le canevas

| Dossier / fichier | Statut |
|-------------------|--------|
| `src/db/schema.ts` | ✅ Schéma Drizzle (users, tasks) — déjà écrit |
| `src/db/index.ts` | ✅ Connexion SQLite |
| `src/db/migrate.ts` | ✅ Script de migration |
| `src/config.ts` | ✅ Config (env vars validées par Zod) |
| `src/main.ts` | ✅ Bootstrap du serveur |
| `src/app.ts` | 🚧 Squelette — à compléter |
| `src/lib/jwt.ts` | ✅ Helpers `signToken` / `verifyToken` |
| `src/lib/password.ts` | 🚧 **À toi** : implémenter `hashPassword` + `verifyPassword` |
| `src/middleware/jwt-auth.ts` | 🚧 **À toi** : middleware qui lit le cookie + vérifie le JWT |
| `src/middleware/error-handler.ts` | 🚧 **À toi** : transformer `ZodError` et `HTTPException` en JSON propre |
| `src/modules/auth/` | 🚧 **À toi** : routes `/register`, `/login`, `/me`, `/logout` |
| `src/modules/tasks/` | 🚧 **À toi** : CRUD tâches avec isolation user |
| `tests/` | ❌ Absent — viens dans la correction |

## 🛠 Liste de TODO (par ordre suggéré)

| # | Fichier | Sujet |
|---|---------|-------|
| 1 | `src/lib/password.ts` | `hashPassword` avec `@node-rs/argon2` (memoryCost 64 MiB, timeCost 3) |
| 2 | `src/lib/password.ts` | `verifyPassword` |
| 3 | `src/middleware/jwt-auth.ts` | `requireAuth` — lit `getCookie(c, 'auth')`, `verifyToken`, set `c.set('userId', payload.sub)` |
| 4 | `src/middleware/error-handler.ts` | si `err instanceof ZodError` → 400 JSON, sinon 500 |
| 5 | `src/modules/auth/auth.service.ts` | `register(email, password)` : email unique check, hash, insert |
| 6 | `src/modules/auth/auth.service.ts` | `login(email, password)` : find by email, verifyPassword |
| 7 | `src/modules/auth/auth.service.ts` | `getUserById(id)` : ne JAMAIS retourner `passwordHash` |
| 8 | `src/modules/auth/auth.routes.ts` | `POST /auth/register` — validation Zod, appel service, retour user (sans password) |
| 9 | `src/modules/auth/auth.routes.ts` | `POST /auth/login` — pose `setCookie('auth', token, { httpOnly, secure, sameSite: 'Lax' })` |
| 10 | `src/modules/auth/auth.routes.ts` | `GET /auth/me` (protégé) + `POST /auth/logout` (deleteCookie) |
| 11 | `src/modules/tasks/tasks.service.ts` | `listTasks(userId)`, `getTask(userId, id)`, `createTask`, `updateTask`, `deleteTask` |
| 12 | `src/modules/tasks/tasks.routes.ts` | toutes les routes derrière `requireAuth` |
| 13 | `src/app.ts` | branche le logger, l'error handler, les routes |

## 🧪 Tester ton code (à la main)

Une fois `/register` et `/login` codés :

```bash
# Inscription
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"secret123"}'

# Connexion (récupère le cookie)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"alice@test.com","password":"secret123"}'

# Me (protégé) — utilise le cookie
curl http://localhost:3000/auth/me -b cookies.txt

# Créer une tâche
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Apprendre Hono","done":false}'

# Lister mes tâches
curl http://localhost:3000/tasks -b cookies.txt
```

## 🆘 Bloqué ?

1. Re-lis le cours sur l'axe 8.1 du guide.
2. Vérifie que le code « 🚧 à toi » a bien été modifié dans chaque fichier listé en TODO.
3. Si tu sèches vraiment, télécharge la **correction** — son `README.md` t'explique chaque choix de la solution avec un walkthrough détaillé.

## 🧹 Ne commit pas

- `node_modules/`
- `.env` (utilise `.env.example` pour partager la config)
- `*.db` (la base SQLite générée)

Ces fichiers sont déjà ignorés via `.gitignore`.
