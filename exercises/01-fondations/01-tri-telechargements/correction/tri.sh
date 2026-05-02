#!/usr/bin/env bash
#
# Tri automatique des téléchargements — solution complète et commentée.
#
# Usage :
#   ./tri.sh <dossier-a-ranger>
#   ./tri.sh --dry-run <dossier>      (n'effectue rien, affiche les actions)
#   ./tri.sh --verbose <dossier>      (affiche chaque déplacement)

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Parsing des options
# ──────────────────────────────────────────────────────────────────────────────

DRY_RUN=0
VERBOSE=0
ARGS=()

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --verbose) VERBOSE=1 ;;
    -h|--help)
      cat <<EOF
Usage : $0 [--dry-run] [--verbose] <dossier-a-ranger>

Range les fichiers du dossier dans des sous-dossiers selon leur extension.

Options :
  --dry-run     Affiche ce qui serait fait, sans rien déplacer
  --verbose     Affiche chaque déplacement
  -h, --help    Affiche cette aide
EOF
      exit 0 ;;
    *) ARGS+=("$arg") ;;
  esac
done

if [[ ${#ARGS[@]} -ne 1 ]]; then
  echo "Usage : $0 [--dry-run] [--verbose] <dossier-a-ranger>" >&2
  exit 1
fi

CIBLE="${ARGS[0]}"

if [[ ! -d "$CIBLE" ]]; then
  echo "Erreur : '$CIBLE' n'est pas un dossier." >&2
  exit 1
fi

# ──────────────────────────────────────────────────────────────────────────────
# Compteurs
# ──────────────────────────────────────────────────────────────────────────────

declare -A COMPTEURS=(
  [Images]=0 [Documents]=0 [Vidéos]=0 [Audio]=0
  [Code]=0 [Archives]=0 [Autres]=0
)

# ──────────────────────────────────────────────────────────────────────────────
# Fonctions
# ──────────────────────────────────────────────────────────────────────────────

# categorie <extension>  →  nom du dossier cible
# Exemple : categorie "JPG"  →  "Images"
categorie() {
  local ext="${1,,}"  # passage en minuscule (Bash 4+)
  case "$ext" in
    jpg|jpeg|png|gif|webp|svg|bmp)              echo "Images" ;;
    pdf|doc|docx|xls|xlsx|ppt|pptx|odt|txt|md)  echo "Documents" ;;
    mp4|mkv|avi|mov|webm)                        echo "Vidéos" ;;
    mp3|wav|flac|ogg|m4a)                        echo "Audio" ;;
    js|ts|py|php|html|css|json|sh|java|c|cpp)    echo "Code" ;;
    zip|tar|gz|rar|7z)                            echo "Archives" ;;
    *)                                            echo "Autres" ;;
  esac
}

# dest_unique <chemin>  →  chemin garantissant de ne pas écraser
# Si "dossier/fichier.jpg" existe, retourne "dossier/fichier-1.jpg", etc.
dest_unique() {
  local dest="$1"
  if [[ ! -e "$dest" ]]; then
    echo "$dest"
    return
  fi

  local dir base ext
  dir=$(dirname "$dest")
  local nom=$(basename "$dest")

  # Extraire base et extension proprement
  if [[ "$nom" == *.* ]]; then
    base="${nom%.*}"
    ext=".${nom##*.}"
  else
    base="$nom"
    ext=""
  fi

  local n=1
  local candidat="${dir}/${base}-${n}${ext}"
  while [[ -e "$candidat" ]]; do
    ((n++))
    candidat="${dir}/${base}-${n}${ext}"
  done
  echo "$candidat"
}

# log <message>  →  affiche si VERBOSE ou DRY_RUN actif
log() {
  if (( VERBOSE == 1 || DRY_RUN == 1 )); then
    echo "$@"
  fi
}

# ──────────────────────────────────────────────────────────────────────────────
# Boucle principale
# ──────────────────────────────────────────────────────────────────────────────

while IFS= read -r -d '' fichier; do
  nom=$(basename "$fichier")

  # Extraire l'extension (vide si pas de point)
  if [[ "$nom" == *.* ]]; then
    ext="${nom##*.}"
  else
    ext=""
  fi

  cat=$(categorie "$ext")
  dest_dir="$CIBLE/$cat"
  dest="$dest_dir/$nom"

  # Création du sous-dossier si nécessaire
  if (( DRY_RUN == 0 )); then
    mkdir -p "$dest_dir"
  fi

  # Garantir qu'on n'écrase rien
  dest_final=$(dest_unique "$dest")

  # Effectuer (ou simuler) le déplacement
  if (( DRY_RUN == 1 )); then
    log "[dry-run] $fichier → $dest_final"
  else
    log "$fichier → $dest_final"
    mv -n "$fichier" "$dest_final"
  fi

  COMPTEURS[$cat]=$((COMPTEURS[$cat] + 1))

done < <(find "$CIBLE" -maxdepth 1 -type f -print0)

# ──────────────────────────────────────────────────────────────────────────────
# Résumé
# ──────────────────────────────────────────────────────────────────────────────

echo
if (( DRY_RUN == 1 )); then
  echo "Résumé (mode dry-run) :"
else
  echo "Résumé :"
fi

total=0
for cat in Images Documents Vidéos Audio Code Archives Autres; do
  n=${COMPTEURS[$cat]}
  if (( n > 0 )); then
    printf "  %-12s %d\n" "$cat" "$n"
    total=$((total + n))
  fi
done
echo "  ──────────"
printf "  %-12s %d\n" "Total" "$total"
