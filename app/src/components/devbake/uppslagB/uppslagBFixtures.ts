import type { ExplanationStep } from '@/data/explanations'
import { PROVTEKNIK } from '@/data/frameworks'
import type { Question } from '@/data/questions'
import type { PaletteKey } from '@/lib/tokens'

export const DIRECTIONS = [
  { key: 'a', name: 'Marginal', description: 'Råd i marginalen. Lösningen i läsningen.' },
  { key: 'b', name: 'Kort', description: 'Ett råd per sida. Ett steg i taget.' },
  { key: 'c', name: 'Tavla', description: 'Frågan till vänster. Arbetet till höger.' },
] as const
export const VIEWS = [
  { key: 1, label: 'Provteknik · innehåll' },
  { key: 2, label: 'Ett råd med steg' },
  { key: 3, label: 'UHR:s tider' },
  { key: 4, label: 'NOG-tabellen' },
  { key: 5, label: 'Exempel · steg 1' },
  { key: 6, label: 'Exempel · halvvägs' },
  { key: 7, label: 'Exempel · försök själv' },
  { key: 8, label: 'Exempel · svar' },
] as const
export const PALETTES: { key: PaletteKey; label: string }[] = [
  { key: 'spalt', label: 'Spalt' },
  { key: 'sand', label: 'Sand' },
  { key: 'sage', label: 'Salvia' },
  { key: 'ink', label: 'Bläck' },
  { key: 'rose', label: 'Ros' },
]
export type Selection = {
  d: (typeof DIRECTIONS)[number]['key']
  s: (typeof VIEWS)[number]['key']
  e: number
  w: 'desktop' | 'phone'
  t: 'light' | 'dark'
  p: PaletteKey
  sbs: boolean
}
export const ENTRIES = PROVTEKNIK.entries
export type StudyFlow = {
  sel: Selection
  entry: (typeof ENTRIES)[number]
  entryIndex: number
  openEntry: (index: number) => void
  contents: () => void
  revealed: number
  next: () => void
  restart: () => void
}

// Exact display fields from the manifest and host-2017 bank/explanation.
// Only this one example enters the lazy dev chunk; fidelity is tested.
export const EXAMPLE = {
  entryId: 'KVA-TRAP-001',
  section: 'KVA',
  qid: 'host-2017-kvant1-KVA-021',
} as const

export const QUESTION: Question = {
  qid: 'host-2017-kvant1-KVA-021',
  exam_id: 'host-2017',
  provpass: 'kvant1',
  section: 'KVA',
  number: 21,
  prompt: '\uE000x^{2}\uE001 = \uE000y^{2}\uE001 Kvantitet I:\t x Kvantitet II:\t y',
  options: [
    {
      letter: 'A',
      text: 'I är större än II',
    },
    {
      letter: 'B',
      text: 'II är större än I',
    },
    {
      letter: 'C',
      text: 'I är lika med II',
    },
    {
      letter: 'D',
      text: 'informationen är otillräcklig',
    },
  ],
  answer: 'D',
  context: null,
  figure: null,
  parsing_status: 'complete',
}

export const STEPS: ExplanationStep[] = [
  {
    n: 1,
    text: 'Vi vet att \uE000x^{2} = y^{2}\uE001. Vi ska jämföra x och y direkt (utan kvadrering).',
    tier: 'essential',
    title: 'Förstå problemet',
  },
  {
    n: 2,
    text: "Två tal har samma kvadrat. Det händer i två fall: (1) de är lika (x = y), eller (2) de är 'spegelvända' kring noll (x = −y). Exempel: \uE0003^{2} = 9\uE001 och \uE000(-3)^{2} = 9\uE001 — så 3 och −3 har samma kvadrat.",
    tier: 'essential',
    title: 'Vad betyder x² = y²?',
  },
  {
    n: 3,
    text: '\uE000a^{2} = a \\cdot a\uE001. Om a > 0, är produkten positiv. Om a < 0, är negativt gånger negativt också positivt. Båda 3 och −3 ger samma kvadrat 9.',
    tier: 'detail',
    title: "Varför kvadrering 'tappar tecken'?",
  },
  {
    n: 4,
    text: 'Om x = y = 0, så är x² = y² = 0 trivialt uppfyllt och x = y. Det är ett specialfall där I = II.',
    tier: 'detail',
    title: 'Vad sägs om noll?',
  },
  {
    n: 5,
    text: 'Om x = y = 5, då är x² = y² = 25 (uppfyllt) och Kvantitet I = Kvantitet II. C skulle stämma.',
    tier: 'essential',
    title: 'Testa fall 1: x = y',
  },
  {
    n: 6,
    text: 'Om x = 5, y = −5, då är x² = 25 = y² (uppfyllt). Kvantitet I = 5, Kvantitet II = −5. Här är I > II. A skulle stämma.',
    tier: 'essential',
    title: 'Testa fall 2: x = −y',
  },
  {
    n: 7,
    text: 'Om x = −5, y = 5, då är x² = 25 = y² (uppfyllt). Kvantitet I = −5, Kvantitet II = 5. Här är I < II. B skulle stämma.',
    tier: 'essential',
    title: 'Testa fall 3: x = −y med motsatt tecken',
  },
  {
    n: 8,
    text: 'Med samma villkor x² = y² kan svaret bli A, B eller C beroende på exakta värden. Inget enda svar fungerar för alla giltiga val.',
    tier: 'detail',
    title: 'Sammanfatta',
  },
  {
    n: 9,
    text: "Ja — t.ex. 'x > 0 och y > 0' skulle låsa x = y. Utan sådan extra info räcker villkoret inte.",
    tier: 'detail',
    title: 'Behövs mer information?',
  },
  {
    n: 10,
    text: 'Eftersom utfallet beror på okänd information saknas tillräcklig info. Svaret är D. Insikten i en mening: x² = y² ger |x| = |y|, inte x = y — kvadratrot tar fram absolutbelopp, inte tecken.',
    tier: 'essential',
    title: 'Slutsats',
  },
]

export const ESSENTIAL = STEPS.filter((step) => step.tier === 'essential')
