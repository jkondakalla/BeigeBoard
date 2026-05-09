import React, { useState } from 'react';
import { useT, FONT_BODY, FONT_NUM, fmtTime } from '../theme';

export function TimeField({ taskId, time, endTime, ops }) {
  const T = useT();
  const [open,  setOpen]  = useState(false);
  const [start, setStart] = useState(time || '');
  const [end,   setEnd]   = useState(endTime || '');

  const openPicker = () => { setStart(time || ''); setEnd(endTime || ''); setOpen(true); };
  const save  = () => { ops.setTime(taskId, start || null, end || null); setOpen(false); };
  const clear = () => { ops.setTime(taskId, null, null); setOpen(false); };

  const label = time
    ? endTime ? `${fmtTime(time)} – ${fmtTime(endTime)}` : fmtTime(time)
    : null;

  const colorScheme = T.grainBlend === 'screen' ? 'dark' : 'light';

  const timeInputStyle = {
    width: '100%', background: T.paper,
    border: 'none', borderBottom: `1px solid ${T.rule}`,
    fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 16,
    color: T.ink, padding: '6px 2px', outline: 'none',
    colorScheme,
  };

  const labelStyle = {
    fontFamily: FONT_BODY, fontSize: 9,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: T.ink2, marginBottom: 6, display: 'block',
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={openPicker}
        title={time ? 'Edit schedule' : 'Set time'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 5px', lineHeight: 1,
          fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.03em',
          color: time ? T.red : T.ink2,
          opacity: time ? 0.9 : 0.55,
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
            <div style={{ fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.ink2, marginBottom: 16 }}>
              Schedule
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>Start</span>
                <input
                  autoFocus
                  type="time"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
                  style={timeInputStyle}
                />
              </div>

              <span style={{ fontFamily: FONT_BODY, fontSize: 18, color: T.ink2, paddingBottom: 8, flexShrink: 0, lineHeight: 1 }}>→</span>

              <div style={{ flex: 1 }}>
                <span style={labelStyle}>End</span>
                <input
                  type="time"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
                  style={timeInputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.ruleSoft}` }}>
              {time
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
