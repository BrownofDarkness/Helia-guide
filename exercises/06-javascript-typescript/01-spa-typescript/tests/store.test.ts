import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.TARGET ?? 'correction';

const { Store, toggleFavorite, isFavorite, favorites } = await import(
  path.resolve(__dirname, `../${TARGET}/src/store.ts`)
) as typeof import('../correction/src/store.js');

describe('Store', () => {
  it('get / set fonctionnent', () => {
    const s = new Store(0);
    expect(s.get()).toBe(0);
    s.set(5);
    expect(s.get()).toBe(5);
  });

  it('subscribe est appelé immédiatement avec la valeur courante', () => {
    const s = new Store('a');
    let received: string | null = null;
    s.subscribe((v) => { received = v; });
    expect(received).toBe('a');
  });

  it('subscribe est appelé à chaque changement', () => {
    const s = new Store(0);
    const values: number[] = [];
    s.subscribe((v) => values.push(v));
    s.set(1);
    s.set(2);
    expect(values).toEqual([0, 1, 2]);
  });

  it('unsubscribe arrête les notifications', () => {
    const s = new Store(0);
    const values: number[] = [];
    const unsub = s.subscribe((v) => values.push(v));
    s.set(1);
    unsub();
    s.set(2);
    expect(values).toEqual([0, 1]);
  });
});

describe('Favorites', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset favorites en passant un tableau vide
    favorites.set([]);
  });

  it('toggleFavorite ajoute si absent', () => {
    toggleFavorite(42);
    expect(isFavorite(42)).toBe(true);
  });

  it('toggleFavorite retire si présent', () => {
    toggleFavorite(42);
    toggleFavorite(42);
    expect(isFavorite(42)).toBe(false);
  });

  it('toggleFavorite persiste en localStorage', () => {
    toggleFavorite(7);
    const stored = JSON.parse(localStorage.getItem('pokefav') ?? '[]');
    expect(stored).toContain(7);
  });
});
