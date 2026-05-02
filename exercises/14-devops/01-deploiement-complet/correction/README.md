# Correction — Déploiement complet (taskly-api)

> Pipeline DevOps complet pour `taskly-api` : Dockerfile multi-stage, GitHub Actions OIDC vers Fly.io, OpenTofu pour Fly + Sentry, preview par PR, observabilité Sentry + Prometheus + Better Stack, **2 SLO documentés** avec multi-burn-rate, **2 runbooks** copy-pastables, template post-mortem blameless.
>
> Lis-la **après ton implémentation**. La valeur de cet exercice est dans la **discipline** d'ops que tu acquiers — pas dans le résultat final.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Architecture du pipeline](#2-architecture-du-pipeline)
3. [Dockerfile décortiqué](#3-dockerfile-décortiqué)
4. [GitHub Actions : 4 jobs en pipeline](#4-github-actions--4-jobs-en-pipeline)
5. [SLO + multi-burn-rate alerting](#5-slo--multi-burn-rate-alerting)
6. [Runbooks et post-mortem](#6-runbooks-et-post-mortem)
7. [Validation statique](#7-validation-statique)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
# 1. Auth aux providers
flyctl auth login
gh auth login

# 2. Provisionner via OpenTofu
cd infra
cp terraform.tfvars.example terraform.tfvars   # remplis fly_org, sentry_org, etc.
tofu init && tofu apply

# 3. Pousser le code — la CI prend le relais
cd ..
git init && git add -A && git commit -m "feat: deploy taskly-api"
git remote add origin git@github.com:<you>/taskly-api.git
git push -u origin main
```

### Rollback

```bash
flyctl releases list -a taskly-api                          # lister les releases
flyctl deploy --image registry.fly.io/taskly-api:v123 -a taskly-api  # rollback
git revert <bad-sha> && git push                             # OU rollback Git → CI redéploie
```

### Restaurer la base

```bash
flyctl postgres backups list -a taskly-db
flyctl postgres backups restore <backup-id> -a taskly-db
```

Voir [`runbooks/db-saturated.md`](./runbooks/db-saturated.md) pour les actions de mitigation.

## 2. Architecture du pipeline

| Composant | Rôle | Coût mensuel |
|-----------|------|--------------|
| GitHub Actions | CI/CD (lint+test+build+deploy) | 0 € (2000 min/mois free) |
| Fly.io machines × 2 | API prod (failover régional) | ~5 €/mo (256 MB chacune) |
| Fly Postgres | DB managée + snapshots 7 j | ~5 €/mo (single node) |
| GHCR | Registry images Docker | 0 € (public) ou 0.50 €/GB |
| Sentry | Monitoring erreurs + sourcemaps | 0 € (5K events/mo) |
| Better Stack | Uptime + status page | 0 € (10 monitors) |
| OpenTofu | IaC (gratuit, OSS) | 0 € |

**Total free tier réaliste : ~10 €/mo** pour une API en prod multi-zone avec backups.

## 3. Dockerfile décortiqué

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

### 3.1 Pourquoi `tini` en `ENTRYPOINT`

Sans `tini`, ton Node process est **PID 1**. Conséquence : il ne reçoit ni `SIGTERM` proprement (Fly ne peut pas l'arrêter gracieusement) ni les signaux `SIGCHLD` (zombies en cas de fork). Tini est un init minimal (50 KB) qui fait le bon boulot.

### 3.2 Pourquoi `npm prune --omit=dev` à la fin du builder

Le builder garde tout (TypeScript, Vitest, etc.) le temps de compiler. Une fois le `dist/` produit, on supprime les devDependencies → l'image runtime hérite des `node_modules` purgés (~150 MB au lieu de ~800 MB).

### 3.3 Pourquoi `USER app` après le `COPY`

```dockerfile
RUN ... addgroup -S app && adduser -S app -G app
USER app
COPY --from=builder --chown=app:app ...
```

L'ordre **compte** : crée le user d'abord, switche, puis copie avec `--chown`. Sinon les fichiers appartiennent à root et l'app n'a pas les droits.

### 3.4 Pourquoi `--enable-source-maps`

`NODE_OPTIONS="--enable-source-maps"` = les stack traces Sentry pointent vers les fichiers TypeScript d'origine (avec lignes/colonnes), pas vers le JS minifié. **Indispensable** pour debugger en prod.

## 4. GitHub Actions : 4 jobs en pipeline

```yaml
permissions:
  contents: read
  packages: write          # push GHCR
  pull-requests: write     # commenter PR avec preview URL
  id-token: write          # OIDC (Fly, Sentry)

jobs:
  lint:                    # ~2 min
  test:                    # ~5 min : Postgres service container
  image:                   # ~5 min : build + Trivy + SBOM Anchore + push GHCR
    needs: [lint, test]
  deploy-prod:             # ~3 min : Fly avec OIDC
    needs: image
    if: github.ref == 'refs/heads/main'
```

### 4.1 OIDC vs token long-lived

```yaml
permissions:
  id-token: write    # ← clé de l'OIDC

# Dans le step deploy
- run: flyctl deploy --remote-only
  env:
    FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}    # ← idéalement OIDC, sinon token éphémère
```

OIDC permet au workflow de **prouver son identité** (repo + branch + workflow) à Fly, qui émet un token éphémère. Le `FLY_API_TOKEN` n'est plus un secret figé qui peut fuiter — c'est un échange JWT par run.

C'est aussi ce que font AWS / GCP / Azure / Cloudflare. **Pattern à généraliser**.

### 4.2 Trivy avec `exit-code: 1` sur CRITICAL

```yaml
- name: Trivy scan
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: ${{ env.IMAGE }}:${{ steps.meta.outputs.tag }}
    severity: CRITICAL
    exit-code: '1'              # ← bloque la PR si CRITICAL
    ignore-unfixed: true        # ← ignore les CVE sans patch dispo
```

**Rationale** : `ignore-unfixed: true` empêche de bloquer sur des vulns inéluctables (lib OS pas encore patchée). On bloque seulement sur les CRITICAL **patchables** — ça pousse à mettre à jour les bases (`node:24-alpine` régulièrement).

### 4.3 SBOM Anchore

```yaml
- name: Upload SBOM
  uses: anchore/sbom-action@v0
  with:
    image: ${{ env.IMAGE }}:${{ steps.meta.outputs.tag }}
    format: spdx-json
```

Le **Software Bill of Materials** liste toutes les libs dans l'image (versions exactes). Quand une CVE sort sur `lodash@4.17.20`, tu sais en 5 minutes si tu es exposé. Devenu obligatoire pour les contrats US gov (Executive Order 14028) et bonne pratique partout.

### 4.4 Notifier Sentry de la release

```yaml
- name: Notify Sentry of release
  uses: getsentry/action-release@v1
  with:
    environment: production
    version: ${{ needs.image.outputs.image-tag }}
    sourcemaps: ./dist
```

Sentry associe les erreurs à la release courante. Tu vois en 1 clic « cette erreur est apparue à partir de la release X » → identifie le commit fautif.

## 5. SLO + multi-burn-rate alerting

Voir [`SLO.md`](./SLO.md) pour le détail. Résumé :

| SLO | SLI | Objectif | Fenêtre | Error budget |
|-----|-----|----------|---------|---------------|
| Disponibilité | (req non-5xx) / (req totales) sur /api/* | 99.5 % | 30 j rolling | ~216 min/mois |
| Latence | p95 du temps de réponse /api/* | < 300 ms | 7 j rolling | 5 % du temps en violation |

### Multi-burn-rate alerting

| Fenêtre | Burn rate | Action | Pourquoi |
|---------|-----------|--------|----------|
| 5 min | 14× | **Page on-call** | Brûle le budget mensuel en ~2 h → urgence |
| 1 h | 6× | **Page on-call** | Brûle le budget en ~5 h → urgence |
| 6 h | 3× | Notif Slack | Tendance critique mais pas urgence |
| 3 j | 1× | Ticket dette tech | Le budget se consomme progressivement |

Sans multi-burn-rate, tu choisis entre :
- **Alerte trop sensible** (1 % d'erreurs sur 5 min) → on-call réveillé pour rien plusieurs fois par mois.
- **Alerte trop lente** (consommation > 50 % du budget mensuel) → tu apprends l'incident 2 jours après.

Le pattern résout les deux : alerte aigu **et** subaigu.

### Quand on dépasse l'error budget

> Tous les déploiements feature sont **gelés**. Seuls les fixes orientés stabilité passent. On organise un **incident review** avec l'équipe pour identifier les correctifs structurels.

C'est la version SRE Google de la discipline : **les feature freezes sont un outil**, pas une punition. Ils protègent les utilisateurs et obligent l'équipe à investir en stabilité quand le budget chute.

## 6. Runbooks et post-mortem

### Format runbook (3 pages max)

[`runbooks/api-down.md`](./runbooks/api-down.md) couvre :

```markdown
# api-down

## 🔔 Détection
- Qui a alerté (Better Stack / Sentry / user) ?
- Depuis combien de temps ?

## 🔍 Diagnostic (10 commandes copy-pastables)
1. flyctl status -a taskly-api
2. flyctl logs -a taskly-api --recent
3. flyctl checks list -a taskly-api
4. curl -I https://taskly-api.fly.dev/health
5. flyctl postgres status -a taskly-db
6. ...

## 🩹 Mitigation (3 actions dans l'ordre)
1. Restart machines : `flyctl machine restart -a taskly-api`
2. Scale down → up : `flyctl scale count 0 && flyctl scale count 2`
3. Rollback à la release précédente : `flyctl deploy --image <prev-sha>`

## 📢 Communication
- Slack #incidents : template
- Status page Better Stack : URL
- ETA aux utilisateurs : règle (toutes les 30 min)

## 📋 Post-incident
Voir POST_MORTEM_TEMPLATE.md → ouvrir un doc < 24 h après résolution.
```

**Discipline** : pas de prose narrative, **commandes copy-pastables**, ordre déterministe.

### Post-mortem **blameless**

[`runbooks/POST_MORTEM_TEMPLATE.md`](./runbooks/POST_MORTEM_TEMPLATE.md) sépare :

1. **Résumé exécutif** (3 lignes)
2. **Timeline** factuelle (TZ explicite)
3. **Root cause** technique
4. **Contributing factors** (process, monitoring, code, humain)
5. **Action items** datés et assignés (Severity 0–3)
6. **What went well** (souvent oublié — important pour le moral)
7. **What we got lucky on** (anti-pattern à corriger)

**Blameless** = on ne pointe pas la personne, on pointe les **systèmes** qui ont permis l'erreur. Si l'erreur vient d'une commande dangereuse mal documentée, le fix n'est pas « former la personne », c'est « réduire la dangerosité de la commande ».

## 7. Validation statique

```bash
# Dockerfile (1 warning DL3018 mineur — pin Alpine versions, trade-off accepté)
docker run --rm -i hadolint/hadolint < Dockerfile

# Terraform formatting (0 issue après le fix de cette correction)
docker run --rm -v "$PWD/infra:/data" -w /data hashicorp/terraform:1.9 fmt -check -diff
# exit 0

# YAML syntax (workflow GitHub Actions)
node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/ci.yml','utf-8'))"
```

Le linting reste partiel sur ce type d'exercice — la **vraie** validation, c'est le run en prod. Les 3 outils ci-dessus repèrent ~30 % des erreurs ; le reste vient du `tofu plan` et du premier `flyctl deploy`.

Outils plus avancés (à câbler en CI) :
- [`actionlint`](https://github.com/rhysd/actionlint) sur GitHub Actions
- [`tflint`](https://github.com/terraform-linters/tflint) sur Terraform/OpenTofu
- [`kubelint`](https://github.com/yannh/kubeconform) si tu passes à K8s

## 8. Pour aller plus loin

- **Argo Rollouts ou canary deploy** : ramp 10 % → 50 % → 100 % automatique avec rollback si SLO baisse. Disponible sur K8s (Argo) ou Fly via `flyctl deploy --strategy canary`.

- **Multi-région Fly** : `flyctl scale count 2 --region cdg,lhr` puis read replica Postgres en LHR. Latence < 50 ms pour utilisateurs UK / FR.

- **GitOps avec Argo CD** : ton repo manifests devient la source de vérité, Argo applique les changements. Combiné à Argo Rollouts → déploiements canary GitOps.

- **SBOM signé avec Sigstore** : signe ton image au push, vérifie au pull. Empêche un attaquant qui a compromis ton registry de pousser une image trafiquée.

- **Cluster K8s managé** : Civo ($5/mo), Scaleway Kapsule ($0/mo control-plane), GKE Autopilot — quand tu dépasses 3-4 services et que Fly devient limitant.

- **Game days** : couper la DB pendant 5 min en staging, mesurer le RTO réel. Faire ça **trimestriellement** révèle les divergences entre runbook théorique et réalité.

- **OpenTelemetry** : tracing distribué standard. Remplace Prometheus + Sentry par un seul stack (Grafana Tempo + Loki + Mimir). Plus complexe à mettre en place, plus puissant pour debugger des architectures > 3 services.

- **Déploiement par environnement avec Terraform workspaces** : `tofu workspace new staging` puis `tofu apply -var-file=staging.tfvars`. Sépare prod / staging / dev sans dupliquer le code.
