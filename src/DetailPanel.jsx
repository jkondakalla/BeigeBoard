/* DetailPanel — right-side context for whatever is selected.

   Same shell for goals (year/month/week) and tasks (day/subtask) and events.
   For goals, shows the LADDER UP (this is what this is part of), the breakdown
   beneath, and an "open in workshop" affordance.
   For tasks, shows the ladder + time + notes + status.

   global: React, useT, FONT_HEAD, FONT_BODY, FONT_NUM,
           Eyebrow, Checkbox, sourceOf, fmtTime, fmtFull, localDate,
           getAncestors, getChildren, getAccent, getProgress
*/

function DetailPanel({ event, items, onClose, onToggle, onDelete, onUpdateItem, setView, setFocusedGoalId }) {
  const T = useT();
  if (!event) return null;

  const accent = (items && getAccent(event, items)) || (event.source && sourceOf(event.source).hex) || T.red;
  const isTask = event.kind === 'task';
  const isGoal = event.kind === 'goal';
  const isEvent= event.kind === 'event';
  const ancestors = items ? getAncestors(event, items) : [];
  const children  = items ? getChildren(event, items)  : [];
  const prog      = items ? getProgress(event, items)  : { done: 0, total: 0, pct: 0 };

  const scopeLabel = {
    year:    'Year goal',
    month:   'Month milestone',
    week:    'Week theme',
    day:     'Day task',
    subtask: 'Smaller step',
  }[event.scope] || (isGoal ? 'Goal' : isEvent ? 'Event' : 'Task');

  return (
    <aside className="panel-enter" style={{
      borderLeft: `1px solid ${T.rule}`,
      background: T.paperDark,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Accent band */}
      <div style={{
        background: accent, color: 'rgba(255,255,255,0.95)',
        padding: '16px 22px 18px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12, marginBottom: 6,
        }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)',
          }}>{scopeLabel}{isEvent && event.source ? ` · ${sourceOf(event.source).label}` : ''}</div>
          <button
            onClick={onClose} title="Close"
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.7)', fontSize: 16,
              cursor: 'pointer', padding: 0, lineHeight: 1,
            }}
          >✕</button>
        </div>
        <div style={{
          fontFamily: FONT_HEAD,
          fontStyle: isGoal && event.scope !== 'year' ? 'italic' : 'normal',
          fontWeight: 500, fontSize: event.scope === 'year' ? 26 : 22,
          lineHeight: 1.2, letterSpacing: '-0.015em',
          textDecoration: event.completed ? 'line-through' : 'none',
          opacity: event.completed ? 0.7 : 1,
        }}>{event.title}</div>
        {event.target && (
          <div style={{
            fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 12.5,
            color: 'rgba(255,255,255,0.72)', marginTop: 5,
          }}>{event.target}</div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 24px' }}>
        {/* Ladder up — most important block. Always shown first if it exists. */}
        {ancestors.length > 0 && (
          <Field label="Part of">
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ancestors.slice().reverse().map((a, i) => {
                const aAccent = getAccent(a, items);
                return (
                  <li key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    paddingLeft: i * 12,
                  }}>
                    {i > 0 && <span style={{ color: T.ink3, marginRight: 2 }}>↳</span>}
                    <span style={{
                      fontFamily: FONT_BODY, fontSize: 8.5, letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: aAccent || T.ink2,
                      border: `1px solid ${(aAccent || T.ink2) + '40'}`,
                      padding: '1px 6px', flexShrink: 0,
                    }}>{a.scope}</span>
                    <span style={{
                      fontFamily: FONT_HEAD,
                      fontStyle: a.scope === 'year' ? 'normal' : 'italic',
                      fontSize: 14 - Math.min(i, 2), color: T.ink,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{a.title}</span>
                  </li>
                );
              })}
            </ol>
          </Field>
        )}

        {/* When — always shown for tasks; editable */}
        {(isTask || event.due_date || event.scheduled_time) && (
          <WhenField event={event} isTask={isTask} onUpdateItem={onUpdateItem} />
        )}

        {event.location && (
          <Field label="Where">
            <div style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 15, color: T.ink }}>
              {event.location}
            </div>
          </Field>
        )}

        {event.attendees && (
          <Field label="Attending">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{
                fontFamily: FONT_NUM, fontStyle: 'italic',
                fontSize: 30, color: accent, lineHeight: 1,
                textShadow: window.halate(accent, 'mid'),
              }}>{String(event.attendees).padStart(2, '0')}</span>
              <span style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 13, color: T.ink2 }}>
                people
              </span>
            </div>
          </Field>
        )}

        {isTask && (
          <Field label="Status">
            <button
              onClick={() => onToggle?.(event.id, event.completed)}
              className="btn-action"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: 'transparent', border: `1px solid ${T.rule}`,
                fontFamily: FONT_BODY, fontSize: 12,
                padding: '9px 14px', color: T.ink, cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              <Checkbox id={event.id} completed={event.completed} onToggle={onToggle} color={accent} />
              {event.completed ? 'Done — mark active' : 'Mark complete'}
            </button>
          </Field>
        )}

        {/* Breakdown — for goals with children */}
        {isGoal && (
          <Field label={`Breakdown · ${prog.total > 0 ? `${prog.done}/${prog.total}` : 'open'}`}>
            {prog.total > 0 && (
              <div style={{ height: 2, background: T.ruleSoft, marginBottom: 12 }}>
                <div className="progress-fill" style={{ height: '100%', width: `${prog.pct}%`, background: accent }} />
              </div>
            )}
            {children.length === 0 ? (
              <div style={{
                padding: '12px 14px', border: `1px dashed ${T.rule}`,
                fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 13, color: T.ink2,
              }}>Not broken down yet. Open in the workshop to add steps.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {children.slice(0, 6).map(c => (
                  <li key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 0', borderBottom: `1px solid ${T.ruleSoft}`,
                  }}>
                    <span style={{ width: 4, height: 16, background: accent, opacity: 0.5, flexShrink: 0 }} />
                    <span style={{
                      flex: 1, minWidth: 0,
                      fontFamily: c.kind === 'task' ? FONT_BODY : FONT_HEAD,
                      fontStyle: c.kind === 'task' ? 'normal' : 'italic',
                      fontSize: 13, color: c.completed ? T.ink2 : T.ink,
                      textDecoration: c.completed ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{c.title}</span>
                  </li>
                ))}
                {children.length > 6 && (
                  <li style={{
                    fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11,
                    color: T.ink2, padding: '6px 0',
                  }}>+ {children.length - 6} more</li>
                )}
              </ul>
            )}

            <button
              onClick={() => {
                if (event.scope === 'year') setFocusedGoalId?.(event.id);
                setView?.('tasks');
              }}
              className="btn-action"
              style={{
                marginTop: 12,
                background: accent, color: T.paper, border: 'none',
                fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.16em',
                textTransform: 'uppercase', padding: '10px 14px', cursor: 'pointer',
                width: '100%',
              }}
            >Open in workshop →</button>
          </Field>
        )}

        {event.notes && (
          <Field label="Notes">
            <p style={{
              fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 14,
              color: T.ink2, margin: 0, lineHeight: 1.5,
            }}>{event.notes}</p>
          </Field>
        )}

        {isEvent && event.source && (
          <Field label="Source">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 10, height: 10, background: sourceOf(event.source).hex,
                borderRadius: '50%',
              }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.ink }}>
                {sourceOf(event.source).label}
              </span>
            </div>
          </Field>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 24,
          paddingTop: 16, borderTop: `1px solid ${T.ruleSoft}`,
        }}>
          <button
            onClick={() => onDelete?.(event.id)}
            className="btn-action"
            style={{
              flex: 1,
              background: 'transparent', border: `1px solid ${T.rule}`,
              fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: T.ink2,
              padding: '10px 14px', cursor: 'pointer',
            }}
          >Delete</button>
        </div>
      </div>
    </aside>
  );
}

/* ── WhenField — editable date + time scheduling ──────────────── */
function WhenField({ event, isTask, onUpdateItem }) {
  const T = useT();
  const { useState: _useState } = React;
  const [editing, setEditing] = _useState(false);
  const [date,  setDate]  = _useState(event.due_date       || '');
  const [start, setStart] = _useState(event.scheduled_time || '');
  const [end,   setEnd]   = _useState(event.scheduled_end  || '');

  /* Keep local state in sync when a different item is selected */
  React.useEffect(() => {
    setDate(event.due_date       || '');
    setStart(event.scheduled_time || '');
    setEnd(event.scheduled_end   || '');
    setEditing(false);
  }, [event.id]);

  const save = () => {
    onUpdateItem?.(event.id, {
      due_date:       date  || null,
      scheduled_time: start || null,
      scheduled_end:  end   || null,
    });
    setEditing(false);
  };

  const clear = () => {
    onUpdateItem?.(event.id, { due_date: null, scheduled_time: null, scheduled_end: null });
    setDate(''); setStart(''); setEnd('');
    setEditing(false);
  };

  const inputSty = {
    background: 'transparent',
    border: `1px solid ${T.rule}`,
    fontFamily: FONT_BODY, fontSize: 11,
    color: T.ink, padding: '4px 6px', outline: 'none',
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <Eyebrow>When</Eyebrow>
        {isTask && !editing && onUpdateItem && (
          <button onClick={() => setEditing(true)} style={{
            background: 'none', border: 'none',
            fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11,
            color: T.ink2, cursor: 'pointer', padding: 0,
            textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 2,
          }}>edit</button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputSty} />
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} placeholder="Start" style={{ ...inputSty, flex: 1 }} />
            <span style={{ color: T.ink2, alignSelf: 'center', fontSize: 11 }}>–</span>
            <input type="time" value={end}   onChange={e => setEnd(e.target.value)}   placeholder="End"   style={{ ...inputSty, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <button onClick={save} className="btn-action" style={{
              flex: 1, background: T.red, color: T.paper, border: 'none',
              fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', padding: '7px 0', cursor: 'pointer',
            }}>Save</button>
            <button onClick={() => setEditing(false)} style={{
              flex: 1, background: 'transparent', border: `1px solid ${T.rule}`,
              fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: T.ink2, padding: '7px 0', cursor: 'pointer',
            }}>Cancel</button>
            {(event.due_date || event.scheduled_time) && (
              <button onClick={clear} style={{
                background: 'transparent', border: `1px solid ${T.rule}`,
                fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: T.ink3, padding: '7px 10px', cursor: 'pointer',
              }}>Clear</button>
            )}
          </div>
        </div>
      ) : (event.due_date || event.scheduled_time) ? (
        <div onClick={() => isTask && onUpdateItem && setEditing(true)} style={{ cursor: isTask && onUpdateItem ? 'pointer' : 'default' }}>
          {event.due_date && (
            <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: T.ink, lineHeight: 1.3 }}>
              {fmtFull(event.due_date)}
            </div>
          )}
          {event.scheduled_time && (
            <div style={{ fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 14, color: T.ink2, marginTop: 3 }}>
              {fmtTime(event.scheduled_time)}{event.scheduled_end ? ` – ${fmtTime(event.scheduled_end)}` : ''}
            </div>
          )}
          {!event.scheduled_time && isTask && (
            <div style={{ fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 13, color: T.ink2, marginTop: 3 }}>
              Anytime · tap edit to schedule
            </div>
          )}
        </div>
      ) : isTask ? (
        <button onClick={() => onUpdateItem && setEditing(true)} style={{
          background: 'transparent', border: `1px dashed ${T.rule}`,
          fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 13,
          color: T.ink2, cursor: 'pointer', padding: '8px 12px', width: '100%', textAlign: 'left',
        }}>+ Schedule this task</button>
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
      {children}
    </div>
  );
}

Object.assign(window, { DetailPanel });
