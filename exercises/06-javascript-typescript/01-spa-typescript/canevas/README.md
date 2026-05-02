# Canevas — SPA TypeScript

> Tu vas écrire une vraie SPA — routing, state réactif, fetches typés — **sans React, sans Vue, sans Svelte**. Juste TypeScript + DOM API + Vite.
>
> L'objectif n'est pas de réinventer React (ce serait stupide) mais de **comprendre ce qu'il fait** quand tu fais `useState` + `useEffect`. Une fois que tu auras réimplémenté les briques, les frameworks deviendront limpides au lieu de magiques.

## Ce que tu vas faire

Un mini-explorateur de l'API publique [PokéAPI](https://pokeapi.co/) avec :

| Page | URL | Comportement |
|------|-----|--------------|
| Liste | `/` | Liste paginée des pokémons (nom + image) |
| Détail | `/pokemon/:id` | Stats, types, sprites + bouton favori |
| Favoris | `/favorites` | Pokémons en favori (localStorage) |

Le tout avec :
- **History API** : changement d'URL sans rechargement, bouton retour navigateur fonctionnel, URL partageable
- **Store réactif** : pattern Observable/Signal en ~20 lignes, abonnement/désabonnement
- **Fetch typé** : réponses validées par Zod, annulation via AbortController
- **TypeScript strict** : 0 `any`, `noUncheckedIndexedAccess: true`

À la fin, tu sauras pourquoi les frameworks existent (et combien de boilerplate ils suppriment) — c'est plus formateur que de les utiliser sans les comprendre.

## Pré-requis

- **Node ≥ 20** (`node --version`).
- Un éditeur avec TypeScript (VS Code par défaut).

Pas d'autre outil — tout est dans npm (Vite + Vitest + Zod).

## Démarrer

```bash
npm install
npm run dev
# → http://localhost:5173
```

Dès que tu modifies un `.ts`, Vite reload via HMR. Le typecheck tourne en parallèle dans VS Code (rouge sous les erreurs).

## Fichiers à compléter (par ordre de difficulté)

| Fichier | TODO | Difficulté |
|---------|------|------------|
| `src/store.ts` | `get` / `set` / `subscribe` + persistance localStorage des favoris | 🟢 facile |
| `src/router.ts` | `compile` pattern, `navigate`, `resolve`, listeners (popstate + clic) | 🟡 moyen |
| `src/views/list.ts` | Rendu liste + cards cliquables avec `data-link` | 🟢 facile |
| `src/views/detail.ts` | Rendu détail + bouton favori qui se met à jour via `subscribe` | 🟡 moyen |
| `src/views/favorites.ts` | `Promise.all` sur tous les favoris pour fetch en parallèle | 🟢 facile |

`src/api.ts` est **déjà complet** — les schémas Zod et les fonctions `fetchPokemon` / `fetchList` te sont fournis. Tu te concentres sur le routing et le state.

## Ordre suggéré (et pourquoi)

```
1. store.ts (sans persistance)  → comprendre Observable avant tout le reste
2. router.ts (compile + navigate + start)
3. views/list.ts                → branche router + premier rendu
4. views/detail.ts              → premier subscribe (au store favorites)
5. views/favorites.ts           → premier Promise.all
6. Persistance localStorage     → tu rajoutes après que tout marche
```

Si tu fais la persistance d'abord, tu vas debugger localStorage et store en même temps, et tu ne sauras pas d'où vient l'erreur. **Une chose à la fois.**

## TODO clés

### `store.ts`
```ts
class Store<T> {
  // get(): T
  // set(next: T): void           ← notifie tous les listeners
  // subscribe(fn): () => void    ← retourne la fonction de désabonnement
}
```

### `router.ts`
```ts
// compile('/pokemon/:id') → { pattern: /^\/pokemon\/([^/]+)$/, paramNames: ['id'] }
// navigate('/foo')        → history.pushState + resolve
// start()                 → popstate listener + click listener sur a[data-link]
```

### Le piège du clic
Le routeur intercepte les clics sur `<a data-link href="/foo">`. Sans `data-link`, le clic devient un rechargement plein. **Tu peux ajouter cet attribut à tous tes liens internes**, c'est volontaire — on garde le clic sur les liens externes natif.

## Tester

```bash
cd ../tests/
npm install
TARGET=canevas npm test     # devrait échouer au début
TARGET=correction npm test  # référence : 11/11 passent
```

11 tests Vitest sur `Store` (4 tests : get/set, subscribe immédiat, notifications, unsubscribe), `favorites` (3 tests : toggle, persistance), et `router compile` (4 tests : statique, paramétré, multi-params, no-match).

## Bloqué ?

- **`history.pushState` ne déclenche rien** → c'est normal, `pushState` modifie l'URL mais ne déclenche **pas** `popstate`. Toi, tu dois appeler `resolve()` toi-même après le `pushState`. `popstate` se déclenche **uniquement** quand l'utilisateur clique sur retour/avant.
- **Le clic sur un lien fait un rechargement complet** → tu as oublié `data-link` sur le `<a>`, ou bien `e.preventDefault()` dans le listener.
- **Bouton favori ne se met pas à jour quand on clique** → tu modifies `favorites` dans la fonction `toggleFavorite` (qui set le store), mais tu n'as **pas** appelé `subscribe` dans `views/detail.ts` pour rerender le bouton. Sans subscribe, le DOM reste figé même si le store change.
- **Le store stocke `[1, 2, 3]` puis je toggle 2 et je récupère `[]`** → tu as fait `current.splice(...)` au lieu de `current.filter(x => x !== id)`. `splice` mute le tableau **partagé** et le store ne détecte pas le changement (référence identique). Toujours créer un **nouveau tableau** avec spread/filter/map.
- **Erreur TS « Object is possibly 'undefined' » sur `match[1]`** → `noUncheckedIndexedAccess: true` est strict. Soit `match[1] ?? ''`, soit un check `if (match[1] !== undefined)`.
- **Test échoue avec `Failed to load url ../correction/src/store.ts`** → ce piège a été corrigé dans la config. Si tu repars de zéro un projet similaire, ajoute `server.fs.allow` dans `vitest.config.ts` pour autoriser les imports cross-dir. Voir [le piège correspondant](/pieges/).

## Ne commit pas

`node_modules`, `dist/`. Pas de secrets attendus pour cet exercice.
