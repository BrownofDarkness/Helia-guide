import { pool } from '../src/db.ts';

await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

await pool.query(`
  DROP TABLE IF EXISTS doc_chunks;
  CREATE TABLE doc_chunks (
    id SERIAL PRIMARY KEY,
    file TEXT NOT NULL,
    section TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

// HNSW pour la recherche vectorielle (cosine)
await pool.query(`
  CREATE INDEX doc_chunks_embedding_idx
  ON doc_chunks USING hnsw (embedding vector_cosine_ops)
`);

// Index BM25 / GIN pour la recherche full-text
await pool.query(`
  CREATE INDEX doc_chunks_fts_idx
  ON doc_chunks USING GIN (to_tsvector('french', content))
`);

console.log('✅ DB initialisée — table doc_chunks + index HNSW + GIN');
await pool.end();
