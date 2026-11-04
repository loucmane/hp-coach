import type { PaletteKey, ThemeMode } from '@/lib/tokens'
import type { RailDestination } from '../nav'

/** Live-data inputs for the Ljusbord shell. No fixture dependencies. */
export type ShellInput = {
  plan: readonly { title: string; completed: boolean }[] | null
  resume: { subject: string; progress: string; href?: string } | null
  dueNow: number
  dueToday: number
  repetition?: { count: number; minutes: number }
  provpass: { half: 'kvant' | 'verbal'; due: boolean; daysUntilNext: number } | null
  lesson: { section: string; title: string } | null
  prognosis: number | null
  /** Lifetime drill starts; excludes mocks and is not a completion count. */
  practicePasses?: number | null
}

export type ShellData = {
  subtitles: Record<RailDestination, string>
  dueCount: number
  identity: { name: string }
  prefs: { palette: PaletteKey; mode: ThemeMode }
}
