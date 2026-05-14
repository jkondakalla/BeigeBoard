import React, { useState } from 'react';
import { useT, FONT_HEAD, FONT_BODY, FONT_NUM, localDate, getGreeting } from '../theme';
import { TaskQueue } from '../components/TaskQueue';
import { DayCalendar } from '../components/DayCalendar';
import { WeekStrip } from '../components/WeekStrip';

export function TodayView({ todos, ops, setView }) {
  const T = useT();
  const { today } = ops;
  const [selectedDay, setSelectedDay] = useState(today);

  const d          = localDate(today);
  const dateStr    = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const todayTasks = todos.filter(t => t.due_date === today && !t.completed);
  const overdue    = todos.filter(t => t.due_date && t.due_date < today && !t.completed);
  const doneTasks  = todos.filter(t => t.completed);
  const total      = todos.length;
  const pct        = total ? Math.round((doneTasks.length / total) * 100) : 0;

  const statusLine = overdue.length > 0
    ? `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue. The best time to clear the desk is now.`
    : todayTasks.length === 0
    ? 'Nothing scheduled for today. Assign tasks in the Calendar.'
    : `${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} on the desk. Keep the pace.`;

  return (
    <div style={{ padding: '32px 40px 64px', maxWidth: 1100, margin: '0 auto' }}>

      <div style={{ borderBottom: `1px solid ${T.rule}`, paddingBottom: 18, marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 8 }}>
          {dateStr}
        </div>
        <h1 style={{ fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 52, lineHeight: 1.02, margin: 0, letterSpacing: '-0.025em', color: T.ink }}>
          {getGreeting()} Today's <em style={{ fontStyle: 'italic', color: T.red }}>work.</em>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 36 }}>
        <div style={{
          background: overdue.length > 0 ? T.redSoft : T.paperDark,
          border: `1px solid ${overdue.length > 0 ? T.red : T.rule}`,
          borderRadius: 2, padding: '20px 24px',
        }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.red, marginBottom: 6 }}>
            {overdue.length > 0 ? 'Needs attention' : "You're on track"}
          </div>
          <p style={{ fontFamily: FONT_HEAD, fontSize: 18, lineHeight: 1.45, margin: 0, color: T.ink, fontStyle: overdue.length > 0 ? 'italic' : 'normal' }}>
            {statusLine}
          </p>
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.rule}`, borderRadius: 2, padding: '16px 20px' }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2, marginBottom: 4 }}>
            Overall progress
          </div>
          <div style={{ fontFamily: FONT_NUM, fontSize: 40, fontWeight: 500, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {total === 0 ? '—' : `${pct}%`}
          </div>
          <div style={{ marginTop: 14, height: 2, background: T.ruleSoft, position: 'relative' }}>
            <div className="progress-fill" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: T.yellow }} />
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink2, marginTop: 6 }}>
            {doneTasks.length} of {total} complete
          </div>
        </div>
      </div>

      {overdue.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontWeight: 500, fontSize: 24, margin: '0 0 12px', color: T.red, letterSpacing: '-0.015em' }}>
            Overdue
          </h2>
          <TaskQueue tasks={overdue} ops={ops} />
        </div>
      )}

      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontWeight: 500, fontSize: 28, margin: 0, color: T.ink, letterSpacing: '-0.015em' }}>
            On the desk today
          </h2>
          <button onClick={() => setView('tasks')} style={{ background: 'none', border: 'none', fontFamily: FONT_BODY, fontSize: 12, color: T.ink2, cursor: 'pointer', letterSpacing: '0.05em' }}>
            Manage tasks →
          </button>
        </div>
        {todayTasks.length === 0 ? (
          <div style={{ padding: '28px 24px', border: `1px dashed ${T.rule}`, color: T.ink2, fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 16 }}>
            Nothing scheduled for today. Click a day in the Calendar to add tasks.
          </div>
        ) : (
          <TaskQueue tasks={todayTasks} ops={ops} numbered />
        )}
      </div>

      <div style={{ marginBottom: 28 }}>
        <WeekStrip todos={todos} today={today} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
      </div>
      <DayCalendar todos={todos} ops={ops} dayKey={selectedDay} />
    </div>
  );
}
