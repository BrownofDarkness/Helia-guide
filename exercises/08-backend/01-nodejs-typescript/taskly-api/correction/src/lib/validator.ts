import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';

/**
 * zValidator avec un hook qui renvoie 422 (Unprocessable Entity)
 * au lieu du 400 par défaut, conforme à la convention REST moderne.
 */
export function validate<T extends ZodSchema>(target: 'json' | 'query' | 'param', schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', issues: result.error.issues },
        422
      );
    }
  });
}
