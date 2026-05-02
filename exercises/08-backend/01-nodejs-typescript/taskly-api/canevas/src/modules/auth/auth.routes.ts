import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie } from 'hono/cookie';
import { LoginSchema, RegisterSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';
import { signToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../lib/jwt.js';
import { requireAuth, getUserId } from '../../middleware/jwt-auth.js';
import { config } from '../../config.js';

const auth = new Hono();

auth.post('/register', zValidator('json', RegisterSchema), async (c) => {
  // TODO 11 : appeler authService.register, gérer AuthError, retourner 201 + le user
  return c.json({ error: 'TODO' }, 500);
});

auth.post('/login', zValidator('json', LoginSchema), async (c) => {
  // TODO 12 : appeler authService.login, signer un JWT, poser le cookie SESSION_COOKIE
  // Indice :
  // const token = await signToken(user.id);
  // setCookie(c, SESSION_COOKIE, token, {
  //   httpOnly: true,
  //   secure: config.NODE_ENV === 'production',
  //   sameSite: 'Lax',
  //   path: '/',
  //   maxAge: SESSION_TTL_SECONDS,
  // });
  return c.json({ error: 'TODO' }, 500);
});

auth.post('/logout', requireAuth, (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.body(null, 204);
});

auth.get('/me', requireAuth, async (c) => {
  const userId = getUserId(c);
  const user = await authService.findUserById(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});

export default auth;
