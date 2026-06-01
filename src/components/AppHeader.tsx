import React, { useState, useEffect } from 'react'
import { useT, FONT_HEAD, FONT_BODY, FONT_NUM, localDate, sourceOf } from '../lib/theme'
import { TapeReel, TimeReadout } from './SharedComponents'
import { ProfilePopup } from './ProfilePopup'

const NAV_TABS = [
  { id: 'today',    label: 'Today',    sub: 'now' },
  { id: 'week',     label: 'Week',     sub: '7 days' },
  { id: 'calendar', label: 'Calendar', sub: 'month' },
  { id: 'tasks',    label: 'Tasks',    sub: 'workshop' },
]

function initials(name?: string, email?: string): string {
  const src = (name || email || '?').trim()
  const parts = src.split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || src[0].toUpperCase()
}

export function AppHeader({ view, setView, today, onConnectClick, onLogout, accounts, user }: any) {
  const T = useT()
  const d    = localDate(today)
  const week = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000) / 7)
  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const connected = accounts.filter((a: any) => a.connected).length

  useEffect(() => {
    const onScroll = (e: Event) => setScrolled(((e.target as any)?.scrollTop || 0) > 4)
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [])

  return (
    <header style={{
      background: T.paper,
      borderBottom: `1px solid ${T.rule}`,
      padding: '14px 32px 14px',
      flexShrink: 0,
      boxShadow: scrolled ? `0 2px 24px rgba(0,0,0,0.5)` : 'none',
      transition: 'box-shadow 0.25s',
      zIndex: 100,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gridTemplateRows: 'auto',
      gap: 18,
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <TapeReel size={28} color={T.yellow} spinning />
        <span style={{
          fontFamily: FONT_HEAD, fontWeight: 600, fontStyle: 'italic',
          fontSize: 22, color: T.yellow, letterSpacing: '-0.01em',
          textShadow: `0 0 16px ${T.yellow}44`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>BeigeBoard</span>
        <TapeCounter year={d.getFullYear()} week={week} />
      </div>

      <TapeDeck view={view} setView={setView} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
        {user?.role === 'guest' && (
          <span style={{
            fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: T.ink3,
            border: `1px solid ${T.rule}`,
            padding: '3px 8px',
            opacity: 0.7,
          }}>Guest</span>
        )}
        <TimeReadout />
        <span style={{ width: 1, height: 14, background: T.rule, opacity: 0.6 }} />
        <button
          onClick={onConnectClick}
          title="Manage connected calendars"
          style={{
            background: 'transparent', border: 'none',
            fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: T.ink2, cursor: 'pointer',
            padding: 0, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ display: 'inline-flex', gap: 3 }}>
            {accounts.slice(0, 4).map((a: any) => (
              <span key={a.id} style={{
                width: 7, height: 7, borderRadius: '50%',
                background: a.connected ? sourceOf(a.id).hex : T.ruleSoft,
                opacity: a.connected ? 0.95 : 0.3,
                boxShadow: a.connected ? `0 0 4px ${sourceOf(a.id).hex}80` : 'none',
              }} />
            ))}
          </span>
          {connected} sources
        </button>
        {user && (
          <>
            <span style={{ width: 1, height: 14, background: T.rule, opacity: 0.6 }} />
            {/* Profile avatar — opens quick-settings popup */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                aria-haspopup="true"
                title={user.name || user.email}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: T.yellow,
                  border: `1.5px solid ${profileOpen ? T.ink2 : T.rule}`,
                  boxShadow: profileOpen ? `0 0 10px ${T.yellow}66` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11, fontWeight: 600,
                  color: T.paper, cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                {initials(user.name, user.email)}
              </button>

              {profileOpen && (
                <ProfilePopup
                  user={user}
                  onLogout={onLogout}
                  onClose={() => setProfileOpen(false)}
                  T={T}
                />
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}

function TapeCounter({ year, week }: { year: number; week: number }) {
  const T = useT()
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 12px',
      background: 'rgba(0,0,0,0.45)',
      border: `1px solid ${T.rule}`,
      boxShadow: `inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.05), 0 1px 0 rgba(255,255,255,0.06)`,
    }}>
      <span style={{
        fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 12, color: T.ink2,
        letterSpacing: '0.04em',
      }}>{year}</span>
      <span style={{ width: 1, height: 12, background: T.rule, opacity: 0.6 }} />
      <span style={{
        fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 12, color: T.yellow,
        letterSpacing: '0.04em',
        textShadow: `0 0 10px ${T.yellow}99`,
      }}>W{String(week).padStart(2, '0')}</span>
    </div>
  )
}

function TapeDeck({ view, setView }: any) {
  const T = useT()
  return (
    <nav
      role="tablist"
      aria-label="Primary"
      style={{
        display: 'flex', gap: 0,
        background: 'rgba(0,0,0,0.55)',
        border: `1px solid ${T.rule}`,
        padding: 3,
        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {NAV_TABS.map(tab => (
        <TapeButton
          key={tab.id}
          tab={tab}
          active={view === tab.id}
          onClick={() => setView(tab.id)}
        />
      ))}
    </nav>
  )
}

function TapeButton({ tab, active, onClick }: any) {
  const T = useT()
  const [hover, setHover] = useState(false)

  const face = active ? '#1F1810' : '#15110A'
  const labelColor = active ? T.ink : T.ink2
  const labelShadow = active ? `0 0 14px ${T.red}66` : 'none'
  const press = active
    ? `inset 0 2px 4px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.04)`
    : `inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 2px rgba(0,0,0,0.18), 0 1px 0 rgba(0,0,0,0.18)`

  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: face,
        border: 'none',
        borderRight: `1px solid ${T.rule}80`,
        padding: '10px 22px 10px 28px',
        minWidth: 120,
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: press,
        transition: 'background 0.12s',
      }}
    >
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        width: 7, height: 7, borderRadius: '50%',
        background: active ? T.red : '#0A0806',
        boxShadow: active
          ? `0 0 8px ${T.red}cc, 0 0 14px ${T.red}55, inset 0 -1px 0 rgba(255,255,255,0.25)`
          : `inset 0 1px 1px rgba(0,0,0,0.4)`,
        transition: 'background 0.15s, box-shadow 0.15s',
      }} />

      <div style={{
        fontFamily: FONT_BODY, fontSize: 11, fontWeight: 500,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: labelColor, lineHeight: 1.1,
        textShadow: labelShadow,
        transition: 'color 0.15s, text-shadow 0.15s',
      }}>{tab.label}</div>
      <div style={{
        fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 10.5,
        color: T.ink3, marginTop: 2, lineHeight: 1,
        opacity: active ? 0.85 : 0.55,
      }}>{tab.sub}</div>
    </button>
  )
}
