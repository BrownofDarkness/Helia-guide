/**
 * Corrige les `import Level` insérés à tort à l'intérieur de blocs de code
 * par le script précédent. Pour chaque fichier MDX :
 *   1. Parcourt les lignes en suivant l'état "in code block" (toggle sur ```).
 *   2. Si une ligne `import Level from '../../../components/Level.astro';`
 *      est à l'intérieur d'un code block → on la retire.
 *   3. À la fin, si le fichier n'a plus l'import au top (en frontmatter section)
 *      mais utilise `<Level`, on l'ajoute proprement après le dernier import
 *      réel (avant le 1er contenu non-import / non-frontmatter).
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

const TARGET = "import Level from '../../../components/Level.astro';";

function process(file) {
  const content = readFileSync(file, 'utf-8');
  if (!content.includes('<Level')) return null;

  const lines = content.split('\n');
  let inCode = false;
  const cleaned = [];
  let removedInsideCode = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCode = !inCode;
      cleaned.push(line);
      continue;
    }
    if (inCode && line === TARGET) {
      removedInsideCode += 1;
      continue; // skip this line, it shouldn't be inside a code block
    }
    cleaned.push(line);
  }

  let updated = cleaned.join('\n');

  // Vérifier qu'il y a bien un import Level au top (hors code blocks)
  // Pour cela, on cherche jusqu'à la première occurrence de `## ` ou `> 🎯`
  const headerMarker = updated.search(/(^|\n)(#{1,6} |> 🎯)/);
  const header = headerMarker === -1 ? updated : updated.slice(0, headerMarker);

  if (!header.includes(TARGET)) {
    // Manque l'import légitime au top → on l'ajoute après le dernier import existant
    const importRe = /^import .+ from .+;$/gm;
    const headerImports = [...header.matchAll(importRe)];
    if (headerImports.length > 0) {
      const last = headerImports[headerImports.length - 1];
      const at = last.index + last[0].length;
      updated = updated.slice(0, at) + '\n' + TARGET + updated.slice(at);
    }
  }

  if (updated === content) return null;
  writeFileSync(file, updated, 'utf-8');
  return { file, removedInsideCode };
}

const results = listMdx(DOCS).map(process).filter(Boolean);
console.log(`✅ ${results.length} fichiers nettoyés.`);
for (const r of results) {
  console.log(`  - ${r.file} (retiré ${r.removedInsideCode} import(s) dans code block)`);
}
