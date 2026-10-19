// Shared, headless pieces of the redesign bake-off
// (/dev/redesign-2026-bakeoff, beads hpf-qr0p.1, hpf-qr0p.2 and, for kit
// v2, hpf-qr0p.7 — docs/redesign/kit-v2.md).
//
// The eight directions (a-folio … h-ljuskagla) are each a self-contained
// design system: own tokens, type, components and motion. Each folder owns
// its metadata (meta.ts) and its stage; the registry (directions.ts)
// collects them. What they share lives here and has no look of its own:
//   - the bake-off's metadata types, its fourteen screens and the five
//     destinations
//   - passage parsing and the ¶ citations explanations point at (from
//     drillCore.ts, re-exported here)
//   - useDrill: round 1's reading drill — drillCore's state machine fed
//     with the round-1 unit and kept in step with the switcher's screen
//   - small hooks: keyboard map, web-font injection, reduced motion
//   - Swedish number formatting
// Round 2 adds the view model (viewModel.ts), its data context
// (directionData.tsx), the drill core (drillCore.ts) and the rd-* contract
// (contract.ts).

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import {
  type DrillCoreActions,
  type DrillCoreRefs,
  type DrillPhase,
  type DrillResult,
  type Passage,
  parsePassage,
  type QuoteMark,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import {
  EXPLANATIONS,
  type R1Question,
  SESSION,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import type { DrillQuestion } from '@/components/devbake/redesign/viewModel'
import type { Explanation } from '@/data/explanations'
import type { AnswerLetter } from '@/data/questions'

export {
  citeParagraphs,
  type DrillPhase,
  type DrillResult,
  findQuotes,
  type Passage,
  parsePassage,
  prefersReducedMotion,
  type QuoteMark,
  type QuoteSpan,
  type StepRefSegment,
  splitStepRefs,
} from '@/components/devbake/redesign/drillCore'

// ── Bake-off metadata ────────────────────────────────────────────────

export type DirectionKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
/** Round 1's four screens. Kept as it was: the round-1 directions' own
 *  tests key records and loops on exactly these. */
export type ScreenKey = 1 | 2 | 3 | 4
/** Every screen of the bake-off, 1–14 (APP_SCREENS). */
export type AppScreenKey = ScreenKey | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
export type WidthKey = 'desktop' | 'phone'
export type ThemeKey = 'light' | 'dark'

/** A direction's entry in the registry, kept in its folder's meta.ts. */
export type DirectionMeta = {
  key: DirectionKey
  /** Folder slug under components/devbake/redesign/. */
  slug:
    | 'a-folio'
    | 'b-instrument'
    | 'c-spar'
    | 'd-lager'
    | 'e-svep'
    | 'f-samtal'
    | 'g-raster'
    | 'h-ljuskagla'
  name: string
  tagline: string
  /** What makes it distinct, for the switcher's "Om" panel. */
  traits: string[]
  /** The known risk and how the direction answers it. */
  risk: string
  references: string
  /** The folder's stage is still the "Under arbete" placeholder
   *  (DirectionStub). Drop it when the direction is built. */
  stub?: true
  /** The screens the direction has built. Absent: round 1's four
   *  (directions.ts DEFAULT_SCREENS). On any other screen the stage shows
   *  the shared "Inte byggd än" card instead of the direction. */
  screens?: AppScreenKey[]
}

// The directions in key order. They live in the registry; this re-export
// keeps the older imports from r1Kit working.
export { DIRECTIONS } from '@/components/devbake/redesign/directions'

export type ScreenMeta = { key: ScreenKey; label: string; blurb: string }

/** Round 1's four screens (APP_SCREENS starts with them). */
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

export type AppScreenMeta = {
  key: AppScreenKey
  label: string
  /** The switcher's button text. */
  short: string
  blurb: string
  /** 1: round 1's screens; 2: the rest of the app, added in round 2. */
  round: 1 | 2
}

/** Every screen of the bake-off, in the switcher's order. */
export const APP_SCREENS: AppScreenMeta[] = [
  ...SCREENS.map((s) => ({ ...s, short: s.label, round: 1 as const })),
  {
    key: 5,
    label: 'Öva',
    short: 'Öva',
    round: 2,
    blurb:
      'Alla åtta delprov på en sida: poäng, väntande missar och det svagaste utpekat, Repetera med det som är redo nu, blandad övning och de vanligaste fällorna. Ett delprov startar dess övning.',
  },
  {
    key: 6,
    label: 'Kvantfråga',
    short: 'Kvantfråga',
    round: 2,
    blurb:
      'Kvantövning i fokusläge med tre riktiga provfrågor: XYZ med matematik, KVA med Kvantitet I och II och de fyra fasta alternativen, NOG med två påståenden och fem alternativ. Välj, stryk och svara; facit med steg.',
  },
  {
    key: 7,
    label: 'DTK',
    short: 'DTK',
    round: 2,
    blurb:
      'Ett DTK-underlag från ett riktigt prov – en tabell – bredvid frågan, att förstora och vrida, med alternativen inom räckhåll. Svara för att se facit.',
  },
  {
    key: 8,
    label: 'Repetera',
    short: 'Repetera',
    round: 2,
    blurb:
      'Missarna som väntar: de som är redo nu först, sedan resten av dagens hög, var och en med delprov, fråga och fälla. En tydlig start för dagens repetition.',
  },
  {
    key: 9,
    label: 'Provpass',
    short: 'Provpass',
    round: 2,
    blurb:
      'Provpassets nav: verbal och kvantitativ halva, riktiga pass med hur mycket du redan sett, tidigare resultat och reglerna. Starta ett pass för att se det pågå: klocka, frågerutnät och markeringar.',
  },
  {
    key: 10,
    label: 'Provpassresultat',
    short: 'Resultat',
    round: 2,
    blurb:
      'Det inlämnade passet: rätt av presenterade, den normerade poängen, varje delprov med sin tid mot sin andel av 55 minuter, hur mycket du sett förut och tidigare pass.',
  },
  {
    key: 11,
    label: 'Framsteg',
    short: 'Framsteg',
    round: 2,
    blurb:
      'Prognos med förbehåll och veckokurva, alla åtta delprov med poäng och osäkerhet, veckans rytm utan något att förlora och Historik över passen.',
  },
  {
    key: 12,
    label: 'Uppslag & lektion',
    short: 'Uppslag',
    round: 2,
    blurb:
      'Ramverken per delprov med vad du har läst, och en öppen lektion: angreppssätt, typiska fällor och övning på just den frågetypen.',
  },
  {
    key: 13,
    label: 'Konto & inställningar',
    short: 'Konto',
    round: 2,
    blurb:
      'Konto och inställningar: namn och e-post, palett, läge, typsnitt, täthet och coachens röst, export av din data och en radering som kräver bekräftelse.',
  },
  {
    key: 14,
    label: 'ELF-läsfråga',
    short: 'ELF',
    round: 2,
    blurb:
      'Engelsk läsförståelse: en riktig P5-text på engelska med ÖVNINGSTEXT-märkning, frågan och fyra alternativ. Svara för att se facit.',
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
  /** The screen on stage — always one the direction declares
   *  (DirectionMeta.screens); round-1 directions only ever see 1–4. */
  screen: AppScreenKey
  width: WidthKey
  theme: ThemeKey
  /** False in the side-by-side thumbnails: no clock, no key handlers, no
   *  focus moves and no entrance motion — a still picture of the screen. */
  live: boolean
  /** Moves the switcher between round 1's screens (a lock opens Facit,
   *  Nästa Läsfråga, Avsluta Idag). Round-2 screens ask for a destination,
   *  drill or lesson through useDirectionData().actions instead. */
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

// ── Round 1's reading drill ──────────────────────────────────────────

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

export type DrillActions = Pick<
  DrillCoreActions,
  | 'select'
  | 'toggleEliminate'
  | 'setFocusPara'
  | 'moveFocusPara'
  | 'cite'
  | 'toggleStep'
  | 'goToStep'
> & {
  lock: () => void
  next: () => void
  exit: () => void
  restart: () => void
}

export type DrillRefs = DrillCoreRefs

const PASSAGE = parsePassage(UNIT.context)

/** The round-1 unit as drill-core questions (built once, so the core sees
 *  the same objects every render). */
const R1_DRILL: DrillQuestion[] = UNIT.questions.map((q) => ({
  qid: q.qid,
  section: UNIT.section,
  number: q.number,
  prompt: q.prompt,
  options: q.options.map(({ letter, text }) => ({ letter, text })),
  answer: q.answer,
  passage: { ...PASSAGE, title: UNIT.title, lang: 'sv', synthetic: true, unitId: UNIT.unitId },
  figure: null,
  math: false,
  source: {
    examId: `p5-${UNIT.unitId}-r${UNIT.revision}`,
    provpass: null,
    authentic: false,
    label: UNIT.title,
  },
}))

function earlierResults(): DrillResult[] {
  return SESSION.earlier.map(({ qid, pick }) => {
    const q = UNIT.questions.find((x) => x.qid === qid) as R1Question
    return { qid, pick, correct: q.answer === pick }
  })
}

/**
 * The reading drill's state, shared by every round-1 direction. Screen 2
 * opens question 3 of the unit unanswered; screen 3 opens it graded with
 * the fixture's wrong pick. Answering on screen 2 moves the switcher to 3
 * (and "Nästa" back to 2) without a remount, so the reader's own answer
 * stays. drillCore holds the state; this keeps it in step with the
 * switcher.
 */
export function useDrill({
  screen,
  onScreen,
  live,
}: {
  screen: AppScreenKey
  onScreen: (s: ScreenKey) => void
  live: boolean
}): { view: DrillView; act: DrillActions; refs: DrillRefs } {
  const [start] = useState(() => ({
    index: SESSION.startIndex,
    results: earlierResults(),
    graded: screen === 3 ? SESSION.wrongPick[UNIT.questions[SESSION.startIndex].qid] : undefined,
  }))
  const core = useDrillCore({
    questions: R1_DRILL,
    explanations: EXPLANATIONS,
    start,
    elapsed: SESSION.elapsedSeconds,
    live,
  })
  // The core's actions are stable; its `act` object is not.
  const c = core.act
  const { gradeAs, reopen, reset, lock: coreLock, next: coreNext, restart: coreRestart } = c
  const phase = core.view.phase

  // Keep in step with the switcher: a click on "Facit" while a question is
  // open grades it with the fixture's wrong pick; "Läsfråga" while graded
  // reopens the same question, and after the last one starts over.
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the switcher's screen only
  useLayoutEffect(() => {
    if (screen === 3 && phase === 'question') gradeAs((q) => SESSION.wrongPick[q.qid])
    else if (screen === 2 && phase === 'feedback') reopen()
    else if (screen === 2 && phase === 'done') reset()
  }, [screen])

  const lock = useCallback(() => {
    if (coreLock()) onScreen(3)
  }, [coreLock, onScreen])
  const next = useCallback(() => {
    if (coreNext() === 'next') onScreen(2)
  }, [coreNext, onScreen])
  const exit = useCallback(() => onScreen(1), [onScreen])
  const restart = useCallback(() => {
    coreRestart()
    onScreen(2)
  }, [coreRestart, onScreen])

  const v = core.view
  const question = UNIT.questions[v.index]
  const view: DrillView = {
    index: v.index,
    question,
    explanation: EXPLANATIONS[question.qid],
    phase: v.phase,
    selected: v.selected,
    picked: v.picked,
    correct: v.picked ? v.picked === question.answer : null,
    eliminated: v.eliminated,
    results: v.results,
    total: UNIT.questions.length,
    elapsed: v.elapsed,
    focusPara: v.focusPara,
    flashPara: v.flashPara,
    flashSource: v.flashSource,
    openSteps: v.openSteps,
    passage: PASSAGE,
    stepCites: v.stepCites,
    distractorCites: v.distractorCites,
    cited: v.cited,
    marks: v.marks,
  }

  return {
    view,
    act: {
      select: c.select,
      lock,
      toggleEliminate: c.toggleEliminate,
      next,
      exit,
      setFocusPara: c.setFocusPara,
      moveFocusPara: c.moveFocusPara,
      cite: c.cite,
      toggleStep: c.toggleStep,
      goToStep: c.goToStep,
      restart,
    },
    refs: core.refs,
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
