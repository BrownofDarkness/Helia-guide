import { fetchPokemon } from '../api.js';
import { favorites } from '../store.js';

export async function renderFavorites(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  const ids = favorites.get();
  if (ids.length === 0) {
    app.innerHTML = '<p>Aucun favori. Ajoute-en depuis la liste !</p>';
    return;
  }

  app.innerHTML = '<p>Chargement des favoris…</p>';

  try {
    // TODO : fetcher les détails de chaque favori en parallèle (Promise.all)
    // Puis afficher comme la vue liste mais avec uniquement les favoris
    app.innerHTML = `<p>TODO : ${ids.length} favoris</p>`;
  } catch (err) {
    app.innerHTML = `<p>Erreur : ${(err as Error).message}</p>`;
  }
}
