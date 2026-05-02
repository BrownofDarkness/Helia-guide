# Tests — E-commerce PostgreSQL

## Lancer

```bash
chmod +x benchmark.sh

# Sur la correction (par défaut)
./benchmark.sh

# Sur ton canevas
./benchmark.sh canevas
```

## Ce qui est vérifié

Le script lance les 10 queries SQL et mesure le temps via `\timing` de psql.

- **< 50 ms** : ✓ idéal
- **50-200 ms** : ⚠ acceptable (queries analytiques complexes)
- **> 200 ms** : ✗ trop lent — index manquant

## Prérequis

- Docker Compose (Postgres) lancé : `cd ../correction && docker compose up -d`
- Schema + seed + indexes chargés

## Variables

```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname ./benchmark.sh
```
