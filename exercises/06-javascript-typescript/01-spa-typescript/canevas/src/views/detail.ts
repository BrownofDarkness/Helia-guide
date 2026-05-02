import { fetchPokemon } from '../api.js';
import { isFavorite, toggleFavorite, favorites } from '../store.js';

export async function renderDetail(id: string): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = '<p>Chargement…</p>';

  try {
    const p = await fetchPokemon(id);
    // TODO : afficher le détail (image, types, stats) + bouton favori
    // Le bouton doit appeler toggleFavorite(p.id)
    // S'abonner à favorites.subscribe pour mettre à jour le bouton en live
    app.innerHTML = `<h1>${p.name}</h1><p>TODO : détails</p>`;
  } catch (err) {
    app.innerHTML = `<p>Erreur : ${(err as Error).message}</p>`;
  }
}
