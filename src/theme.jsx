/* global React */
const { createContext, useContext } = React;

const LIGHT = {
  paper:      '#EDE2C8',
  paperDark:  '#E4D5B0',
  paperDeep:  '#D9C698',
  ink:        '#1C1408',
  ink2:       '#6B5038',
  ink3:       '#9C8060',
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

const DARK = {
  paper:      '#0F0C06',  // warm carbon
  paperDark:  '#0A0703',  // a notch deeper for cards
  paperDeep:  '#06040A1A', // unused, kept for compat
  ink:        '#F2E8D2',  // bright warm cream, the "phosphor"
  ink2:       '#A89272',  // mid-warm for secondary text
  ink3:       '#6E5C3E',  // dim, for hints
  rule:       '#3B2C18',  // warm brown rule
  ruleSoft:   '#241A0E',
  red:        '#E04828',  // ember red, glows
  redSoft:    '#3A1108',
  yellow:     '#E0A020',  // CRT amber
  yellowSoft: '#241600',
  grain:        0.08,
  grainBlend:   'screen',
  bleedOpacity: 0.14,
};

const ThemeCtx = createContext(LIGHT);
const useT = () => useContext(ThemeCtx);

const FONT_HEAD = "'Newsreader', 'EB Garamond', Georgia, serif";
const FONT_BODY = "'Inter Tight', system-ui, sans-serif";
const FONT_NUM  = "'Newsreader', Georgia, serif";

const TASK_COLORS = [
  { id: 'rust',  label: 'Rust',  hex: '#B05040' },
  { id: 'amber', label: 'Amber', hex: '#A07828' },
  { id: 'sage',  label: 'Sage',  hex: '#4E7250' },
  { id: 'slate', label: 'Slate', hex: '#3A5C78' },
  { id: 'umber', label: 'Umber', hex: '#7A6050' },
  { id: 'teal',  label: 'Teal',  hex: '#307068' },
  { id: 'mauve', label: 'Mauve', hex: '#7A5070' },
];

/* Source palette — for imported calendar events */
const SOURCES = {
  work:     { label: 'Work',     hex: '#3A5C78' },
  personal: { label: 'Personal', hex: '#4E7250' },
  outlook:  { label: 'Outlook',  hex: '#7A5070' },
  bb:       { label: 'BeigeBoard', hex: '#B05040' },
};
const sourceOf = id => SOURCES[id] || { label: 'Source', hex: '#7A6050' };

/* ── Date helpers ──────────────────────────────────────────────────── */
function isoDate(d) {
  const z = new Date(d);
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, '0');
  const day = String(z.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const localDate     = iso => new Date(iso + 'T00:00:00');
const fmtWeekday    = iso => localDate(iso).toLocaleDateString('en-US', { weekday: 'short' });
const fmtWeekdayLong= iso => localDate(iso).toLocaleDateString('en-US', { weekday: 'long' });
const fmtFull       = iso => localDate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const fmtMonthDay   = iso => localDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const fmtTime = t => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
};

const timeToFrac = t => {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
};
const fmtHourLabel = h => h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;

const addDays = (iso, n) => { const d = localDate(iso); d.setDate(d.getDate() + n); return isoDate(d); };
const weekStart = iso => {
  const d = localDate(iso);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return isoDate(d);
};

function getGreeting() {
  const h = new Date().getHours();
  if (h <  5) return 'Late night.';
  if (h < 12) return 'Morning.';
  if (h < 17) return 'Afternoon.';
  if (h < 21) return 'Evening.';
  return 'Night.';
}

/* ── Halation helper ─────────────────────────────────────────────────
   Returns a text-shadow / box-shadow value at varying intensity.
   Levels:
     hi   — load-bearing titles, the NEXT card, the year goal title
     mid  — section headers, accent rails, REC lamps
     low  — small tags, chips, count indicators
     soft — footnotes, tertiary text on accent
*/
function halate(hex, level = 'mid') {
  if (!hex) return 'none';
  const c = hex.replace('#', '');
  const alpha = { hi: '88', mid: '55', low: '33', soft: '1f' }[level] || '55';
  const radius = { hi: 28, mid: 16, low: 10, soft: 5 }[level] || 16;
  return `0 0 ${radius}px #${c}${alpha}`;
}

Object.assign(window, {
  LIGHT, DARK, ThemeCtx, useT,
  FONT_HEAD, FONT_BODY, FONT_NUM,
  TASK_COLORS, SOURCES, sourceOf,
  isoDate, localDate, fmtWeekday, fmtWeekdayLong, fmtFull, fmtMonthDay,
  fmtTime, fmtHourLabel, timeToFrac, addDays, weekStart, getGreeting,
  halate,
});
