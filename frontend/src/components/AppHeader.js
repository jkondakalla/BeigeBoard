import React, { useState, useEffect } from 'react';
import { useT, DARK, FONT_HEAD, FONT_BODY, localDate } from '../theme';

export const VIEW_LABELS = { today: 'Today', calendar: 'Calendar', tasks: 'Tasks' };

export function AppHeader({ view, today }) {
  const T = useT();
  const d    = localDate(today);
  const week = Math.ceil(((d - new Date(d.getFullYear(), 0, 0)) / 86400000) / 7);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      background: T.paper,
      borderBottom: `1px solid ${T.rule}`,
      padding: '18px 40px 16px',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: scrolled ? `0 2px 24px rgba(0,0,0,${T === DARK ? 0.5 : 0.08})` : 'none',
      transition: 'box-shadow 0.25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{
            fontFamily: FONT_HEAD, fontWeight: 600, fontStyle: 'italic',
            fontSize: 22, color: T.yellow, letterSpacing: '-0.01em',
          }}>BeigeBoard</span>
          <span style={{ color: T.rule }}>·</span>
          <span style={{
            fontFamily: FONT_BODY, fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink2,
          }}>{d.getFullYear()} · W{week}</span>
        </div>
        <span style={{
          fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 14,
          color: T.ink2, letterSpacing: '0.01em',
        }}>{VIEW_LABELS[view]}</span>
      </div>
    </header>
  );
}
