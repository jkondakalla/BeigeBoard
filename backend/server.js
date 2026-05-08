const express = require('express');

const cors = require('cors');

const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(cors());

app.use(express.json());

// Initialize SQLite database

const db = new sqlite3.Database('./todos.db');

// Create todos table if not exists

db.run(`CREATE TABLE IF NOT EXISTS todos (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  title TEXT,

  completed BOOLEAN DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)`);

app.get('/todos', (req, res) => {

  db.all('SELECT * FROM todos', [], (err, rows) => {

    if (err) {

      res.status(500).json({ error: err.message });

      return;

    }

    res.json(rows);

  });

});

app.post('/todos', (req, res) => {

  const { title } = req.body;

  db.run('INSERT INTO todos (title) VALUES (?)', [title], function(err) {

    if (err) {

      res.status(500).json({ error: err.message });

      return;

    }

    res.json({ id: this.lastID });

  });

});

app.put('/todos/:id', (req, res) => {

  const { id } = req.params;

  const { completed } = req.body;

  db.run('UPDATE todos SET completed = ? WHERE id = ?', [completed, id], function(err) {

    if (err) {

      res.status(500).json({ error: err.message });

      return;

    }

    res.json({ changes: this.changes });

  });

});

app.delete('/todos/:id', (req, res) => {

  const { id } = req.params;

  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {

    if (err) {

      res.status(500).json({ error: err.message });

      return;

    }

    res.json({ changes: this.changes });

  });

});

app.listen(3000, () => {

  console.log('BeigeBoard backend running on port 3000');

});