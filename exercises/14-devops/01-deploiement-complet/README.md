# Exercice 14.1 — Déploiement complet (taskly-api)

> **Axe** : 14 — DevOps & exploitation
> **Difficulté** : avancé
> **Durée estimée** : 12 à 24 heures
> **Prérequis** : axe 14 lu, exercice 8.1 (taskly-api) terminé, **Node.js ≥ 20**, comptes gratuits Fly.io + GitHub + Sentry + Better Stack

## ⚙️ Avant de commencer

### Comptes nécessaires

Cet exercice utilise des services externes pour rester réaliste. Tous proposent un free tier suffisant pour cet exercice :

| Service | Pourquoi | Lien |
|---------|----------|------|
| GitHub | repo + Actions + OIDC | déjà ouvert si tu lis ça |
| Fly.io | déploiement de l'API + Postgres managé | https://fly.io/app/sign-up |
| Sentry | erreurs applicatives | https://sentry.io/signup/ |
| Better Stack | uptime + status page | https://betterstack.com |

### Outils CLI

```bash
# Fly CLI
curl -L https://fly.io/install.sh | sh   # ou : brew install flyctl

# OpenTofu (alternative OSS à Terraform)
brew install opentofu                     # macOS
# Linux : voir https://opentofu.org/docs/intro/install/

# Vérifs
flyctl version
tofu version
gh --version            # GitHub CLI, optionnel mais pratique
```

## 🎯 Objectifs pédagogiques

- Construire un **pipeline CI/CD complet** avec OIDC (zéro secret long-lived).
- **Containeriser** l'API avec un Dockerfile production-ready.
- **Versionner l'infrastructure** avec OpenTofu (Fly app + Postgres + Sentry project).
- Déployer sur **Fly.io** avec preview par PR + prod automatique.
- Mettre en place **monitoring** (Sentry + Better Stack + Grafana Cloud free tier).
- **Définir 2 SLO** mesurables avec error budget.
- Rédiger **2 runbooks** + 1 template de post-mortem.

## 📋 Énoncé — taskly-api en prod

Tu repars de `taskly-api` (exercice 8.1). Tu dois la livrer en production de bout en bout :

1. **Containeriser** l'application (`Dockerfile` multi-stage, non-root, healthcheck).
2. **Mettre en place CI** GitHub Actions : lint + typecheck + tests + build image + scan Trivy + push GHCR.
3. **Provisionner l'infra** avec OpenTofu : Fly app + Postgres managé + secret JWT + DNS (optionnel).
4. **Déployer** : auto sur main, preview Fly app par PR.
5. **Observabilité** : Sentry + métriques Prometheus exportées + Better Stack uptime + statuspage.
6. **SLO + alerting** : 2 SLO, alertes correspondantes, 1 runbook par SLO.
7. **Documenter** : `README.md` complet + `runbooks/` + `POST_MORTEM_TEMPLATE.md`.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| `Dockerfile` | multi-stage, non-root, scan Trivy 0 CRITICAL |
| `.github/workflows/ci.yml` | lint/test/build/scan, durée < 10 min |
| OIDC pour Fly | `FLY_API_TOKEN` n'est pas un secret long-lived (token éphémère ou IAM-like) |
| `infra/main.tf` | crée app + Postgres + secret JWT + dump healthcheck |
| Preview par PR | URL postée en commentaire automatiquement |
| Sentry | source maps uploadées, environnement = `prod` / `preview` |
| 2 SLO documentés | avec target chiffrée + fenêtre |
| Alertes | Better Stack pingue Slack si SLO en danger |
| 2 runbooks | actions copy-pastables, < 2 pages |
| Post-mortem template | structure blameless |
| `README.md` complet | comment déployer / rollback / restaurer |

### Bonus

- **Argo Rollouts** ou **canary** déploiement avec ramp 10 % → 50 % → 100 %.
- **Métriques RED + USE** dans Grafana avec dashboard partagé.
- **Multi-région Fly** (CDG + LHR) avec replica Postgres.
- **GitOps** sur un repo manifests dédié.

## 🗺️ Réalisme de la durée annoncée

« 12–24 h » est **très optimiste** si c'est ta 1ère mise en prod sérieuse. Découpage réaliste :

| Étape | Durée min | Durée max | Notes |
|-------|-----------|-----------|-------|
| **0. Comptes Fly + Sentry + Better Stack + tooling CLI** | 2 h | 4 h | OpenTofu install + auth, vérifs |
| **1. Dockerfile multi-stage + scan Trivy local** | 2 h | 3 h | + `.dockerignore`, healthcheck |
| **2. CI lint+typecheck+test (3 jobs)** | 3 h | 5 h | Postgres service container, cache npm |
| **3. CI build image + push GHCR + Trivy + SBOM** | 3 h | 5 h | OIDC config GitHub ↔ Fly |
| **4. OpenTofu : Fly app + Postgres + secrets + Sentry** | 4 h | 8 h | `tofu init`, debug providers, backend S3 |
| **5. Premier `flyctl deploy` réussi** | 2 h | 4 h | DB connection string, healthchecks Fly |
| **6. Preview par PR (workflow + cleanup)** | 2 h | 4 h | `flyctl apps destroy` au close de PR |
| **7. Sentry : DSN + sourcemaps + release tracking** | 2 h | 3 h | Test que les erreurs remontent vraiment |
| **8. Better Stack : 1 monitor + 1 status page** | 1 h | 2 h | Test alerte vers Slack/Discord |
| **9. SLO documentés (`SLO.md`) + runbooks** | 3 h | 5 h | Format pro, multi-burn-rate alerting |
| **10. POST_MORTEM_TEMPLATE + 1 incident fictif** | 1 h | 2 h | Format blameless |

**Total réaliste** : **25–45 h sur 2-3 semaines** (vs 12–24 h annoncé). C'est l'exercice le plus **lourd** du guide.

### Version minimale (15 h) vs version complète (45 h)

| Choix | Version minimale | Version complète |
|-------|-------------------|---------------------|
| OIDC | `FLY_API_TOKEN` long-lived dans Secrets | OIDC trust policy Fly |
| IaC | `flyctl launch` + `flyctl secrets set` à la main | OpenTofu complet versionné |
| Preview PR | Manuel (déploie depuis branche) | Auto + comment URL sur PR |
| SBOM | Skippé | Anchore + scan Trivy bloquant |
| Monitoring | Sentry seul | Sentry + Better Stack + status page |
| Multi-burn-rate | 1 alerte simple | 4 fenêtres (5min/1h/6h/3j) |
| Runbooks | 1 runbook short | 2 runbooks + post-mortem template |

→ **Si tu as 1 semaine (15 h)**, livre la version minimale (Dockerfile + CI + 1 deploy main + Sentry + 1 alerte). Tu apprends 70 % en 30 % du temps. La version complète est utile en mission pro, pas pour un side-project.

## 🛠 Démarrer

```bash
cd canevas/

# 1. Crée ton compte Fly + auth
flyctl auth login

# 2. Initialise OpenTofu
cd infra
tofu init

# 3. Lance l'app en local pour confirmer qu'elle marche
cd ../app
npm install
npm run dev
```

Suis ensuite les étapes du `canevas/STEPS.md`.

## 🧪 Vérifier

```bash
# Build local
docker build -t taskly-api:dev ./app

# Scan local
trivy image --severity CRITICAL taskly-api:dev

# Plan IaC
cd infra && tofu plan

# CI en local (act)
act -W .github/workflows/ci.yml

# Endpoint santé une fois déployé
curl https://taskly-api.fly.dev/health
```

## 💡 Indices

<details>
<summary>1. Plan d'attaque conseillé</summary>

1. **Dockerfile** (1-2 h) — multi-stage, scan local.
2. **CI** (3-4 h) — lint/test/build/scan, OIDC, push image.
3. **IaC Fly** (3-4 h) — provisionner app + Postgres + secret.
4. **Deploy** (1-2 h) — main → prod, PR → preview.
5. **Observabilité** (3-4 h) — Sentry + métriques + Better Stack.
6. **SLO + runbook** (2-3 h) — choisir, alerter, documenter.

</details>

<details>
<summary>2. Pièges fréquents</summary>

- **Health check Fly** : ton endpoint `/health` doit répondre 200 sans dépendre de la DB (sinon DB plantée = pod redémarre en boucle).
- **Migrations** : à l'ouverture de chaque déploiement, lancer `npm run db:migrate`. Sur Fly : `release_command` dans `fly.toml`.
- **Secrets dans le tfstate** : configure le backend OpenTofu avec un bucket S3 chiffré (ou Tigris sur Fly).
- **Cold starts** : configure `min_machines_running = 1` sur l'app prod.

</details>

<details>
<summary>3. SLO suggérés</summary>

Pour `taskly-api` :

- **SLO Disponibilité** : 99,5 % de réponses non-5xx sur `/api/*` sur 30 jours rolling.
- **SLO Latence** : 95 % des `/api/*` répondent en < 300 ms sur 7 jours.

L'error budget de 99,5 % te donne ~3,6 h/mois d'indisponibilité. Au-delà, freeze des déploiements.

</details>

## 🔑 Correction

Voir [`correction/`](./correction/) pour la version complète. Compare uniquement après avoir tenté l'exercice.

## 📚 Pour aller plus loin

- Migrer vers un cluster K8s managé (Civo, Scaleway Kapsule).
- Mettre en place Argo CD pour le GitOps.
- Game day : couper la DB pendant 5 min en staging, mesurer le RTO réel.
- SBOM + Sigstore : signer ton image et la vérifier au déploiement.
