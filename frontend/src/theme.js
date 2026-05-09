import React from 'react';

export const LIGHT = {
  paper:      '#EDE2C8',
  paperDark:  '#E4D5B0',
  ink:        '#1C1408',
  ink2:       '#6B5038',
  rule:       '#C8AE88',
  ruleSoft:   '#DACA9E',
  red:        '#C8391A',
  redSoft:    '#E0C0A8',
  yellow:     '#A87000',
  yellowSoft: '#D8C070',
  grain:        0.055,
  grainBlend:   'multiply',
  bleedOpacity: 0.10,
};

export const DARK = {
  paper:      '#100E08',
  paperDark:  '#0A0806',
  ink:        '#EDE4CF',
  ink2:       '#7A6A50',
  rule:       '#2A2016',
  ruleSoft:   '#1C1810',
  red:        '#E04828',
  redSoft:    '#260806',
  yellow:     '#C08800',
  yellowSoft: '#181000',
  grain:        0.10,
  grainBlend:   'screen',
  bleedOpacity: 0.14,
};

export const ThemeCtx = React.createContext(LIGHT);
export const useT = () => React.useContext(ThemeCtx);

export const FONT_HEAD = "'Newsreader', 'EB Garamond', Georgia, serif";
export const FONT_BODY = "'Inter Tight', system-ui, sans-serif";
export const FONT_NUM  = "'Newsreader', Georgia, serif";
export const API       = 'http://localhost:3000';

export function isoDate(d) {
  const z = new Date(d);
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, '0');
  const day = String(z.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export const localDate  = iso => new Date(iso + 'T00:00:00');
export const fmtWeekday = iso => localDate(iso).toLocaleDateString('en-US', { weekday: 'short' });
export const fmtFull    = iso => localDate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export const fmtTime = t => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
};

export const TASK_COLORS = [
  { id: 'rust',  label: 'Rust',  hex: '#B05040' },
  { id: 'amber', label: 'Amber', hex: '#A07828' },
  { id: 'sage',  label: 'Sage',  hex: '#4E7250' },
  { id: 'slate', label: 'Slate', hex: '#3A5C78' },
  { id: 'umber', label: 'Umber', hex: '#7A6050' },
  { id: 'teal',  label: 'Teal',  hex: '#307068' },
  { id: 'mauve', label: 'Mauve', hex: '#7A5070' },
];

export function getGreeting() {
  const h = new Date().getHours();
  if (h <  5) return 'Late night.';
  if (h < 12) return 'Morning.';
  if (h < 17) return 'Afternoon.';
  if (h < 21) return 'Evening.';
  return 'Night.';
}
