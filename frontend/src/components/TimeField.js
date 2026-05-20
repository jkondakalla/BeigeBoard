import React, { useState } from 'react';
import { useT, FONT_BODY, FONT_NUM, fmtTime, localDate } from '../theme';

export function TimeField({ taskId, time, endTime, dueDate, ops }) {
  const T = useT();
  const [open,    setOpen]    = useState(false);
  const [start,   setStart]   = useState(time     || '');
  const [end,     setEnd]     = useState(endTime   || '');
  const [dateVal, setDateVal] = useState(dueDate   || '');

  const openPicker = () => {
    setStart(time    || '');
    setEnd(endTime   || '');
    setDateVal(dueDate || '');
    setOpen(true);
  };

  const save  = () => { ops.setTime(taskId, start || null, end || null, dateVal || null); setOpen(false); };
  const clear = () => { ops.setTime(taskId, null,  null,   null);                         setOpen(false); };

  // Label: time takes priority, then date, then icon
  const label = time
    ? (endTime ? `${fmtTime(time)} – ${fmtTime(endTime)}` : fmtTime(time))
    : dueDate
    ? localDate(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const hasSchedule = !!(time || dueDate);
  const colorScheme = T.grainBlend === 'screen' ? 'dark' : 'light';

  const inputBase = {
    width: '100%', background: T.paper,
    border: 'none', borderBottom: `1px solid ${T.rule}`,
    fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 14,
    color: T.ink, padding: '5px 2px', outline: 'none', colorScheme,
  };

  const labelStyle = {
    fontFamily: FONT_BODY, fontSize: 9,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: T.ink2, marginBottom: 5, display: 'block',
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={openPicker}
        title={hasSchedule ? 'Edit schedule' : 'Schedule'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 5px', lineHeight: 1,
          fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.03em',
          color: hasSchedule ? T.red : T.ink2,
          opacity: hasSchedule ? 0.9 : 0.55,
        }}
      >
        {label || '◷'}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={save} />
          <div
            style={{
              position: 'absolute', top: '100%', right: 0,
              marginTop: 8, zIndex: 50, minWidth: 270,
              background: T.paperDark, border: `1px solid ${T.rule}`,
              padding: '18px 20px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.ink2, marginBottom: 14 }}>
              Schedule
            </div>

            {/* Date row */}
            <div style={{ marginBottom: 14 }}>
              <span style={labelStyle}>Date</span>
              <input
                autoFocus
                type="date"
                value={dateVal}
                onChange={e => setDateVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
                style={{ ...inputBase, fontSize: 13 }}
              />
            </div>

            {/* Time row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 0 }}>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>Start</span>
                <input
                  type="time"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
                  style={inputBase}
                />
              </div>
              <span style={{ fontFamily: FONT_BODY, fontSize: 16, color: T.ink2, paddingBottom: 7, flexShrink: 0 }}>→</span>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>End</span>
                <input
                  type="time"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
                  style={inputBase}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.ruleSoft}` }}>
              {(time || dueDate)
                ? <button onClick={clear} style={{ background: 'none', border: 'none', fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink2, cursor: 'pointer', padding: 0 }}>Clear</button>
                : <span />
              }
              <button onClick={save} className="btn-action" style={{ background: T.red, border: 'none', fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.paper, cursor: 'pointer', padding: '7px 16px' }}>
                Save →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
