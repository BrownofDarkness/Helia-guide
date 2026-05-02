import { getAllTasks } from '@/lib/fake-data';

export default async function TasksPage() {
  const tasks = await getAllTasks();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tâches</h1>

      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <span aria-hidden="true">{t.done ? '✅' : '⏳'}</span>
            <span className={t.done ? 'line-through opacity-60' : ''}>{t.title}</span>
            <span className="ml-auto text-xs opacity-60">{t.createdAt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
