/**
 * Injecte un <Level> dans toutes les sous-sections MDX qui n'en ont pas.
 *
 * Pour chaque fichier :
 *   1. Détermine l'axe à partir du chemin (ex : 06-javascript-typescript → 6).
 *   2. Calcule le niveau (débutant / confirmé / avancé) selon une heuristique.
 *   3. Estime le temps de lecture en fonction de la longueur du fichier.
 *   4. Ajoute import + <Level/> après l'objectif intro, sans toucher au reste.
 *
 * À lancer avec : `node scripts/inject-level-badges.mjs`
 * Idempotent : si <Level est déjà présent, on saute.
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = 'src/content/docs';

function listMdx(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...listMdx(p));
    else if (p.endsWith('.mdx') && !p.endsWith('/index.mdx') && !p.endsWith('\\index.mdx')) {
      out.push(p);
    }
  }
  return out;
}

function axeNumber(path) {
  const m = path.match(/[\\/](\d{1,2})-/);
  return m ? Number(m[1]) : null;
}

function subAxe(path) {
  // ex : ".../06-javascript-typescript/02-async.mdx" → "6.2"
  const axe = axeNumber(path);
  const m = path.match(/[\\/](\d{1,2})-[^\\/]+\.mdx$/);
  if (axe === null || !m) return null;
  return `${axe}.${Number(m[1])}`;
}

function levelFor(axe) {
  if (axe === null) return 'confirmé';
  if (axe <= 4) return 'débutant';
  if (axe <= 7) return 'débutant';
  if (axe <= 11) return 'confirmé';
  if (axe <= 15) return 'confirmé';
  if (axe === 16) return 'avancé';
  return 'confirmé';
}

function readingMinFor(content) {
  // ~ 200 mots/minute en lecture technique
  const words = content.split(/\s+/).length;
  const min = Math.max(10, Math.round(words / 200));
  return `${min} min`;
}

function prereqFor(axe) {
  if (axe === 1) return 'aucun';
  if (axe === 2) return 'axe 1 lu';
  if (axe === 3) return 'aucun (parallélisable avec axe 1)';
  if (axe === 4) return 'axe 1 lu';
  if (axe === 5) return 'axes 1-4 lus';
  if (axe === 6) return 'axe 5 lu';
  if (axe === 7) return 'axe 6 lu';
  if (axe === 8) return 'axes 5-7 lus';
  if (axe === 9) return 'axe 8 lu';
  if (axe === 10) return 'axes 8-9 lus';
  if (axe === 11) return 'axes 5-10 lus';
  if (axe === 12) return 'axes 8 et 11 lus';
  if (axe === 13) return 'axes 5-9 lus';
  if (axe === 14) return 'axes 4 et 8 lus';
  if (axe === 15) return 'aucun prérequis technique';
  if (axe === 16) return 'axes 1-14 maîtrisés';
  if (axe === 17) return 'aucun (parallélisable dès l\'axe 4)';
  return 'axes précédents lus';
}

function process(file) {
  const content = readFileSync(file, 'utf-8');

  if (content.includes('<Level ')) {
    return { file, status: 'skip-already' };
  }

  const axe = axeNumber(file);
  if (axe === null) {
    return { file, status: 'skip-no-axe' };
  }

  const level = levelFor(axe);
  const reading = readingMinFor(content);
  const prereq = prereqFor(axe);

  // 1. Ajouter l'import après le dernier import existant
  const importLine = "import Level from '../../../components/Level.astro';";
  const subDirCount = file.replace(/\\/g, '/').split('src/content/docs/')[1].split('/').length - 1;
  const dotsRel = '../'.repeat(subDirCount + 1) + 'components/Level.astro';
  const finalImport = `import Level from '${dotsRel}';`;

  let updated = content;

  // Ajouter l'import s'il n'est pas déjà là
  if (!updated.includes("import Level from")) {
    // Trouve le dernier `import ... from ...;` avant la 1ère ligne non-import
    const importRe = /^import .+ from .+;$/gm;
    const imports = [...updated.matchAll(importRe)];
    if (imports.length === 0) {
      return { file, status: 'skip-no-imports' };
    }
    const lastImport = imports[imports.length - 1];
    const insertAt = lastImport.index + lastImport[0].length;
    updated = updated.slice(0, insertAt) + '\n' + finalImport + updated.slice(insertAt);
  }

  // 2. Ajouter le <Level> après le bloc d'objectif intro
  // On cherche la fin du bloc `<ObjectiveList items={[...]} />` ou la 1ère ligne `## ` qui suit l'objectif
  // Stratégie simple : insérer juste après le 1er `</ObjectiveList>` ou `]} />` qui ferme un ObjectiveList
  const olEnd = /\]\}\s*\/>/m.exec(updated);
  let insertPos;
  if (olEnd) {
    insertPos = olEnd.index + olEnd[0].length;
  } else {
    // Fallback : juste avant le premier `## ` (heading 2)
    const h2 = /^## /m.exec(updated);
    if (!h2) return { file, status: 'skip-no-anchor' };
    insertPos = h2.index;
  }

  const levelTag = `\n\n<Level value="${level}" reading="${reading}" prereq="${prereq}" />\n`;
  updated = updated.slice(0, insertPos) + levelTag + updated.slice(insertPos);

  writeFileSync(file, updated, 'utf-8');
  return { file: file.replace(/.*content\/docs\//, ''), status: 'ok', level, reading, prereq };
}

const files = listMdx(DOCS).filter(
  (f) => !f.includes('00-preambule') && !f.includes('glossaire') && !f.includes('fil-rouge')
);

const results = files.map(process);
const ok = results.filter((r) => r.status === 'ok');
const skipped = results.filter((r) => r.status !== 'ok');

console.log(`✅ ${ok.length} fichiers patchés avec <Level>.`);
console.log(`⏭  ${skipped.length} fichiers sautés.`);
for (const r of skipped) {
  console.log(`   - ${r.file.replace(/.*content\/docs\//, '')} : ${r.status}`);
}
