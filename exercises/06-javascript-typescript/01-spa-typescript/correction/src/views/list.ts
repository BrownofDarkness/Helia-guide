import { fetchList, idFromUrl, type ListItem } from '../api.js';

let currentController: AbortController | null = null;
let currentOffset = 0;
const PAGE_SIZE = 20;

export async function renderList(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  currentController?.abort();
  currentController = new AbortController();

  app.innerHTML = '<p>Chargement…</p>';

  try {
    const data = await fetchList(currentOffset, PAGE_SIZE, currentController.signal);
    app.innerHTML = `
      <h1>Pokémons</h1>
      <div class="grid">
        ${data.results.map(renderCard).join('')}
      </div>
      <div class="pagination">
        <button id="prev" ${data.previous ? '' : 'disabled'}>← Précédent</button>
        <button id="next" ${data.next ? '' : 'disabled'}>Suivant →</button>
      </div>
    `;

    document.getElementById('prev')?.addEventListener('click', () => {
      currentOffset = Math.max(0, currentOffset - PAGE_SIZE);
      renderList();
    });

    document.getElementById('next')?.addEventListener('click', () => {
      currentOffset += PAGE_SIZE;
      renderList();
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    app.innerHTML = `<p>Erreur : ${(err as Error).message}</p>`;
  }
}

function renderCard(item: ListItem): string {
  const id = idFromUrl(item.url);
  const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  return `
    <div class="card">
      <a href="/pokemon/${id}" data-link>
        <img src="${sprite}" alt="${item.name}" loading="lazy" width="96" height="96" />
        <p>${item.name}</p>
      </a>
    </div>
  `;
}
