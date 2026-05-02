import type { Context } from 'hono';
import { ZodError } from 'zod';
import { HTTPException } from 'hono/http-exception';

/**
 * Middleware d'erreur global.
 * À compléter pour gérer ZodError → 422, HTTPException → status approprié,
 * autres erreurs → 500.
 */
export function errorHandler(err: Error, c: Context) {
  // TODO 4 :
  // - si ZodError, retourner 422 avec { errors: err.issues }
  // - si HTTPException, utiliser err.getResponse()
  // - sinon, log et retourner 500 { error: 'Internal Server Error' }
  console.error(err);
  return c.json({ error: 'TODO' }, 500);
}
