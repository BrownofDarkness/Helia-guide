/**
 * Tests d'intégration de mini-curl.
 *
 * Runner custom (pas Vitest) — Vitest 2/3 + Node 24 + Windows + spawnSync ne
 * jouent pas ensemble : Tinypool meurt avec ERR_IPC_CHANNEL_CLOSED. On utilise
 * `spawn` async (et pas `spawnSync`, qui bloque l'event loop et empêche le
 * child de s'initialiser sous Windows quand parent et child importent tous
 * les deux tsx).
 *
 * Lance par défaut sur la correction. Pour tester le canevas :
 *   TARGET=canevas npm test
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.TARGET ?? 'correction';
const ENTRY = path.resolve(__dirname, `../${TARGET}/src/index.ts`);

interface TestCase {
  name: string;
  run: () => void | Promise<void>;
}

const tests: TestCase[] = [];
function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, run: fn });
}

class AssertionError extends Error {}
function assertEqual<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new AssertionError(msg ?? `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
function assertMatch(actual: string, regex: RegExp, msg?: string) {
  if (!regex.test(actual)) {
    throw new AssertionError(msg ?? `expected to match ${regex}, got "${actual.slice(0, 120)}…"`);
  }
}

interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', ENTRY, ...args],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => resolve({ status: code, stdout, stderr }));
  });
}

let server: http.Server;
let port = 0;

async function setup() {
  server = http.createServer((req, res) => {
    if (req.url === '/echo') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ method: req.method, body, headers: req.headers }));
      });
    } else if (req.url === '/redir') {
      res.writeHead(302, { Location: '/target' });
      res.end();
    } else if (req.url === '/target') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('reached');
    } else if (req.url === '/error') {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('oops');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('hello');
    }
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve();
    });
  });
}

test('GET basique → 200 et corps reçu', async () => {
  const r = await runCli([`http://127.0.0.1:${port}/`]);
  assertEqual(r.status, 0);
  assertMatch(r.stdout, /hello/);
});

test('exit code 1 sur 5xx', async () => {
  const r = await runCli([`http://127.0.0.1:${port}/error`]);
  assertEqual(r.status, 1);
});

test('exit code 2 sur erreur réseau (host invalide)', async () => {
  const r = await runCli(['http://nonexistent.invalid.test/']);
  assertEqual(r.status, 2);
});

test('-v affiche les en-têtes envoyés et reçus sur stderr', async () => {
  const r = await runCli(['-v', `http://127.0.0.1:${port}/`]);
  assertEqual(r.status, 0);
  assertMatch(r.stderr, /^> GET/m);
  assertMatch(r.stderr, /^< HTTP\/1.1 200/m);
});

test('suit les redirections 3xx', async () => {
  const r = await runCli([`http://127.0.0.1:${port}/redir`]);
  assertEqual(r.status, 0);
  assertMatch(r.stdout, /reached/);
});

test('POST avec corps et en-tête custom', async () => {
  const r = await runCli([
    '-X', 'POST',
    '-d', '{"hello":"world"}',
    '-H', 'Content-Type: application/json',
    `http://127.0.0.1:${port}/echo`,
  ]);
  assertEqual(r.status, 0);
  const body = JSON.parse(r.stdout);
  assertEqual(body.method, 'POST');
  assertEqual(body.body, '{"hello":"world"}');
  assertEqual(body.headers['content-type'], 'application/json');
});

test('-d sans -X passe automatiquement en POST', async () => {
  const r = await runCli(['-d', 'data', `http://127.0.0.1:${port}/echo`]);
  assertEqual(r.status, 0);
  const body = JSON.parse(r.stdout);
  assertEqual(body.method, 'POST');
});

test('affiche les timings en mode verbose', async () => {
  const r = await runCli(['-v', `http://127.0.0.1:${port}/`]);
  assertMatch(r.stderr, /Done in \d+ ms/);
  assertMatch(r.stderr, /TTFB:\s+\d+ ms/);
});

async function main() {
  console.log(`Tests mini-curl (cible : ${TARGET})\n`);
  await setup();

  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    try {
      await t.run();
      console.log(`  ✓ ${t.name}`);
      pass += 1;
    } catch (err) {
      console.log(`  ✗ ${t.name}`);
      console.log(`    ${(err as Error).message}`);
      fail += 1;
    }
  }

  server.close();
  console.log(`\nRésultat : ${pass}/${tests.length} réussi${fail ? `, ${fail} échoué` : ''}`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
