import express from 'express';
import pg from 'pg';

const app = express();
const port = Number(process.env.PORT ?? 3000);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'ok', db: 'down', error: (err as Error).message });
  }
});

app.get('/items', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, name, created_at FROM items ORDER BY id');
  res.json(rows);
});

app.post('/items', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name required' });
  }
  const { rows } = await pool.query(
    'INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at',
    [name]
  );
  res.status(201).json(rows[0]);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
