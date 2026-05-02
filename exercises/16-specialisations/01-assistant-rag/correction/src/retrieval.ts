import { pool } from './db.ts';
import { embedOne } from './embeddings.ts';

export interface RetrievedChunk {
  file: string;
  section: string;
  content: string;
  score: number;
}

const TOP_K_VECTOR = 8;
const TOP_K_BM25 = 8;
const FINAL_K = 6;

export async function retrieve(question: string): Promise<RetrievedChunk[]> {
  const qVec = await embedOne(question);

  // 1) recherche vectorielle (cosine)
  const vec = await pool.query<{
    file: string; section: string; content: string; score: number;
  }>(
    `
    SELECT file, section, content,
           1 - (embedding <=> $1::vector) AS score
    FROM doc_chunks
    ORDER BY embedding <=> $1::vector
    LIMIT $2
    `,
    [JSON.stringify(qVec), TOP_K_VECTOR]
  );

  // 2) recherche full-text (BM25 via tsvector)
  const bm = await pool.query<{
    file: string; section: string; content: string; score: number;
  }>(
    `
    SELECT file, section, content,
           ts_rank(to_tsvector('french', content), plainto_tsquery('french', $1)) AS score
    FROM doc_chunks
    WHERE to_tsvector('french', content) @@ plainto_tsquery('french', $1)
    ORDER BY score DESC
    LIMIT $2
    `,
    [question, TOP_K_BM25]
  );

  // 3) reciprocal rank fusion
  return rrfMerge([vec.rows, bm.rows], FINAL_K);
}

function rrfMerge(rankings: RetrievedChunk[][], k: number, kRrf = 60): RetrievedChunk[] {
  const scores = new Map<string, { chunk: RetrievedChunk; score: number }>();
  for (const list of rankings) {
    list.forEach((c, idx) => {
      const key = `${c.file}#${c.section}#${c.content.slice(0, 60)}`;
      const prev = scores.get(key);
      const add = 1 / (kRrf + idx);
      if (prev) prev.score += add;
      else scores.set(key, { chunk: c, score: add });
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => ({ ...s.chunk, score: s.score }));
}
