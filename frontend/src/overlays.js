import React, { useState, useEffect, useRef } from 'react';
import { useT, FONT_HEAD, FONT_BODY, isoDate, localDate } from './theme';

// ── Film Grain ────────────────────────────────────────────────────────
export function FilmGrain() {
  const T = useT();
  return (
    <svg
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 9995,
        opacity: T.grain,
        mixBlendMode: T.grainBlend,
      }}
      aria-hidden="true"
    >
      <filter id="fg">
        <feTurbulence type="fractalNoise" baseFrequency="0.76" numOctaves="4" stitchTiles="stitch">
          <animate attributeName="seed" values="0;5;11" calcMode="discrete" dur="22s" repeatCount="indefinite" />
        </feTurbulence>
        <feColorMatrix type="matrix" values="2.2 0 0 0 -0.65  2.2 0 0 0 -0.65  2.2 0 0 0 -0.65  0 0 0 1 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#fg)" />
    </svg>
  );
}

// ── Halation filter (SVG defs only — applied to the content wrapper) ──
export function Halation() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
      <defs>
        <filter id="halation" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix"
            values="1 0 0 0  0
                    0 0 0 0  0
                    0 0 0 0  0
                    2 -1 -1 0 -0.5"
            result="warmOnly" />
          <feGaussianBlur in="warmOnly" stdDeviation="5" result="bloom" />
          <feBlend in="SourceGraphic" in2="bloom" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}

// ── Film Artifacts ────────────────────────────────────────────────────
let _aid = 0;
function makeArtifact() {
  const id = ++_aid;
  const isScratch = Math.random() < 0.55;
  const bright = Math.random() < 0.65;
  if (isScratch) {
    const left = Math.random() < 0.5;
    return {
      id, type: 'scratch',
      x:      left ? 1 + Math.random() * 11 : 88 + Math.random() * 10,
      y:      3 + Math.random() * 40,
      height: 10 + Math.random() * 32,
      tilt:   (Math.random() - 0.5) * 3.5,
      peakOp: 0.28 + Math.random() * 0.42,
      dur:    90 + Math.floor(Math.random() * 240),
      bright,
    };
  }
  const lx = Math.random() < 0.5, ty = Math.random() < 0.5;
  return {
    id, type: 'blip',
    x:      lx ? 1 + Math.random() * 12 : 87 + Math.random() * 12,
    y:      ty ? 1 + Math.random() * 12 : 87 + Math.random() * 12,
    w:      2 + Math.floor(Math.random() * 5),
    h:      2 + Math.floor(Math.random() * 5),
    peakOp: 0.45 + Math.random() * 0.45,
    dur:    55 + Math.floor(Math.random() * 160),
    bright,
  };
}

export function Artifacts() {
  const [items, setItems] = useState([]);
  const timer = useRef(null);

  useEffect(() => {
    const schedule = () => {
      timer.current = setTimeout(() => {
        const a = makeArtifact();
        setItems(p => [...p, a]);
        setTimeout(() => setItems(p => p.filter(x => x.id !== a.id)), a.dur + 60);
        schedule();
      }, 9000 + Math.random() * 18000);
    };
    schedule();
    return () => clearTimeout(timer.current);
  }, []);

  if (!items.length) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }}>
      {items.map(a => {
        const color = a.bright ? '#FFF5E0' : '#1A0F06';
        const shared = { position: 'absolute', opacity: a.peakOp };
        const inner = { width: '100%', height: '100%', background: color, animation: `artifactFlash ${a.dur}ms ease-in-out forwards` };
        const outer = a.type === 'scratch'
          ? { ...shared, left: `${a.x}%`, top: `${a.y}%`, width: 1, height: `${a.height}%`, transform: `rotate(${a.tilt}deg)`, transformOrigin: 'top center' }
          : { ...shared, left: `${a.x}%`, top: `${a.y}%`, width: a.w, height: a.h };
        return <div key={a.id} style={outer}><div style={inner} /></div>;
      })}
    </div>
  );
}

// ── Scan Lines ────────────────────────────────────────────────────────
export function ScanLines() {
  const T = useT();
  const lineColor = T.grainBlend === 'screen'
    ? 'rgba(255,255,255,0.018)'
    : 'rgba(0,0,0,0.022)';
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, ${lineColor} 3px, ${lineColor} 4px)`,
        animation: 'scanRoll 12s linear infinite, scanPulse 17s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 9993,
      }}
    />
  );
}

// ── Film-Strip Nav ────────────────────────────────────────────────────
export function FilmStripNav({ view, setView }) {
  const T = useT();
  const PAGES = [['today', 'Today'], ['calendar', 'Cal'], ['tasks', 'Tasks']];
  const cur = PAGES.findIndex(([k]) => k === view);

  const perf = (
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      border: `1px solid ${T.rule}`,
      background: T.paper,
      flexShrink: 0, margin: '3px 0',
    }} />
  );

  return (
    <div style={{
      position: 'fixed', right: 12, top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: T.paperDark,
      border: `1px solid ${T.rule}`,
      padding: '6px 5px',
      zIndex: 300,
    }}>
      {perf}
      {PAGES.map(([k, label], i) => (
        <React.Fragment key={k}>
          <button
            onClick={() => setView(k)}
            title={label}
            style={{
              width: 32, height: 24,
              border: `1px solid ${i === cur ? T.red : T.rule}`,
              background: i === cur ? T.redSoft : T.paper,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <span style={{
              fontFamily: FONT_BODY, fontSize: 7,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: i === cur ? T.red : T.ink2,
              transition: 'color 0.2s',
              userSelect: 'none',
            }}>{label}</span>
          </button>
          {perf}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Dark Mode Toggle ──────────────────────────────────────────────────
export function DarkModeToggle({ dark, onToggle }) {
  const T = useT();
  return (
    <button
      className="dark-toggle"
      onClick={onToggle}
      title={dark ? 'Switch to light' : 'Switch to dark'}
      style={{ color: T.ink2 }}
    >
      {dark ? '◑' : '◐'}
    </button>
  );
}

// ── Startup audio (Web Audio API synthesis) ───────────────────────────
function playStartupAudio() {
  let ctx;
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
  catch (e) { return () => {}; }
  const t = ctx.currentTime;

  const thumpOsc = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thumpOsc.type = 'sine';
  thumpOsc.frequency.setValueAtTime(55, t);
  thumpOsc.frequency.exponentialRampToValueAtTime(18, t + 0.18);
  thumpGain.gain.setValueAtTime(0, t);
  thumpGain.gain.linearRampToValueAtTime(0.45, t + 0.018);
  thumpGain.gain.linearRampToValueAtTime(0, t + 0.22);
  thumpOsc.connect(thumpGain); thumpGain.connect(ctx.destination);
  thumpOsc.start(t); thumpOsc.stop(t + 0.25);

  const fanBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const fd = fanBuf.getChannelData(0);
  for (let i = 0; i < fd.length; i++) fd[i] = Math.random() * 2 - 1;
  const fan = ctx.createBufferSource();
  fan.buffer = fanBuf; fan.loop = true;
  const fanLp = ctx.createBiquadFilter();
  fanLp.type = 'lowpass';
  fanLp.frequency.setValueAtTime(60, t);
  fanLp.frequency.linearRampToValueAtTime(210, t + 2.8);
  const fanGain = ctx.createGain();
  fanGain.gain.setValueAtTime(0, t + 0.05);
  fanGain.gain.linearRampToValueAtTime(0.07, t + 1.8);
  fanGain.gain.linearRampToValueAtTime(0.04, t + 3.5);
  fan.connect(fanLp); fanLp.connect(fanGain); fanGain.connect(ctx.destination);
  fan.start(t);

  [0.28, 0.52, 0.78, 1.05, 1.31].forEach((dt, i) => {
    const ct = t + dt;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.055), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let j = 0; j < d.length; j++)
      d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.012));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900 + i * 180; bp.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0.28 - i * 0.03;
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(ct);
  });

  const humOsc = ctx.createOscillator();
  const humGain = ctx.createGain();
  humOsc.type = 'sine'; humOsc.frequency.value = 50;
  humGain.gain.setValueAtTime(0, t + 0.12);
  humGain.gain.linearRampToValueAtTime(0.035, t + 0.7);
  humGain.gain.linearRampToValueAtTime(0.01, t + 2.8);
  humGain.gain.setValueAtTime(0, t + 3.1);
  humOsc.connect(humGain); humGain.connect(ctx.destination);
  humOsc.start(t); humOsc.stop(t + 3.2);

  return () => { try { ctx.close(); } catch (e) {} };
}

// ── CRT Intro ─────────────────────────────────────────────────────────
export function CinematicIntro({ onDone }) {
  const [phase, setPhase] = useState(0);
  const audioCleanup = useRef(null);
  const today = isoDate(new Date());
  const d = localDate(today);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    audioCleanup.current = playStartupAudio();
    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 720);
    const t3 = setTimeout(() => setPhase(3), 2200);
    const t4 = setTimeout(onDone, 2800);
    return () => {
      [t1, t2, t3, t4].forEach(clearTimeout);
      audioCleanup.current?.();
    };
  }, [onDone]);

  return (
    <div
      className={phase === 3 ? 'intro-out' : ''}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: '#0A0703',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: phase === 3 ? 'none' : 'all',
      }}
    >
      <div
        className={phase >= 1 ? 'crt-expand' : ''}
        style={{
          position: 'absolute', inset: 0,
          background: '#0D0B07',
          clipPath: phase === 0 ? 'inset(50% 0 50% 0)' : undefined,
        }}
      />

      {phase >= 1 && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
        }} />
      )}

      {phase >= 1 && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(190,130,20,0.07) 0%, transparent 70%)',
        }} />
      )}

      {phase >= 2 && (
        <div className="intro-title" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div style={{
            fontFamily: FONT_HEAD, fontStyle: 'italic', fontWeight: 600,
            fontSize: 60, color: '#C08800',
            letterSpacing: '-0.02em', lineHeight: 1,
            textShadow: '0 0 35px rgba(192,136,0,0.45), 0 0 70px rgba(200,57,26,0.12)',
          }}>
            BeigeBoard
          </div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.30em',
            textTransform: 'uppercase', color: 'rgba(200,57,26,0.6)',
            marginTop: 13,
          }}>
            {dateStr}
          </div>
        </div>
      )}
    </div>
  );
}
