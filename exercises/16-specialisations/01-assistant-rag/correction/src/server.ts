import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { retrieve } from './retrieval.ts';
import { SYSTEM_PROMPT, buildContextBlock } from './prompts.ts';

const app = new Hono();

app.use('*', cors({ origin: '*' }));

app.get('/', (c) =>
  c.html(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>RAG Assistant</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    textarea { width: 100%; padding: .6rem; font: inherit; }
    button { padding: .6rem 1.2rem; font: inherit; cursor: pointer; }
    pre { white-space: pre-wrap; background: #f5f5f5; padding: 1rem; border-radius: .5rem; }
    .meta { color: #666; font-size: .85em; margin-top: .5rem; }
  </style>
</head>
<body>
  <h1>📚 Assistant RAG</h1>
  <p>Réponses basées sur les documents indexés.</p>
  <textarea id="q" rows="3" placeholder="Pose ta question…"></textarea>
  <p><button id="send">Envoyer</button></p>
  <pre id="out"></pre>
  <div class="meta" id="meta"></div>
<script>
  const out = document.getElementById('out');
  const meta = document.getElementById('meta');
  document.getElementById('send').onclick = async () => {
    const q = document.getElementById('q').value.trim();
    if (!q) return;
    out.textContent = '';
    meta.textContent = 'Recherche…';
    const t0 = performance.now();
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: q }] }),
    });
    if (!res.body) return;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let usage;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = dec.decode(value);
      // AI SDK data-stream protocol : on prend ce qu'on connaît
      for (const line of chunk.split('\\n')) {
        if (line.startsWith('0:')) {
          // text delta — JSON-encoded string
          try { out.textContent += JSON.parse(line.slice(2)); } catch {}
        } else if (line.startsWith('e:') || line.startsWith('d:')) {
          try { usage = JSON.parse(line.slice(2)).usage; } catch {}
        }
      }
    }
    const t = Math.round(performance.now() - t0);
    meta.textContent = usage
      ? \`\${t} ms · \${usage.promptTokens} prompt + \${usage.completionTokens} completion tokens\`
      : \`\${t} ms\`;
  };
</script>
</body>
</html>`)
);

const chatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
});

app.post('/api/chat', async (c) => {
  const parsed = chatSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'invalid body' }, 400);

  const userMsg = parsed.data.messages.findLast((m) => m.role === 'user');
  if (!userMsg) return c.json({ error: 'no user message' }, 400);

  const chunks = await retrieve(userMsg.content);
  const context = buildContextBlock(chunks);

  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: `${SYSTEM_PROMPT}\n\n--- CONTEXTE ---\n\n${context}`,
    messages: parsed.data.messages,
    maxTokens: 800,
    temperature: 0.2,
  });

  return result.toDataStreamResponse();
});

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`RAG assistant → http://localhost:${port}`);

export { app };
