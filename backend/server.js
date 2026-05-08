const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./todos.db');

db.run(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  completed BOOLEAN DEFAULT 0,
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Migration: add due_date if upgrading from old schema
db.run(`ALTER TABLE todos ADD COLUMN due_date DATE`, () => {});

app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos ORDER BY due_date ASC, created_at ASC', [], (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
});

app.post('/todos', (req, res) => {
  const { title, due_date } = req.body;
  db.run('INSERT INTO todos (title, due_date) VALUES (?, ?)', [title, due_date || null], function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ id: this.lastID });
  });
});

app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const { completed, due_date, title } = req.body;

  const updates = [];
  const values = [];

  if (completed !== undefined) { updates.push('completed = ?'); values.push(completed ? 1 : 0); }
  if (due_date !== undefined)  { updates.push('due_date = ?');  values.push(due_date); }
  if (title !== undefined)     { updates.push('title = ?');     values.push(title); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);
  db.run(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ changes: this.changes });
  });
});

app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ changes: this.changes });
  });
});

app.listen(3000, () => {
  console.log('BeigeBoard backend running on port 3000');
});
