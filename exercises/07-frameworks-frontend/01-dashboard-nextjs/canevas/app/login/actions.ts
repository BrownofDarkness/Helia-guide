'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // TODO 2 : valider le mot de passe (== "demo"), sinon renvoyer { error: '...' }
  // Indice : récupérer formData.get('password')

  // TODO 3 : poser un cookie 'session' avec httpOnly, sameSite: 'lax', path: '/'
  // Indice : const cookieStore = await cookies(); cookieStore.set(...)

  // TODO 4 : rediriger vers /dashboard
  // Indice : redirect('/dashboard')

  return { error: 'TODO : implémenter loginAction' };
}

export async function logoutAction() {
  // TODO 5 : supprimer le cookie 'session' et rediriger vers '/'
}
