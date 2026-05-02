import { hash } from '@node-rs/argon2';
import { db } from '../src/db.ts';

await db.executeMultiple(`
  DROP TABLE IF EXISTS tasks;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX idx_tasks_user_id ON tasks(user_id);
`);

const seeds: Array<[string, string, string, number]> = [
  ['alice@example.com', 'Alice', 'alice123', 0],
  ['bob@example.com', 'Bob', 'bob456', 0],
  ['admin@example.com', 'Admin', 'admin', 1],
];

for (const [email, name, password, isAdmin] of seeds) {
  // argon2id : memoryCost ~64 MiB, timeCost 3, parallelism 1 (recommandation OWASP).
  const ph = await hash(password, {
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 1,
  });
  await db.execute({
    sql: 'INSERT INTO users (email, name, password_hash, is_admin) VALUES (?, ?, ?, ?)',
    args: [email, name, ph, isAdmin],
  });
}

const tasks: Array<[number, string, number]> = [
  [1, "Lire l'OWASP Top 10", 1],
  [1, 'Auditer VulnTasks', 0],
  [2, 'Préparer la démo', 0],
  [3, 'Revoir les logs admin', 0],
];
for (const [userId, title, done] of tasks) {
  await db.execute({
    sql: 'INSERT INTO tasks (user_id, title, done) VALUES (?, ?, ?)',
    args: [userId, title, done],
  });
}

console.log('Base initialisée — argon2id, 3 users, 4 tasks.');
