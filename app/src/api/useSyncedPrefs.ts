// Sync the user's prefs row (server) ↔ Zustand stores (client).
//
// Pattern:
//   - Local stores stay as the read source for components — they hand
//     out the value synchronously, no fetch flicker on every render.
//   - On sign-in, useHydratePrefs runs once and copies the server's
//     stored prefs into each local store. After this, local matches
//     server.
//   - When the user changes a pref, useSyncedPrefs.set* writes to BOTH
//     the local store (instant UI) AND the API (server commits).
//     A failed write rolls the local store back so devices stay aligned.
//
// This keeps the SPA feeling instant while making the server the source
// of truth. A second device focuses → useUserPrefs refetches → another
// hydration pass picks up the change.

import { useEffect, useRef } from 'react'

import type { Density, FontKey, PaletteKey, ThemeMode } from '@/lib/tokens'
import type { CoachKey } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useExamStore } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'

import { useUpdateUserPrefs, useUserPrefs } from './hooks/useUserPrefs'

/**
 * Mount once at the top of the signed-in tree. Watches the prefs query;
 * on every successful fetch, mirrors the server values into local stores
 * (idempotent — re-applying the same value is a no-op).
 */
export function useHydratePrefs() {
  const prefs = useUserPrefs()
  const lastHydrated = useRef<number | null>(null)

  // Local store setters
  const setCoach = useCoachStore((s) => s.setCoach)
  const applyServerTheme = useUiStore((s) => s.applyServerTheme)
  const setFont = useUiStore((s) => s.setFont)
  const setDensity = useUiStore((s) => s.setDensity)
  const setSitting = useExamStore((s) => s.setSitting)

  useEffect(() => {
    if (!prefs.data) return
    const updatedAtSignal = prefs.dataUpdatedAt
    if (updatedAtSignal === lastHydrated.current) return
    lastHydrated.current = updatedAtSignal

    if (prefs.data.coach) setCoach(prefs.data.coach as CoachKey)
    // Hydration applies WITHOUT the view-transition crossfade — see
    // uiStore.applyServerTheme.
    applyServerTheme(
      prefs.data.palette as PaletteKey | undefined,
      prefs.data.mode as ThemeMode | undefined,
    )
    if (prefs.data.font) setFont(prefs.data.font as FontKey)
    if (prefs.data.density) setDensity(prefs.data.density as Density)
    if (prefs.data.targetSittingId) {
      // Only apply if the id is one we know about; setSitting silently
      // ignores unknowns, so this is safe.
      setSitting(prefs.data.targetSittingId as Parameters<typeof setSitting>[0])
    }
  }, [applyServerTheme, prefs.data, prefs.dataUpdatedAt, setCoach, setFont, setDensity, setSitting])
}

/**
 * Synced setters: instant local update + server write-through, with
 * automatic rollback on server failure. Each function returns a Promise
 * that resolves once the server confirms (or rejects on failure).
 */
export function useSyncedPrefs() {
  const update = useUpdateUserPrefs()

  const setCoach = useCoachStore((s) => s.setCoach)
  const coachLocal = useCoachStore((s) => s.coach)

  const setPalette = useUiStore((s) => s.setPalette)
  const paletteLocal = useUiStore((s) => s.palette)

  const setMode = useUiStore((s) => s.setMode)
  const modeLocal = useUiStore((s) => s.mode)

  const setFont = useUiStore((s) => s.setFont)
  const fontLocal = useUiStore((s) => s.font)

  const setDensity = useUiStore((s) => s.setDensity)
  const densityLocal = useUiStore((s) => s.density)

  // One write-through helper, parameterised by which axis is changing.
  // Captures the previous local value so we can roll back on failure.
  const writeThrough =
    <V>(apply: (v: V) => void, revert: V, patchKey: string) =>
    async (next: V) => {
      apply(next)
      try {
        await update.mutateAsync({ [patchKey]: next } as Parameters<typeof update.mutateAsync>[0])
      } catch (err) {
        apply(revert)
        throw err
      }
    }

  return {
    setCoach: writeThrough(setCoach, coachLocal, 'coach'),
    setPalette: writeThrough(setPalette, paletteLocal, 'palette'),
    setMode: writeThrough(setMode, modeLocal, 'mode'),
    setFont: writeThrough(setFont, fontLocal, 'font'),
    setDensity: writeThrough(setDensity, densityLocal, 'density'),
    isPending: update.isPending,
    isError: update.isError,
  }
}
