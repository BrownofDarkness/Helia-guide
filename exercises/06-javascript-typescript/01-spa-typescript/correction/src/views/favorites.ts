import { fetchPokemon } from '../api.js';
import { favorites } from '../store.js';

export async function renderFavorites(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  const ids = favorites.get();
  if (ids.length === 0) {
    app.innerHTML = '<h1>Mes favoris</h1><p>Aucun favori pour l\'instant. Ajoute-en depuis la liste !</p>';
    return;
  }

  app.innerHTML = '<p>Chargement des favoris…</p>';

  try {
    const pokemons = await Promise.all(ids.map(id => fetchPokemon(id)));
    app.innerHTML = `
      <h1>Mes favoris (${pokemons.length})</h1>
      <div class="grid">
        ${pokemons.map(p => `
          <div class="card">
            <a href="/pokemon/${p.id}" data-link>
              <img src="${p.sprites.front_default ?? ''}" alt="${p.name}" loading="lazy" width="96" height="96" />
              <p>${p.name}</p>
            </a>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<p>Erreur : ${(err as Error).message}</p>`;
  }
}
