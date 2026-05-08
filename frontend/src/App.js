import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

// ── Design tokens (from OpenCourseFlow "Editorial Paper") ─────────────
const T = {
  paper:      '#F7F1E3',
  paperDark:  '#EFE7D2',
  ink:        '#1F1A14',
  ink2:       '#4A4135',
  rule:       '#D9CFB6',
  ruleSoft:   '#E5DCC4',
  accent:     '#7A2E1A',
  accentSoft: '#F1D9CB',
};

const FONT_HEAD = "'Newsreader', 'EB Garamond', Georgia, serif";
const FONT_BODY = "'Inter Tight', system-ui, sans-serif";
const FONT_NUM  = "'Newsreader', Georgia, serif";

const API = 'http://localhost:3000';

// ── Helpers ───────────────────────────────────────────────────────────
function isoDate(d) {
  const z = new Date(d);
  z.setHours(0, 0, 0, 0);
  return z.toISOString().slice(0, 10);
}

function localDate(iso) {
  return new Date(iso + 'T00:00:00');
}

function fmtWeekday(iso) {
  return localDate(iso).toLocaleDateString('en-US', { weekday: 'short' });
}

function fmtFull(iso) {
  return localDate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── App ───────────────────────────────────────────────────────────────
export default function App() {
  const [todos, setTodos]   = useState([]);
  const [view, setView]     = useState('today');
  const [error, setError]   = useState(null);

  const today = isoDate(new Date());

  const loadTodos = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/todos`);
      setTodos(r.data);
      setError(null);
    } catch {
      setError('Cannot reach backend on port 3000.');
    }
  }, []);

  useEffect(() => { loadTodos(); }, [loadTodos]);

  const ops = {
    today,
    add: async (title, dueDate) => {
      if (!title.trim()) return;
      await axios.post(`${API}/todos`, { title: title.trim(), due_date: dueDate || null });
      loadTodos();
    },
    toggle: async (id, completed) => {
      await axios.put(`${API}/todos/${id}`, { completed: !completed });
      loadTodos();
    },
    remove: async (id) => {
      await axios.delete(`${API}/todos/${id}`);
      loadTodos();
    },
    setDueDate: async (id, dueDate) => {
      await axios.put(`${API}/todos/${id}`, { due_date: dueDate || null });
      loadTodos();
    },
  };

  return (
    <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: FONT_BODY }}>
      <AppHeader view={view} setView={setView} today={today} />
      {error && (
        <div style={{
          background: '#2e0a0a', color: '#ff8a8a',
          fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.1em',
          padding: '8px 40px',
        }}>
          {error} — start the backend with <code>node server.js</code>
        </div>
      )}
      {view === 'today'    && <TodayView    todos={todos} ops={ops} setView={setView} />}
      {view === 'calendar' && <CalendarView todos={todos} ops={ops} />}
      {view === 'tasks'    && <TasksView    todos={todos} ops={ops} />}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────
function AppHeader({ view, setView, today }) {
  const d = localDate(today);
  const week = Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000) / 7);

  return (
    <header style={{
      background: T.paper,
      borderBottom: `1px solid ${T.rule}`,
      padding: '18px 40px 16px',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{
            fontFamily: FONT_HEAD, fontWeight: 600, fontStyle: 'italic',
            fontSize: 22, color: T.ink, letterSpacing: '-0.01em',
          }}>BeigeBoard</span>
          <span style={{ color: T.rule }}>·</span>
          <span style={{
            fontFamily: FONT_BODY, fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink2,
          }}>
            {d.getFullYear()} · W{week}
          </span>
        </div>
        <nav style={{ display: 'flex' }}>
          {[['today', 'Today'], ['calendar', 'Calendar'], ['tasks', 'Tasks']].map(([k, label]) => (
            <button key={k} onClick={() => setView(k)} style={{
              background: 'none', border: 'none',
              fontFamily: FONT_BODY, fontSize: 13,
              padding: '6px 16px',
              color: view === k ? T.ink : T.ink2,
              borderBottom: `1.5px solid ${view === k ? T.accent : 'transparent'}`,
              cursor: 'pointer', letterSpacing: '0.02em',
            }}>{label}</button>
          ))}
        </nav>
      </div>
    </header>
  );
}

// ── Today View ────────────────────────────────────────────────────────
function TodayView({ todos, ops, setView }) {
  const { today } = ops;
  const d = localDate(today);
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const todayTasks  = todos.filter(t => t.due_date === today && !t.completed);
  const overdue     = todos.filter(t => t.due_date && t.due_date < today && !t.completed);
  const doneTasks   = todos.filter(t => t.completed);
  const total       = todos.length;

  const statusLine = overdue.length > 0
    ? `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue. The best time to clear the desk is now.`
    : todayTasks.length === 0
    ? 'Nothing scheduled for today. Assign tasks in the Calendar.'
    : `${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} on the desk. Keep the pace.`;

  return (
    <div style={{ padding: '32px 40px 64px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Masthead */}
      <div style={{ borderBottom: `1px solid ${T.rule}`, paddingBottom: 18, marginBottom: 28 }}>
        <div style={{
          fontFamily: FONT_BODY, fontSize: 11,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 8,
        }}>{dateStr}</div>
        <h1 style={{
          fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 52,
          lineHeight: 1.02, margin: 0, letterSpacing: '-0.025em', color: T.ink,
        }}>
          Today's <em style={{ fontStyle: 'italic', color: T.accent }}>work.</em>
        </h1>
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 36 }}>
        <div style={{
          background: overdue.length > 0 ? T.accentSoft : T.paperDark,
          border: `1px solid ${overdue.length > 0 ? '#D8A793' : T.rule}`,
          borderRadius: 2, padding: '20px 24px',
        }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: T.accent, marginBottom: 6,
          }}>
            {overdue.length > 0 ? 'Needs attention' : "You're on track"}
          </div>
          <p style={{
            fontFamily: FONT_HEAD, fontSize: 18, lineHeight: 1.45,
            margin: 0, color: T.ink,
            fontStyle: overdue.length > 0 ? 'italic' : 'normal',
          }}>{statusLine}</p>
        </div>

        <div style={{
          background: T.paper,
          border: `1px solid ${T.rule}`,
          borderRadius: 2, padding: '16px 20px',
        }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 4,
          }}>Overall progress</div>
          <div style={{
            fontFamily: FONT_NUM, fontSize: 40,
            fontWeight: 500, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {total === 0 ? '—' : `${Math.round((doneTasks.length / total) * 100)}%`}
          </div>
          <div style={{ marginTop: 14, height: 2, background: T.ruleSoft, position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${total ? (doneTasks.length / total) * 100 : 0}%`,
              background: T.accent,
            }} />
          </div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink2, marginTop: 6,
          }}>
            {doneTasks.length} of {total} complete
          </div>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontFamily: FONT_HEAD, fontStyle: 'italic', fontWeight: 500,
            fontSize: 24, margin: '0 0 12px', color: T.accent, letterSpacing: '-0.015em',
          }}>Overdue</h2>
          <TaskQueue tasks={overdue} ops={ops} accentColor={T.accent} />
        </div>
      )}

      {/* Today's queue */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', marginBottom: 14,
        }}>
          <h2 style={{
            fontFamily: FONT_HEAD, fontStyle: 'italic', fontWeight: 500,
            fontSize: 28, margin: 0, color: T.ink, letterSpacing: '-0.015em',
          }}>On the desk today</h2>
          <button onClick={() => setView('tasks')} style={{
            background: 'none', border: 'none',
            fontFamily: FONT_BODY, fontSize: 12,
            color: T.ink2, cursor: 'pointer', letterSpacing: '0.05em',
          }}>Manage tasks →</button>
        </div>

        {todayTasks.length === 0 ? (
          <div style={{
            padding: '28px 24px',
            border: `1px dashed ${T.rule}`,
            color: T.ink2, fontFamily: FONT_HEAD,
            fontStyle: 'italic', fontSize: 16,
          }}>
            Nothing scheduled for today. Click a day in the Calendar to add tasks.
          </div>
        ) : (
          <TaskQueue tasks={todayTasks} ops={ops} numbered />
        )}
      </div>

      {/* Week strip */}
      <WeekStrip todos={todos} today={today} setView={setView} />
    </div>
  );
}

function TaskQueue({ tasks, ops, numbered, accentColor }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {tasks.map((task, i) => (
        <li key={task.id} style={{
          display: 'grid',
          gridTemplateColumns: numbered ? '44px 1fr auto' : '28px 1fr auto',
          alignItems: 'center',
          padding: '13px 0', gap: 18,
          borderTop: i === 0 ? `1px solid ${T.rule}` : 'none',
          borderBottom: `1px solid ${T.ruleSoft}`,
        }}>
          {numbered ? (
            <span style={{
              fontFamily: FONT_NUM, fontSize: 28,
              color: accentColor || T.ink2,
              fontStyle: 'italic', lineHeight: 1,
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
          ) : (
            <button onClick={() => ops.toggle(task.id, task.completed)} style={{
              width: 16, height: 16,
              border: `1px solid ${task.completed ? T.accent : T.rule}`,
              background: task.completed ? T.accent : 'transparent',
              cursor: 'pointer', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: T.paper, fontSize: 10,
            }}>
              {task.completed ? '✓' : ''}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {numbered && (
              <button onClick={() => ops.toggle(task.id, task.completed)} style={{
                width: 16, height: 16,
                border: `1px solid ${task.completed ? T.accent : T.rule}`,
                background: task.completed ? T.accent : 'transparent',
                cursor: 'pointer', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: T.paper, fontSize: 10,
              }}>
                {task.completed ? '✓' : ''}
              </button>
            )}
            <span style={{
              fontFamily: FONT_HEAD, fontSize: 17,
              color: task.completed ? T.ink2 : T.ink,
              textDecoration: task.completed ? 'line-through' : 'none',
              lineHeight: 1.3,
            }}>{task.title}</span>
          </div>

          <button onClick={() => ops.remove(task.id)} style={{
            background: 'transparent',
            border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 11,
            padding: '4px 10px', color: T.ink2, cursor: 'pointer',
          }}>Remove</button>
        </li>
      ))}
    </ol>
  );
}

function WeekStrip({ todos, today, setView }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = localDate(today);
    d.setDate(d.getDate() + i);
    return isoDate(d);
  });

  return (
    <div>
      <div style={{
        fontFamily: FONT_BODY, fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: T.ink2, marginBottom: 10,
      }}>The week ahead</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderTop: `1px solid ${T.rule}`,
        borderLeft: `1px solid ${T.rule}`,
      }}>
        {days.map((dayKey) => {
          const dayTodos  = todos.filter(t => t.due_date === dayKey);
          const remaining = dayTodos.filter(t => !t.completed).length;
          const done      = dayTodos.filter(t => t.completed).length;
          const isToday   = dayKey === today;
          const d         = localDate(dayKey);

          return (
            <div
              key={dayKey}
              onClick={() => setView('calendar')}
              style={{
                borderRight: `1px solid ${T.rule}`,
                borderBottom: `1px solid ${T.rule}`,
                padding: '10px 10px 12px',
                background: isToday ? T.accentSoft : T.paper,
                minHeight: 80, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink2,
                }}>{fmtWeekday(dayKey)}</span>
                <span style={{
                  fontFamily: FONT_NUM, fontSize: 18,
                  color: isToday ? T.accent : T.ink,
                  fontStyle: isToday ? 'italic' : 'normal',
                }}>{d.getDate()}</span>
              </div>
              {dayTodos.length === 0 ? (
                <div style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 12, color: T.ink2, marginTop: 8 }}>—</div>
              ) : (
                <>
                  <div style={{ marginTop: 10, height: 2, background: T.ruleSoft }}>
                    <div style={{
                      height: '100%',
                      width: `${dayTodos.length ? (done / dayTodos.length) * 100 : 0}%`,
                      background: isToday ? T.accent : T.ink2,
                    }} />
                  </div>
                  <div style={{ fontFamily: FONT_NUM, fontSize: 13, marginTop: 5, color: T.ink }}>
                    {remaining} <span style={{ color: T.ink2, fontFamily: FONT_BODY, fontSize: 10 }}>left</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Calendar View ─────────────────────────────────────────────────────
function CalendarView({ todos, ops }) {
  const { today } = ops;
  const [focusDay, setFocusDay] = useState(today);

  // Start from Monday of the current week
  const startOfWeek = (() => {
    const d = localDate(today);
    const dow = (d.getDay() + 6) % 7; // 0 = Mon
    d.setDate(d.getDate() - dow);
    return isoDate(d);
  })();

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = localDate(startOfWeek);
    d.setDate(d.getDate() + i);
    return isoDate(d);
  });

  const unscheduled = todos.filter(t => !t.due_date && !t.completed);

  return (
    <div style={{ padding: '28px 40px 64px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto',
        gap: 24, alignItems: 'end',
        marginBottom: 18, paddingBottom: 16,
        borderBottom: `1px solid ${T.rule}`,
      }}>
        <div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 4,
          }}>The Calendar</div>
          <h1 style={{
            fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 38,
            margin: 0, color: T.ink, letterSpacing: '-0.02em',
          }}>
            Two weeks <em style={{ color: T.accent }}>at a glance</em>
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 9,
            letterSpacing: '0.2em', textTransform: 'uppercase', color: T.ink2,
          }}>Unscheduled</div>
          <div style={{
            fontFamily: FONT_NUM, fontStyle: 'italic',
            fontSize: 32, color: T.accent, lineHeight: 1.05,
          }}>{unscheduled.length}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.ink2 }}>without a date</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${T.rule}` }}>

        {/* DOW headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dn, i) => (
          <div key={dn} style={{
            fontFamily: FONT_BODY, fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: T.ink2, padding: '8px 12px',
            borderBottom: `1px solid ${T.rule}`,
            borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
            background: T.paperDark,
          }}>{dn}</div>
        ))}

        {/* Day cells */}
        {days.map((dayKey, i) => {
          const dayTodos  = todos.filter(t => t.due_date === dayKey);
          const remaining = dayTodos.filter(t => !t.completed);
          const isToday   = dayKey === today;
          const isPast    = dayKey < today;
          const isFocus   = focusDay === dayKey;
          const d         = localDate(dayKey);

          return (
            <div
              key={dayKey}
              onClick={() => setFocusDay(isFocus ? null : dayKey)}
              style={{
                minHeight: 140,
                background: isToday ? T.accentSoft : isPast ? T.paperDark : T.paper,
                borderRight: i % 7 < 6 ? `1px solid ${T.rule}` : 'none',
                borderBottom: i < 7 ? `1px solid ${T.rule}` : 'none',
                padding: '8px 10px 28px',
                cursor: 'pointer',
                outline: isFocus ? `2px solid ${T.accent}` : 'none',
                outlineOffset: -2,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 9,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink2,
                }}>{fmtWeekday(dayKey)}</span>
                <span style={{
                  fontFamily: FONT_NUM, fontSize: 20,
                  color: isToday ? T.accent : isPast ? T.ink2 : T.ink,
                  fontStyle: isToday ? 'italic' : 'normal',
                }}>{d.getDate()}</span>
              </div>

              {isToday && (
                <div style={{
                  fontFamily: FONT_BODY, fontSize: 8,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: T.accent, marginTop: 1,
                }}>today</div>
              )}

              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {remaining.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    onClick={e => { e.stopPropagation(); ops.toggle(task.id, task.completed); }}
                    title={task.title}
                    style={{
                      background: T.paperDark,
                      borderLeft: `2px solid ${T.accent}`,
                      padding: '3px 6px',
                      fontSize: 10, fontFamily: FONT_BODY, color: T.ink,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      cursor: 'pointer',
                    }}
                  >{task.title}</div>
                ))}
                {remaining.length > 3 && (
                  <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: T.ink2, fontStyle: 'italic' }}>
                    +{remaining.length - 3} more
                  </span>
                )}
              </div>

              {dayTodos.length > 0 && remaining.length === 0 && (
                <div style={{
                  position: 'absolute', bottom: 8, left: 10,
                  fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11, color: T.ink2,
                }}>all done ✓</div>
              )}

              {/* Load bar */}
              {remaining.length > 0 && (
                <div style={{
                  position: 'absolute', left: 10, right: 10, bottom: 8,
                  height: 2, background: T.ruleSoft,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${dayTodos.length ? ((dayTodos.length - remaining.length) / dayTodos.length) * 100 : 0}%`,
                    background: isToday ? T.accent : T.ink2,
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Focus day panel */}
      {focusDay && (
        <DayPanel dayKey={focusDay} todos={todos} ops={ops} />
      )}

      {/* Unscheduled pile */}
      {unscheduled.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: 10,
          }}>
            <h3 style={{
              fontFamily: FONT_HEAD, fontStyle: 'italic',
              fontWeight: 500, fontSize: 22, margin: 0, color: T.ink,
            }}>Unscheduled</h3>
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.ink2 }}>
              Set due dates in Tasks to place items on the calendar.
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unscheduled.map(task => (
              <div key={task.id} style={{
                background: T.paper,
                border: `1px solid ${T.rule}`,
                borderTop: `2px solid ${T.ink2}`,
                padding: '5px 10px',
                fontFamily: FONT_BODY, fontSize: 12, color: T.ink,
              }}>{task.title}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DayPanel({ dayKey, todos, ops }) {
  const [newTitle, setNewTitle] = useState('');
  const dayTodos = todos.filter(t => t.due_date === dayKey);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await ops.add(newTitle, dayKey);
    setNewTitle('');
  };

  return (
    <div style={{
      marginTop: 20,
      background: T.paperDark,
      border: `1px solid ${T.rule}`,
      padding: '20px 24px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <h3 style={{
          fontFamily: FONT_HEAD, fontWeight: 500,
          fontSize: 22, margin: 0, color: T.ink,
        }}>{fmtFull(dayKey)}</h3>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.ink2 }}>
          {dayTodos.filter(t => !t.completed).length} remaining
          · {dayTodos.filter(t => t.completed).length} done
        </span>
      </div>

      {dayTodos.length === 0 ? (
        <p style={{
          fontFamily: FONT_HEAD, fontStyle: 'italic',
          fontSize: 15, color: T.ink2, margin: '0 0 16px',
        }}>No tasks yet for this day.</p>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          {dayTodos.map(task => (
            <li key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 0',
              borderBottom: `1px solid ${T.ruleSoft}`,
            }}>
              <button onClick={() => ops.toggle(task.id, task.completed)} style={{
                width: 15, height: 15,
                border: `1px solid ${task.completed ? T.accent : T.rule}`,
                background: task.completed ? T.accent : 'transparent',
                cursor: 'pointer', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: T.paper, fontSize: 9,
              }}>{task.completed ? '✓' : ''}</button>
              <span style={{
                flex: 1, fontFamily: FONT_HEAD, fontSize: 16,
                color: task.completed ? T.ink2 : T.ink,
                textDecoration: task.completed ? 'line-through' : 'none',
              }}>{task.title}</span>
              <button onClick={() => ops.remove(task.id)} style={{
                background: 'none', border: 'none',
                color: T.ink2, fontFamily: FONT_BODY,
                fontSize: 14, cursor: 'pointer', lineHeight: 1,
              }}>✕</button>
            </li>
          ))}
        </ol>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task for this day…"
          style={{
            flex: 1, background: T.paper,
            border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 13,
            padding: '8px 12px', color: T.ink, outline: 'none',
          }}
        />
        <button onClick={handleAdd} style={{
          background: T.ink, color: T.paper, border: 'none',
          fontFamily: FONT_BODY, fontSize: 11,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '8px 18px', cursor: 'pointer',
        }}>Add →</button>
      </div>
    </div>
  );
}

// ── Tasks View ────────────────────────────────────────────────────────
function TasksView({ todos, ops }) {
  const [title, setTitle]     = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter]   = useState('all');

  const handleAdd = async () => {
    await ops.add(title, dueDate);
    setTitle('');
    setDueDate('');
  };

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done')   return t.completed;
    return true;
  });

  // Group by due_date, nulls last
  const groups = {};
  filtered.forEach(t => {
    const key = t.due_date || '__none__';
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return a < b ? -1 : 1;
  });

  return (
    <div style={{ padding: '28px 40px 64px', maxWidth: 900, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{
        borderBottom: `1px solid ${T.rule}`,
        paddingBottom: 18, marginBottom: 26,
      }}>
        <div style={{
          fontFamily: FONT_BODY, fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2,
        }}>
          All tasks · {todos.filter(t => !t.completed).length} remaining
        </div>
        <h1 style={{
          fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 42,
          margin: '6px 0 0', color: T.ink, letterSpacing: '-0.025em', lineHeight: 1.04,
        }}>
          The full <em style={{ color: T.accent }}>list.</em>
        </h1>
      </div>

      {/* Add form */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 28,
        padding: '16px 20px',
        background: T.paperDark, border: `1px solid ${T.rule}`,
      }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="New task…"
          style={{
            flex: 1, background: T.paper, border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 14,
            padding: '9px 13px', color: T.ink, outline: 'none',
          }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{
            background: T.paper, border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 13,
            padding: '9px 10px', color: T.ink2, outline: 'none', width: 150,
          }}
        />
        <button onClick={handleAdd} style={{
          background: T.ink, color: T.paper, border: 'none',
          fontFamily: FONT_BODY, fontSize: 11,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '9px 20px', cursor: 'pointer',
        }}>Add →</button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        borderTop: `1px solid ${T.rule}`,
        borderBottom: `1px solid ${T.rule}`,
        marginBottom: 24,
      }}>
        {[['all', 'All'], ['active', 'Active'], ['done', 'Done']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            background: filter === k ? T.accentSoft : 'transparent',
            border: 'none',
            borderRight: `1px solid ${T.rule}`,
            padding: '10px 22px',
            fontFamily: FONT_BODY, fontSize: 12,
            letterSpacing: '0.06em',
            color: filter === k ? T.accent : T.ink2,
            cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* Grouped list */}
      {sortedKeys.length === 0 && (
        <div style={{
          padding: '28px 24px', border: `1px dashed ${T.rule}`,
          color: T.ink2, fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 16,
        }}>
          No tasks yet. Add one above.
        </div>
      )}

      {sortedKeys.map(groupKey => {
        const isNone = groupKey === '__none__';
        const isPast = !isNone && groupKey < ops.today;
        const isToday = groupKey === ops.today;

        const groupLabel = isNone
          ? 'No due date'
          : `${fmtFull(groupKey)}${isToday ? ' · Today' : isPast ? ' · Overdue' : ''}`;

        return (
          <section key={groupKey} style={{ marginBottom: 32 }}>
            <div style={{
              fontFamily: FONT_BODY, fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: isPast && !isNone ? T.accent : T.ink2,
              paddingBottom: 8,
              borderBottom: `1px solid ${isPast && !isNone ? T.accent : T.rule}`,
            }}>{groupLabel}</div>

            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {groups[groupKey].map(task => (
                <li key={task.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr 160px 60px',
                  alignItems: 'center', gap: 14,
                  padding: '10px 4px',
                  borderBottom: `1px solid ${T.ruleSoft}`,
                }}>
                  <button onClick={() => ops.toggle(task.id, task.completed)} style={{
                    width: 15, height: 15,
                    border: `1px solid ${task.completed ? T.accent : T.rule}`,
                    background: task.completed ? T.accent : 'transparent',
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: T.paper, fontSize: 9,
                  }}>{task.completed ? '✓' : ''}</button>

                  <span style={{
                    fontFamily: FONT_HEAD, fontSize: 17,
                    color: task.completed ? T.ink2 : T.ink,
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}>{task.title}</span>

                  <input
                    type="date"
                    value={task.due_date || ''}
                    onChange={e => ops.setDueDate(task.id, e.target.value)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.rule}`,
                      fontFamily: FONT_BODY, fontSize: 11,
                      padding: '3px 6px', color: T.ink2, outline: 'none', width: '100%',
                    }}
                  />

                  <button onClick={() => ops.remove(task.id)} style={{
                    background: 'transparent', border: `1px solid ${T.rule}`,
                    fontFamily: FONT_BODY, fontSize: 11,
                    padding: '4px 10px', color: T.ink, cursor: 'pointer',
                    textAlign: 'center',
                  }}>✕</button>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
