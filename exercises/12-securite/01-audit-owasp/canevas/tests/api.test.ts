import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { app } from '../src/index.ts';

beforeAll(() => {
  // Prépare la base avant les tests.
  execSync('npm run db:init', { stdio: 'ignore' });
});

describe('Canevas — exposition volontaire de failles', () => {
  it('login répond 200 avec alice/alice123', async () => {
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'alice123' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { token: string };
    expect(data.token).toBeTruthy();
  });

  it('GET /users/search est exploitable via SQLi', async () => {
    const res = await app.request("/users/search?q=' OR 1=1--");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { results: unknown[] };
    // 3 utilisateurs en base, l'injection retourne tout.
    expect(data.results.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /health répond ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
  });
});
