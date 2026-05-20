/* App — top-level wiring.

   global: React, ThemeCtx, DARK, INITIAL_ACCOUNTS, TODAY_ISO,
           FilmGrain, Halation, Artifacts, ScanLines, CinematicIntro,
           AppHeader, ConnectModal, DetailPanel,
           TodayView, WeekView, CalendarView, TasksView,
           TweaksPanel, useTweaks, TweakSection, TweakToggle, TweakColor, TweakButton,
           sourceOf */

const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "intro": false,
  "grain": true,
  "scanLines": true,
  "artifacts": true,
  "halation": true,
  "accent": "#C8391A"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = {
  '#C8391A': { redSoft: '#E0C0A8', dredSoft: '#3A1108' },
  '#A87000': { redSoft: '#D8C070', dredSoft: '#241600' },
  '#B33A55': { redSoft: '#E3BFC4', dredSoft: '#3A0E1A' },
  '#3A5C78': { redSoft: '#BFCEDB', dredSoft: '#1F3245' },
};
const ACCENT_HEXES = Object.keys(ACCENT_OPTIONS);

/* ── API helpers ────────────────────────────────────────────────── */
const api = {
  get:    (path)        => fetch(path).then(r => r.json()),
  post:   (path, body)  => fetch(path, { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  patch:  (path, body)  => fetch(path, { method: 'PATCH',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  del:    (path)        => fetch(path, { method: 'DELETE' }).then(r => r.json()),
};

function App() {
  const [intro, setIntro]                 = useState(() => TWEAK_DEFAULTS.intro);
  const [colorIn, setColorIn]             = useState(() => !TWEAK_DEFAULTS.intro);
  const [view, setView]                   = useState('today');
  const [items, setItems]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());
  const [accounts, setAccounts]           = useState(INITIAL_ACCOUNTS);
  const [selected, setSelected]           = useState(null);
  const [showConnect, setShowConnect]     = useState(false);
  const [focusedGoalId, setFocusedGoalId] = useState(null);

  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  /* ── Data loading ──────────────────────────────────────────── */
  const loadItems = async () => {
    const data = await api.get('/api/items');
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  /* ── Theme ─────────────────────────────────────────────────── */
  const accentHex    = ACCENT_OPTIONS[tweaks.accent] ? tweaks.accent : ACCENT_HEXES[0];
  const accentExtras = ACCENT_OPTIONS[accentHex];
  const T = useMemo(() => ({
    ...DARK,
    red:     accentHex,
    redSoft: accentExtras.dredSoft,
  }), [accentHex]);

  useEffect(() => {
    if (!tweaks.intro) { setIntro(false); setColorIn(true); }
  }, [tweaks.intro]);

  /* ── Ops ────────────────────────────────────────────────────── */
  const onToggle = (id) => {
    const item = items.find(it => it.id === id);
    if (!item) return;
    const next = !item.completed;
    /* Optimistic update */
    setItems(prev => prev.map(it => it.id === id ? { ...it, completed: next } : it));
    setSelected(s => s && s.id === id ? { ...s, completed: next } : s);
    api.patch(`/api/items/${id}`, { completed: next });
  };

  const onDelete = (id) => {
    /* Optimistic update */
    setItems(prev => prev.filter(it => it.id !== id));
    setSelected(s => s && s.id === id ? null : s);
    api.del(`/api/items/${id}`);
  };

  const onAddItem = async (partial) => {
    const fresh = await api.post('/api/items', {
      kind: 'task', scope: 'day', completed: false, source: 'bb',
      ...partial,
    });
    setItems(prev => [...prev, fresh]);
    setRecentlyAdded(s => { const n = new Set(s); n.add(fresh.id); return n; });
    setTimeout(() => {
      setRecentlyAdded(s => { const n = new Set(s); n.delete(fresh.id); return n; });
    }, 600);
    return fresh;
  };

  const onUpdateItem = (id, patch) => {
    /* Optimistic update */
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
    setSelected(s => s && s.id === id ? { ...s, ...patch } : s);
    api.patch(`/api/items/${id}`, patch);
  };

  const onAddTask = (partial) => {
    onAddItem({ kind: 'task', scope: 'day', source: 'bb', ...partial });
  };

  const onConnect = (provider) => {
    setAccounts(prev => prev.map(a => a.id === provider.id
      ? { ...a, connected: true, visible: true }
      : a));
  };

  const onDisconnect = (id) => {
    setAccounts(prev => prev.map(a => a.id === id
      ? { ...a, connected: false, visible: false }
      : a));
  };

  /* Esc closes panels */
  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return;
      if (showConnect) setShowConnect(false);
      else if (selected) setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showConnect, selected]);

  /* Filter items by visible/connected accounts */
  const visibleItems = useMemo(() => {
    const vis = new Set(accounts.filter(a => a.visible && a.connected).map(a => a.id));
    return items.filter(it => it.kind !== 'event' || vis.has(it.source));
  }, [items, accounts]);

  const viewProps = {
    items: visibleItems,
    today: TODAY_ISO,
    onSelect: setSelected,
    onToggle, onDelete, onAddItem, onUpdateItem, onAddTask,
    recentlyAdded,
    setView,
    selectedId: selected?.id,
    focusedGoalId, setFocusedGoalId,
  };

  return (
    <ThemeCtx.Provider value={T}>
      {intro && tweaks.intro && (
        <CinematicIntro onDone={() => { setIntro(false); setColorIn(true); }} />
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
        accounts={accounts} onConnect={onConnect} onDisconnect={onDisconnect}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <TweakColor
            label="Accent color"
            value={tweaks.accent}
            options={ACCENT_HEXES}
            onChange={v => setTweak('accent', v)}
          />
        </TweakSection>

        <TweakSection title="Chrome">
          <TweakToggle label="Film grain"        value={tweaks.grain}     onChange={v => setTweak('grain', v)} />
          <TweakToggle label="Scan lines"        value={tweaks.scanLines} onChange={v => setTweak('scanLines', v)} />
          <TweakToggle label="Random artifacts"  value={tweaks.artifacts} onChange={v => setTweak('artifacts', v)} />
          <TweakToggle label="Halation glow"     value={tweaks.halation}  onChange={v => setTweak('halation', v)} />
          <TweakToggle label="CRT intro on load" value={tweaks.intro}     onChange={v => setTweak('intro', v)} />
        </TweakSection>

        <TweakSection title="Demo">
          <TweakButton label="Connect a calendar →" onClick={() => setShowConnect(true)} />
          <TweakButton label="Replay intro →" onClick={() => { setIntro(true); setColorIn(false); }} />
        </TweakSection>
      </TweaksPanel>
    </ThemeCtx.Provider>
  );
}

Object.assign(window, { App });
