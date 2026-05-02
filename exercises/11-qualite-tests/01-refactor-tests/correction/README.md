# Correction — Refactor + tests (tasky-pricing)

> Module TypeScript pur, refactoré du « code spaghetti » initial vers **6 modules cohérents** + **31 tests** + **100 % de coverage**. `npm run check` 100 % vert (lint + typecheck + tests).
>
> Lis-la **après ton refactor**. La valeur de cet exercice n'est pas dans le code final mais dans la **démarche** : caractériser, outiller, découper, tester, documenter — dans cet ordre, pas un autre.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Avant / après en chiffres](#2-avant--après-en-chiffres)
3. [Architecture en 8 modules](#3-architecture-en-8-modules)
4. [Discriminated union pour les codes promo](#4-discriminated-union-pour-les-codes-promo)
5. [Stratégie de tests : par module](#5-stratégie-de-tests--par-module)
6. [Validation : `npm run check`](#6-validation--npm-run-check)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
npm install
npm run dev               # démo : exécute src/index.ts
```

### Scripts disponibles

| Commande | Action |
|----------|--------|
| `npm run dev` | Exécute `src/index.ts` avec un panier exemple |
| `npm run lint` | ESLint v9 flat config |
| `npm run lint:fix` | Auto-fix les erreurs lint |
| `npm run format` | Prettier write |
| `npm run typecheck` | TS strict + `noUncheckedIndexedAccess` |
| `npm test` | Vitest |
| `npm run test:coverage` | Tests + rapport coverage v8 |
| **`npm run check`** | **Lint + typecheck + tests** (à lancer en CI) |

### Usage du module

```ts
import { computeOrderTotal } from './src/pricing';

const result = computeOrderTotal({
  items: [
    { price: 1000, qty: 2 },   // prix HT en CENTIMES
    { price: 2000, qty: 1 },
  ],
  code: 'SUMMER10',
  user: { tier: 'vip' },
});

// {
//   itemCount: 3,
//   subtotalCents: 4000,
//   discountCents: 600,    // 10 % (code) + 5 % (VIP)
//   vatCents: 680,          // 20 % sur (subtotal - discount)
//   shippingCents: 590,     // gratuit au-dessus de 5000 cents
//   totalCents: 4670,
//   display: '$46.70',
// }
```

## 2. Avant / après en chiffres

| Métrique | Canevas (avant) | Correction (après) |
|----------|-----------------|---------------------|
| Fichiers `src/` | 1 | 8 |
| Fichiers `tests/` | 0 | 6 |
| Lignes dans la fonction principale | ~80 | ~30 (orchestrateur) |
| Tests Vitest | 0 | **31** |
| Coverage | 0 % | **100 %** |
| `any` | 5+ | **0** |
| Magic numbers en dur | ~10 | **0** (extraits en constantes) |
| ESLint config | aucune | flat config + plugins |
| TypeScript strict | non | **strict + noUncheckedIndexedAccess** |
| ADR | 0 | 1 |

Le **comportement** est inchangé — c'est l'invariant sacré du refactor. Tu peux le vérifier en gardant en tête : pour les mêmes inputs, les outputs sont identiques (au numérique près).

## 3. Architecture en 8 modules

```
src/
├── constants.ts        ← VAT_RATE, SHIPPING_FEE_CENTS, FREE_SHIPPING_THRESHOLD_CENTS, VIP_DISCOUNT_RATE
├── types.ts             ← CartItem, User, OrderInput, OrderResult, Tier
├── cart.ts              ← computeSubtotal(items), validateItems(items)
├── discount.ts          ← computeDiscount(subtotal, code, user) — code promo + VIP
├── vat.ts               ← computeVat(amount)
├── shipping.ts          ← computeShipping(subtotal)
├── format.ts            ← formatCents(cents) → "$X.XX"
├── pricing.ts           ← computeOrderTotal — orchestrateur
└── index.ts             ← exports publics + démo console.log
```

### Pourquoi ce découpage et pas un autre

- **`cart.ts` plutôt que `subtotal.ts`** : le module gère **tout ce qui concerne le panier** (compter, valider, sommer). Si on doit ajouter `removeItem(items, id)` plus tard, c'est ici.
- **`discount.ts` agrège codes promo + bonus VIP** : ce sont les deux mécanismes de **réduction**. Les séparer en `promo-codes.ts` + `vip-bonus.ts` serait sur-découpage (cohésion < couplage).
- **`vat.ts` et `shipping.ts` séparés** : ce sont des concepts métier distincts. La TVA dépend du pays, le shipping du poids/taille. Probabilité de divergence future élevée.
- **`pricing.ts` = orchestrateur** : il appelle les autres modules dans le bon ordre (subtotal → discount → vat → shipping → total). C'est **le seul** qui connaît la formule complète.

L'ADR `docs/adr/0001-decoupage-modulaire.md` documente ce raisonnement par écrit. Quand un futur dev demande « pourquoi on a séparé X et Y ? », l'ADR répond.

## 4. Discriminated union pour les codes promo

```ts
// discount.ts
interface PercentRule {
  type: 'percent';
  rate: number;
}
interface FlatRule {
  type: 'flat';
  amountCents: number;
}
type DiscountRule = PercentRule | FlatRule;

const PROMO_CODES: Record<string, DiscountRule> = {
  SUMMER10:  { type: 'percent', rate: 0.1 },
  WELCOME20: { type: 'percent', rate: 0.2 },
  VIP50:     { type: 'percent', rate: 0.5 },
  FLAT5:     { type: 'flat', amountCents: 500 },
};

function applyRule(rule: DiscountRule, subtotalCents: number): number {
  switch (rule.type) {
    case 'percent':
      return Math.round(subtotalCents * rule.rate);
    case 'flat':
      return rule.amountCents;
  }
}
```

### Pourquoi c'est important

Dans le code original :

```ts
// ❌ Avant
if (input.code === 'SUMMER10') discount = total * 0.10;
else if (input.code === 'WELCOME20') discount = total * 0.20;
else if (input.code === 'VIP50') discount = total * 0.50;
else if (input.code === 'FLAT5') discount = 500;
```

Pour ajouter `WINTER15` (15 %), il fallait modifier le code dans la fonction de calcul. Risque : oublier un cas, casser un test.

Avec la **discriminated union** + le `Record<string, DiscountRule>` :
- Ajouter un code = ajouter une ligne dans `PROMO_CODES`. **Zéro modification** dans la logique.
- TypeScript **vérifie l'exhaustivité** du `switch (rule.type)` — si on ajoute un 3e type, TS plante au compile.
- L'extension future (codes par catégorie, codes par utilisateur, codes BOGO) change seulement le type, pas les call sites.

C'est l'**Open/Closed Principle** appliqué : *open* à l'extension, *closed* à la modification.

## 5. Stratégie de tests : par module

```
tests/
├── cart.test.ts        ← 7 tests (subtotal standard, qty=0, prix négatif, items vide, etc.)
├── discount.test.ts    ← 10 tests (chaque code, code inconnu, VIP standalone, combo, cap)
├── shipping.test.ts    ← 3 tests (juste sous le seuil, juste au-dessus, valeur exacte)
├── vat.test.ts         ← 3 tests
├── format.test.ts      ← 3 tests
└── pricing.test.ts     ← 5 tests d'intégration
```

### 5.1 Tests par module > test fourre-tout

| Approche | Avantage | Inconvénient |
|----------|----------|--------------|
| Tests d'intégration uniquement | Couvre le scénario réel | Quand un test échoue, on ne sait pas quel module |
| **Tests par module** + qq tests d'intégration | Échec localisé en 5 secondes | Plus de fichiers à maintenir |

La règle : **test unitaire pour les choses qui peuvent évoluer**, **test d'intégration pour vérifier que les morceaux communiquent**. Ici, les 6 fichiers de test couvrent les deux.

### 5.2 Edge cases qu'on n'aurait pas trouvés sans tester

Le test `cart.test.ts` révèle :
- `qty: 0` → ignoré
- `qty: -5` → ignoré (sécurité)
- `price: -100` → ramené à 0 (le code original le faisait, on garde)
- `items: []` → subtotal = 0, pas d'exception

Le test `shipping.test.ts` :
- subtotal = 4999 → port payant (590)
- subtotal = 5000 → port gratuit (`>=`, pas `>`)
- C'est un *off-by-one* qu'on n'aurait jamais trouvé sans test exact à la frontière.

Le test `discount.test.ts` :
- FLAT5 (500c) sur subtotal 100c → cap au subtotal (100), pas de remise négative.
- VIP + code combinent additivement, pas multiplicativement.

### 5.3 Coverage 100 %, mais pertinent

Coverage 100 % ne veut **pas** dire « tests parfaits ». Une suite de tests à 100 % qui n'asserte rien est inutile. Le bon test :

- A un **nom qui décrit l'intention** (`'plafonne au sous-total (impossible de devoir négatif)'`)
- Asserte **une valeur précise** (`expect(...).toBe(100)`, pas `.toBeDefined()`)
- Couvre un **cas qui peut casser** (les edge cases, les transitions, les combinaisons)

Le rapport HTML (`coverage/index.html` après `npm run test:coverage`) montre les branches **réellement** couvertes — pas juste les lignes exécutées.

## 6. Validation : `npm run check`

```bash
npm run check
```

Sortie observée :

```
> tasky-pricing@1.0.0 check
> npm run lint && npm run typecheck && npm run test

> npm run lint
✓ 0 problems

> npm run typecheck
✓ (no output)

> npm test
 RUN  v3.2.4
 ✓ tests/cart.test.ts (7 tests)
 ✓ tests/discount.test.ts (10 tests)
 ✓ tests/format.test.ts (3 tests)
 ✓ tests/pricing.test.ts (5 tests)
 ✓ tests/shipping.test.ts (3 tests)
 ✓ tests/vat.test.ts (3 tests)

 Test Files  6 passed (6)
      Tests  31 passed (31)
```

Coverage :

```
File          | % Stmts | % Branch | % Funcs | % Lines
--------------|---------|----------|---------|---------
All files     |     100 |      100 |     100 |     100
```

`npm run check` est **le** script à câbler en CI (GitHub Actions, GitLab CI, etc.). Si check échoue, la PR est bloquée. Cette discipline élimine 90 % des régressions silencieuses qu'on ajoute dans une codebase active.

## 7. Pièges réels rencontrés

3 pièges concrets pendant la construction :

1. **Tests de caractérisation passaient mais asseraient sur une logique inexistante** — Le test « plafonne au sous-total » utilisait `VIP50` (50 %) + bonus VIP (5 %) = 55 % sur un subtotal de 1000c → 550c, pas 1000c. Le cap ne se déclenchait jamais. Fix : utiliser `FLAT5` (500c fixe) sur subtotal de 100c pour vraiment exercer le cap.
2. **`no-magic-numbers` flagge tous les littéraux dans `tests/`** — c'est faux positif sur les tests qui asserent justement des valeurs. Fix : désactiver la règle pour `tests/**/*.ts` via une override dans `eslint.config.js`.
3. **`no-magic-numbers` flagge `2` dans `(cents / 100).toFixed(2)`** — `2` est aussi un magic number en littéraire mais ici c'est universel (decimals affichés). Fix : ajouter `2` à la liste `ignore`.

Aucun nouveau piège global à capturer dans `pieges.ts` — ce sont des spécificités du linter et de la qualité des tests.

## 8. Pour aller plus loin

- **Pre-commit hook avec husky + lint-staged** :
  ```bash
  npm install --save-dev husky lint-staged
  npx husky init
  echo 'npx lint-staged' > .husky/pre-commit
  ```
  Plus jamais de PR avec un `console.log` qui traîne ou un `any` oublié.

- **CI GitHub Actions** : `.github/workflows/check.yml` qui lance `npm run check` à chaque push. La PR est bloquée si rouge.

- **Mutation testing avec [Stryker](https://stryker-mutator.io/)** : modifie ton code pour vérifier que tes tests le détectent. Une suite à 100 % coverage peut être défaillante si elle n'asserte rien — Stryker te dit lesquelles.

- **TSDoc sur les fonctions publiques** :
  ```ts
  /**
   * Calcule la remise totale (code promo + bonus VIP éventuel).
   * @param subtotalCents - Sous-total HT en centimes.
   * @param code - Code promo (`SUMMER10`, `WELCOME20`, …) ou `undefined`.
   * @param user - Utilisateur courant ou `undefined` (anonyme).
   * @returns Remise en centimes, plafonnée au `subtotalCents`.
   */
  export function computeDiscount(...)
  ```
  Auto-doc générable avec TypeDoc.

- **Validation runtime avec Zod** quand le module devient une API. `OrderInputSchema.parse(input)` te garantit que le runtime correspond au type — utile dès qu'un client externe peut t'envoyer du JSON.

- **Externaliser les `PROMO_CODES`** vers une DB ou un fichier JSON quand le métier veut les éditer sans déployer. Trade-off : tu perds la vérification TS d'exhaustivité, tu gagnes l'agilité.

- **Mesurer les performances** avec [`vitest bench`](https://vitest.dev/guide/features.html#benchmarking) sur `computeOrderTotal` — utile si l'orchestrateur est appelé 10 K fois/seconde dans une API.
