# Tests — Stack conteneurisée

## Lancement

```bash
chmod +x run.sh
./run.sh                 # par défaut teste correction/
./run.sh canevas          # ou teste ton canevas
```

## Ce qui est vérifié

1. Les 4 services (db, redis, api, web) sont UP
2. L'API `/health` répond 200 avec `db: ok` (l'API attend bien que la DB soit prête)
3. Le front est joignable sur :5173
4. POST + GET d'un item fonctionne
5. **Persistance** : après `docker compose down && up`, les données sont toujours là

## Prérequis

- Docker Desktop ou Docker Engine installé
- Ports 3000, 5173, 5432, 6379 libres
- `curl` disponible

## Note Windows

Sous Git Bash sur Windows, certains paths peuvent être convertis en POSIX par Git. Si tu as des problèmes, lance via WSL2 :

```bash
wsl
cd /mnt/c/.../tests/
./run.sh
```
