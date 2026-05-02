# Exercice 12.1 — Audit OWASP

> **Axe** : 12 — Sécurité applicative
> **Difficulté** : intermédiaire
> **Durée estimée** : 6 à 12 heures
> **Prérequis** : axes 8, 12 lus, **Node.js ≥ 20**

## ⚙️ Avant de commencer

Voir [« Installer Node.js »](../../02-web/01-mini-curl/README.md#-avant-de-commencer--installer-nodejs).

```bash
node --version       # v20+ (idéalement 24)
```

## 🎯 Objectifs pédagogiques

- **Identifier** des vulnérabilités OWASP Top 10 dans du code réel
- **Corriger** chaque faille avec la bonne approche
- Produire un **rapport d'audit** structuré
- Configurer **headers de sécurité**, rate-limit, CSP

## 📋 Énoncé — deux modes au choix

Tu as **deux modes** pour cet exercice. Choisis celui qui te parle, ou enchaîne les deux pour consolider.

### 🎯 Mode A — Audit boîte blanche de VulnTasks API (recommandé en 1ère lecture)

Le canevas contient une **mini-API Hono** intentionnellement **trouée** : 8 vulnérabilités sont plantées. Tu dois :

1. **Lire le code** et identifier les failles.
2. **Classer** chaque faille selon OWASP Top 10.
3. **Exploiter** chaque faille pour vérifier (curl).
4. **Corriger** le code.
5. **Documenter** dans un rapport `AUDIT_REPORT.md`.

**Pourquoi ce mode** : 8 vulns plantées d'un coup → tu vois rapidement la grille OWASP appliquée à des cas concrets. Le code est court (~150 lignes), tu peux le lire en 30 min. Idéal pour acquérir le **réflexe** d'auditeur.

### 🧬 Mode B — Audit de ton `taskly-api` (recommandé après le mode A)

> Pré-requis : avoir terminé l'exercice **8.1 taskly-api** (Node/TS, Python ou PHP — peu importe le parcours).

Reprends ton propre code de `taskly-api` et **audite-le honnêtement**. La correction de l'axe 8.1 est déjà solide (argon2id, JWT explicite HS256, cookie HttpOnly+Secure+SameSite, validation Zod, isolation par owner, 422 sur erreurs validation) — donc l'objectif n'est pas de trouver 8 vulns béantes mais de **durcir 3-5 points qui peuvent l'être**.

Checklist d'audit ciblée pour `taskly-api` :

| Point à vérifier | Si oui | Si non → durcir |
|------------------|--------|------------------|
| **Rate-limit sur `/auth/login`** | ✅ | Ajouter `slowapi` (Python) / middleware maison (Node/PHP) |
| **Headers de sécurité** (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) | ✅ | Ajouter middleware (`secureHeaders` Hono / Helmet / `add_header` Nginx) |
| **CORS restrictif** | ✅ | Vérifier que `Access-Control-Allow-Origin` n'est pas `*` avec credentials |
| **Logs d'audit accès admin** | ✅ | Logger chaque accès à `/admin/*` avec `actor_id`, `action`, `timestamp` |
| **Rotation de secrets JWT** | ✅ | Documenter procédure rotation (si pas mécanique automatique) |
| **`.env.example` séparé de `.env`** | ✅ | Créer `.env.example` sans valeurs sensibles |
| **`npm audit` / `pip audit` / `composer audit` clean** | ✅ | Mettre à jour les deps à risque |
| **Validation runtime des inputs** | ✅ (Zod/Pydantic/FormRequest) | Ajouter au minimum sur les endpoints publics |
| **SSRF possible** sur des endpoints qui font fetch externe | N/A si aucun | Si oui : validation hostname + bloquer IPs privées |
| **Erreurs ne leak pas d'infos sensibles** | ✅ | Logger en interne, retourner message générique |

**Mission** :
1. **Cocher** chaque ligne pour ton taskly-api (réponds Oui / Non / N/A).
2. **Pour chaque "Non"** : appliquer le correctif et documenter dans `AUDIT_REPORT.md` (criticité, exploit théorique, correctif, test de régression).
3. **Cibler 3-5 améliorations** — pas plus. La sécurité est un travail continu, pas un sprint.

**Pourquoi ce mode** : tu apprends à **dire ce qui est déjà bien fait** (90 % de l'audit pro, c'est ça) et à identifier les **dernières 5-10 % d'améliorations**. C'est ce que fait un vrai pentester sur une app pro — il ne trouve pas 8 vulns béantes, il trouve 3 améliorations subtiles.

> 💡 **Combo recommandé** : fais d'abord le **Mode A** (8 vulns flagrantes, 4-6 h) pour acquérir la grille OWASP, puis le **Mode B** sur ton taskly-api (3-5 améliorations subtiles, 4-6 h) pour appliquer à du code « déjà OK ». La différence d'effort entre les deux est elle-même un enseignement.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| Tu as identifié **au moins 8 vulnérabilités** | référence OWASP pour chacune |
| Pour chacune : preuve d'exploitation (curl) | reproductible |
| Pour chacune : correctif appliqué | commit séparé idéalement |
| `AUDIT_REPORT.md` rédigé | tableau récap + détails |
| `npm test` passe | tests à ajouter pour les régressions |
| Headers de sécu présents | testé via curl `-I` |
| Score [securityheaders.com](https://securityheaders.com/) | A minimum (en local : checker manuel) |

### Bonus

- Configurer un **CSP** strict avec nonce.
- Ajouter **Helmet-style** middleware Hono.
- **CI GitHub Actions** qui lance Semgrep + npm audit.

## 🛠 Démarrer

```bash
cd canevas/
npm install
npm run db:init    # crée la DB SQLite avec données de test
npm run dev
# http://localhost:3000
```

Tu vois l'API tourner. Maintenant, **trouve les failles**.

### Pistes — questions à se poser

En lisant chaque endpoint, demande-toi :

- Le user authentifié est-il vérifié ?
- L'input utilisateur est-il validé / paramétré ?
- Les secrets sont-ils en clair dans le code ?
- Y a-t-il un rate-limit sur les endpoints sensibles ?
- Les mots de passe sont-ils hashés correctement ?
- Les cookies sont-ils HttpOnly Secure SameSite=Lax ?
- Les CORS sont-ils restrictifs ?
- Les headers de sécu sont-ils présents ?

## 🧪 Vérifier

```bash
# Test du correctif sur SQL injection
curl "http://localhost:3000/users/search?q=alice'%20OR%201=1--"

# Test rate-limit
for i in {1..20}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"wrong"}'
done
# Tu devrais voir 429 après 5 tentatives

# Test headers
curl -I http://localhost:3000/health
# Doit voir : Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, ...
```

## 💡 Indices

<details>
<summary>1. Liste indicative des 8 failles plantées (sans les emplacements)</summary>

1. **A03 SQL Injection** — concaténation de string dans une query
2. **A07 Mots de passe en clair** ou hash trivial
3. **A07 Pas de rate-limit** sur login
4. **A01 IDOR** — endpoint sans vérif d'autorisation
5. **A02 Secrets hardcodés** dans le code
6. **A05 Cookie sans flags de sécu**
7. **A05 CORS trop permissif**
8. **A05 Pas de headers de sécurité** (HSTS, CSP, X-Frame-Options…)

Bonus si tu trouves :
- A10 SSRF dans un endpoint preview
- A03 NoSQL injection style sur un find()
- A09 Pas de log des accès admin
</details>

<details>
<summary>2. Rubrique d'audit suggérée</summary>

```markdown
# Rapport d'audit — VulnTasks API

## Date
2026-04-30

## Résumé exécutif
8 vulnérabilités identifiées dont X critiques.

## Détail des vulnérabilités

### V-001 — SQL Injection sur /users/search

**Catégorie OWASP** : A03 Injection
**Criticité** : Critical
**Description** : ...
**Exploitation** :
```bash
curl "..."
```
**Correctif** : ...
**Commit** : abc123

### V-002 — ...
```
</details>

<details>
<summary>3. Outils utiles</summary>

```bash
# Scan deps
npm audit

# Détection secrets
npx gitleaks detect --no-git

# SAST
npx semgrep --config=auto src/

# Headers check
curl -I https://localhost:3000/health
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — version corrigée + `AUDIT_REPORT.md` complet.

## 📚 Pour aller plus loin

- Ajouter une **CSP nonce-based** + serve frontend.
- **Pentest** avec OWASP ZAP en CI.
- Mettre en place [`security.txt`](https://securitytxt.org/).
- Activer **Snyk** sur le repo.
