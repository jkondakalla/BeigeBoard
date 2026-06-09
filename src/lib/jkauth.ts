import { applyJkOSMode, applyJkOSTheme as designApplyJkOSTheme } from '@design/utils/applyJkOSTheme'

const AUTH_URL = import.meta.env.VITE_JKOS_AUTH_URL ?? 'https://auth.jkos.net'

export interface JkOSTheme {
  mode:      'light' | 'dark' | 'system'
  primary:   string
  secondary: string
}

export interface EffectsPreferences {
  grain:         boolean
  grainStrength: number   // 0–1
  halation:      boolean
  scanLines:     boolean
  scanStrength:  number   // 0–1
  artifacts:     boolean
}

export interface LazurPreferences {
  url:   string
  model: string
}

export interface UserPreferences {
  scheme?:  string
  theme?:   JkOSTheme
  effects?: EffectsPreferences
  lazuros?: LazurPreferences
}

export interface JkosUser {
  id:         string
  email:      string
  name:       string
  avatar_url: string | null
  role:       string
}

export interface AuthProfile {
  user:        JkosUser
  preferences: UserPreferences
}

export const DEFAULT_THEME: JkOSTheme = {
  mode:      'system',
  primary:   '#ffb000',
  secondary: '#4ecdc4',
}

export const DEFAULT_EFFECTS: EffectsPreferences = {
  grain:         true,
  grainStrength: 0.35,
  halation:      true,
  scanLines:     false,
  scanStrength:  0.25,
  artifacts:     false,
}

export function normaliseTheme(raw: any): JkOSTheme {
  if (!raw) return DEFAULT_THEME
  if (raw.primary) return raw as JkOSTheme
  return {
    mode:      raw.mode ?? 'system',
    primary:   raw.dark?.primary   ?? DEFAULT_THEME.primary,
    secondary: raw.dark?.secondary ?? DEFAULT_THEME.secondary,
  }
}

export async function getProfile(): Promise<AuthProfile | null> {
  try {
    const r = await fetch(`${AUTH_URL}/auth/profile`, { credentials: 'include' })
    if (!r.ok) return null
    return r.json()
  } catch {
    return null
  }
}

export async function patchProfile(preferences: Partial<UserPreferences>): Promise<void> {
  await fetch(`${AUTH_URL}/auth/profile`, {
    method:      'PATCH',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ preferences }),
  })
}

export function applyTheme(theme: JkOSTheme): void {
  const isDark = applyJkOSMode(theme.mode)
  designApplyJkOSTheme({
    mode:  theme.mode,
    dark:  { primary: theme.primary, secondary: theme.secondary },
    light: { primary: theme.primary, secondary: theme.secondary },
  }, isDark)
}

export { AUTH_URL }
