type Listener<T> = (value: T) => void;

export class Store<T> {
  private value: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.value = initial;
  }

  get(): T {
    return this.value;
  }

  set(next: T): void {
    this.value = next;
    for (const fn of this.listeners) fn(next);
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    fn(this.value);
    return () => {
      this.listeners.delete(fn);
    };
  }
}

const KEY = 'pokefav';

function loadFavorites(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(n => typeof n === 'number')) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: number[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(favs));
  } catch {
    // Quota dépassé ou storage indisponible — silencieux
  }
}

export const favorites = new Store<number[]>(loadFavorites());

favorites.subscribe(saveFavorites);

export function toggleFavorite(id: number): void {
  const current = favorites.get();
  if (current.includes(id)) {
    favorites.set(current.filter(x => x !== id));
  } else {
    favorites.set([...current, id]);
  }
}

export function isFavorite(id: number): boolean {
  return favorites.get().includes(id);
}
