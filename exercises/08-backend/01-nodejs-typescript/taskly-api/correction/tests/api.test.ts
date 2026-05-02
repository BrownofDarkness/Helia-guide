/**
 * Tests d'intégration de taskly-api.
 * Utilise une DB SQLite éphémère par run via DATABASE_URL=:memory: avant import.
 */
import { describe, it, expect, beforeAll } from 'vitest';

// Configurer l'env AVANT d'importer createApp (qui lit la config)
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret-min-16-chars-long';

const { createApp } = await import('../src/app.js');
const app = createApp();

function getCookieFromResponse(res: Response): string | null {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/session=([^;]+)/);
  return match ? `session=${match[1]}` : null;
}

describe('taskly-api', () => {
  let aliceCookie: string;
  let bobCookie: string;

  it('GET /health → 200 + db ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; db: string };
    expect(data.status).toBe('ok');
    expect(data.db).toBe('ok');
  });

  it('POST /auth/register → 201 + user', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', name: 'Alice', password: 'password123' }),
    });
    expect(res.status).toBe(201);
    const user = (await res.json()) as { id: number; email: string; name: string };
    expect(user.email).toBe('alice@example.com');
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('POST /auth/register avec email existant → 409', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', name: 'Alice', password: 'password123' }),
    });
    expect(res.status).toBe(409);
  });

  it('POST /auth/register avec données invalides → 422', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', name: '', password: '123' }),
    });
    expect(res.status).toBe(422);
  });

  it('POST /auth/login avec bon password → 200 + cookie', async () => {
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123' }),
    });
    expect(res.status).toBe(200);
    const cookie = getCookieFromResponse(res);
    expect(cookie).not.toBeNull();
    aliceCookie = cookie!;
  });

  it('POST /auth/login avec mauvais password → 401', async () => {
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'wrong' }),
    });
    expect(res.status).toBe(401);
  });

  it('GET /auth/me sans cookie → 401', async () => {
    const res = await app.request('/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /auth/me avec cookie → 200', async () => {
    const res = await app.request('/auth/me', { headers: { Cookie: aliceCookie } });
    expect(res.status).toBe(200);
    const user = (await res.json()) as { email: string };
    expect(user.email).toBe('alice@example.com');
  });

  it('POST /tasks → 201', async () => {
    const res = await app.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: aliceCookie },
      body: JSON.stringify({ title: 'Tâche 1' }),
    });
    expect(res.status).toBe(201);
    const task = (await res.json()) as { id: number; title: string };
    expect(task.title).toBe('Tâche 1');
  });

  it('GET /tasks → liste paginée du user', async () => {
    const res = await app.request('/tasks', { headers: { Cookie: aliceCookie } });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      data: { id: number; title: string }[];
      pagination: { total: number };
    };
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.pagination.total).toBeGreaterThan(0);
  });

  it('Un user ne voit pas les tâches d\'un autre', async () => {
    // Créer Bob
    await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', name: 'Bob', password: 'password456' }),
    });
    const loginRes = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', password: 'password456' }),
    });
    bobCookie = getCookieFromResponse(loginRes)!;

    const listRes = await app.request('/tasks', { headers: { Cookie: bobCookie } });
    const data = (await listRes.json()) as { data: unknown[]; pagination: { total: number } };
    expect(data.pagination.total).toBe(0);
  });

  it('Bob ne peut pas accéder à une tâche d\'Alice → 404', async () => {
    // Récupérer une tâche d'Alice
    const aliceTasks = await app.request('/tasks', { headers: { Cookie: aliceCookie } });
    const list = (await aliceTasks.json()) as { data: { id: number }[] };
    const taskId = list.data[0]!.id;

    const res = await app.request(`/tasks/${taskId}`, { headers: { Cookie: bobCookie } });
    expect(res.status).toBe(404);
  });

  it('PATCH /tasks/:id toggle done', async () => {
    const aliceTasks = await app.request('/tasks', { headers: { Cookie: aliceCookie } });
    const list = (await aliceTasks.json()) as { data: { id: number }[] };
    const taskId = list.data[0]!.id;

    const res = await app.request(`/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: aliceCookie },
      body: JSON.stringify({ done: true }),
    });
    expect(res.status).toBe(200);
    const updated = (await res.json()) as { done: boolean };
    expect(updated.done).toBe(true);
  });

  it('DELETE /tasks/:id → 204', async () => {
    const aliceTasks = await app.request('/tasks', { headers: { Cookie: aliceCookie } });
    const list = (await aliceTasks.json()) as { data: { id: number }[] };
    const taskId = list.data[0]!.id;

    const res = await app.request(`/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Cookie: aliceCookie },
    });
    expect(res.status).toBe(204);

    const after = await app.request(`/tasks/${taskId}`, { headers: { Cookie: aliceCookie } });
    expect(after.status).toBe(404);
  });
});
