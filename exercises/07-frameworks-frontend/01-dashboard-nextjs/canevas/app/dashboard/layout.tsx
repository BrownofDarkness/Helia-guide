import Link from 'next/link';
import { logoutAction } from '../login/actions';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <Link href="/dashboard" className="hover:underline">Tableau de bord</Link>
          <Link href="/dashboard/tasks" className="hover:underline">Tâches</Link>
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="text-sm hover:underline">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
