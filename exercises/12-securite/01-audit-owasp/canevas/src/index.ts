import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db } from './db.ts';

// ⚠️ V-005 — A02 : secret hardcodé en clair dans le code.
const JWT_SECRET = 'super-secret-123';

const app = new Hono();

// ⚠️ V-007 — A05 : CORS trop permissif (origine *, credentials autorisés).
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  await next();
});

// ⚠️ V-008 — A05 : aucun en-tête de sécurité (HSTS, CSP, X-Frame-Options, etc.).
//                 (À comparer avec hono/secure-headers ou l'équivalent helmet.)

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

type SessionPayload = { sub: number; admin: boolean };

function readSession(c: Parameters<Parameters<typeof app.use>[1]>[0]): SessionPayload | null {
  const token = getCookie(c, 'session') ?? c.req.header('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
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

app.post('/auth/login', async (c) => {
  // ⚠️ V-003 — A07 : aucun rate-limit, brute-force possible.
  const body = (await c.req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  if (!body?.email || !body?.password) {
    return c.json({ error: 'email et password requis' }, 400);
  }

  // ⚠️ V-002 — A07 : mots de passe stockés en MD5 (cassable trivialement).
  const result = await db.execute({
    sql: 'SELECT id, password_md5, is_admin FROM users WHERE email = ?',
    args: [body.email],
  });
  const user = result.rows[0] as unknown as
    | { id: number; password_md5: string; is_admin: number }
    | undefined;

  if (!user || user.password_md5 !== md5(body.password)) {
    return c.json({ error: 'Identifiants invalides' }, 401);
  }

  const token = jwt.sign(
    { sub: user.id, admin: Boolean(user.is_admin) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // ⚠️ V-006 — A05 : cookie sans HttpOnly / Secure / SameSite.
  setCookie(c, 'session', token);

  return c.json({ token });
});

// -------------------------------------------------------------
// Users
// -------------------------------------------------------------

app.get('/users/search', async (c) => {
  const q = c.req.query('q') ?? '';
  // ⚠️ V-001 — A03 : SQL Injection — concaténation directe (libsql exécute
  // une string brute exactement comme better-sqlite3 — l'injection passe).
  const sql = `SELECT id, email, name FROM users WHERE name LIKE '%${q}%' OR email LIKE '%${q}%'`;
  try {
    const result = await db.execute(sql);
    return c.json({ results: result.rows });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// -------------------------------------------------------------
// Tasks
// -------------------------------------------------------------

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

  // ⚠️ V-004 — A01 : IDOR — n'importe quel utilisateur authentifié peut lire
  //                  la tâche d'un autre utilisateur.
  const id = Number(c.req.param('id'));
  const result = await db.execute({
    sql: 'SELECT id, user_id, title, done, created_at FROM tasks WHERE id = ?',
    args: [id],
  });
  const task = result.rows[0];
  if (!task) return c.json({ error: 'Introuvable' }, 404);
  return c.json({ task });
});

app.post('/tasks', async (c) => {
  const session = readSession(c);
  if (!session) return c.json({ error: 'Non authentifié' }, 401);
  const body = (await c.req.json().catch(() => null)) as { title?: string } | null;
  if (!body?.title) return c.json({ error: 'title requis' }, 400);
  const result = await db.execute({
    sql: 'INSERT INTO tasks (user_id, title) VALUES (?, ?)',
    args: [session.sub, body.title],
  });
  return c.json({ id: Number(result.lastInsertRowid) }, 201);
});

// -------------------------------------------------------------
// Admin (bonus : pas de log)
// -------------------------------------------------------------

app.get('/admin/users', async (c) => {
  const session = readSession(c);
  if (!session?.admin) return c.json({ error: 'Réservé admin' }, 403);
  // Bonus A09 : aucun log d'accès admin n'est émis.
  const result = await db.execute('SELECT id, email, name, is_admin FROM users');
  return c.json({ users: result.rows });
});

// -------------------------------------------------------------
// Bonus : SSRF — endpoint preview qui fetch n'importe quelle URL
// -------------------------------------------------------------

app.get('/preview', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.json({ error: 'url requis' }, 400);
  // Bonus V-009 — A10 : SSRF — pas de filtrage, l'attaquant peut atteindre
  //                   les métadonnées cloud (169.254.169.254), localhost, etc.
  try {
    const res = await fetch(url);
    const text = await res.text();
    return c.json({ status: res.status, body: text.slice(0, 500) });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// -------------------------------------------------------------
// Boot
// -------------------------------------------------------------

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`VulnTasks (canevas) — http://localhost:${port}`);

export { app };
