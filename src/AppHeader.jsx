/* AppHeader — single bar across the top.
   Left: BeigeBoard wordmark + tape counter (year · week)
   Center: cassette transport — TODAY · WEEK · TASKS
   Right: live time readout + connected-accounts indicator

   global: React, useT, DARK, FONT_HEAD, FONT_BODY, FONT_NUM,
           localDate, sourceOf,
           TapeReel, TimeReadout, RecLamp */
const { useState, useEffect } = React;

const NAV_TABS = [
  { id: 'today', label: 'Today', sub: 'now' },
  { id: 'week',  label: 'Week',  sub: '7 days' },
  { id: 'tasks', label: 'Tasks', sub: 'workshop' },
];

function AppHeader({ view, setView, today, onConnectClick, accounts }) {
  const T = useT();
  const d    = localDate(today);
  const week = Math.ceil(((d - new Date(d.getFullYear(), 0, 0)) / 86400000) / 7);
  const [scrolled, setScrolled] = useState(false);
  const connected = accounts.filter(a => a.connected).length;

  useEffect(() => {
    const onScroll = e => setScrolled((e.target?.scrollTop || 0) > 4);
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  return (
    <header style={{
      background: T.paper,
      borderBottom: `1px solid ${T.rule}`,
      padding: '14px 32px 14px',
      flexShrink: 0,
      boxShadow: scrolled ? `0 2px 24px rgba(0,0,0,${T === DARK ? 0.5 : 0.08})` : 'none',
      transition: 'box-shadow 0.25s',
      zIndex: 100,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gridTemplateRows: 'auto',
      gap: 18,
      alignItems: 'center',
    }}>
      {/* Left: tape reels + wordmark + tape counter */}
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

      {/* Center: tape-deck transport */}
      <TapeDeck view={view} setView={setView} />

      {/* Right: live readout + connected indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
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
            {accounts.slice(0, 4).map(a => (
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
      </div>
    </header>
  );
}

/* ── Tape counter — small mechanical readout ──────────────────────── */
function TapeCounter({ year, week }) {
  const T = useT();
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 12px',
      background: 'rgba(0,0,0,0.45)',
      border: `1px solid ${T.rule}`,
      boxShadow: `
        inset 0 2px 4px rgba(0,0,0,0.5),
        inset 0 -1px 0 rgba(255,255,255,0.05),
        0 1px 0 rgba(255,255,255,0.06)
      `,
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
  );
}

/* ── Tape-deck transport — the navigation ─────────────────────────── */
function TapeDeck({ view, setView }) {
  const T = useT();
  return (
    <nav
      role="tablist"
      aria-label="Primary"
      style={{
        display: 'flex', gap: 0,
        background: T === DARK ? 'rgba(0,0,0,0.55)' : '#D9C698',
        border: `1px solid ${T.rule}`,
        padding: 3,
        boxShadow: `
          inset 0 2px 4px rgba(0,0,0,0.35),
          inset 0 -1px 0 rgba(255,255,255,0.06),
          0 1px 0 rgba(255,255,255,0.06)
        `,
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
  );
}

function TapeButton({ tab, active, onClick }) {
  const T = useT();
  const [hover, setHover] = useState(false);

  const face = active
    ? (T === DARK ? '#1F1810' : '#C8AE88')
    : (T === DARK ? '#15110A' : '#E4D5B0');
  const labelColor = active ? T.ink : T.ink2;
  const labelShadow = active ? `0 0 14px ${T.red}66` : 'none';

  const press = active
    ? `inset 0 2px 4px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.04)`
    : `inset 0 1px 0 rgba(255,255,255,${T === DARK ? 0.04 : 0.32}), inset 0 -2px 2px rgba(0,0,0,0.18), 0 1px 0 rgba(0,0,0,0.18)`;

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
      {/* LED indicator */}
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        width: 7, height: 7, borderRadius: '50%',
        background: active ? T.red : (T === DARK ? '#0A0806' : '#A89070'),
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
  );
}

Object.assign(window, { AppHeader, NAV_TABS });
