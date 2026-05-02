import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

export class AuthError extends Error {
  constructor(public status: 401 | 409, message: string) {
    super(message);
  }
}

export interface SafeUser {
  id: number;
  email: string;
  name: string;
}

export async function register(input: RegisterInput): Promise<SafeUser> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing[0]) {
    throw new AuthError(409, 'Email already used');
  }

  const passwordHash = await hashPassword(input.password);
  const inserted = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      passwordHash,
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  const user = inserted[0];
  if (!user) throw new Error('Insert failed');
  return user;
}

export async function login(input: LoginInput): Promise<SafeUser> {
  const rows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const user = rows[0];
  if (!user) throw new AuthError(401, 'Invalid credentials');

  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) throw new AuthError(401, 'Invalid credentials');

  return { id: user.id, email: user.email, name: user.name };
}

export async function findUserById(id: number): Promise<SafeUser | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = rows[0];
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}
