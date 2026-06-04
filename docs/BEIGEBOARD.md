# BeigeBoard — Service Documentation

**Location:** `BeigeBoard/`  
**TrueNAS path (prod):** `/mnt/Luna/Webhost/jkOS/BeigeBoard/`  
**TrueNAS path (staging):** `/mnt/Luna/Webhost/jkOS-staging/BeigeBoard/`  
**URL (prod):** `https://beigeboard.jkos.net`  
**URL (staging):** `https://staging.jkos.net/beigeboard`  
**Container (prod):** `bb-app` on `jkos-internal`  
**Container (staging):** `staging-bb-app` on `nginx-staging-proxy`  
**Port:** 3001 (internal), exposed via nginx  
**Tech:** React 18 · TypeScript 5.6 · Vite 6 · Express.js · better-sqlite3 · jsonwebtoken (RS256 verify only) · googleapis  
**Last updated:** 2026-06-04 (theme system + unified aesthetics)

---

## 1. Purpose

BeigeBoard is the personal productivity hub — a combined calendar and task manager. It serves:
- A **React SPA frontend** (Vite build, served as static files from the same Express server)
- A **Node.js/Express backend** that handles calendar OAuth, item CRUD, and AI task parsing

Authentication is delegated entirely to **jkOS Auth** — BeigeBoard has no login page or user table of its own.

---

## 2. Architecture

### Three-Stage Dockerfile

```
Stage 1 (build):    node:20-slim → npm install → vite build → /app/dist
Stage 2 (native):   node:20-slim + python3/make/g++ → npm install better-sqlite3 (native)
Stage 3 (prod):     node:20-slim → copy dist/ + backend/ → node backend/server.js
```

The Vite build stage has `ARG VITE_JKOS_AUTH_URL` so the auth URL is baked into the frontend bundle at build time. `NODE_ENV=production` is set in Stage 3.

### Request Flow

```
Browser → nginx (beigeboard.jkos.net:443)
       → bb-app:3001
       → Express server.js
           ├── GET /* → serve dist/index.html (SPA fallback)
           ├── GET /health → { status: 'ok', service: 'beigeboard' } [public]
           ├── GET /api/auth/google → Google Calendar OAuth [public]
           ├── GET /api/auth/outlook → Microsoft OAuth [public]
           └── ALL other /api/* → jkosAuth middleware → protected routes
```

---

## 3. Authentication

BeigeBoard uses the shared `jkos-auth.js` middleware (local copy of `jkos-auth-middleware/index.js`).

```javascript
const { jkosAuth } = require('./jkos-auth')
const PUBLIC_PATHS = ['/health', '/api/auth/google', '/api/auth/outlook']
app.use((req, res, next) => {
  if (PUBLIC_PATHS.some(p => req.path.startsWith(p))) return next()
  return jkosAuth({ publicKey: JKOS_AUTH_PUBLIC_KEY })(req, res, next)
})
```

**Dev mode fallback:** If `JKOS_AUTH_PUBLIC_KEY` is empty (local dev without jkOS Auth running), the middleware falls back to `req.user = { sub: 1, role: 'admin' }` — full admin access. This fallback ONLY activates when the key is completely absent. In production the key is always set.

**`req.user` shape:**
```typescript
{ sub: number, email: string, name: string, avatar_url: string, role: string, iat: number, exp: number }
```

---

## 4. Database Schema

**TrueNAS file:** `/mnt/Luna/Backends/BeigeBoard-Data/beigeBoard.db`  
**Mounted into container as:** `/data/beigeBoard.db`  
**Migration system:** Array of `{ id, name, up(db) }` objects applied in order at boot.

### `users`
```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  password_hash TEXT,   -- unused post-SSO migration; kept for schema compatibility
  google_id     TEXT UNIQUE,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT
);
```
**Note:** BeigeBoard no longer creates or manages users directly. The `users` table exists for FK relationships with `calendar_tokens` and `items`. Users are identified by `req.user.sub` from the jkOS Auth JWT.

### `calendar_tokens`
```sql
CREATE TABLE calendar_tokens (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,      -- 'google' | 'microsoft' | 'icloud'
  access_token  TEXT,
  refresh_token TEXT,
  expiry_ms     INTEGER,            -- unix timestamp ms
  email         TEXT,               -- connected calendar account email
  UNIQUE(user_id, provider)
);
```

### Migration catch behavior
Migration `ALTER TABLE` statements use `catch (e) { if (!e.message?.includes('duplicate column')) throw e }` — they swallow only "duplicate column" errors (idempotent re-runs) and rethrow everything else.

### `items`
Unified table for all calendar events and tasks:
```sql
CREATE TABLE items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL DEFAULT 'task',    -- 'task' | 'event' | 'goal'
  scope          TEXT NOT NULL DEFAULT 'day',     -- 'day' | 'week' | 'month' | 'year'
  title          TEXT NOT NULL,
  notes          TEXT,
  parent_id      INTEGER,              -- for sub-tasks
  accent         TEXT,                 -- color accent
  source         TEXT DEFAULT 'bb',    -- 'bb' | 'google' | 'outlook' | 'icloud'
  completed      INTEGER DEFAULT 0,    -- boolean (0/1)
  year           INTEGER,
  month          INTEGER,
  week_start     TEXT,                 -- ISO date of week's Monday
  due_date       TEXT,
  scheduled_time TEXT,
  scheduled_end  TEXT,
  end_date       TEXT,
  location       TEXT,
  attendees      INTEGER,
  target         TEXT,
  ...
);
```

### Migration 3: `detach_user_fk`
A significant migration that rebuilds `items` and `calendar_tokens` tables without FK constraints on `user_id`, and drops the old `sessions` table. This allows BeigeBoard to work with user IDs provided externally by jkOS Auth without requiring a local user record.

---

## 5. API Surface

All routes below `/api/` (except noted public paths) require a valid `jkos_token` cookie.

### Auth / Me

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/me` | Returns `req.user` (JWT payload from jkOS Auth) |

### Google Calendar OAuth (separate from user auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/google` | Initiates Google OAuth2 with `calendar.readonly` scope |
| `GET` | `/api/auth/google/callback` | Handles OAuth callback, stores tokens, redirects to SPA |
| `GET` | `/api/auth/google/status` | Returns connected account email or `null` |
| `DELETE` | `/api/auth/google` | Disconnects Google Calendar, deletes tokens |
| `POST` | `/api/calendar/google/sync` | Fetches upcoming events from Google Calendar |

**Important:** This Google OAuth is for **Calendar sync only** (`calendar.readonly` scope). It is entirely separate from jkOS Auth's Google OAuth (which is for user authentication). A separate OAuth client or at minimum a separate redirect URI must be registered in Google Cloud Console.

### Microsoft Outlook Calendar OAuth

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/outlook` | Initiates Microsoft OAuth2 |
| `GET` | `/api/auth/outlook/callback` | Handles callback, stores tokens |
| `GET` | `/api/auth/outlook/status` | Returns connected account email or `null` |
| `DELETE` | `/api/auth/outlook` | Disconnects Outlook calendar |
| `POST` | `/api/calendar/outlook/sync` | Fetches Outlook calendar events |

### iCloud Calendar

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/icloud` | Store Apple ID credentials for CalDAV |
| `GET` | `/api/auth/icloud/status` | Returns stored iCloud email or `null` |
| `DELETE` | `/api/auth/icloud` | Removes stored iCloud credentials |
| `POST` | `/api/calendar/icloud/sync` | Fetches iCloud calendar events via CalDAV |

### Tasks / Items

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/items` | Returns all items for `req.user.sub`; also runs `seedDefaults` lazily |
| `POST` | `/api/items` | Creates a new item |
| `PATCH` | `/api/items/:id` | Partial update (any field) |
| `DELETE` | `/api/items/:id` | Deletes item (ownership verified) |

### AI

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/parse-task` | NL text → structured task fields via LazurOS |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | `{ status: 'ok', service: 'beigeboard' }` [public] |

---

## 6. AI Task Parsing

`POST /api/ai/parse-task` receives `{ text: string, model?: string }`.

The backend calls LazurOS with a structured prompt asking the LLM to extract:
- `title` — short task title
- `due_date` — ISO date if mentioned
- `scheduled_time` / `scheduled_end` — times if mentioned
- `notes` — remaining context
- `kind` — 'task' | 'event'
- `scope` — 'day' | 'week' | 'month' | 'year'

```javascript
if (LAZUROS_TOKEN) aiHeaders['Authorization'] = `Bearer ${LAZUROS_TOKEN}`
const r = await fetch(`${LAZUROS_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...aiHeaders },
  body: JSON.stringify({ model: LAZUROS_DEFAULT_MODEL, messages: [...], stream: false }),
})
```

---

## 7. Frontend Architecture

### Key Files

```
BeigeBoard/
├── src/
│   ├── App.tsx              ← Root: auth check, useJkOSPreferences, overlay rendering
│   ├── lib/
│   │   ├── theme.ts         ← Fonts, TASK_COLORS, SOURCES, halate(), date utilities
│   │   └── jkauth.ts        ← JkOSTheme types, getProfile(), patchProfile(), applyTheme()
│   ├── hooks/
│   │   └── useJkOSPreferences.ts ← Suite prefs: theme + effects + lazuros fetch/apply/patch
│   ├── components/
│   │   ├── AppHeader.tsx    ← Clean nav bar: wordmark + date + tabs + profile icon
│   │   ├── SettingsPanel.tsx ← Glass slide-in panel (profile-icon triggered); accepts props
│   │   └── Overlays.tsx     ← FilmGrain, Halation, ScanLines, Artifacts, CinematicIntro
│   └── views/
│       ├── TodayView.tsx    ← Today's tasks and events
│       ├── WeekView.tsx     ← Week calendar
│       ├── CalendarView.tsx ← Month calendar
│       └── TasksView.tsx    ← Task list management
├── backend/
│   ├── server.js            ← Express: auth, calendar, items, AI
│   ├── jkos-auth.js         ← Local copy of RS256 middleware
│   └── package.json
├── .env                     ← JKOS_AUTH_PUBLIC_KEY (already populated)
└── Dockerfile               ← 3-stage build
```

### Auth + Preferences Flow in App.tsx

```typescript
// On mount: check auth AND load suite preferences concurrently
checkAuth() → GET /api/auth/me → setUser(data)
useJkOSPreferences() → GET auth.jkos.net/auth/profile → applyTheme() + setEffects()

// apiFetch wrapper: handles TOKEN_EXPIRED → refresh → retry (once)
// Uses singleton Promise to deduplicate concurrent refresh attempts
```

`useJkOSPreferences()` is the single source of truth for theme, effects, and AI settings. Its return value is passed as props to `SettingsPanel`.

### CSS Variable Theme System

BeigeBoard uses CSS custom properties on `[data-theme="dark|light"]`. There is **no React ThemeContext** — all component styling uses CSS variables directly:

```css
/* Dark mode — warm amber retro */
:root[data-theme="dark"] { --color-paper: #0f0c06; --color-ink: #f2e8d2; --color-accent: var(--accent-base); … }
/* Light mode — warm parchment */
:root[data-theme="light"] { --color-paper: #ede2c8; --color-ink: #1c1408; … }
```

`--accent-base` and `--accent-secondary` are set by `applyTheme()` at runtime from jkAuth preferences.

### Halation

`<Halation />` defines an SVG filter `id="halation"`. The main content div has `filter: url(#halation)` applied when `effects.halation` is true, creating warm bloom on bright elements.

### `apiFetch` Deduplication

If two API calls both get `TOKEN_EXPIRED` simultaneously, only one refresh request is sent. A singleton `refreshing: Promise<boolean> | null` prevents a refresh storm.

---

## 8. Environment Variables

**TrueNAS path:** `/mnt/Luna/Webhost/jkOS/BeigeBoard/.env` (security: `chmod 600`)

| Variable | Required | Notes |
|----------|----------|-------|
| `JKOS_AUTH_PUBLIC_KEY` | ✅ | **Already set.** RS256 public key, `\n`-escaped |
| `JKOS_AUTH_URL` | ✅ | `https://auth.jkos.net` — already set |
| `VITE_JKOS_AUTH_URL` | ✅ | Same value — baked into frontend at build time |
| `SHELL_URL` | ✅ | `https://beigeboard.jkos.net` — used for CORS |
| `GOOGLE_CLIENT_ID` | For Calendar | **Calendar sync only** — different from auth's Google OAuth |
| `GOOGLE_CLIENT_SECRET` | For Calendar | Can reuse the same Google Cloud project but must register the calendar redirect URI |
| `GOOGLE_REDIRECT_URI` | ✅ | `https://beigeboard.jkos.net/api/auth/google/callback` |
| `MICROSOFT_CLIENT_ID` | Optional | Azure portal |
| `MICROSOFT_CLIENT_SECRET` | Optional | |
| `MICROSOFT_REDIRECT_URI` | Optional | `https://beigeboard.jkos.net/api/auth/outlook/callback` |
| `LAZUROS_URL` | For AI | `http://host.docker.internal:8080` |
| `LAZUROS_TOKEN` | For AI | Must match `LazurOS/.env` and SylibOS (`SylibOS/.env`) |
| `LAZUROS_DEFAULT_MODEL` | For AI | `llama3.2` |
| `PORT` | Defaults 3001 | Set in docker-compose |
| `DB_PATH` | Defaults in-dir | `/data/beigeBoard.db` in container |
| `STATIC_DIR` | Auto-detected | `/app/dist` in container |

**Removed (post-SSO migration):** `JWT_SECRET`, `GUEST_PASSWORD`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` — these are now jkOS Auth's responsibility.

---

## 9. Docker

### docker-compose.yml

**Prod** (`BeigeBoard/docker-compose.yml`) has `name: jkos-prod-bb` at the top level to prevent Docker Compose from confusing the prod and staging projects (both directories are named `BeigeBoard`).

```yaml
name: jkos-prod-bb
services:
  bb-app:
    container_name: bb-app
    networks: [jkos-internal]
    env_file: .env
    environment:
      PORT: "3001"
      DB_PATH: /data/beigeBoard.db
      STATIC_DIR: /app/dist
    volumes:
      - /mnt/Luna/Backends/BeigeBoard-Data:/data
    extra_hosts:
      - "host.docker.internal:host-gateway"  # required to reach LazurOS on host network
```

**Staging** compose uses `container_name: staging-bb-app` and joins `nginx-staging-proxy`.

### Healthcheck (built into Dockerfile)
```bash
curl -s http://localhost:3001/health | jq .status  # → "ok"
```
`NODE_ENV=production` is set in the final stage. `.dockerignore` prevents `.env`, `*.db`, `node_modules`, and `.git` from entering the build context.

---

## 10. Staging Configuration

### Env var differences from prod

| Variable | Prod value | Staging value |
|----------|-----------|--------------|
| `JKOS_AUTH_URL` | `https://auth.jkos.net` | `https://staging.jkos.net/auth` |
| `VITE_JKOS_AUTH_URL` | `https://auth.jkos.net` | `https://staging.jkos.net/auth` |
| `SHELL_URL` | `https://beigeboard.jkos.net` | `https://staging.jkos.net/beigeboard` |
| `GOOGLE_REDIRECT_URI` | `https://beigeboard.jkos.net/api/auth/google/callback` | `https://beigeboard.jkos.net/api/auth/google/callback` (unchanged — calendar OAuth uses prod) |
| `BEIGEBOARD_DATA_PATH` | `/mnt/Luna/Backends/BeigeBoard-Data` | `/mnt/Luna/Backends-Staging/BeigeBoard-Data` |

### Vite base path (staging branch only)

The staging branch sets `base: '/beigeboard/'` in `vite.config.ts` so the SPA asset URLs include the path prefix. The prod branch has no `base` set (served from root).

---

## 11. Key Notes

- The BeigeBoard backend serves the SPA from `/app/dist` — the express server has a catch-all `GET *` that returns `dist/index.html`.
- `seedDefaults(userId)` is called lazily on `GET /api/items` when the user has no rows. Only runs for non-guest users.
- Calendar callbacks use `req.user.sub` (the jkOS Auth user ID). The `user_id` FK in `calendar_tokens` references a local `users` table, upserted lazily.
- `bcrypt` is intentionally NOT in `backend/package.json` — BeigeBoard no longer hashes passwords.
- **No React ThemeContext** — `DARK`, `LIGHT`, `ThemeCtx`, `useT` have been removed from `src/lib/theme.ts`. All theming is via CSS variables on `data-theme`. Do not re-introduce ThemeContext.
- **One profile fetch** — `useJkOSPreferences()` in `App.tsx` owns all theme/effects state. `SettingsPanel` receives props; it does not call `useJkOSPreferences()` internally.
- **`halate()` guard** — `halate()` returns `'none'` for CSS variable strings (e.g. `'var(--color-accent)'`). Pass hex values directly if you need a real shadow.
- Timer types: use `ReturnType<typeof setTimeout>`, not `NodeJS.Timeout`.
