/* Small shared atoms — extended with cassette-futurism flourishes.
   global: React, useT, FONT_HEAD, FONT_BODY, FONT_NUM, DARK */
const { useState, useEffect, useRef } = React;

/* ── Checkbox ────────────────────────────────────────────────── */
function Checkbox({ id, completed, onToggle, color, size = 15 }) {
  const T = useT();
  const [pop, setPop] = useState(false);
  const handle = e => {
    e?.stopPropagation();
    if (!completed) { setPop(true); setTimeout(() => setPop(false), 260); }
    onToggle?.(id, completed);
  };
  const accent = color || T.red;
  return (
    <button
      onClick={handle}
      className={pop ? 'check-pop' : ''}
      style={{
        width: size, height: size,
        border: `1px solid ${completed ? accent : T.rule}`,
        background: completed ? accent : 'transparent',
        cursor: 'pointer', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: T.paper, fontSize: Math.round(size * 0.6), lineHeight: 1,
        transition: 'background 0.15s, border-color 0.15s',
        padding: 0,
        boxShadow: completed ? `0 0 8px ${accent}66` : 'none',
      }}
    >{completed ? '✓' : ''}</button>
  );
}

/* ── Eyebrow ────────────────────────────────────────────────── */
function Eyebrow({ children, color, style }) {
  const T = useT();
  return (
    <div style={{
      fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: color || T.ink2,
      ...style,
    }}>{children}</div>
  );
}

/* ── VU Meter — LED-segment progress bar ────────────────────── */
/* The cassette signature. Renders N segments, lights up the
   first `pct%` in amber, the rest are dim. Optionally peak-red
   on the rightmost lit segments. */
function VUMeter({ pct = 0, color, segments = 20, height = 8, label, peak = true }) {
  const T = useT();
  const accent = color || T.yellow;
  const lit = Math.round((pct / 100) * segments);
  /* Top quarter of lit segments goes red ("hot signal") */
  const peakStart = peak ? Math.max(0, segments - Math.ceil(segments * 0.2)) : segments;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, display: 'flex', gap: 2,
        padding: 3,
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${T.rule}`,
        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.06)`,
      }}>
        {Array.from({ length: segments }, (_, i) => {
          const isLit = i < lit;
          const isHot = i >= peakStart && isLit;
          const ledColor = isLit ? (isHot ? T.red : accent) : 'rgba(0,0,0,0.5)';
          const glow = isLit ? `0 0 4px ${isHot ? T.red : accent}99` : 'none';
          return (
            <div key={i} style={{
              flex: 1, height,
              background: ledColor,
              boxShadow: glow,
              opacity: isLit ? 1 : 0.45,
              transition: 'background 0.2s, box-shadow 0.2s',
            }} />
          );
        })}
      </div>
      {label && (
        <span style={{
          fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 12,
          color: pct >= 80 ? T.red : accent,
          minWidth: 38, textAlign: 'right',
          textShadow: `0 0 8px ${pct >= 80 ? T.red : accent}66`,
        }}>{label}</span>
      )}
    </div>
  );
}

/* ── Tape reel SVG decoration ───────────────────────────────── */
function TapeReel({ size = 36, color, spinning = false, style }) {
  const T = useT();
  const c = color || T.ink2;
  const r = size / 2 - 1;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{
      display: 'inline-block',
      width: size, height: size,
      flexShrink: 0,
      overflow: 'visible',
      animation: spinning ? 'spin 2.4s linear infinite' : 'none',
      ...style,
    }}>
      <circle cx="20" cy="20" r="18" fill="none" stroke={c} strokeWidth="1.2" opacity="0.85" />
      <circle cx="20" cy="20" r="11" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" />
      <circle cx="20" cy="20" r="3.5" fill={c} opacity="0.9" />
      {/* Spokes */}
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <line key={deg}
          x1="20" y1="20"
          x2={20 + Math.cos(deg * Math.PI / 180) * 11}
          y2={20 + Math.sin(deg * Math.PI / 180) * 11}
          stroke={c} strokeWidth="1" opacity="0.5"
        />
      ))}
    </svg>
  );
}

/* ── Machined plate — wraps content with cassette-deck chrome ── */
function Plate({ children, style, accent, recessed, dataDropId, ...rest }) {
  const T = useT();
  return (
    <div
      data-drop-id={dataDropId}
      {...rest}
      style={{
      position: 'relative',
      background: recessed
        ? 'rgba(0,0,0,0.25)'
        : T.paperDark,
      border: `1px solid ${T.rule}`,
      boxShadow: recessed
        ? `inset 0 2px 6px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.04)`
        : `
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -2px 4px rgba(0,0,0,0.18),
            0 1px 0 rgba(0,0,0,0.4),
            0 4px 16px rgba(0,0,0,0.18)
          `,
      ...style,
    }}>
      {accent && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
          background: accent,
          boxShadow: `0 0 14px ${accent}66`,
        }} />
      )}
      {children}
    </div>
  );
}

/* ── REC indicator — pulsing red dot for "live" state ─────────── */
function RecLamp({ size = 8, label }) {
  const T = useT();
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      <span className="now-dot" style={{
        width: size, height: size, borderRadius: '50%',
        background: T.red,
        boxShadow: `0 0 8px ${T.red}cc, 0 0 14px ${T.red}55, inset 0 -1px 0 rgba(255,255,255,0.18)`,
      }} />
      {label && (
        <span style={{
          fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: T.red,
          textShadow: `0 0 8px ${T.red}66`,
        }}>{label}</span>
      )}
    </div>
  );
}

/* ── Live time readout (CRT-amber) ────────────────────────────── */
function TimeReadout({ style }) {
  const T = useT();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return (
    <span style={{
      fontFamily: FONT_NUM, fontStyle: 'italic',
      fontSize: 13, color: T.yellow, letterSpacing: '0.08em',
      textShadow: `0 0 8px ${T.yellow}66`,
      ...style,
    }}>
      {hh}<span style={{ opacity: 0.4 }}>:</span>{mm}<span style={{ opacity: 0.6, fontSize: 10 }}>:{ss}</span>
    </span>
  );
}

Object.assign(window, {
  Checkbox, Eyebrow,
  VUMeter, TapeReel, Plate, RecLamp, TimeReadout,
});
