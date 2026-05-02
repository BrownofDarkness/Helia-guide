# Correction — Taskly API (Node.js / TypeScript)

> Solution complète + walkthrough pédagogique. Lis les sections dans l'ordre — elles sont conçues pour que tu **comprennes** chaque choix, pas seulement que tu copies le code.

---

## 1. 🎯 Ce que tu apprends en lisant cette correction

| Compétence | Concrètement |
|------------|--------------|
| Construire une **API REST sécurisée** | Auth, sessions cookie HttpOnly, validation Zod |
| Hasher un **mot de passe** correctement en 2026 | `argon2id` avec params OWASP |
| Sécuriser des **routes par utilisateur** | Middleware `requireAuth` + isolation au niveau service |
| Écrire des **tests d'intégration** propres | DB SQLite en mémoire, `app.request()` sans serveur HTTP |
| Découper un projet par **module métier** | `auth/`, `tasks/` — pas par couche technique |
| Utiliser un **ORM type-safe** | Drizzle, plus proche du SQL que Prisma |

À la fin, tu sauras pourquoi cette stack est cohérente, quoi y substituer pour des contextes différents, et comment passer en prod.

---

## 2. 📦 Pré-requis

| Outil | Version | Vérifier |
|-------|---------|----------|
| Node.js | ≥ 20 (idéalement 24) | `node --version` |
| npm | ≥ 10 | `npm --version` |
| **Aucune** DB externe | SQLite est embarqué | — |

> **Pas de Docker** ni de Postgres à installer pour cette correction. SQLite (via `better-sqlite3`) tourne en local sans serveur.

---

## 3. ⚡ Démarrer en 3 minutes

```bash
# 1. Installer les dépendances
npm install

# 2. Copier la config
cp .env.example .env
# (Windows PowerShell : copy .env.example .env)

# 3. Lancer le serveur
npm run dev
# → http://localhost:3000
```

Vérifier que tout tourne :

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Lancer les tests :

```bash
npm test
# 13/13 tests passent
```

---

## 4. 🗂 Structure du code

```
src/
├── main.ts                  # Démarre le serveur
├── app.ts                   # Configure Hono : middlewares + routes
├── config.ts                # Lit et valide les variables d'env (Zod)
├── db/
│   ├── schema.ts            # Définition Drizzle des tables (users, tasks)
│   ├── index.ts             # Connexion SQLite + helper `db`
│   └── migrate.ts           # Crée les tables au démarrage
├── lib/
│   ├── password.ts          # hashPassword + verifyPassword (argon2id)
│   └── jwt.ts               # signToken + verifyToken
├── middleware/
│   ├── jwt-auth.ts          # requireAuth : lit cookie, vérifie JWT
│   └── error-handler.ts     # transforme erreurs en JSON propre
└── modules/
    ├── auth/
    │   ├── auth.routes.ts   # POST /auth/register, /login, /logout, GET /me
    │   ├── auth.service.ts  # register, login, getUserById
    │   └── auth.schema.ts   # Schémas Zod (RegisterDto, LoginDto)
    └── tasks/
        ├── tasks.routes.ts  # CRUD /tasks (toutes protégées)
        ├── tasks.service.ts # listTasks, getTask, create, update, delete
        └── tasks.schema.ts  # Schémas Zod (CreateTaskDto, UpdateTaskDto)

tests/
├── auth.test.ts             # 6 tests auth + isolation
└── tasks.test.ts            # 7 tests CRUD + isolation user
```

**Découpage par module métier**, pas par couche technique. Un nouveau dev qui touche le module `tasks/` a tout sous la main : routes, schémas, business logic. Plus facile à scaler en équipe que `controllers/` + `services/` + `dto/` éparpillés.

---

## 5. 🧠 Walkthrough pédagogique

> Pour chaque morceau important : **le piège du canevas** → **la solution choisie** → **pourquoi** → **alternatives écartées**.

### 5.1 Hash de mot de passe (`src/lib/password.ts`)

**Le piège.** Beaucoup de tutos utilisent encore `bcrypt`. C'est correct mais **dépassé** en 2026 : bcrypt n'utilise pas la mémoire, donc une carte GPU peut tester des milliards de combinaisons par seconde.

**Solution choisie.** `@node-rs/argon2` avec **argon2id** (le profil hybride) :

```ts
const HASH_OPTS = {
  memoryCost: 65536,  // 64 MiB de RAM par hash
  timeCost: 3,        // 3 itérations
  parallelism: 1,
};
```

**Pourquoi ces valeurs.** Recommandation OWASP 2026. Une attaque par GPU butte sur les 64 MiB par essai (la VRAM est limitée), ce qui ralentit drastiquement le brute-force.

**Alternatives écartées.**

| Alternative | Pourquoi non |
|-------------|--------------|
| **bcrypt** | CPU-only, vulnérable au GPU/ASIC |
| **scrypt** | Bon mais moins audité que argon2id, moins répandu |
| **PBKDF2** | Trop ancien, conseillé seulement pour FIPS |
| **Pas de hash (clair)** | Évident — fuite DB = comptes compromis |

> Si tu changes les paramètres, vérifie qu'ils restent au moins aux niveaux OWASP : `m=64MB, t=3, p=1`.

### 5.2 JWT en cookie HttpOnly (`auth.routes.ts` ligne `setCookie`)

**Le piège.** Le réflexe « JWT en localStorage et `Authorization: Bearer` » est partout en tutoriel. C'est **vulnérable au XSS** : si un attaquant injecte du JS dans une page, il lit `localStorage.getItem('token')` et vole la session.

**Solution choisie.**

```ts
setCookie(c, 'auth', token, {
  httpOnly: true,        // pas accessible en JS
  secure: !isDev,        // HTTPS only en prod
  sameSite: 'Lax',       // protection CSRF de base
  maxAge: 60 * 60 * 24,  // 24 h
  path: '/',
});
```

**Pourquoi ce combo.**

- `httpOnly` : le cookie n'apparaît PAS dans `document.cookie`. Un XSS ne peut donc pas le voler.
- `secure` : refuse l'envoi sur HTTP. En dev, on désactive (HTTP localhost).
- `sameSite: 'Lax'` : le cookie n'est PAS envoyé sur des requêtes cross-site (sauf la navigation top-level GET) → protège du **CSRF** classique.

**Alternatives écartées.**

| Alternative | Pourquoi non |
|-------------|--------------|
| **localStorage + Bearer** | XSS vole tout |
| **sessionStorage + Bearer** | Idem + perd la session au close de l'onglet |
| **Cookie sans HttpOnly** | Idem XSS-vulnerable |
| **Cookie SameSite=Strict** | Casse les redirections OAuth (login Google etc.) |
| **Cookie SameSite=None** | Nécessaire pour cross-site, mais alors il FAUT du CSRF token explicite — overkill pour un MVP |

### 5.3 Middleware d'auth (`src/middleware/jwt-auth.ts`)

**Le piège.** Beaucoup d'apps vérifient l'auth **dans chaque handler** : `if (!user) return 401`. Ça marche jusqu'à ce qu'on oublie de le mettre **une fois** sur une route sensible.

**Solution choisie.** Un middleware Hono `requireAuth` qui :

1. Lit le cookie `auth`.
2. Vérifie le JWT.
3. Attache `userId` au context Hono : `c.set('userId', payload.sub)`.
4. Si tout va bien : `await next()`. Sinon : `throw new HTTPException(401)`.

Et **on l'applique au router entier** des tâches :

```ts
const tasksRouter = new Hono();
tasksRouter.use('*', requireAuth);  // ← un seul endroit
tasksRouter.get('/', listHandler);
tasksRouter.post('/', createHandler);
// ...
```

**Pourquoi.** Garantit qu'**aucune route tasks ne peut être appelée non authentifiée**. Plus de risque d'oubli.

**Alternatives écartées.**

| Alternative | Pourquoi non |
|-------------|--------------|
| Vérifier l'auth dans chaque handler | Risque d'oubli, code dupliqué |
| Stocker l'objet `user` complet dans le context | Inutile (on a juste besoin de `userId`), et coûte une requête DB de plus par requête HTTP |

### 5.4 Isolation par utilisateur (`tasks.service.ts`)

**Le piège — IDOR.** Une route mal codée laisse l'utilisateur A accéder aux tâches de B en changeant l'ID dans l'URL : `GET /tasks/42`. C'est l'**Insecure Direct Object Reference**, OWASP A01 (le n°1 des risques web).

**Solution choisie.** Le `WHERE` filtre **systématiquement par `userId`** :

```ts
async function getTask(userId: number, taskId: number) {
  return db.select().from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))  // ← les 2 conditions
    .get();
}
```

Si la tâche existe mais appartient à un autre user, la requête retourne `undefined` et l'API renvoie 404 — l'attaquant ne sait même pas si la tâche existe.

**Pourquoi cette double clé.** Un test de régression vérifie qu'**Alice ne peut PAS lire la tâche de Bob** même si elle connaît l'ID exact (`tests/tasks.test.ts` ligne « returns 404 for another user's task »).

**Alternatives écartées.**

| Alternative | Pourquoi non |
|-------------|--------------|
| Filtrer côté handler après `findById` | Race conditions, et oubli possible |
| **RLS Postgres** (Row-Level Security) | Excellent pour Postgres, mais SQLite ne supporte pas. À envisager en passant à Postgres |
| Inclure `userId` dans l'URL (`/users/:userId/tasks/:id`) | Risque que le client passe le mauvais userId → confusion |

### 5.5 Validation des entrées (`*.schema.ts`)

**Le piège.** Faire confiance au client. Un POST `/tasks` avec `{ title: null, userId: 999 }` peut crasher le serveur ou créer une tâche pour un autre user si on assigne naïvement.

**Solution choisie.** Schéma **Zod** systématique sur le body :

```ts
export const CreateTaskDto = z.object({
  title: z.string().min(1).max(200),
  done: z.boolean().optional().default(false),
});
```

Et dans la route :

```ts
.post('/', zValidator('json', CreateTaskDto), async (c) => {
  const data = c.req.valid('json');  // ← typed, validated
  // ...
});
```

**Pourquoi Zod.** Un schéma génère **à la fois** :
- la validation runtime (erreurs explicites au client),
- les types TypeScript (inférés via `z.infer`),
- la documentation OpenAPI (avec `hono/openapi` plus tard).

**Alternatives écartées.**

| Alternative | Pourquoi non |
|-------------|--------------|
| Pas de validation | Crash, faille sécu |
| `class-validator` (NestJS-style) | Décorateurs lourds, pas natifs ESM |
| **Joi / Yup** | Pas de génération de types TS aussi élégante que Zod |

### 5.6 Mots de passe jamais retournés (`auth.service.ts`)

**Le piège.** Faire `db.select().from(users).where(eq(users.id, id))` retourne **TOUTES** les colonnes — y compris `passwordHash`. Si tu renvoies l'objet user au client (par ex. dans `GET /me`), tu exposes le hash. Avec assez de données, l'attaquant peut tenter de cracker.

**Solution choisie.** Toujours **projeter explicitement** :

```ts
async function getUserById(id: number) {
  return db.select({
    id: users.id,
    email: users.email,
    createdAt: users.createdAt,
    // ❌ pas de passwordHash
  }).from(users).where(eq(users.id, id)).get();
}
```

**Pourquoi.** Defense in depth. Même si on oublie un `omit()` côté serializer, l'objet ne contient simplement jamais ce champ.

**Test de régression.** `auth.test.ts` vérifie : `expect(response.body).not.toHaveProperty('passwordHash')`.

### 5.7 Error handler global (`src/middleware/error-handler.ts`)

**Le piège.** Renvoyer la stack trace au client en cas d'erreur. Cela fuit l'architecture interne (chemins, versions de libs, etc.).

**Solution choisie.**

```ts
app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json({ error: 'ValidationError', issues: err.issues }, 400);
  }
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);  // log côté serveur pour debug
  return c.json({ error: 'Internal server error' }, 500);
});
```

**Pourquoi `onError`.** Un seul endroit. Cohérent. Pas de stack trace au client. Logs en serveur pour debug.

### 5.8 Tests avec SQLite en mémoire

**Le piège.** Tester une API sur une DB de prod ou même staging = pollution + flakiness + lenteur.

**Solution choisie.** SQLite avec `:memory:` (pas de fichier disque, RAM seulement) + `app.request()` qui appelle Hono **sans démarrer de vrai serveur HTTP** :

```ts
process.env.DATABASE_URL = ':memory:';
const { app } = await import('../src/app');

const res = await app.request('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'a@b.c', password: 'password' }),
});
expect(res.status).toBe(201);
```

**Pourquoi.**

- **Rapide** : pas de TCP, pas de fichier disque, juste de la RAM. 13 tests en < 1 seconde.
- **Isolé** : Vitest crée un module isolé par fichier de test → DB séparée par fichier.
- **Fidèle** : on teste le **vrai** schéma Drizzle, pas des mocks.

---

## 6. ✅ Tests — ce qu'ils vérifient

```bash
npm test
```

13 tests :

| Fichier | Test | Vérifie |
|---------|------|---------|
| `auth.test.ts` | register OK | 201 + user retourné sans passwordHash |
| | register email déjà pris | 409 |
| | register email invalide | 400 (ZodError) |
| | login OK | 200 + cookie posé |
| | login mauvais password | 401 |
| | `/me` sans cookie | 401 |
| `tasks.test.ts` | create task OK | 201 + tâche liée au bon userId |
| | list tasks Alice | retourne uniquement les siennes |
| | get task d'Alice par Bob | **404** (isolation IDOR) |
| | update task d'Alice par Bob | **404** |
| | delete task d'Alice par Bob | **404** |
| | get inexistant | 404 |
| | create sans auth | 401 |

> Les tests d'isolation (Alice vs Bob) sont les plus importants — ils valident que le `WHERE userId = ?` est bien partout.

---

## 7. 🪤 Pièges réels rencontrés en construisant cette correction

> Cette section liste les **vrais bugs** rencontrés en testant cette correction de bout en bout (`npm install` + `npm test`). Si tu galères avec un de ces messages d'erreur, tu sauras quoi faire.
>
> Tous les pièges du guide sont aussi répertoriés sur la page **[Pièges réels](/pieges/)** du site, searchable par symptôme.

### 🪤 Piège 1 — `ERESOLVE` Zod 4 vs `@hono/zod-validator`

**🩹 Symptôme**

```
npm error code ERESOLVE
peer zod@"^3.19.1" from @hono/zod-validator@0.4.3
Found: zod@4.4.1
```

**🔍 Cause**

Zod 4 a introduit des breaking changes. `@hono/zod-validator@0.4.x` a un peer dep fixé sur Zod 3.

**🩺 Fix appliqué dans cette correction**

`zod` est figé à `^3.23.8` dans `package.json`. Quand `@hono/zod-validator@0.5+` sortira avec support Zod 4, on pourra ré-upgrader.

**🧠 Leçon**

Avant d'upgrader une dep cœur, vérifier les peer deps avec `npm ls` ou `npm-check-updates --doctor`.

---

### 🪤 Piège 2 — `better-sqlite3` ne compile pas (Windows + Node 24)

**🩹 Symptôme**

```
npm error gyp ERR! stack ... node-gyp rebuild
better-sqlite3 ... not ok
```

**🔍 Cause**

`better-sqlite3` est un module natif C++, exige Visual C++ Build Tools sous Windows. Sur Node 24 récent, les binaires prébuilds peuvent être absents → fallback compilation locale qui échoue.

**🩺 Fix appliqué dans cette correction**

Migration vers **`@libsql/client`** (fork Turso de SQLite) avec le driver `drizzle-orm/libsql` :

```ts
// src/db/index.ts
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

const client = createClient({
  url: config.DATABASE_URL === ':memory:'
    ? 'file::memory:?cache=shared'
    : `file:${config.DATABASE_URL}`,
});

export const db = drizzle(client, { schema });
```

`@libsql/client` a des **binaires prébuilds** pour toutes plateformes — pas de compilation. Le code Drizzle (queries, schema) reste **identique**.

**🧠 Leçon**

Pour un projet pédagogique multi-plateforme, **éviter les modules natifs** quand un équivalent pure-JS / WASM existe.

---

### 🪤 Piège 3 — `hono/jwt` exige `alg` explicite

**🩹 Symptôme**

```
JwtAlgorithmRequired: JWT verification requires "alg" option to be specified
```

**🔍 Cause**

Hono 4.x a serré la sécurité de son helper JWT : il faut désormais passer l'algorithme explicitement à `sign` et `verify`. Évite l'attaque **alg-confusion** où un attaquant forge un token avec `alg=none`.

**🩺 Fix appliqué dans cette correction**

```ts
// src/lib/jwt.ts
const ALG = 'HS256' as const;

export async function signToken(userId: number) {
  return signHono({ sub: String(userId), exp: ... }, JWT_SECRET, ALG);
}
export async function verifyToken(token: string) {
  return verifyHono(token, JWT_SECRET, ALG);
}
```

**🧠 Leçon**

Pour les libs de sécurité, lire le changelog avant d'upgrader. Les changements stricts viennent souvent d'une vulnérabilité fixée.

---

### 🪤 Piège 4 — `zValidator` renvoie 400 alors qu'on attend 422

**🩹 Symptôme**

```ts
expect(res.status).toBe(422);
// AssertionError: expected 400 to be 422
```

**🔍 Cause**

Hono `zValidator` renvoie 400 par défaut. Mais la convention REST moderne préfère **422 Unprocessable Entity** pour les erreurs de validation sémantique.

**🩺 Fix appliqué dans cette correction**

Helper `validate()` créé dans `src/lib/validator.ts` qui force 422 :

```ts
export function validate<T extends ZodSchema>(target: 'json' | 'query' | 'param', schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', issues: result.error.issues }, 422);
    }
  });
}
```

Et dans les routes : `validate('json', MySchema)` partout au lieu de `zValidator(...)`.

**🧠 Leçon**

Un framework qui a des defaults non alignés sur ta convention → wrap dans un helper, n'utilise jamais brut.

---

## 8. 🚀 Pour aller plus loin

### Migration vers PostgreSQL

Changer `drizzle/better-sqlite3` → `drizzle/node-postgres`. Le schéma Drizzle reste quasi identique (changer `integer` autoIncrement → `serial`). Avantage : **RLS** disponible, multi-écrivain pour la prod.

### Ajouter un rate-limit

Sur `/auth/login`, brute-force est trivial sans rate-limit. Avec `hono-rate-limiter` :

```ts
authRouter.post('/login',
  rateLimiter({ windowMs: 60_000, limit: 5 }),
  loginHandler
);
```

Voir l'axe **12.3 Sécurité backend** du guide pour le détail.

### Refresh tokens

Le JWT actuel dure 24 h. Pour une vraie app, **refresh token rotatif** (cookie séparé `httpOnly`, longue durée, stocké en DB pour invalidation possible). Voir l'axe 8.0.

### OAuth (Google, GitHub)

Ajouter des routes `/auth/google` qui redirigent, callback qui crée ou trouve l'user, pose le même cookie. Lib recommandée 2026 : **Better Auth** (open source, contrôle total).

### Déploiement

- **Render** ou **Fly.io** + Postgres managé : 5 min de setup, ~ 15 €/mois.
- **Cloudflare Workers + D1** : edge mondial, ~ 5 €/mois — mais nécessite le HTTP driver Postgres (Neon serverless) et un peu d'adaptation.

Voir l'axe **14.1 CI/CD** du guide pour le pipeline complet GitHub Actions.

### Frontend qui consomme cette API

Voir le projet **Dashboard Next.js** dans `exercises/07-frameworks-frontend/01-dashboard-nextjs/` — il consomme une API similaire.

---

## 🆘 Si tu as compris cette correction

Tu sais maintenant :

- ✅ Hasher un mot de passe en argon2id avec les bons paramètres OWASP.
- ✅ Sécuriser une session avec un cookie `HttpOnly` + `SameSite`.
- ✅ Protéger des routes avec un middleware `requireAuth`.
- ✅ Isoler les ressources par utilisateur pour éviter l'IDOR.
- ✅ Valider toutes les entrées avec Zod.
- ✅ Écrire des tests d'intégration rapides en SQLite mémoire.
- ✅ Découper un projet par module métier pour la scalabilité.

Si une de ces lignes n'est pas claire, **relis la section 5 correspondante** — chaque sous-section explique le piège, la solution, le pourquoi.

Bon code !
