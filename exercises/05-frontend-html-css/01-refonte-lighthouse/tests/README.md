# Tests — Refonte Lighthouse

## Lancement

```bash
npm install
npm test                       # par défaut sur correction/
node run.js canevas            # sur le canevas
```

## Ce que ça fait

1. Démarre un serveur statique local sur le dossier cible.
2. Lance Chrome headless via `chrome-launcher`.
3. Audit Lighthouse de la page d'accueil.
4. Compare aux seuils 0.95 sur les 4 catégories.
5. Sortie code 0 si tout passe, 1 sinon.

## Prérequis

- Node ≥ 20
- Chrome installé sur la machine

## Note

- Le canevas devrait **échouer** (scores < 0.95).
- La correction devrait **réussir** (scores ≥ 0.95).
- En local, les scores Performance peuvent varier légèrement selon la charge CPU. Lance 2-3 fois si un score est limite.
