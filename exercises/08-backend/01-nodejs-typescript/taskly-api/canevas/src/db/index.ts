import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { config } from '../config.js';
import * as schema from './schema.js';

const url =
  config.DATABASE_URL === ':memory:'
    ? 'file::memory:?cache=shared'
    : `file:${config.DATABASE_URL}`;

const client = createClient({ url });

export const db = drizzle(client, { schema });
