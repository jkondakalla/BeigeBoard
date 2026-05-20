const express = require('express');
const cors    = require('cors');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT    = process.env.PORT    || 3000;
const DB_PATH = process.env.DB_PATH || './todos.db';

const app = express();

if (process.env.NODE_ENV !== 'production') app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db  = new sqlite3.Database(DB_PATH);
const run = (sql, p = []) => new Promise((res, rej) =>
  db.run(sql, p, function (e) { e ? rej(e) : res(this); }));
const all = (sql, p = []) => new Promise((res, rej) =>
  db.all(sql, p, (e, r) => e ? rej(e) : res(r)));

db.serialize(() => db.run(`CREATE TABLE IF NOT EXISTS todos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT,
  completed      BOOLEAN DEFAULT 0,
  due_date       DATE,
  scheduled_time TIME,
  scheduled_end  TIME,
  parent_id      INTEGER,
  color          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
)`));

// ── Todos ───────────────────────────────────────────────────────────────

app.get('/todos', async (req, res) => {
  try { res.json(await all('SELECT * FROM todos ORDER BY due_date ASC, created_at ASC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/todos', async (req, res) => {
  const { title, due_date, scheduled_time, scheduled_end, parent_id, color } = req.body;
  try {
    const r = await run(
      'INSERT INTO todos (title, due_date, scheduled_time, scheduled_end, parent_id, color) VALUES (?,?,?,?,?,?)',
      [title, due_date || null, scheduled_time || null, scheduled_end || null, parent_id || null, color || null]
    );
    res.json({ id: r.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/todos/:id', async (req, res) => {
  const { completed, due_date, scheduled_time, scheduled_end, title, parent_id, color } = req.body;
  const updates = [], values = [];

  if (completed      !== undefined) { updates.push('completed = ?');      values.push(completed ? 1 : 0); }
  if (due_date       !== undefined) { updates.push('due_date = ?');       values.push(due_date); }
  if (scheduled_time !== undefined) { updates.push('scheduled_time = ?'); values.push(scheduled_time); }
  if (scheduled_end  !== undefined) { updates.push('scheduled_end = ?');  values.push(scheduled_end); }
  if (title          !== undefined) { updates.push('title = ?');          values.push(title); }
  if (parent_id      !== undefined) { updates.push('parent_id = ?');      values.push(parent_id); }
  if (color          !== undefined) { updates.push('color = ?');          values.push(color); }

  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  try {
    const r = await run(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`, [...values, req.params.id]);
    res.json({ changes: r.changes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/todos/:id', async (req, res) => {
  try {
    const r = await run(`
      WITH RECURSIVE tree(id) AS (
        SELECT id FROM todos WHERE id = ?
        UNION ALL
        SELECT t.id FROM todos t JOIN tree tr ON t.parent_id = tr.id
      )
      DELETE FROM todos WHERE id IN (SELECT id FROM tree)
    `, [req.params.id]);
    res.json({ changes: r.changes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback — serves index.html in production; no-ops in dev
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'), err => {
    if (err) res.status(404).json({ message: 'BeigeBoard API' });
  }));

app.listen(PORT, () => console.log(`BeigeBoard on :${PORT}`));
