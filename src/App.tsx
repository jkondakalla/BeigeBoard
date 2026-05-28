import React, { useState, useEffect, useMemo } from 'react'
import './app.css'

import { ThemeCtx, DARK, FONT_HEAD, FONT_BODY, weekStart } from './lib/theme'
import { TODAY_ISO, INITIAL_ACCOUNTS } from './lib/seed'
import { DragProvider } from './providers/DragProvider'

import { FilmGrain, Halation, Artifacts, ScanLines, CinematicIntro } from './components/Overlays'
import { AppHeader } from './components/AppHeader'
import { ConnectModal } from './components/ConnectModal'
import { DetailPanel } from './components/DetailPanel'
import {
  TweaksPanel, useTweaks,
  TweakSection, TweakToggle, TweakColor, TweakButton,
} from './components/TweaksPanel'

import { TodayView } from './views/TodayView'
import { WeekView } from './views/WeekView'
import { CalendarView } from './views/CalendarView'
import { TasksView } from './views/TasksView'

const DEFAULT_API_URL  = import.meta.env.VITE_API_URL ?? ''
const JKOS_AUTH_URL    = import.meta.env.VITE_JKOS_AUTH_URL ?? 'https://auth.jkos.net'

/* ── Token-refresh-aware fetch ─────────────────────────────────────────── */
let refreshing: Promise<boolean> | null = null

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const opts = { credentials: 'include' as const, ...init }
  const r = await fetch(input, opts)
  if (r.status !== 401) return r

  let data: any
  try { data = await r.clone().json() } catch { return r }
  if (data?.code !== 'TOKEN_EXPIRED') return r

  /* Deduplicate concurrent refresh attempts — calls jkos-auth service */
  if (!refreshing) {
    refreshing = fetch(`${JKOS_AUTH_URL}/auth/refresh`, {
      method: 'POST', credentials: 'include',
    }).then(res => res.ok).finally(() => { refreshing = null })
  }

  const ok = await refreshing
  if (!ok) return r
  return fetch(input, opts)
}

/* ── Tweaks defaults ───────────────────────────────────────────────────── */
const TWEAK_DEFAULTS = {
  intro:     false,
  grain:     true,
  scanLines: true,
  artifacts: true,
  halation:  true,
  accent:    '#C8391A',
}

const ACCENT_OPTIONS: Record<string, { redSoft: string; dredSoft: string }> = {
  '#C8391A': { redSoft: '#E0C0A8', dredSoft: '#3A1108' },
  '#A87000': { redSoft: '#D8C070', dredSoft: '#241600' },
  '#B33A55': { redSoft: '#E3BFC4', dredSoft: '#3A0E1A' },
  '#3A5C78': { redSoft: '#BFCEDB', dredSoft: '#1F3245' },
}
const ACCENT_HEXES = Object.keys(ACCENT_OPTIONS)

/* ── Main app ──────────────────────────────────────────────────────────── */
export default function App({ apiUrl = DEFAULT_API_URL }: { apiUrl?: string }) {
  /* user: null = loading, false = not authed, object = authenticated */
  const [user, setUser] = useState<any>(null)

  const toAuthPortal = () => {
    window.location.href = `${JKOS_AUTH_URL}/auth/login?redirect_to=${encodeURIComponent(window.location.href)}`
  }

  const checkAuth = async () => {
    try {
      const r = await apiFetch(`${apiUrl}/api/auth/me`)
      if (r.ok) {
        const d = await r.json()
        setUser(d.user)
      } else {
        toAuthPortal()
      }
    } catch { toAuthPortal() }
  }

  useEffect(() => { checkAuth() }, [])

  const handleUnauth = () => toAuthPortal()

  /* All API calls go through apiFetch which handles token refresh */
  const api = {
    get: (path: string) =>
      apiFetch(`${apiUrl}${path}`).then(r => {
        if (r.status === 401) { handleUnauth(); throw new Error('Unauthorized') }
        return r.json()
      }),
    post: (path: string, body: any) =>
      apiFetch(`${apiUrl}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }).then(r => {
        if (r.status === 401) { handleUnauth(); throw new Error('Unauthorized') }
        return r.json()
      }),
    patch: (path: string, body: any) =>
      apiFetch(`${apiUrl}${path}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }).then(r => {
        if (r.status === 401) { handleUnauth(); throw new Error('Unauthorized') }
        return r.json()
      }),
    del: (path: string) =>
      apiFetch(`${apiUrl}${path}`, { method: 'DELETE' }).then(r => {
        if (r.status === 401) { handleUnauth(); throw new Error('Unauthorized') }
        return r.json()
      }),
  }

  const handleLogout = async () => {
    try {
      await fetch(`${JKOS_AUTH_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch { /* best effort */ }
    window.location.href = `${JKOS_AUTH_URL}/auth/login`
  }

  const [intro, setIntro]                 = useState(() => TWEAK_DEFAULTS.intro)
  const [colorIn, setColorIn]             = useState(() => !TWEAK_DEFAULTS.intro)
  const [view, setView]                   = useState('today')
  const [items, setItems]                 = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [recentlyAdded, setRecentlyAdded] = useState(new Set<number>())
  const [accounts, setAccounts]           = useState(INITIAL_ACCOUNTS)
  const [selected, setSelected]           = useState<any>(null)
  const [showConnect, setShowConnect]     = useState(false)
  const [focusedGoalId, setFocusedGoalId] = useState<number | null>(null)
  const [weekJumpDate, setWeekJumpDate]   = useState<string | null>(null)

  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS)

  const loadItems = async () => {
    try {
      const data = await api.get('/api/items')
      if (Array.isArray(data)) setItems(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (user) loadItems() }, [user])

  useEffect(() => {
    if (!user) return
    ;['google', 'outlook', 'icloud'].forEach(id => {
      api.get(`/api/auth/${id}/status`).then((status: any) => {
        if (status.connected) {
          setAccounts(prev => prev.map((a: any) =>
            a.id === id ? { ...a, connected: true, visible: true, email: status.email } : a
          ))
        }
      }).catch(() => {})
    })
  }, [user])

  const accentHex    = ACCENT_OPTIONS[tweaks.accent] ? tweaks.accent : ACCENT_HEXES[0]
  const accentExtras = ACCENT_OPTIONS[accentHex]
  const T = useMemo(() => ({
    ...DARK,
    red:     accentHex,
    redSoft: accentExtras.dredSoft,
  }), [accentHex])

  useEffect(() => {
    if (!tweaks.intro) { setIntro(false); setColorIn(true) }
  }, [tweaks.intro])

  const onToggle = (id: number) => {
    const item = items.find(it => it.id === id)
    if (!item) return
    const next = !item.completed
    setItems(prev => prev.map(it => it.id === id ? { ...it, completed: next } : it))
    setSelected((s: any) => s && s.id === id ? { ...s, completed: next } : s)
    api.patch(`/api/items/${id}`, { completed: next })
  }

  const onDelete = (id: number) => {
    setItems(prev => prev.filter(it => it.id !== id))
    setSelected((s: any) => s && s.id === id ? null : s)
    api.del(`/api/items/${id}`)
  }

  const onAddItem = async (partial: any) => {
    const fresh = await api.post('/api/items', {
      kind: 'task', scope: 'day', completed: false, source: 'bb', ...partial,
    })
    setItems(prev => [...prev, fresh])
    setRecentlyAdded(s => { const n = new Set(s); n.add(fresh.id); return n })
    setTimeout(() => {
      setRecentlyAdded(s => { const n = new Set(s); n.delete(fresh.id); return n })
    }, 600)
    return fresh
  }

  const onUpdateItem = (id: number, patch: any) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
    setSelected((s: any) => s && s.id === id ? { ...s, ...patch } : s)
    api.patch(`/api/items/${id}`, patch)
  }

  const onAddTask = (partial: any) => onAddItem({ kind: 'task', scope: 'day', source: 'bb', ...partial })

  const onConnect = (provider: any) => {
    setAccounts(prev => prev.map((a: any) => a.id === provider.id
      ? { ...a, connected: true, visible: true, email: provider.email || a.email }
      : a))
    loadItems()
  }

  const onDisconnect = (id: string) => {
    setAccounts(prev => prev.map((a: any) => a.id === id
      ? { ...a, connected: false, visible: false, email: '' }
      : a))
    const routes: Record<string, string> = {
      google: '/api/auth/google', outlook: '/api/auth/outlook', icloud: '/api/auth/icloud',
    }
    if (routes[id]) api.del(routes[id]).then(loadItems).catch(console.error)
  }

  const onSync = (id: string) => {
    const routes: Record<string, string> = {
      google: '/api/calendar/google/sync', outlook: '/api/calendar/outlook/sync', icloud: '/api/calendar/icloud/sync',
    }
    if (routes[id]) api.post(routes[id], {}).then(loadItems).catch(console.error)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (showConnect) setShowConnect(false)
      else if (selected) setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showConnect, selected])

  const visibleItems = useMemo(() => {
    const vis = new Set(accounts.filter((a: any) => a.visible && a.connected).map((a: any) => a.id))
    return items.filter(it => it.kind !== 'event' || vis.has(it.source))
  }, [items, accounts])

  const readonly = user?.role === 'guest'

  const viewProps = {
    items: visibleItems,
    today: TODAY_ISO,
    onSelect: setSelected,
    onToggle, onDelete, onAddItem, onUpdateItem, onAddTask,
    recentlyAdded,
    setView,
    selectedId: selected?.id,
    focusedGoalId, setFocusedGoalId,
    weekJumpDate,
    onWeekJump: (iso: string) => { setWeekJumpDate(weekStart(iso)); setView('week') },
    readonly,
  }

  /* Loading splash */
  if (user === null) {
    return <div style={{ position: 'fixed', inset: 0, background: DARK.paper }} />
  }

  /* Not authenticated — redirect to jkOS auth portal */
  if (user === false) {
    toAuthPortal()
    return <div style={{ position: 'fixed', inset: 0, background: DARK.paper }} />
  }

  return (
    <ThemeCtx.Provider value={T}>
    <DragProvider>
      {intro && tweaks.intro && (
        <CinematicIntro onDone={() => { setIntro(false); setColorIn(true) }} />
      )}

      {tweaks.halation && <Halation />}
      {tweaks.grain     && <FilmGrain />}
      {tweaks.scanLines && <ScanLines />}
      {tweaks.artifacts && <Artifacts />}

      <div style={{
        position: 'fixed', inset: 0,
        filter: colorIn ? 'saturate(1) brightness(1)' : 'saturate(0.04) brightness(0.08)',
        transition: colorIn ? 'filter 1.4s ease-out' : 'none',
        background: T.paper,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          flex: 1, minHeight: 0, position: 'relative',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr)',
          gridTemplateColumns: selected ? '1fr 340px' : '1fr',
          background: T.paper,
          color: T.ink,
          filter: 'url(#halation)',
        }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <AppHeader
              view={view} setView={setView}
              today={TODAY_ISO}
              accounts={accounts}
              onConnectClick={() => setShowConnect(true)}
              onLogout={handleLogout}
              user={user}
            />
          </div>

          <main
            key={view}
            className={view === 'tasks' ? undefined : 'view-enter'}
            style={{ overflow: 'hidden', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.4 }}>
                Loading…
              </div>
            ) : (
              <>
                {view === 'today'    && <TodayView    {...viewProps} />}
                {view === 'week'     && <WeekView     {...viewProps} />}
                {view === 'calendar' && <CalendarView {...viewProps} />}
                {view === 'tasks'    && <TasksView    {...viewProps} />}
              </>
            )}
          </main>

          {selected && (
            <DetailPanel
              event={selected} items={items}
              onClose={() => setSelected(null)}
              onToggle={onToggle} onDelete={onDelete} onUpdateItem={onUpdateItem}
              setView={setView} setFocusedGoalId={setFocusedGoalId}
            />
          )}
        </div>
      </div>

      <ConnectModal
        open={showConnect} onClose={() => setShowConnect(false)}
        accounts={accounts} onConnect={onConnect} onDisconnect={onDisconnect} onSync={onSync}
        apiUrl={apiUrl}
      />

      <TweaksPanel>
        <TweakSection label="Accent">
          <TweakColor
            label="Accent color"
            value={tweaks.accent}
            options={ACCENT_HEXES}
            onChange={(v: string) => setTweak('accent', v)}
          />
        </TweakSection>

        <TweakSection label="Chrome">
          <TweakToggle label="Film grain"        value={tweaks.grain}     onChange={(v: boolean) => setTweak('grain', v)} />
          <TweakToggle label="Scan lines"        value={tweaks.scanLines} onChange={(v: boolean) => setTweak('scanLines', v)} />
          <TweakToggle label="Random artifacts"  value={tweaks.artifacts} onChange={(v: boolean) => setTweak('artifacts', v)} />
          <TweakToggle label="Halation glow"     value={tweaks.halation}  onChange={(v: boolean) => setTweak('halation', v)} />
          <TweakToggle label="CRT intro on load" value={tweaks.intro}     onChange={(v: boolean) => setTweak('intro', v)} />
        </TweakSection>

        <TweakSection label="Demo">
          <TweakButton label="Connect a calendar →" onClick={() => setShowConnect(true)} />
          <TweakButton label="Replay intro →" onClick={() => { setIntro(true); setColorIn(false) }} />
        </TweakSection>
      </TweaksPanel>
    </DragProvider>
    </ThemeCtx.Provider>
  )
}
