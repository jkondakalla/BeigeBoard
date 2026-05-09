import React, { useState } from 'react';
import { useT, FONT_BODY, FONT_NUM, FONT_HEAD, isoDate, localDate, fmtWeekday } from '../theme';

export function WeekStrip({ todos, today, selectedDay, setSelectedDay }) {
  const T = useT();
  const [flashDay, setFlashDay] = useState(null);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = localDate(today); d.setDate(d.getDate() + i); return isoDate(d);
  });

  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 10 }}>
        The week ahead
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: `1px solid ${T.rule}`, borderLeft: `1px solid ${T.rule}` }}>
        {days.map(dayKey => {
          const dayTodos   = todos.filter(t => t.due_date === dayKey);
          const remaining  = dayTodos.filter(t => !t.completed).length;
          const done       = dayTodos.filter(t => t.completed).length;
          const isToday    = dayKey === today;
          const isSelected = dayKey === selectedDay;
          const isFlash    = flashDay === dayKey;
          const d          = localDate(dayKey);

          return (
            <div
              key={dayKey}
              className="cal-cell"
              onClick={() => {
                if (!isSelected) {
                  setFlashDay(dayKey);
                  setTimeout(() => setFlashDay(null), 50);
                }
                setSelectedDay(dayKey);
              }}
              style={{
                borderRight: `1px solid ${T.rule}`,
                borderBottom: `1px solid ${T.rule}`,
                padding: '10px 10px 12px',
                background: isSelected ? T.redSoft : isToday ? T.paperDark : T.paper,
                minHeight: 80, cursor: 'pointer',
                outline: isSelected || isFlash ? `2px solid ${isFlash ? '#FF5533' : T.red}` : 'none',
                outlineOffset: -2,
                transition: isFlash ? 'none' : 'background 0.1s, outline-color 0.35s ease-out',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: isToday ? T.red : T.ink2 }}>
                  {fmtWeekday(dayKey)}
                </span>
                <span style={{ fontFamily: FONT_NUM, fontSize: 18, color: isSelected ? T.red : isToday ? T.red : T.ink, fontStyle: isSelected || isToday ? 'italic' : 'normal' }}>
                  {d.getDate()}
                </span>
              </div>
              {dayTodos.length === 0 ? (
                <div style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 12, color: T.ink2, marginTop: 8 }}>—</div>
              ) : (
                <>
                  <div style={{ marginTop: 10, height: 2, background: T.ruleSoft }}>
                    <div className="progress-fill" style={{ height: '100%', width: `${dayTodos.length ? (done / dayTodos.length) * 100 : 0}%`, background: isSelected || isToday ? T.red : T.ink2 }} />
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
