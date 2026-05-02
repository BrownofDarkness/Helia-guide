# Rapport d'audit — VulnTasks API

## Date

2026-04-30

## Périmètre

Mini-API Hono `vulntasks-api` (canevas pédagogique). Audit boîte blanche : lecture du code,
exploitation manuelle (curl), proposition et application de correctifs, ajout de tests de
non-régression.

## Résumé exécutif

| Niveau     | Nombre |
|------------|--------|
| Critique   | 4      |
| Haute      | 3      |
| Moyenne    | 2      |
| Basse      | 1      |
| **Total**  | **10** |

Toutes les vulnérabilités identifiées ont été **corrigées** dans `correction/`. Les tests
`tests/security.test.ts` couvrent chaque correctif (régression). Les en-têtes ont été audités
manuellement avec `curl -I` (cible locale, hors `securityheaders.com` qui ne scanne pas
`localhost`).

## Tableau récapitulatif

| ID    | Vulnérabilité                          | OWASP | Criticité  | Statut    |
|-------|----------------------------------------|-------|------------|-----------|
| V-001 | SQL Injection sur `/users/search`      | A03   | Critique   | ✅ Corrigé |
| V-002 | Hash MD5 pour les mots de passe         | A02   | Critique   | ✅ Corrigé |
| V-003 | Pas de rate-limit sur `/auth/login`     | A07   | Haute      | ✅ Corrigé |
| V-004 | IDOR sur `GET /tasks/:id`               | A01   | Critique   | ✅ Corrigé |
| V-005 | `JWT_SECRET` hardcodé                   | A02   | Critique   | ✅ Corrigé |
| V-006 | Cookie de session sans flags            | A05   | Haute      | ✅ Corrigé |
| V-007 | CORS `Access-Control-Allow-Origin: *`   | A05   | Haute      | ✅ Corrigé |
| V-008 | Aucun en-tête de sécurité               | A05   | Moyenne    | ✅ Corrigé |
| V-009 | SSRF sur `/preview?url=` (bonus)        | A10   | Moyenne    | ✅ Corrigé |
| V-010 | Pas de log d'accès admin (bonus)        | A09   | Basse      | ✅ Corrigé |

---

## Détail des vulnérabilités

### V-001 — SQL Injection sur `/users/search`

- **Catégorie OWASP** : A03 — Injection
- **Criticité** : Critique
- **Fichier** : `src/index.ts` (handler `GET /users/search`)

**Description.** Le paramètre `q` est concaténé directement dans la requête SQL :

```ts
const sql = `SELECT id, email, name FROM users WHERE name LIKE '%${q}%' OR email LIKE '%${q}%'`;
```

Tout opérateur SQL injecté est interprété par le moteur.

**Exploitation.**

```bash
curl "http://localhost:3000/users/search?q=%27%20OR%201%3D1--"
# {"results":[{"id":1,"email":"alice@example.com",...},{...},{...}]}
```

L'attaquant énumère tous les utilisateurs malgré l'absence de mot-clé. Avec un `UNION SELECT`,
il pourrait exfiltrer les `password_hash`.

**Correctif.** Requête paramétrée + bornes sur la longueur de `q` :

```ts
const rows = db
  .prepare('SELECT id, email, name FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 20')
  .all(`%${q}%`, `%${q}%`);
```

**Test de non-régression.** `V-001 — SQLi neutralisée` (renvoie 0 résultats).

---

### V-002 — Hash MD5 pour les mots de passe

- **Catégorie OWASP** : A02 — Cryptographic Failures
- **Criticité** : Critique
- **Fichier** : `scripts/init-db.ts`, `src/index.ts` (login)

**Description.** Les mots de passe sont stockés en MD5, sans sel, avec dictionnaire de
collisions énorme et débit GPU > 10 G/s.

**Exploitation.** En extrayant `password_md5` (par ex. via V-001 + `UNION SELECT`), un
attaquant casse `5f4dcc3b5aa765d61d8327deb882cf99` (`password`) en quelques millisecondes via
hashcat ou un simple lookup en ligne.

**Correctif.** `argon2id` (mémoire 64 MiB, t=3, p=1) — paramètres OWASP 2026.

```ts
import { hash, verify } from '@node-rs/argon2';

const ph = await hash(password, { memoryCost: 64*1024, timeCost: 3, parallelism: 1 });
// login :
const ok = await verify(user.password_hash, password);
```

**Test.** `V-002 — argon2id : login alice fonctionne`.

---

### V-003 — Pas de rate-limit sur `/auth/login`

- **Catégorie OWASP** : A07 — Identification & Authentication Failures
- **Criticité** : Haute

**Exploitation.** Brute-force trivial avec un dictionnaire :

```bash
for pw in $(cat rockyou.txt); do
  curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"alice@example.com\",\"password\":\"$pw\"}" | grep -q token && echo "$pw" && break
done
```

**Correctif.** Middleware `rateLimit({ windowMs: 60_000, max: 5 })` appliqué uniquement à
`/auth/login` (scope minimal) :

```ts
app.post('/auth/login', rateLimit({ windowMs: 60_000, max: 5 }), async (c) => { /* ... */ });
```

**Test.** `V-003 — rate-limit déclenche 429 au-delà de 5 essais`.

---

### V-004 — IDOR sur `GET /tasks/:id`

- **Catégorie OWASP** : A01 — Broken Access Control
- **Criticité** : Critique

**Exploitation.** Connecté en tant qu'Alice (id=1), elle peut lire la tâche `id=3` qui
appartient à Bob :

```bash
curl -b "session=<token-alice>" http://localhost:3000/tasks/3
# {"task":{"id":3,"user_id":2,"title":"Préparer la démo",...}}
```

**Correctif.** Filtrer par `user_id` dans la requête :

```ts
const task = db
  .prepare('SELECT id, title, done, created_at FROM tasks WHERE id = ? AND user_id = ?')
  .get(id, session.sub);
```

**Test.** `V-004 — alice ne peut pas lire la tâche de bob` (404).

---

### V-005 — `JWT_SECRET` hardcodé

- **Catégorie OWASP** : A02 / A05 — secrets en clair dans le code
- **Criticité** : Critique

**Description.** `const JWT_SECRET = 'super-secret-123';` est versionné dans le repo. Toute
fuite du code permet de **forger** des tokens admin :

```bash
node -e "console.log(require('jsonwebtoken').sign({sub:99,admin:true},'super-secret-123'))"
```

**Correctif.** Lecture via Zod, validation stricte (≥ 32 caractères), `.env` ignoré :

```ts
const env = z.object({ JWT_SECRET: z.string().min(32) }).parse(process.env);
```

**Test.** `V-005 — secret invalide refusé` + scan `gitleaks` qui passe sur le repo.

---

### V-006 — Cookie de session sans flags

- **Catégorie OWASP** : A05 — Security Misconfiguration
- **Criticité** : Haute

**Exploitation.** Un payload XSS (s'il existe ailleurs) accède au cookie via
`document.cookie`. Sur un transport HTTP, le cookie est sniffé en clair. Sans `SameSite`, il
est envoyé avec n'importe quelle requête cross-site (CSRF facilité).

**Correctif.**

```ts
setCookie(c, 'session', token, {
  httpOnly: true, secure: true, sameSite: 'Lax',
  path: '/', maxAge: 60 * 60 * 24 * 7,
});
```

**Test.** Le `Set-Cookie` retourné contient bien `HttpOnly; Secure; SameSite=Lax`.

---

### V-007 — CORS `Access-Control-Allow-Origin: *`

- **Catégorie OWASP** : A05 — Security Misconfiguration
- **Criticité** : Haute

**Exploitation.** Une origine arbitraire (`https://evil.example`) peut lire les réponses de
l'API depuis le navigateur de la victime authentifiée — d'autant plus problématique que le
canevas envoie aussi `Access-Control-Allow-Credentials: true` (combinaison normalement
refusée par le navigateur, mais piégeuse en démo).

**Correctif.** Middleware `hono/cors` avec une liste blanche :

```ts
app.use('*', cors({
  origin: env.ALLOWED_ORIGIN,
  credentials: true,
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowHeaders: ['Content-Type','Authorization'],
}));
```

**Test.** `V-007 — CORS refuse une origine inconnue`.

---

### V-008 — Aucun en-tête de sécurité

- **Catégorie OWASP** : A05 — Security Misconfiguration
- **Criticité** : Moyenne

**Description.** `curl -I http://localhost:3000/health` ne retourne ni HSTS, ni CSP, ni
`X-Frame-Options`, ni `Referrer-Policy`. L'API peut être intégrée en iframe, downgrade HTTP
possible, etc.

**Correctif.** Middleware `secureHeaders` de Hono :

```ts
app.use('*', secureHeaders({
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  contentSecurityPolicy: { defaultSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"] },
  xFrameOptions: 'DENY',
  referrerPolicy: 'no-referrer',
}));
```

**Vérification manuelle.**

```bash
curl -I http://localhost:3000/health
# Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'; object-src 'none'; frame-ancestors 'none'
# X-Frame-Options: DENY
# Referrer-Policy: no-referrer
```

**Test.** `V-008 — en-têtes de sécurité présents`.

---

### V-009 — SSRF sur `/preview?url=` (bonus)

- **Catégorie OWASP** : A10 — Server-Side Request Forgery
- **Criticité** : Moyenne (Critique en environnement cloud)

**Exploitation.** L'endpoint `/preview` fait un `fetch()` sans validation. Sur AWS/GCP, un
attaquant lit les credentials IAM via les métadonnées :

```bash
curl "http://localhost:3000/preview?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"
```

Sur un déploiement local, il scanne aussi le LAN ou pivote vers un Redis interne
(`http://127.0.0.1:6379/`).

**Correctif.** `assertSafeUrl()` :

1. n'accepte que `http(s)`,
2. résout le hostname et **bloque** les plages privées (10/8, 172.16/12, 192.168/16, 127/8,
   169.254/16, 0/8),
3. timeout de 3 s + `redirect: 'manual'` pour empêcher le contournement par redirection.

**Test.** `V-009 — SSRF bloquée vers 127.0.0.1`.

---

### V-010 — Pas de log d'accès admin (bonus)

- **Catégorie OWASP** : A09 — Security Logging and Monitoring Failures
- **Criticité** : Basse

**Description.** Les accès à `/admin/users` ne laissent aucune trace. En cas de compromission,
impossible de reconstituer qui a énuméré les utilisateurs.

**Correctif.** Helper `auditLog()` qui émet un JSON sur stdout ; en production il sera
collecté par le pipeline de logs (Datadog, Loki, …).

```ts
auditLog('admin.users.list', { actor: session.sub });
```

---

## Procédures de vérification

### Démarrage de la version corrigée

```bash
cd correction/
cp .env.example .env
# remplis JWT_SECRET avec une chaîne longue :
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
npm install
npm run db:init
npm run dev
```

### Tests automatisés

```bash
npm test
# 8/8 tests de régression passent.
```

### Audit en-têtes

```bash
curl -I http://localhost:3000/health
```

### Audit dépendances

```bash
npm audit --omit=dev
npx gitleaks detect --no-git
npx semgrep --config=auto src/
```

## Recommandations complémentaires (hors périmètre)

- **CSP nonce-based** côté frontend lié à cette API.
- **Refresh tokens** rotatifs côté authentification.
- **Audit log centralisé** (OpenTelemetry → Loki/Datadog).
- **OWASP ZAP** intégré en CI sur les PRs `main`.
- **Snyk / Dependabot** sur le repo + auto-merge des patchs mineurs.
- **`security.txt`** publié sur le domaine.

## Commits associés

Dans un cadre réel, chaque V-XXX correspond à un commit dédié pour faciliter la revue :

```
fix(security): V-001 paramétrer la requête /users/search
fix(security): V-002 migrer les hashs vers argon2id
fix(security): V-003 ajouter rate-limit sur /auth/login
...
```

Ici la correction est livrée d'un bloc dans `correction/` à des fins pédagogiques.
