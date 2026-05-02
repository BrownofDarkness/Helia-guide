# Canevas — Audit OWASP de VulnTasks API

> Tu reçois une **mini-API Hono volontairement trouée** : 8 à 10 vulnérabilités OWASP Top 10 plantées dans `src/index.ts`. Ta mission de pentester : les **identifier**, les **exploiter** (preuve à l'appui), les **corriger**, et **documenter** dans un rapport d'audit professionnel.
>
> C'est l'exercice qui transforme « j'ai entendu parler d'OWASP » en « je sais auditer un service ». La discipline qui distingue un dev du dev qui sait sécuriser.

## Ce que tu vas faire

| Étape | Sortie |
|-------|--------|
| 1. **Lecture statique** | Liste de vulnérabilités candidates avec ID OWASP |
| 2. **Exploitation** | 1 commande `curl` qui prouve chaque faille |
| 3. **Correctifs** | Code patché, idéalement 1 commit par fix |
| 4. **Tests de régression** | Vitest qui asserte que la faille ne revient pas |
| 5. **AUDIT_REPORT.md** | Rapport structuré : résumé + détail par vuln |

À la fin, tu auras vécu :
- **8 vulnérabilités OWASP Top 10** réellement exploitables (SQLi, faible hash, brute force, IDOR, secrets hardcodés, cookies pas safe, CORS *, headers manquants).
- **2 bonus** : SSRF sur un endpoint preview + manque de logs admin.
- Le réflexe **« preuve d'exploit avant correctif »** — sans ça, tu corriges à l'aveugle.
- L'utilisation de `hono/secure-headers`, `hono/cors`, `argon2id`, JWT signé, validation Zod, et un mini middleware rate-limit fait maison.

## Pré-requis

- **Node ≥ 20** (`node --version`).
- `curl` (livré avec git-bash sous Windows, natif Linux/Mac).

C'est tout. SQLite est embarqué via `@libsql/client` (pas de Postgres à installer).

> **Note Windows** : on utilise **`@libsql/client`** au lieu de `better-sqlite3` parce que ce dernier nécessite Visual C++ Build Tools (~5 GB) sous Node 24. Voir piège [`better-sqlite3-windows-build`](/pieges/) — c'est un patron à connaître pour tout projet Node + SQLite.

## Démarrer

```bash
npm install
npm run db:init       # crée vulntasks.db avec 3 users + 4 tasks de test
npm run dev           # http://localhost:3000
```

Comptes de test imprimés au seed :
- `alice@example.com` / `alice123`
- `bob@example.com` / `bob456`
- `admin@example.com` / `admin`

Vérifie que ça tourne :

```bash
curl http://localhost:3000/health
# → {"status":"ok"}
```

## Démarche en 5 étapes

### Étape 1 — Lecture statique (45 min)

Avant de toucher au code, **lis-le entièrement**. Pour chaque endpoint, demande-toi :

| Question à te poser | Si oui → | Si non → |
|---------------------|----------|----------|
| L'auth est-elle vérifiée ? | OK | A01 / A07 |
| L'input utilisateur est-il validé ET paramétré dans la query ? | OK | A03 (injection) |
| Les secrets (JWT, passwords) sont-ils dans `process.env` ? | OK | A02 |
| Y a-t-il un rate-limit sur les endpoints sensibles ? | OK | A07 |
| Les cookies ont-ils HttpOnly + Secure + SameSite=Lax ? | OK | A05 |
| Les CORS sont-ils restrictifs (origine précise) ? | OK | A05 |
| Les headers de sécu sont-ils présents (`secureHeaders()`) ? | OK | A05 |
| Les hashes de passwords utilisent-ils argon2id ou bcrypt à coût fort ? | OK | A02/A07 |

Liste indicative (lis le code AVANT de regarder cette liste, c'est l'exercice) :

<details>
<summary>Spoiler : 8 vulnérabilités plantées</summary>

1. **A03 SQL Injection** — concaténation dans `/users/search`
2. **A07 MD5 pour passwords** — cassable à 10 milliards/sec sur GPU
3. **A07 Pas de rate-limit** sur `/auth/login`
4. **A01 IDOR** — `/tasks/:id` ne vérifie pas l'owner
5. **A02 Secret hardcodé** `JWT_SECRET = 'super-secret-123'`
6. **A05 Cookie sans flags** — pas HttpOnly, pas Secure, pas SameSite
7. **A05 CORS `*` avec credentials** — combo invalide spec mais souvent vu
8. **A05 Aucun header** — pas de HSTS, CSP, X-Frame-Options, etc.

Bonus :
- **A10 SSRF** sur `/preview?url=`
- **A09 Pas de log** d'accès `/admin/users`

</details>

### Étape 2 — Exploitation (1 h)

Pour **chaque** vulnérabilité, écris une commande `curl` qui prouve l'exploit :

```bash
# V-001 SQL Injection
curl "http://localhost:3000/users/search?q=' OR '1'='1"
# → renvoie tous les users, l'injection a passé

# V-002 Hash MD5 — le seed contient md5('alice123') = e3274be5c857fb4...
# Sans toucher au serveur, on peut cracker le hash dans https://crackstation.net

# V-003 Brute force / pas de rate-limit
for i in $(seq 1 50); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"alice@example.com","password":"wrong"}'
done
# → 50 fois 401, jamais 429 (devrait limiter)

# V-004 IDOR — alice authentifiée lit la tâche de bob
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alice123"}' | jq -r .token)
curl http://localhost:3000/tasks/3 -H "Authorization: Bearer $TOKEN"
# → renvoie la tâche de bob (id=3) alors qu'alice n'est pas owner
```

### Étape 3 — Correctifs (2–3 h)

Pour chaque faille, **avant de corriger**, écris **d'abord le test** qui reproduit. Puis corrige. Le test passe → la régression est gardée.

Patterns standards :

```ts
// V-001 : requête paramétrée
db.execute({ sql: 'SELECT … WHERE name LIKE ?', args: [`%${q}%`] });
// (jamais : db.execute(`SELECT … WHERE name LIKE '%${q}%'`))

// V-002 : argon2id (memoryCost 64MiB recommandé OWASP)
import { hash, verify } from '@node-rs/argon2';
await hash(password, { memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 });

// V-003 : middleware rate-limit (window + max par IP)
app.post('/auth/login', rateLimit({ windowMs: 60_000, max: 5 }), handler);

// V-004 : check owner DANS la query SQL
db.execute({
  sql: 'SELECT … FROM tasks WHERE id = ? AND user_id = ?',
  args: [id, session.sub],
});

// V-005 : env var validée par Zod, jamais en dur
import { z } from 'zod';
const env = z.object({ JWT_SECRET: z.string().min(32) }).parse(process.env);

// V-006 : cookie sécurisé
setCookie(c, 'session', token, { httpOnly: true, secure: true, sameSite: 'Lax' });

// V-007 : CORS allowlist
app.use('*', cors({ origin: env.ALLOWED_ORIGIN, credentials: true }));

// V-008 : middleware secureHeaders
import { secureHeaders } from 'hono/secure-headers';
app.use('*', secureHeaders({ /* CSP, HSTS, X-Frame-Options, … */ }));
```

### Étape 4 — Tests de régression (1 h)

```ts
// tests/security.test.ts
import { describe, it, expect } from 'vitest';
import { app } from '../src/index';

describe('Régressions sécurité', () => {
  it('V-001 — SQLi neutralisée', async () => {
    const res = await app.request("/users/search?q=' OR 1=1--");
    const data = await res.json();
    expect(data.results.length).toBe(0);    // pas d'injection passée
  });

  it('V-003 — rate-limit déclenche 429 après 5 essais', async () => {
    // …
  });

  // … 1 test par fix
});
```

### Étape 5 — Rédaction du rapport (1 h)

Dans `AUDIT_REPORT.md`, structure :

```markdown
# Rapport d'audit — VulnTasks API

## Résumé exécutif
N vulnérabilités identifiées, X critiques, toutes corrigées.

## Tableau récapitulatif
| ID | Vulnérabilité | OWASP | Criticité | Statut |
| V-001 | … | A03 | Critique | Corrigé |

## Détail par vulnérabilité

### V-001 — SQL Injection sur /users/search
- **Catégorie OWASP** : A03 — Injection
- **Criticité** : Critique
- **Description** : explication
- **Exploitation** :
  ```bash
  curl "..."
  ```
- **Correctif** : explication + extrait
- **Test** : tests/security.test.ts:V-001
```

C'est le format **CWE / CVSS-light** qu'utilise l'industrie. Lisible par un dev (qui veut le détail technique) et un manager (qui veut juste le résumé exécutif).

## Tester

```bash
npm test                    # tests de régression Vitest
npm run audit               # npm audit --omit=dev (vulns dans les deps)
```

Outils additionnels (à installer si tu les utilises) :

```bash
npx gitleaks detect --no-git    # détection secrets dans le code
npx semgrep --config=auto src/  # SAST (Static Application Security Testing)
curl -I http://localhost:3000/health  # check headers manuel
```

## Bloqué ?

- **Mon `curl` SQLi renvoie une erreur 500 au lieu de bypass** → l'erreur est elle-même un signe de SQLi (le serveur retourne le message SQL). Note ça dans ton rapport. Pour bypass propre, essaie avec `'%`, `' OR 1=1--`, `' UNION SELECT ...`.
- **`stripe.cli` ou `gitleaks` pas installés** → optionnels. Le minimum requis = curl + lecture statique.
- **Mon hash argon2id mute le mot de passe** → tu hashes deux fois (à l'inscription ET à la vérif). `verify()` re-hashe son argument et compare aux bytes — passe le mot de passe **en clair** à `verify()`, pas son hash.
- **Le rate-limit ne se déclenche pas en test** → tous les tests partagent le même bucket (clé = IP `'anon'`). Passe `X-Forwarded-For: 10.0.0.X` (X distinct par test) pour isoler.
- **`secureHeaders()` casse mon front en dev** → la CSP par défaut est stricte (`default-src 'self'`). Pour le dev, autorise `'unsafe-inline'` sur `style-src` ou ajoute `'nonce-…'`. **Resserre en prod.**
- **`@libsql/client` au lieu de `better-sqlite3`** → choix volontaire (cf. piège). Les méthodes diffèrent : `db.execute({sql, args})` retourne `result.rows` (au lieu de `db.prepare(...).all()`). C'est asynchrone — n'oublie pas les `await`.

## Ne commit pas

`vulntasks.db`, `vulntasks.test.db`, `node_modules/`, `.env`. Si tu commit accidentellement la DB seedée, ce n'est pas grave — les passwords sont des hashes faibles **et seedés en clair dans `init-db.ts`** (admin/admin). Ne réutilise jamais ces creds dans un vrai service.

## Comparer avec la correction

Une fois ton audit terminé, regarde `../correction/` :
- 8 vulnérabilités corrigées + 2 bonus
- 8 tests de régression (Vitest) tous verts
- `AUDIT_REPORT.md` complet (10 entrées avec criticité, exploit, correctif, commit)
- Chaque correctif annoté `// ✅ V-00X — A0Y : …` dans le code

Compare **tes choix** : ton format de rapport, la criticité que tu as donnée à chaque vuln, les correctifs que tu as proposés. La correction est **une** réponse possible — la tienne est valide si elle est défendable.
