# Exercice 16.1 — Assistant RAG sur ta doc

> **Axe** : 16 — Spécialisations (16.4 IA appliquée)
> **Difficulté** : avancé
> **Durée estimée** : 8 à 16 heures
> **Prérequis** : axe 16.4 lu, **Node.js ≥ 20**, Postgres 17 (avec pgvector)

## ⚙️ Avant de commencer

### Comptes / clés API

| Service | Pourquoi | Free tier |
|---------|----------|-----------|
| **Anthropic API** | LLM (Claude Sonnet 4.6) | crédit gratuit nouveau compte |
| **OpenAI API** | embeddings text-embedding-3-small | crédit gratuit |
| **Postgres + pgvector** | vector store | local Docker |

```bash
# Postgres + pgvector via Docker
docker run -d --name pg17 -e POSTGRES_PASSWORD=devpw -p 5432:5432 \
  pgvector/pgvector:pg17

node --version    # v20+
```

### Alternative 100 % local (sans clé API)

Tu peux utiliser **Ollama** + un modèle Llama / Qwen pour le LLM, et `Xenova/all-MiniLM-L6-v2` (transformers.js) pour les embeddings. Voir `correction/README.md` pour la variante.

## 🎯 Objectifs pédagogiques

- Construire un **pipeline d'ingestion** : chunking, embeddings, stockage.
- Implémenter le **retrieval** avec recherche hybride (vector + BM25).
- Brancher un **LLM streamé** avec citations forcées.
- Mettre en place les **garde-fous** sécurité (system prompt strict, validation).
- Mesurer **coût et latence** par requête.
- Bonus : **observabilité** Langfuse.

## 📋 Énoncé

L'app à construire : un **assistant** qui répond aux questions sur le contenu d'un dossier de documents Markdown (par exemple : ce guide, ta doc de projet, les ADRs de ton équipe).

L'assistant doit :

1. **Ingérer** les fichiers `.md` d'un dossier (chunking, embeddings, stockage pgvector).
2. **Répondre** aux questions en streaming, en citant ses sources (`[doc.md:section]`).
3. **Refuser** poliment les questions hors sujet (« Je ne réponds qu'à propos de la doc fournie »).
4. **Afficher** la latence + le nombre de tokens dépensés.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| Ingestion script | `npm run ingest -- ./data/` indexe ≥ 50 chunks |
| Endpoint chat streaming | `POST /api/chat` SSE, < 1 s avant le premier token |
| Citations | Chaque réponse contient ≥ 1 lien `[fichier.md:ancre]` |
| Refus propre | Question hors sujet → réponse calibrée, pas d'hallucination |
| Système prompt strict | Référence `prompts/system.md`, versionné |
| UI minimale | Page `/` avec input + réponse en streaming |
| Token / latence | Affichés en footer après chaque réponse |
| Tests | au moins 3 tests d'évaluation (golden set) |
| README | comment démarrer, ajouter un doc, lancer les tests |

### Bonus

- **Recherche hybride** vector + BM25 + reranker (Cohere ou Voyage).
- **Observabilité Langfuse** branchée.
- **Cache** prompt (Anthropic) ou réponses fréquentes.
- **Multimodal** : ingérer des PDF (mupdf, pdfjs).
- **Évaluations** automatisées avec promptfoo.

## 🛠 Démarrer

```bash
cd canevas/

# 1. Installer
npm install

# 2. Variables d'environnement
cp .env.example .env
# Remplir ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL

# 3. Initialiser la DB
npm run db:init

# 4. Ingérer les docs
npm run ingest -- ./data/

# 5. Démarrer
npm run dev
# Ouvrir http://localhost:3000
```

### Ajouter un document

```bash
cp /path/to/doc.md canevas/data/
npm run ingest -- ./data/doc.md
```

## 🧪 Vérifier

```bash
# Tester un endpoint chat directement
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Qu est-ce que le RAG ?"}]}' \
  --no-buffer

# Tests d'évaluation
npm test
```

## 💡 Indices

<details>
<summary>1. Pipeline d'ingestion détaillé</summary>

```
1. Lister les fichiers .md
2. Pour chaque fichier :
   a. Lire le contenu
   b. Splitter en sections par H2/H3 (recursive splitter)
   c. Pour chaque section :
      - Chunker en ~800 tokens avec overlap 100
      - Calculer l'embedding (OpenAI text-embedding-3-small)
      - INSERT INTO doc_chunks (file, section, content, embedding)
3. Créer l'index HNSW : CREATE INDEX ON doc_chunks USING hnsw (embedding vector_cosine_ops)
```

Stratégies à essayer :
- **Recursive splitter** par paragraphes (LangChain ou maison)
- **Semantic chunking** (split quand l'embedding diverge)
- **Sliding window** avec overlap

</details>

<details>
<summary>2. System prompt minimal</summary>

```markdown
Tu es un assistant qui répond UNIQUEMENT à partir des extraits fournis ci-dessous.

Règles :
1. Si la réponse n'est pas dans les extraits, dis : "Je ne trouve pas l'information dans la documentation fournie."
2. Cite tes sources sous le format [fichier.md§section] après chaque affirmation.
3. Si la question ne concerne pas la documentation, refuse poliment.
4. Réponds en français, sauf si la question est en anglais.

Extraits :
{{context}}
```

</details>

<details>
<summary>3. Évaluations golden set</summary>

```ts
const goldenSet = [
  {
    question: "Qu'est-ce que SIWE ?",
    expectedKeywords: ['Sign-In With Ethereum', 'EIP-4361', 'signature'],
    expectedSources: ['16-specialisations/06-web3.mdx'],
  },
  {
    question: "Quel est le LCP cible Lighthouse ?",
    expectedKeywords: ['2.5', '2,5', 'seconds', 'secondes'],
    expectedSources: ['13-performance-a11y/01-mesurer.mdx'],
  },
  {
    question: "Quelle est la météo à Paris ?",
    expectedKeywords: ['ne trouve pas', 'documentation'],
    isOutOfScope: true,
  },
];
```

</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — assistant complet avec recherche hybride, citations forcées, observabilité.

## 📚 Pour aller plus loin

- **Recherche multi-tenant** : indexer plusieurs sources avec filtres user-level.
- **Document re-indexing** sur changement (file watcher + queue).
- **Multi-modèle** : laisser le user choisir Claude / GPT / Mistral.
- **Self-host LLM** : Ollama + Llama 3 70B local.
- **MCP server** : exposer ce RAG comme tool pour Claude Desktop.
