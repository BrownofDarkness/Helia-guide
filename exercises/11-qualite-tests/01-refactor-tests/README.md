# Exercice 11.1 — Refactor + tests

> **Axe** : 11 — Qualité & tests
> **Difficulté** : intermédiaire
> **Durée estimée** : 6 à 12 heures
> **Prérequis** : axes 6, 11 lus, **Node.js ≥ 20**

## ⚙️ Avant de commencer

Voir [« Installer Node.js »](../../02-web/01-mini-curl/README.md#-avant-de-commencer--installer-nodejs) si pas fait.

```bash
node --version       # v20+ (idéalement 24)
```

## 🎯 Objectifs pédagogiques

- Identifier les **code smells** d'un module mal écrit
- Refactorer en **modules cohérents** (SRP)
- Ajouter des **tests unitaires** Vitest jusqu'à **80 %** de couverture
- Configurer **ESLint v9 flat config + Prettier**
- Activer **TypeScript strict + noUncheckedIndexedAccess**
- Rédiger un **README** propre + un **ADR**

## 📋 Énoncé — deux modes au choix

Tu as **deux modes** pour cet exercice. Choisis celui qui te parle, ou enchaîne les deux pour consolider.

### 🥋 Mode A — Kata sur Tasky-Shop pricing (recommandé en 1ère lecture)

`canevas/src/index.ts` contient un module de **calcul de prix** d'un panier e-commerce. Il est **volontairement** mal écrit :

- Tout dans une seule fonction de 80 lignes.
- Magic numbers (`0.20`, `100`, `50000`).
- Variables nommées `a`, `b`, `tmp`.
- Pas de types stricts, des `any` partout.
- 0 test.
- 0 lint config.

Ta mission : **refactorer** sans changer le comportement, **ajouter les tests**, **configurer les outils**.

**Pourquoi ce mode** : code détaché de tout contexte → tu apprends la **discipline** sans biais affectif (« j'ai écrit ça il y a 1 mois, j'aime bien »).

### 🧬 Mode B — Fil-rouge sur ton `taskly-api` (recommandé après le mode A)

> Pré-requis : avoir terminé l'exercice **8.1 taskly-api** (Node/TS, Python ou PHP — peu importe le parcours).

Reprends ton propre code de `taskly-api` et applique-y la **même discipline** :

1. **Audit qualité** : lance `npm run lint` (ou équivalent dans ton parcours) et liste les violations.
2. **Coverage actuelle** : `npm run test -- --coverage`. Si < 80 %, c'est ta cible.
3. **Identifie 3 modules à refactorer** parmi :
   - **Le contrôleur d'auth** : si la logique de hashing + JWT + cookie est dans le même handler, sépare en `lib/auth/`.
   - **Les schémas Zod / Pydantic** : centralise dans `schemas/` plutôt qu'inline dans chaque route.
   - **La gestion d'erreurs** : un middleware global plutôt qu'un `try/catch` dans chaque route.
4. **Tests à ajouter** : si tu n'as testé que le happy path, ajoute :
   - Edge cases (email manquant, password trop court, token expiré)
   - Tests d'isolation (user A ne voit pas les tâches de user B → 404)
   - Tests d'idempotence (DELETE 2× sur la même tâche → 404 puis 404, pas 500)
5. **ADR** : capture **une décision** que tu as prise dans `taskly-api` (ex. « pourquoi Drizzle plutôt que Prisma », « pourquoi JWT en cookie plutôt que Bearer ») dans `docs/adr/0001-XXX.md`.

**Pourquoi ce mode** : tu **capitalises** sur ton effort de l'axe 8.1. Tu vois ton propre code avec un œil neuf 1 mois après — le moment le plus formateur du parcours d'un dev. La correction de cet exercice **n'est pas générique** : elle dépend de ce que tu as écrit en 8.1, donc compare avec un pair plutôt qu'avec une correction officielle.

> 💡 **Combo recommandé** : fais d'abord le **Mode A** (kata, 4-6 h) pour acquérir la discipline, puis le **Mode B** sur ton taskly-api (4-6 h) pour l'appliquer à ton propre code. Tu retiendras 2× plus.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| `npm run lint` passe sans erreur | ESLint v9 flat config |
| `npm run typecheck` passe | TS strict + noUncheckedIndexedAccess |
| `npm test -- --coverage` passe | ≥ 80 % de couverture sur `src/` |
| Aucun `any` dans le code | typage rigoureux |
| Aucun magic number — tous extraits en constantes nommées | `VAT_RATE`, `MIN_ORDER_AMOUNT_CENTS`, etc. |
| Découpage en modules : `pricing/`, `discount/`, `vat/`, `cart/` | un module = une responsabilité |
| README de qualité professionnelle | démarrage en < 5 min |
| 1 ADR documente un choix (ex. choix Vitest, choix de structurer en modules) | dans `docs/adr/` |

### Bonus

- **Pre-commit hook** husky + lint-staged.
- **CI GitHub Actions** qui bloque la PR.
- **JSDoc / TSDoc** sur les fonctions publiques.

## 🛠 Démarrer

```bash
cd canevas/
npm install
npm run dev   # affiche un exemple
```

Tu vois le code spaghetti dans `src/index.ts`. Avant de refactorer, **comprends-le** : essaie de prédire ce que retourne `computeOrderTotal({ items: [...], code: 'SUMMER10' })`.

## 💡 Démarche suggérée

### Étape 1 — Comprendre et caractériser
1. Lire le code, identifier les smells.
2. Écrire **d'abord** des tests qui capturent le comportement actuel (même bizarre). C'est le pattern **Characterization Tests**.
3. Mesurer la couverture initiale (probablement 0 %).

### Étape 2 — Outils statiques
1. Configurer ESLint v9 flat config + Prettier.
2. Activer TS strict + `noUncheckedIndexedAccess`.
3. Fixer les erreurs au fur et à mesure.

### Étape 3 — Refactor par étapes
1. Extraire les magic numbers en constantes.
2. Découper la fonction `computeOrderTotal` en sous-fonctions par responsabilité.
3. Créer des modules `cart/`, `discount/`, `vat/`, `pricing/`.
4. **Run les tests à chaque étape** — ils doivent rester verts.

### Étape 4 — Améliorer les tests
1. Tests par fonction (cas standard + edge cases).
2. Cible 80 % de couverture **significative** (assertions réelles).

### Étape 5 — Doc
1. README : démarrage rapide + structure + scripts.
2. ADR : explique pourquoi tu as découpé en modules par responsabilité.

## 🧪 Vérifier

```bash
npm run lint
npm run typecheck
npm test -- --coverage
```

## 🔑 Correction

Voir [`correction/`](./correction/) — version refactorée complète.

## 📚 Pour aller plus loin

- Ajoute **tests d'intégration** avec Testcontainers + Postgres si tu connectes au schéma e-commerce de l'axe 9.
- Génère **OpenAPI** auto si tu transforme ce module en API.
- Pre-commit hook + CI GitHub Actions.
