/**
 * Vue liste — affiche les premiers pokémons avec lazy fetch.
 * À COMPLÉTER.
 */

import { fetchList, idFromUrl } from '../api.js';

let currentController: AbortController | null = null;

export async function renderList(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  // TODO 1 : annuler la requête précédente si elle existe
  // currentController?.abort();
  // currentController = new AbortController();

  app.innerHTML = '<p>Chargement…</p>';

  try {
    // TODO 2 : appeler fetchList avec le signal
    // TODO 3 : afficher la liste sous forme de cards avec liens vers /pokemon/:id (data-link)
    app.innerHTML = '<p>TODO : afficher la liste</p>';
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    app.innerHTML = `<p>Erreur : ${(err as Error).message}</p>`;
  }
}
