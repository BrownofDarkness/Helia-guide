# Étapes — canevas

Le code de `taskly-api` est attendu dans `app/` (récupère-le depuis l'exercice 8.1
ou écris une version minimale). Les fichiers ci-dessous sont des **stubs** à remplir.

## 1. Containeriser

Édite `app/Dockerfile` :

- multi-stage (builder + runtime)
- node:24-alpine
- USER non-root
- HEALTHCHECK
- pas de devDependencies en runtime

## 2. CI

Édite `.github/workflows/ci.yml` :

- jobs lint / typecheck / test
- build de l'image et push vers ghcr.io
- scan Trivy (échec si CRITICAL)
- déploiement Fly conditionné à `main`

## 3. IaC

Édite `infra/main.tf` :

- provider Fly + Sentry
- ressources : app, machines, Postgres attaché, secrets
- backend distant (S3 ou Tigris) pour le state

## 4. Observabilité

- Initialise Sentry dans `app/src/sentry.ts`
- Expose `/metrics` (Prometheus client)
- Déclare un check Better Stack via Terraform ou manuel
- Crée 2 SLO (disponibilité + latence) et leurs alertes

## 5. Runbooks

- `runbooks/api-down.md`
- `runbooks/db-saturated.md`
- `POST_MORTEM_TEMPLATE.md`

Une fois fini : `git push` et regarde tourner ta CI.
