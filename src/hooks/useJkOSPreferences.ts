import { useState, useEffect, useCallback } from 'react'
import { getProfile, patchProfile, applyTheme, normaliseTheme, DEFAULT_THEME, DEFAULT_EFFECTS } from '../lib/jkauth'
import type { JkOSTheme, EffectsPreferences, LazurPreferences, JkosUser } from '../lib/jkauth'

const DEFAULT_LAZUROS: LazurPreferences = {
  url:   '',
  model: 'llama3.2',
}

export function useJkOSPreferences() {
  const [theme,   setTheme]   = useState<JkOSTheme>(DEFAULT_THEME)
  const [effects, setEffects] = useState<EffectsPreferences>(DEFAULT_EFFECTS)
  const [lazuros, setLazuros] = useState<LazurPreferences>(DEFAULT_LAZUROS)
  const [user,    setUser]    = useState<JkosUser | null>(null)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    getProfile()
      .then(data => {
        if (!data) return
        if (data.user) setUser(data.user)
        if (data.preferences.theme) {
          const t = normaliseTheme(data.preferences.theme)
          setTheme(t)
          applyTheme(t)
        }
        if (data.preferences.effects) {
          setEffects(prev => ({ ...prev, ...data.preferences.effects }))
        }
        if (data.preferences.lazuros) {
          setLazuros(prev => ({ ...prev, ...data.preferences.lazuros }))
        }
      })
      .catch(() => {})
  }, [])

  const patch = useCallback(async (preferences: object) => {
    setSaving(true)
    try { await patchProfile(preferences as any) }
    finally { setSaving(false) }
  }, [])

  const patchTheme = useCallback((partial: Partial<JkOSTheme>) => {
    const next = { ...theme, ...partial }
    setTheme(next)
    applyTheme(next)
    patch({ theme: next })
  }, [theme, patch])

  const patchEffects = useCallback((partial: Partial<EffectsPreferences>) => {
    const next = { ...effects, ...partial }
    setEffects(next)
    patch({ effects: next })
  }, [effects, patch])

  const patchLazuros = useCallback((partial: Partial<LazurPreferences>) => {
    const next = { ...lazuros, ...partial }
    setLazuros(next)
    patch({ lazuros: next })
  }, [lazuros, patch])

  return { theme, effects, lazuros, user, saving, patchTheme, patchEffects, patchLazuros }
}
