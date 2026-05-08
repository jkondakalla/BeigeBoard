import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './App.css';

// ── Design tokens ─────────────────────────────────────────────────────
const T = {
  paper:      '#F7F1E3',   // beige — backdrop only
  paperDark:  '#EFE7D2',
  ink:        '#1F1A14',
  ink2:       '#4A4135',
  rule:       '#D9CFB6',
  ruleSoft:   '#E5DCC4',
  red:        '#C8391A',   // film red  — primary accent / urgency / CTAs
  redSoft:    '#FAE9E5',
  yellow:     '#D99800',   // Kodak yellow — numbers / data / highlights
  yellowSoft: '#FDF5D4',
  // aliased for existing references
  accent:     '#C8391A',
  accentSoft: '#FAE9E5',
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
function localDate(iso) { return new Date(iso + 'T00:00:00'); }
function fmtWeekday(iso) { return localDate(iso).toLocaleDateString('en-US', { weekday: 'short' }); }
function fmtFull(iso)    { return localDate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }

// ── App ───────────────────────────────────────────────────────────────
export default function App() {
  const [todos, setTodos] = useState([]);
  const [view,  setView]  = useState('today');
  const [error, setError] = useState(null);
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
    add: async (title, dueDate, scheduledTime) => {
      if (!title.trim()) return;
      await axios.post(`${API}/todos`, {
        title: title.trim(),
        due_date: dueDate || null,
        scheduled_time: scheduledTime || null,
      });
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
          background: '#1a0806', color: T.red,
          fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.1em',
          padding: '8px 40px', borderBottom: `1px solid ${T.red}`,
        }}>
          {error} — start the backend with <code style={{ fontFamily: 'monospace' }}>node server.js</code>
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
  const d    = localDate(today);
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
            fontSize: 22, color: T.yellow, letterSpacing: '-0.01em',
          }}>BeigeBoard</span>
          <span style={{ color: T.rule }}>·</span>
          <span style={{
            fontFamily: FONT_BODY, fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink2,
          }}>{d.getFullYear()} · W{week}</span>
        </div>
        <nav style={{ display: 'flex' }}>
          {[['today', 'Today'], ['calendar', 'Calendar'], ['tasks', 'Tasks']].map(([k, label]) => (
            <button key={k} onClick={() => setView(k)} style={{
              background: 'none', border: 'none',
              fontFamily: FONT_BODY, fontSize: 13,
              padding: '6px 16px',
              color: view === k ? T.ink : T.ink2,
              borderBottom: `1.5px solid ${view === k ? T.red : 'transparent'}`,
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
  const [selectedDay, setSelectedDay] = useState(today);

  const d       = localDate(today);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const todayTasks = todos.filter(t => t.due_date === today && !t.completed);
  const overdue    = todos.filter(t => t.due_date && t.due_date < today && !t.completed);
  const doneTasks  = todos.filter(t => t.completed);
  const total      = todos.length;

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
          Today's <em style={{ fontStyle: 'italic', color: T.red }}>work.</em>
        </h1>
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 36 }}>
        <div style={{
          background: overdue.length > 0 ? T.redSoft : T.paperDark,
          border: `1px solid ${overdue.length > 0 ? '#D8A793' : T.rule}`,
          borderRadius: 2, padding: '20px 24px',
        }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: T.red, marginBottom: 6,
          }}>
            {overdue.length > 0 ? 'Needs attention' : "You're on track"}
          </div>
          <p style={{
            fontFamily: FONT_HEAD, fontSize: 18, lineHeight: 1.45,
            margin: 0, color: T.ink,
            fontStyle: overdue.length > 0 ? 'italic' : 'normal',
          }}>{statusLine}</p>
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.rule}`, borderRadius: 2, padding: '16px 20px' }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 4,
          }}>Overall progress</div>
          <div style={{
            fontFamily: FONT_NUM, fontSize: 40,
            fontWeight: 500, color: T.yellow, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {total === 0 ? '—' : `${Math.round((doneTasks.length / total) * 100)}%`}
          </div>
          <div style={{ marginTop: 14, height: 2, background: T.ruleSoft, position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${total ? (doneTasks.length / total) * 100 : 0}%`,
              background: T.yellow,
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
            fontSize: 24, margin: '0 0 12px', color: T.red, letterSpacing: '-0.015em',
          }}>Overdue</h2>
          <TaskQueue tasks={overdue} ops={ops} accentColor={T.red} />
        </div>
      )}

      {/* Today's queue */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
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
            padding: '28px 24px', border: `1px dashed ${T.rule}`,
            color: T.ink2, fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 16,
          }}>
            Nothing scheduled for today. Click a day in the Calendar to add tasks.
          </div>
        ) : (
          <TaskQueue tasks={todayTasks} ops={ops} numbered accentColor={T.yellow} />
        )}
      </div>

      {/* Hourly calendar — tracks selected week-strip day */}
      <DayCalendar todos={todos} ops={ops} dayKey={selectedDay} />

      {/* Week strip — clicking selects the day above */}
      <WeekStrip
        todos={todos}
        today={today}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />
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
              color: accentColor || T.yellow,
              fontStyle: 'italic', lineHeight: 1,
            }}>{String(i + 1).padStart(2, '0')}</span>
          ) : (
            <Checkbox id={task.id} completed={task.completed} onToggle={ops.toggle} />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {numbered && <Checkbox id={task.id} completed={task.completed} onToggle={ops.toggle} />}
            <span style={{
              fontFamily: FONT_HEAD, fontSize: 17,
              color: task.completed ? T.ink2 : T.ink,
              textDecoration: task.completed ? 'line-through' : 'none',
              lineHeight: 1.3,
            }}>{task.title}</span>
          </div>

          <button onClick={() => ops.remove(task.id)} style={{
            background: 'transparent', border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 11,
            padding: '4px 10px', color: T.ink2, cursor: 'pointer',
          }}>Remove</button>
        </li>
      ))}
    </ol>
  );
}

function Checkbox({ id, completed, onToggle }) {
  return (
    <button onClick={() => onToggle(id, completed)} style={{
      width: 16, height: 16,
      border: `1px solid ${completed ? T.red : T.rule}`,
      background: completed ? T.red : 'transparent',
      cursor: 'pointer', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: T.paper, fontSize: 10,
    }}>{completed ? '✓' : ''}</button>
  );
}

// ── Day Calendar ──────────────────────────────────────────────────────
function DayCalendar({ todos, ops, dayKey }) {
  const HOURS   = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM–10 PM
  const ROW_H   = 56;
  const LABEL_W = 72;

  const [activeSlot, setActiveSlot] = useState(null);
  const [slotTitle,  setSlotTitle]  = useState('');
  const containerRef = useRef(null);

  const effectiveDay = dayKey || ops.today;
  const isViewingToday = effectiveDay === ops.today;

  const now             = new Date();
  const currentHourFrac = now.getHours() + now.getMinutes() / 60;
  const nowTopPx        = isViewingToday
    ? (currentHourFrac - HOURS[0]) * ROW_H
    : null;

  useEffect(() => {
    if (containerRef.current) {
      const scrollTo = isViewingToday
        ? Math.max(0, (currentHourFrac - HOURS[0] - 1) * ROW_H)
        : 0;
      containerRef.current.scrollTop = scrollTo;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDay]);

  const scheduledTasks = todos.filter(t => t.due_date === effectiveDay && t.scheduled_time);
  const byHour = {};
  scheduledTasks.forEach(t => {
    const h = parseInt(t.scheduled_time.slice(0, 2), 10);
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(t);
  });

  const handleAdd = async (hour) => {
    if (!slotTitle.trim()) { setActiveSlot(null); return; }
    const time = `${String(hour).padStart(2, '0')}:00`;
    await ops.add(slotTitle, effectiveDay, time);
    setSlotTitle('');
    setActiveSlot(null);
  };

  const fmtHour = h => h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;

  const d       = localDate(effectiveDay);
  const dayLabel = isViewingToday
    ? 'Today'
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', marginBottom: 10,
      }}>
        <div style={{
          fontFamily: FONT_BODY, fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2,
        }}>Schedule</div>
        <div style={{
          fontFamily: FONT_NUM, fontStyle: 'italic',
          fontSize: 14, color: T.yellow,
        }}>{dayLabel}</div>
      </div>

      <div
        ref={containerRef}
        style={{
          height: 420, overflowY: 'auto',
          border: `1px solid ${T.rule}`,
          position: 'relative',
        }}
      >
        {/* Now line */}
        {nowTopPx !== null && nowTopPx >= 0 && nowTopPx <= HOURS.length * ROW_H && (
          <div style={{
            position: 'absolute',
            top: nowTopPx, left: 0, right: 0,
            height: 1, background: T.red,
            zIndex: 10, pointerEvents: 'none',
          }}>
            <span style={{
              position: 'absolute', left: 6, top: -8,
              fontFamily: FONT_NUM, fontStyle: 'italic',
              fontSize: 10, color: T.red,
              background: T.paper, padding: '0 3px',
            }}>
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        )}

        {HOURS.map((h, i) => {
          const tasks    = byHour[h] || [];
          const isActive = activeSlot === h;
          const isNowHour = isViewingToday && Math.floor(currentHourFrac) === h;

          return (
            <div key={h} style={{
              display: 'flex', height: ROW_H,
              borderBottom: i < HOURS.length - 1 ? `1px solid ${T.ruleSoft}` : 'none',
            }}>
              {/* Hour label */}
              <div style={{
                width: LABEL_W, flexShrink: 0,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                padding: '8px 12px 0 0',
                borderRight: `1px solid ${T.rule}`,
                fontFamily: FONT_NUM, fontStyle: 'italic',
                fontSize: 12,
                color: isNowHour ? T.yellow : T.ink2,
                background: T.paper,
              }}>{fmtHour(h)}</div>

              {/* Slot */}
              <div
                style={{
                  flex: 1, padding: '6px 10px',
                  display: 'flex', flexWrap: 'wrap',
                  alignContent: 'flex-start', gap: 4,
                  background: isActive ? T.yellowSoft : isNowHour ? '#FFFDF5' : T.paper,
                  cursor: tasks.length === 0 && !isActive ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (tasks.length === 0 && !isActive) {
                    setActiveSlot(h);
                    setSlotTitle('');
                  }
                }}
              >
                {tasks.map(task => (
                  <div key={task.id} style={{
                    background: T.paperDark,
                    borderLeft: `2px solid ${task.completed ? T.ink2 : T.yellow}`,
                    padding: '3px 8px 3px 6px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: FONT_BODY, fontSize: 11, color: T.ink,
                    maxWidth: '100%',
                  }}>
                    <button
                      onClick={e => { e.stopPropagation(); ops.toggle(task.id, task.completed); }}
                      style={{
                        width: 12, height: 12,
                        border: `1px solid ${task.completed ? T.red : T.rule}`,
                        background: task.completed ? T.red : 'transparent',
                        cursor: 'pointer', flexShrink: 0,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        color: T.paper, fontSize: 8,
                      }}
                    >{task.completed ? '✓' : ''}</button>
                    <span style={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? T.ink2 : T.ink,
                    }}>{task.title}</span>
                    <button
                      onClick={e => { e.stopPropagation(); ops.remove(task.id); }}
                      style={{
                        background: 'none', border: 'none',
                        color: T.ink2, fontSize: 11,
                        cursor: 'pointer', marginLeft: 'auto', lineHeight: 1,
                      }}
                    >✕</button>
                  </div>
                ))}

                {isActive && (
                  <div
                    style={{ display: 'flex', gap: 6, width: '100%' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      value={slotTitle}
                      onChange={e => setSlotTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  handleAdd(h);
                        if (e.key === 'Escape') setActiveSlot(null);
                      }}
                      placeholder={`Task at ${fmtHour(h)}…`}
                      style={{
                        flex: 1, background: T.paper,
                        border: `1px solid ${T.rule}`,
                        fontFamily: FONT_BODY, fontSize: 12,
                        padding: '4px 8px', color: T.ink, outline: 'none',
                      }}
                    />
                    <button onClick={() => handleAdd(h)} style={{
                      background: T.red, color: T.paper, border: 'none',
                      fontFamily: FONT_BODY, fontSize: 10,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '4px 12px', cursor: 'pointer',
                    }}>Add</button>
                    <button onClick={() => setActiveSlot(null)} style={{
                      background: 'none', border: `1px solid ${T.rule}`,
                      fontFamily: FONT_BODY, fontSize: 10,
                      padding: '4px 8px', color: T.ink2, cursor: 'pointer',
                    }}>✕</button>
                  </div>
                )}

                {tasks.length === 0 && !isActive && (
                  <div style={{
                    fontFamily: FONT_HEAD, fontStyle: 'italic',
                    fontSize: 12, color: T.ruleSoft, userSelect: 'none',
                  }}>+ add</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week Strip ────────────────────────────────────────────────────────
function WeekStrip({ todos, today, selectedDay, setSelectedDay }) {
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
          const isSelected = dayKey === selectedDay;
          const d         = localDate(dayKey);

          return (
            <div
              key={dayKey}
              onClick={() => setSelectedDay(dayKey)}
              style={{
                borderRight: `1px solid ${T.rule}`,
                borderBottom: `1px solid ${T.rule}`,
                padding: '10px 10px 12px',
                background: isSelected ? T.yellowSoft : isToday ? T.redSoft : T.paper,
                minHeight: 80, cursor: 'pointer',
                outline: isSelected ? `2px solid ${T.yellow}` : 'none',
                outlineOffset: -2,
                transition: 'background 0.12s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: isToday ? T.red : T.ink2,
                }}>{fmtWeekday(dayKey)}</span>
                <span style={{
                  fontFamily: FONT_NUM, fontSize: 18,
                  color: isSelected ? T.yellow : isToday ? T.red : T.ink,
                  fontStyle: isToday || isSelected ? 'italic' : 'normal',
                }}>{d.getDate()}</span>
              </div>
              {dayTodos.length === 0 ? (
                <div style={{
                  fontFamily: FONT_HEAD, fontStyle: 'italic',
                  fontSize: 12, color: T.ink2, marginTop: 8,
                }}>—</div>
              ) : (
                <>
                  <div style={{ marginTop: 10, height: 2, background: T.ruleSoft }}>
                    <div style={{
                      height: '100%',
                      width: `${dayTodos.length ? (done / dayTodos.length) * 100 : 0}%`,
                      background: isSelected ? T.yellow : isToday ? T.red : T.ink2,
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

// ── Calendar View — Monthly ───────────────────────────────────────────
function CalendarView({ todos, ops }) {
  const { today } = ops;
  const todayDate = localDate(today);

  const [year,     setYear]     = useState(todayDate.getFullYear());
  const [month,    setMonth]    = useState(todayDate.getMonth());
  const [focusDay, setFocusDay] = useState(null);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setFocusDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setFocusDay(null);
  };
  const goToday = () => {
    setYear(todayDate.getFullYear());
    setMonth(todayDate.getMonth());
    setFocusDay(today);
  };

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const startDow     = (firstOfMonth.getDay() + 6) % 7; // 0 = Mon
  const totalCells   = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startDow + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return isoDate(new Date(year, month, dayNum));
  });

  const monthLabel = firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const unscheduled = todos.filter(t => !t.due_date && !t.completed);
  const totalRows   = cells.length / 7;

  const btnStyle = {
    background: 'transparent', border: `1px solid ${T.rule}`,
    fontFamily: FONT_BODY, fontSize: 13,
    padding: '5px 12px', color: T.ink, cursor: 'pointer',
    letterSpacing: '0.02em',
  };

  return (
    <div style={{ padding: '28px 40px 64px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 18, paddingBottom: 16,
        borderBottom: `1px solid ${T.rule}`,
      }}>
        <div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 4,
          }}>The Calendar</div>
          <h1 style={{
            fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 42,
            margin: 0, letterSpacing: '-0.025em', lineHeight: 1.04,
          }}>
            <em style={{ color: T.red, fontStyle: 'italic' }}>{monthLabel}</em>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={prevMonth} style={btnStyle}>←</button>
          <button onClick={goToday} style={{ ...btnStyle, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Today
          </button>
          <button onClick={nextMonth} style={btnStyle}>→</button>
        </div>
      </div>

      {/* Monthly grid */}
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
        {cells.map((dayKey, i) => {
          const col = i % 7;
          const row = Math.floor(i / 7);

          if (!dayKey) return (
            <div key={`pad-${i}`} style={{
              minHeight: 110,
              background: T.paperDark,
              borderRight: col < 6 ? `1px solid ${T.rule}` : 'none',
              borderBottom: row < totalRows - 1 ? `1px solid ${T.rule}` : 'none',
            }} />
          );

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
                minHeight: 110,
                background: isToday ? T.yellowSoft : isPast ? T.paperDark : T.paper,
                borderRight: col < 6 ? `1px solid ${T.rule}` : 'none',
                borderBottom: row < totalRows - 1 ? `1px solid ${T.rule}` : 'none',
                padding: '8px 10px 10px',
                cursor: 'pointer',
                outline: isFocus ? `2px solid ${T.red}` : 'none',
                outlineOffset: -2,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                {isToday ? (
                  <span style={{
                    fontFamily: FONT_BODY, fontSize: 8,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: T.red,
                    marginTop: 3,
                  }}>today</span>
                ) : <span />}
                <span style={{
                  fontFamily: FONT_NUM, fontSize: 20,
                  color: isToday ? T.red : isPast ? T.ink2 : T.ink,
                  fontStyle: isToday ? 'italic' : 'normal',
                  fontWeight: isToday ? 500 : 400,
                }}>{d.getDate()}</span>
              </div>

              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {remaining.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    onClick={e => { e.stopPropagation(); ops.toggle(task.id, task.completed); }}
                    title={task.title}
                    style={{
                      background: T.paperDark,
                      borderLeft: `2px solid ${isPast ? T.red : T.yellow}`,
                      padding: '2px 5px',
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
                  position: 'absolute', bottom: 5, right: 8,
                  fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 10, color: T.ink2,
                }}>done ✓</div>
              )}

              {remaining.length > 0 && (
                <div style={{
                  position: 'absolute', left: 10, right: 10, bottom: 7,
                  height: 2, background: T.ruleSoft,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${dayTodos.length ? ((dayTodos.length - remaining.length) / dayTodos.length) * 100 : 0}%`,
                    background: isPast ? T.red : T.yellow,
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Focus day panel */}
      {focusDay && <DayPanel dayKey={focusDay} todos={todos} ops={ops} />}

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
                borderTop: `2px solid ${T.yellow}`,
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
      marginTop: 20, background: T.paperDark,
      border: `1px solid ${T.rule}`, padding: '20px 24px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <h3 style={{ fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 22, margin: 0, color: T.ink }}>
          {fmtFull(dayKey)}
        </h3>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.ink2 }}>
          {dayTodos.filter(t => !t.completed).length} remaining
          · {dayTodos.filter(t => t.completed).length} done
        </span>
      </div>

      {dayTodos.length === 0 ? (
        <p style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 15, color: T.ink2, margin: '0 0 16px' }}>
          No tasks yet for this day.
        </p>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          {dayTodos.map(task => (
            <li key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 0', borderBottom: `1px solid ${T.ruleSoft}`,
            }}>
              <Checkbox id={task.id} completed={task.completed} onToggle={ops.toggle} />
              <span style={{
                flex: 1, fontFamily: FONT_HEAD, fontSize: 16,
                color: task.completed ? T.ink2 : T.ink,
                textDecoration: task.completed ? 'line-through' : 'none',
              }}>{task.title}</span>
              <button onClick={() => ops.remove(task.id)} style={{
                background: 'none', border: 'none',
                color: T.ink2, fontFamily: FONT_BODY, fontSize: 14, cursor: 'pointer', lineHeight: 1,
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
            flex: 1, background: T.paper, border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 13,
            padding: '8px 12px', color: T.ink, outline: 'none',
          }}
        />
        <button onClick={handleAdd} style={{
          background: T.red, color: T.paper, border: 'none',
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
  const [title,   setTitle]   = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter,  setFilter]  = useState('all');

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

      <div style={{ borderBottom: `1px solid ${T.rule}`, paddingBottom: 18, marginBottom: 26 }}>
        <div style={{
          fontFamily: FONT_BODY, fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2,
        }}>
          All tasks · <span style={{ color: T.yellow }}>{todos.filter(t => !t.completed).length}</span> remaining
        </div>
        <h1 style={{
          fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 42,
          margin: '6px 0 0', color: T.ink, letterSpacing: '-0.025em', lineHeight: 1.04,
        }}>
          The full <em style={{ color: T.red }}>list.</em>
        </h1>
      </div>

      {/* Add form */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 28,
        padding: '16px 20px', background: T.paperDark, border: `1px solid ${T.rule}`,
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
          background: T.red, color: T.paper, border: 'none',
          fontFamily: FONT_BODY, fontSize: 11,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '9px 20px', cursor: 'pointer',
        }}>Add →</button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', borderTop: `1px solid ${T.rule}`,
        borderBottom: `1px solid ${T.rule}`, marginBottom: 24,
      }}>
        {[['all', 'All'], ['active', 'Active'], ['done', 'Done']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            background: filter === k ? T.yellowSoft : 'transparent',
            border: 'none', borderRight: `1px solid ${T.rule}`,
            padding: '10px 22px',
            fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.06em',
            color: filter === k ? T.yellow : T.ink2,
            cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {sortedKeys.length === 0 && (
        <div style={{
          padding: '28px 24px', border: `1px dashed ${T.rule}`,
          color: T.ink2, fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 16,
        }}>
          No tasks yet. Add one above.
        </div>
      )}

      {sortedKeys.map(groupKey => {
        const isNone  = groupKey === '__none__';
        const isPast  = !isNone && groupKey < ops.today;
        const isToday = groupKey === ops.today;

        const groupLabel = isNone
          ? 'No due date'
          : `${fmtFull(groupKey)}${isToday ? ' · Today' : isPast ? ' · Overdue' : ''}`;

        return (
          <section key={groupKey} style={{ marginBottom: 32 }}>
            <div style={{
              fontFamily: FONT_BODY, fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: isPast && !isNone ? T.red : T.ink2,
              paddingBottom: 8,
              borderBottom: `1px solid ${isPast && !isNone ? T.red : T.rule}`,
            }}>{groupLabel}</div>

            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {groups[groupKey].map(task => (
                <li key={task.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr 160px 50px',
                  alignItems: 'center', gap: 14,
                  padding: '10px 4px',
                  borderBottom: `1px solid ${T.ruleSoft}`,
                }}>
                  <Checkbox id={task.id} completed={task.completed} onToggle={ops.toggle} />

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
                      background: 'transparent', border: `1px solid ${T.rule}`,
                      fontFamily: FONT_BODY, fontSize: 11,
                      padding: '3px 6px', color: T.ink2, outline: 'none', width: '100%',
                    }}
                  />

                  <button onClick={() => ops.remove(task.id)} style={{
                    background: 'transparent', border: `1px solid ${T.rule}`,
                    fontFamily: FONT_BODY, fontSize: 11,
                    padding: '4px 0', color: T.ink, cursor: 'pointer', textAlign: 'center',
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
