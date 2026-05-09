import React from 'react';
import { useT, FONT_HEAD, FONT_BODY, FONT_NUM } from '../theme';
import { Checkbox } from './Checkbox';
import { TimeField } from './TimeField';

export function TaskQueue({ tasks, ops, numbered }) {
  const T = useT();
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {tasks.map((task, i) => (
        <li
          key={task.id}
          className="task-row"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 4px',
            borderTop: i === 0 ? `1px solid ${T.rule}` : 'none',
            borderBottom: `1px solid ${T.ruleSoft}`,
            '--hover-bg': T.paperDark,
          }}
        >
          {numbered && (
            <span style={{ fontFamily: FONT_NUM, fontSize: 28, color: T.red, fontStyle: 'italic', lineHeight: 1, flexShrink: 0, width: 44 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
          )}
          <Checkbox id={task.id} completed={task.completed} onToggle={ops.toggle} />
          <span style={{
            flex: 1, fontFamily: FONT_HEAD, fontSize: 17,
            color: task.completed ? T.ink2 : T.ink,
            textDecoration: task.completed ? 'line-through' : 'none',
            lineHeight: 1.3, transition: 'color 0.2s',
          }}>{task.title}</span>
          <TimeField taskId={task.id} time={task.scheduled_time} endTime={task.scheduled_end} ops={ops} />
          <button onClick={() => ops.remove(task.id)} style={{
            background: 'transparent', border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 11,
            padding: '4px 10px', color: T.ink2, cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s', flexShrink: 0,
          }}>Remove</button>
        </li>
      ))}
    </ol>
  );
}
