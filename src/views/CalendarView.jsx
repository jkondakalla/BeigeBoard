/* CalendarView — monthly grid with drag-to-schedule.

   Layout:
     Left sidebar  — unscheduled tasks; drag onto any date to assign due_date
     Right grid    — 6-row × 7-col month grid; task chips on each day

   Interactions:
     · Drag chip from sidebar → drop on a day cell → assigns due_date
     · Drag chip from a day cell → drop on another day → reschedules
     · Click a chip → onSelect (opens DetailPanel)
     · Click a day number → sets "focused day" to show tasks for that day
     · Prev / next / this month navigation

   global: React, useT, FONT_HEAD, FONT_BODY, FONT_NUM,
           localDate, isoDate, addDays, fmtTime,
           Eyebrow, Checkbox,
           getAccent, halate, TASK_COLORS */

const { useState, useEffect, useRef, useMemo } = React;

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── helpers ─────────────────────────────────────────────────────── */
function monthStart(iso) {
  const d = localDate(iso);
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function monthEnd(iso) {
  const d = localDate(iso);
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
function addMonths(iso, n) {
  const d = localDate(iso);
  return isoDate(new Date(d.getFullYear(), d.getMonth() + n, 1));
}
function monthLabel(iso) {
  return localDate(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* Build the 6×7 grid: Mon-anchored, padded with prev/next month days */
function buildGrid(iso) {
  const ms = monthStart(iso);
  const me = monthEnd(iso);
  const startD = localDate(ms);
  const endD   = localDate(me);
  const dow0   = (startD.getDay() + 6) % 7; // 0=Mon
  const grid   = [];
  const d = new Date(startD);
  d.setDate(d.getDate() - dow0);
  for (let i = 0; i < 42; i++) {
    grid.push({ iso: isoDate(d), inMonth: d.getMonth() === startD.getMonth() });
    d.setDate(d.getDate() + 1);
  }
  return grid;
}

/* ── CalendarView ────────────────────────────────────────────────── */
function CalendarView({ items, today, onSelect, onToggle, onUpdateItem, onAddItem, selectedId }) {
  const T = useT();
  const [cursor, setCursor] = useState(() => monthStart(today));
  const [drag, setDrag]     = useState(null);
  /* drag = { id, fromDay | null } */

  const grid = useMemo(() => buildGrid(cursor), [cursor]);

  /* Group tasks by due_date */
  const byDay = useMemo(() => {
    const out = {};
    items.forEach(it => {
      if (it.kind !== 'task' && it.kind !== 'event') return;
      const key = it.due_date || '__none__';
      if (!out[key]) out[key] = [];
      out[key].push(it);
    });
    return out;
  }, [items]);

  const unscheduled = byDay['__none__'] || [];

  /* ── Drag handlers ─────────────────────────────────────────────── */
  const onDragStart = (e, item, fromDay) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(item.id));
    setDrag({ id: item.id, fromDay: fromDay || null });
  };

  const onDrop = (e, dayKey) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!id) return;
    onUpdateItem?.(id, { due_date: dayKey });
    setDrag(null);
  };

  const onDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDragEnd  = () => setDrag(null);

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', background: T.paper }}>

      {/* ── Unscheduled sidebar ──────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: `1px solid ${T.rule}`,
        background: T.paperDark,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${T.rule}` }}>
          <Eyebrow>Unscheduled · {unscheduled.length}</Eyebrow>
          <p style={{
            fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 12,
            color: T.ink2, margin: '4px 0 0', lineHeight: 1.35,
          }}>Drag onto a date to schedule</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {unscheduled.length === 0 ? (
            <p style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 13, color: T.ink3, margin: '12px 4px' }}>
              Nothing left to place.
            </p>
          ) : unscheduled.map(it => (
            <TaskChip
              key={it.id}
              item={it}
              isDragging={drag?.id === it.id}
              isSelected={selectedId === it.id}
              onSelect={onSelect}
              onToggle={onToggle}
              draggable
              onDragStart={e => onDragStart(e, it, null)}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </aside>

      {/* ── Calendar grid ────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Month nav */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px 12px',
          borderBottom: `1px solid ${T.rule}`,
          background: T.paper, flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 26,
            margin: 0, letterSpacing: '-0.02em', color: T.ink,
          }}>
            <em style={{ color: T.red, fontStyle: 'italic', textShadow: halate(T.red, 'mid') }}>
              {monthLabel(cursor)}
            </em>
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setCursor(c => addMonths(c, -1))} style={navBtn(T)}>‹</button>
            <button onClick={() => setCursor(monthStart(today))}      style={navBtn(T, true)}>This month</button>
            <button onClick={() => setCursor(c => addMonths(c, 1))}  style={navBtn(T)}>›</button>
          </div>
        </div>

        {/* Day-of-week header */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          borderBottom: `1px solid ${T.rule}`,
          background: T.paperDark, flexShrink: 0,
        }}>
          {DOW.map(d => (
            <div key={d} style={{
              fontFamily: FONT_BODY, fontSize: 9.5, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: T.ink2,
              padding: '6px 10px',
              borderRight: d !== 'Sun' ? `1px solid ${T.rule}` : 'none',
            }}>{d}</div>
          ))}
        </div>

        {/* Grid rows */}
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gridAutoRows: 'minmax(90px, 1fr)',
          alignContent: 'start',
        }}>
          {grid.map((cell, i) => {
            const cellTasks = byDay[cell.iso] || [];
            const isToday   = cell.iso === today;
            const col       = i % 7;
            const isDragTarget = drag && drag.id !== undefined;

            return (
              <div
                key={cell.iso}
                onDragOver={isDragTarget ? onDragOver : undefined}
                onDrop={isDragTarget ? e => onDrop(e, cell.iso) : undefined}
                style={{
                  borderRight:  col < 6 ? `1px solid ${T.ruleSoft}` : 'none',
                  borderBottom: `1px solid ${T.ruleSoft}`,
                  background: isToday
                    ? `${T.redSoft}55`
                    : !cell.inMonth
                    ? 'rgba(0,0,0,0.04)'
                    : T.paper,
                  padding: '5px 6px 6px',
                  minHeight: 90,
                  transition: 'background 0.1s',
                  outline: isDragTarget && cell.inMonth ? `1px dashed ${T.red}44` : 'none',
                  outlineOffset: -1,
                }}
              >
                {/* Day number */}
                <div style={{
                  fontFamily: FONT_NUM, fontSize: 14,
                  color: isToday ? T.red : (!cell.inMonth ? T.ink3 : T.ink2),
                  fontStyle: isToday ? 'italic' : 'normal',
                  fontWeight: isToday ? 500 : 400,
                  textShadow: isToday ? halate(T.red, 'low') : 'none',
                  marginBottom: 4, lineHeight: 1,
                }}>
                  {localDate(cell.iso).getDate()}
                </div>

                {/* Task chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {cellTasks.slice(0, 4).map(it => (
                    <TaskChip
                      key={it.id}
                      item={it}
                      isDragging={drag?.id === it.id}
                      isSelected={selectedId === it.id}
                      onSelect={onSelect}
                      onToggle={onToggle}
                      compact
                      draggable
                      onDragStart={e => onDragStart(e, it, cell.iso)}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                  {cellTasks.length > 4 && (
                    <span style={{
                      fontFamily: FONT_BODY, fontSize: 9.5, color: T.ink3,
                      fontStyle: 'italic', paddingLeft: 4,
                    }}>+{cellTasks.length - 4} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── TaskChip — shared between sidebar and grid cells ───────────── */
function TaskChip({ item, isDragging, isSelected, onSelect, onToggle, compact, draggable, onDragStart, onDragEnd }) {
  const T = useT();
  const accent = item.accent || T.ink2;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={e => { e.stopPropagation(); onSelect(item); }}
      className="day-chip"
      style={{
        display: 'flex', alignItems: 'center', gap: compact ? 4 : 6,
        padding: compact ? '2px 5px 2px 4px' : '5px 8px 5px 6px',
        background: item.completed ? 'transparent' : accent,
        border: item.completed ? `1px solid ${T.ruleSoft}` : 'none',
        color: item.completed ? T.ink2 : 'rgba(255,255,255,0.93)',
        fontFamily: FONT_BODY, fontSize: compact ? 10 : 11.5,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        outline: isSelected ? `1.5px solid ${T.yellow}` : 'none',
        outlineOffset: -1,
        userSelect: 'none',
        overflow: 'hidden',
        transition: 'opacity 0.12s',
      }}
    >
      <Checkbox
        id={item.id} completed={item.completed} onToggle={onToggle}
        color={item.completed ? T.ink2 : 'rgba(255,255,255,0.7)'}
        size={compact ? 9 : 11}
      />
      <span style={{
        flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: item.completed ? 'line-through' : 'none',
      }}>{item.title}</span>
      {!compact && item.scheduled_time && (
        <span style={{
          fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 10,
          opacity: 0.75, flexShrink: 0,
        }}>{fmtTime(item.scheduled_time)}</span>
      )}
    </div>
  );
}

/* ── Shared button style ─────────────────────────────────────────── */
function navBtn(T, primary) {
  return {
    background: primary ? T.red : 'transparent',
    border: `1px solid ${primary ? T.red : T.rule}`,
    color: primary ? T.paper : T.ink2,
    fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.14em',
    textTransform: 'uppercase', padding: '6px 14px',
    cursor: 'pointer',
    boxShadow: primary ? `0 0 10px ${T.red}44` : 'none',
  };
}

Object.assign(window, { CalendarView });
