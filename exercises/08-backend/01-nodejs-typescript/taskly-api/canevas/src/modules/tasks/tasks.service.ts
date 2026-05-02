import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { tasks } from '../../db/schema.js';
import type { z } from 'zod';
import type { CreateTaskSchema, UpdateTaskSchema } from './tasks.schemas.js';

export async function listTasks(ownerId: number, page: number, limit: number) {
  // TODO 13 : retourner { data, pagination: { total, page, limit } } pour les tâches du user
  // Astuce : COUNT(*) en sous-requête, OFFSET = (page - 1) * limit
  return { data: [], pagination: { total: 0, page, limit } };
}

export async function getTask(ownerId: number, id: number) {
  // TODO 14 : retourner la tâche si elle appartient à ownerId, sinon null
  return null;
}

export async function createTask(ownerId: number, input: z.infer<typeof CreateTaskSchema>) {
  // TODO 15 : insérer en DB et retourner la tâche complète
  throw new Error('TODO');
}

export async function updateTask(
  ownerId: number,
  id: number,
  input: z.infer<typeof UpdateTaskSchema>
) {
  // TODO 16 : update si propriétaire, retourner la tâche mise à jour ou null
  return null;
}

export async function deleteTask(ownerId: number, id: number): Promise<boolean> {
  // TODO 17 : supprimer si propriétaire, retourner true sinon false
  return false;
}
