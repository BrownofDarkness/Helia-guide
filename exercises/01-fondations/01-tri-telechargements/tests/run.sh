#!/usr/bin/env bash
#
# Suite de tests pour l'exercice tri-telechargements.
# Lance le script (canevas/ ou correction/) sur des fixtures et vérifie le résultat.
#
# Usage :
#   ./run.sh                  # teste canevas/tri.sh
#   ./run.sh correction       # teste correction/tri.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CIBLE="${1:-canevas}"
SCRIPT="$ROOT/$CIBLE/tri.sh"

if [[ ! -x "$SCRIPT" ]]; then
  chmod +x "$SCRIPT" 2>/dev/null || {
    echo "Le script $SCRIPT n'existe pas ou n'est pas exécutable." >&2
    exit 1
  }
fi

PASSED=0
FAILED=0
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

assert_equal() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    echo "  ✓ $label"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ $label : attendu '$expected', obtenu '$actual'"
    FAILED=$((FAILED + 1))
  fi
}

setup() {
  rm -rf "$TMP"/*
  mkdir -p "$TMP"
}

# ──────────────────────────────────────────────────────────────────────────────
# Test 1 : tri basique
# ──────────────────────────────────────────────────────────────────────────────

echo
echo "Test 1 — Tri basique des extensions courantes"
setup
touch "$TMP/photo.jpg" "$TMP/doc.pdf" "$TMP/film.mp4" "$TMP/code.js" "$TMP/archive.zip"
"$SCRIPT" "$TMP" >/dev/null

[[ -f "$TMP/Images/photo.jpg" ]]    && echo "  ✓ photo.jpg → Images/"        && PASSED=$((PASSED + 1)) || { echo "  ✗ photo.jpg manquant"; FAILED=$((FAILED + 1)); }
[[ -f "$TMP/Documents/doc.pdf" ]]   && echo "  ✓ doc.pdf → Documents/"       && PASSED=$((PASSED + 1)) || { echo "  ✗ doc.pdf manquant"; FAILED=$((FAILED + 1)); }
[[ -f "$TMP/Vidéos/film.mp4" ]]     && echo "  ✓ film.mp4 → Vidéos/"         && PASSED=$((PASSED + 1)) || { echo "  ✗ film.mp4 manquant"; FAILED=$((FAILED + 1)); }
[[ -f "$TMP/Code/code.js" ]]        && echo "  ✓ code.js → Code/"            && PASSED=$((PASSED + 1)) || { echo "  ✗ code.js manquant"; FAILED=$((FAILED + 1)); }
[[ -f "$TMP/Archives/archive.zip" ]] && echo "  ✓ archive.zip → Archives/"   && PASSED=$((PASSED + 1)) || { echo "  ✗ archive.zip manquant"; FAILED=$((FAILED + 1)); }

# ──────────────────────────────────────────────────────────────────────────────
# Test 2 : insensibilité à la casse de l'extension
# ──────────────────────────────────────────────────────────────────────────────

echo
echo "Test 2 — Casse de l'extension (.JPG, .Pdf, .MP4)"
setup
touch "$TMP/photo.JPG" "$TMP/rapport.Pdf" "$TMP/clip.MP4"
"$SCRIPT" "$TMP" >/dev/null

[[ -f "$TMP/Images/photo.JPG" ]]    && echo "  ✓ .JPG traité comme .jpg"   && PASSED=$((PASSED + 1)) || { echo "  ✗ .JPG mal classé"; FAILED=$((FAILED + 1)); }
[[ -f "$TMP/Documents/rapport.Pdf" ]] && echo "  ✓ .Pdf traité comme .pdf" && PASSED=$((PASSED + 1)) || { echo "  ✗ .Pdf mal classé"; FAILED=$((FAILED + 1)); }
[[ -f "$TMP/Vidéos/clip.MP4" ]]     && echo "  ✓ .MP4 traité comme .mp4"   && PASSED=$((PASSED + 1)) || { echo "  ✗ .MP4 mal classé"; FAILED=$((FAILED + 1)); }

# ──────────────────────────────────────────────────────────────────────────────
# Test 3 : pas d'écrasement
# ──────────────────────────────────────────────────────────────────────────────

echo
echo "Test 3 — Pas d'écrasement de fichier existant"
setup
mkdir -p "$TMP/Images"
echo "ancien" > "$TMP/Images/photo.jpg"
echo "nouveau" > "$TMP/photo.jpg"
"$SCRIPT" "$TMP" >/dev/null

# L'ancien doit être préservé
ancien=$(cat "$TMP/Images/photo.jpg")
assert_equal "ancien fichier préservé" "ancien" "$ancien"

# Le nouveau doit avoir été renommé (photo-1.jpg)
if [[ -f "$TMP/Images/photo-1.jpg" ]]; then
  nouveau=$(cat "$TMP/Images/photo-1.jpg")
  assert_equal "nouveau fichier renommé" "nouveau" "$nouveau"
else
  echo "  ✗ photo-1.jpg attendu mais absent"
  FAILED=$((FAILED + 1))
fi

# ──────────────────────────────────────────────────────────────────────────────
# Test 4 : fichier sans extension → Autres
# ──────────────────────────────────────────────────────────────────────────────

echo
echo "Test 4 — Fichier sans extension"
setup
touch "$TMP/README"
"$SCRIPT" "$TMP" >/dev/null
[[ -f "$TMP/Autres/README" ]] && echo "  ✓ Sans extension → Autres/" && PASSED=$((PASSED + 1)) || { echo "  ✗ README mal classé"; FAILED=$((FAILED + 1)); }

# ──────────────────────────────────────────────────────────────────────────────
# Test 5 : idempotence (relance sans erreur)
# ──────────────────────────────────────────────────────────────────────────────

echo
echo "Test 5 — Idempotence : 2ᵉ run ne casse rien"
setup
touch "$TMP/a.jpg" "$TMP/b.pdf"
"$SCRIPT" "$TMP" >/dev/null
"$SCRIPT" "$TMP" >/dev/null  # 2ᵉ run

[[ -f "$TMP/Images/a.jpg" ]] && [[ -f "$TMP/Documents/b.pdf" ]] \
  && echo "  ✓ 2ᵉ run inoffensif" && PASSED=$((PASSED + 1)) \
  || { echo "  ✗ 2ᵉ run a perturbé l'état"; FAILED=$((FAILED + 1)); }

# ──────────────────────────────────────────────────────────────────────────────
# Bilan
# ──────────────────────────────────────────────────────────────────────────────

echo
echo "──────────────────────────────────"
echo "Tests réussis : $PASSED"
echo "Tests échoués : $FAILED"
echo "──────────────────────────────────"

if (( FAILED > 0 )); then
  exit 1
fi
