# Canevas — Déploiement complet (taskly-api)

> Tu pars de l'API `taskly-api` (axe 8.1) et tu la **livres en production** : containerisation, CI/CD avec OIDC (zéro secret long-lived), infra-as-code (OpenTofu), preview par PR, observabilité Sentry + métriques Prometheus, 2 SLO documentés avec alertes, runbooks.
>
> C'est l'exercice qui transforme « je sais coder une API » en « je sais l'opérer ». Sans cette discipline, tout ce que tu déploies devient une ardoise tech à 6 mois.

## Ce que tu vas faire

| Étape | Sortie |
|-------|--------|
| 1. **Containeriser** | `Dockerfile` multi-stage, non-root, healthcheck, scan Trivy 0 CRITICAL |
| 2. **CI/CD** | `.github/workflows/ci.yml` : lint + test + build + scan + push GHCR + deploy |
| 3. **Infra-as-code** | `infra/main.tf` : Fly app + Postgres + secrets + Sentry project |
| 4. **Preview par PR** | `.github/workflows/preview.yml` qui crée une `taskly-pr-{N}.fly.dev` par PR |
| 5. **Observabilité** | Sentry (source maps), `/metrics` Prometheus, Better Stack uptime |
| 6. **SLO + alertes** | 2 SLO documentés (disponibilité 99.5 %, latence p95) + multi-burn-rate alerts |
| 7. **Runbooks** | `api-down.md`, `db-saturated.md`, `POST_MORTEM_TEMPLATE.md` |

À la fin, tu auras vécu :
- **Multi-stage Dockerfile** avec image runtime ~150 MB (vs ~1 GB en dev).
- **OIDC GitHub → Fly** : pas de `FLY_API_TOKEN` long-lived qui peut fuiter.
- **`release_command` Fly** : migrations DB lancées avant l'image runtime.
- **Multi-burn-rate alerting** : alertes calibrées sur 5 min / 1 h / 6 h pour différents niveaux de gravité.
- **Post-mortem blameless** : structure pro qui sépare incident, root cause, action items.

## Pré-requis

### Comptes (tous gratuits)

| Service | Pourquoi | Lien |
|---------|----------|------|
| GitHub | repo + Actions + OIDC | déjà ouvert |
| Fly.io | déploiement API + Postgres managé | [fly.io/app/sign-up](https://fly.io/app/sign-up) |
| Sentry | erreurs applicatives | [sentry.io/signup](https://sentry.io/signup/) |
| Better Stack | uptime + status page | [betterstack.com](https://betterstack.com) |

### Outils CLI

```bash
# Fly CLI
curl -L https://fly.io/install.sh | sh           # ou : winget install Fly.flyctl

# OpenTofu (alternative OSS à Terraform)
brew install opentofu                             # macOS
winget install OpenTofu.OpenTofu                  # Windows
# Linux : curl -fsSL https://get.opentofu.org/install-opentofu.sh | sh -s -- --install-method standalone

# Vérifs
flyctl version
tofu version
gh --version          # GitHub CLI, optionnel mais pratique
```

> ⚠️ **Tooling manquant ?** Tu peux faire la majorité de l'exercice **sans tofu/flyctl installés localement** : tout passe par les Actions GitHub. Mais tu ne pourras pas faire de `tofu plan` local — utile pour itérer rapidement.

## Code source de l'API

Le canevas **ne contient pas** le code de l'API : tu repars de `exercises/08-backend/01-nodejs-typescript/taskly-api/correction/` et tu places ses fichiers dans `app/`.

```bash
mkdir app
cp -r ../../08-backend/01-nodejs-typescript/taskly-api/correction/* app/
```

## Démarche en 7 étapes

### 1. Containeriser (1–2 h)

Crée `Dockerfile` multi-stage :

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache wget tini && \
    addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production NODE_OPTIONS="--enable-source-maps" PORT=3000
USER app
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/package.json ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
```

Tester localement :

```bash
docker build -t taskly-api:dev ./app
docker run --rm -p 3000:3000 -e DATABASE_URL=... taskly-api:dev
docker run --rm aquasec/trivy image --severity CRITICAL taskly-api:dev
```

Cible : **0 CRITICAL** au scan Trivy.

### 2. CI (3–4 h)

`.github/workflows/ci.yml` avec 4 jobs :

```yaml
permissions:
  contents: read
  packages: write          # pour push sur GHCR
  pull-requests: write     # pour commenter le preview URL
  id-token: write          # OIDC

jobs:
  lint:    # ~2 min : npm ci + npm run lint + typecheck
  test:    # ~5 min : Postgres service container + db:migrate + tests
  image:   # ~5 min : docker build + Trivy + push GHCR + SBOM Anchore
  deploy:  # ~3 min : conditional on main, flyctl deploy avec OIDC
```

OIDC = pas de `FLY_API_TOKEN` long-lived. Voir [doc Fly OIDC](https://fly.io/docs/reference/oidc/).

### 3. IaC OpenTofu (3–4 h)

`infra/main.tf` provisionne :
- **Fly app** `taskly-api` + 2 machines régionées CDG
- **Fly Postgres** cluster (via `flyctl postgres create` puisque le provider TF est limité)
- **Sentry project** + DSN public
- **Secrets Fly** : JWT_SECRET (généré random_password), SENTRY_DSN, DATABASE_URL

Backend distant pour le state (S3 chiffré ou Tigris sur Fly).

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# Remplis fly_org, sentry_org, etc.

tofu init       # Télécharge providers + lock
tofu plan       # Prévisualise les ressources
tofu apply      # Crée
```

### 4. Preview par PR (1–2 h)

`.github/workflows/preview.yml` :
- À chaque PR ouverte → crée `taskly-pr-{N}.fly.dev` avec image preview
- Comment automatique sur la PR avec l'URL
- À chaque PR fermée → `flyctl apps destroy taskly-pr-{N}`

### 5. Observabilité (3–4 h)

Dans `app/src/sentry.ts` :

```ts
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

Dans `app/src/metrics.ts` : exporter Prometheus avec `prom-client` qui expose `/metrics` (latence, codes HTTP, mémoire).

Better Stack : healthcheck `/health` toutes les 30 s + status page publique.

### 6. SLO + alertes (2–3 h)

Dans `SLO.md` :

| SLO | SLI | Objectif | Fenêtre |
|-----|-----|----------|---------|
| Disponibilité | (req non-5xx) / (req totales) sur /api/* | 99.5 % | 30 j rolling |
| Latence | p95 du temps de réponse /api/* | < 300 ms | 7 j rolling |

**Multi-burn-rate alerting** :

| Fenêtre | Burn rate | Action |
|---------|-----------|--------|
| 5 min | 14× | Page critique (on-call réveillé) |
| 1 h | 6× | Page critique |
| 6 h | 3× | Notif Slack |
| 3 j | 1× | Ticket dette tech |

### 7. Runbooks (2–3 h)

Format : **3 pages max**, **commandes copy-pastables**, **pas de prose narrative**.

`runbooks/api-down.md` :
- Détection (qui a alerté, depuis combien de temps)
- Diagnostic (10 commandes à lancer en série, avec interprétation)
- Mitigation (3 actions à essayer dans l'ordre)
- Communication (template Slack + status page)
- Post-incident (lien vers POST_MORTEM_TEMPLATE.md)

`runbooks/db-saturated.md` : idem mais pour saturation DB.

## Vérifier

```bash
# Build local
docker build -t taskly-api:dev ./app
docker run --rm aquasec/trivy image --severity CRITICAL taskly-api:dev

# Plan IaC
cd infra && tofu plan

# Lint workflow GitHub Actions
# Pas de linter officiel ; le test = la CI passe

# Endpoint santé une fois déployé
curl https://taskly-api.fly.dev/health
```

## Bloqué ?

- **Trivy reporte des CRITICAL sur l'image** → la plupart viennent de packages Alpine pas patchés. Solution : `apk upgrade --no-cache` dans le builder, OU passer à `node:24-bookworm-slim` (Debian) qui patche plus fréquemment.
- **Healthcheck Fly fail en boucle** → ton `/health` dépend probablement de la DB. Si la DB est down, le pod redémarre en boucle. Solution : `/health` répond 200 sans DB, et un `/health/db` séparé fait la vérif DB (utilisé par les SLO mais pas par le healthcheck Fly).
- **`flyctl deploy` plante avec « image too large »** → la limite Fly est ~7 GB. Au-delà, soit tu as oublié `npm prune --omit=dev`, soit tu as inclus des fichiers de build (`coverage/`, `.next/`). Vérifie `.dockerignore`.
- **OIDC Fly retourne 401** → vérifie que tu as configuré le **trust policy** Fly avec `repo:<owner>/<repo>:ref:refs/heads/main`. Voir [doc Fly OIDC](https://fly.io/docs/reference/oidc/).
- **Migrations qui plantent en `release_command`** → le release command tourne sur une **machine dédiée éphémère**, pas la prod. Si ta migration prend > 5 min, configure `release_command_timeout = "10m"` dans `fly.toml`.
- **Preview app reste up après PR fermée** → ton workflow `preview.yml` n'a pas de job `destroy` sur l'event `pull_request: types: [closed]`. Coût : 0 € pour 1 app stoppée mais comptée dans ton quota. Toujours destroy.
- **`tofu apply` modifie des secrets et redéploie** → c'est normal si le secret est en plain text dans ton tfvars. Solution : `random_password` (généré une fois, stable) ou backend chiffré.

## Ne commit pas

`.terraform/`, `terraform.tfstate*`, `terraform.tfvars` (secrets!), `*.pem`, `.env*`, `node_modules/`, `dist/`. Tous gitignored.

> **Si tu commits `terraform.tfvars` par accident** : régénère **immédiatement** chaque secret (Sentry DSN, Fly token), puis `git filter-repo` pour purger l'historique. Pas juste `git rm` — la valeur reste dans l'historique git.

## Comparer avec la correction

Une fois fini, regarde `../correction/` :
- 4 jobs CI parallèles + 1 job deploy
- 2 SLO documentés avec multi-burn-rate
- 2 runbooks copy-pastables + 1 template post-mortem
- Dockerfile passé hadolint avec 1 warning mineur (DL3018 versions Alpine)
- Terraform fmt + validate clean
- README.md complet (déploiement, rollback, restauration)

Tes choix peuvent **différer** :
- VPS + Docker Compose au lieu de Fly (axe 14.4 le couvre)
- Render / Railway / Vercel au lieu de Fly
- Pulumi / CDK / Terraform Cloud au lieu d'OpenTofu

C'est valide tant que **les principes restent** : zéro secret long-lived, scan d'image, IaC, SLO chiffrés, runbooks copy-pastables.
