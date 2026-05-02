# SLO — taskly-api

## Périmètre

API HTTP `taskly-api` — endpoints `/api/*`. Le `/health` est exclu (interne K8s/Fly).

## SLO #1 — Disponibilité

| Champ | Valeur |
|-------|--------|
| **SLI** | `(requêtes non-5xx) / (requêtes totales)` sur `/api/*` |
| **Objectif** | 99,5 % |
| **Fenêtre** | 30 jours rolling |
| **Error budget** | 0,5 % × 30 j × 24 h × 60 min ≈ **216 min/mois** |
| **SLA contractuel** | 99,0 % (confortable, marge interne 0,5 %) |

### Métriques sources

- Prometheus : `http_requests_total{status_class!="5xx"} / http_requests_total`
- Better Stack : healthcheck externe `/health` toutes les 30 s

### Alertes (multi-burn-rate)

| Fenêtre | Burn rate | Action |
|---------|-----------|--------|
| 5 min | 14× | **Page critique** — on-call réveillé |
| 1 h | 6× | **Page critique** |
| 6 h | 3× | Notif Slack #oncall |
| 3 j | 1× | Ticket dette technique |

### Quand on dépasse l'error budget

> Tous les déploiements feature sont **gelés**. Seuls les fixes orientés
> stabilité passent. On organise un **incident review** avec l'équipe pour
> identifier les correctifs structurels.

## SLO #2 — Latence

| Champ | Valeur |
|-------|--------|
| **SLI** | `P95(durée requête HTTP)` sur `/api/*` |
| **Objectif** | < 300 ms |
| **Fenêtre** | 7 jours rolling |
| **Cible interne** | p99 < 800 ms (warning, pas page) |

### Métriques sources

- Prometheus histogram `http_request_duration_seconds` quantile 0.95
- Mesure côté client (web-vitals INP) en complément

### Alertes

| Condition | Action |
|-----------|--------|
| P95 > 500 ms pendant 10 min | Page critique |
| P95 > 300 ms pendant 60 min | Notif Slack #performance |
| P99 > 1500 ms pendant 30 min | Notif Slack #performance |

### Mitigation typique (voir `runbooks/`)

1. Vérifier la latence Postgres (`pg_stat_activity`).
2. Vérifier les long tasks Node via Sentry Performance.
3. Scale-up horizontale Fly si CPU > 80 %.
4. Activer le cache Redis sur les endpoints de catalogue.

## Revue trimestrielle

Tous les 3 mois, l'équipe revoit ces SLO :

- Targets toujours pertinentes ?
- Trop strictes (jamais respectées) ? Trop laxes (toujours respectées) ?
- Faut-il ajouter / retirer des SLO ?
- Combien de fois on a brûlé l'error budget ce trimestre ? Pourquoi ?

Output : un mini doc « SLO review Qx YYYY » avec ajustements proposés.

## Owner

- **DRI** SLO disponibilité : @cto
- **DRI** SLO latence : @lead-perf
