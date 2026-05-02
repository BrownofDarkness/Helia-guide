'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-6">Connexion</h1>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder='essaie "demo"'
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-red-600 text-sm">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  );
}
