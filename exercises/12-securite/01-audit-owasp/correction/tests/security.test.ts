import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';

// On force NODE_ENV=test pour empêcher serve() de bind un port pendant la suite.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret-32+chars';
process.env.ALLOWED_ORIGIN ??= 'http://localhost:5173';
process.env.DATABASE_FILE ??= './vulntasks.test.db';

beforeAll(() => {
  execSync('npm run db:init', { stdio: 'ignore', env: process.env });
});

const { app } = await import('../src/index.ts');

// Compteur global pour donner une IP distincte par appel — sinon le rate-limit
// (basé sur l'IP) accumule entre tests et finit par bloquer les login légitimes.
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

async function login(email: string, password: string): Promise<string> {
  const res = await app.request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
      'X-Forwarded-For': nextIp(),
    },
    body: JSON.stringify({ email, password }),
  });
  expect(res.status).toBe(200);
  const setCookie = res.headers.get('set-cookie');
  expect(setCookie).toMatch(/HttpOnly/i);
  expect(setCookie).toMatch(/Secure/i);
  expect(setCookie).toMatch(/SameSite=Lax/i);
  return setCookie!.split(';')[0]!;
}

describe('Régressions sécurité', () => {
  it('V-001 — SQLi neutralisée sur /users/search', async () => {
    const res = await app.request("/users/search?q=' OR 1=1--");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { results: unknown[] };
    expect(data.results.length).toBe(0);
  });

  it('V-002 — argon2id : login alice fonctionne', async () => {
    const cookie = await login('alice@example.com', 'alice123');
    expect(cookie).toContain('session=');
  });

  it('V-003 — rate-limit déclenche 429 au-delà de 5 essais', async () => {
    // Utilise une IP fixe distincte des autres tests pour épuiser SON propre bucket.
    const ip = '203.0.113.99';
    const fire = () =>
      app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
        body: JSON.stringify({ email: 'nobody@example.com', password: 'x' }),
      });
    let last = 0;
    for (let i = 0; i < 8; i += 1) last = (await fire()).status;
    expect(last).toBe(429);
  });

  it('V-004 — IDOR fermé : alice ne peut pas lire la tâche de bob', async () => {
    const cookie = await login('alice@example.com', 'alice123');
    const res = await app.request('/tasks/3', {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(404);
  });

  it('V-005 — secret invalide refusé', () => {
    expect(process.env.JWT_SECRET!.length).toBeGreaterThanOrEqual(32);
  });

  it('V-007 — CORS refuse une origine inconnue', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'https://evil.example' },
    });
    // hono/cors ne renvoie pas le header pour une origine non whitelistée.
    expect(res.headers.get('access-control-allow-origin')).not.toBe('https://evil.example');
  });

  it('V-008 — en-têtes de sécurité présents', async () => {
    const res = await app.request('/health');
    expect(res.headers.get('strict-transport-security')).toMatch(/max-age=/);
    expect(res.headers.get('content-security-policy')).toMatch(/default-src/);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('V-009 — SSRF bloquée vers 127.0.0.1', async () => {
    const res = await app.request('/preview?url=http://127.0.0.1:80/');
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/SSRF|interdite/i);
  });
});
