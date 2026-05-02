import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('./data.db'),
  JWT_SECRET: z.string().min(16),
});

export const config = ConfigSchema.parse(process.env);
