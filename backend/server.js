const express = require('express');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT    = process.env.PORT    || 3001;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'beigeBoard.db');

const app = express();
app.use(express.json());

/* ── Database ──────────────────────────────────────────────────────── */
const db = new sqlite3.Database(DB_PATH);

const run = (sql, p = []) => new Promise((res, rej) =>
  db.run(sql, p, function (e) { e ? rej(e) : res(this); }));
const all = (sql, p = []) => new Promise((res, rej) =>
  db.all(sql, p, (e, r) => e ? rej(e) : res(r)));
const get = (sql, p = []) => new Promise((res, rej) =>
  db.get(sql, p, (e, r) => e ? rej(e) : res(r)));

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    kind           TEXT    NOT NULL DEFAULT 'task',
    scope          TEXT    NOT NULL DEFAULT 'day',
    title          TEXT    NOT NULL,
    notes          TEXT,
    parent_id      INTEGER,
    accent         TEXT,
    source         TEXT    DEFAULT 'bb',
    completed      INTEGER DEFAULT 0,
    year           INTEGER,
    month          INTEGER,
    week_start     TEXT,
    due_date       TEXT,
    scheduled_time TEXT,
    scheduled_end  TEXT,
    location       TEXT,
    attendees      INTEGER,
    target         TEXT,
    created_at     TEXT    DEFAULT (datetime('now'))
  )`);

  const count = await get('SELECT COUNT(*) as n FROM items');
  if (count.n === 0) await seedDefaults();
}

/* Seed a minimal starting structure so the app isn't blank on first run */
async function seedDefaults() {
  const now = new Date();
  const yr  = now.getFullYear();
  const mo  = now.getMonth() + 1;

  /* Monday of current week */
  const d = new Date(now);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const weekStr = d.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const ins = async (data) => {
    const cols = Object.keys(data).join(', ');
    const phs  = Object.keys(data).map(() => '?').join(', ');
    const r = await run(`INSERT INTO items (${cols}) VALUES (${phs})`, Object.values(data));
    return r.lastID;
  };

  const g1 = await ins({ kind: 'goal', scope: 'year', title: 'Build something meaningful', accent: '#B85C3A', year: yr, source: 'bb' });
  const g2 = await ins({ kind: 'goal', scope: 'year', title: 'Stay healthy and consistent', accent: '#5A8A5A', year: yr, source: 'bb' });

  const m1 = await ins({ kind: 'goal', scope: 'month', title: 'Ship a working prototype', accent: '#B85C3A', parent_id: g1, year: yr, month: mo, source: 'bb' });
  const m2 = await ins({ kind: 'goal', scope: 'month', title: 'Establish a daily routine', accent: '#5A8A5A', parent_id: g2, year: yr, month: mo, source: 'bb' });

  const w1 = await ins({ kind: 'goal', scope: 'week', title: 'Foundation — get the basics running', accent: '#B85C3A', parent_id: m1, week_start: weekStr, source: 'bb' });
  const w2 = await ins({ kind: 'goal', scope: 'week', title: 'First week of the new routine', accent: '#5A8A5A', parent_id: m2, week_start: weekStr, source: 'bb' });

  await ins({ kind: 'task', scope: 'day', title: 'Define the core feature set', accent: '#B85C3A', parent_id: w1, due_date: todayStr, source: 'bb' });
  await ins({ kind: 'task', scope: 'day', title: 'Set up the project structure', accent: '#B85C3A', parent_id: w1, due_date: todayStr, source: 'bb' });
  await ins({ kind: 'task', scope: 'day', title: 'Morning stretch — 15 min', accent: '#5A8A5A', parent_id: w2, due_date: todayStr, scheduled_time: '07:00', scheduled_end: '07:15', source: 'bb' });
}

/* ── Helpers ───────────────────────────────────────────────────────── */
function toRow(raw) {
  if (!raw) return null;
  return { ...raw, completed: raw.completed === 1 };
}

async function cascadeDelete(id) {
  const children = await all('SELECT id FROM items WHERE parent_id = ?', [id]);
  for (const c of children) await cascadeDelete(c.id);
  await run('DELETE FROM items WHERE id = ?', [id]);
}

/* ── Routes ────────────────────────────────────────────────────────── */
app.get('/api/items', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM items ORDER BY id ASC');
    res.json(rows.map(toRow));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/items', async (req, res) => {
  try {
    const d = req.body;
    const cols = Object.keys(d).filter(k => k !== 'id').join(', ');
    const phs  = Object.keys(d).filter(k => k !== 'id').map(() => '?').join(', ');
    const vals = Object.keys(d).filter(k => k !== 'id').map(k =>
      typeof d[k] === 'boolean' ? (d[k] ? 1 : 0) : d[k]);
    const r = await run(`INSERT INTO items (${cols}) VALUES (${phs})`, vals);
    const row = await get('SELECT * FROM items WHERE id = ?', [r.lastID]);
    res.status(201).json(toRow(row));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const d = req.body;
    const sets = Object.keys(d).map(k => `${k} = ?`).join(', ');
    const vals = Object.keys(d).map(k =>
      typeof d[k] === 'boolean' ? (d[k] ? 1 : 0) : d[k]);
    await run(`UPDATE items SET ${sets} WHERE id = ?`, [...vals, id]);
    const row = await get('SELECT * FROM items WHERE id = ?', [id]);
    res.json(toRow(row));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await cascadeDelete(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Static files + SPA fallback ──────────────────────────────────── */
const STATIC = path.join(__dirname, '..');
app.use(express.static(STATIC));
app.get('*', (req, res) => {
  res.sendFile(path.join(STATIC, 'index.html'), err => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

/* ── Boot ──────────────────────────────────────────────────────────── */
init().then(() => {
  app.listen(PORT, () => console.log(`BeigeBoard running on :${PORT}`));
}).catch(e => { console.error('DB init failed:', e); process.exit(1); });
