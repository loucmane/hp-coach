// Folio-only display and input prefs (Konto: Tema, Rörelse, Tangentbord,
// Textstorlek, palette, Visa min tid). Device-local for now, persisted under
// `hpc-folio-prefs`; LJ-17 syncs them with /me/prefs. Classic never reads
// this store.

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { PaletteKey } from '@/lib/tokens'

/** Konto "Tema": Ljust / Mörkt / Som systemet. */
export type FolioTheme = 'light' | 'dark' | 'system'
/** Konto "Rörelse": Som systemet / Mindre / Ingen. */
export type FolioMotionPref = 'system' | 'less' | 'none'
/** Konto "Textstorlek": Mindre 15 / Normal 17 / Större 19 / Störst 21 px. */
export type FolioTextSize = 'small' | 'normal' | 'large' | 'xlarge'

export type FolioPrefsValues = {
  theme: FolioTheme
  motion: FolioMotionPref
  /** Konto "Enbokstavs-kortkommandon". */
  kbd: boolean
  textSize: FolioTextSize
  palette: PaletteKey
  /** Konto "Visa min tid i övning": off from the start (ADHD-safe opt-in). */
  showMyTime: boolean
}

// In Konto order.
export const FOLIO_THEMES: readonly FolioTheme[] = ['light', 'dark', 'system']
export const FOLIO_MOTIONS: readonly FolioMotionPref[] = ['system', 'less', 'none']
export const FOLIO_TEXT_SIZES: readonly FolioTextSize[] = ['small', 'normal', 'large', 'xlarge']
// Spalt, Sand, Salvia, Bläck and Ros. The record type keeps the list complete.
const PALETTE_SET: Record<PaletteKey, true> = {
  spalt: true,
  sand: true,
  sage: true,
  ink: true,
  rose: true,
}
export const FOLIO_PALETTES = Object.keys(PALETTE_SET) as readonly PaletteKey[]

export const FOLIO_PREFS_DEFAULTS: Readonly<FolioPrefsValues> = {
  theme: 'system',
  motion: 'system',
  kbd: true,
  textSize: 'normal',
  palette: 'spalt',
  showMyTime: false,
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | undefined {
  return list.find((item) => item === value)
}

/** The valid prefs in an untrusted record (storage, a server body); the rest is dropped. */
export function sanitizeFolioPrefs(input: unknown): Partial<FolioPrefsValues> {
  if (!input || typeof input !== 'object') return {}
  const raw = input as Record<string, unknown>
  const out: Partial<FolioPrefsValues> = {}
  const theme = oneOf(FOLIO_THEMES, raw.theme)
  if (theme) out.theme = theme
  const motion = oneOf(FOLIO_MOTIONS, raw.motion)
  if (motion) out.motion = motion
  if (typeof raw.kbd === 'boolean') out.kbd = raw.kbd
  const textSize = oneOf(FOLIO_TEXT_SIZES, raw.textSize)
  if (textSize) out.textSize = textSize
  const palette = oneOf(FOLIO_PALETTES, raw.palette)
  if (palette) out.palette = palette
  if (typeof raw.showMyTime === 'boolean') out.showMyTime = raw.showMyTime
  return out
}

type FolioPrefsState = FolioPrefsValues & {
  /** Applies the valid part of `patch`; a write that changes nothing is skipped. */
  setPrefs: (patch: Partial<FolioPrefsValues>) => void
  resetPrefs: () => void
}

// Private browsing and blocked site data throw on access; the prefs then live in memory.
const storage = createJSONStorage<FolioPrefsValues>(() => ({
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Not persisted; the change still applies for this visit.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Nothing was stored.
    }
  },
}))

export const useFolioPrefs = create<FolioPrefsState>()(
  persist(
    (set, get) => ({
      ...FOLIO_PREFS_DEFAULTS,
      setPrefs: (patch) => {
        const clean = sanitizeFolioPrefs(patch)
        const current = get()
        const keys = Object.keys(clean) as (keyof FolioPrefsValues)[]
        if (keys.some((key) => clean[key] !== current[key])) set(clean)
      },
      resetPrefs: () => set({ ...FOLIO_PREFS_DEFAULTS }),
    }),
    {
      name: 'hpc-folio-prefs',
      version: 1,
      storage,
      partialize: ({ theme, motion, kbd, textSize, palette, showMyTime }) => ({
        theme,
        motion,
        kbd,
        textSize,
        palette,
        showMyTime,
      }),
      // Another version's record keeps whatever is still valid.
      migrate: (persisted) => ({ ...FOLIO_PREFS_DEFAULTS, ...sanitizeFolioPrefs(persisted) }),
      merge: (persisted, current) => ({ ...current, ...sanitizeFolioPrefs(persisted) }),
    },
  ),
)
