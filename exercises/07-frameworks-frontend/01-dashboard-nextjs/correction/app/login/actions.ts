'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface LoginState {
  error?: string;
}

const SESSION_MAX_AGE = 60 * 60 * 24; // 24 h

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get('password');

  if (typeof password !== 'string' || password !== 'demo') {
    return { error: 'Mot de passe incorrect — essaie « demo ».' };
  }

  const cookieStore = await cookies();
  cookieStore.set('session', `fake-${Date.now()}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/');
}
