import React, { useState, useEffect, useRef } from 'react';
import { useT, FONT_HEAD, FONT_BODY, FONT_NUM, localDate, fmtTime, TASK_COLORS } from '../theme';
import { Checkbox } from './Checkbox';
import { TimeField } from './TimeField';

const ROW_H   = 56;
const LABEL_W = 72;
const HOURS   = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM – 10 PM
const FIRST_H = HOURS[0];
const LAST_H  = HOURS[HOURS.length - 1];

const timeToFrac = t => {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
};
const fracToTime = frac => {
  const h = Math.floor(frac);
  const m = Math.round((frac % 1) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const fmtHour = h => h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;

function TaskBlock({ task, ops }) {
  const T = useT();
  const [liveEnd, setLiveEnd] = useState(null);
  const liveRef  = useRef(null);
  const dragRef  = useRef({ active: false });

  const chipColor = task.color ? TASK_COLORS.find(c => c.id === task.color)?.hex : null;
  const startFrac = timeToFrac(task.scheduled_time);
  const storedEnd = task.scheduled_end ? timeToFrac(task.scheduled_end) : startFrac + 1;
  const effectiveEnd = liveEnd !== null ? liveEnd : storedEnd;

  const top    = (startFrac - FIRST_H) * ROW_H;
  const height = Math.max(28, (effectiveEnd - startFrac) * ROW_H);
  const showTimeRow = height >= 44;

  useEffect(() => { setLiveEnd(null); liveRef.current = null; }, [task.scheduled_end]);

  const onResizeDown = e => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current.active = true;
    const startY = e.clientY;
    const base   = storedEnd;

    const onMove = ev => {
      const dy      = ev.clientY - startY;
      const snapped = Math.round((base + dy / ROW_H) * 4) / 4;
      const clamped = Math.max(startFrac + 0.25, Math.min(LAST_H + 1, snapped));
      liveRef.current = clamped;
      setLiveEnd(clamped);
    };
    const onUp = () => {
      if (liveRef.current !== null) {
        ops.setTime(task.id, task.scheduled_time, fracToTime(liveRef.current));
        liveRef.current = null;
      }
      dragRef.current.active = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const bg      = chipColor || T.red;
  const textCol = 'rgba(255,255,255,0.9)';
  const dimCol  = 'rgba(255,255,255,0.55)';
  const endFrac = liveEnd !== null ? liveEnd : (task.scheduled_end ? storedEnd : null);
  const endLabel = endFrac !== null ? fmtTime(fracToTime(endFrac)) : null;

  return (
    <div
      style={{
        position: 'absolute',
        // Left offset includes LABEL_W since this is now directly in the container
        left: LABEL_W + 4, right: 4,
        top, height,
        background: bg,
        borderTop: `2px solid rgba(255,255,255,0.25)`,
        overflow: 'hidden',
        zIndex: 3,
        boxSizing: 'border-box',
        boxShadow: `0 2px 20px ${bg}44, inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
    >
      <div style={{ padding: '4px 8px 14px', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Checkbox id={task.id} completed={task.completed} onToggle={ops.toggle} />
          <span style={{
            flex: 1, fontFamily: FONT_BODY, fontSize: 11, color: textCol,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textDecoration: task.completed ? 'line-through' : 'none',
          }}>
            {task.title}
          </span>
          {height >= 44 && (
            <TimeField taskId={task.id} time={task.scheduled_time} endTime={task.scheduled_end} dueDate={task.due_date} ops={ops} />
          )}
          <button
            onClick={e => { e.stopPropagation(); ops.remove(task.id); }}
            style={{ background: 'none', border: 'none', color: dimCol, fontSize: 10, cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >✕</button>
        </div>

        {showTimeRow && (
          <div style={{ fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 10, color: dimCol, marginTop: 3 }}>
            {fmtTime(task.scheduled_time)}{endLabel ? ` – ${endLabel}` : ''}
          </div>
        )}
      </div>

      <div
        onMouseDown={onResizeDown}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 10, cursor: 'ns-resize',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ width: 22, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.35)' }} />
      </div>
    </div>
  );
}

export function DayCalendar({ todos, ops, dayKey }) {
  const T = useT();
  const [activeSlot,  setActiveSlot]  = useState(null);
  const [slotTitle,   setSlotTitle]   = useState('');
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [nowTime,     setNowTime]     = useState(() => new Date());
  const containerRef = useRef(null);

  const effectiveDay   = dayKey || ops.today;
  const isViewingToday = effectiveDay === ops.today;
  const nowFrac        = nowTime.getHours() + nowTime.getMinutes() / 60;
  const nowTopPx       = isViewingToday ? (nowFrac - FIRST_H) * ROW_H : null;

  useEffect(() => {
    const id = setInterval(() => setNowTime(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const frac = nowTime.getHours() + nowTime.getMinutes() / 60;
      containerRef.current.scrollTop = isViewingToday
        ? Math.max(0, (frac - FIRST_H - 1) * ROW_H)
        : 0;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDay]);

  const scheduledTasks = todos.filter(t => t.due_date === effectiveDay && t.scheduled_time);

  const handleAdd = async hour => {
    if (!slotTitle.trim()) { setActiveSlot(null); return; }
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime   = `${String(Math.min(hour + 1, LAST_H)).padStart(2, '0')}:00`;
    await ops.add(slotTitle, effectiveDay, startTime, null, endTime);
    setSlotTitle(''); setActiveSlot(null);
  };

  const totalH = HOURS.length * ROW_H;
  const d = localDate(effectiveDay);
  const dayLabel = isViewingToday
    ? 'Today'
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2 }}>
          Schedule
        </div>
        <div style={{ fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 14, color: T.red }}>
          {dayLabel}
        </div>
      </div>

      <div ref={containerRef} className="day-cal-scroll" style={{ height: 420, overflowY: 'auto', border: `1px solid ${T.rule}`, position: 'relative' }}>
        <div style={{ position: 'relative', height: totalH }}>

          {/* Hour grid — slot rows receive all pointer events */}
          {HOURS.map((h, i) => {
            const isNowHour = isViewingToday && Math.floor(nowFrac) === h;
            const isActive  = activeSlot === h;
            const isHovered = hoveredSlot === h;
            return (
              <div
                key={h}
                style={{
                  position: 'absolute', top: i * ROW_H, left: 0, right: 0, height: ROW_H,
                  display: 'flex',
                  borderBottom: i < HOURS.length - 1 ? `1px solid ${T.ruleSoft}` : 'none',
                }}
              >
                {/* Time label */}
                <div style={{
                  width: LABEL_W, flexShrink: 0,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                  padding: '8px 12px 0 0',
                  borderRight: `1px solid ${T.rule}`,
                  fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 12,
                  color: isNowHour ? T.red : T.ink2,
                  background: T.paper,
                  transition: 'color 0.2s',
                  zIndex: 1,
                }}>
                  {fmtHour(h)}
                </div>

                {/* Slot row */}
                <div
                  className="slot-row"
                  onMouseEnter={() => { if (!isActive) setHoveredSlot(h); }}
                  onMouseLeave={() => setHoveredSlot(null)}
                  style={{
                    flex: 1,
                    background: isActive ? T.redSoft : T.paper,
                    cursor: isActive ? 'default' : 'pointer',
                    '--hover-bg': T.paperDark,
                    display: 'flex', alignItems: 'center', padding: '0 10px',
                    zIndex: 1,
                  }}
                  onClick={() => { if (!isActive) { setActiveSlot(h); setSlotTitle(''); } }}
                >
                  {/* + add — hover-only, glows red */}
                  {!isActive && isHovered && (
                    <span style={{
                      fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11,
                      color: T.red, userSelect: 'none',
                      textShadow: `0 0 10px ${T.red}88`,
                      transition: 'opacity 0.1s',
                    }}>
                      + add
                    </span>
                  )}

                  {isActive && (
                    <div style={{ display: 'flex', gap: 6, width: '100%' }} onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={slotTitle}
                        onChange={e => setSlotTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(h); if (e.key === 'Escape') setActiveSlot(null); }}
                        placeholder={`Task at ${fmtHour(h)}…`}
                        style={{ flex: 1, background: T.paper, border: `1px solid ${T.rule}`, fontFamily: FONT_BODY, fontSize: 12, padding: '4px 8px', color: T.ink, outline: 'none' }}
                      />
                      <button onClick={() => handleAdd(h)} className="btn-action" style={{ background: T.red, color: T.paper, border: 'none', fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 12px', cursor: 'pointer' }}>Add</button>
                      <button onClick={() => setActiveSlot(null)} style={{ background: 'none', border: `1px solid ${T.rule}`, fontFamily: FONT_BODY, fontSize: 10, padding: '4px 8px', color: T.ink2, cursor: 'pointer' }}>✕</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Task blocks — rendered directly (no wrapper) so they only intercept
              events in their own footprint; empty slot areas remain clickable */}
          {scheduledTasks.map(task => (
            <TaskBlock key={task.id} task={task} ops={ops} />
          ))}

          {/* Now line */}
          {nowTopPx !== null && nowTopPx >= 0 && nowTopPx <= totalH && (
            <div style={{ position: 'absolute', top: nowTopPx, left: 0, right: 0, height: 1, background: T.red, zIndex: 10, pointerEvents: 'none', boxShadow: `0 0 8px ${T.red}` }}>
              <div className="now-dot" style={{ position: 'absolute', left: LABEL_W - 4, top: -3, width: 7, height: 7, borderRadius: '50%', background: T.red }} />
              <span style={{ position: 'absolute', right: 10, top: 0, transform: 'translateY(-50%)', fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 10, color: T.red, background: T.paper, padding: '0 3px' }}>
                {nowTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
