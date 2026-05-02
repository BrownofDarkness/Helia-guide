# Runbook — Postgres saturée

## Symptômes
- Latence p95 sur `/api/*` > 1 s soutenu
- Logs Sentry « ECONNREFUSED 5432 » ou « connection terminated unexpectedly »
- Alerte Grafana « pg_stat_activity > 80 % de max_connections »

## Diagnostic (≤ 10 min)

```bash
# Connect Postgres
flyctl postgres connect -a taskly-db

# Connexions actives
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

# Top requêtes longues
SELECT pid, age(clock_timestamp(), query_start) AS dur, query
FROM pg_stat_activity
WHERE state = 'active' AND query_start IS NOT NULL
ORDER BY dur DESC
LIMIT 10;

# Locks actifs
SELECT * FROM pg_locks WHERE NOT granted;

# Taille DB
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## Causes connues

| Cause | Confirmation | Mitigation |
|-------|--------------|------------|
| Connection storm (cold start massif) | beaucoup de connexions `idle in transaction` | Activer pool : PgBouncer ou Fly's built-in pooler |
| Requête lente bloquante | Query > 60 s en `pg_stat_activity` | `SELECT pg_terminate_backend(<pid>);` |
| Long transaction = autovacuum bloqué | `dead_tuples` qui grimpe | Killer la transaction, lancer VACUUM |
| Disque plein | `pg_database_size` proche du quota | Scaler `flyctl postgres update --volume-size 20` |
| max_connections atteint | « too many connections for role » | Pooler obligatoire, ou augmenter max_connections |
| Index manquant après migration | EXPLAIN sur la requête lente | Créer l'index `CONCURRENTLY` |

## Actions immédiates

```bash
# Tuer une requête bloquante
SELECT pg_cancel_backend(<pid>);
SELECT pg_terminate_backend(<pid>);

# Restart connection pool côté app (sans downtime appli)
flyctl machine restart -a taskly-api

# Scale-up Postgres VM
flyctl scale memory 2048 -a taskly-db

# Augmenter le volume
flyctl postgres update --volume-size 20 -a taskly-db
```

## Restaurer depuis backup (cas extrême)

```bash
flyctl postgres backups list -a taskly-db
flyctl postgres backups restore <backup-id> -a taskly-db
# RTO observé : ~10-15 min selon volumétrie
```

⚠️ La restauration **écrase la DB**. Confirmer avec @cto avant.

## Escalation

- Pas mitigé en 15 min → ping `@dba-backup`
- Restauration nécessaire → ping CTO obligatoire
- Backup non disponible → SEV1, ping CEO

## Owner

@alice (DBA principal) · @bob (backup)
