import React, { useState } from 'react';
import { useT, FONT_HEAD, FONT_BODY, fmtFull } from '../theme';
import { Checkbox } from './Checkbox';
import { TimeField } from './TimeField';

export function DayPanel({ dayKey, todos, ops }) {
  const T = useT();
  const [newTitle, setNewTitle] = useState('');
  const dayTodos = todos.filter(t => t.due_date === dayKey);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await ops.add(newTitle, dayKey);
    setNewTitle('');
  };

  return (
    <div style={{ marginTop: 20, background: T.paperDark, border: `1px solid ${T.rule}`, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 22, margin: 0, color: T.ink }}>{fmtFull(dayKey)}</h3>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.ink2 }}>
          {dayTodos.filter(t => !t.completed).length} remaining · {dayTodos.filter(t => t.completed).length} done
        </span>
      </div>

      {dayTodos.length === 0 ? (
        <p style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 15, color: T.ink2, margin: '0 0 16px' }}>
          No tasks yet for this day.
        </p>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
          {dayTodos.map(task => (
            <li key={task.id} className="task-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: `1px solid ${T.ruleSoft}`, '--hover-bg': T.paper }}>
              <Checkbox id={task.id} completed={task.completed} onToggle={ops.toggle} />
              <span style={{ flex: 1, fontFamily: FONT_HEAD, fontSize: 16, color: task.completed ? T.ink2 : T.ink, textDecoration: task.completed ? 'line-through' : 'none' }}>
                {task.title}
              </span>
              <TimeField taskId={task.id} time={task.scheduled_time} endTime={task.scheduled_end} ops={ops} />
              <button onClick={() => ops.remove(task.id)} style={{ background: 'none', border: 'none', color: T.ink2, fontFamily: FONT_BODY, fontSize: 14, cursor: 'pointer', lineHeight: 1 }}>✕</button>
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
          style={{ flex: 1, background: T.paper, border: `1px solid ${T.rule}`, fontFamily: FONT_BODY, fontSize: 13, padding: '8px 12px', color: T.ink, outline: 'none' }}
        />
        <button onClick={handleAdd} className="btn-action" style={{ background: T.red, color: T.paper, border: 'none', fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 18px', cursor: 'pointer' }}>
          Add →
        </button>
      </div>
    </div>
  );
}
