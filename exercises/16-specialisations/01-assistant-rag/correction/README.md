# Correction — Assistant RAG sur ta doc

> Version complète : ingestion idempotente + **recherche hybride (vector + BM25 + RRF)** + system prompt strict + streaming AI SDK + UI HTML inline. **Schéma DB validé** (HNSW + GIN français), **typecheck clean** sur Node 24 / TS strict.
>
> Lis-la **après ton implémentation**. La valeur est dans la **discipline RAG** (citations, garde-fous, métriques) — pas dans le résultat final.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Architecture du pipeline](#2-architecture-du-pipeline)
3. [Recherche hybride avec Reciprocal Rank Fusion (RRF)](#3-recherche-hybride-avec-reciprocal-rank-fusion-rrf)
4. [Garde-fous anti-hallucination](#4-garde-fous-anti-hallucination)
5. [Streaming via AI SDK data-stream protocol](#5-streaming-via-ai-sdk-data-stream-protocol)
6. [Validation : schéma + typecheck OK](#6-validation--schéma--typecheck-ok)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
# 1. Postgres + pgvector
docker run -d --name pg17 -e POSTGRES_PASSWORD=devpw -p 5432:5432 \
  pgvector/pgvector:pg17

# 2. Setup app
cp .env.example .env
# Remplis ANTHROPIC_API_KEY + OPENAI_API_KEY + DATABASE_URL

npm install
npm run db:init                       # crée table + index HNSW + GIN
npm run ingest -- ./data/             # indexe les 3 docs seed
npm run dev                            # → http://localhost:3000
```

### Tester (5 questions de validation)

| Question | Comportement attendu |
|----------|----------------------|
| « Qu'est-ce que le RAG ? » | Réponse synthétique citant `rag-101.md` |
| « Quel LLM utilise le projet ? » | Cite `stack.md` (Claude Sonnet 4.6) |
| « Comment éviter la prompt injection ? » | Cite `securite.md`, 3–4 mitigations |
| « Quelle est la météo à Paris ? » | « Je ne peux répondre qu'à propos de la documentation fournie. » |
| « Combien de doigts sur ma main ? » | Refus poli identique |

## 2. Architecture du pipeline

```
[markdown]
   │
   ├── chunker.ts ── split par sections H2/H3, sliding window 2400 chars
   │       │
   │       ▼
   │   [chunks]
   │       │
   ├── embedBatch ── OpenAI text-embedding-3-small (1536 dims, batch 100)
   │       │
   │       ▼
   │   pgvector (HNSW cosine) + GIN tsvector (FR)
   │
   ▼
question → embedOne → vector top-8  ┐
                                     ├── RRF (k=60) → top-6
        → ts_query  → BM25 top-8    ┘
                                     │
                                     ▼
                          buildContextBlock
                                     │
                                     ▼
                  Claude Sonnet 4.6 streaming
                  (system prompt strict + temperature 0.2)
                                     │
                                     ▼
                        SSE → front HTML inline
                          (parse `0:`, `e:`, `d:`)
```

### 6 modules, 1 responsabilité chacun

| Module | Lignes | Rôle |
|--------|--------|------|
| `db.ts` | ~10 | Pool pg (10 connexions) |
| `chunker.ts` | ~80 | Split markdown par sections + sliding window |
| `embeddings.ts` | ~40 | Wrapper OpenAI embedOne / embedBatch |
| `retrieval.ts` | ~70 | Vector + BM25 + RRF fusion |
| `prompts.ts` | ~30 | SYSTEM_PROMPT + buildContextBlock |
| `server.ts` | ~110 | Hono server + UI HTML inline |

Total ~340 lignes pour un RAG complet. À comparer aux **4000+ lignes** d'un wrapper LangChain équivalent.

## 3. Recherche hybride avec Reciprocal Rank Fusion (RRF)

```ts
// retrieval.ts
const TOP_K_VECTOR = 8;
const TOP_K_BM25 = 8;
const FINAL_K = 6;

export async function retrieve(question: string): Promise<RetrievedChunk[]> {
  const qVec = await embedOne(question);

  // 1) Vector cosine
  const vec = await pool.query(`
    SELECT file, section, content, 1 - (embedding <=> $1::vector) AS score
    FROM doc_chunks
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `, [JSON.stringify(qVec), TOP_K_VECTOR]);

  // 2) BM25 français via tsvector
  const bm = await pool.query(`
    SELECT file, section, content,
           ts_rank(to_tsvector('french', content), plainto_tsquery('french', $1)) AS score
    FROM doc_chunks
    WHERE to_tsvector('french', content) @@ plainto_tsquery('french', $1)
    ORDER BY score DESC
    LIMIT $2
  `, [question, TOP_K_BM25]);

  // 3) Reciprocal Rank Fusion
  return rrfMerge([vec.rows, bm.rows], FINAL_K);
}
```

### Pourquoi RRF et pas un seul retrieval ?

| Stratégie | Trouve quoi | Rate quoi |
|-----------|-------------|-----------|
| **Vector seul** | Sémantique (« voiture rouge » trouve « auto écarlate ») | Termes exacts rares (codes, noms propres) |
| **BM25 seul** | Termes exacts (« argon2id ») | Synonymes, paraphrases |
| **RRF (les deux fusionnés)** | Les deux + dédup intelligent | Quasi rien |

### RRF en 12 lignes

```ts
function rrfMerge(rankings: Chunk[][], k: number, kRrf = 60): Chunk[] {
  const scores = new Map<string, { chunk: Chunk; score: number }>();
  for (const list of rankings) {
    list.forEach((c, idx) => {
      const key = `${c.file}#${c.section}#${c.content.slice(0, 60)}`;
      const add = 1 / (kRrf + idx);    // ← formule magique RRF
      const prev = scores.get(key);
      if (prev) prev.score += add;
      else scores.set(key, { chunk: c, score: add });
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(s => s.chunk);
}
```

**`kRrf = 60`** est la constante magique de l'algo (Cormack 2009). Elle pondère la position : un chunk en 1er pèse `1/61 = 0.016`, en 2e `1/62`, en 3e `1/63`. La diff entre 1er et 2e est petite, ce qui évite qu'un seul retriever domine.

Si un chunk apparaît dans **les deux listes** → ses scores s'additionnent → il remonte. Le mécanisme est **sans paramètre à tuner** (pas de poids manuel vector vs BM25), c'est ce qui le rend si utilisé.

## 4. Garde-fous anti-hallucination

```ts
// prompts.ts
export const SYSTEM_PROMPT = `Tu es un assistant qui répond UNIQUEMENT à partir des extraits fournis ci-dessous.

Règles strictes :
1. Si la réponse n'est pas dans les extraits, réponds exactement :
   "Je ne trouve pas l'information dans la documentation fournie."
2. Cite tes sources sous le format [fichier.md§section] après chaque affirmation.
3. Si la question est hors-sujet (météo, opinion, code, etc.), refuse poliment.
4. Réponds en français sauf si la question est en anglais.

Ne JAMAIS inventer une source, un nom de fichier, ou une section qui n'apparaît pas dans le contexte ci-dessous.`;
```

### Les 5 leviers anti-hallucination de ce RAG

| Levier | Effet |
|--------|-------|
| `temperature: 0.2` | Réduit la créativité, augmente la fidélité au contexte |
| `system` strict avec exemples de refus | Cale le modèle sur le format de réponse |
| Citations forcées `[fichier§section]` | Le modèle doit s'ancrer dans une source réelle |
| **« Ne JAMAIS inventer une source »** explicite | Réduit fortement les fausses citations |
| Contexte numéroté `[1]`, `[2]`... | Le modèle peut citer par numéro, plus traçable |

### Validation des citations (pas implémenté en V1, recommandé en prod)

```ts
function validateCitations(answer: string, chunks: Chunk[]): string[] {
  const cited = [...answer.matchAll(/\[([\w-]+\.md)§([^\]]+)\]/g)].map(m => `${m[1]}§${m[2]}`);
  const allowed = chunks.map(c => `${c.file}§${c.section}`);
  return cited.filter(c => !allowed.includes(c));   // → liste des hallucinations
}
```

Si `validateCitations` retourne du contenu, le RAG a **inventé** des sources. À ce moment-là : log l'incident, retry avec prompt durci, ou marquer la réponse comme « basse confiance ».

## 5. Streaming via AI SDK data-stream protocol

```ts
// server.ts
const result = await streamText({
  model: anthropic('claude-sonnet-4-6'),
  system: `${SYSTEM_PROMPT}\n\n--- CONTEXTE ---\n\n${context}`,
  messages,
  maxTokens: 800,
  temperature: 0.2,
});

return result.toDataStreamResponse();
```

### Le data-stream protocol côté client

```js
const reader = res.body.getReader();
const dec = new TextDecoder();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const chunk = dec.decode(value);
  for (const line of chunk.split('\n')) {
    if (line.startsWith('0:')) {
      // text delta — JSON-encoded string
      out.textContent += JSON.parse(line.slice(2));
    } else if (line.startsWith('e:') || line.startsWith('d:')) {
      // event final ou done — contient `usage`
      usage = JSON.parse(line.slice(2)).usage;
    }
  }
}
```

| Préfixe | Quoi | Quand |
|---------|------|-------|
| `0:` | Text delta (JSON-encoded string) | À chaque token streamé |
| `1:` | Tool call | Si tu utilises function calling |
| `2:` | Tool result | Idem |
| `e:` | Step finish (intermédiaire) | À chaque "tour" du modèle |
| `d:` | Done — contient `usage` final | À la fin du stream |

Pour notre RAG simple (pas de tools), seuls `0:`, `e:`, `d:` apparaissent. La UI inline en 200 lignes HTML suffit, **pas besoin de React**.

### Métriques affichées en UI

```
245 ms · 2840 prompt + 187 completion tokens
```

- **Latence** : mesurée `t = performance.now() - t0`. Inclut retrieval + LLM streaming complet.
- **Tokens** : extraits de `usage` côté `d:` (event final).

À surveiller en prod : si `prompt tokens` dérive vers le haut, ton retrieval ramène trop de chunks → augmenter le filtrage.

## 6. Validation : schéma + typecheck OK

### Schéma DB

```bash
docker run -d --name pg17 -e POSTGRES_PASSWORD=devpw -p 5432:5432 \
  pgvector/pgvector:pg17
DATABASE_URL=postgres://postgres:devpw@localhost:5432/postgres npm run db:init
# → ✅ DB initialisée — table doc_chunks + index HNSW + GIN
```

3 objets créés sans erreur :
- Extension `vector` (pgvector)
- Table `doc_chunks` (id, file, section, content, embedding vector(1536), created_at)
- Index `doc_chunks_embedding_idx` HNSW (cosine)
- Index `doc_chunks_fts_idx` GIN (`to_tsvector('french', content)`)

### Typecheck

```bash
npx tsc --noEmit
# → 0 erreur
```

> ℹ️ Le code utilise `Array.prototype.findLast` qui exige `target: ES2023` (le canevas et la correction l'ont). Si tu vois `Property 'findLast' does not exist`, bump ta `tsconfig.json` à `"target": "ES2023"`.

### Smoke test complet (avec clés API)

Sans clés API on ne peut pas faire un vrai end-to-end. Avec :

```bash
ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... npm run ingest -- ./data/
# 3 fichiers .md → ~23 chunks, ~$0.0005 d'embeddings

ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... npm run dev
# Pose une question dans la UI, vérifie le streaming + citations
```

## 7. Pièges réels rencontrés

3 pièges concrets pendant la construction :

1. **`Array.prototype.findLast` exige ES2023** → ta `tsconfig.json` à `target: "ES2022"` plante au typecheck. Fix : bump `target` et `lib` à `ES2023`.
2. **`vector` extension manquante en utilisant `postgres:17-alpine`** → cette image n'a pas pgvector. Toujours utiliser `pgvector/pgvector:pg17` quand tu as besoin du vector store.
3. **Citations hallucinées même avec citations forcées** → le modèle invente des sections qui ressemblent. Fix double : (a) numéroter les chunks dans le contexte (`[1]`, `[2]`...) et demander de citer par numéro, (b) ajouter explicitement « Ne JAMAIS inventer une source » dans le system prompt.

Aucun nouveau piège global à capturer dans `pieges.ts` — ces 3 sont des spécificités RAG / TS bien documentées sur place.

## 8. Pour aller plus loin

- **Reranker** Cohere `rerank-multilingual-v3.0` (~$1 / 1K queries) sur les top-K finaux. Double la qualité de retrieval pour 1 ms ajouté.

- **Anthropic prompt caching** sur le contexte stable :
  ```ts
  system: [
    { type: 'text', text: SYSTEM_PROMPT },
    { type: 'text', text: context, cache_control: { type: 'ephemeral' } },
  ]
  ```
  Réduit le coût de 90 % sur les questions consécutives qui partagent le même contexte (même corpus indexé).

- **Variante Ollama 100 % local** : remplace `anthropic('claude-sonnet-4-6')` par `ollama('llama3.1:8b')` via le provider [`ai-sdk-ollama`](https://github.com/sgomez/ollama-ai-provider). Embeddings via `nomic-embed-text` (768 dim — adapter le schéma DB).

- **Évaluations automatisées avec [`promptfoo`](https://www.promptfoo.dev/)** :
  ```yaml
  prompts: [./prompts/system.md]
  providers: [anthropic:claude-sonnet-4-6]
  tests:
    - description: SIWE doit citer EIP-4361
      vars: { question: "Qu'est-ce que SIWE ?" }
      assert:
        - type: contains
          value: "EIP-4361"
  ```
  Lancer `promptfoo eval` en CI sur ton golden set.

- **Re-indexing incrémental** : un file watcher (`chokidar`) détecte les modifs, hash le contenu, re-embedde uniquement les chunks changés. Économise 90 % des coûts d'embedding sur les ré-indexages.

- **MCP server** : expose ce RAG comme tool MCP pour Claude Desktop / Cursor. L'utilisateur tape `@ma-doc qu'est-ce que SIWE ?` directement dans son IDE.

- **Multi-tenant** : ajoute `tenant_id` à `doc_chunks`, filtre dans la query (`WHERE tenant_id = $X`). Crée un index composite `(tenant_id, embedding)` pour HNSW segmenté.

- **PDF / DOCX ingestion** : `mupdf-js` ou `pdf-parse` côté Node, ou Tika côté Java. La chunking devient plus dur (pas de H2/H3 fiables) → fallback sliding window.
