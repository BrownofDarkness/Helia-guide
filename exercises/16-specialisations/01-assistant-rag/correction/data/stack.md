# Stack technique du projet

## LLM

Le projet utilise **Anthropic Claude Sonnet 4.6** comme modèle principal. Bon rapport qualité/prix, raisonnement solide, contexte long (200k tokens). Alternatives : GPT-4.x, Gemini 2.x, Mistral pour la souveraineté EU.

## Embeddings

`text-embedding-3-small` d'OpenAI. Dimension 1536, prix ~0.02$ par million de tokens. Suffisant pour les cas standards. Voyage AI ou Cohere pour plus de précision.

## Vector DB

**pgvector** intégré à Postgres 17. Avantages : 0 nouvelle infra, transactionnel avec le reste de la donnée, index HNSW performant.

## Backend

**Hono** sur Node 24. Le streaming est géré par le helper `streamSSE` ou directement par AI SDK via `toDataStreamResponse()`.

## Coûts estimés

Pour 10k questions / mois avec contexte de 4 chunks :

- Embeddings (questions) : ~0.5$
- LLM Claude Sonnet 4.6 : ~25-40$
- Total : ~30-50$ / mois

Activer le **prompt caching** Anthropic réduit de 50-90% le coût des tokens d'entrée répétitifs.
