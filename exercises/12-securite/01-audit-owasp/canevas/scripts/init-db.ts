import { createHash } from 'node:crypto';
import { db } from '../src/db.ts';

await db.executeMultiple(`
  DROP TABLE IF EXISTS tasks;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_md5 TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Hash MD5 — vulnérabilité plantée n°2 (A07).
function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

const seeds: Array<[string, string, string, number]> = [
  ['alice@example.com', 'Alice', md5('alice123'), 0],
  ['bob@example.com', 'Bob', md5('bob456'), 0],
  ['admin@example.com', 'Admin', md5('admin'), 1],
];
for (const [email, name, hash, isAdmin] of seeds) {
  await db.execute({
    sql: 'INSERT INTO users (email, name, password_md5, is_admin) VALUES (?, ?, ?, ?)',
    args: [email, name, hash, isAdmin],
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

console.log('Base initialisée — 3 users, 4 tasks.');
console.log('Comptes : alice@example.com / alice123, bob@example.com / bob456, admin@example.com / admin');
