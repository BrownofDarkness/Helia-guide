/**
 * Client libsql (drop-in async, prébuilds toutes plateformes — vs better-sqlite3
 * qui nécessite la compilation native sous Windows + Node 24).
 */
import { createClient } from '@libsql/client';

const dbFile = process.env.DATABASE_FILE ?? './vulntasks.db';

const url = dbFile === ':memory:' ? 'file::memory:?cache=shared' : `file:${dbFile}`;

export const db = createClient({ url });

await db.execute('PRAGMA journal_mode = WAL');
await db.execute('PRAGMA foreign_keys = ON');
