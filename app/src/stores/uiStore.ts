// UI shell store: palette, theme mode, font pairing, density.
//
// Four axes that together pick one of 4×2×4×3 = 96 visual combinations.
// Persisted to localStorage under `hpc-ui` so a user's preferences stick
// across reloads. The same key is read by the anti-FOUC inline script in
// index.html so first paint matches the saved combo.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  buildThemeVars,
  DEFAULT_THEME,
  type Density,
  type FontKey,
  type PaletteKey,
  type ThemeMode,
} from '@/lib/tokens'

type UiState = {
  palette: PaletteKey
  mode: ThemeMode
  font: FontKey
  density: Density
  setPalette: (palette: PaletteKey) => void
  setMode: (mode: ThemeMode) => void
  setFont: (font: FontKey) => void
  setDensity: (density: Density) => void
  toggleMode: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      palette: DEFAULT_THEME.palette,
      mode: DEFAULT_THEME.mode,
      font: DEFAULT_THEME.font,
      density: DEFAULT_THEME.density,
      setPalette: (palette) => set({ palette }),
      setMode: (mode) => set({ mode }),
      setFont: (font) => set({ font }),
      setDensity: (density) => set({ density }),
      toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'hpc-ui' },
  ),
)

/**
 * Write the active theme combination to <html>. Theme/mode/font/density
 * each update independently; this re-applies all of them so we never end
 * up with a half-applied state. Cheap — one style assignment per var.
 *
 * Also toggles the `.dark` class so any code that looks at it (Tailwind
 * dark variant fallback, third-party widgets) keeps working.
 */
export function applyThemeToDocument(
  palette: PaletteKey,
  mode: ThemeMode,
  font: FontKey,
  density: Density,
) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const vars = buildThemeVars(palette, mode, font, density)
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }
  root.classList.toggle('dark', mode === 'dark')
  root.dataset.palette = palette
  root.dataset.font = font
  root.dataset.density = density
}
