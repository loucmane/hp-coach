// UI shell store: theme + density.
//
// Theme drives the .dark class on <html>; density drives the four
// --pad/--gap/--radius CSS vars. Both apply via a small effect in
// the App root so the cascade picks them up before any render.
//
// Persisted to localStorage under `hpc-ui` so a user's preferred
// theme and density stick across reloads.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DENSITY, type Density, type ThemeMode } from '@/lib/tokens'

type UiState = {
  theme: ThemeMode
  density: Density
  setTheme: (theme: ThemeMode) => void
  setDensity: (density: Density) => void
  toggleTheme: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      density: 'regular',
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'hpc-ui' },
  ),
)

/**
 * Apply theme + density to the live document. Call once from a top-level
 * effect; subscribes to the store so changes propagate immediately.
 */
export function applyUiToDocument(theme: ThemeMode, density: Density) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  const d = DENSITY[density]
  const root = document.documentElement
  root.style.setProperty('--pad', d.pad)
  root.style.setProperty('--pad-lg', d.padLg)
  root.style.setProperty('--gap', d.gap)
  root.style.setProperty('--radius', d.radius)
}
