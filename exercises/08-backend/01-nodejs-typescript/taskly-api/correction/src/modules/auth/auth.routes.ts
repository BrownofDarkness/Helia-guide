import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { LoginSchema, RegisterSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';
import { AuthError } from './auth.service.js';
import { signToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../lib/jwt.js';
import { requireAuth, getUserId } from '../../middleware/jwt-auth.js';
import { validate } from '../../lib/validator.js';
import { config } from '../../config.js';

const auth = new Hono();

auth.post('/register', validate('json', RegisterSchema), async (c) => {
  try {
    const user = await authService.register(c.req.valid('json'));
    return c.json(user, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: err.message }, err.status);
    }
    throw err;
  }
});

auth.post('/login', validate('json', LoginSchema), async (c) => {
  try {
    const user = await authService.login(c.req.valid('json'));
    const token = await signToken(user.id);

    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });

    return c.json(user);
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: err.message }, err.status);
    }
    throw err;
  }
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
