import type { Context } from 'hono';
import { ZodError } from 'zod';
import { HTTPException } from 'hono/http-exception';

export function errorHandler(err: Error, c: Context) {
  if (err instanceof ZodError) {
    return c.json({ errors: err.issues }, 422);
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
}
