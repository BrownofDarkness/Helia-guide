import { getStats } from '@/lib/fake-data';

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Terminées" value={stats.done} accent="text-green-600" />
        <StatCard label="En attente" value={stats.pending} accent="text-orange-600" />
      </div>

      <p className="mt-8 text-sm opacity-60">
        Cette page est un Server Component : la requête `getStats()` est exécutée côté serveur
        et seule la HTML est envoyée au client.
      </p>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm opacity-70">{label}</p>
      <p className={`text-4xl font-bold mt-2 ${accent ?? ''}`}>{value}</p>
    </div>
  );
}
