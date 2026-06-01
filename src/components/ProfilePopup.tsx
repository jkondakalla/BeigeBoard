import React, { useEffect, useRef } from 'react'
import { FONT_HEAD, FONT_BODY, FONT_NUM } from '../lib/theme'

const AUTH_URL = (import.meta.env.VITE_JKOS_AUTH_URL as string | undefined)
  ?? 'https://auth.jkos.net'

function initials(name?: string, email?: string): string {
  const src = (name || email || '?').trim()
  const parts = src.split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || src[0].toUpperCase()
}

interface Props {
  user: any
  onLogout: () => void
  onClose: () => void
  T: any
}

export function ProfilePopup({ user, onLogout, onClose, T }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const sep = <div style={{ height: 1, background: T.rule, opacity: 0.6, margin: '0' }} />

  return (
    <div
      ref={wrapRef}
      role="menu"
      aria-label="Profile menu"
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 8px)',
        zIndex: 500,
        minWidth: 240,
        background: T.paper,
        border: `1px solid ${T.rule}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* User identity */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: T.yellow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 14, fontWeight: 600,
          color: T.paper,
          boxShadow: `0 0 12px ${T.yellow}55`,
        }}>
          {initials(user?.name, user?.email)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: T.ink, lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.name || 'User'}
          </div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 10, color: T.ink3,
            letterSpacing: '0.05em', marginTop: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.email}
          </div>
        </div>
      </div>

      {sep}

      {/* Actions */}
      <div style={{ padding: '6px 0' }}>
        <a
          href={`${AUTH_URL}/auth/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 16px', textDecoration: 'none',
            fontFamily: FONT_BODY, fontSize: 9.5, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: T.ink2,
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = T.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = T.ink2)}
        >
          <ManageIcon color={T.ink3} />
          Manage Account
        </a>
        <button
          onClick={() => { onClose(); onLogout() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '9px 16px', background: 'transparent', border: 'none',
            fontFamily: FONT_BODY, fontSize: 9.5, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: T.ink3, cursor: 'pointer',
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = T.red)}
          onMouseLeave={e => (e.currentTarget.style.color = T.ink3)}
        >
          <SignOutIcon color="currentColor" />
          Sign out
        </button>
      </div>
    </div>
  )
}

/* ── Inline SVG icons (no dependency on ui.tsx) ──────────────────────────── */

function ManageIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    </svg>
  )
}

function SignOutIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" />
      <path d="M10 12H21M18 9l3 3-3 3" />
    </svg>
  )
}
