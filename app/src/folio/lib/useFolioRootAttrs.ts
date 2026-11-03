import { useMemo, useSyncExternalStore } from 'react'

import type { PaletteKey, ThemeMode } from '@/lib/tokens'
import {
  type FolioMotionPref,
  type FolioTextSize,
  type FolioTheme,
  useFolioPrefs,
} from './folioPrefs'

/** Resolved motion: `full`, `less` (opacity fades only) or `none`. */
export type FolioMotionLevel = 'full' | 'less' | 'none'

/** The attributes for the `[data-folio]` root. `system` never reaches the DOM. */
export type FolioRootAttrs = {
  'data-theme': ThemeMode
  'data-palette': PaletteKey
  'data-motion': FolioMotionLevel
  'data-kbd': 'on' | 'off'
  'data-text': FolioTextSize
}

const DARK = '(prefers-color-scheme: dark)'
const REDUCE = '(prefers-reduced-motion: reduce)'

function mediaList(query: string): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query)
    : null
}

function subscriber(query: string) {
  return (onChange: () => void) => {
    const list = mediaList(query)
    list?.addEventListener('change', onChange)
    return () => list?.removeEventListener('change', onChange)
  }
}

const subscribeDark = subscriber(DARK)
const subscribeReduce = subscriber(REDUCE)
const systemDark = () => mediaList(DARK)?.matches ?? false
const systemReduced = () => mediaList(REDUCE)?.matches ?? false
const serverSnapshot = () => false

/** `prefers-color-scheme: dark`, live. */
export function useSystemDark(): boolean {
  return useSyncExternalStore(subscribeDark, systemDark, serverSnapshot)
}

/** `prefers-reduced-motion: reduce`, live. */
export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduce, systemReduced, serverSnapshot)
}

export function resolveFolioTheme(theme: FolioTheme, dark: boolean): ThemeMode {
  if (theme === 'system') return dark ? 'dark' : 'light'
  return theme
}

/**
 * Som systemet follows the OS. An OS asking for reduced motion gets `none`,
 * matching the design's own rule (system.css turns every animation and
 * transition off under `prefers-reduced-motion: reduce`).
 */
export function resolveFolioMotion(motion: FolioMotionPref, reduced: boolean): FolioMotionLevel {
  if (motion === 'system') return reduced ? 'none' : 'full'
  return motion
}

/** The Konto Rörelse pref resolved against the OS, live. */
export function useFolioMotionLevel(): FolioMotionLevel {
  const motion = useFolioPrefs((s) => s.motion)
  return resolveFolioMotion(motion, useSystemReducedMotion())
}

/**
 * Resolves the Folio prefs into the root's data attributes, following the OS
 * live for Som systemet (theme and motion): `<div data-folio="" {...attrs}>`.
 */
export function useFolioRootAttrs(): FolioRootAttrs {
  const theme = useFolioPrefs((s) => s.theme)
  const palette = useFolioPrefs((s) => s.palette)
  const kbd = useFolioPrefs((s) => s.kbd)
  const textSize = useFolioPrefs((s) => s.textSize)
  const resolvedTheme = resolveFolioTheme(theme, useSystemDark())
  const motion = useFolioMotionLevel()
  return useMemo(
    () => ({
      'data-theme': resolvedTheme,
      'data-palette': palette,
      'data-motion': motion,
      'data-kbd': kbd ? 'on' : 'off',
      'data-text': textSize,
    }),
    [resolvedTheme, palette, motion, kbd, textSize],
  )
}
