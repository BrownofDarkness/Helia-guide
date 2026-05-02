import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.log(`✓ taskly-api listening on http://localhost:${info.port}`);
});
