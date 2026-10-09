// Shared, headless pieces of the round-1 redesign bake-off
// (/dev/redesign-2026-bakeoff, bead hpf-qr0p.1).
//
// The four directions (a-folio, b-instrument, c-spar, d-lager) are each a
// self-contained design system: own tokens, type, components and motion.
// What they share lives here and has no look of its own:
//   - the bake-off's metadata (directions, screens, the five destinations)
//   - passage parsing and the ¶ citations explanations point at
//   - useDrill: the reading drill's state machine (select → lock → feedback
//     → next), kept in step with the switcher's screen
//   - small hooks: keyboard map, web-font injection, reduced motion
//   - Swedish number formatting

import {
  type RefCallback,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  EXPLANATIONS,
  type R1Question,
  SESSION,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import type { Explanation } from '@/data/explanations'
import type { AnswerLetter } from '@/data/questions'

// ── Bake-off metadata ────────────────────────────────────────────────

export type DirectionKey = 'a' | 'b' | 'c' | 'd'
export type ScreenKey = 1 | 2 | 3 | 4
export type WidthKey = 'desktop' | 'phone'
export type ThemeKey = 'light' | 'dark'

export type DirectionMeta = {
  key: DirectionKey
  /** Folder slug under components/devbake/redesign/. */
  slug: 'a-folio' | 'b-instrument' | 'c-spar' | 'd-lager'
  name: string
  tagline: string
  /** What makes it distinct, for the switcher's "Om" panel. */
  traits: string[]
  /** The known risk and how the direction answers it. */
  risk: string
  references: string
}

export const DIRECTIONS: DirectionMeta[] = [
  {
    key: 'a',
    slug: 'a-folio',
    name: 'Folio',
    tagline: 'Redaktionellt papper, nästa generation',
    traits: [
      'HP-Coach som en vackert satt bok: ett enda ark varmt papper, kolsvart bläck och en enda bläckblå accent – inga paneler, inga kort.',
      'Literata för texter, rubriker och menyn, Inter med optisk storlek för gränssnittet, tabellsiffror.',
      'Menyn är en innehållsförteckning i ord; hopfälld blir den ett tumregister med en bokstav per mål. Kontot öppnas som en papperslapp.',
      'Idag är en förstasida: det du läser är ingressen under en kraftig linje med ett bokmärkesband, resten av dagen en innehållsförteckning med punktlinjer, prognosen i marginalen.',
      'Läsfrågan är ett uppslag utan appfält: varje sida har sin egen sidhuvudrad, ryggen skuggas och kan flyttas. Facit börjar med varför ditt svar lockade; förklaringens citat stryks under i själva texten.',
    ],
    risk: 'Risk: för tyst. Svar: en enda fylld knapp per skärm och en ingress vars rubrik är sidans största föremål.',
    references: 'Readwise Reader, Things 3, Craft, Khan Academys typografi, Linears varma grå.',
  },
  {
    key: 'b',
    slug: 'b-instrument',
    name: 'Instrument',
    tagline: 'Precisionsverktyg för proffs',
    traits: [
      'Ett grått chassi som håller ljusa paneler: lager av ton och 1 px kant, hårda hörn, inga mjuka skuggor – och en enda signalorange accent för huvudhandlingen.',
      'Geist och Geist Mono för gränssnitt, siffror och tangenter; texten i Atkinson Hyperlegible Next. Rörelse under 100 ms.',
      'Panelerna är indelade i celler med mono-rubriker, avläsningar och tangentchips; en statusrad på varje skärm.',
      'Idag är en kommandolista: ↑/↓ väljer, ↵ öppnar, och dagens tidsaxel följer markeringen.',
      'Övningen är två paneler i chassit med en flyttbar springa emellan; efter svaret blir frågepanelen en facitpanel, och F döljer allt utom text och fråga.',
    ],
    risk: 'Risk: kan läsas som ett utvecklarverktyg. Svar: Idag hålls glest, varje kortkommando är också en synlig knapp, och F tar bort allt utom text och fråga.',
    references: 'Linear, Raycast, Superhuman, Notion Calendar, Vercel Geist.',
  },
  {
    key: 'c',
    slug: 'c-spar',
    name: 'Spår',
    tagline: 'En uttrycksfull lärstig',
    traits: [
      'Guidad, färgstark och motiverande men avgränsad: Material 3 Expressive-former och fjädrar.',
      'Bricolage Grotesque för rubriker, Figtree för gränssnitt och texter (18–19 px).',
      'Åtta delprovsfärger med samma ljushet och mättnad – bara i rubriker och etiketter, aldrig bakom brödtext och långt från rätt- och felfärgerna.',
      'Idag är en lodrät stig genom dagens steg. Frågan ligger i en bricka under texten som öppnas när du vill svara, på alla skärmar.',
      'Facit glider upp som ett ark som lämnar texten synlig, och varför fällan lockade kommer först.',
    ],
    risk: 'Risk: överlast och streak-ångest. Svar: ingen rörelse under läsning, ett lugnt läge och en förlåtande veckorytm utan förlust.',
    references: 'Brilliant, Duolingo 2026, Speak, Material 3 Expressive.',
  },
  {
    key: 'd',
    slug: 'd-lager',
    name: 'Lager',
    tagline: 'Rumsligt djup, glas på rätt sätt',
    traits: [
      'Ett ogenomskinligt läsark svävar över ett stilla, delprovsfärgat fält som tonas ned när läsningen börjar.',
      'Glas bara på navigering och kontroller – aldrig brödtext på glas.',
      'Newsreader för texter, systemets typsnitt (SF) med Inter som reserv, Fraunces för sällsynta rubriker.',
      'Tre nivåer: fält, ark och glaskontroller. En flytande docka med etiketter som krymper när sidan rullas men aldrig döljs.',
      'Frågan är ett eget ark bredvid texten; förklaringen läggs ovanpå som ett tredje ark.',
    ],
    risk: 'Risk: kontrast. Svar: kontrollerna testas mot den sämsta bakgrunden och får ogenomskinlig reserv.',
    references:
      'Apple Liquid Glass och HIG Materials, Things för OS 26, Arc/Dia; NN/g ”Liquid Glass Is Cracked” som lista över fel.',
  },
]

export type ScreenMeta = { key: ScreenKey; label: string; blurb: string }

export const SCREENS: ScreenMeta[] = [
  {
    key: 1,
    label: 'Idag',
    blurb:
      'Hem mitt i resan: nedräkning, ett dominerande fortsätt-kort, dagens plan, prognos med förbehåll, fällor och senaste passen.',
  },
  {
    key: 2,
    label: 'Läsfråga',
    blurb:
      'LÄS-övning i fokusläge: en riktig P5-text med styckenummer, ÖVNINGSTEXT-märkning, fyra alternativ med tangenter, tid och Avsluta. Välj och svara för att se facit.',
  },
  {
    key: 3,
    label: 'Facit',
    blurb:
      'Samma fråga efter ett felsvar: utfall med tecken och ord, rätt svar, lösningsgång, steg i två nivåer, varje distraktor, teknik och fallgrop med ¶-hänvisningar.',
  },
  {
    key: 4,
    label: 'Navigering',
    blurb:
      'Menyn i sitt andra läge: ihopfälld eller krympt, med konto och inställningar öppna. Utfälld meny syns på Idag och fokusläget på Läsfråga.',
  },
]

export const WIDTHS: { key: WidthKey; label: string }[] = [
  { key: 'desktop', label: 'Dator' },
  { key: 'phone', label: 'Telefon' },
]

export const THEMES: { key: ThemeKey; label: string }[] = [
  { key: 'light', label: 'Ljust' },
  { key: 'dark', label: 'Mörkt' },
]

/** What every direction component receives from the bake-off stage. */
export type DirectionProps = {
  screen: ScreenKey
  width: WidthKey
  theme: ThemeKey
  /** False in the side-by-side thumbnails: no clock, no key handlers, no
   *  focus moves and no entrance motion — a still picture of the screen. */
  live: boolean
  onScreen: (screen: ScreenKey) => void
  onTheme: (theme: ThemeKey) => void
}

// ── Shared information architecture ──────────────────────────────────

export type Destination = 'idag' | 'ova' | 'provpass' | 'uppslag' | 'framsteg'

export const DESTINATIONS: { id: Destination; label: string; blurb: string }[] = [
  { id: 'idag', label: 'Idag', blurb: 'Dagens plan och det du har påbörjat.' },
  { id: 'ova', label: 'Öva', blurb: 'Alla delprov, och Repetera för dina missar.' },
  { id: 'provpass', label: 'Provpass', blurb: 'Ett helt provpass under riktiga villkor.' },
  { id: 'uppslag', label: 'Uppslag', blurb: 'Lektioner och ramverk att slå upp.' },
  { id: 'framsteg', label: 'Framsteg', blurb: 'Prognos, delprov och historik.' },
]

/** The account/settings menu's entries, in order. */
export const ACCOUNT_ITEMS = ['Konto', 'Inställningar', 'Hjälp', 'Logga ut'] as const

// ── Numbers ──────────────────────────────────────────────────────────

/** 1.4 → "1,4" (the app's one-decimal Swedish score). */
export function fmtScore(n: number): string {
  return n.toFixed(1).replace('.', ',')
}

/** 0.1 → "+0,1", −0.1 → "−0,1" (real minus sign), 0 → "±0,0". */
export function fmtDelta(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '±'
  return `${sign}${fmtScore(Math.abs(n))}`
}

/** 564 → "09:24". */
export function fmtClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Passage ──────────────────────────────────────────────────────────

export type Passage = { paragraphs: string[]; byline: string | null }

/** Splits an exported P5 context into paragraphs and the trailing byline
 *  ("– Name, role" on its own line after the last paragraph). */
export function parsePassage(context: string): Passage {
  const paragraphs = context.split(/\n\n+/)
  let byline: string | null = null
  const last = paragraphs[paragraphs.length - 1]
  const cut = last.lastIndexOf('\n')
  if (cut !== -1 && /^[–-]\s/.test(last.slice(cut + 1))) {
    byline = last.slice(cut + 1)
    paragraphs[paragraphs.length - 1] = last.slice(0, cut)
  }
  return { paragraphs, byline }
}

const ORDINALS: Record<string, number> = {
  första: 1,
  andra: 2,
  tredje: 3,
  fjärde: 4,
  femte: 5,
  sjätte: 6,
  sjunde: 7,
  åttonde: 8,
  nionde: 9,
  tionde: 10,
}

const ORDINAL_RE = new RegExp(`(${Object.keys(ORDINALS).join('|')})\\s+stycket`, 'giu')

/** The quotations in a text. Swedish typography opens and closes with the
 *  same ”, so quotes are the odd-numbered pieces between them — a regex
 *  would happily take the gap between two quotations for a third. Only
 *  quotes of 12+ characters count (single words are too ambiguous). */
function quotations(text: string): string[] {
  return text
    .split('”')
    .filter((_, i, all) => i % 2 === 1 && i < all.length - 1)
    .filter((q) => q.trim().length >= 12)
}
// Years and proper names: kept only when exactly one paragraph has them.
const RARE_RE = /\b(1[5-9]\d\d)\b|(?<=[\p{Ll},;:]\s)(\p{Lu}\p{Ll}{4,})/gu

function normalise(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/[.,;:…]+$/u, '')
    .trim()
    .toLocaleLowerCase('sv-SE')
}

/**
 * The paragraph numbers (1-based) an explanation sentence points at:
 * "sjätte stycket", a quotation that occurs in the passage, or a year or
 * name that occurs in exactly one paragraph. The text itself is never
 * changed — the numbers become ¶ links beside it.
 */
export function citeParagraphs(text: string, paragraphs: string[]): number[] {
  const hay = paragraphs.map(normalise)
  const found = new Set<number>()
  for (const m of text.matchAll(ORDINAL_RE)) {
    const n = ORDINALS[m[1].toLocaleLowerCase('sv-SE')]
    if (n && n <= paragraphs.length) found.add(n)
  }
  for (const q of quotations(text)) {
    const needle = normalise(q)
    hay.forEach((p, i) => {
      if (p.includes(needle)) found.add(i + 1)
    })
  }
  for (const m of text.matchAll(RARE_RE)) {
    const token = (m[1] ?? m[2]).toLocaleLowerCase('sv-SE')
    // A genitive ("Grimlunds") counts as its name: the name must be rare.
    const stem = m[2] && token.endsWith('s') ? token.slice(0, -1) : token
    const hits = hay.flatMap((p, i) => (p.includes(stem) ? [i + 1] : []))
    if (hits.length === 1) found.add(hits[0])
  }
  return [...found].sort((a, b) => a - b)
}

/** A verbatim quotation from the passage, located: paragraph number and
 *  the character range inside that paragraph's text. */
export type QuoteSpan = { para: number; start: number; end: number }

/** A quotation an explanation part makes, for sentence-level evidence marks.
 *  `source` names the part: "step-2", or "why-A" for a distractor's why_wrong. */
export type QuoteMark = QuoteSpan & { source: string }

/**
 * Where a piece of explanation quotes the passage verbatim (”…” of 12+
 * characters): each match's paragraph and character range. A quote's own
 * closing punctuation may or may not be in the passage; case may differ at
 * the start. Nothing is rewritten — callers mark the ranges.
 */
export function findQuotes(text: string, paragraphs: string[]): QuoteSpan[] {
  const out: QuoteSpan[] = []
  const lower = paragraphs.map((p) => p.toLocaleLowerCase('sv-SE'))
  for (const q of quotations(text)) {
    const quote = q.replace(/\s+/g, ' ').trim()
    for (const needle of [quote, quote.replace(/[.,;:…]+$/u, '')]) {
      const n = needle.toLocaleLowerCase('sv-SE')
      const hits = lower.flatMap((p, i) => {
        const at = p.indexOf(n)
        return at === -1 ? [] : [{ para: i + 1, start: at, end: at + needle.length }]
      })
      if (hits.length) {
        out.push(...hits)
        break
      }
    }
  }
  return out
}

export type StepRefSegment =
  | { kind: 'text'; text: string }
  | { kind: 'ref'; text: string; steps: number[] }

const STEP_REF_RE = /\((?:steg|steps?)\s+(\d+)(?:\s*(?:–|-|och|and)\s*(\d+))?\)/gu

/** Splits text around its "(steg 2)" / "(steg 2–3)" / "(steps 2 and 3)"
 *  references so a renderer can make them jump to the step. Verbatim. */
export function splitStepRefs(text: string): StepRefSegment[] {
  const out: StepRefSegment[] = []
  let last = 0
  for (const m of text.matchAll(STEP_REF_RE)) {
    const at = m.index ?? 0
    if (at > last) out.push({ kind: 'text', text: text.slice(last, at) })
    const from = Number(m[1])
    const to = m[2] ? Number(m[2]) : from
    const steps: number[] = []
    for (let n = from; n <= to; n++) steps.push(n)
    out.push({ kind: 'ref', text: m[0], steps })
    last = at + m[0].length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

// ── Drill state ──────────────────────────────────────────────────────

export type DrillPhase = 'question' | 'feedback' | 'done'

export type DrillResult = { qid: string; pick: AnswerLetter; correct: boolean }

export type DrillView = {
  index: number
  question: R1Question
  explanation: Explanation
  phase: DrillPhase
  /** Highlighted before the answer is locked. */
  selected: AnswerLetter | null
  /** The locked answer (feedback). */
  picked: AnswerLetter | null
  correct: boolean | null
  eliminated: ReadonlySet<AnswerLetter>
  /** Answers given in this sitting, the current one included once locked. */
  results: DrillResult[]
  total: number
  elapsed: number
  /** The paragraph focus aid (1-based), or null when off. */
  focusPara: number | null
  /** A cited paragraph, briefly marked after a ¶ link is followed. */
  flashPara: number | null
  /** The explanation part (QuoteMark.source) whose quotations are briefly
   *  marked after its ¶ link is followed, or null. */
  flashSource: string | null
  /** Detail-tier steps the reader has opened. */
  openSteps: ReadonlySet<number>
  passage: Passage
  /** ¶ citations per step number and per distractor letter. */
  stepCites: Record<number, number[]>
  distractorCites: Record<string, { tempting: number[]; wrong: number[] }>
  /** Every paragraph the explanation cites (for margin marks). */
  cited: number[]
  /** Sentence-level evidence: the passage quotations the steps make
   *  ("step-N") and each distractor's why_wrong makes ("why-L"). */
  marks: QuoteMark[]
}

export type DrillActions = {
  select: (letter: AnswerLetter) => void
  lock: () => void
  toggleEliminate: (letter: AnswerLetter) => void
  next: () => void
  exit: () => void
  setFocusPara: (n: number | null) => void
  moveFocusPara: (delta: 1 | -1) => void
  /** Scrolls the passage to paragraph n and marks it for a moment; with a
   *  `source`, that part's quotations are marked too (flashSource). */
  cite: (n: number, source?: string) => void
  toggleStep: (n: number) => void
  /** Opens (if detail) and scrolls to step n of the explanation. */
  goToStep: (n: number) => void
  restart: () => void
}

export type DrillRefs = {
  /** Attach to each paragraph element (1-based number). */
  para: (n: number) => RefCallback<HTMLElement>
  /** Attach to each explanation step element. */
  step: (n: number) => RefCallback<HTMLElement>
}

const PASSAGE = parsePassage(UNIT.context)

function citesFor(e: Explanation) {
  const stepCites: Record<number, number[]> = {}
  for (const s of e.steps ?? []) stepCites[s.n] = citeParagraphs(s.text, PASSAGE.paragraphs)
  const distractorCites: Record<string, { tempting: number[]; wrong: number[] }> = {}
  for (const d of e.distractors) {
    distractorCites[d.letter] = {
      tempting: citeParagraphs(d.why_tempting, PASSAGE.paragraphs),
      wrong: citeParagraphs(d.why_wrong, PASSAGE.paragraphs),
    }
  }
  const marks: QuoteMark[] = []
  for (const s of e.steps ?? []) {
    for (const q of findQuotes(s.text, PASSAGE.paragraphs))
      marks.push({ ...q, source: `step-${s.n}` })
  }
  for (const d of e.distractors) {
    for (const q of findQuotes(d.why_wrong, PASSAGE.paragraphs)) {
      marks.push({ ...q, source: `why-${d.letter}` })
    }
  }
  const all = new Set<number>()
  for (const list of Object.values(stepCites)) for (const n of list) all.add(n)
  for (const c of Object.values(distractorCites))
    for (const n of [...c.tempting, ...c.wrong]) all.add(n)
  return { stepCites, distractorCites, cited: [...all].sort((a, b) => a - b), marks }
}

function earlierResults(): DrillResult[] {
  return SESSION.earlier.map(({ qid, pick }) => {
    const q = UNIT.questions.find((x) => x.qid === qid) as R1Question
    return { qid, pick, correct: q.answer === pick }
  })
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** The nearest ancestor that scrolls vertically (overflow auto/scroll). */
function scroller(el: HTMLElement): HTMLElement | null {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY
    if (y === 'auto' || y === 'scroll') return n
  }
  return null
}

/**
 * Scrolls an element into view inside its own scroller only — never the
 * clipping ancestors around it (scrollIntoView would shift an overflow:
 * hidden stage or frame too). `center` centres it; `nearest` scrolls the
 * least; `start` puts it a little below the scroller's top. Instant under
 * reduced motion; a no-op without layout (jsdom).
 */
function reveal(el: HTMLElement | undefined, block: 'center' | 'nearest' | 'start'): void {
  if (!el) return
  const box = scroller(el)
  if (!box || typeof box.scrollTo !== 'function') return
  const b = box.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const top = r.top - b.top + box.scrollTop
  let target = box.scrollTop
  if (block === 'center') target = top - (b.height - Math.min(r.height, b.height)) / 2
  else if (block === 'start') target = top - 56
  else if (r.top < b.top + 16) target = top - 16
  else if (r.bottom > b.bottom - 16) target = top + r.height - b.height + 16
  box.scrollTo({ top: Math.max(0, target), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

type Core = {
  index: number
  phase: DrillPhase
  selected: AnswerLetter | null
  picked: AnswerLetter | null
  eliminated: AnswerLetter[]
  results: DrillResult[]
}

function startCore(screen: ScreenKey): Core {
  const index = SESSION.startIndex
  const q = UNIT.questions[index]
  if (screen === 3) {
    const pick = SESSION.wrongPick[q.qid]
    return {
      index,
      phase: 'feedback',
      selected: pick,
      picked: pick,
      eliminated: [],
      results: [...earlierResults(), { qid: q.qid, pick, correct: pick === q.answer }],
    }
  }
  return {
    index,
    phase: 'question',
    selected: null,
    picked: null,
    eliminated: [],
    results: earlierResults(),
  }
}

/**
 * The reading drill's state, shared by all four directions. Screen 2 opens
 * question 3 of the unit unanswered; screen 3 opens it graded with the
 * fixture's wrong pick. Answering on screen 2 moves the switcher to 3 (and
 * "Nästa" back to 2) without a remount, so the reader's own answer stays.
 */
export function useDrill({
  screen,
  onScreen,
  live,
}: {
  screen: ScreenKey
  onScreen: (s: ScreenKey) => void
  live: boolean
}): { view: DrillView; act: DrillActions; refs: DrillRefs } {
  const [core, setCore] = useState<Core>(() => startCore(screen))
  // The latest state for event handlers that must decide synchronously
  // (lock and next also move the switcher).
  const coreRef = useRef(core)
  coreRef.current = core
  const [elapsed, setElapsed] = useState(SESSION.elapsedSeconds)
  const [focusPara, setFocusPara] = useState<number | null>(null)
  const focusRef = useRef(focusPara)
  focusRef.current = focusPara
  const [flashPara, setFlashPara] = useState<number | null>(null)
  const [flashSource, setFlashSource] = useState<string | null>(null)
  const [openSteps, setOpenSteps] = useState<number[]>([])
  const paraEls = useRef(new Map<number, HTMLElement>())
  const stepEls = useRef(new Map<number, HTMLElement>())
  const flashTimer = useRef<number | undefined>(undefined)

  // Keep in step with the switcher: a click on "Facit" while a question is
  // open grades it with the fixture's wrong pick; "Läsfråga" while graded
  // reopens the same question.
  useLayoutEffect(() => {
    setCore((c) => {
      const q = UNIT.questions[c.index]
      if (screen === 3 && c.phase === 'question') {
        const pick = c.selected ?? SESSION.wrongPick[q.qid] ?? q.options[0].letter
        return {
          ...c,
          phase: 'feedback',
          selected: pick,
          picked: pick,
          results: [...c.results, { qid: q.qid, pick, correct: pick === q.answer }],
        }
      }
      if (screen === 2 && c.phase === 'feedback') {
        return {
          ...c,
          phase: 'question',
          selected: null,
          picked: null,
          eliminated: [],
          results: c.results.filter((r) => r.qid !== q.qid),
        }
      }
      if (screen === 2 && c.phase === 'done') return startCore(2)
      return c
    })
  }, [screen])

  // The session clock: ticks while live and not finished.
  const ticking = live && core.phase !== 'done'
  useEffect(() => {
    if (!ticking) return
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [ticking])

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const clearFlash = useCallback(() => {
    window.clearTimeout(flashTimer.current)
    setFlashPara(null)
    setFlashSource(null)
  }, [])

  const question = UNIT.questions[core.index]
  const explanation = EXPLANATIONS[question.qid]
  const cites = useMemo(() => citesFor(explanation), [explanation])

  const select = useCallback((letter: AnswerLetter) => {
    setCore((c) =>
      c.phase === 'question'
        ? { ...c, selected: letter, eliminated: c.eliminated.filter((l) => l !== letter) }
        : c,
    )
  }, [])

  const lock = useCallback(() => {
    const c = coreRef.current
    if (c.phase !== 'question' || !c.selected) return
    const q = UNIT.questions[c.index]
    const next: Core = {
      ...c,
      phase: 'feedback',
      picked: c.selected,
      results: [...c.results, { qid: q.qid, pick: c.selected, correct: c.selected === q.answer }],
    }
    coreRef.current = next
    setCore(next)
    setOpenSteps([])
    clearFlash()
    onScreen(3)
  }, [onScreen, clearFlash])

  const toggleEliminate = useCallback((letter: AnswerLetter) => {
    setCore((c) => {
      if (c.phase !== 'question') return c
      const on = c.eliminated.includes(letter)
      return {
        ...c,
        eliminated: on ? c.eliminated.filter((l) => l !== letter) : [...c.eliminated, letter],
        selected: !on && c.selected === letter ? null : c.selected,
      }
    })
  }, [])

  const next = useCallback(() => {
    const c = coreRef.current
    if (c.phase !== 'feedback') return
    const more = c.index + 1 < UNIT.questions.length
    const following: Core = more
      ? {
          ...c,
          index: c.index + 1,
          phase: 'question',
          selected: null,
          picked: null,
          eliminated: [],
        }
      : { ...c, phase: 'done' }
    coreRef.current = following
    setCore(following)
    setOpenSteps([])
    setFocusPara(null)
    // A mark from this question's explanation must not hint at the next.
    clearFlash()
    if (more) onScreen(2)
  }, [onScreen, clearFlash])

  const exit = useCallback(() => onScreen(1), [onScreen])

  const restart = useCallback(() => {
    setCore(startCore(2))
    setElapsed(SESSION.elapsedSeconds)
    setOpenSteps([])
    onScreen(2)
  }, [onScreen])

  const moveFocusPara = useCallback((delta: 1 | -1) => {
    const count = PASSAGE.paragraphs.length
    const n = focusRef.current
    const nextN = n == null ? (delta > 0 ? 1 : count) : Math.min(count, Math.max(1, n + delta))
    setFocusPara(nextN)
    reveal(paraEls.current.get(nextN), 'center')
  }, [])

  const cite = useCallback((n: number, source?: string) => {
    // A frame later, so a phone sheet can fold away before the scroll.
    window.requestAnimationFrame(() => reveal(paraEls.current.get(n), 'center'))
    setFlashPara(n)
    setFlashSource(source ?? null)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => {
      setFlashPara(null)
      setFlashSource(null)
    }, 2400)
  }, [])

  const toggleStep = useCallback((n: number) => {
    setOpenSteps((open) => (open.includes(n) ? open.filter((x) => x !== n) : [...open, n]))
  }, [])

  const goToStep = useCallback((n: number) => {
    setOpenSteps((open) => (open.includes(n) ? open : [...open, n]))
    // Let the step expand before scrolling to it.
    window.requestAnimationFrame(() => reveal(stepEls.current.get(n), 'nearest'))
  }, [])

  const paraRef = useCallback(
    (n: number): RefCallback<HTMLElement> =>
      (el) => {
        if (el) paraEls.current.set(n, el)
        else paraEls.current.delete(n)
      },
    [],
  )
  const stepRef = useCallback(
    (n: number): RefCallback<HTMLElement> =>
      (el) => {
        if (el) stepEls.current.set(n, el)
        else stepEls.current.delete(n)
      },
    [],
  )

  const view: DrillView = {
    index: core.index,
    question,
    explanation,
    phase: core.phase,
    selected: core.selected,
    picked: core.picked,
    correct: core.picked ? core.picked === question.answer : null,
    eliminated: new Set(core.eliminated),
    results: core.results,
    total: UNIT.questions.length,
    elapsed,
    focusPara,
    flashPara,
    flashSource,
    openSteps: new Set(openSteps),
    passage: PASSAGE,
    ...cites,
  }

  return {
    view,
    act: {
      select,
      lock,
      toggleEliminate,
      next,
      exit,
      setFocusPara,
      moveFocusPara,
      cite,
      toggleStep,
      goToStep,
      restart,
    },
    refs: { para: paraRef, step: stepRef },
  }
}

// ── Phone question sheet ─────────────────────────────────────────────

export type SheetState = 'peek' | 'open' | 'full'

/**
 * The phone question sheet: it peeks (the prompt) while the reader reads,
 * opens to the options, and goes full for the explanation. A new question
 * re-seats it at peek, a verdict at full. The grab handle toggles on a tap
 * and steps one state per vertical drag of 24 px or more.
 */
export function useSheet(view: Pick<DrillView, 'phase' | 'index'>) {
  const feedback = view.phase === 'feedback'
  const [state, setState] = useState<SheetState>(feedback ? 'full' : 'peek')
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new question (index) re-seats the sheet too
  useEffect(() => {
    setState(feedback ? 'full' : 'peek')
  }, [feedback, view.index])
  const dragFrom = useRef<number | null>(null)
  const dragged = useRef(false)
  const toggle = useCallback(
    () => setState((s) => (s === 'peek' ? (feedback ? 'full' : 'open') : 'peek')),
    [feedback],
  )
  const grab = {
    onPointerDown: (e: { clientY: number }) => {
      dragFrom.current = e.clientY
      dragged.current = false
    },
    onPointerUp: (e: { clientY: number }) => {
      if (dragFrom.current == null) return
      const dy = e.clientY - dragFrom.current
      dragFrom.current = null
      if (Math.abs(dy) < 24) return
      dragged.current = true
      if (dy < 0) setState((s) => (s === 'peek' ? 'open' : 'full'))
      else setState((s) => (s === 'full' ? 'open' : 'peek'))
    },
    onClick: () => {
      if (dragged.current) dragged.current = false
      else toggle()
    },
  }
  return { state, setState, toggle, grab }
}

/** Hides a phone drill's head while the reader scrolls down the passage
 *  and brings it back on any scroll up (or near the top). */
export function useHideOnScroll(threshold = 56) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const onScroll = useCallback(
    (e: { currentTarget: HTMLElement }) => {
      const y = e.currentTarget.scrollTop
      const dy = y - lastY.current
      if (y < threshold) setHidden(false)
      else if (dy > 4) setHidden(true)
      else if (dy < -4) setHidden(false)
      lastY.current = y
    },
    [threshold],
  )
  return { hidden, onScroll }
}

// ── Hooks ────────────────────────────────────────────────────────────

/** True when a key event belongs to a text field or another widget that
 *  owns its own keys, or carries a command modifier. */
export function isForeignKey(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true
  const t = e.target
  if (!(t instanceof HTMLElement)) return false
  if (t.isContentEditable) return true
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  const role = t.getAttribute('role')
  return role === 'slider' || role === 'textbox' || role === 'separator'
}

function isControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('button, a[href], summary, [role="button"], [role="menuitem"]') != null
  )
}

/**
 * A direction's keyboard map, active while `enabled`. Listens in the
 * capture phase so the direction sees its keys before the bake-off's
 * switcher does, and marks handled events (defaultPrevented) so the
 * switcher leaves them alone. Keys are matched on `e.key`, case-folded;
 * "Shift+a" matches a shifted letter.
 */
export function useKeyMap(map: Record<string, () => void>, enabled: boolean): void {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isForeignKey(e)) return
      // Enter and Space on a focused control keep their native meaning.
      if ((e.key === 'Enter' || e.key === ' ') && isControl(e.target)) return
      const key = e.key.length === 1 ? e.key.toLocaleLowerCase('sv-SE') : e.key
      const name = e.shiftKey && e.key.length === 1 ? `Shift+${key}` : key
      const handler = ref.current[name]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [enabled])
}

/**
 * Injects a Google Fonts stylesheet the first time a direction mounts —
 * never in app/index.html, so no other page pays for these faces. The link
 * stays for the session: dropping it would unload faces the other mounted
 * thumbnails still use.
 */
export function useWebFonts(id: string, href: string): void {
  useEffect(() => {
    if (document.head.querySelector(`link[data-rb26-font="${id}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.rb26Font = id
    document.head.appendChild(link)
  }, [id, href])
}

/** Closes a popover on Escape or a pointer press outside `ref`. */
export function useDismiss(
  open: boolean,
  close: () => void,
  ref: { current: HTMLElement | null },
): void {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onDown, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onDown, true)
    }
  }, [open, close, ref])
}
