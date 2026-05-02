import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { tasks } from '../../db/schema.js';
import type { Task } from '../../db/schema.js';
import type { z } from 'zod';
import type { CreateTaskSchema, UpdateTaskSchema } from './tasks.schemas.js';

export interface PaginatedTasks {
  data: Task[];
  pagination: { total: number; page: number; limit: number };
}

export async function listTasks(ownerId: number, page: number, limit: number): Promise<PaginatedTasks> {
  const offset = (page - 1) * limit;

  const countRows = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(tasks)
    .where(eq(tasks.ownerId, ownerId));
  const total = Number(countRows[0]?.total ?? 0);

  const data = await db
    .select()
    .from(tasks)
    .where(eq(tasks.ownerId, ownerId))
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset);

  return { data, pagination: { total, page, limit } };
}

export async function getTask(ownerId: number, id: number): Promise<Task | null> {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createTask(
  ownerId: number,
  input: z.infer<typeof CreateTaskSchema>
): Promise<Task> {
  const inserted = await db
    .insert(tasks)
    .values({
      ownerId,
      title: input.title,
      description: input.description ?? null,
      dueAt: input.dueAt ?? null,
    })
    .returning();

  const task = inserted[0];
  if (!task) throw new Error('Insert failed');
  return task;
}

export async function updateTask(
  ownerId: number,
  id: number,
  input: z.infer<typeof UpdateTaskSchema>
): Promise<Task | null> {
  const fields: Record<string, unknown> = {};
  if (input.title !== undefined) fields.title = input.title;
  if (input.description !== undefined) fields.description = input.description;
  if (input.dueAt !== undefined) fields.dueAt = input.dueAt;
  if (input.done !== undefined) fields.done = input.done;

  if (Object.keys(fields).length === 0) {
    return getTask(ownerId, id);
  }

  const updated = await db
    .update(tasks)
    .set(fields)
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)))
    .returning();

  return updated[0] ?? null;
}

export async function deleteTask(ownerId: number, id: number): Promise<boolean> {
  const result = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)))
    .returning({ id: tasks.id });
  return result.length > 0;
}
