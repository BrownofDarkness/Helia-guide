import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { config } from '../config.js';
import * as schema from './schema.js';

// libsql accepte 'file:./taskly.db' ou ':memory:' (en mémoire pour les tests).
const url =
  config.DATABASE_URL === ':memory:'
    ? 'file::memory:?cache=shared'
    : `file:${config.DATABASE_URL}`;

const client = createClient({ url });

// S'assure que les tables existent même sans avoir lancé db:migrate.
await client.executeMultiple(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    due_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`);

export const db = drizzle(client, { schema });
