# Tests — SPA TypeScript

## Lancement

```bash
npm install
npm test                       # par défaut sur correction/
TARGET=canevas npm test        # sur ton canevas
```

## Couverture

8 tests sur `Store` (4) et `compile` du router (4) — les modules logiques, sans DOM.

Les vues (rendu DOM, navigation cliquée) ne sont pas testées unitairement — elles sont validées à l'œil dans le navigateur.

## Pourquoi pas de spawn de subprocess ?

Pour éviter le problème vitest+spawnSync sur Windows (cf. mémoire feedback). On importe directement les modules TypeScript via vitest, qui résout `.ts` natif.
