import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from '../src/db.ts';
import { chunk } from '../src/chunker.ts';
import { embedBatch } from '../src/embeddings.ts';

const target = process.argv[2] ?? './data';

async function listMd(path: string): Promise<string[]> {
  const s = await stat(path);
  if (s.isFile()) return path.endsWith('.md') ? [path] : [];
  const entries = await readdir(path, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const p = join(path, e.name);
    if (e.isDirectory()) out.push(...(await listMd(p)));
    else if (e.isFile() && p.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = await listMd(target);
console.log(`📄 ${files.length} fichiers .md trouvés`);

let totalChunks = 0;
const BATCH = 32;

for (const file of files) {
  const md = await readFile(file, 'utf-8');
  const chunks = chunk(file, md);

  // Suppression des chunks existants pour ce fichier (re-indexation idempotente)
  await pool.query('DELETE FROM doc_chunks WHERE file = $1', [file]);

  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const embeddings = await embedBatch(batch.map((c) => c.content));

    const values = batch.map(
      (c, idx) =>
        `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4}::vector)`
    );
    const params = batch.flatMap((c, idx) => [
      c.file,
      c.section,
      c.content,
      JSON.stringify(embeddings[idx]),
    ]);

    await pool.query(
      `INSERT INTO doc_chunks (file, section, content, embedding) VALUES ${values.join(', ')}`,
      params
    );
  }

  totalChunks += chunks.length;
  console.log(`  ✓ ${file} — ${chunks.length} chunks`);
}

console.log(`\n✅ ${totalChunks} chunks indexés (${files.length} fichiers)`);
await pool.end();
