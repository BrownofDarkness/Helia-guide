import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken, SESSION_COOKIE } from '../lib/jwt.js';

/**
 * À COMPLÉTER :
 * - Lire le cookie 'session'
 * - Si absent, renvoyer 401 { error: 'Unauthorized' }
 * - Vérifier le token, si invalide → 401 { error: 'Invalid token' }
 * - Si OK, stocker l'userId dans le contexte (c.set('userId', ...)) et appeler next()
 */
export const requireAuth: MiddlewareHandler = async (c, next) => {
  // TODO 3
  return c.json({ error: 'TODO' }, 401);
};

export function getUserId(c: Context): number {
  const id = c.get('userId');
  if (typeof id !== 'number') throw new Error('userId not set in context');
  return id;
}
