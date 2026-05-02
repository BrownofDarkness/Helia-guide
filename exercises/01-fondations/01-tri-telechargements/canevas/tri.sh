#!/usr/bin/env bash
#
# Tri automatique des téléchargements — canevas
# À compléter aux endroits marqués TODO.
#
# Usage : ./tri.sh <dossier-a-ranger>

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Vérification des arguments
# ──────────────────────────────────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
  echo "Usage : $0 <dossier-a-ranger>" >&2
  exit 1
fi

CIBLE="$1"

if [[ ! -d "$CIBLE" ]]; then
  echo "Erreur : '$CIBLE' n'est pas un dossier." >&2
  exit 1
fi

# ──────────────────────────────────────────────────────────────────────────────
# Compteurs (associative array — Bash 4+)
# ──────────────────────────────────────────────────────────────────────────────

declare -A COMPTEURS=(
  [Images]=0 [Documents]=0 [Vidéos]=0 [Audio]=0
  [Code]=0 [Archives]=0 [Autres]=0
)

# ──────────────────────────────────────────────────────────────────────────────
# TODO 1 : compléter la fonction categorie()
# Elle prend une extension (sans le point) et renvoie le nom du dossier cible.
# ──────────────────────────────────────────────────────────────────────────────

categorie() {
  local ext="${1,,}"  # passage en minuscule
  # TODO : implémenter le case ... esac avec toutes les catégories
  echo "Autres"
}

# ──────────────────────────────────────────────────────────────────────────────
# TODO 2 : compléter dest_unique()
# Si "dest" existe déjà, retourner un nom du type "fichier-1.ext", "fichier-2.ext"...
# ──────────────────────────────────────────────────────────────────────────────

dest_unique() {
  local dest="$1"
  # TODO : si "$dest" existe, générer un nom alternatif
  echo "$dest"
}

# ──────────────────────────────────────────────────────────────────────────────
# Boucle principale : parcourir les fichiers du dossier cible
# ──────────────────────────────────────────────────────────────────────────────

while IFS= read -r -d '' fichier; do
  nom=$(basename "$fichier")

  # TODO 3 : extraire l'extension du fichier
  # Indice : ${nom##*.} donne tout après le dernier point
  # Attention au cas où le fichier n'a pas d'extension !
  ext=""

  # TODO 4 : déterminer la catégorie via categorie()
  cat="Autres"

  # TODO 5 : créer le sous-dossier s'il n'existe pas, puis déplacer
  # Indice : mkdir -p, dest_unique(), mv -n

  # Incrémenter le compteur
  COMPTEURS[$cat]=$((COMPTEURS[$cat] + 1))

done < <(find "$CIBLE" -maxdepth 1 -type f -print0)

# ──────────────────────────────────────────────────────────────────────────────
# Résumé
# ──────────────────────────────────────────────────────────────────────────────

echo
echo "Résumé :"
total=0
for cat in "${!COMPTEURS[@]}"; do
  n=${COMPTEURS[$cat]}
  if (( n > 0 )); then
    printf "  %-12s %d\n" "$cat" "$n"
    total=$((total + n))
  fi
done
echo "  ──────────"
printf "  %-12s %d\n" "Total" "$total"
