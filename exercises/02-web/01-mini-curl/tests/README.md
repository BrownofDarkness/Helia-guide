# Tests — mini-curl

## Lancement

```bash
# Depuis ce dossier
npm install
npm test
```

Par défaut les tests s'exécutent contre la correction. Pour tester ton canevas :

```bash
TARGET=canevas npm test
```

(Sous Windows PowerShell : `$env:TARGET="canevas"; npm test`)

## Que vérifient-ils ?

8 tests d'intégration qui couvrent les critères d'acceptation principaux :

1. GET basique → 200 + corps
2. Code de sortie 1 sur 5xx
3. Code de sortie 2 sur erreur réseau
4. `-v` affiche en-têtes envoyés et reçus
5. Suivi des redirections 3xx
6. POST avec corps et en-tête custom
7. `-d` sans `-X` → POST automatique
8. Timings affichés en verbose

Un serveur HTTP local démarre sur un port aléatoire pour que les tests soient hermétiques (pas de dépendance Internet).

## Note Windows

Sur certaines configurations Windows + Git Bash, `spawnSync('npx', ...)` peut bloquer indéfiniment dans Vitest. Si tu rencontres ça :

1. Lance les tests dans **WSL2** (recommandé pour le dev web sous Windows).
2. Ou bien teste manuellement la correction :

   ```bash
   cd ../correction
   npm install
   npx tsx src/index.ts -v https://example.com
   npx tsx src/index.ts -X POST -d '{"a":1}' -H "Content-Type: application/json" https://httpbin.org/post
   ```
