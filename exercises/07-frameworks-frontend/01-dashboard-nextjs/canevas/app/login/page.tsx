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

        {/* TODO 6 : formulaire avec action={formAction}
            - input email (label associé)
            - input password (label associé) — placeholder "essaie \"demo\""
            - bouton submit avec state pending (disabled, "Connexion...")
            - afficher state.error en rouge si présent
        */}

        <form action={formAction}>
          <p className="text-red-600">TODO : implémenter le formulaire</p>
        </form>
      </div>
    </main>
  );
}
