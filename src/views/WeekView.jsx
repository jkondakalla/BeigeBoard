/* WeekView — 7-day hybrid timeline.

   Layout (top to bottom):
     · Week header strip: 7 day labels + a Mon-of-week navigator
     · Untimed dock — each column shows tasks for that day with no time
     · Hour timeline — 6 AM to 10 PM, scrollable, with time-blocked items

   Drag interactions:
     · Drag a chip from one day's dock to another day → reschedule
     · Drag a chip from the dock onto the hour timeline → time-block it
     · Drag a timeline block to a different time or day
     · Drag the bottom edge of a timeline block → resize duration
     · Click an empty hour cell → quick-add at that time

   Cassette-futurism touches:
     · Hour rules glow softly with a 1-px scanline
     · A "head" indicator pulses at the current time (today only)
     · Drag preview is amber, like a tape-head readout
     · The whole grid sits in a slightly inset panel like a deck plate

   global: React, useT, FONT_HEAD, FONT_BODY, FONT_NUM,
           localDate, isoDate, addDays, weekStart, fmtTime, fmtWeekday,
           fmtHourLabel, timeToFrac,
           Eyebrow, Checkbox,
           sourceOf, getAccent
*/
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const WV_FIRST_H = 6;
const WV_LAST_H  = 22;
const WV_ROW_H   = 48;
const WV_LABEL_W = 60;

const fracToTime = frac => {
  const h = Math.max(0, Math.min(23, Math.floor(frac)));
  const m = Math.max(0, Math.min(59, Math.round((frac % 1) * 60)));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const snap = (frac, step = 0.25) => Math.round(frac / step) * step;

function WeekView({ items, today, onSelect, onToggle, onAddItem, onUpdateItem, selectedId }) {
  const T = useT();

  const [cursor, setCursor] = useState(() => weekStart(today));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(cursor, i)), [cursor]);
  const weekRange = useMemo(() => {
    const a = localDate(days[0]); const b = localDate(days[6]);
    const sameMonth = a.getMonth() === b.getMonth();
    return sameMonth
      ? `${a.toLocaleDateString('en-US', { month: 'long' })} ${a.getDate()} – ${b.getDate()}`
      : `${a.toLocaleDateString('en-US', { month: 'short' })} ${a.getDate()} – ${b.toLocaleDateString('en-US', { month: 'short' })} ${b.getDate()}`;
  }, [days]);

  /* Tasks + events for this week, grouped by day */
  const byDay = useMemo(() => {
    const out = {};
    days.forEach(d => out[d] = { untimed: [], timed: [] });
    items.forEach(it => {
      if (!out[it.due_date]) return;
      if (it.kind !== 'task' && it.kind !== 'event') return;
      if (it.scheduled_time) out[it.due_date].timed.push(it);
      else if (it.kind === 'task') out[it.due_date].untimed.push(it);
    });
    return out;
  }, [items, days]);

  /* Now pulse */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(i); }, []);
  const nowFrac = now.getHours() + now.getMinutes() / 60;
  const todayCol = days.indexOf(today);

  /* Scroll to morning on cursor change */
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      const target = days.includes(today) ? Math.max(WV_FIRST_H, nowFrac - 1) : 8;
      scrollRef.current.scrollTop = (target - WV_FIRST_H) * WV_ROW_H;
    }
  }, [cursor]); // eslint-disable-line

  /* ── Create-pending state (replaces window.prompt) ─────────── */
  const [createPending, setCreatePending] = useState(null);
  /* createPending = { startDay, scheduled_time, scheduled_end } | null */

  /* ── Drag state ────────────────────────────────────────────── */
  const [drag, setDrag] = useState(null);
  /* drag = {
       mode: 'move-untimed' | 'move-timed' | 'resize' | 'create',
       id?: number,
       startDay, startTime?, startEnd?,
       overDay?, overFrac?, overEnd?,
       startY?, startX?,
     } */

  const beginDragUntimed = (e, item) => {
    e.preventDefault();
    setDrag({ mode: 'move-untimed', id: item.id, item });
  };
  const beginDragTimed = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ mode: 'move-timed', id: item.id, item });
  };
  const beginResize = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const startFrac = timeToFrac(item.scheduled_time);
    const endFrac = item.scheduled_end ? timeToFrac(item.scheduled_end) : startFrac + 1;
    setDrag({ mode: 'resize', id: item.id, item, startFrac, endFrac });
  };
  const beginCreate = (e, dayKey, hourFrac) => {
    e.preventDefault();
    setDrag({ mode: 'create', startDay: dayKey, startFrac: hourFrac, overDay: dayKey, overFrac: hourFrac });
  };

  /* Track drag */
  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      /* Find the day column under the cursor */
      const cols = document.querySelectorAll('[data-day-col]');
      let overDay = null, colRect = null;
      cols.forEach(c => {
        const r = c.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right) {
          overDay = c.getAttribute('data-day-col');
          colRect = r;
        }
      });
      if (!overDay) return;

      /* Are we in the timeline portion? Find the hour-area for that column */
      const hourArea = document.querySelector(`[data-hour-area="${overDay}"]`);
      let overFrac = null;
      if (hourArea) {
        const hr = hourArea.getBoundingClientRect();
        if (e.clientY >= hr.top && e.clientY <= hr.bottom) {
          const y = e.clientY - hr.top + hourArea.scrollTop;
          overFrac = snap(WV_FIRST_H + y / WV_ROW_H);
        }
      }
      setDrag(d => ({ ...d, overDay, overFrac }));
    };
    const onUp = (e) => {
      if (!drag) return;
      finishDrag(drag);
      setDrag(null);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  // eslint-disable-next-line
  }, [drag]);

  const finishDrag = (d) => {
    if (!d || !d.overDay) return;
    if (d.mode === 'move-untimed') {
      if (d.overFrac !== null) {
        /* Drop into timeline → time-block it */
        onUpdateItem(d.id, {
          due_date: d.overDay,
          scheduled_time: fracToTime(d.overFrac),
          scheduled_end:  fracToTime(d.overFrac + 1),
        });
      } else if (d.overDay !== d.item.due_date) {
        /* Drop into another day's dock → reschedule */
        onUpdateItem(d.id, { due_date: d.overDay });
      }
    } else if (d.mode === 'move-timed') {
      if (d.overFrac !== null) {
        const start = timeToFrac(d.item.scheduled_time);
        const end   = d.item.scheduled_end ? timeToFrac(d.item.scheduled_end) : start + 1;
        const newStart = d.overFrac;
        const newEnd   = newStart + (end - start);
        onUpdateItem(d.id, {
          due_date: d.overDay,
          scheduled_time: fracToTime(newStart),
          scheduled_end:  fracToTime(newEnd),
        });
      } else if (d.overDay !== d.item.due_date) {
        /* Dropped on dock of another day → become untimed */
        onUpdateItem(d.id, {
          due_date: d.overDay,
          scheduled_time: null,
          scheduled_end: null,
        });
      }
    } else if (d.mode === 'resize') {
      if (d.overFrac !== null && d.overFrac > d.startFrac + 0.1) {
        onUpdateItem(d.id, { scheduled_end: fracToTime(d.overFrac) });
      }
    } else if (d.mode === 'create') {
      const a = d.startFrac;
      const b = d.overFrac !== null ? d.overFrac : a + 1;
      const start = Math.min(a, b);
      const end   = Math.max(a + 0.5, b);
      setCreatePending({
        startDay: d.startDay,
        scheduled_time: fracToTime(start),
        scheduled_end:  fracToTime(end),
      });
    }
  };

  const HOURS = Array.from({ length: WV_LAST_H - WV_FIRST_H + 1 }, (_, i) => i + WV_FIRST_H);
  const totalH = HOURS.length * WV_ROW_H;

  return (
    <>
    <div style={{ flex: 1, overflowY: 'auto', background: T.paper, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, padding: '24px 32px 0', display: 'flex', flexDirection: 'column', maxWidth: 1280, margin: '0 auto', width: '100%' }}>

        {/* ── Week header ────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.rule}` }}>
          <div>
            <Eyebrow style={{ marginBottom: 4 }}>The week</Eyebrow>
            <h1 style={{
              fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 32, margin: 0,
              letterSpacing: '-0.025em', lineHeight: 1.04, color: T.ink, whiteSpace: 'nowrap',
            }}>
              <em style={{ fontStyle: 'italic', color: T.red, textShadow: halate(T.red, 'mid') }}>{weekRange}</em>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setCursor(addDays(cursor, -7))} style={navBtn(T)}>‹</button>
            <button onClick={() => setCursor(weekStart(today))} style={navBtn(T, true)}>This week</button>
            <button onClick={() => setCursor(addDays(cursor, 7))} style={navBtn(T)}>›</button>
          </div>
        </div>

        {/* ── The whole deck: day strip + untimed dock + timeline ── */}
        <div style={{
          flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column',
          background: T.paperDark,
          border: `1px solid ${T.rule}`,
          boxShadow: `inset 0 1px 0 rgba(0,0,0,0.06), inset 0 -1px 0 rgba(255,255,255,0.18)`,
          overflow: 'hidden',
        }}>

          {/* Day-label row */}
          <div style={{
            display: 'grid', gridTemplateColumns: `${WV_LABEL_W}px repeat(7, minmax(0, 1fr))`,
            borderBottom: `1px solid ${T.rule}`,
            background: T.paper,
          }}>
            <div style={{ borderRight: `1px solid ${T.rule}` }} />
            {days.map((d, i) => {
              const dd = localDate(d);
              const isToday = d === today;
              return (
                <button
                  key={d}
                  onClick={() => { /* could open day view */ }}
                  style={{
                    background: isToday ? T.redSoft : 'transparent',
                    border: 'none',
                    borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
                    padding: '8px 12px 10px', cursor: 'default', textAlign: 'left',
                  }}
                >
                  <div style={{
                    fontFamily: FONT_BODY, fontSize: 9.5, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: isToday ? T.red : T.ink2,
                  }}>{dd.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div style={{
                    fontFamily: FONT_NUM, fontSize: 22, marginTop: 2,
                    color: isToday ? T.red : T.ink,
                    fontStyle: isToday ? 'italic' : 'normal',
                    fontWeight: isToday ? 500 : 400,
                    letterSpacing: '-0.02em',
                    textShadow: isToday ? halate(T.red, 'mid') : 'none',
                  }}>{dd.getDate()}</div>
                </button>
              );
            })}
          </div>

          {/* Untimed dock */}
          <div style={{
            display: 'grid', gridTemplateColumns: `${WV_LABEL_W}px repeat(7, minmax(0, 1fr))`,
            borderBottom: `1px solid ${T.rule}`,
            background: T.paper,
            minHeight: 56,
          }}>
            <div style={{
              borderRight: `1px solid ${T.rule}`,
              fontFamily: FONT_BODY, fontSize: 8.5, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: T.ink3,
              padding: '6px 6px 0 0', textAlign: 'right',
            }}>untimed</div>
            {days.map((d, i) => {
              const items = byDay[d]?.untimed || [];
              const overTarget = drag?.overDay === d && drag?.overFrac == null && (drag?.mode === 'move-untimed' || drag?.mode === 'move-timed');
              return (
                <div
                  key={d}
                  data-day-col={d}
                  style={{
                    borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
                    background: d === today ? `${T.redSoft}44` : 'transparent',
                    outline: overTarget ? `1px dashed ${T.red}` : 'none',
                    outlineOffset: -2,
                    padding: 4,
                    display: 'flex', flexDirection: 'column', gap: 3,
                  }}
                >
                  {items.map(it => (
                    <UntimedChip
                      key={it.id} item={it}
                      isSelected={selectedId === it.id}
                      isDragging={drag?.id === it.id}
                      onSelect={onSelect}
                      onToggle={onToggle}
                      onMouseDown={(e) => beginDragUntimed(e, it)}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Hour timeline */}
          <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', position: 'relative' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: `${WV_LABEL_W}px repeat(7, minmax(0, 1fr))`,
              height: totalH, position: 'relative',
            }}>
              {/* Hour labels */}
              <div style={{ position: 'relative', borderRight: `1px solid ${T.rule}`, background: T.paper }}>
                {HOURS.map((h, i) => (
                  <div key={h} style={{
                    position: 'absolute', top: i * WV_ROW_H, left: 0, right: 0, height: WV_ROW_H,
                    fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 10.5, color: T.ink2,
                    textAlign: 'right', padding: '3px 6px 0 0',
                  }}>{i === 0 ? '' : fmtHourLabel(h)}</div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((d, i) => {
                const timed = byDay[d]?.timed || [];
                const isToday = d === today;
                const dragPreview = drag && drag.overDay === d && drag.overFrac != null;
                return (
                  <div
                    key={d}
                    data-day-col={d}
                    data-hour-area={d}
                    onMouseDown={(e) => {
                      /* Only start create on background, not on a chip */
                      if (e.target !== e.currentTarget && !e.target.dataset?.gridBg) return;
                      const r = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - r.top + e.currentTarget.scrollTop;
                      const frac = snap(WV_FIRST_H + y / WV_ROW_H);
                      beginCreate(e, d, frac);
                    }}
                    style={{
                      position: 'relative',
                      borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
                      background: isToday ? `${T.redSoft}44` : T.paper,
                      cursor: 'crosshair',
                    }}
                  >
                    {/* Grid lines */}
                    {HOURS.map((h, idx) => (
                      <div key={h} data-grid-bg style={{
                        position: 'absolute', left: 0, right: 0, top: idx * WV_ROW_H, height: WV_ROW_H,
                        borderBottom: idx < HOURS.length - 1 ? `1px solid ${T.ruleSoft}` : 'none',
                      }}>
                        <div data-grid-bg style={{
                          position: 'absolute', left: 0, right: 0, top: WV_ROW_H / 2,
                          borderTop: `1px dotted ${T.ruleSoft}`, opacity: 0.4,
                        }} />
                      </div>
                    ))}

                    {/* Time blocks */}
                    {timed.map(item => (
                      <TimeBlock
                        key={item.id} item={item}
                        isSelected={selectedId === item.id}
                        isDragging={drag?.id === item.id}
                        liveOverride={
                          drag?.id === item.id && drag?.mode === 'move-timed' && drag.overFrac != null
                            ? { start: drag.overFrac }
                            : drag?.id === item.id && drag?.mode === 'resize' && drag.overFrac != null
                            ? { end: drag.overFrac }
                            : null
                        }
                        onSelect={onSelect}
                        onToggle={onToggle}
                        onBeginDrag={(e) => beginDragTimed(e, item)}
                        onBeginResize={(e) => beginResize(e, item)}
                      />
                    ))}

                    {/* Drag preview */}
                    {dragPreview && drag.mode !== 'move-timed' && (
                      <DragGhost drag={drag} />
                    )}

                    {/* Now line */}
                    {isToday && nowFrac >= WV_FIRST_H && nowFrac <= WV_LAST_H + 1 && (
                      <div style={{
                        position: 'absolute', top: (nowFrac - WV_FIRST_H) * WV_ROW_H,
                        left: 0, right: 0, height: 1, background: T.red, zIndex: 12, pointerEvents: 'none',
                        boxShadow: `0 0 8px ${T.red}99, 0 0 14px ${T.red}44`,
                      }}>
                        <span className="now-dot" style={{
                          position: 'absolute', left: -4, top: -3,
                          width: 8, height: 8, borderRadius: '50%', background: T.red,
                          boxShadow: `0 0 8px ${T.red}cc, 0 0 14px ${T.red}66`,
                        }} />
                        <span style={{
                          position: 'absolute', right: 6, top: -8,
                          fontFamily: FONT_BODY, fontSize: 8, letterSpacing: '0.22em',
                          textTransform: 'uppercase', color: T.red,
                          background: T.paper, padding: '1px 5px',
                          textShadow: halate(T.red, 'mid'),
                          border: `1px solid ${T.red}`,
                        }}>● rec</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>

    {createPending && (
      <CreateDialog
        pending={createPending}
        onSubmit={title => {
          onAddItem({
            kind: 'task', scope: 'day',
            due_date: createPending.startDay,
            scheduled_time: createPending.scheduled_time,
            scheduled_end:  createPending.scheduled_end,
            title,
          });
          setCreatePending(null);
        }}
        onCancel={() => setCreatePending(null)}
      />
    )}
    </>
  );
}

/* ── CreateDialog — replaces window.prompt for drag-to-create ─── */
function CreateDialog({ pending, onSubmit, onCancel }) {
  const T = useT();
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handle = () => {
    if (title.trim()) onSubmit(title.trim());
    else onCancel();
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(10,8,6,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-in"
        style={{
          width: 'min(460px, 90vw)',
          background: T.paperDark,
          border: `1px solid ${T.rule}`,
          boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${T.red}22`,
          padding: '22px 26px 24px',
        }}
      >
        <div style={{
          fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: T.red,
          marginBottom: 10,
        }}>
          {fmtWeekday(pending.startDay)} · {fmtTime(pending.scheduled_time)} – {fmtTime(pending.scheduled_end)}
        </div>
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handle();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="What needs to happen…"
          style={{
            width: '100%', background: 'transparent', border: 'none',
            borderBottom: `1px solid ${T.rule}`,
            fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 22,
            color: T.ink, outline: 'none', padding: '4px 0 10px',
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'transparent', border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: T.ink2, padding: '8px 16px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handle} className="btn-action" style={{
            background: T.red, border: 'none', color: T.paper,
            fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', padding: '8px 20px', cursor: 'pointer',
            boxShadow: `0 0 12px ${T.red}55`,
          }}>Add →</button>
        </div>
      </div>
    </div>
  );
}

/* ── Untimed chip — lives in the dock above the timeline ──────── */
function UntimedChip({ item, isSelected, isDragging, onSelect, onToggle, onMouseDown }) {
  const T = useT();
  const accent = item.accent || T.ink2;
  return (
    <div
      onMouseDown={onMouseDown}
      onClick={(e) => { if (!isDragging) onSelect(item); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '2px 6px 2px 5px',
        background: item.completed ? T.paper : accent,
        color: item.completed ? T.ink2 : 'rgba(255,255,255,0.95)',
        fontFamily: FONT_BODY, fontSize: 10.5,
        cursor: 'grab',
        outline: isSelected ? `1.5px solid ${T.yellow}` : 'none',
        outlineOffset: -1,
        opacity: isDragging ? 0.4 : 1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textDecoration: item.completed ? 'line-through' : 'none',
        userSelect: 'none',
      }}
    >
      <span
        onMouseDown={e => { e.stopPropagation(); }}
        onClick={e => { e.stopPropagation(); onToggle(item.id, item.completed); }}
        style={{
          width: 9, height: 9, flexShrink: 0,
          border: `1px solid ${item.completed ? T.ink2 : 'rgba(255,255,255,0.7)'}`,
          background: item.completed ? T.ink2 : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 6, color: T.paper, lineHeight: 1,
        }}
      >{item.completed ? '✓' : ''}</span>
      <span style={{
        flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{item.title}</span>
    </div>
  );
}

/* ── Timed block — lives in the hour timeline ─────────────────── */
function TimeBlock({ item, isSelected, isDragging, liveOverride, onSelect, onToggle, onBeginDrag, onBeginResize }) {
  const T = useT();
  const isEvent = item.kind === 'event';
  const accent = item.accent || (isEvent && sourceOf(item.source).hex) || T.red;

  const baseStart = timeToFrac(item.scheduled_time);
  const baseEnd   = item.scheduled_end ? timeToFrac(item.scheduled_end) : baseStart + 1;
  const start = liveOverride?.start ?? baseStart;
  const end   = liveOverride?.end   ?? (liveOverride?.start != null ? liveOverride.start + (baseEnd - baseStart) : baseEnd);
  const top    = (start - WV_FIRST_H) * WV_ROW_H;
  const height = Math.max(18, (end - start) * WV_ROW_H);
  const showTime = height >= 32;

  return (
    <div
      onMouseDown={onBeginDrag}
      onClick={e => { e.stopPropagation(); if (!isDragging) onSelect(item); }}
      style={{
        position: 'absolute', left: 3, right: 3, top, height,
        background: accent,
        borderTop: `2px solid rgba(255,255,255,0.28)`,
        outline: isSelected ? `2px solid ${T.yellow}` : 'none',
        outlineOffset: -2,
        boxShadow: isSelected ? `0 0 0 1px ${T.paper}, 0 0 0 3px ${T.yellow}` : isDragging ? `0 6px 18px rgba(0,0,0,0.25)` : 'none',
        overflow: 'hidden', cursor: 'grab',
        opacity: item.completed ? 0.55 : 1,
        zIndex: isDragging ? 8 : 4,
        userSelect: 'none',
      }}
    >
      <div style={{ padding: '3px 7px 8px', height: '100%', boxSizing: 'border-box', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {!isEvent && (
            <span
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onToggle(item.id, item.completed); }}
              style={{
                width: 10, height: 10, flexShrink: 0,
                border: `1px solid rgba(255,255,255,0.7)`,
                background: item.completed ? 'rgba(255,255,255,0.85)' : 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, color: accent, lineHeight: 1,
              }}
            >{item.completed ? '✓' : ''}</span>
          )}
          <span style={{
            flex: 1, minWidth: 0,
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 500,
            color: 'rgba(255,255,255,0.95)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textDecoration: item.completed ? 'line-through' : 'none',
          }}>{item.title}</span>
        </div>
        {showTime && (
          <div style={{
            fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 9.5,
            color: 'rgba(255,255,255,0.65)', marginTop: 2,
          }}>{fmtTime(item.scheduled_time)}{item.scheduled_end ? ` – ${fmtTime(item.scheduled_end)}` : ''}</div>
        )}
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={onBeginResize}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 7, cursor: 'ns-resize',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ width: 22, height: 2, background: 'rgba(255,255,255,0.4)' }} />
      </div>
    </div>
  );
}

/* ── Drag ghost — amber readout during create ─────────────────── */
function DragGhost({ drag }) {
  const T = useT();
  if (!drag.overFrac) return null;
  const a = drag.startFrac, b = drag.overFrac;
  const start = Math.min(a, b);
  const end   = Math.max(a + 0.5, b);
  const top    = (start - WV_FIRST_H) * WV_ROW_H;
  const height = (end - start) * WV_ROW_H;

  return (
    <div style={{
      position: 'absolute', left: 4, right: 4, top, height,
      background: `${T.yellow}88`,
      border: `1px dashed ${T.yellow}`,
      boxShadow: `0 0 14px ${T.yellow}55`,
      pointerEvents: 'none', zIndex: 6,
    }}>
      <div style={{
        padding: '3px 8px',
        fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 11, color: T.paper,
      }}>
        {fmtTime(fracToTime(start))} – {fmtTime(fracToTime(end))}
      </div>
    </div>
  );
}

/* ── Mini nav button ──────────────────────────────────────────── */
function navBtn(T, primary) {
  return {
    background: primary ? T.paperDark : 'transparent',
    border: `1px solid ${T.rule}`,
    fontFamily: FONT_BODY,
    fontSize: primary ? 10 : 14,
    letterSpacing: primary ? '0.16em' : '0',
    textTransform: primary ? 'uppercase' : 'none',
    padding: primary ? '6px 14px' : '5px 12px',
    color: T.ink, cursor: 'pointer',
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.05)`,
  };
}

Object.assign(window, { WeekView });
