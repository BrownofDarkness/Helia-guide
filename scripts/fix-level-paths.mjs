/**
 * Fix import paths cassés par inject-level-badges.mjs.
 * Le script précédent utilisait '../../components/Level.astro' (2 dots)
 * alors qu'il faut '../../../components/Level.astro' (3 dots) depuis
 * src/content/docs/<axe>/<sub>.mdx.
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
    else if (p.endsWith('.mdx')) out.push(p);
  }
  return out;
}

const files = listMdx(DOCS);
let fixed = 0;
for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  if (!content.includes("import Level from '../../components/Level.astro'")) continue;
  const updated = content.replace(
    "import Level from '../../components/Level.astro'",
    "import Level from '../../../components/Level.astro'"
  );
  writeFileSync(file, updated, 'utf-8');
  fixed += 1;
  console.log(`  ✓ ${file}`);
}
console.log(`\n✅ ${fixed} fichiers corrigés.`);
