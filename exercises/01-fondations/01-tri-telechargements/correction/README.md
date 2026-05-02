# Correction — Tri automatique des téléchargements

> Solution complète + walkthrough pédagogique. Lis les sections dans l'ordre — elles sont conçues pour que tu **comprennes** chaque choix, pas seulement que tu copies le code.

---

## 1. 🎯 Ce que tu apprends en lisant cette correction

| Compétence | Concrètement |
|------------|--------------|
| Écrire un script Bash **robuste** | `set -euo pipefail`, gestion d'options, validation d'arg |
| Manipuler des **fichiers et chemins** sans surprise | `find -print0`, `read -d ''`, `${var,,}`, `${nom##*.}` |
| **Découper en fonctions** une logique Bash | `categorie()`, `dest_unique()`, `log()` |
| **Gérer les cas limites** | Casse de l'extension, fichier sans point, fichier déjà à la destination, espaces dans les noms |
| Implémenter un mode **dry-run** | Pratique courante pour tout script destructif |

À la fin, tu sauras pourquoi chaque ligne du script existe et tu pourras adapter le pattern à tes propres scripts.

---

## 2. 📦 Pré-requis

| Outil | Version | Vérifier |
|-------|---------|----------|
| **Bash** | ≥ 4 (de préférence 5) | `bash --version` |
| Linux ou macOS | natif | — |
| Windows | **WSL2 Ubuntu** ou Git Bash | voir l'axe 1.1 du guide |

> macOS livre encore Bash 3.2 par défaut → la syntaxe `${var,,}` (lowercase) et `declare -A` (associative array) ne marchent pas. Solution : `brew install bash` ou utiliser WSL.

---

## 3. ⚡ Démarrer en 1 minute

```bash
# 1. Permissions
chmod +x tri.sh

# 2. Lancer sur un dossier de test
mkdir -p test-data
touch test-data/{photo.jpg,doc.pdf,video.mp4,code.js,archive.zip}
./tri.sh test-data/

# 3. Vérifier
ls -R test-data/
```

Modes optionnels :

```bash
./tri.sh --dry-run test-data/   # affiche ce que ferait le script, sans rien déplacer
./tri.sh --verbose test-data/   # affiche chaque déplacement
./tri.sh --help                  # documentation embarquée
```

---

## 4. 🗂 Structure du code

Le script est un **seul fichier** organisé en 5 blocs clairement délimités :

```
tri.sh
├── shebang + commentaire entête
├── set -euo pipefail              ← arrêt strict en cas d'erreur
├── 1. Parsing des options          ← --dry-run, --verbose, --help
├── 2. Validation de l'argument      ← le dossier existe-t-il ?
├── 3. Compteurs (declare -A)        ← associative array par catégorie
├── 4. Fonctions                     ← categorie(), dest_unique(), log()
├── 5. Boucle principale (find + read)
└── 6. Affichage du résumé
```

---

## 5. 🧠 Walkthrough pédagogique

### 5.1 `set -euo pipefail` — la 1ʳᵉ ligne après le shebang

**Le piège.** Sans ces options, Bash continue après une commande échouée. Si `mv` échoue, le script continue, l'état est partiel, et tu te retrouves avec un dossier à moitié rangé.

**Solution choisie.**

```bash
set -euo pipefail
#    │││  └─── une erreur dans un pipe ne soit pas masquée par une commande qui la suit
#    ││└─── erreur si on lit une variable non déclarée
#    │└──── exit du script si une commande échoue
```

**Pourquoi.** Triple ceinture. Tu attrapes les erreurs **avant** qu'elles ne polluent l'état du système. Standard absolu pour tout script Bash sérieux.

### 5.2 La fonction `categorie()` avec `case ... esac`

**Le piège.** Une longue chaîne de `if [[ ext == "jpg" ]]; then ... elif ...` est verbose et mauvaise en lisibilité.

**Solution choisie.**

```bash
categorie() {
  local ext="${1,,}"  # ← passage en minuscule en une expansion
  case "$ext" in
    jpg|jpeg|png|gif|webp|svg|bmp) echo "Images" ;;
    pdf|doc|docx|...)              echo "Documents" ;;
    *)                              echo "Autres" ;;
  esac
}
```

**Pourquoi.**

- `${1,,}` met la chaîne en minuscule → `.JPG`, `.Jpg`, `.jpg` matchent tous `jpg`.
- `case ... esac` est un dispatch propre côté Bash, plus lisible et plus rapide qu'un escalier `if/elif`.
- `local ext` empêche la pollution de scope.

**Alternatives écartées.**

| Alternative | Pourquoi non |
|-------------|--------------|
| Chaîne de `if/elif` | Verbose, tu oublies un cas |
| Tableau associatif `declare -A CAT=([jpg]=Images...)` | Marche, mais dupliqué pour chaque alias d'extension |

### 5.3 La fonction `dest_unique()` au lieu de juste `mv -n`

**Le piège.** `mv -n` (no-clobber) **n'écrase pas** le fichier existant — bien — mais il **abandonne silencieusement** le déplacement. Tu te retrouves avec un fichier non rangé sans message d'erreur.

**Solution choisie.** Générer un nouveau nom unique :

```bash
dest_unique() {
  local dest="$1"
  if [[ ! -e "$dest" ]]; then echo "$dest"; return; fi

  local dir=$(dirname "$dest")
  local nom=$(basename "$dest")
  local base="${nom%.*}" ext=".${nom##*.}"

  local n=1
  local candidat="${dir}/${base}-${n}${ext}"
  while [[ -e "$candidat" ]]; do
    ((n++))
    candidat="${dir}/${base}-${n}${ext}"
  done
  echo "$candidat"
}
```

`photo.jpg` → si pris, on essaie `photo-1.jpg`, `photo-2.jpg`, etc.

**Pourquoi.** Le critère d'acceptation demande de **préserver les deux fichiers**. Tu garantis : pas de perte de donnée + tu restes fonctionnel sur des doublons.

### 5.4 `find -maxdepth 1 -type f -print0` + `read -d ''`

**Le piège.**

```bash
# ❌ MAUVAIS — casse sur les fichiers avec espaces
for f in $(ls "$CIBLE"); do
  ...
done
```

`ls` rend les caractères spéciaux mal protégés, et `for f in $(...)` fait du word splitting. Un fichier nommé `mon doc.pdf` devient deux : `mon` et `doc.pdf`.

**Solution choisie.**

```bash
while IFS= read -r -d '' fichier; do
  ...
done < <(find "$CIBLE" -maxdepth 1 -type f -print0)
```

- `find -print0` sépare les chemins par **byte zéro** au lieu d'un newline.
- `read -d ''` (delimiter vide = byte zéro) lit jusqu'au prochain byte zéro.
- `IFS=` désactive le word splitting interne à `read`.

**Pourquoi.** **C'est LA façon canonique** d'itérer sur des fichiers en Bash. Toute autre approche casse sur les noms exotiques (espaces, retours à la ligne, guillemets).

`-maxdepth 1` empêche la récursion → si `Images/` existe déjà, ses fichiers ne sont pas re-traités → idempotence garantie.

### 5.5 Compteurs en associative array

```bash
declare -A COMPTEURS=(
  [Images]=0 [Documents]=0 [Vidéos]=0 [Audio]=0
  [Code]=0 [Archives]=0 [Autres]=0
)
# ...
COMPTEURS[$cat]=$((COMPTEURS[$cat] + 1))
```

**Pourquoi.** 7 variables séparées (`COMPT_IMG`, `COMPT_DOC`, …) seraient lourdes. `declare -A` (Bash 4+) donne un dict natif. Le résumé final boucle dessus.

### 5.6 Mode `--dry-run`

```bash
if (( DRY_RUN == 1 )); then
  log "[dry-run] $fichier → $dest_final"
else
  mv -n "$fichier" "$dest_final"
fi
```

**Pourquoi.** Tout script qui **modifie** le système de fichiers devrait avoir un mode dry-run. Tu testes la logique sans risque, surtout en environnement de prod.

### 5.7 Gestion fichier sans extension

```bash
if [[ "$nom" == *.* ]]; then
  ext="${nom##*.}"
else
  ext=""    # ← classé en "Autres" via le `*)` du case
fi
```

**Le piège.** `${nom##*.}` retourne **le nom complet** si le fichier ne contient pas de point — sans ce check, `README` serait considéré comme ayant l'extension `README` → mauvaise classification.

**Pourquoi.** Le test explicite est plus lisible et permet de classer proprement.

---

## 6. ✅ Tests — ce qu'ils vérifient

```bash
# Depuis le dossier de l'exercice (parent de correction/)
bash tests/run.sh correction
```

12 sous-tests dans 5 cas :

| Test | Vérifie |
|------|---------|
| 1 (5×) | Tri basique : `.jpg` → `Images/`, `.pdf` → `Documents/`, etc. |
| 2 (3×) | Insensibilité à la casse : `.JPG`, `.Pdf`, `.MP4` |
| 3 (2×) | Pas d'écrasement + génération de `photo-1.jpg` |
| 4 (1×) | Fichier sans extension → `Autres/` |
| 5 (1×) | Idempotence : 2ᵉ run ne casse rien |

Sortie attendue : `Tests réussis : 12 / Tests échoués : 0`.

---

## 7. 🚀 Pour aller plus loin

### Variante Python

```python
from pathlib import Path
import shutil

CATS = {
    'Images': {'jpg', 'jpeg', 'png', 'gif', 'webp'},
    'Documents': {'pdf', 'docx', 'txt', 'md'},
    # ...
}

def categorie(ext: str) -> str:
    ext = ext.lower()
    return next((k for k, v in CATS.items() if ext in v), 'Autres')

target = Path('Downloads')
for f in target.iterdir():
    if f.is_file():
        cat = categorie(f.suffix.lstrip('.'))
        dest = target / cat / f.name
        dest.parent.mkdir(exist_ok=True)
        f.rename(dest)
```

### Variante Node.js

Avec `node:fs/promises` et types TS — exercice utile en parallèle pour comparer les paradigmes.

### Mode watch (surveillance continue)

- **Linux** : `inotifywait -m -e create "$CIBLE"`
- **macOS** : `fswatch -0 "$CIBLE" | xargs -0 -I {} ./tri.sh "$CIBLE"`

### Si le dossier est énorme (> 100 k fichiers)

`find ... | xargs -0 -P 4 -I {} ./traiter.sh {}` parallélise sur 4 cœurs.

---

## 🆘 Si tu as compris cette correction

Tu sais maintenant :

- ✅ Écrire un script Bash robuste avec `set -euo pipefail`.
- ✅ Itérer sur des fichiers **sans casser** sur les espaces (`find -print0` + `read -d ''`).
- ✅ Gérer la casse, les extensions absentes, les doublons.
- ✅ Découper en fonctions Bash propres.
- ✅ Implémenter un mode dry-run.
- ✅ Tester un script avec une vraie suite de tests.

Bon code !
