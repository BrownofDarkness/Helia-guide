# Exercice 1.1 — Tri automatique des téléchargements

> **Axe** : 1 — Fondations informatiques
> **Difficulté** : facile
> **Durée estimée** : 30 à 60 minutes
> **Prérequis** : avoir lu [1.2 — Ligne de commande](http://localhost:4321/01-fondations/02-ligne-de-commande/), un shell **Bash** disponible (voir ci-dessous)

## ⚙️ Avant de commencer — disposer d'un shell Bash

Le script à écrire est en Bash. Selon ton OS :

| OS | Comment avoir Bash |
|----|--------------------|
| **Linux** | Déjà installé. Ouvre un terminal. |
| **macOS** | Déjà installé (`bash` est dispo, mais `zsh` est le défaut depuis Catalina ; le script Bash marche dans `zsh` aussi). Ouvre Terminal.app. |
| **Windows** | Installer **WSL2 (Ubuntu)** — voir [axe 1.1 — WSL2](http://localhost:4321/01-fondations/01-materiel-os/#wsl2--la-solution-sous-windows). Alternative : **Git Bash** (livré avec [Git for Windows](https://gitforwindows.org/)). |

**Vérifie** :

```bash
bash --version
# GNU bash, version 5.x.x
```

Si la version est < 4 (par exemple sur macOS qui livre encore Bash 3.2), certaines syntaxes du script (`${var,,}`, `declare -A`) ne marcheront pas. Solutions : `brew install bash` sur macOS, ou utiliser WSL/Linux.

## 🎯 Objectifs pédagogiques

- Pratiquer les commandes de manipulation de fichiers (`mkdir`, `mv`, `find`)
- Écrire un script Bash avec conditions, boucles, fonctions
- Utiliser `set -euo pipefail` et gérer les cas limites
- Tester son script de façon reproductible

## 📋 Énoncé

Ton dossier `Downloads/` est un capharnaüm. Tu veux écrire un script qui le range automatiquement en classant chaque fichier dans un sous-dossier selon son extension :

| Sous-dossier | Extensions |
|--------------|-----------|
| `Images/` | jpg, jpeg, png, gif, webp, svg, bmp |
| `Documents/` | pdf, doc, docx, xls, xlsx, ppt, pptx, odt, txt, md |
| `Vidéos/` | mp4, mkv, avi, mov, webm |
| `Audio/` | mp3, wav, flac, ogg, m4a |
| `Code/` | js, ts, py, php, html, css, json, sh, java, c, cpp |
| `Archives/` | zip, tar, gz, rar, 7z |
| `Autres/` | tout le reste |

## ✅ Critères d'acceptation

Ton script doit :

1. **Accepter un argument** : le chemin du dossier à ranger (`./tri.sh ~/Downloads`).
2. **Créer les sous-dossiers** s'ils n'existent pas déjà.
3. **Déplacer les fichiers** (pas les copier) vers le bon sous-dossier.
4. **Ne pas écraser** un fichier qui existerait déjà à la destination — soit renommer (`fichier-1.jpg`), soit afficher un avertissement et passer.
5. **Ignorer les sous-dossiers** : ne traiter que les fichiers directement dans le dossier cible (pas de récursion).
6. **Être idempotent** : lancer le script deux fois de suite ne doit pas casser le rangement.
7. **Insensible à la casse de l'extension** : `.JPG`, `.Jpg`, `.jpg` doivent tous aller dans `Images/`.
8. **Afficher un résumé** à la fin : nombre de fichiers déplacés par catégorie.

### Bonus (facultatifs)

- Mode `--dry-run` qui affiche ce qu'il *ferait* sans déplacer.
- Mode `--verbose` qui affiche chaque déplacement.
- Gestion d'un fichier sans extension (les ranger dans `Autres/`).

## 🛠 Comment commencer

```bash
cd canevas/
chmod +x tri.sh
./tri.sh ./test-data/
```

Le dossier `canevas/test-data/` contient des fichiers d'exemple pour tester. Le canevas (`tri.sh`) contient des `# TODO` indiquant où coder.

## 🧪 S'auto-valider

Lance la suite de tests :

```bash
cd tests/
./run.sh
```

Tu devrais voir tous les tests passer une fois le script terminé.

## 💡 Indices (à n'ouvrir que si tu bloques)

<details>
<summary>1. Comment associer une extension à une catégorie ?</summary>

Une fonction qui prend une extension et renvoie le nom du dossier cible :

```bash
categorie() {
  local ext="${1,,}"  # ${VAR,,} convertit en minuscule (Bash 4+)
  case "$ext" in
    jpg|jpeg|png|gif|webp|svg|bmp) echo "Images" ;;
    pdf|doc|docx|...)              echo "Documents" ;;
    *)                              echo "Autres" ;;
  esac
}
```
</details>

<details>
<summary>2. Comment lister uniquement les fichiers, pas les sous-dossiers ?</summary>

```bash
find "$cible" -maxdepth 1 -type f -print0
```

`-maxdepth 1` empêche la récursion ; `-type f` filtre les fichiers ; `-print0` évite les soucis avec les espaces dans les noms (associé à `read -d ''`).
</details>

<details>
<summary>3. Comment éviter d'écraser un fichier existant ?</summary>

`mv -n` n'écrase pas. Pour générer un nom unique :

```bash
dest_unique() {
  local dest="$1"
  local base="${dest%.*}" ext="${dest##*.}"
  local n=1
  while [[ -e "$dest" ]]; do
    dest="${base}-${n}.${ext}"
    ((n++))
  done
  echo "$dest"
}
```
</details>

## 🔑 Correction

Une fois ton implémentation terminée (ou si tu sèches après plusieurs tentatives), regarde [`correction/`](./correction/) pour comparer avec une solution commentée.

## 📚 Pour aller plus loin

- Variante 1 : faire la même chose en **Python**.
- Variante 2 : faire la même chose en **Node.js** avec `fs/promises`.
- Variante 3 : ajouter un mode *watch* qui surveille le dossier en continu (`inotifywait`).
