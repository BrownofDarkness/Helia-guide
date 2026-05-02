/**
 * Point d'entrée — assemble le router et les vues.
 *
 * À COMPLÉTER : wirer les routes une fois que router.ts et store.ts sont OK.
 */

import { route, start, setNotFound } from './router.js';
import { renderList } from './views/list.js';
import { renderDetail } from './views/detail.js';
import { renderFavorites } from './views/favorites.js';

route('/', () => renderList());
route('/pokemon/:id', ({ id }) => renderDetail(id));
route('/favorites', () => renderFavorites());

setNotFound(() => {
  const app = document.getElementById('app');
  if (app) app.innerHTML = '<h1>404 — Page introuvable</h1>';
});

start();
