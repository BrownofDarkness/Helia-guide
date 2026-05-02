import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function register(input: RegisterInput) {
  // TODO 5 : vérifier qu'aucun user n'existe avec cet email, sinon AuthError(409, 'Email already used')
  // TODO 6 : hasher le password
  // TODO 7 : insérer en DB et retourner { id, email, name }
  throw new Error('TODO');
}

export async function login(input: LoginInput) {
  // TODO 8 : trouver le user par email. Si absent → AuthError(401, 'Invalid credentials')
  // TODO 9 : vérifier le mot de passe. Si invalide → AuthError(401, 'Invalid credentials')
  // TODO 10 : retourner { id, email, name }
  throw new Error('TODO');
}

export async function findUserById(id: number) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = rows[0];
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}
