import type { AnswerLetter, Question } from '@/data/questions'
import { daysUntil, EXAM_SITTINGS, type ExamSitting } from '@/lib/dates'
import type { PaletteKey } from '@/lib/tokens'

export const DIRECTIONS = [
  { key: 'a', name: 'Brev', description: 'En stilla sida, ett val i taget.' },
  { key: 'b', name: 'Fokus', description: 'En tydlig väg, med orden som vägvisare.' },
  { key: 'c', name: 'Uppslag', description: 'Välj till vänster. Se din app till höger.' },
] as const
export const STEPS = [
  { key: 1, label: 'Utseende' },
  { key: 2, label: 'Prov' },
  { key: 3, label: 'Minuter' },
  { key: 4, label: 'Ordet' },
  { key: 5, label: 'Tre frågor' },
  { key: 6, label: 'Klart' },
] as const
export const PALETTES: { key: PaletteKey; label: string }[] = [
  { key: 'spalt', label: 'Spalt' },
  { key: 'sand', label: 'Sand' },
  { key: 'sage', label: 'Salvia' },
  { key: 'ink', label: 'Bläck' },
  { key: 'rose', label: 'Ros' },
]
export type Step = (typeof STEPS)[number]['key']
export type Selection = {
  d: (typeof DIRECTIONS)[number]['key']
  s: Step
  w: 'desktop' | 'phone'
  t: 'light' | 'dark'
  p: PaletteKey
  sbs: boolean
}
export type WelcomeFlow = {
  sel: Selection
  select: (next: Partial<Selection>) => void
  sittings: readonly ExamSitting[]
  sitting: ExamSitting | null
  setSitting: (id: string) => void
  minutes: number
  setMinutes: (minutes: number) => void
  question: number
  picks: readonly (AnswerLetter | null)[]
  pick: (answer: AnswerLetter) => void
  revealed: boolean
  reveal: () => void
  nextQuestion: () => void
  doneLine: string
  destination: boolean
  goToday: () => void
  practice: () => void
}
export const FIRST_NAME = 'Kim'
export const upcomingSittings = () => EXAM_SITTINGS.filter((s) => daysUntil(s.date) >= 0)

// Public display fields from public/frameworks/ord_roots.json, ORD-ROOT-010.
// No internal editorial notes or unreviewed frequency claims in the fixture.
export const ROOT = {
  id: 'ORD-ROOT-010',
  root: 'o-',
  origin: 'Germanic',
  meaning: 'icke, inte; negationsprefix som vänder på betydelsen av efterföljande ord',
  example_words: [
    'obeslutsam',
    'obetydlig',
    'obegriplig',
    'obemedlad',
    'oberäknelig',
    'obehag',
    'obefogad',
    'oförskyllt',
    'oförrätt',
    'oförenlig',
  ],
}

// Exact rows from public/data/host-{2016,2021,2025}.json. Fidelity is tested
// against the bank. Only these three rows enter the lazy dev-only chunk.
export const QUESTIONS: readonly Question[] = [
  {
    qid: 'host-2016-verb2-ORD-004',
    exam_id: 'host-2016',
    provpass: 'verb2',
    section: 'ORD',
    number: 4,
    prompt: 'otidsenlig',
    options: [
      { letter: 'A', text: 'konstant' },
      { letter: 'B', text: 'otraditionell' },
      { letter: 'C', text: 'försenad' },
      { letter: 'D', text: 'omodern' },
      { letter: 'E', text: 'evig' },
    ],
    answer: 'D',
    context: null,
    figure: null,
    parsing_status: 'complete',
  },
  {
    qid: 'host-2021-verb2-ORD-003',
    exam_id: 'host-2021',
    provpass: 'verb2',
    section: 'ORD',
    number: 3,
    prompt: 'otjänlig',
    options: [
      { letter: 'A', text: 'otydlig' },
      { letter: 'B', text: 'orättvis' },
      { letter: 'C', text: 'oanvändbar' },
      { letter: 'D', text: 'obegriplig' },
      { letter: 'E', text: 'otillgänglig' },
    ],
    answer: 'C',
    context: null,
    figure: null,
    parsing_status: 'complete',
  },
  {
    qid: 'host-2025-verb2-ORD-010',
    exam_id: 'host-2025',
    provpass: 'verb2',
    section: 'ORD',
    number: 10,
    prompt: 'obemedlad',
    options: [
      { letter: 'A', text: 'hemlös' },
      { letter: 'B', text: 'fattig' },
      { letter: 'C', text: 'arbetslös' },
      { letter: 'D', text: 'ensam' },
      { letter: 'E', text: 'tanklös' },
    ],
    answer: 'B',
    context: null,
    figure: null,
    parsing_status: 'complete',
  },
]
