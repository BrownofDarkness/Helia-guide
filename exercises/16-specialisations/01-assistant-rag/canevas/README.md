# Canevas — Assistant RAG sur ta doc

> Tu vas construire un assistant **RAG** (Retrieval-Augmented Generation) qui répond aux questions sur un dossier de Markdown. Pipeline complet : chunking → embeddings → stockage pgvector → retrieval hybride → LLM streamé avec citations forcées et garde-fous anti-hallucination.
>
> C'est l'exercice qui transforme « j'ai utilisé ChatGPT » en « je sais construire un assistant fiable sur des données privées ». Le pattern de base de toutes les apps IA d'entreprise en 2026.

## Ce que tu vas faire

| Étape | Sortie |
|-------|--------|
| 1. **Ingestion** | `npm run ingest -- ./data/` indexe ≥ 50 chunks depuis tes `.md` |
| 2. **Retrieval** | Recherche vectorielle pgvector + (bonus) BM25 + reranker |
| 3. **LLM streamé** | `POST /api/chat` SSE, < 1 s avant le 1er token |
| 4. **Citations forcées** | Chaque réponse contient `[fichier.md§section]` |
| 5. **Garde-fous** | Refus calibré si question hors-sujet (pas d'hallucination) |
| 6. **Métriques** | Latence + tokens dépensés affichés dans la UI |
| 7. **Tests** | Golden set ≥ 3 questions (in-scope + out-of-scope) |

À la fin, tu sauras :
- **Chunker proprement** un Markdown (split par H2/H3, overlap 100 tokens, ~800 tokens par chunk).
- **Calculer un embedding** avec `text-embedding-3-small` OpenAI (1536 dim, $0.02 / 1M tokens).
- **Indexer en pgvector** avec HNSW (cosine distance) + index GIN full-text français pour le BM25.
- **Streamer une réponse LLM** via Vercel AI SDK + Anthropic Claude Sonnet 4.6.
- **Forcer les citations** dans le system prompt + valider qu'elles existent.
- **Mesurer** prompt tokens + completion tokens + latence par requête.

## Pré-requis

### Comptes API (les deux ont du free tier)

| Service | Pourquoi | Free tier |
|---------|----------|-----------|
| **Anthropic API** | LLM (Claude Sonnet 4.6) | $5 crédit nouveau compte |
| **OpenAI API** | embeddings `text-embedding-3-small` | $5 crédit nouveau compte |

> 💡 **Coût réel cet exo** : indexer 50 chunks × ~500 tokens = 25K tokens × $0.02/M = **$0.0005**. Une question moyenne consomme ~3K prompt + ~300 completion = **$0.012 par question Claude**. Le free tier te tient pour des centaines de questions.

### Alternative 100 % local (sans clé API)

Si tu veux tout local : **Ollama** + Llama 3.1 8B pour le LLM, et `Xenova/all-MiniLM-L6-v2` (transformers.js) pour les embeddings. Voir `correction/README.md` § « Variante locale ».

### Outils

- **Node ≥ 20** (`node --version`)
- **Docker** (pour Postgres + pgvector)

## Démarrer

```bash
# 1. Postgres + pgvector via Docker
docker run -d --name pg17 -e POSTGRES_PASSWORD=devpw -p 5432:5432 \
  pgvector/pgvector:pg17

# 2. Installer
npm install

# 3. Variables d'environnement
cp .env.example .env
# Remplis ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL

# 4. Initialiser la DB (crée table doc_chunks + index HNSW + GIN)
npm run db:init

# 5. Ingérer les docs (mets tes fichiers .md dans data/)
mkdir -p data
cp ../correction/data/*.md data/      # ou tes propres docs
npm run ingest -- ./data/

# 6. Démarrer
npm run dev
# → http://localhost:3000
```

Pose une question dans la UI, regarde le streaming et les citations.

## Démarche en 6 étapes

### 1. Pipeline d'ingestion (`scripts/ingest.ts`)

```
1. Lister tous les .md du dossier
2. Pour chaque fichier :
   a. Splitter par sections (H2 puis H3)
   b. Pour chaque section :
      - Chunker en ~800 tokens, overlap 100
      - Calculer l'embedding OpenAI
      - INSERT INTO doc_chunks (file, section, content, embedding)
3. (Index HNSW déjà créé par db:init)
```

3 stratégies de chunking à connaître :

| Stratégie | Comment | Quand |
|-----------|---------|-------|
| **Recursive splitter** | Par paragraphes, fallback ligne, fallback caractère | Marche partout, défaut |
| **Semantic chunking** | Split quand l'embedding entre 2 paragraphes diverge | Markdown sans structure claire |
| **Sliding window** | Fenêtre fixe avec overlap | Texte continu sans titres |

Pour notre exercice (Markdown structuré), **recursive splitter par section H2/H3** est optimal.

### 2. Retrieval (`src/retrieval.ts`)

```ts
async function retrieve(query: string, k = 6): Promise<Chunk[]> {
  const [emb] = await embed([query]);
  const result = await pool.query(`
    SELECT file, section, content, 1 - (embedding <=> $1) AS similarity
    FROM doc_chunks
    ORDER BY embedding <=> $1
    LIMIT $2
  `, [emb, k]);
  return result.rows;
}
```

Opérateur `<=>` = distance cosinus pgvector. `1 - distance` = score de similarité (0..1). Plus haut = plus proche.

**Bonus recherche hybride** : combine vector + BM25 :

```ts
// 1. Vector → top 20
// 2. BM25 (full-text français) → top 20
// 3. Reranker Cohere/Voyage → top 6 finalistes
```

Le reranker **lit vraiment** la question et les chunks et donne un meilleur score que cosine seul. Coût : ~$0.001 par question, ROI excellent sur la qualité.

### 3. Prompts (`src/prompts.ts`)

```ts
export const SYSTEM_PROMPT = `Tu es un assistant qui répond UNIQUEMENT à partir des extraits fournis.

Règles strictes :
1. Si la réponse n'est pas dans les extraits, réponds exactement :
   "Je ne trouve pas l'information dans la documentation fournie."
2. Cite tes sources sous le format [fichier.md§section] après chaque affirmation.
3. Si la question est hors-sujet (météo, opinion, code, etc.), refuse poliment.
4. Réponds en français sauf si la question est en anglais.`;

export function buildContextBlock(chunks: Chunk[]): string {
  return chunks
    .map((c, i) => `[${i + 1}] ${c.file}§${c.section}\n${c.content}`)
    .join('\n\n---\n\n');
}
```

### 4. Server Hono streaming (`src/server.ts`)

```ts
app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json();
  const userMsg = messages.findLast(m => m.role === 'user');

  const chunks = await retrieve(userMsg.content);
  const context = buildContextBlock(chunks);

  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: `${SYSTEM_PROMPT}\n\n--- CONTEXTE ---\n\n${context}`,
    messages,
    maxTokens: 800,
    temperature: 0.2,    // ← bas pour réduire les hallucinations
  });

  return result.toDataStreamResponse();
});
```

`temperature: 0.2` : assez bas pour être déterministe sur les faits, assez haut pour que le ton reste naturel. Les RAG production sont souvent à 0.0–0.3.

### 5. UI minimale

Une page `/` avec :
- `<textarea>` pour la question
- `<pre>` pour la réponse en streaming
- Footer avec **latence + tokens** affichés à la fin

Le streaming utilise le **AI SDK data-stream protocol** : chaque ligne préfixée `0:` (text delta), `e:`/`d:` (events). Dans le frontend tu parses chaque ligne au fur et à mesure.

### 6. Tests golden set

```ts
// tests/golden.test.ts
const goldenSet = [
  { question: "Qu'est-ce que SIWE ?", expectedKeywords: ['Sign-In With Ethereum', 'EIP-4361'] },
  { question: "LCP cible Lighthouse ?", expectedKeywords: ['2.5', 'secondes'] },
  { question: "Météo à Paris ?", expectedKeywords: ['ne trouve pas', 'documentation'] },
];

for (const { question, expectedKeywords } of goldenSet) {
  it(question, async () => {
    const answer = await chat(question);
    for (const kw of expectedKeywords) {
      expect(answer.toLowerCase()).toContain(kw.toLowerCase());
    }
  });
}
```

**Le golden set est le contrat de qualité de ton RAG.** Sans, tu ne sais pas si une modif (chunk size, top-k, prompt) a régressé. Outil pro : [`promptfoo`](https://www.promptfoo.dev/).

## Tester

```bash
# Tester un endpoint chat directement (vérifie que ça stream)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Qu est-ce que le RAG ?"}]}' \
  --no-buffer

# Tests golden set
npm test
```

## Bloqué ?

- **`db:init` plante avec `extension "vector" does not exist`** → tu utilises `postgres:17-alpine` au lieu de `pgvector/pgvector:pg17`. La 1ère image n'a pas l'extension. Recréer le container avec la bonne image.
- **`Property 'findLast' does not exist`** → ta `tsconfig.json` a `target: "ES2022"`. `findLast` exige ES2023. Bump à `ES2023` (le canevas l'a déjà).
- **L'assistant hallucine sur des questions hors-sujet** → ton system prompt n'est pas assez strict. Ajoute des exemples : « Question : "Quel temps fait-il à Paris ?" → Réponse : "Je ne réponds qu'à propos de la documentation fournie." ».
- **Les citations sont inventées (n'existent pas dans le contexte)** → trois pistes : (1) descendre `temperature` à 0.0, (2) demander explicitement « cite uniquement les sources marquées [N] dans le contexte », (3) parser la réponse et valider que chaque `[…]` correspond à un chunk fourni.
- **Premier token > 3 secondes** → soit ton retrieval prend > 1 s (vérifie l'index HNSW, pas un seq scan), soit tu n'as pas streamé (`return c.json(...)` au lieu de `result.toDataStreamResponse()`).
- **Embeddings coûtent cher au ré-indexage** → cache par hash de contenu. Avant d'embedder un chunk, hash son texte ; si le hash est déjà en DB, skip. Économise 90 % sur les ré-indexages incrémentaux.
- **Le LLM répond en anglais alors que la question est en français** → contexte trop majoritairement anglais. Fix : explicite dans le system prompt « réponds toujours en français sauf si la question est en anglais ».
- **L'assistant cite des chunks non pertinents** → augmente `top-k` (de 6 à 12), ou ajoute un reranker (Cohere `rerank-multilingual-v3.0`, $1/1K queries). Le reranker double la qualité de retrieval pour 1 ms ajouté.

## Ne commit pas

`data/*.md` (sauf si publics), `.env`, `node_modules/`, embeddings cachés. Ton `.env` contient les clés API — fuite = facture. **Toujours `.env` dans `.gitignore`**.

## Comparer avec la correction

Une fois fini, regarde `../correction/` :
- 6 modules clairement séparés (`db`, `embeddings`, `chunker`, `retrieval`, `prompts`, `server`)
- Recherche **vectorielle pure** (pas de hybrid en V1, gardé comme bonus)
- 3 docs de seed dans `data/` pour que tu puisses tester immédiatement
- UI vanilla (200 lignes HTML inline) pour rester en focus sur le backend

Tes choix peuvent **différer** :
- LangChain.js / LlamaIndex au lieu de tout maison
- Pinecone / Qdrant cloud au lieu de pgvector local
- Vercel AI Vue au lieu d'Hono
- Gemini / Mistral / Llama au lieu de Claude

C'est valide tant que **les principes restent** : citations forcées, garde-fous anti-hallucination, métriques visibles, tests golden set.
