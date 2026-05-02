/**
 * Crée le schéma SQLite si la DB n'existe pas encore.
 * En vrai projet : utiliser drizzle-kit pour générer/appliquer des migrations.
 */
import { createClient } from '@libsql/client';
import { config } from '../config.js';

const url =
  config.DATABASE_URL === ':memory:'
    ? 'file::memory:?cache=shared'
    : `file:${config.DATABASE_URL}`;

const client = createClient({ url });

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

console.log('✓ Schéma DB initialisé.');
client.close();
