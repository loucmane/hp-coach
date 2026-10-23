import { daysUntil, EXAM_SITTINGS } from '@/lib/dates'
import type { PaletteKey, ThemeMode } from '@/lib/tokens'
import { COACH_BLURBS, COACH_LABELS, type CoachKey } from '@/lib/voice'

export type KontoEntry = 'konto' | 'mer'
export type NavigateHref = (href: string) => void
export type Setting = 'sitting' | 'smartDrill' | 'coach' | 'mode' | 'palette'
export type ExportState = 'idle' | 'pending' | 'done' | 'failed'
export type DeleteState = 'idle' | 'pending' | 'failed' | 'signing-out' | 'signout-failed' | 'done'
export type Option<K extends string> = { key: K; label: string; blurb?: string }

export const COPY = {
  saveFailed: 'Det gick inte att spara – försök igen.',
  exported: 'Filen laddas ned.',
  exportFailed: 'Kunde inte exportera just nu. Försök igen om en stund.',
  deleteFailed: 'Kunde inte radera kontot. Inget raderades — försök igen.',
  signoutFailed: 'Kontot är raderat, men det gick inte att logga ut.',
} as const

export const PALETTE_OPTIONS: Option<PaletteKey>[] = [
  { key: 'spalt', label: 'Spalt' },
  { key: 'sand', label: 'Sand' },
  { key: 'sage', label: 'Salvia' },
  { key: 'ink', label: 'Bläck' },
  { key: 'rose', label: 'Ros' },
]
export const MODE_OPTIONS: Option<ThemeMode>[] = [
  { key: 'light', label: 'Ljust' },
  { key: 'dark', label: 'Mörkt' },
]
export const COACH_OPTIONS = (['kompis', 'professor', 'taktiker'] as CoachKey[]).map((key) => ({
  key,
  label: COACH_LABELS[key],
  blurb: COACH_BLURBS[key],
}))
export const SECTIONS = [
  { id: 'du', title: 'Du' },
  { id: 'provet', title: 'Provet' },
  { id: 'ovningen', title: 'Övningen' },
  { id: 'utseende', title: 'Utseende' },
  { id: 'design', title: 'Design' },
  { id: 'data', title: 'Din data' },
  { id: 'verktyg', title: 'Verktyg' },
  { id: 'hjalp', title: 'Hjälp' },
] as const
export type KontoPlace = (typeof SECTIONS)[number]['id']

// The same destinations and explanations as classic /mer, without importing the route.
export const TOOLS = [
  {
    to: '/diagnostik',
    headline: 'Diagnostik',
    rationale: 'Mät om var du står — 10 frågor över alla sektioner, ny baslinje.',
  },
  {
    to: '/prov',
    headline: 'Provpass',
    rationale: '40 frågor, 55 minuter, riktiga provvillkor — hela halvan på riktigt.',
  },
  {
    to: '/avancerat',
    headline: 'Avancerat',
    rationale: 'Typsnitt, täthet och andra finjusteringar bortom tema.',
  },
  {
    to: '/coach',
    headline: 'Feedback',
    rationale: 'Exportera dina flaggade frågor och förklaringar.',
  },
] as const

export const SHORTCUTS: { where: string; keys: [string, string][] }[] = [
  {
    where: 'Överallt',
    keys: [
      ['⌘B', 'fäll ihop eller ut menyn'],
      ['Esc', 'stäng en lapp eller bildvisaren'],
    ],
  },
  {
    where: 'I en övning',
    keys: [
      ['A–E', 'välj ett alternativ'],
      ['⇧ + bokstav', 'stryk ett alternativ'],
      ['↵', 'svara, sedan nästa fråga'],
    ],
  },
  { where: 'I ett provpass', keys: [['← / →', 'förra och nästa fråga']] },
  {
    where: 'I Förstora',
    keys: [
      ['+ / −', 'zooma'],
      ['R', 'vrid figuren'],
    ],
  },
  { where: 'I Uppslag', keys: [['J / K', 'nästa och förra posten']] },
]

type Identity = {
  fullName?: string | null
  firstName?: string | null
  primaryEmailAddress?: { emailAddress: string } | null
}
export function identityView(user: Identity | null | undefined) {
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  return { name: user?.fullName?.trim() || user?.firstName?.trim() || '', email }
}

export function examChoices(sittingId: string, now = new Date()) {
  const upcoming = EXAM_SITTINGS.filter((s) => daysUntil(s.date, now) >= 0)
  const chosen = upcoming.find((s) => s.id === sittingId) ?? upcoming[0]
  return {
    options: upcoming.map((s) => ({ key: s.id, label: s.label })),
    hint: chosen
      ? chosen.date.toLocaleDateString('sv-SE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Nästa provdatum är inte publicerat här än.',
  }
}

export function canDelete(word: string) {
  return word === 'radera'
}
