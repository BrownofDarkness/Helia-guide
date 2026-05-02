import { Hono } from 'hono';
import { CreateTaskSchema, UpdateTaskSchema, ListQuerySchema } from './tasks.schemas.js';
import * as tasksService from './tasks.service.js';
import { requireAuth, getUserId } from '../../middleware/jwt-auth.js';
import { validate } from '../../lib/validator.js';

const tasks = new Hono();

tasks.use('*', requireAuth);

tasks.get('/', validate('query', ListQuerySchema), async (c) => {
  const userId = getUserId(c);
  const { page, limit } = c.req.valid('query');
  const result = await tasksService.listTasks(userId, page, limit);
  return c.json(result);
});

tasks.post('/', validate('json', CreateTaskSchema), async (c) => {
  const userId = getUserId(c);
  const task = await tasksService.createTask(userId, c.req.valid('json'));
  return c.json(task, 201);
});

tasks.get('/:id', async (c) => {
  const userId = getUserId(c);
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) return c.json({ error: 'Invalid id' }, 400);
  const task = await tasksService.getTask(userId, id);
  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json(task);
});

tasks.patch('/:id', validate('json', UpdateTaskSchema), async (c) => {
  const userId = getUserId(c);
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) return c.json({ error: 'Invalid id' }, 400);
  const task = await tasksService.updateTask(userId, id, c.req.valid('json'));
  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json(task);
});

tasks.delete('/:id', async (c) => {
  const userId = getUserId(c);
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) return c.json({ error: 'Invalid id' }, 400);
  const ok = await tasksService.deleteTask(userId, id);
  if (!ok) return c.json({ error: 'Task not found' }, 404);
  return c.body(null, 204);
});

export default tasks;
