import React, { useState } from 'react';
import { useT, FONT_HEAD, FONT_BODY, FONT_NUM, isoDate, localDate, TASK_COLORS } from '../theme';
import { DayPanel } from '../components/DayPanel';

export function CalendarView({ todos, ops }) {
  const T = useT();
  const { today } = ops;
  const todayDate = localDate(today);

  const [year,        setYear]        = useState(todayDate.getFullYear());
  const [month,       setMonth]       = useState(todayDate.getMonth());
  const [focusDay,    setFocusDay]    = useState(null);
  const [dragTask,    setDragTask]    = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [flashDay,    setFlashDay]    = useState(null);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); setFocusDay(null); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); setFocusDay(null); };
  const goToday   = () => { setYear(todayDate.getFullYear()); setMonth(todayDate.getMonth()); setFocusDay(today); };

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const startDow     = (firstOfMonth.getDay() + 6) % 7;
  const totalCells   = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const cells        = Array.from({ length: totalCells }, (_, i) => {
    const dn = i - startDow + 1;
    return (dn < 1 || dn > daysInMonth) ? null : isoDate(new Date(year, month, dn));
  });
  const totalRows  = cells.length / 7;
  const monthLabel = firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const unscheduled = todos.filter(t => !t.due_date && !t.completed);

  const handleDrop = (e, dayKey) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
    if (taskId) ops.setDueDate(taskId, dayKey);
    setDragTask(null);
    setDragOverDay(null);
  };
  const handleDragEnd = () => { setDragTask(null); setDragOverDay(null); };

  const cellDragProps = (dayKey) => ({
    onDragOver:  (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverDay(dayKey); },
    onDragLeave: (e) => { if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) setDragOverDay(null); },
    onDrop:      (e) => { e.preventDefault(); handleDrop(e, dayKey); },
  });

  const btnStyle = {
    background: 'transparent', border: `1px solid ${T.rule}`,
    fontFamily: FONT_BODY, fontSize: 13,
    padding: '5px 12px', color: T.ink, cursor: 'pointer',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ padding: '28px 40px 64px', maxWidth: 1100, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${T.rule}` }}>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 4 }}>The Calendar</div>
          <h1 style={{ fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 42, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.04 }}>
            <em style={{ color: T.red, fontStyle: 'italic' }}>{monthLabel}</em>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={prevMonth} style={btnStyle}>←</button>
          <button onClick={goToday} style={{ ...btnStyle, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Today</button>
          <button onClick={nextMonth} style={btnStyle}>→</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${T.rule}` }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dn, i) => (
          <div key={dn} style={{
            fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: T.ink2, padding: '8px 12px',
            borderBottom: `1px solid ${T.rule}`,
            borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
            background: T.paperDark,
          }}>{dn}</div>
        ))}

        {cells.map((dayKey, i) => {
          const col = i % 7, row = Math.floor(i / 7);
          if (!dayKey) return (
            <div key={`pad-${i}`} style={{ minHeight: 110, background: T.paperDark, borderRight: col < 6 ? `1px solid ${T.rule}` : 'none', borderBottom: row < totalRows - 1 ? `1px solid ${T.rule}` : 'none' }} />
          );
          const dayTodos  = todos.filter(t => t.due_date === dayKey);
          const remaining = dayTodos.filter(t => !t.completed);
          const isToday   = dayKey === today;
          const isPast    = dayKey < today;
          const isFocus   = focusDay === dayKey;
          const isFlash   = flashDay === dayKey;
          const isDragOver = dragOverDay === dayKey;
          const d         = localDate(dayKey);

          return (
            <div
              key={dayKey}
              className="cal-cell"
              onClick={() => {
                if (!isFocus) {
                  setFlashDay(dayKey);
                  setTimeout(() => setFlashDay(null), 50);
                }
                setFocusDay(isFocus ? null : dayKey);
              }}
              {...cellDragProps(dayKey)}
              style={{
                minHeight: 110,
                background: isDragOver ? T.redSoft : (isToday ? T.redSoft : isPast ? T.paperDark : T.paper),
                borderRight: col < 6 ? `1px solid ${T.rule}` : 'none',
                borderBottom: row < totalRows - 1 ? `1px solid ${T.rule}` : 'none',
                padding: '8px 10px 26px', cursor: dragTask ? 'copy' : 'pointer',
                outline: isDragOver ? `2px dashed ${T.red}` : (isFocus || isFlash ? `2px solid ${isFlash ? '#FF5533' : T.red}` : 'none'),
                outlineOffset: -2, position: 'relative',
                transition: isFlash ? 'none' : 'background 0.1s, outline-color 0.35s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                {isToday ? <span style={{ fontFamily: FONT_BODY, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.red, marginTop: 3 }}>today</span> : <span />}
                <span style={{ fontFamily: FONT_NUM, fontSize: 20, color: isDragOver ? T.red : (isToday ? T.red : isPast ? T.ink2 : T.ink), fontStyle: isToday || isDragOver ? 'italic' : 'normal', fontWeight: isToday ? 500 : 400 }}>
                  {d.getDate()}
                </span>
              </div>

              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {remaining.slice(0, 3).map(task => {
                  const chipColor = task.color ? TASK_COLORS.find(c => c.id === task.color)?.hex : null;
                  return (
                    <div
                      key={task.id}
                      className="day-chip"
                      draggable
                      onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('taskId', String(task.id)); setDragTask(task); }}
                      onDragEnd={handleDragEnd}
                      onClick={e => { e.stopPropagation(); ops.toggle(task.id, task.completed); }}
                      title={task.title}
                      style={{
                        background: chipColor || T.paperDark,
                        border: chipColor
                          ? '1px solid rgba(255,255,255,0.2)'
                          : `1px solid ${T.rule}`,
                        borderLeft: chipColor
                          ? '1px solid rgba(255,255,255,0.2)'
                          : `2px solid ${T.red}`,
                        borderRadius: 3,
                        padding: '2px 5px', fontSize: 10, fontFamily: FONT_BODY,
                        color: chipColor ? 'rgba(255,255,255,0.88)' : T.ink,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        cursor: 'grab',
                        opacity: dragTask?.id === task.id ? 0.4 : 1,
                      }}
                    >{task.title}</div>
                  );
                })}
                {remaining.length > 3 && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: T.ink2, fontStyle: 'italic' }}>+{remaining.length - 3} more</span>}
              </div>

              {dayTodos.length > 0 && remaining.length === 0 && (
                <div style={{ position: 'absolute', bottom: 5, right: 8, fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 10, color: T.ink2 }}>done ✓</div>
              )}
              {remaining.length > 0 && (
                <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8, height: 2, background: T.ruleSoft }}>
                  <div className="progress-fill" style={{ height: '100%', width: `${dayTodos.length ? ((dayTodos.length - remaining.length) / dayTodos.length) * 100 : 0}%`, background: T.red }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {focusDay && <DayPanel dayKey={focusDay} todos={todos} ops={ops} />}

      {unscheduled.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontWeight: 500, fontSize: 22, margin: 0, color: T.ink }}>Unscheduled</h3>
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.ink2 }}>
              {dragTask ? 'Drop onto a date to schedule ↑' : 'Drag onto any date to schedule'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unscheduled.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={e => { e.dataTransfer.setData('taskId', String(task.id)); setDragTask(task); }}
                onDragEnd={handleDragEnd}
                style={{
                  background: T.paper, border: `1px solid ${T.rule}`,
                  borderTop: `2px solid ${T.ink2}`, padding: '6px 11px',
                  fontFamily: FONT_BODY, fontSize: 12, color: T.ink,
                  cursor: 'grab',
                  opacity: dragTask?.id === task.id ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                  userSelect: 'none',
                }}
              >
                ⠿ {task.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {dragTask && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: T.ink, color: T.paper,
          fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '9px 20px', zIndex: 400, pointerEvents: 'none',
        }}>
          Drop on a date to schedule
        </div>
      )}
    </div>
  );
}
