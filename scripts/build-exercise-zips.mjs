/**
 * Génère les ZIP téléchargeables des exercices.
 *
 * Pour chaque dossier `canevas/` ou `correction/` trouvé sous `exercises/`,
 *  1. nettoie les fichiers générés (node_modules, dist, etc.) avant zip,
 *  2. crée `public/downloads/<axe>-<sub>-<name>-{canevas|correction}.zip`.
 *
 * Lancé automatiquement par `npm run build` via le hook `prebuild`.
 */

import archiver from 'archiver';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';

const EXERCISES_DIR = 'exercises';
const OUT_DIR = 'public/downloads';

// Fichiers / dossiers générés à nettoyer avant zip (match exact sur le nom).
const CLEANUP_PATTERNS = [
  'node_modules',
  '.next',
  '.nuxt',
  'dist',
  'build',
  '.cache',
  '.parcel-cache',
  '.turbo',
  'coverage',
  '.coverage',
  '.pytest_cache',
  '__pycache__',
  '.venv',
  'venv',
  'vendor',
  '.idea',
  '.vscode',
  '.DS_Store',
  '.env',
  '.env.local',
  'tmp',
  'logs',
  // Lock files régénérés par les installs (smoke tests etc.)
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'composer.lock',
  'Pipfile.lock',
  'poetry.lock',
  'uv.lock',
];

// Suffixes (extensions) à supprimer même si le nom complet varie.
const CLEANUP_SUFFIXES = [
  '.log',
  '.sqlite',
  '.sqlite3',
  '.db',
  '.pyc',
];

// Patterns à exclure du zip (en plus du cleanup ci-dessus, par sécurité).
const ZIP_IGNORE = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '__pycache__/**',
  '.pytest_cache/**',
  '.venv/**',
  'vendor/**',
  '.cache/**',
  '*.log',
  '*.lock-only',
  '.DS_Store',
  '.env',
  '.env.local',
  '*.db',
  '*.sqlite',
];

function findExerciseFolders(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name === 'canevas' || entry.name === 'correction') {
      out.push(full);
    } else {
      out.push(...findExerciseFolders(full));
    }
  }
  return out;
}

function cleanupRecursive(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const matchesName = CLEANUP_PATTERNS.includes(entry.name);
    const matchesSuffix =
      entry.isFile() && CLEANUP_SUFFIXES.some((s) => entry.name.endsWith(s));
    if (matchesName || matchesSuffix) {
      rmSync(full, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      cleanupRecursive(full);
    }
  }
}

function slugify(folder) {
  // ex: exercises/08-backend/01-nodejs-typescript/taskly-api/canevas
  //  -> 08-backend-01-nodejs-typescript-taskly-api-canevas
  return relative(EXERCISES_DIR, folder).split(/[\\/]/g).join('-');
}

async function zipFolder(srcDir, outFile) {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    let total = 0;
    stream.on('close', () => resolve({ bytes: archive.pointer(), files: total }));
    archive.on('error', reject);
    archive.on('entry', () => (total += 1));
    archive.pipe(stream);
    archive.glob('**/*', {
      cwd: srcDir,
      ignore: ZIP_IGNORE,
      dot: true,
    });
    archive.finalize();
  });
}

async function main() {
  if (!existsSync(EXERCISES_DIR)) {
    console.log('ℹ Pas de dossier exercises/, skip.');
    return;
  }

  // Nettoyer le dossier de sortie
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  // Cleanup en place avant zip (le user a demandé ce comportement)
  console.log('🧹 Nettoyage des artefacts (node_modules, dist, etc.)…');
  cleanupRecursive(EXERCISES_DIR);

  const folders = findExerciseFolders(EXERCISES_DIR);
  console.log(`📦 Compression de ${folders.length} dossiers…`);

  const manifest = [];
  for (const folder of folders) {
    const slug = slugify(folder);
    const outFile = join(OUT_DIR, `${slug}.zip`);
    const { bytes, files } = await zipFolder(folder, outFile);
    const sizeKB = (bytes / 1024).toFixed(1);
    console.log(`  ✓ ${slug}.zip — ${files} fichiers, ${sizeKB} KB`);
    manifest.push({ slug, files, sizeKB: Number(sizeKB) });
  }

  writeFileSync(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), exercises: manifest }, null, 2)
  );

  console.log(`\n✅ ${folders.length} ZIP générés dans ${OUT_DIR}/`);
}

await main();
