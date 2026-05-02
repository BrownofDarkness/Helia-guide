/**
 * Données simulées — fournies, pas de TODO ici.
 */

export interface Task {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

const TASKS: Task[] = [
  { id: 1, title: 'Lire l\'axe 7 du guide', done: true, createdAt: '2026-04-20' },
  { id: 2, title: 'Implémenter le dashboard Next.js', done: false, createdAt: '2026-04-21' },
  { id: 3, title: 'Faire les tests Playwright', done: false, createdAt: '2026-04-22' },
  { id: 4, title: 'Déployer sur Vercel', done: false, createdAt: '2026-04-23' },
  { id: 5, title: 'Pratiquer Tailwind', done: true, createdAt: '2026-04-19' },
];

export async function getAllTasks(): Promise<Task[]> {
  await new Promise(r => setTimeout(r, 50));   // simule la DB
  return [...TASKS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getStats(): Promise<{ total: number; done: number; pending: number }> {
  const tasks = await getAllTasks();
  return {
    total: tasks.length,
    done: tasks.filter(t => t.done).length,
    pending: tasks.filter(t => !t.done).length,
  };
}
