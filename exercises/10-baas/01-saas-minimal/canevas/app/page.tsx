import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <header className="absolute top-4 right-4">
        <SignedOut>
          <SignInButton>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Se connecter
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>

      <h1 className="text-5xl font-bold mb-4">Tasky Pro</h1>
      <p className="text-xl mb-8 opacity-80">
        Le SaaS de tâches que personne ne demandait.
      </p>

      <div className="flex gap-4">
        <SignedOut>
          <SignInButton>
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
              Commencer gratuitement
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
          >
            Mon tableau de bord
          </Link>
        </SignedIn>
      </div>

      <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-bold">Free</h2>
          <p className="text-3xl mt-2">0 €</p>
          <p className="opacity-80 mt-2">3 tâches max — pour commencer.</p>
        </div>
        <div className="p-6 border-2 border-blue-600 rounded-lg">
          <h2 className="text-2xl font-bold">Pro</h2>
          <p className="text-3xl mt-2">9 €/mois</p>
          <p className="opacity-80 mt-2">Tâches illimitées + tags + filtres avancés.</p>
        </div>
      </section>
    </main>
  );
}
