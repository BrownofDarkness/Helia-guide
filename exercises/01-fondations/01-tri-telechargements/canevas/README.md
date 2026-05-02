# Canevas — Tri automatique des téléchargements

> Ton point de départ. Suis les étapes ci-dessous pour démarrer, puis attaque les `# TODO` dans `tri.sh`.

## 🎯 Ce que tu vas faire

Écrire un script Bash qui range automatiquement un dossier en classant chaque fichier dans un sous-dossier selon son extension (Images / Documents / Vidéos / Audio / Code / Archives / Autres).

À la fin, tu sauras :

- **Manipuler des fichiers** en Bash (`mv`, `mkdir`, `find`).
- **Écrire des fonctions** Bash avec arguments locaux.
- **Itérer sur des fichiers** en gérant les espaces dans les noms (`find -print0` + `read -d ''`).
- **Gérer les cas limites** : fichier sans extension, casse de l'extension, fichier déjà présent à la destination.
- **Tester un script** avec une vraie suite de tests.

## 📦 Pré-requis

| Outil | Version | Vérifier |
|-------|---------|----------|
| **Bash** | ≥ 4 (de préférence 5) | `bash --version` |
| Linux / macOS | natif | — |
| Windows | **WSL2 (Ubuntu)** ou Git Bash | voir l'axe 1.1 du guide |

> Sur macOS, le Bash livré est encore en 3.2 — certaines syntaxes (`${var,,}`, `declare -A`) ne marchent pas. Solution : `brew install bash` ou utiliser WSL.

## ⚡ Démarrer en 3 étapes

```bash
# 1. Permissions d'exécution
chmod +x tri.sh

# 2. Créer quelques fichiers d'exemple dans test-data/
cd test-data/
touch photo.jpg image.PNG vidéo.mp4 doc.pdf rapport.DOCX archive.zip code.js note.txt sansext
cd ..

# 3. Lancer le script
./tri.sh test-data/
```

Vérifie le résultat :

```bash
ls -R test-data/
# Doit montrer : Images/, Documents/, Vidéos/, Code/, Archives/, Autres/ avec les fichiers dedans
```

## 🗂 Ce qui est déjà en place dans le canevas

| Fichier | Statut |
|---------|--------|
| `tri.sh` | 🚧 Squelette avec **5 TODO** à compléter |
| `test-data/.gitkeep` | ✅ Dossier de test vide prêt à l'emploi |
| `../tests/run.sh` | ✅ Suite de **12 tests automatisés** (à utiliser pour t'auto-évaluer) |

## 🛠 Liste des TODO (par ordre suggéré dans `tri.sh`)

| # | Sujet |
|---|-------|
| 1 | Validation de l'argument (dossier passé en `$1`, doit exister, sortie 1 sinon) |
| 2 | Fonction `categorie()` : prend une extension, renvoie le nom du sous-dossier (`case ... esac`) |
| 3 | Fonction `dest_unique()` : si la destination existe, génère `fichier-1.jpg`, `fichier-2.jpg`, etc. |
| 4 | Boucle principale : `find -maxdepth 1 -type f -print0` + `while read -d ''` |
| 5 | Affichage du résumé final (compteurs par catégorie) |

> Lis l'énoncé complet dans [`../README.md`](../README.md) pour les **8 critères d'acceptation** et les **3 bonus** (`--dry-run`, `--verbose`, gestion fichiers sans extension).

## 🧪 Tester ton code

Une fois ton script écrit, lance la suite de tests officielle :

```bash
# Depuis le dossier de l'exercice (parent de canevas/)
cd ..
bash tests/run.sh canevas
```

Tu vises **12 tests réussis sur 12** :

- Test 1 (5 sous-tests) — tri basique des extensions courantes.
- Test 2 (3 sous-tests) — casse de l'extension (`.JPG` `.Pdf` `.MP4`).
- Test 3 (2 sous-tests) — pas d'écrasement, génération de `photo-1.jpg`.
- Test 4 (1 sous-test) — fichier sans extension → `Autres/`.
- Test 5 (1 sous-test) — idempotence (le 2ᵉ run ne casse rien).

## 🆘 Bloqué ?

1. Re-lis l'énoncé et les indices dans [`../README.md`](../README.md#-indices-à-nouvrir-que-si-tu-bloques) — 3 indices avec extraits de code.
2. Si tu sèches vraiment, télécharge la **correction** — son `README.md` t'explique chaque choix (`case` + `categorie()`, `find -print0`, `dest_unique`, etc.) avec un walkthrough détaillé.

## 🧹 Ne commit pas

- Les fichiers test générés dans `test-data/` (sauf le `.gitkeep`)
- Les sous-dossiers créés par le script (`Images/`, `Documents/`, etc.)

Le `.gitignore` est déjà configuré pour les exclure.
