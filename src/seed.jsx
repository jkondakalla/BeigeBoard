/* BeigeBoard data model helpers.

   The hierarchy IS the product:
     year    → overarching intention. Spans the year.
     month   → milestone you'd be proud of this month.
     week    → what one week is for.
     day     → concrete task. Executable. Has a checkbox.
     subtask → smaller step under a day task.

   kind = 'goal' | 'task' | 'event'
   Data lives in the backend SQLite DB — this file only exports
   tree helpers and the dynamic today date.
*/

const TODAY_ISO = isoDate(new Date());

/* Source accounts — UI state only, not persisted. */
const INITIAL_ACCOUNTS = [
  { id: 'google',   connected: false, email: '',                       visible: true, kind: 'google'  },
  { id: 'outlook',  connected: false, email: '',                       visible: true, kind: 'outlook' },
  { id: 'icloud',   connected: false, email: '',                       visible: true, kind: 'icloud'  },
  { id: 'bb',       connected: true,  email: 'tasks · this device',    visible: true, kind: 'tasks'   },
];

/* ── Tree helpers ───────────────────────────────────────────────────── */

function getChildren(item, items) {
  return items.filter(it => it.parent_id === item.id);
}

function getDescendants(item, items) {
  const out = [];
  const stack = [item];
  while (stack.length) {
    const cur = stack.pop();
    const kids = getChildren(cur, items);
    out.push(...kids);
    stack.push(...kids);
  }
  return out;
}

function getAncestors(item, items) {
  const out = [];
  let cur = item;
  while (cur && cur.parent_id) {
    cur = items.find(i => i.id === cur.parent_id);
    if (cur) out.push(cur); else break;
  }
  return out;
}

function getAccent(item, items) {
  if (item.accent) return item.accent;
  for (const a of getAncestors(item, items)) if (a.accent) return a.accent;
  return null;
}

function getProgress(item, items) {
  const desc = getDescendants(item, items);
  const leaves = desc.filter(d => d.kind === 'task' && (!getChildren(d, items).length));
  if (leaves.length === 0) return { done: 0, total: 0, pct: 0 };
  const done = leaves.filter(l => l.completed).length;
  return { done, total: leaves.length, pct: Math.round((done / leaves.length) * 100) };
}

Object.assign(window, {
  TODAY_ISO, INITIAL_ACCOUNTS,
  getChildren, getDescendants, getAncestors, getAccent, getProgress,
});
