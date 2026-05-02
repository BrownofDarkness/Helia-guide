import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './modules/auth/auth.routes.js';
import tasksRoutes from './modules/tasks/tasks.routes.js';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', cors({ credentials: true, origin: '*' }));

  app.get('/health', async (c) => {
    try {
      await db.run(sql`SELECT 1`);
      return c.json({ status: 'ok', db: 'ok' });
    } catch (err) {
      return c.json({ status: 'ok', db: 'down', error: String(err) }, 503);
    }
  });

  app.route('/auth', authRoutes);
  app.route('/tasks', tasksRoutes);

  app.onError(errorHandler);

  return app;
}
