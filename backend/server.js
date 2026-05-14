const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./todos.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    completed BOOLEAN DEFAULT 0,
    due_date DATE,
    scheduled_time TIME,
    scheduled_end TIME,
    parent_id INTEGER,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Silent migrations for existing databases
  db.run(`ALTER TABLE todos ADD COLUMN due_date DATE`, () => {});
  db.run(`ALTER TABLE todos ADD COLUMN scheduled_time TIME`, () => {});
  db.run(`ALTER TABLE todos ADD COLUMN scheduled_end TIME`, () => {});
  db.run(`ALTER TABLE todos ADD COLUMN parent_id INTEGER`, () => {});
  db.run(`ALTER TABLE todos ADD COLUMN color TEXT`, () => {});
});

// ── Todos ──────────────────────────────────────────────────────────────

app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos ORDER BY due_date ASC, created_at ASC', [], (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
});

app.post('/todos', (req, res) => {
  const { title, due_date, scheduled_time, scheduled_end, parent_id, color } = req.body;
  db.run(
    'INSERT INTO todos (title, due_date, scheduled_time, scheduled_end, parent_id, color) VALUES (?, ?, ?, ?, ?, ?)',
    [title, due_date || null, scheduled_time || null, scheduled_end || null, parent_id || null, color || null],
    function(err) {
      if (err) { res.status(500).json({ error: err.message }); return; }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const { completed, due_date, scheduled_time, scheduled_end, title, parent_id, color } = req.body;
  const updates = [], values = [];

  if (completed !== undefined)      { updates.push('completed = ?');      values.push(completed ? 1 : 0); }
  if (due_date !== undefined)       { updates.push('due_date = ?');       values.push(due_date); }
  if (scheduled_time !== undefined) { updates.push('scheduled_time = ?'); values.push(scheduled_time); }
  if (scheduled_end !== undefined)  { updates.push('scheduled_end = ?');  values.push(scheduled_end); }
  if (title !== undefined)          { updates.push('title = ?');          values.push(title); }
  if (parent_id !== undefined)      { updates.push('parent_id = ?');      values.push(parent_id); }
  if (color !== undefined)          { updates.push('color = ?');          values.push(color); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  values.push(id);
  db.run(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ changes: this.changes });
  });
});

app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  db.run(`
    WITH RECURSIVE tree(id) AS (
      SELECT id FROM todos WHERE id = ?
      UNION ALL
      SELECT t.id FROM todos t JOIN tree tr ON t.parent_id = tr.id
    )
    DELETE FROM todos WHERE id IN (SELECT id FROM tree)
  `, [id], function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ changes: this.changes });
  });
});


app.listen(3000, () => {
  console.log('BeigeBoard backend running on port 3000');
});
