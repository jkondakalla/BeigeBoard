/* App — top-level wiring.

   Header is now the full nav (tape-deck transport).
   No right-rail filmstrip.
   Three views in the nav: Today · Week · Tasks.
   Goals + Calendar still reachable from the workshop and as files,
   but not in the primary nav.

   global: React, ThemeCtx, LIGHT, DARK, ITEMS, INITIAL_ACCOUNTS, TODAY_ISO,
           FilmGrain, Halation, Artifacts, ScanLines, DarkToggle, CinematicIntro,
           AppHeader, ConnectModal, DetailPanel,
           TodayView, WeekView, TasksView,
           TweaksPanel, useTweaks, TweakSection, TweakToggle, TweakColor, TweakButton, TweakRadio,
           sourceOf */

const { useState, useEffect, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "intro": false,
  "grain": true,
  "scanLines": true,
  "artifacts": true,
  "halation": true,
  "accent": "#C8391A"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = {
  '#C8391A': { redSoft: '#E0C0A8', dredSoft: '#3A1108' }, // rust
  '#A87000': { redSoft: '#D8C070', dredSoft: '#241600' }, // amber
  '#B33A55': { redSoft: '#E3BFC4', dredSoft: '#3A0E1A' }, // rose
  '#3A5C78': { redSoft: '#BFCEDB', dredSoft: '#1F3245' }, // slate
};
const ACCENT_HEXES = Object.keys(ACCENT_OPTIONS);

function App() {
  const [dark, setDark]                       = useState(true);
  const [intro, setIntro]                     = useState(() => TWEAK_DEFAULTS.intro);
  const [colorIn, setColorIn]                 = useState(() => !TWEAK_DEFAULTS.intro);
  const [view, setView]                       = useState('today');
  const [items, setItems]                     = useState(ITEMS);
  const [recentlyAdded, setRecentlyAdded]     = useState(new Set());
  const [accounts, setAccounts]               = useState(INITIAL_ACCOUNTS);
  const [selected, setSelected]               = useState(null);
  const [showConnect, setShowConnect]         = useState(false);
  const [focusedGoalId, setFocusedGoalId]     = useState(null);

  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const baseTheme = dark ? DARK : LIGHT;
  const accentHex = ACCENT_OPTIONS[tweaks.accent] ? tweaks.accent : ACCENT_HEXES[0];
  const accentExtras = ACCENT_OPTIONS[accentHex];
  const T = useMemo(() => ({
    ...baseTheme,
    red: accentHex,
    redSoft: dark ? accentExtras.dredSoft : accentExtras.redSoft,
  }), [dark, accentHex]);

  useEffect(() => {
    if (!tweaks.intro) { setIntro(false); setColorIn(true); }
  }, [tweaks.intro]);

  /* Ops */
  const onToggle = useCallback((id) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, completed: !it.completed } : it));
    setSelected(s => s && s.id === id ? { ...s, completed: !s.completed } : s);
  }, []);

  const onDelete = useCallback((id) => {
    setItems(prev => prev.filter(it => it.id !== id));
    setSelected(s => s && s.id === id ? null : s);
  }, []);

  const onAddItem = useCallback((partial) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const fresh = {
      id, kind: 'task', scope: 'day',
      completed: false, source: 'bb',
      ...partial,
    };
    setItems(prev => [...prev, fresh]);
    /* Track for slide-in animation */
    setRecentlyAdded(s => { const n = new Set(s); n.add(id); return n; });
    setTimeout(() => {
      setRecentlyAdded(s => { const n = new Set(s); n.delete(id); return n; });
    }, 600);
    return fresh;
  }, []);

  /* Update an existing item with patch (used by drag-reschedule in WeekView). */
  const onUpdateItem = useCallback((id, patch) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
    setSelected(s => s && s.id === id ? { ...s, ...patch } : s);
  }, []);

  /* Quick-add task alias for Today's empty state */
  const onAddTask = useCallback((partial) => {
    onAddItem({ kind: 'task', scope: 'day', source: 'bb', ...partial });
  }, [onAddItem]);

  const onConnect = useCallback((provider) => {
    const newId = provider.id === 'google' ? 'work' : provider.id === 'outlook' ? 'outlook' : 'bb';
    setAccounts(prev => prev.map(a => a.id === newId ? { ...a, connected: true, visible: true } : a));
  }, []);

  const onDisconnect = useCallback((id) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, connected: false, visible: false } : a));
  }, []);

  /* Esc closes */
  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return;
      if (showConnect) setShowConnect(false);
      else if (selected) setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showConnect, selected]);

  /* Filter for visible accounts */
  const visibleItems = useMemo(() => {
    const visibleSources = new Set(accounts.filter(a => a.visible && a.connected).map(a => a.id));
    return items.filter(it => {
      if (it.kind === 'event') return visibleSources.has(it.source);
      return true;
    });
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
            {view === 'today' && <TodayView {...viewProps} />}
            {view === 'week'  && <WeekView  {...viewProps} />}
            {view === 'tasks' && <TasksView {...viewProps} />}
          </main>

          {selected && (
            <DetailPanel
              event={selected} items={items}
              onClose={() => setSelected(null)}
              onToggle={onToggle} onDelete={onDelete}
              setView={setView} setFocusedGoalId={setFocusedGoalId}
            />
          )}
        </div>
      </div>

      <ConnectModal
        open={showConnect} onClose={() => setShowConnect(false)}
        accounts={accounts} onConnect={onConnect} onDisconnect={onDisconnect}
      />

      <DarkToggle dark={dark} onToggle={() => setDark(d => !d)} />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <TweakColor
            label="Accent color"
            value={tweaks.accent}
            options={ACCENT_HEXES}
            onChange={v => setTweak('accent', v)}
          />
          <TweakRadio
            label="Theme"
            value={dark ? 'dark' : 'light'}
            options={['light', 'dark']}
            onChange={v => setDark(v === 'dark')}
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
