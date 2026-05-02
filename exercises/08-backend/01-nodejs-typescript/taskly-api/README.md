# Exercice 8.1 — taskly-api en Node.js / TypeScript

> **Axe** : 8 — Backend (parcours Node/TS)
> **Difficulté** : avancé
> **Durée estimée** : 8 à 16 heures
> **Prérequis** : axes 6, 7 lus, **Node.js ≥ 20**

## ⚙️ Avant de commencer — outils nécessaires

### Node.js ≥ 20 (idéalement 24 LTS)

Si pas installé, voir [« Installer Node.js »](../../../02-web/01-mini-curl/README.md#-avant-de-commencer--installer-nodejs) de l'exercice 2.1.

```bash
node --version       # v20.x.x ou plus récent
```

Pas de DB Postgres à installer : on utilise **SQLite** via `better-sqlite3`. Une simple commande npm install et tout est prêt.

## 🎯 Objectifs pédagogiques

- Construire une API REST complète avec **Hono** (le défaut moderne)
- Utiliser **Drizzle ORM** + SQLite pour la persistance
- Authentifier avec **JWT en cookie HttpOnly**
- Valider les inputs avec **Zod**
- Structurer un projet par **modules métier** (auth, tasks)
- Écrire des tests d'intégration avec **Vitest**

## 📋 Énoncé — taskly-api

Implémentation d'une API de gestion de tâches multi-utilisateur :

### Endpoints

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `POST` | `/auth/register` | non | Inscription `{ email, password, name }` |
| `POST` | `/auth/login` | non | Connexion `{ email, password }` → cookie JWT |
| `POST` | `/auth/logout` | oui | Supprime le cookie |
| `GET` | `/auth/me` | oui | Retourne le user courant |
| `GET` | `/tasks` | oui | Liste paginée des tâches du user |
| `POST` | `/tasks` | oui | Crée `{ title, description?, dueAt? }` |
| `GET` | `/tasks/:id` | oui | Détail (404 si pas le proprio) |
| `PATCH` | `/tasks/:id` | oui | Met à jour (toggle `done`, etc.) |
| `DELETE` | `/tasks/:id` | oui | Supprime (404 si pas le proprio) |
| `GET` | `/health` | non | `{ status: 'ok', db: 'ok' }` |

### Règles métier

1. Mot de passe ≥ 8 caractères, hashé avec **argon2id**.
2. JWT signé HS256 avec un secret en env (`JWT_SECRET`), expiration 24 h.
3. Cookie `session` : `HttpOnly`, `Secure` (en prod), `SameSite=Lax`, `Path=/`.
4. Une tâche n'est visible/modifiable que par son **propriétaire**.
5. Pagination : `?page=1&limit=20` (max 100).
6. Validation Zod **partout** : 422 avec `{ errors: [...] }` en cas d'invalide.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| `npm run build` passe | TS strict, 0 `any` |
| `npm run dev` démarre | `tsx watch` sur le 1er port libre 3000+ |
| `npm test` passe | Tests Vitest sur les routes principales |
| Health check répond `200` | `GET /health` |
| Inscription puis connexion fonctionnent | cookie posé |
| Un user ne voit pas les tâches d'un autre | 404 sur tâche d'un autre user |
| Mots de passe **jamais** retournés | Aucun endpoint ne renvoie `password` |
| Body invalide → `422` avec détails | Schémas Zod parlants |

### Bonus

- Rate-limit sur `/auth/login` (3 essais/min/IP) avec `hono-rate-limiter`.
- Logs structurés en JSON via `pino`.
- Migration Drizzle au démarrage si DB absente.
- Cron de nettoyage des tâches très anciennes via `node-cron`.

## 🛠 Comment commencer

```bash
cd canevas/
npm install
cp .env.example .env
npm run dev
# http://localhost:3000/health
```

## 🧪 S'auto-valider

```bash
npm test
```

Tests Vitest qui démarrent une instance Hono en mémoire, créent un user, créent des tâches, vérifient les permissions.

## 💡 Indices

<details>
<summary>1. Structure suggérée</summary>

```
src/
├── main.ts                ← lance le serveur
├── app.ts                  ← compose middlewares + routes
├── config.ts               ← parse env via Zod
├── db/
│   ├── index.ts            ← client Drizzle + better-sqlite3
│   ├── schema.ts           ← tables users, tasks
│   └── migrate.ts          ← script de migration
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.schemas.ts
│   └── tasks/
│       ├── tasks.routes.ts
│       ├── tasks.service.ts
│       └── tasks.schemas.ts
├── middleware/
│   ├── jwt-auth.ts
│   └── error-handler.ts
└── lib/
    ├── jwt.ts
    └── password.ts
```
</details>

<details>
<summary>2. Hashing argon2id</summary>

```ts
import { hash, verify } from '@node-rs/argon2';

export const hashPassword = (plain: string) => hash(plain);
export const verifyPassword = (hashed: string, plain: string) => verify(hashed, plain);
```
</details>

<details>
<summary>3. JWT en cookie HttpOnly</summary>

```ts
import { sign, verify } from 'hono/jwt';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';

// À la connexion
const token = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + 86400 }, JWT_SECRET);
setCookie(c, 'session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  path: '/',
  maxAge: 86400,
});

// Middleware d'auth
export const requireAuth = async (c, next) => {
  const token = getCookie(c, 'session');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const payload = await verify(token, JWT_SECRET);
    c.set('userId', Number(payload.sub));
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};
```
</details>

<details>
<summary>4. Schéma Drizzle minimal</summary>

```ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  dueAt: text('due_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — implémentation complète.

## 📚 Pour aller plus loin

- Refaire la même API en **Fastify** ou **Express 5** pour comparer.
- Déployer sur **Cloudflare Workers** (modifier `better-sqlite3` → `D1`).
- Ajouter un **rate-limit** persistant via Redis.
- Implémenter **OAuth Google** en plus du login email/password.
