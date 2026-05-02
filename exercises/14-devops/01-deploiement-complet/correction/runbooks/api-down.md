# Runbook — API taskly-api down

## Symptômes
- Better Stack uptime → DOWN
- Pages 5xx sur `/api/*`
- Slack `#oncall` ping critique « taskly-api availability SLO breach »

## Diagnostic rapide (≤ 5 min)

1. **Status pages tiers** :
   - https://status.flyio.net
   - https://status.sentry.io
2. **Healthcheck** :
   ```bash
   curl -i https://taskly-api.fly.dev/health
   flyctl status -a taskly-api
   ```
3. **Logs récents** :
   ```bash
   flyctl logs -a taskly-api --since 10m
   ```
4. **Dashboard Grafana** : https://grafana.example/d/taskly-api

## Causes connues

| Cause | Confirmation | Mitigation |
|-------|--------------|------------|
| Fly région KO | status.flyio.net | Bascule vers région secondaire `flyctl scale count 0 --region cdg && flyctl scale count 2 --region lhr` |
| OOMKilled | `flyctl logs` montre `out of memory` | Augmenter mémoire `flyctl scale memory 1024` |
| DB injoignable | logs « ECONNREFUSED 5432 » | Voir [db-saturated.md](./db-saturated.md) |
| Crash applicatif post-deploy | logs montrent stack trace | Rollback : `flyctl releases list -a taskly-api` puis `flyctl deploy --image registry.fly.io/taskly-api:vN-1` |
| Migration bloquante | release_command timeout | Killer la machine bloquée : `flyctl machine stop <id>`, retirer la migration, redéployer |

## Mitigation rapide

```bash
# Redémarrer toutes les machines
flyctl machine restart -a taskly-api

# Scale-up urgence (passer à 4 machines)
flyctl scale count 4 -a taskly-api

# Rollback dernière release
flyctl releases list -a taskly-api
flyctl deploy --image registry.fly.io/taskly-api:<sha-prev> -a taskly-api
```

## Communication

1. Tweet/Slack #status : « Investigating elevated error rates on taskly-api »
2. Mettre à jour la statuspage Better Stack
3. Si > 30 min : ping CTO + déclarer SEV2 dans #incidents

## Escalation

- Pas de cause identifiée en 15 min → ping `@on-call-backup`
- Incident > 30 min → ouvrir un canal Slack dédié `#incident-YYYYMMDD`
- Incident > 2 h → déclarer SEV1, ping CEO

## Liens utiles

- Grafana : https://grafana.example/d/taskly-api
- Sentry : https://sentry.io/organizations/myorg/issues/?project=taskly-api&environment=production
- Better Stack : https://uptime.betterstack.com/team/...
- Repo : https://github.com/myorg/taskly-api

## Owner

@alice (PT) · @bob (US/CA)
