import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UpgradeButton } from './upgrade-button';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  const isPro = subscription?.status === 'active';

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>

      <div className="p-6 border rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Plan actuel</h2>
        <p className="text-2xl">{isPro ? '🚀 Pro' : '🆓 Free'}</p>
        {isPro && subscription?.current_period_end && (
          <p className="text-sm opacity-70 mt-2">
            Renouvellement le {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        )}

        {!isPro && (
          <div className="mt-4">
            <UpgradeButton />
          </div>
        )}
      </div>

      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Mes tâches</h2>
        <p className="opacity-70">À implémenter — passe à Pro pour des tâches illimitées.</p>
      </div>
    </main>
  );
}
