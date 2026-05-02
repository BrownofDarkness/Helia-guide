# Sécurité d'un assistant RAG

## Prompt injection

Un utilisateur peut tenter de détourner le LLM via des instructions glissées dans son message. Mitigations :

- System prompt strict avec frontières explicites.
- Séparation system / user dans l'API LLM.
- Allowlist de tools : un agent ne devrait pas avoir tous les pouvoirs en permanence.
- Output validation : vérifier que la réponse respecte le format attendu (Zod).

## Fuites de données

- Ne JAMAIS mettre de PII (mots de passe, tokens, IBAN) dans le contexte.
- Filtrer les chunks avant l'envoi au LLM.
- Loguer sans les payloads sensibles côté Langfuse / Helicone.

## Coûts maîtrisés

- `maxTokens` strict sur chaque appel.
- Rate-limit par user (5 questions / min typique).
- Monitoring tokens / user / jour avec alerte au dépassement.
- Prompt caching Anthropic : -50 à -90% sur les inputs répétés.
- Choix du modèle adapté (Haiku 4.5 < Sonnet 4.6 < Opus 4.7) selon la complexité.

## Maximiser la qualité

- Hybrid search vector + BM25 + RRF.
- Reranker (Cohere Rerank 3, Voyage Rerank-2) pour les top-K finaux.
- Évaluations automatisées sur un golden set (promptfoo, Langfuse evals).
- Citations forcées dans la réponse.
