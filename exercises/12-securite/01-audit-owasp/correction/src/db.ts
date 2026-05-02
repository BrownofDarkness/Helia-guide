/**
 * Client libsql (drop-in async, prébuilds toutes plateformes).
 *
 * Pourquoi pas better-sqlite3 ? Sous Node 24 + Windows, le module natif
 * exige les Visual C++ Build Tools (~5 GB) parce que les prébuilds n'existent
 * pas encore. @libsql/client (fork Turso de SQLite, pure async) résout ça.
 * Voir piège `better-sqlite3-windows-build` dans /pieges/.
 */
import { createClient } from '@libsql/client';

const dbFile = process.env.DATABASE_FILE ?? './vulntasks.db';

const url = dbFile === ':memory:' ? 'file::memory:?cache=shared' : `file:${dbFile}`;

export const db = createClient({ url });

await db.execute('PRAGMA journal_mode = WAL');
await db.execute('PRAGMA foreign_keys = ON');
