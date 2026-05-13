// UI shell store: palette, theme mode, font pairing, density,
// plus the Phase A responsive knobs (useFluid, studioRails).
//
// Together: 4 palettes × 2 modes × 4 fonts × 3 densities = 96 visual
// combinations, × 2 fluid options × 2 studioRails options = 384
// states, persisted to localStorage under `hpc-ui`. The same key is
// read by the anti-FOUC inline script in index.html so first paint
// matches the saved combo.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  buildThemeVars,
  DEFAULT_THEME,
  type Density,
  type DrillLayoutKey,
  EDITIONS,
  type EditionKey,
  type FontKey,
  type PaletteKey,
  resolveEdition,
  type ThemeMode,
} from '@/lib/tokens'

type UiState = {
  palette: PaletteKey
  mode: ThemeMode
  font: FontKey
  density: Density
  drillLayout: DrillLayoutKey
  useFluid: boolean
  studioRails: boolean
  setPalette: (palette: PaletteKey) => void
  setMode: (mode: ThemeMode) => void
  setFont: (font: FontKey) => void
  setDensity: (density: Density) => void
  setDrillLayout: (drillLayout: DrillLayoutKey) => void
  /** Atomically write font + density + drillLayout from the EDITIONS
   *  bundle for the named edition. Use this from the Edition Strip's
   *  click handler. Cmd+K still has surgical per-axis setters for
   *  divergence moments. */
  setEdition: (edition: EditionKey) => void
  toggleMode: () => void
  setUseFluid: (useFluid: boolean) => void
  setStudioRails: (studioRails: boolean) => void
  toggleStudioRails: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      palette: DEFAULT_THEME.palette,
      mode: DEFAULT_THEME.mode,
      font: DEFAULT_THEME.font,
      density: DEFAULT_THEME.density,
      drillLayout: DEFAULT_THEME.drillLayout,
      useFluid: DEFAULT_THEME.useFluid,
      studioRails: DEFAULT_THEME.studioRails,
      setPalette: (palette) => set({ palette }),
      setMode: (mode) => set({ mode }),
      setFont: (font) => set({ font }),
      setDensity: (density) => set({ density }),
      setDrillLayout: (drillLayout) => set({ drillLayout }),
      setEdition: (edition) => {
        const b = EDITIONS[edition]
        set({ font: b.font, density: b.density, drillLayout: b.drillLayout })
      },
      toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setUseFluid: (useFluid) => set({ useFluid }),
      setStudioRails: (studioRails) => set({ studioRails }),
      toggleStudioRails: () => set((s) => ({ studioRails: !s.studioRails })),
    }),
    { name: 'hpc-ui' },
  ),
)

/** Selector — returns the active edition name if (font, density,
 *  drillLayout) exactly match one of EDITIONS, otherwise 'custom'.
 *  Used by EditionStrip to show the `· egen` divergence indicator. */
export function useActiveEdition(): EditionKey | 'custom' {
  return useUiStore((s) => resolveEdition(s.font, s.density, s.drillLayout))
}

/**
 * Write the active theme combination to <html>. Theme/mode/font/density/
 * useFluid each update independently; this re-applies all of them so we
 * never end up with a half-applied state. Cheap — one style assignment
 * per var.
 *
 * Also toggles the `.dark` class so any code that looks at it (Tailwind
 * dark variant fallback, third-party widgets) keeps working.
 *
 * studioRails isn't applied here — it's a layout/UI flag, not a CSS-vars
 * one. Frame.tsx reads it directly from the store.
 */
export function applyThemeToDocument(
  palette: PaletteKey,
  mode: ThemeMode,
  font: FontKey,
  density: Density,
  useFluid = true,
) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const vars = buildThemeVars(palette, mode, font, density, useFluid)
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }
  root.classList.toggle('dark', mode === 'dark')
  root.dataset.palette = palette
  root.dataset.font = font
  root.dataset.density = density
  root.dataset.fluid = useFluid ? 'on' : 'off'
}
