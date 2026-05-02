import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken, SESSION_COOKIE } from '../lib/jwt.js';

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const payload = await verifyToken(token);
    c.set('userId', Number(payload.sub));
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

export function getUserId(c: Context): number {
  const id = c.get('userId');
  if (typeof id !== 'number') throw new Error('userId not set in context');
  return id;
}
