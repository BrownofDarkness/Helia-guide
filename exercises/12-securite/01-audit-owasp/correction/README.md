# Correction — Audit OWASP (VulnTasks API)

> Version corrigée du canevas + [`AUDIT_REPORT.md`](./AUDIT_REPORT.md) complet (10 vulnérabilités, criticité, exploit, correctif, test). **8/8 tests de régression** verts.
>
> Lis-la **après ton audit**. La valeur de cet exercice n'est pas dans le code final mais dans la **discipline** que tu as développée pour le produire : preuve d'exploit avant correctif, test de régression avant commit, rapport structuré.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Tableau récapitulatif des 10 vulnérabilités](#2-tableau-récapitulatif-des-10-vulnérabilités)
3. [Les 4 patterns de correction qui couvrent 80 %](#3-les-4-patterns-de-correction-qui-couvrent-80)
4. [Anti-SSRF : ce que valide `assertSafeUrl`](#4-anti-ssrf--ce-que-valide-assertsafeurl)
5. [Le mini middleware rate-limit](#5-le-mini-middleware-rate-limit)
6. [Validation : 8/8 tests](#6-validation--88-tests)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
cp .env.example .env

# Génère un secret long et unique pour JWT_SECRET :
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
# Colle la sortie dans .env (JWT_SECRET=...)

npm install
npm run db:init
npm run dev
# → http://localhost:3000
```

Tests :

```bash
npm test                # 8 tests de régression Vitest (8/8 verts)
npm run audit           # npm audit --omit=dev (vulns dans les deps)
```

## 2. Tableau récapitulatif des 10 vulnérabilités

| ID | Faille | OWASP | Criticité | Fichier |
|----|--------|-------|-----------|---------|
| V-001 | SQLi `/users/search` paramétrée | A03 | Critique | `src/index.ts` |
| V-002 | argon2id remplace MD5 | A02 | Critique | `scripts/init-db.ts` + `src/index.ts` |
| V-003 | rate-limit `/auth/login` (5/min/IP) | A07 | Haute | `src/index.ts` + `src/rate-limit.ts` |
| V-004 | IDOR `/tasks/:id` filtré par `user_id` | A01 | Critique | `src/index.ts` |
| V-005 | `JWT_SECRET` ≥ 32c via Zod, lu env | A02 | Critique | `src/env.ts` |
| V-006 | Cookie HttpOnly + Secure + SameSite=Lax | A05 | Haute | `src/index.ts` |
| V-007 | CORS allow-list (`hono/cors`) | A05 | Haute | `src/index.ts` |
| V-008 | `secureHeaders` (HSTS, CSP, XFO, Referrer-Policy) | A05 | Moyenne | `src/index.ts` |
| V-009 | Anti-SSRF DNS + plages privées + timeout | A10 | Moyenne | `src/ssrf.ts` |
| V-010 | Audit log accès admin | A09 | Basse | `src/index.ts` |

Le détail (description, exploit, correctif, test) est dans [`AUDIT_REPORT.md`](./AUDIT_REPORT.md). C'est le format pro à reproduire dans tes futurs audits.

## 3. Les 4 patterns de correction qui couvrent 80 %

### 3.1 Requête paramétrée (vs concaténation)

```ts
// ❌ Avant — SQL Injection
const sql = `SELECT … FROM users WHERE name LIKE '%${q}%'`;
db.execute(sql);

// ✅ Après — paramétrée
db.execute({
  sql: 'SELECT … FROM users WHERE name LIKE ?',
  args: [`%${q}%`],
});
```

**Règle absolue** : tout input utilisateur passe par les `args`, jamais dans la string SQL. Même pour un nom de colonne dynamique (`ORDER BY ${col}`), il faut une **whitelist** :

```ts
const ALLOWED = new Set(['id', 'created_at', 'title']);
const col = ALLOWED.has(input) ? input : 'id';   // sécurisé
```

### 3.2 argon2id pour les passwords (vs MD5/SHA/bcrypt-faible)

```ts
import { hash, verify } from '@node-rs/argon2';

// Inscription
const ph = await hash(password, {
  memoryCost: 64 * 1024,    // 64 MiB
  timeCost: 3,
  parallelism: 1,
});

// Vérification
const ok = await verify(storedHash, password);    // (storedHash, plaintext)
```

| Algo | Vitesse de cassage GPU | Recommandation OWASP 2025+ |
|------|------------------------|------------------------------|
| MD5 | ~100 milliards/sec | ❌ jamais (cassé) |
| SHA-1 | ~10 milliards/sec | ❌ jamais |
| bcrypt cost 4 | ~1 milliard/sec | ❌ trop bas |
| bcrypt cost 12 | ~10K/sec | acceptable |
| **argon2id** (64MiB / 3 / 1) | **~1K/sec** | **premier choix** |

argon2id est **memory-hard** : un attaquant doit allouer 64 MiB par tentative. Sur GPU avec 24 GB, ça limite à 384 tentatives parallèles. C'est ce qui rend l'attaque économiquement non-viable.

### 3.3 Cookie sécurisé

```ts
setCookie(c, 'session', token, {
  httpOnly: true,         // pas accessible à JS (anti XSS)
  secure: true,           // HTTPS only (anti MITM)
  sameSite: 'Lax',        // anti CSRF (sauf navigation top-level)
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
});
```

| Flag | Si absent → exploitable comment |
|------|------------------------------------|
| `httpOnly` | XSS vole le cookie via `document.cookie` |
| `secure` | MITM en HTTP intercepte le cookie en clair |
| `sameSite: 'Lax'` | CSRF : un site malveillant déclenche une action authentifiée |
| `maxAge` | Cookie persiste indéfiniment, augmente la fenêtre de vol |

Règle : **les 4 flags sont obligatoires** sur tout cookie de session.

### 3.4 Validation Zod des env vars

```ts
// src/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  JWT_SECRET: z.string().min(32),       // assez long pour HMAC-SHA256
  PORT: z.coerce.number().default(3000),
  ALLOWED_ORIGIN: z.string().url(),
  DATABASE_FILE: z.string().default('./vulntasks.db'),
});

export const env = EnvSchema.parse(process.env);
// ↑ throw au démarrage si une var manque ou est invalide
```

**Bénéfices** :

1. **Fail fast** : si `JWT_SECRET` n'est pas dans `.env`, le serveur ne démarre pas — pas de fallback silencieux à `'super-secret-123'`.
2. **Typage** : `env.JWT_SECRET` est typé `string` partout dans le code, pas `string | undefined`.
3. **Validation** : `min(32)` rejette les secrets faibles. `.url()` valide le format de `ALLOWED_ORIGIN`.

C'est le pattern **« config en code »** : ta config est validée comme du code, pas comme des chaînes magiques.

## 4. Anti-SSRF : ce que valide `assertSafeUrl`

```ts
// src/ssrf.ts
export async function assertSafeUrl(input: string): Promise<URL> {
  const url = new URL(input);

  // 1. Protocoles autorisés uniquement
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Protocole interdit (SSRF)');
  }

  // 2. Résolution DNS pour bloquer les IPs privées
  const addresses = await dns.lookup(url.hostname, { all: true });
  for (const { address } of addresses) {
    if (isPrivate(address)) {
      throw new Error(`IP privée interdite (SSRF) : ${address}`);
    }
  }

  return url;
}
```

`isPrivate` couvre :

| Range | Pourquoi bloqué |
|-------|------------------|
| `127.0.0.0/8` | localhost — accès aux services internes |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | RFC 1918 — réseaux privés |
| `169.254.0.0/16` | link-local — **inclut 169.254.169.254 = métadonnées AWS / GCP / Azure** |
| `::1`, `fc00::/7`, `fe80::/10` | IPv6 équivalents |

**Le piège SSRF le plus dangereux** : `169.254.169.254` est l'endpoint des métadonnées cloud. Si ton attaquant peut faire un GET dessus, il récupère les **credentials IAM** de ton instance — accès complet à ton compte cloud.

### Le piège du DNS rebinding

`dns.lookup` au moment de l'audit n'empêche **pas** un attaquant de faire **un fetch suivant** vers une IP privée si le DNS répond différemment (DNS rebinding). Pour vraiment couvrir, il faudrait :

1. Résoudre le DNS soi-même.
2. Faire le `fetch` directement vers l'IP (pas vers le hostname).
3. Vérifier l'IP utilisée vs l'IP résolue.

Ce n'est pas fait ici (trade-off pédagogique). En prod, utilise une lib éprouvée comme [`ssrf-req-filter`](https://github.com/y3owk1n/ssrf-req-filter) ou un proxy frontal qui filtre.

## 5. Le mini middleware rate-limit

```ts
// src/rate-limit.ts
type Bucket = { hits: number; resetAt: number };

export function rateLimit(opts: { windowMs: number; max: number }): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();
  const keyFn = (c) =>
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.env?.incoming?.socket?.remoteAddress ??
    'anon';

  return async (c, next) => {
    const key = keyFn(c);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { hits: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (bucket.hits >= opts.max) {
      c.header('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return c.json({ error: 'Trop de requêtes' }, 429);
    }

    bucket.hits += 1;
    return next();
  };
}
```

**~30 lignes**. Limites de cette implémentation :

| Limitation | Conséquence | Solution prod |
|------------|-------------|---------------|
| `Map` en mémoire | Reset au redémarrage. Multi-instance = chaque instance a son propre compteur | Redis (`ratelimit-redis`) ou Upstash |
| Clé = IP source | Un user derrière un NAT entreprise est bloqué pour tout le monde | Combiner avec un user ID si dispo |
| Pas de **token bucket** | Pas de burst autorisé | Algo plus sophistiqué |
| Pas de **distributed coordination** | Race conditions cross-instance | Lua script Redis |

C'est intentionnellement minimal — un middleware de 30 lignes qui marche pour le **mode test** + **un seul process**. En prod, utilise [`hono-rate-limiter`](https://github.com/rhinobase/hono-rate-limiter) avec backend Redis.

## 6. Validation : 8/8 tests

```bash
npm test
```

```
✓ tests/security.test.ts (8 tests) 1.66 s
  ✓ V-001 — SQLi neutralisée sur /users/search
  ✓ V-002 — argon2id : login alice fonctionne
  ✓ V-003 — rate-limit déclenche 429 au-delà de 5 essais
  ✓ V-004 — IDOR fermé : alice ne peut pas lire la tâche de bob
  ✓ V-005 — secret invalide refusé
  ✓ V-007 — CORS refuse une origine inconnue
  ✓ V-008 — en-têtes de sécurité présents
  ✓ V-009 — SSRF bloquée vers 127.0.0.1
```

Chaque test est nommé d'après la **vulnérabilité** qu'il couvre (V-001, V-002, …). Si un test casse, tu retrouves immédiatement la faille concernée dans `AUDIT_REPORT.md`. C'est la convention à adopter pour traçabilité audit ↔ tests.

> ℹ️ Pas de test pour V-006 (cookie flags) car il est déjà vérifié dans le helper `login()` — chaque appel asserte `HttpOnly`, `Secure`, `SameSite=Lax`.

## 7. Pièges réels rencontrés

3 pièges concrets pendant la construction :

1. **`better-sqlite3` ne build pas sur Windows + Node 24** → exigeait Visual C++ Build Tools (~5 GB). Fix : migration vers `@libsql/client` (drop-in async, prébuilds toutes plateformes). Déjà documenté dans [piège `better-sqlite3-windows-build`](/pieges/).
2. **Tests `app.request()` partagent le bucket rate-limit** → toutes les requêtes utilisent la clé `'anon'` (pas d'IP réelle dans Hono test mode). V-003 épuisait le bucket pour V-004 qui plantait au login. Fix : passer un `X-Forwarded-For` distinct par test.
3. **`async/await` partout après migration libsql** → toutes les routes Hono qui faisaient `db.prepare(...).all()` (sync) deviennent `await db.execute(...)`. Si tu oublies un `await`, tu return une `Promise<Response>` au lieu d'une `Response` — comportement bizarre, pas d'erreur explicite.

Aucun nouveau piège global à capturer dans `pieges.ts` — les 3 sont des variations de pièges déjà documentés.

## 8. Pour aller plus loin

- **CSP nonce-based** : génère un `nonce` par requête (`crypto.randomBytes(16).toString('base64')`), passe-le aux Server Components, et utilise-le dans la CSP : `script-src 'nonce-...'`. Permet d'autoriser uniquement les scripts inline générés par ton serveur.

- **Pentest automatisé en CI** :
  ```yaml
  # .github/workflows/security.yml
  - run: npm audit --audit-level=high
  - uses: returntocorp/semgrep-action@v1
  - uses: gitleaks/gitleaks-action@v2
  ```

- **OWASP ZAP** en mode baseline scan dans la CI : 5 minutes, repère les vulnérabilités webaccessibles.

- **`security.txt`** dans `public/.well-known/security.txt` : permet aux pentesters externes de te contacter (cf. [securitytxt.org](https://securitytxt.org/)).

- **Snyk / Dependabot** : alertes automatiques quand une lib utilisée a une CVE.

- **Threat modeling** (STRIDE, PASTA) : exercice de **conception** avant le code, pour identifier les risques par catégorie. Vaut le coup pour les apps avec données sensibles.

- **Refaire l'exo en mode pentester externe** : ne lis **pas** le code source. Démarre l'API, fais juste des `curl` et observe les réponses. C'est l'audit boîte noire — beaucoup plus dur, beaucoup plus formateur. Compare ce que tu trouves vs l'audit boîte blanche que tu viens de faire.
