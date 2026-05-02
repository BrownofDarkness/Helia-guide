/**
 * Lance Lighthouse sur la page indiquée et vérifie les seuils.
 * Usage : node run.js [canevas|correction]
 */

import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from 'serve-handler';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = process.argv[2] ?? 'correction';
const ROOT = resolve(__dirname, '..', TARGET);

const THRESHOLDS = {
  performance: 0.95,
  accessibility: 0.95,
  'best-practices': 0.95,
  seo: 0.95,
};

console.log(`📊 Audit Lighthouse de "${TARGET}"\n`);

// Mini serveur statique
const server = createServer((req, res) => handler(req, res, { public: ROOT }));
const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
console.log(`Serveur statique sur http://localhost:${port}/`);

// Lancer Chrome headless
const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

try {
  const url = `http://localhost:${port}/`;
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    onlyCategories: Object.keys(THRESHOLDS),
    logLevel: 'error',
  });

  const scores = {};
  for (const [key, cat] of Object.entries(result.lhr.categories)) {
    scores[key] = cat.score;
  }

  console.log('\n──────────────────────────────────');
  let failed = 0;
  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    const score = scores[key] ?? 0;
    const ok = score >= threshold;
    const pct = Math.round(score * 100);
    const tgt = Math.round(threshold * 100);
    console.log(`${ok ? '✓' : '✗'} ${key.padEnd(18)} ${pct} / ${tgt}`);
    if (!ok) failed++;
  }
  console.log('──────────────────────────────────');

  process.exitCode = failed > 0 ? 1 : 0;
} finally {
  await chrome.kill();
  server.close();
}
