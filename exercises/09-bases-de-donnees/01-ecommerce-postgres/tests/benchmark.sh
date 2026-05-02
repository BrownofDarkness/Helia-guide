#!/usr/bin/env bash
# Lance les 10 queries et mesure le temps. Cible : < 50 ms par query (idéal),
# < 200 ms accepté. Usage : ./benchmark.sh [canevas|correction]
#
# Détecte automatiquement si `psql` est dans le PATH ; sinon, exécute via
# `docker compose exec postgres psql ...` (nécessite que la stack Docker du
# dossier soit déjà `up`). Pratique sous Windows sans client psql installé.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-correction}"
DIR="$ROOT/$TARGET"
DB_URL="${DATABASE_URL:-postgresql://shop:shop@localhost:5432/shop}"

if [[ ! -d "$DIR/queries" ]]; then
  echo "❌ $DIR/queries n'existe pas" >&2
  exit 1
fi

# Choisit la méthode d'exécution
if command -v psql >/dev/null 2>&1; then
  RUN_PSQL() { psql "$DB_URL" "$@"; }
  echo "🔧 Cible : $TARGET (via psql local)"
else
  echo "🔧 psql introuvable — fallback docker compose exec (depuis $DIR)"
  RUN_PSQL() {
    (cd "$DIR" && docker compose exec -T postgres psql -U shop -d shop "$@")
  }
  echo "🔧 Cible : $TARGET (via docker compose exec)"
fi
echo "🔧 DB    : $DB_URL"
echo

PASSED=0
FAILED=0
TOTAL_MS=0

for q in "$DIR"/queries/*.sql; do
  name=$(basename "$q")
  # Mesure via \timing on. Extraction sed-only (compatible git-bash Windows).
  output=$(RUN_PSQL -At -c "\timing on" -f - < "$q" 2>&1)
  time_ms=$(echo "$output" | grep "Time:" | tail -1 | sed -E 's/.*Time: ([0-9]+\.[0-9]+).*/\1/')

  if [[ -z "$time_ms" ]]; then
    echo "  ✗ $name : pas de mesure"
    FAILED=$((FAILED + 1))
    continue
  fi

  time_int=$(printf "%.0f" "$time_ms")
  TOTAL_MS=$((TOTAL_MS + time_int))

  if (( time_int < 50 )); then
    echo "  ✓ $name : ${time_int} ms"
    PASSED=$((PASSED + 1))
  elif (( time_int < 200 )); then
    echo "  ⚠ $name : ${time_int} ms (au-dessus de 50 ms mais acceptable)"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ $name : ${time_int} ms (TROP LENT — index manquant ?)"
    FAILED=$((FAILED + 1))
  fi
done

echo
echo "──────────────────────────────────"
echo "Réussies : $PASSED"
echo "Échouées : $FAILED"
echo "Total    : ${TOTAL_MS} ms"
echo "──────────────────────────────────"

if (( FAILED > 0 )); then
  exit 1
fi
