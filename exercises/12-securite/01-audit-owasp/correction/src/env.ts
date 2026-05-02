import { z } from 'zod';

const schema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
  DATABASE_FILE: z.string().default('./vulntasks.db'),
  PORT: z.coerce.number().int().positive().default(3000),
  ALLOWED_ORIGIN: z.string().url().default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Variables d\'environnement invalides :');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
