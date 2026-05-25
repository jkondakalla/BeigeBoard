import React, { useState } from 'react'
import { useT, FONT_HEAD, FONT_BODY, FONT_NUM, localDate, fmtTime, halate, getGreeting } from '../lib/theme'
import { getAncestors, getAccent } from '../lib/seed'
import { Eyebrow, Checkbox, Plate, TapeReel, RecLamp } from '../components/SharedComponents'

export function TodayView({ items, today, onSelect, onToggle, onAddTask, setView, selectedId, recentlyAdded }: any) {
  const T = useT()
  const d = localDate(today)
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const allTasks   = items.filter((it: any) => it.kind === 'task')
  const todayAll   = allTasks.filter((t: any) => t.due_date === today)
  const active     = todayAll.filter((t: any) => !t.completed).sort((a: any, b: any) => (a.scheduled_time || 'zz').localeCompare(b.scheduled_time || 'zz'))
  const done       = todayAll.filter((t: any) =>  t.completed)
  const overdue    = allTasks.filter((t: any) => t.due_date && t.due_date < today && !t.completed)
  const next       = active[0]
  const rest       = active.slice(1)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.paper }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 36px 80px' }}>

        <div style={{ marginBottom: 36 }}>
          <Eyebrow style={{ marginBottom: 6 }}>{dateStr}</Eyebrow>
          <h1 style={{
            fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 32, lineHeight: 1,
            margin: 0, letterSpacing: '-0.025em', color: T.ink,
            textShadow: halate(T.yellow, 'soft'),
          }}>{getGreeting()}</h1>
        </div>

        {next ? (
          <NextCard item={next} items={items} onSelect={onSelect} onToggle={onToggle} />
        ) : todayAll.length === 0 && overdue.length === 0 ? (
          <EmptyDay onAdd={onAddTask} today={today} />
        ) : (
          <ClearedDay onceMore={() => setView('tasks')} />
        )}

        {overdue.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <Eyebrow color={T.red} style={{ marginBottom: 10, textShadow: halate(T.red, 'low') }}>{overdue.length} overdue</Eyebrow>
              <button onClick={() => setView('week')} style={tinyLink(T)}>see the week →</button>
            </div>
            <Strip tasks={overdue} items={items} onSelect={onSelect} onToggle={onToggle} muted={false} recentlyAdded={recentlyAdded} />
          </section>
        )}

        {rest.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <Eyebrow>After that · {rest.length} more</Eyebrow>
              <button onClick={() => setView('week')} style={tinyLink(T)}>the week →</button>
            </div>
            <Strip tasks={rest} items={items} onSelect={onSelect} onToggle={onToggle} recentlyAdded={recentlyAdded} />
          </section>
        )}

        {done.length > 0 && (
          <details style={{ marginTop: 36, opacity: 0.7 }}>
            <summary style={{
              fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: T.ink2, cursor: 'pointer',
              padding: '4px 0',
            }}>{done.length} done today</summary>
            <div style={{ marginTop: 10 }}>
              <Strip tasks={done} items={items} onSelect={onSelect} onToggle={onToggle} muted recentlyAdded={recentlyAdded} />
            </div>
          </details>
        )}

        <footer style={{
          marginTop: 56,
          paddingTop: 18,
          borderTop: `1px solid ${T.ruleSoft}`,
          display: 'flex', justifyContent: 'space-between', gap: 12,
        }}>
          <button onClick={() => setView('week')} style={tinyLink(T)}>open the week →</button>
          <button onClick={() => setView('tasks')} style={tinyLink(T)}>open the workshop →</button>
        </footer>
      </div>
    </div>
  )
}

function NextCard({ item, items, onSelect, onToggle }: any) {
  const T = useT()
  const accent = getAccent(item, items) || T.red
  const ancestors = getAncestors(item, items)

  return (
    <Plate accent={accent} style={{ padding: '28px 32px 30px 44px', cursor: 'pointer' }}>
      <article onClick={() => onSelect(item)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RecLamp size={7} label="Next" />
            <TapeReel size={18} color={accent} spinning />
          </div>
          {item.scheduled_time && (
            <span style={{
              fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 14, color: accent,
              textShadow: `0 0 10px ${accent}99`,
              letterSpacing: '0.04em',
            }}>
              {fmtTime(item.scheduled_time)}{item.scheduled_end ? ` – ${fmtTime(item.scheduled_end)}` : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <Checkbox id={item.id} completed={item.completed} onToggle={onToggle} color={accent} size={20} />
          <h2 style={{
            flex: 1, fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 36,
            margin: 0, lineHeight: 1.1, letterSpacing: '-0.025em', color: T.ink,
            textDecoration: item.completed ? 'line-through' : 'none',
            textShadow: `0 0 24px ${accent}22`,
          }}>{item.title}</h2>
        </div>

        {ancestors.length > 0 && (
          <div style={{
            marginTop: 18, paddingLeft: 38,
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            <span style={{ width: 5, height: 5, background: accent, boxShadow: `0 0 6px ${accent}cc` }} />
            <span style={{
              fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 14, color: T.ink2,
              lineHeight: 1.3,
            }}>
              {ancestors.slice().reverse().map((a: any) => a.title).join('  ›  ')}
            </span>
          </div>
        )}
      </article>
    </Plate>
  )
}

function EmptyDay({ onAdd, today }: any) {
  const T = useT()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const handle = () => {
    if (!draft.trim()) { setAdding(false); return }
    onAdd({ title: draft.trim(), due_date: today })
    setDraft(''); setAdding(false)
  }

  const handleAI = async () => {
    if (!draft.trim() || aiLoading) return
    setAiLoading(true)
    try {
      const r = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: draft.trim() }),
      })
      if (!r.ok) throw new Error()
      const parsed = await r.json()
      onAdd({ due_date: today, ...parsed })
      setDraft(''); setAdding(false)
    } catch {
      onAdd({ title: draft.trim(), due_date: today })
      setDraft(''); setAdding(false)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <article style={{
      padding: '40px 36px',
      border: `1px dashed ${T.rule}`,
      background: T.paperDark,
    }}>
      <Eyebrow style={{ marginBottom: 6 }}>The day is open.</Eyebrow>
      <p style={{
        fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 20,
        color: T.ink, margin: '0 0 20px', lineHeight: 1.3,
      }}>Nothing has been written down yet.</p>

      {adding ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <input
            autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handle()
              if (e.key === 'Escape') { setAdding(false); setDraft('') }
            }}
            placeholder="Describe a task — or let AI parse it…"
            style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: `1px solid ${T.rule}`,
              fontFamily: FONT_HEAD, fontSize: 22, color: T.ink, outline: 'none',
              padding: '6px 2px',
            }}
          />
          <button
            onClick={handleAI}
            disabled={aiLoading}
            className="btn-action"
            title="Let AI parse this into a structured task"
            style={{
              background: aiLoading ? T.paperDark : 'transparent',
              color: T.yellow, border: `1px solid ${T.yellow}55`,
              fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', padding: '10px 14px',
              cursor: aiLoading ? 'wait' : 'pointer', opacity: aiLoading ? 0.6 : 1,
            }}
          >{aiLoading ? '…' : '✦ AI'}</button>
          <button onClick={handle} className="btn-action" style={{
            background: T.red, color: T.paper, border: 'none',
            fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.14em',
            textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer',
          }}>Add →</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="btn-action"
          style={{
            background: T.ink, color: T.paper, border: 'none',
            fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.14em',
            textTransform: 'uppercase', padding: '12px 22px', cursor: 'pointer',
          }}
        >+ Write something down</button>
      )}
    </article>
  )
}

function ClearedDay({ onceMore }: any) {
  const T = useT()
  return (
    <article style={{
      padding: '40px 36px',
      border: `1px solid ${T.rule}`,
      background: T.paperDark,
    }}>
      <Eyebrow style={{ marginBottom: 6, color: T.yellow }}>Today is clear.</Eyebrow>
      <p style={{
        fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 22,
        color: T.ink, margin: '0 0 16px', lineHeight: 1.3,
      }}>Every task on today's list is done.</p>
      <button
        onClick={onceMore}
        style={{
          background: 'transparent', border: `1px solid ${T.rule}`,
          fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: T.ink, cursor: 'pointer',
          padding: '10px 18px',
        }}
      >Plan something for tomorrow →</button>
    </article>
  )
}

function Strip({ tasks, items, onSelect, onToggle, muted, recentlyAdded }: any) {
  const T = useT()
  return (
    <ol style={{
      listStyle: 'none', padding: 0, margin: 0,
      borderTop: `1px solid ${T.ruleSoft}`,
      opacity: muted ? 0.55 : 1,
    }}>
      {tasks.map((task: any) => {
        const accent = getAccent(task, items) || T.ink2
        const ancestors = getAncestors(task, items)
        const yearGoal = ancestors[ancestors.length - 1]
        const isNew = recentlyAdded?.has(task.id)

        return (
          <li
            key={task.id}
            className={`task-row${isNew ? ' item-in' : ''}`}
            onClick={() => onSelect(task)}
            style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto',
              gap: 12, alignItems: 'center',
              padding: '11px 6px',
              borderBottom: `1px solid ${T.ruleSoft}`,
              cursor: 'pointer',
              '--hover-bg': T.paperDark,
            } as any}
          >
            <Checkbox id={task.id} completed={task.completed} onToggle={onToggle} color={accent} size={14} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: FONT_HEAD, fontSize: 15.5,
                color: task.completed ? T.ink2 : T.ink,
                textDecoration: task.completed ? 'line-through' : 'none',
                lineHeight: 1.25,
              }}>{task.title}</div>
              {yearGoal && (
                <div style={{
                  fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11.5,
                  color: T.ink2, marginTop: 2, lineHeight: 1.2,
                }}>{yearGoal.title}</div>
              )}
            </div>
            {task.scheduled_time && (
              <span style={{
                fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 12,
                color: accent, whiteSpace: 'nowrap',
              }}>{fmtTime(task.scheduled_time)}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function tinyLink(T: any): React.CSSProperties {
  return {
    background: 'transparent', border: 'none',
    fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 12,
    color: T.ink2, cursor: 'pointer', padding: 0,
    textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3,
  }
}
