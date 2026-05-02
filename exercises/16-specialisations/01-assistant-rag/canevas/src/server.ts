// 🚧 Stub à compléter — voir correction/ pour la version complète.
// À implémenter :
// 1. Endpoint POST /api/chat qui :
//    a. Lit la dernière question utilisateur
//    b. Calcule son embedding
//    c. Recherche les top-5 chunks dans pgvector
//    d. Compose le system prompt avec le contexte
//    e. Streame la réponse via streamText (AI SDK)
// 2. Page GET / qui sert un mini front HTML/JS qui consomme l'endpoint via fetch + ReadableStream

import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.html('<h1>RAG canevas — à compléter</h1>'));
app.post('/api/chat', (c) => c.json({ error: 'TODO — implémenter' }, 501));

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`canevas → http://localhost:${port}`);
