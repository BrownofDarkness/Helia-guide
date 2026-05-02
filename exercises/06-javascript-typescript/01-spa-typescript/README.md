# Exercice 6.1 — SPA TypeScript pur (sans framework)

> **Axe** : 6 — JavaScript & TypeScript
> **Difficulté** : avancé
> **Durée estimée** : 6 à 12 heures
> **Prérequis** : axe 6 lu, **Node.js ≥ 20** (voir ci-dessous)

## ⚙️ Avant de commencer — outils nécessaires

### Node.js ≥ 20

Si pas installé, voir la section [« Installer Node.js »](../../02-web/01-mini-curl/README.md#-avant-de-commencer--installer-nodejs) de l'exercice 2.1.

```bash
node --version       # v20.x.x ou plus récent
```

Pas d'autre outil — tout est dans npm (Vite + Vitest).

## 🎯 Objectifs pédagogiques

- Implémenter un **routeur côté client** avec History API
- Construire un **store réactif** simple (pattern Observable / Signal)
- Faire des **fetches typés** validés par Zod
- Utiliser TypeScript **strict** (avec `noUncheckedIndexedAccess`)
- Comprendre, par soustraction, ce que les frameworks (React, Vue) apportent

## 📋 Énoncé

Tu vas construire un mini-explorateur de l'API publique [PokéAPI](https://pokeapi.co/) :

1. **Page liste** (`/`) — liste paginée des pokémons (nom + image).
2. **Page détail** (`/pokemon/:id`) — détail d'un pokémon (stats, types, sprites).
3. **Page favoris** (`/favorites`) — pokémons mis en favori (persistés en localStorage).

**Sans React, sans Vue, sans Svelte.** Juste TypeScript + Vite + Zod + DOM API.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| **Routing** | Changement d'URL via clic sans rechargement (`history.pushState`) |
| **Routing** | Bouton retour navigateur fonctionnel (`popstate`) |
| **Routing** | URL partageable (un copier-coller affiche la bonne page) |
| **Store** | Pattern Observable/Signal avec souscription/désouscription |
| **Store** | Composants se re-render sur changement |
| **Fetch** | Réponse API validée par Zod (rejet propre si l'API change) |
| **Fetch** | Annulation via AbortController quand on quitte la page |
| **Persistance** | Favoris en localStorage, restaurés au rechargement |
| **TypeScript** | `strict: true`, **0 `any`** |
| **Build** | `vite build` produit une SPA statique |

### Bonus

- Loading skeletons pendant le fetch.
- Erreurs réseau gérées avec retry.
- Mode sombre via `prefers-color-scheme`.
- Lazy loading des routes (dynamic import).

## 🛠 Comment commencer

```bash
cd canevas/
npm install
npm run dev
# http://localhost:5173
```

Le canevas contient :

- `src/router.ts` — squelette de router à compléter
- `src/store.ts` — squelette de store réactif
- `src/api.ts` — fetch typé (avec schémas Zod déjà fournis)
- `src/views/` — vues de chaque route à implémenter
- `index.html` + `src/main.ts` — point d'entrée

## 🧪 S'auto-valider

```bash
cd tests/
npm install
npm test
```

8 tests Vitest sur le router et le store (les vues ne sont pas testées unitairement — on les valide à l'œil).

## 💡 Indices

<details>
<summary>1. Comment écrire un routeur côté client minimal ?</summary>

```ts
type Route = { path: string; render: (params: Record<string, string>) => void };

const routes: Route[] = [
  { path: '/', render: () => renderList() },
  { path: '/pokemon/:id', render: ({ id }) => renderDetail(id) },
];

function navigate(path: string) {
  history.pushState({}, '', path);
  resolve(path);
}

function resolve(path: string) {
  for (const route of routes) {
    const params = match(route.path, path);
    if (params) return route.render(params);
  }
  // 404
}

window.addEventListener('popstate', () => resolve(location.pathname));

document.body.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement).closest('a[data-link]');
  if (link) {
    e.preventDefault();
    navigate(link.getAttribute('href')!);
  }
});
```
</details>

<details>
<summary>2. Comment faire un store observable typé ?</summary>

```ts
type Listener<T> = (value: T) => void;

class Store<T> {
  private value: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.value = initial;
  }

  get(): T { return this.value; }

  set(next: T) {
    this.value = next;
    this.listeners.forEach(fn => fn(next));
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    fn(this.value);   // appel initial
    return () => this.listeners.delete(fn);
  }
}

const favorites = new Store<number[]>([]);
const unsub = favorites.subscribe((value) => {
  document.querySelector('#fav-count')!.textContent = String(value.length);
});
```
</details>

<details>
<summary>3. Comment valider une réponse API avec Zod ?</summary>

```ts
import { z } from 'zod';

const PokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  sprites: z.object({ front_default: z.string().nullable() }),
});

type Pokemon = z.infer<typeof PokemonSchema>;

async function fetchPokemon(id: number, signal: AbortSignal): Promise<Pokemon> {
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return PokemonSchema.parse(await r.json());
}
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — solution complète avec router, store, vues, persistance.

## 📚 Pour aller plus loin

- Refais le même exercice avec **React** + TanStack Router → tu verras combien de boilerplate disparaît.
- Ajoute du **routing préfixe** pour gérer un sous-dossier (`/v2/...`).
- Implémente un système de **transitions** entre vues avec `view-transition-name`.
