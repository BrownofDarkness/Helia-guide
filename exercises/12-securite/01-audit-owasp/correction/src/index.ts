import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { setCookie, getCookie } from 'hono/cookie';
import { verify as argonVerify } from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from './db.ts';
import { env } from './env.ts';
import { rateLimit } from './rate-limit.ts';
import { assertSafeUrl } from './ssrf.ts';

const app = new Hono();

// ✅ V-008 — A05 : en-têtes de sécurité (HSTS, CSP, X-Frame-Options, etc.).
app.use('*', secureHeaders({
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
  xFrameOptions: 'DENY',
  referrerPolicy: 'no-referrer',
}));

// ✅ V-007 — A05 : CORS restreint à une origine de confiance, methods et headers explicites.
app.use('*', cors({
  origin: env.ALLOWED_ORIGIN,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

// Audit log basique des accès admin (V-010 bonus A09).
function auditLog(event: string, payload: Record<string, unknown>): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...payload }));
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

type SessionPayload = { sub: number; admin: boolean };

function readSession(c: Parameters<Parameters<typeof app.use>[1]>[0]): SessionPayload | null {
  const token = getCookie(c, 'session') ?? c.req.header('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Health
// -------------------------------------------------------------

app.get('/health', (c) => c.json({ status: 'ok' }));

// -------------------------------------------------------------
// Auth
// -------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

// ✅ V-003 — A07 : rate-limit (5 tentatives / minute / IP) sur /auth/login.
app.post(
  '/auth/login',
  rateLimit({ windowMs: 60_000, max: 5 }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'email et password requis' }, 400);

    // ✅ V-001 — A03 : requête paramétrée (`?` au lieu d'une concaténation).
    // ✅ V-002 — A07 : argon2id (résistant GPU/ASIC).
    const result = await db.execute({
      sql: 'SELECT id, password_hash, is_admin FROM users WHERE email = ?',
      args: [parsed.data.email],
    });
    const user = result.rows[0] as unknown as
      | { id: number; password_hash: string; is_admin: number }
      | undefined;

    // Réponse uniforme pour éviter d'indiquer si l'email existe.
    const ok = user && (await argonVerify(user.password_hash, parsed.data.password));
    if (!ok || !user) {
      return c.json({ error: 'Identifiants invalides' }, 401);
    }

    // ✅ V-005 — A02 : secret lu dans env.JWT_SECRET (validé Zod, jamais hardcodé).
    const token = jwt.sign(
      { sub: user.id, admin: Boolean(user.is_admin) },
      env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    // ✅ V-006 — A05 : cookie HttpOnly + Secure + SameSite=Lax.
    setCookie(c, 'session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ ok: true });
  }
);

// -------------------------------------------------------------
// Users
// -------------------------------------------------------------

app.get('/users/search', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (q.length === 0 || q.length > 64) {
    return c.json({ error: 'q : 1 à 64 caractères' }, 400);
  }
  // ✅ V-001 — A03 : requête paramétrée + LIKE avec placeholder.
  const result = await db.execute({
    sql: 'SELECT id, email, name FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 20',
    args: [`%${q}%`, `%${q}%`],
  });
  return c.json({ results: result.rows });
});

// -------------------------------------------------------------
// Tasks
// -------------------------------------------------------------

const createTaskSchema = z.object({ title: z.string().min(1).max(200) });

app.get('/tasks', async (c) => {
  const session = readSession(c);
  if (!session) return c.json({ error: 'Non authentifié' }, 401);
  const result = await db.execute({
    sql: 'SELECT id, title, done, created_at FROM tasks WHERE user_id = ? ORDER BY id DESC',
    args: [session.sub],
  });
  return c.json({ tasks: result.rows });
});

app.get('/tasks/:id', async (c) => {
  const session = readSession(c);
  if (!session) return c.json({ error: 'Non authentifié' }, 401);

  // ✅ V-004 — A01 : la tâche n'est servie que si elle appartient à l'utilisateur.
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'id invalide' }, 400);

  const result = await db.execute({
    sql: 'SELECT id, title, done, created_at FROM tasks WHERE id = ? AND user_id = ?',
    args: [id, session.sub],
  });
  const task = result.rows[0];
  if (!task) return c.json({ error: 'Introuvable' }, 404);
  return c.json({ task });
});

app.post('/tasks', async (c) => {
  const session = readSession(c);
  if (!session) return c.json({ error: 'Non authentifié' }, 401);
  const body = await c.req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'title requis' }, 400);
  const result = await db.execute({
    sql: 'INSERT INTO tasks (user_id, title) VALUES (?, ?)',
    args: [session.sub, parsed.data.title],
  });
  return c.json({ id: Number(result.lastInsertRowid) }, 201);
});

// -------------------------------------------------------------
// Admin (avec log)
// -------------------------------------------------------------

app.get('/admin/users', async (c) => {
  const session = readSession(c);
  if (!session?.admin) return c.json({ error: 'Réservé admin' }, 403);
  // ✅ Bonus V-010 — A09 : tracer chaque accès admin.
  auditLog('admin.users.list', { actor: session.sub });
  const result = await db.execute('SELECT id, email, name, is_admin FROM users');
  return c.json({ users: result.rows });
});

// -------------------------------------------------------------
// Bonus : preview anti-SSRF
// -------------------------------------------------------------

app.get('/preview', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.json({ error: 'url requis' }, 400);
  // ✅ Bonus V-009 — A10 : valide protocole + bloque IPs privées + métadonnées cloud.
  let safe: URL;
  try {
    safe = await assertSafeUrl(url);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3_000);
    const res = await fetch(safe, {
      redirect: 'manual',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    return c.json({ status: res.status, body: text.slice(0, 500) });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 502);
  }
});

// -------------------------------------------------------------
// Boot
// -------------------------------------------------------------

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port: env.PORT });
  console.log(`VulnTasks (correction) — http://localhost:${env.PORT}`);
}

export { app };
