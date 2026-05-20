/* BeigeBoard data model — the hierarchy IS the product.

   A single tree of items. Every item knows its parent via parent_id.
   `scope` declares the timeframe it occupies:

     year   → an overarching intention. Spans the year. Never "completed".
     month  → a milestone you'd be proud of finishing this month.
     week   → what one week is for.
     day    → a concrete task. Executable. Has a checkbox.
     subtask → smaller step under a day task. Executable.

   kind   = 'goal' | 'task' | 'event'
     goals (year/month/week) are intentions: serif, no checkbox.
     tasks (day/subtask)     are actions:    sans, checkbox.
     events come from connected calendars; outside the goal tree.

   Today: Wednesday May 20, 2026 · W21.
*/

const TODAY_ISO = '2026-05-20';

const ACCENT = {
  marathon: '#4E7250', // sage
  product:  '#3A5C78', // slate
  reading:  '#7A5070', // mauve
  italian:  '#A07828', // amber
  present:  '#B05040', // rust
};

let _id = 1000;
const nid = () => ++_id;

const G = (o) => ({ id: o.id || nid(), kind: 'goal',  completed: false, ...o });
const T = (o) => ({ id: o.id || nid(), kind: 'task',  completed: false, source: 'bb', scope: 'day', ...o });
const E = (o) => ({ id: o.id || nid(), kind: 'event', ...o });

/* ── YEAR GOALS — what 2026 is for ──────────────────────────────────── */
const YEAR_GOALS = [
  G({ id: 100, scope: 'year', year: 2026, accent: ACCENT.marathon, source: 'personal',
    title: 'Run my first marathon',
    target: 'NYC Marathon · Nov 1',
    notes: 'Sub-4 if it comes. The real goal is the start line.' }),

  G({ id: 200, scope: 'year', year: 2026, accent: ACCENT.product, source: 'work',
    title: 'Ship BeigeBoard v2 to a thousand paying users',
    target: 'GA by end of Q3',
    notes: 'Calendar sync. Mobile widget. Sharing. The missing trio.' }),

  G({ id: 300, scope: 'year', year: 2026, accent: ACCENT.reading, source: 'personal',
    title: 'Read twenty-four books',
    target: '12 fiction · 8 nonfiction · 4 reread',
    notes: 'Thirty minutes every morning. No phone in the kitchen.' }),

  G({ id: 400, scope: 'year', year: 2026, accent: ACCENT.italian, source: 'personal',
    title: 'Hold a half-hour conversation in Italian',
    target: 'Florence · October',
    notes: 'Thirty minutes a day on the app. Weekly tutor. Podcast on walks.' }),

  G({ id: 500, scope: 'year', year: 2026, accent: ACCENT.present, source: 'personal',
    title: 'Be a more present partner and friend',
    target: 'A pattern, not a checkbox',
    notes: 'One real visit a month. Phone face-down at dinner.' }),
];

/* ── MONTH MILESTONES ───────────────────────────────────────────────── */
const MONTH_GOALS = [
  /* Marathon */
  G({ id: 110, parent_id: 100, scope: 'month', year: 2026, month: 5,  accent: ACCENT.marathon, source: 'personal',
    title: 'Build base to 30 miles per week' }),
  G({ id: 111, parent_id: 100, scope: 'month', year: 2026, month: 6,  accent: ACCENT.marathon, source: 'personal',
    title: 'First half-marathon, easy effort' }),
  G({ id: 112, parent_id: 100, scope: 'month', year: 2026, month: 7,  accent: ACCENT.marathon, source: 'personal',
    title: 'Add tempo work, hold 35 mpw' }),
  G({ id: 113, parent_id: 100, scope: 'month', year: 2026, month: 8,  accent: ACCENT.marathon, source: 'personal',
    title: 'Long run to 16 miles' }),
  G({ id: 114, parent_id: 100, scope: 'month', year: 2026, month: 9,  accent: ACCENT.marathon, source: 'personal',
    title: 'Peak training. 40 mpw.' }),
  G({ id: 115, parent_id: 100, scope: 'month', year: 2026, month: 10, accent: ACCENT.marathon, source: 'personal',
    title: 'Taper. Don\'t do anything dumb.' }),

  /* Product */
  G({ id: 210, parent_id: 200, scope: 'month', year: 2026, month: 5,  accent: ACCENT.product, source: 'work',
    title: 'Ship calendar-sync beta to fifty users' }),
  G({ id: 211, parent_id: 200, scope: 'month', year: 2026, month: 5,  accent: ACCENT.product, source: 'work',
    title: 'Cut onboarding under two minutes' }),
  G({ id: 212, parent_id: 200, scope: 'month', year: 2026, month: 6,  accent: ACCENT.product, source: 'work',
    title: 'Mobile widget · public beta' }),
  G({ id: 213, parent_id: 200, scope: 'month', year: 2026, month: 7,  accent: ACCENT.product, source: 'work',
    title: 'Sharing & invites land' }),
  G({ id: 214, parent_id: 200, scope: 'month', year: 2026, month: 8,  accent: ACCENT.product, source: 'work',
    title: 'GA release. Press push.' }),

  /* Reading */
  G({ id: 310, parent_id: 300, scope: 'month', year: 2026, month: 5,  accent: ACCENT.reading, source: 'personal',
    title: 'Finish "The Overstory"' }),
  G({ id: 311, parent_id: 300, scope: 'month', year: 2026, month: 5,  accent: ACCENT.reading, source: 'personal',
    title: 'Start "A Pattern Language" — slow' }),

  /* Italian */
  G({ id: 410, parent_id: 400, scope: 'month', year: 2026, month: 5,  accent: ACCENT.italian, source: 'personal',
    title: 'Pass A2 unit test' }),

  /* Present */
  G({ id: 510, parent_id: 500, scope: 'month', year: 2026, month: 5,  accent: ACCENT.present, source: 'personal',
    title: 'A weeknight dinner with Mom (cook together)' }),
  G({ id: 511, parent_id: 500, scope: 'month', year: 2026, month: 5,  accent: ACCENT.present, source: 'personal',
    title: 'A real visit with Theo before he moves' }),
];

/* ── WEEK THEMES — for the week of May 18–24 (this week) ────────────── */
const WEEK_GOALS = [
  G({ id: 1101, parent_id: 110, scope: 'week', weekStart: '2026-05-18', accent: ACCENT.marathon, source: 'personal',
    title: 'Add a long run on Sunday' }),
  G({ id: 1102, parent_id: 110, scope: 'week', weekStart: '2026-05-18', accent: ACCENT.marathon, source: 'personal',
    title: 'Three weekday runs, easy effort' }),

  G({ id: 2101, parent_id: 210, scope: 'week', weekStart: '2026-05-18', accent: ACCENT.product, source: 'work',
    title: 'Ship calendar-import to the dogfood channel' }),
  G({ id: 2102, parent_id: 211, scope: 'week', weekStart: '2026-05-18', accent: ACCENT.product, source: 'work',
    title: 'Cut three steps from sign-up' }),

  G({ id: 3101, parent_id: 310, scope: 'week', weekStart: '2026-05-18', accent: ACCENT.reading, source: 'personal',
    title: 'Eighty pages of The Overstory' }),

  G({ id: 4101, parent_id: 410, scope: 'week', weekStart: '2026-05-18', accent: ACCENT.italian, source: 'personal',
    title: 'A2 chapter 3 finished, tutor on Friday' }),

  G({ id: 5101, parent_id: 510, scope: 'week', weekStart: '2026-05-18', accent: ACCENT.present, source: 'personal',
    title: "Call Mom early in the week, plan the dinner" }),
];

/* ── DAY TASKS — concrete, executable. ──────────────────────────────── */

/* This week's tasks, distributed across May 18–24 */
const DAY_TASKS = [
  /* Mon May 18 — already mostly done */
  T({ parent_id: 1102, accent: ACCENT.marathon, due_date: '2026-05-18', completed: true,
    title: 'Easy 4 mi · Riverside loop', scheduled_time: '07:30', scheduled_end: '08:15' }),
  T({ parent_id: 2101, accent: ACCENT.product,  due_date: '2026-05-18', completed: true,
    title: 'Spec calendar-sync edge cases (recurring + tz)' }),
  T({ parent_id: 2102, accent: ACCENT.product,  due_date: '2026-05-18', completed: true,
    title: 'Audit the current sign-up flow, list every step' }),
  T({ parent_id: 3101, accent: ACCENT.reading,  due_date: '2026-05-18', completed: true,
    title: 'Thirty pages of The Overstory', scheduled_time: '06:30', scheduled_end: '07:00' }),
  T({ parent_id: 4101, accent: ACCENT.italian,  due_date: '2026-05-18',
    title: 'A2 ch.3 lessons 1–2' }),

  /* Tue May 19 */
  T({ parent_id: 2101, accent: ACCENT.product,  due_date: '2026-05-19', completed: true,
    title: 'Land the OAuth refactor PR' }),
  T({ parent_id: 5101, accent: ACCENT.present,  due_date: '2026-05-19', completed: true,
    title: 'Call Mom · pick a dinner night' }),
  T({ parent_id: 3101, accent: ACCENT.reading,  due_date: '2026-05-19',
    title: 'Thirty more pages', scheduled_time: '06:30', scheduled_end: '07:00' }),

  /* Wed May 20 — TODAY */
  T({ id: 9001, parent_id: 3101, accent: ACCENT.reading,  due_date: '2026-05-20',
    title: 'Thirty pages of The Overstory', scheduled_time: '06:30', scheduled_end: '07:00' }),
  T({ id: 9002, parent_id: 1102, accent: ACCENT.marathon, due_date: '2026-05-20',
    title: 'Easy 5 mi or rest if legs need it', scheduled_time: '07:30', scheduled_end: '08:30' }),
  T({ id: 9003, parent_id: 2101, accent: ACCENT.product,  due_date: '2026-05-20',
    title: 'Push the import-progress UI to staging' }),
  T({ id: 9004, parent_id: 2102, accent: ACCENT.product,  due_date: '2026-05-20',
    title: 'Write the new sign-up copy (two screens)' }),
  T({ id: 9005, parent_id: 4101, accent: ACCENT.italian,  due_date: '2026-05-20',
    title: 'A2 ch.3 lesson 3 plus ten flashcards' }),
  T({ id: 9006,                    accent: '#7A6050', due_date: '2026-05-20',
    title: 'Pay rent', priority: 'high', source: 'bb' }),
  T({ id: 9007,                    accent: '#7A6050', due_date: '2026-05-20',
    title: 'Reply to Maria about hiring', source: 'bb' }),
  T({ id: 9008, parent_id: 510,  accent: ACCENT.present,  due_date: '2026-05-20',
    title: 'Pick the recipe for Friday with Mom' }),

  /* Sub-tasks under 9004 (Write sign-up copy) — demonstrate nesting */
  T({ id: 9041, parent_id: 9004, accent: ACCENT.product,  due_date: '2026-05-20', scope: 'subtask',
    title: 'Welcome screen — one sentence' }),
  T({ id: 9042, parent_id: 9004, accent: ACCENT.product,  due_date: '2026-05-20', scope: 'subtask',
    title: 'Permissions screen — explain the "why"' }),
  T({ id: 9043, parent_id: 9004, accent: ACCENT.product,  due_date: '2026-05-20', scope: 'subtask',
    title: 'Final ready-to-go screen' }),

  /* Thu May 21 */
  T({ parent_id: 1102, accent: ACCENT.marathon, due_date: '2026-05-21',
    title: '6 × 400m intervals on the track', scheduled_time: '18:00', scheduled_end: '19:00' }),
  T({ parent_id: 2101, accent: ACCENT.product,  due_date: '2026-05-21',
    title: 'Wire calendar-sync into Settings UI' }),
  T({ parent_id: 3101, accent: ACCENT.reading,  due_date: '2026-05-21',
    title: 'Thirty pages', scheduled_time: '06:30', scheduled_end: '07:00' }),

  /* Fri May 22 */
  T({ parent_id: 2101, accent: ACCENT.product,  due_date: '2026-05-22',
    title: 'Demo calendar-sync to the team', scheduled_time: '15:00', scheduled_end: '15:30' }),
  T({ parent_id: 4101, accent: ACCENT.italian,  due_date: '2026-05-22',
    title: 'Tutor · Anna (thirty minutes)', scheduled_time: '17:30', scheduled_end: '18:00' }),
  T({ parent_id: 510,  accent: ACCENT.present,  due_date: '2026-05-22',
    title: 'Cook with Mom · risotto', scheduled_time: '19:00', scheduled_end: '21:30' }),
  T({ parent_id: 3101, accent: ACCENT.reading,  due_date: '2026-05-22',
    title: 'Thirty pages', scheduled_time: '06:30', scheduled_end: '07:00' }),

  /* Sat May 23 */
  T({ parent_id: 3101, accent: ACCENT.reading,  due_date: '2026-05-23',
    title: 'Reading hour · coffee shop', scheduled_time: '08:00', scheduled_end: '09:00' }),

  /* Sun May 24 — the long run */
  T({ id: 9100, parent_id: 1101, accent: ACCENT.marathon, due_date: '2026-05-24',
    title: 'Long run · 10 mi · West Side', scheduled_time: '07:30', scheduled_end: '09:30' }),
  T({ id: 9101, parent_id: 9100, accent: ACCENT.marathon, due_date: '2026-05-24', scope: 'subtask',
    title: 'Lay out kit and gels the night before' }),
  T({ id: 9102, parent_id: 9100, accent: ACCENT.marathon, due_date: '2026-05-24', scope: 'subtask',
    title: 'Map the route before leaving' }),
  T({ id: 9103, parent_id: 9100, accent: ACCENT.marathon, due_date: '2026-05-24', scope: 'subtask',
    title: 'Foam roll and a ten-minute walk after' }),
  T({ parent_id: 3101, accent: ACCENT.reading,  due_date: '2026-05-24',
    title: 'Thirty pages', scheduled_time: '06:30', scheduled_end: '07:00' }),
];

/* ── EVENTS from connected calendars (no goal tree) ─────────────────── */
const EVENTS = [
  /* Mon */
  E({ source: 'work',     due_date: '2026-05-18', scheduled_time: '09:00', scheduled_end: '09:30', title: 'Eng standup' }),
  E({ source: 'work',     due_date: '2026-05-18', scheduled_time: '14:00', scheduled_end: '15:30', title: 'Q3 planning workshop', location: 'Atrium', attendees: 18 }),
  E({ source: 'personal', due_date: '2026-05-18', scheduled_time: '12:30', scheduled_end: '13:30', title: 'Lunch w/ Sam' }),
  /* Tue */
  E({ source: 'work',     due_date: '2026-05-19', scheduled_time: '09:30', scheduled_end: '10:30', title: 'Eng review · Q2 retros', attendees: 9 }),
  E({ source: 'outlook',  due_date: '2026-05-19', scheduled_time: '11:00', scheduled_end: '12:00', title: 'Acme · discovery call', location: 'Teams', attendees: 4 }),
  /* Wed (today) */
  E({ source: 'work',     due_date: '2026-05-20', scheduled_time: '09:00', scheduled_end: '09:30', title: 'Eng standup' }),
  E({ source: 'work',     due_date: '2026-05-20', scheduled_time: '10:00', scheduled_end: '11:00', title: 'Quarterly all-hands', location: 'Auditorium', attendees: 84 }),
  E({ source: 'personal', due_date: '2026-05-20', scheduled_time: '13:00', scheduled_end: '14:00', title: 'Lunch w/ Ben', location: 'Court St. Grocers' }),
  E({ source: 'outlook',  due_date: '2026-05-20', scheduled_time: '15:00', scheduled_end: '16:00', title: 'Northwind · kickoff', location: 'Teams', attendees: 7 }),
  /* Thu */
  E({ source: 'work',     due_date: '2026-05-21', scheduled_time: '09:00', scheduled_end: '10:00', title: 'Sprint planning' }),
  E({ source: 'work',     due_date: '2026-05-21', scheduled_time: '10:30', scheduled_end: '11:30', title: '1:1 — EM' }),
  /* Sat */
  E({ source: 'personal', due_date: '2026-05-23', scheduled_time: '13:00', scheduled_end: '15:00', title: 'Brunch · family', location: 'Buvette', attendees: 4 }),
  E({ source: 'personal', due_date: '2026-05-23', scheduled_time: '19:00', scheduled_end: '22:00', title: 'Wedding · Rachel & Theo', location: 'The Foundry, LIC', attendees: 120 }),
];

const INITIAL_ACCOUNTS = [
  { id: 'work',     connected: true,  email: 'jaag@northwind.studio',     visible: true, kind: 'google'  },
  { id: 'personal', connected: true,  email: 'jaag.kondakalla@gmail.com', visible: true, kind: 'google'  },
  { id: 'outlook',  connected: true,  email: 'jk@hummingbird.partners',   visible: true, kind: 'outlook' },
  { id: 'bb',       connected: true,  email: 'tasks · this device',       visible: true, kind: 'tasks'   },
];

const ITEMS = [
  ...YEAR_GOALS,
  ...MONTH_GOALS,
  ...WEEK_GOALS,
  ...DAY_TASKS,
  ...EVENTS,
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
  ITEMS, INITIAL_ACCOUNTS, TODAY_ISO, ACCENT,
  getChildren, getDescendants, getAncestors, getAccent, getProgress,
});
