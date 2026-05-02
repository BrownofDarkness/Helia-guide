import { fetchPokemon, type Pokemon } from '../api.js';
import { isFavorite, toggleFavorite, favorites } from '../store.js';

let unsubscribe: (() => void) | null = null;

export async function renderDetail(id: string): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  // Nettoyer la souscription précédente
  unsubscribe?.();
  unsubscribe = null;

  app.innerHTML = '<p>Chargement…</p>';

  try {
    const p = await fetchPokemon(id);
    paint(app, p);

    // Mettre à jour le bouton favori en réaction aux changements du store
    unsubscribe = favorites.subscribe(() => updateFavButton(p.id));
  } catch (err) {
    app.innerHTML = `<p>Erreur : ${(err as Error).message}</p>`;
  }
}

function paint(app: HTMLElement, p: Pokemon): void {
  const fav = isFavorite(p.id);
  app.innerHTML = `
    <a href="/" data-link>← Retour</a>
    <h1>${p.name} <small>#${p.id}</small></h1>
    <img src="${p.sprites.front_default ?? ''}" alt="${p.name}" width="200" height="200" />
    <p><strong>Types :</strong> ${p.types.map(t => t.type.name).join(', ')}</p>
    <h2>Stats</h2>
    <ul class="stats">
      ${p.stats.map(s => `<li><span>${s.stat.name}</span><strong>${s.base_stat}</strong></li>`).join('')}
    </ul>
    <button id="fav-btn" class="fav ${fav ? 'active' : ''}" type="button">
      ${fav ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}
    </button>
  `;

  document.getElementById('fav-btn')?.addEventListener('click', () => toggleFavorite(p.id));
}

function updateFavButton(id: number): void {
  const btn = document.getElementById('fav-btn');
  if (!btn) return;
  const fav = isFavorite(id);
  btn.classList.toggle('active', fav);
  btn.textContent = fav ? '★ Retirer des favoris' : '☆ Ajouter aux favoris';
}
