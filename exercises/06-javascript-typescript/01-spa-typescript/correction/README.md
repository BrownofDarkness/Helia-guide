# Correction — SPA TypeScript

> SPA complète, ~250 lignes de TS, **0 framework, 0 `any`**. Tu vas voir ce que React, Vue, Svelte t'épargnent — et ce que tu peux faire sans eux pour des projets de petite à moyenne taille.
>
> Lis-la **après avoir tenté le canevas**, sinon tu te prives de la moitié de l'apprentissage.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Architecture en 4 modules](#2-architecture-en-4-modules)
3. [Le store réactif — 27 lignes](#3-le-store-réactif--27-lignes)
4. [Le router — pattern matching maison](#4-le-router--pattern-matching-maison)
5. [Fetch typé — Zod et AbortController](#5-fetch-typé--zod-et-abortcontroller)
6. [Validation : 11/11 tests](#6-validation--1111-tests)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin (et où s'arrête le sans-framework)](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
npm install
npm run dev          # http://localhost:5173 (HMR via Vite)
npm run build        # → dist/ (SPA statique, ~70 kB JS gzippé)
npm run typecheck    # tsc --noEmit, 0 erreur
```

Tests :

```bash
cd ../tests/
npm install
npm test             # 11/11 (Store + favorites + router.compile)
```

## 2. Architecture en 4 modules

```
src/
├── api.ts        ← fetch typé + validation Zod (35 lignes)
├── store.ts      ← Observable<T> + favorites + persistance localStorage (60 lignes)
├── router.ts     ← compile pattern, navigate, popstate, intercept clics (70 lignes)
├── main.ts       ← wire les routes (15 lignes)
└── views/
    ├── list.ts       ← liste paginée + AbortController (50 lignes)
    ├── detail.ts     ← détail + bouton favori réactif via subscribe (40 lignes)
    └── favorites.ts  ← Promise.all sur tous les favoris (30 lignes)
```

Total : ~300 lignes pour une SPA complète. À titre de comparaison, le même projet en **React + React Router + TanStack Query** ferait ~150 lignes (les abstractions sont plus puissantes) mais cacherait toute la mécanique sous le tapis.

L'enseignement : **les frameworks ne font pas magie**. Ils encapsulent ces ~300 lignes (et beaucoup d'autres optimisations) pour que tu n'aies pas à les écrire.

## 3. Le store réactif — 27 lignes

```ts
type Listener<T> = (value: T) => void;

export class Store<T> {
  private value: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) { this.value = initial; }

  get(): T { return this.value; }

  set(next: T): void {
    this.value = next;
    for (const fn of this.listeners) fn(next);
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    fn(this.value);              // ← appel initial
    return () => { this.listeners.delete(fn); };
  }
}
```

### 3.1 Pourquoi `Set` et pas `Array` pour les listeners ?

`Set` permet `add`/`delete` en O(1) sans gérer les doublons à la main. Avec un `Array`, on aurait `array.push` puis `array.splice(array.indexOf(fn), 1)` — plus long et O(n).

### 3.2 Pourquoi `subscribe` appelle `fn(value)` immédiatement ?

C'est le pattern Signal/Observable classique : *« tiens, voici l'état actuel. Maintenant je te préviens si ça change. »* Sans cet appel initial, le composant qui s'abonne ne saurait pas l'état au moment de l'abonnement et devrait `s.get()` à la main.

### 3.3 Pourquoi `subscribe` retourne une fonction de désabonnement ?

C'est l'**interface idiomatique** depuis RxJS jusqu'à React Hooks (`useEffect` retourne un cleanup). Un composant qui s'abonne dans son `mount` et appelle le cleanup dans son `unmount` ne fuite pas de mémoire.

### 3.4 Persistance via subscribe — le pattern caché

```ts
export const favorites = new Store<number[]>(loadFavorites());
favorites.subscribe(saveFavorites);
```

**Une ligne** suffit pour que chaque modification du store soit auto-sauvegardée. Pas de `set` + `save` à chaque endroit qui mute. C'est le pattern **« derived effects »** que React (`useEffect([dep])`) ou Svelte (`$:`) ont rendu mainstream.

## 4. Le router — pattern matching maison

```ts
function compile(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexSource = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return { pattern: new RegExp(`^${regexSource}$`), paramNames };
}
```

### 4.1 Comment ça marche

`compile('/pokemon/:id')` → :
```js
{ pattern: /^\/pokemon\/([^/]+)$/, paramNames: ['id'] }
```

Quand on resolve l'URL `/pokemon/42` :
```js
match = pattern.exec('/pokemon/42')  // → ['/pokemon/42', '42']
params = { id: '42' }                 // paramNames[0] -> match[1]
```

### 4.2 Trois pièges que beaucoup ratent

```ts
// 1. Les ancres ^...$ obligatoires
new RegExp(`^${regexSource}$`)
//          ↑↑           ↑↑
// Sans ^ et $, '/pokemon/:id' matcherait '/old/pokemon/42/comments' aussi.

// 2. [^/]+ et pas .+
return '([^/]+)';
// .+ matcherait '42/foo' (slash inclus). [^/]+ s'arrête au /.

// 3. paramNames doit être indexé en parallèle, pas par regex
r.paramNames.forEach((name, i) => {
  const captured = match[i + 1];        // ← +1 parce que match[0] = full match
  if (captured !== undefined) params[name] = captured;
});
```

### 4.3 Intercept des clics

```ts
document.body.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const link = target.closest('a[data-link]');
  if (link instanceof HTMLAnchorElement) {
    e.preventDefault();
    navigate(link.getAttribute('href') ?? '/');
  }
});
```

Pourquoi `data-link` plutôt que `closest('a')` :

- **Liens externes** (`<a href="https://...">`) : on veut un vrai navigation, pas un `pushState` qui ne mène à rien sur la même origine.
- **Liens hash** (`<a href="#contact">`) : laisser le navigateur scroller, ne pas re-render la SPA.
- **Liens download** (`<a href="/file.pdf" download>`) : ne pas intercepter.

Le `data-link` opt-in est la convention la plus propre. SvelteKit et Solid font pareil avec leur propre `<a use:link>`.

### 4.4 `popstate` vs `pushState`

```ts
window.addEventListener('popstate', () => resolve(location.pathname));
```

| Event | Quand | Doit-on resolve ? |
|-------|-------|-------------------|
| `popstate` | Bouton retour/avant du navigateur | **Oui** — l'URL change tout seul, on doit re-render. |
| `pushState()` | Notre code dans `navigate()` | **Non, mais on doit appeler `resolve()` à la main**. `pushState` modifie l'URL **sans** déclencher `popstate`. |

C'est le piège #1 du routing maison : on suppose que `pushState` triggers `popstate`. Ce n'est pas le cas.

## 5. Fetch typé — Zod et AbortController

```ts
const PokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  sprites: z.object({ front_default: z.string().nullable() }),
  types: z.array(z.object({ type: z.object({ name: z.string() }) })),
  stats: z.array(z.object({
    base_stat: z.number(),
    stat: z.object({ name: z.string() }),
  })),
});

export type Pokemon = z.infer<typeof PokemonSchema>;

export async function fetchPokemon(id: number | string, signal?: AbortSignal): Promise<Pokemon> {
  const r = await fetch(`${BASE}/pokemon/${id}`, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return PokemonSchema.parse(await r.json());
}
```

### 5.1 Pourquoi Zod et pas juste `as Pokemon` ?

`as Pokemon` est un **mensonge au compilateur** : si l'API renvoie autre chose qu'attendu, TS pense que tout va bien et tu te tapes une erreur runtime obscure 5 lignes plus loin.

`PokemonSchema.parse(...)` est une **vérification runtime** : si le JSON ne match pas le schéma, ça throw immédiatement avec un message précis (`stats[2].base_stat: expected number, got string`). Tu sais en 2 secondes que l'API a changé.

C'est *la* règle d'or des fetches typés : **`unknown` + Zod**, jamais `as`.

### 5.2 `z.infer<typeof Schema>` au lieu de `interface Pokemon`

```ts
export type Pokemon = z.infer<typeof PokemonSchema>;
```

**Une seule source de vérité** : le schéma Zod. Pas de risque que `interface Pokemon` et `PokemonSchema` divergent — TS infère le type depuis le schéma.

### 5.3 AbortController dans `views/list.ts`

```ts
let currentAbort: AbortController | null = null;

async function renderList(offset: number) {
  currentAbort?.abort();              // ← annule le fetch précédent
  currentAbort = new AbortController();
  try {
    const list = await fetchList(offset, 20, currentAbort.signal);
    // …rendu…
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;  // navigation rapide, OK
    // …autre erreur, gérer…
  }
}
```

**Pourquoi annuler ?** Sans AbortController, si l'utilisateur navigue vite (`/`, puis `/pokemon/3`, puis `/`), trois fetches se lancent en parallèle. Le réseau peut les terminer dans le mauvais ordre → la vue détail s'affiche puis se fait écraser par le rendu de la liste qui finit en retard.

C'est exactement le **race condition** que TanStack Query résout en interne. Sans framework, on doit le coder.

## 6. Validation : 11/11 tests

```bash
cd ../tests/
npm test
```

Sortie observée :

```
✓ router.test.ts (4 tests) 5ms
  ✓ compile pattern statique
  ✓ compile pattern paramétré
  ✓ compile pattern multi-params
  ✓ compile pattern sans match retourne null

✓ store.test.ts (7 tests) 7ms
  ✓ get / set fonctionnent
  ✓ subscribe est appelé immédiatement avec la valeur courante
  ✓ subscribe est appelé à chaque changement
  ✓ unsubscribe arrête les notifications
  ✓ toggleFavorite ajoute si absent
  ✓ toggleFavorite retire si présent
  ✓ toggleFavorite persiste en localStorage

Test Files  2 passed (2)
     Tests  11 passed (11)
```

> ℹ️ Les tests de **vues** ne sont pas couverts unitairement (DOM, async, AbortController + jsdom = trop de friction pour un bénéfice limité). Validation visuelle via `npm run dev` + clics.

## 7. Pièges réels rencontrés

Quatre pièges concrets, deux nouveaux à capturer dans `pieges.ts` :

1. **`pushState` ne déclenche pas `popstate`** → router maison qui ne re-render qu'au bouton retour. Fix : appeler `resolve()` à la main après chaque `pushState`.
2. **`splice` mute le tableau partagé du store** → toggle qui efface tout. Fix : toujours créer un **nouveau tableau** (`filter`/`spread`).
3. **Vitest 2.x peine à charger des `.ts` cross-dir** (notre `import('../correction/src/...')`) — résolution échoue avec « Failed to load url ». Fix : `vitest.config.ts` avec `server.fs.allow` qui inclut le dossier parent.
4. **Vitest 2.x + Node 24 sans config** : Tinypool worker meurt sur jsdom (pas systématique mais on l'a vu). Vitest 3.x est plus stable — on a upgrade.

Les pièges 1 et 2 sont des classiques DOM/JS bien documentés (pas besoin d'entrée dédiée dans `pieges.ts` global). Les pièges 3 et 4 sont déjà capturés dans le piège [vitest-windows-spawn-tinypool](/pieges/) — la config `server.fs.allow` est une variante de symptôme du même fond.

## 8. Pour aller plus loin

### Et où s'arrête le sans-framework ?

Cet exercice montre qu'on **peut** écrire une SPA sans framework. Voici à quel moment ça devient une mauvaise idée :

| Tu sens le besoin de… | Ce que ce hook/lib te donne | Conclusion |
|------------------------|------------------------------|------------|
| Cacher les fetch déjà faits, dedup les requêtes parallèles | TanStack Query | Adopte. C'est 1500 lignes que tu réécrirais mal. |
| Animations de transition entre routes | View Transitions API native | Reste sans framework. C'est natif depuis 2024. |
| Composants imbriqués avec state local | React/Vue/Svelte | Adopte. La gestion fine d'arbre de composants devient un cauchemar à la main. |
| Diff DOM efficace (mille items qui changent) | lit-html / Solid | Adopte une mini-lib de templating. |
| Server-Side Rendering | Next/Nuxt/SvelteKit | Adopte. SSR à la main = plusieurs semaines de bugs. |

### Idées d'extension

- **Lazy loading des routes** :
  ```ts
  route('/favorites', async () => {
    const { renderFavorites } = await import('./views/favorites.js');
    renderFavorites();
  });
  ```
  Vite va automatiquement code-splitter, le bundle de la liste ne charge plus le code des favoris.

- **Skeleton loaders** : pendant le fetch, render un placeholder gris-clair de la forme finale. Combine avec `prefers-reduced-motion`.

- **Refais l'exo en React + TanStack Router + TanStack Query** : compare la longueur, les pièges supprimés, et ce que tu as perdu en compréhension. C'est la meilleure manière de savoir quand un framework vaut le coup.

- **View Transitions API** :
  ```ts
  document.startViewTransition(() => renderList());
  ```
  Trois lignes pour des transitions cross-page jolies. Browser-first, pas besoin de Framer Motion.
