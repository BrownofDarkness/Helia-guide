/**
 * Store réactif générique — pattern Observable.
 *
 * À COMPLÉTER aux endroits TODO.
 */

type Listener<T> = (value: T) => void;

export class Store<T> {
  private value: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.value = initial;
  }

  // TODO 1 : retourner la valeur courante
  get(): T {
    throw new Error('TODO');
  }

  // TODO 2 : mettre à jour la valeur ET notifier tous les listeners
  set(next: T): void {
    throw new Error('TODO');
  }

  // TODO 3 : ajouter un listener, l'appeler immédiatement avec la valeur courante,
  // retourner une fonction de désouscription.
  subscribe(fn: Listener<T>): () => void {
    throw new Error('TODO');
  }
}

/**
 * Store de favoris persisté en localStorage.
 *
 * À COMPLÉTER : la persistance.
 */

const KEY = 'pokefav';

function loadFavorites(): number[] {
  // TODO 4 : lire localStorage, parser le JSON, retourner [] en cas d'erreur ou d'absence
  return [];
}

function saveFavorites(favs: number[]): void {
  // TODO 5 : écrire dans localStorage en JSON
}

export const favorites = new Store<number[]>(loadFavorites());

// Quand favorites change, persister
favorites.subscribe(saveFavorites);

export function toggleFavorite(id: number): void {
  // TODO 6 : ajouter ou retirer l'id de la liste favorites
  // Astuce : favorites.set([...nouveau tableau...])
}

export function isFavorite(id: number): boolean {
  return favorites.get().includes(id);
}
