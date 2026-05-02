import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateTaskSchema, UpdateTaskSchema, ListQuerySchema } from './tasks.schemas.js';
import * as tasksService from './tasks.service.js';
import { requireAuth, getUserId } from '../../middleware/jwt-auth.js';

const tasks = new Hono();

tasks.use('*', requireAuth);

tasks.get('/', zValidator('query', ListQuerySchema), async (c) => {
  const userId = getUserId(c);
  const { page, limit } = c.req.valid('query');
  const result = await tasksService.listTasks(userId, page, limit);
  return c.json(result);
});

tasks.post('/', zValidator('json', CreateTaskSchema), async (c) => {
  // TODO 18
  return c.json({ error: 'TODO' }, 500);
});

tasks.get('/:id', async (c) => {
  // TODO 19 : parse id, appeler getTask, retourner 404 si null
  return c.json({ error: 'TODO' }, 500);
});

tasks.patch('/:id', zValidator('json', UpdateTaskSchema), async (c) => {
  // TODO 20
  return c.json({ error: 'TODO' }, 500);
});

tasks.delete('/:id', async (c) => {
  // TODO 21 : 204 si supprimé, 404 sinon
  return c.json({ error: 'TODO' }, 500);
});

export default tasks;
