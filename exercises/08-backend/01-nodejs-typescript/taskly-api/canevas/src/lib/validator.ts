/**
 * Helper validation — fourni complet, à utiliser dans tes routes :
 *
 *   import { validate } from '../../lib/validator.js';
 *   ...
 *   route.post('/', validate('json', MySchema), async (c) => { ... });
 *
 * Renvoie 422 (Unprocessable Entity) au lieu du 400 par défaut de zValidator.
 */
import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';

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
