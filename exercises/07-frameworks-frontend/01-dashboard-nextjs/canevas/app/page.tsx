import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>

      <h1 className="text-5xl font-bold mb-4">Tasky</h1>
      <p className="text-xl mb-8 opacity-80">Le dashboard de tâches que personne ne demandait</p>

      <Link
        href="/login"
        className="px-6 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
      >
        Se connecter
      </Link>

      <p className="mt-8 text-sm opacity-60">
        Cette page est un Server Component — 0 JS expédié pour la rendre.
      </p>
    </main>
  );
}
