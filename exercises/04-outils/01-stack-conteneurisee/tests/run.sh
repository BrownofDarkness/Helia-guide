#!/usr/bin/env bash
# Tests de validation de la stack conteneurisée.
# Usage : ./run.sh [canevas|correction]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-correction}"
DIR="$ROOT/$TARGET"

if [[ ! -d "$DIR" ]]; then
  echo "❌ $DIR n'existe pas" >&2
  exit 1
fi

PASSED=0
FAILED=0
PROJECT="stacktest-$TARGET"

cleanup() {
  echo
  echo "🧹 Nettoyage…"
  cd "$DIR"
  # --rmi local : supprime les images **construites par ce projet** (api/web).
  # On ne touche pas postgres/redis (images publiques pull-only) — `local` les
  # ignore parce qu'elles n'ont pas été buildées par compose.
  docker compose -p "$PROJECT" down -v --rmi local 2>/dev/null || true
}
trap cleanup EXIT

cd "$DIR"

echo "🔨 Build et démarrage…"
docker compose -p "$PROJECT" up -d --build --wait

# ─────────────────────────────────────────────────────────────────────
# Test 1 : tous les services UP
# ─────────────────────────────────────────────────────────────────────
echo
echo "Test 1 — Services up"
SERVICES=$(docker compose -p "$PROJECT" ps --services --filter status=running)
for svc in db redis api web; do
  if echo "$SERVICES" | grep -q "^$svc$"; then
    echo "  ✓ $svc UP"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ $svc absent"
    FAILED=$((FAILED + 1))
  fi
done

# ─────────────────────────────────────────────────────────────────────
# Test 2 : API /health renvoie ok
# ─────────────────────────────────────────────────────────────────────
echo
echo "Test 2 — API /health"
sleep 3
RESP=$(curl -s -o /tmp/health.json -w "%{http_code}" http://localhost:3000/health || echo "000")
if [[ "$RESP" == "200" ]]; then
  if grep -q '"db":"ok"' /tmp/health.json; then
    echo "  ✓ /health renvoie 200 + db ok"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ /health 200 mais DB pas ok"
    cat /tmp/health.json
    FAILED=$((FAILED + 1))
  fi
else
  echo "  ✗ /health code $RESP"
  FAILED=$((FAILED + 1))
fi

# ─────────────────────────────────────────────────────────────────────
# Test 3 : Front répond
# ─────────────────────────────────────────────────────────────────────
echo
echo "Test 3 — Front sur 5173"
RESP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ || echo "000")
if [[ "$RESP" == "200" ]]; then
  echo "  ✓ http://localhost:5173 répond 200"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ Front code $RESP"
  FAILED=$((FAILED + 1))
fi

# ─────────────────────────────────────────────────────────────────────
# Test 4 : POST + GET items
# ─────────────────────────────────────────────────────────────────────
echo
echo "Test 4 — Insert + lecture d'un item"
NEW=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"item-test"}' http://localhost:3000/items)
if echo "$NEW" | grep -q '"name":"item-test"'; then
  echo "  ✓ POST /items crée un item"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ POST /items a échoué"
  echo "  Response : $NEW"
  FAILED=$((FAILED + 1))
fi

LIST=$(curl -s http://localhost:3000/items)
if echo "$LIST" | grep -q "item-test"; then
  echo "  ✓ GET /items contient item-test"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ GET /items ne contient pas l'item"
  FAILED=$((FAILED + 1))
fi

# ─────────────────────────────────────────────────────────────────────
# Test 5 : Persistance après down/up
# ─────────────────────────────────────────────────────────────────────
echo
echo "Test 5 — Persistance après down/up"
docker compose -p "$PROJECT" down 2>&1 | tail -3
docker compose -p "$PROJECT" up -d --wait 2>&1 | tail -3
sleep 3

LIST_AFTER=$(curl -s http://localhost:3000/items || echo "")
if echo "$LIST_AFTER" | grep -q "item-test"; then
  echo "  ✓ item-test toujours présent après redémarrage"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ item-test perdu — volume non persistant ?"
  FAILED=$((FAILED + 1))
fi

# ─────────────────────────────────────────────────────────────────────
# Bilan
# ─────────────────────────────────────────────────────────────────────
echo
echo "──────────────────────────────────"
echo "Tests réussis : $PASSED"
echo "Tests échoués : $FAILED"
echo "──────────────────────────────────"

if (( FAILED > 0 )); then
  exit 1
fi
