import React, { useState, useRef } from 'react';
import { useT, FONT_HEAD, FONT_BODY, TASK_COLORS } from '../theme';
import { Checkbox } from '../components/Checkbox';
import { TimeField } from '../components/TimeField';

const MAX_DEPTH = 4; // levels 0–4 = 5 total

function ColorPicker({ taskId, current, ops, onClose }) {
  const T = useT();
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div
        style={{
          position: 'absolute', top: '180%', left: '-4px',
          display: 'flex', gap: 6, alignItems: 'center',
          padding: '8px 10px',
          background: T.paperDark, border: `1px solid ${T.rule}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          zIndex: 50, whiteSpace: 'nowrap',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => { ops.setColor(taskId, null); onClose(); }}
          title="No color"
          style={{ width: 13, height: 13, borderRadius: '50%', background: 'transparent', border: `1.5px solid ${T.rule}`, cursor: 'pointer', padding: 0, outline: !current ? `2px solid ${T.ink}` : 'none', outlineOffset: 2 }}
        />
        {TASK_COLORS.map(c => (
          <button
            key={c.id}
            onClick={() => { ops.setColor(taskId, c.id); onClose(); }}
            title={c.label}
            style={{ width: 13, height: 13, borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer', padding: 0, outline: current === c.id ? `2px solid ${T.ink}` : 'none', outlineOffset: 2 }}
          />
        ))}
      </div>
    </>
  );
}

function TaskRow({ task, allTodos, ops, level }) {
  const T = useT();
  const [expanded,   setExpanded]   = useState(true);
  const [addingSub,  setAddingSub]  = useState(false);
  const [subTitle,   setSubTitle]   = useState('');
  const [showColors, setShowColors] = useState(false);
  const inputRef = useRef(null);

  const subtasks = allTodos.filter(t => t.parent_id === task.id);
  const accent   = task.color ? TASK_COLORS.find(c => c.id === task.color)?.hex : null;
  const subDone  = subtasks.filter(s => s.completed).length;
  const hasTree  = subtasks.length > 0 || addingSub;
  const isRoot   = level === 0;

  const openSub = () => { setAddingSub(v => !v); setSubTitle(''); if (!expanded) setExpanded(true); };

  const handleAddSub = async () => {
    if (!subTitle.trim()) { setAddingSub(false); return; }
    try { await ops.add(subTitle.trim(), null, null, task.id); } catch {}
    setSubTitle('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div>
      <div
        className={isRoot && accent ? 'task-row-colored' : 'task-row'}
        style={{
          display: 'flex', alignItems: 'center', gap: isRoot ? 9 : 7,
          padding: isRoot ? '10px 8px' : '7px 0',
          borderBottom: `1px solid ${T.ruleSoft}`,
          '--hover-bg': T.paperDark,
          position: 'relative',
          background: (isRoot && accent) ? accent : 'transparent',
        }}
      >

        {/* Expand / collapse */}
        <button
          onClick={() => hasTree && setExpanded(v => !v)}
          style={{
            background: 'none', border: 'none',
            color: hasTree ? (accent && isRoot ? 'rgba(255,255,255,0.6)' : T.ink2) : 'transparent',
            fontSize: 8, cursor: hasTree ? 'pointer' : 'default',
            padding: '0 4px', lineHeight: 1, flexShrink: 0,
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s', userSelect: 'none',
          }}
        >▶</button>

        {/* Color dot (root tasks only) */}
        {isRoot && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); setShowColors(v => !v); }}
              title="Set color"
              style={{ width: 10, height: 10, borderRadius: '50%', background: accent || 'transparent', border: `1.5px solid ${accent || T.rule}`, cursor: 'pointer', padding: 0 }}
            />
            {showColors && (
              <ColorPicker taskId={task.id} current={task.color} ops={ops} onClose={() => setShowColors(false)} />
            )}
          </div>
        )}

        <Checkbox id={task.id} completed={task.completed} onToggle={ops.toggle} />

        <span style={{
          flex: 1,
          fontFamily: FONT_HEAD, fontSize: isRoot ? 17 : 14,
          fontStyle: isRoot ? 'normal' : 'italic',
          color: isRoot && accent ? 'rgba(255,255,255,0.92)' : (task.completed ? T.ink2 : T.ink),
          textDecoration: task.completed ? 'line-through' : 'none',
          transition: 'color 0.2s',
        }}>
          {task.title}
        </span>

        {subtasks.length > 0 && (
          <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: isRoot && accent ? 'rgba(255,255,255,0.55)' : T.ink2, letterSpacing: '0.04em', flexShrink: 0 }}>
            {subDone}/{subtasks.length}
          </span>
        )}

        <TimeField taskId={task.id} time={task.scheduled_time} endTime={task.scheduled_end} ops={ops} />

        {level < MAX_DEPTH && (
          <button
            onClick={openSub}
            title="Add subtask"
            style={{ background: 'none', border: 'none', color: isRoot && accent ? 'rgba(255,255,255,0.6)' : T.ink2, fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: '0 3px', flexShrink: 0 }}
          >+</button>
        )}
        <button
          onClick={() => ops.remove(task.id)}
          style={{ background: 'none', border: 'none', color: isRoot && accent ? 'rgba(255,255,255,0.6)' : T.ink2, fontSize: 11, cursor: 'pointer', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
        >✕</button>
      </div>

      {/* Recursive children */}
      {expanded && hasTree && (
        <div style={{ marginLeft: 20, paddingLeft: 8, borderLeft: `1px solid ${T.ruleSoft}` }}>
          {subtasks.map(sub => (
            <TaskRow key={sub.id} task={sub} allTodos={allTodos} ops={ops} level={level + 1} />
          ))}

          {addingSub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 0', borderBottom: `1px solid ${T.ruleSoft}` }}>
              <div style={{ width: 14, height: 14, border: `1px solid ${T.rule}`, flexShrink: 0 }} />
              <input
                ref={inputRef}
                autoFocus
                value={subTitle}
                onChange={e => setSubTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSub();
                  if (e.key === 'Escape') { setAddingSub(false); setSubTitle(''); }
                }}
                onBlur={() => { if (!subTitle.trim()) setAddingSub(false); }}
                placeholder="Subtask…"
                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: `1px solid ${T.rule}`, fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 14, color: T.ink, outline: 'none', padding: '2px 0' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TasksView({ todos, ops }) {
  const T = useT();
  const [addingTask,   setAddingTask]   = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate,  setNewTaskDate]  = useState('');
  const [newTaskTime,  setNewTaskTime]  = useState('');

  const cancelAdd = () => { setAddingTask(false); setNewTaskTitle(''); setNewTaskDate(''); setNewTaskTime(''); };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) { cancelAdd(); return; }
    try { await ops.add(newTaskTitle.trim(), newTaskDate || null, newTaskTime || null); } catch {}
    setNewTaskTitle(''); setNewTaskDate(''); setNewTaskTime('');
    setAddingTask(false);
  };

  const roots = todos.filter(t => !t.parent_id);

  return (
    <div style={{ padding: '28px 40px 80px', maxWidth: 720, margin: '0 auto' }}>

      <div style={{ borderBottom: `1px solid ${T.rule}`, paddingBottom: 18, marginBottom: 44 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink2 }}>
          Production
        </div>
        <h1 style={{ fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 42, margin: '6px 0 0', color: T.ink, letterSpacing: '-0.025em', lineHeight: 1.04 }}>
          Director's <em style={{ color: T.red }}>Notes.</em>
        </h1>
      </div>

      {roots.length === 0 && !addingTask && (
        <div style={{ padding: '32px 24px', border: `1px dashed ${T.rule}`, color: T.ink2, fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 17, marginBottom: 32 }}>
          No tasks yet. Add one below.
        </div>
      )}

      {roots.map(task => (
        <TaskRow key={task.id} task={task} allTodos={todos} ops={ops} level={0} />
      ))}

      {addingTask ? (
        <div style={{ padding: '10px 0 14px', borderBottom: `1px solid ${T.rule}`, marginTop: 8 }}>
          <input
            autoFocus
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddTask();
              if (e.key === 'Escape') cancelAdd();
            }}
            onBlur={() => { if (!newTaskTitle.trim() && !newTaskDate && !newTaskTime) cancelAdd(); }}
            placeholder="New task…"
            style={{ background: 'transparent', border: 'none', fontFamily: FONT_HEAD, fontSize: 22, color: T.ink, outline: 'none', width: '100%', padding: '4px 0' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.ruleSoft}`, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.ink2 }}>Due</span>
            <input
              type="date"
              value={newTaskDate}
              onChange={e => setNewTaskDate(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') cancelAdd(); }}
              style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${T.rule}`, fontFamily: FONT_BODY, fontSize: 12, color: T.ink, outline: 'none', padding: '2px 4px', colorScheme: T.grainBlend === 'screen' ? 'dark' : 'light' }}
            />
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.ink2 }}>at</span>
            <input
              type="time"
              value={newTaskTime}
              onChange={e => setNewTaskTime(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') cancelAdd(); }}
              style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${T.rule}`, fontFamily: FONT_BODY, fontSize: 12, color: T.ink, outline: 'none', padding: '2px 4px', colorScheme: T.grainBlend === 'screen' ? 'dark' : 'light' }}
            />
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: T.ink2, marginLeft: 'auto' }}>↵ save · Esc cancel</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingTask(true)}
          style={{
            background: 'none', border: `1px solid ${T.rule}`,
            fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.06em',
            padding: '10px 20px', color: T.ink2, cursor: 'pointer',
            display: 'block', width: '100%', textAlign: 'left', marginTop: 12,
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >+ New task</button>
      )}
    </div>
  );
}
