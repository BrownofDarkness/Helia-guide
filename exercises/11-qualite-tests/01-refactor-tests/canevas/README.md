# Canevas — Refactor + tests

> Tu reçois un module de **calcul de prix e-commerce** volontairement catastrophique : 80 lignes dans une seule fonction, magic numbers partout, `any` à toutes les sauces, 0 test, 0 lint config. Ta mission : le **refactorer** en suivant la démarche professionnelle (caractériser, outiller, découper, tester) sans changer le comportement.
>
> C'est l'exercice qui apprend la discipline qui distingue un dev junior d'un senior : **on ne refactore jamais sans filet de sécurité**.

## Ce que tu vas faire

| Étape | Sortie |
|-------|--------|
| 1. **Caractérisation** | 5–10 tests Vitest qui figent le comportement actuel |
| 2. **Outils statiques** | ESLint v9 flat config + Prettier + TS strict + `noUncheckedIndexedAccess` |
| 3. **Refactor** | 6 modules cohérents (`cart`, `discount`, `vat`, `shipping`, `pricing`, `format`) |
| 4. **Tests** | 100 % de couverture significative sur `src/` |
| 5. **Doc** | README de qualité pro + 1 ADR |

À la fin, tu auras vécu :
- **Characterization Testing** : capturer un comportement avant de toucher à la moindre ligne.
- **Discriminated unions** TypeScript pour remplacer les chaînes magiques.
- **Couverture par module** plutôt que couverture globale.
- **ADR** (Architecture Decision Record) pour expliquer un choix par écrit.
- Un `npm run check` qui enchaîne lint + typecheck + tests — LE script qu'aucun projet pro n'a le droit de ne pas avoir.

## Pré-requis

- **Node ≥ 20** (`node --version`).
- Un éditeur avec ESLint + Prettier (VS Code recommandé : install les extensions, ça surligne en live).

## Démarrer

```bash
npm install
npm run dev      # exécute la démo (regarde le résultat avant de toucher au code)
```

Le code initial est dans `src/index.ts`. **Lis-le entièrement avant de commencer**. Si tu peux dire à voix haute ce que retourne `computeOrderTotal({ items: [{price:1000,qty:2}], code:'SUMMER10', user:{tier:'vip'} })`, tu es prêt à refactorer. Sinon, relis.

## Démarche en 5 étapes

### Étape 1 — Caractérisation (1 h)

**N'efface aucune ligne** au début. Au lieu de ça, écris des tests qui passent **sur le code tel qu'il est**, même bizarre :

```ts
// tests/characterization.test.ts
import { computeOrderTotal } from '../src/index';
import { describe, it, expect } from 'vitest';

it('panier 2 articles, code SUMMER10, VIP', () => {
  const r = computeOrderTotal({
    items: [{ price: 1000, qty: 2 }, { price: 2000, qty: 1 }],
    code: 'SUMMER10',
    user: { tier: 'vip' },
  });
  expect(r.subtotal).toBe(4000);
  expect(r.discount).toBe(600);   // 10 % + 5 % VIP = 15 % de 4000
  // ...
});
```

Pourquoi : **toute modif que tu feras sans casser ces tests = comportement préservé**. C'est ton filet de sécurité.

### Étape 2 — Outils statiques (30 min)

Crée les configs :

```js
// eslint.config.js (flat config v9)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1, 2, 100] }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  { files: ['tests/**/*.ts'], rules: { 'no-magic-numbers': 'off' } },
);
```

Active TS strict :

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Lance `npm run lint` et `npm run typecheck` → tu vas voir ~30 erreurs. **Ne corrige pas en touchant au code métier** ; juste les types et les `any`. Garde le comportement intact.

### Étape 3 — Refactor par étapes (2–4 h)

Découpe `src/index.ts` (80 lignes) en :

| Module | Responsabilité | Exports clés |
|--------|----------------|--------------|
| `constants.ts` | Magic numbers extraits | `VAT_RATE`, `SHIPPING_FEE_CENTS`, `FREE_SHIPPING_THRESHOLD_CENTS`, `VIP_DISCOUNT_RATE` |
| `types.ts` | Domain types | `Item`, `User`, `Order`, `OrderResult` |
| `cart.ts` | Calcul subtotal, validation items | `computeSubtotal(items)`, `validateItems(items)` |
| `discount.ts` | Codes promo + bonus VIP | `computeDiscount(subtotal, code, user)` |
| `vat.ts` | TVA | `computeVat(amount)` |
| `shipping.ts` | Frais de port | `computeShipping(subtotal)` |
| `pricing.ts` | Orchestrateur | `computeOrderTotal(input)` |
| `format.ts` | Affichage | `formatCents(cents)` |
| `index.ts` | Entry point + démo | (juste un `console.log` pour vérifier) |

**Règle d'or** : un fichier = une responsabilité. Si tu es tenté de mettre `computeShipping` dans `pricing.ts`, sépare. Tu auras besoin de tester chaque module isolément.

**Lance les tests à chaque commit**. Ils doivent rester verts. Si un test casse, ton refactor a changé le comportement → annule.

### Étape 4 — Tests par module (1 h)

Une fois découpé, écris un fichier de test par module :

```
tests/
├── cart.test.ts        ← computeSubtotal cas standard + edge (qty < 0, prix négatif, items vide)
├── discount.test.ts    ← chaque code, code inconnu, VIP, cap au subtotal
├── vat.test.ts
├── shipping.test.ts    ← juste avant et juste après le seuil 50 €
├── format.test.ts
└── pricing.test.ts     ← tests d'intégration (qui orchestrent tout)
```

Cible : **100 % de couverture** (sauf `types.ts` qui n'a pas de runtime). C'est atteignable parce que chaque module est petit.

```bash
npm run test:coverage
```

### Étape 5 — Doc (30 min)

- **README** du module : démarrage en < 5 min, structure des modules, scripts.
- **1 ADR** dans `docs/adr/0001-modular-architecture.md` qui explique pourquoi tu as découpé en 6 modules plutôt que 2 ou 12.

Format ADR (Status / Context / Decision / Consequences) — voir [adr.github.io](https://adr.github.io/).

## Vérifier

```bash
npm run lint
npm run typecheck
npm test -- --coverage
# Ou tout-en-un :
npm run check
```

Cibles :
- Lint : 0 erreur, < 5 warnings
- Typecheck : 0 erreur
- Tests : 100 % passent
- Coverage : ≥ 80 % sur `src/` (la correction atteint 100 %)

## Bloqué ?

- **Mes tests de caractérisation passent puis cassent dès que je touche au code** → tu changes le comportement par accident. Note exactement quel test casse, regarde la valeur attendue vs reçue, identifie la ligne précise. Reverse de petites modifs jusqu'à comprendre.
- **TypeScript strict me crache 30 erreurs** → c'est normal au début. Active **une option à la fois** (`strict` puis `noUncheckedIndexedAccess` puis `exactOptionalPropertyTypes`). Fixe chaque batch avant le suivant. Si tu actives tout d'un coup, tu te noies.
- **`no-magic-numbers` flagge 50 trucs dans mes tests** → normal, les tests ASSERT des littéraux. Désactive la règle pour `tests/**/*.ts` (cf. snippet § 2).
- **Je sépare en 12 modules au lieu de 6** → trop fin, c'est aussi un anti-pattern (cohésion < couplage). Règle : un module = une **responsabilité** (Cart, Discount, …), pas une fonction. `validateItems` + `computeSubtotal` peuvent vivre dans `cart.ts` ensemble.
- **Mon refactor casse parce que les tests de caractérisation testaient un bug** → bon signe ! Si le bug est mineur, tu peux le corriger ET mettre à jour le test (en commentaire : « bug fix, voir commit X »). S'il est majeur, fais-en un commit séparé après le refactor — sinon tu changes deux choses en même temps et personne ne saura ce qui a bougé.
- **Couverture stagne à 70 %** → regarde le rapport HTML (`coverage/index.html`). Les branches non couvertes sont surlignées en rouge. Souvent : la branche `else` d'un `if`, ou un `default` de switch. Ajoute le test correspondant.
- **`no-console` me flagge mon `console.log` de démo dans `index.ts`** → c'est intentionnel, c'est de la démo. Soit tu retires le démo, soit tu mets `// eslint-disable-next-line no-console` sur la ligne. Choisis selon si la démo a une valeur pédagogique.

## Comparer avec la correction

Une fois fini, regarde `../correction/` :
- 8 fichiers `src/`, 6 fichiers `tests/`
- 31 tests, 100 % coverage
- 1 ADR dans `docs/adr/`
- `npm run check` 100 % vert
- 0 `any`, 0 magic number dans le code métier

Tes choix peuvent **différer** sans être moins bons. Compare la **structure** (combien de modules, quelle granularité), pas le code ligne par ligne.

## Ne commit pas

`coverage/`, `dist/`, `node_modules/`. Tous gitignored par défaut.
