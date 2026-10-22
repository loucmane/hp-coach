import type { PaletteKey, ThemeMode } from '@/lib/tokens'
import type { Destination } from '../nav'

/** Shell-only subset of the Folio+ prototype contract. No fixture dependencies. */
export type ShellInput = {
  plan: readonly { title: string; completed: boolean }[] | null
  resume: { subject: string; progress: string } | null
  dueNow: number
  dueToday: number
  repetition?: { count: number; minutes: number }
  provpass: { half: 'kvant' | 'verbal'; due: boolean; daysUntilNext: number } | null
  lesson: { section: string; title: string } | null
  prognosis: number | null
}

export type ShellData = {
  subtitles: Record<Destination, string>
  dueCount: number
  identity: { name: string }
  prefs: { palette: PaletteKey; mode: ThemeMode }
}
