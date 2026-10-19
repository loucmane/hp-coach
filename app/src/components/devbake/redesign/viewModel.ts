// The redesign kit's view model (kit v2, bead hpf-qr0p.7; docs/redesign/kit-v2.md):
// what every screen of the bake-off shows, as data. A direction renders
// these types and nothing else, so the same screen can be fed by the
// bake-off's fixtures (directionData.tsx) today and by the real hooks
// later — the doc maps every field to its hook.
//
// Conventions:
//   - Scores are on HP's 0,0–2,0 scale (numbers; directions format them,
//     e.g. with r1Kit's fmtScore). Times are seconds, dates ISO strings.
//   - Text may carry math between U+E000 and U+E001 (prompts, options,
//     explanations): render it with @/components/MathText, or
//     flattenMathText for an accessible name. `DrillQuestion.math` says
//     whether a question has any.
//   - A field marked "no real source" is optional: the real app cannot
//     fill it today. A direction must render well without it — leave the
//     element out rather than show a placeholder.
//   - Section codes are the bank's (ORD … DTK, with Ä); ids and test ids
//     use contract.ts's sectionSlug (las, …).

import type {
  DrillController,
  DrillResult,
  DrillStart,
  Passage,
} from '@/components/devbake/redesign/drillCore'
import type { Destination } from '@/components/devbake/redesign/r1Kit'
import type { Explanation } from '@/data/explanations'
import type {
  ConstraintEntry,
  Framework,
  LexiconEntry,
  ProtocolEntry,
  TacticEntry,
  TrapEntry,
} from '@/data/frameworks'
import type { AnswerLetter, Provpass, Section } from '@/data/questions'
import type { Density, FontKey, PaletteKey, ThemeMode } from '@/lib/tokens'
import type { CoachKey } from '@/lib/voice'

export type { Explanation }

/** A score on the 0,0–2,0 scale. */
export type Score = number

export type Half = 'verbal' | 'kvant'

// ── Drill ────────────────────────────────────────────────────────────

/** An option image (the 11 DTK questions whose choices are pie charts). */
export type DrillOptionFigure = { src: string; alt: string; width: number; height: number }

export type DrillOption = {
  letter: AnswerLetter
  /** May carry math. For an image option, a short accessible label. */
  text: string
  figure?: DrillOptionFigure | null
}

/**
 * A question's figure. `src` is relative to the app's public root
 * ("figures/dtk/host-2025-kvant1-p16.jpg"): render it as `/${src}`.
 * `width`/`height` are the intrinsic pixels of a raster page, or a box with
 * the right aspect ratio for an SVG (the bank stores only the ratio).
 */
export type DrillFigure = {
  src: string
  alt: string
  width: number
  height: number
  /** 'svg' diagrams theme with currentColor when inlined; 'raster' pages
   *  (DTK) are dense and want a zoom. */
  kind: 'svg' | 'raster'
}

/** A passage: paragraphs and byline (drillCore.parsePassage), plus what a
 *  reader needs around it. */
export type DrillPassage = Passage & {
  /** The unit title (P5 units have one; authentic passages do not). */
  title?: string
  /** 'en' for ELF: mark the passage container lang="en". */
  lang: 'sv' | 'en'
  /** A P5 practice text: show the ÖVNINGSTEXT badge and its note. */
  synthetic: boolean
  unitId?: string
}

/** Where a question comes from. */
export type QuestionSource = {
  examId: string
  provpass: Provpass | null
  /** False for P5 practice questions (ÖVNINGSTEXT). */
  authentic: boolean
  /** "Hösten 2025 · Provpass 2" (lib/examNames), or the unit's title. */
  label: string
}

/**
 * One question of any shape: LÄS/ELF with a passage and A–D, XYZ/KVA/NOG
 * with math and A–D or A–E (NOG and ORD have five; KVA's four are fixed),
 * DTK with a figure, or a stub without options.
 */
export type DrillQuestion = {
  qid: string
  section: Section
  /** The number in its pass or unit. */
  number: number
  /** Null when the bank has none; ELF gap items have ''. KVA and NOG
   *  prompts split with splitKvaPrompt (components/drill/KvaPrompt) and
   *  parseNogPrompt (lib/nogPrompt). */
  prompt: string | null
  /** A–E in order, four or five; null when the bank has none (a stub). */
  options: DrillOption[] | null
  answer: AnswerLetter
  passage?: DrillPassage | null
  figure?: DrillFigure | null
  /** True when the prompt or an option carries math. */
  math: boolean
  source: QuestionSource
}

/** What a drill was started as. */
export type DrillRequest =
  | { kind: 'section'; section: Section }
  | { kind: 'mixed' }
  | { kind: 'repetition'; section?: Section }
  | { kind: 'framework'; frameworkId: string; section: Section }
  | { kind: 'weak'; section: Section }

/** A sitting of questions, as useDrillCore takes it. */
export type DrillSessionView = {
  id: string
  request: DrillRequest
  /** "LÄS-övning", "Kvantitativ övning" … */
  title: string
  questions: DrillQuestion[]
  /** By qid; null = no explanation yet. */
  explanations: Record<string, Explanation | null>
  /** Where the sitting opens: question index and earlier answers. */
  start: DrillStart
  /** Seconds already on the clock. No real source (the real drill times
   *  each answer, not the sitting). */
  elapsedSeconds?: number
  /** The pick the bake-off grades with when its switcher jumps straight to
   *  feedback. No real source (fixture only). */
  wrongPick?: Partial<Record<string, AnswerLetter>>
}

// ── Home (Idag) ──────────────────────────────────────────────────────

export type TodayView = {
  iso: string
  weekday: string
  /** "Fredag 9 oktober" */
  dateLabel: string
  /** "fre 9 okt" */
  shortDate: string
  /** "God eftermiddag" */
  greeting: string
  firstName?: string | null
}

export type ExamView = {
  id: string
  /** "Höstprov 26" */
  label: string
  name: string
  /** "söndag 18 oktober" */
  dateLabel: string
  /** "18 okt" */
  shortDate: string
  daysLeft: number
}

/** The paused sitting Home resumes — its one primary action. */
export type ResumeView = {
  section: Section
  /** "LÄS-övning" */
  kind: string
  title: string
  subtitle?: string
  /** The question it reopens on (1-based) and the sitting's size. */
  position: number
  total: number
  answered: number
  /** "telefon" — the device it was paused on. */
  device?: string | null
  /** "Idag · 07:52". No real source (sessions keep startedAt only). */
  pausedAt?: string
  /** No real source. */
  minutesLeft?: number
  /** Older than a week: offer it, but quietly. */
  stale?: boolean
}

export type PlanItemKind = 'lesson' | 'drill' | 'repetition' | 'mock'

export type PlanItemView = {
  id: string
  kind: PlanItemKind
  /** Null for cross-section items (repetition, mixed drill, mock). */
  section: Section | null
  /** A lesson's entry id or a trap drill's framework id. */
  framework?: string
  /** "Repetition" */
  title: string
  /** "8 av 23 missar" */
  detail?: string
  /** Why it is on today's plan. */
  rationale: string
  minutes: number
  completed: boolean
  /** The item Home points at after the resume. No real source: the real
   *  plan's order is its priority, items[0] leads. */
  primary?: boolean
}

export type PlanView = { minutes: number; items: PlanItemView[]; allComplete: boolean }

export type PrognosisView = {
  /** Null until both halves have answers. */
  total: Score | null
  verbal: Score | null
  quant: Score | null
  /** Week over week; null when the weeks do not compare. */
  delta?: number | null
  /** No real source: there is no range for the total. */
  low?: Score
  high?: Score
  /** The score aimed for. */
  target?: Score
  /** Weekly scores, oldest first, the last this week. The real series is
   *  pooled weekly accuracy, not the projection. */
  weeks?: Score[]
  /** The approved caveat, shown with the estimate while LÄS/ELF practice
   *  texts feed it; null when the estimate is calibrated. */
  caveat: string | null
}

export type TrapView = {
  frameworkId: string
  section: Section
  /** The framework's headword ("Författarens hållning"). */
  name: string
  /** A common-distractor pattern or short rule. */
  pattern?: string | null
  /** Due mistakes on this trap. */
  count: number
  /** Growing since the last snapshot. No real source beyond this device's
   *  trap history. */
  rising?: boolean
}

export type RecentPassView = {
  id: string
  /** "ORD", "Repetition" */
  label: string
  correct: number
  total: number
  /** "Igår" */
  when: string
}

export type WeekView = {
  /** Null while loading. */
  minutesToday: number | null
  streakDays?: number
  /** Days practised this week. */
  daysPractised?: number
  /** No real source: there is no weekly goal. */
  goal?: number
}

export type ProvPrescriptionView = {
  due: boolean
  half: Half
  daysSinceLast: number | null
  daysUntilNext: number
}

export type HomeView = {
  today: TodayView
  exam: ExamView
  resume: ResumeView | null
  plan: PlanView
  prognosis: PrognosisView
  traps: TrapView[]
  recent: RecentPassView[]
  week: WeekView
  /** Today's repetition pile: the Öva badge. */
  ovaDue: number
  /** The Provpass rhythm. */
  provpass?: ProvPrescriptionView | null
}

// ── Öva and Repetera ─────────────────────────────────────────────────

export type SectionScoreView = {
  section: Section
  /** "Kvantitativa jämförelser" */
  name: string
  half: Half
  score: Score | null
  /** ±, a 95 % band on the score. */
  band?: number | null
  /** This week's correct fraction minus last week's (−1…1). */
  trend: number | null
  confidence: 'low' | 'medium' | 'high'
  attempts90d: number
  /** Null when never practised. */
  daysSince: number | null
}

export type OvaSectionView = SectionScoreView & {
  /** Mistakes waiting in today's pile ("N väntar"). */
  waiting: number
  /** Of those, due now. */
  dueNow: number
}

export type OvaView = {
  /** The eight sections in exam order. */
  sections: OvaSectionView[]
  /** The one to suggest ("svagast"), or null without enough answers. */
  weakest: Section | null
  repetera: { dueNow: number; pile: number }
  mixed: { questions: number }
  weakTraps: TrapView[]
}

export type RepeteraItemView = {
  /** 1-based place in the queue. */
  n: number
  mistakeId: number
  qid: string
  section: Section
  /** The question's prompt, for a preview line; null when unknown. */
  prompt: string | null
  /** Wrong answers in the last seven days. */
  errors: number
  dueNow: boolean
  /** "nu", "om 2 dagar" */
  dueLabel: string
  frameworkId: string | null
  frameworkName?: string
}

export type RepeteraView = {
  dueNow: number
  pile: number
  /** A sitting plays this many. */
  sessionSize: number
  /** Due first, then the rest of today's pile. */
  items: RepeteraItemView[]
}

// ── Provpass ─────────────────────────────────────────────────────────

export type ProvHalfView = {
  half: Half
  /** "Verbal", "Kvantitativ" */
  label: string
  minutes: number
  questions: number
  sections: { section: Section; count: number }[]
}

export type ProvPassOptionView = {
  /** `${examId}:${provpass}` */
  id: string
  examId: string
  provpass: Provpass
  half: Half
  /** "Hösten 2025" */
  sitting: string
  /** "Provpass 1" */
  pass: string
  /** Fully parsed questions (of a nominal 40). */
  presented: number
  /** Of those, how many the reader has met before. */
  seenBefore: number
  /** The least-seen pass: the suggested one. */
  suggested: boolean
}

export type ProvResultSummaryView = {
  id: string
  half: Half
  sitting: string | null
  pass: string | null
  mode: 'authentic' | 'synthetic'
  correct: number
  presented: number
  score: Score | null
  /** "3 okt" */
  when: string
}

export type ProvHubView = {
  /** The half the hub opens on: the one the Provpass rhythm says is next. */
  half: Half
  halves: ProvHalfView[]
  /** Authentic passes, least seen first. */
  passes: ProvPassOptionView[]
  /** Finished passes, newest first. The real hub shows only one result at
   *  a time; the list comes from the same hook. */
  results: ProvResultSummaryView[]
  /** Questions met before across the listed passes. */
  exposure: { seen: number; total: number }
  prescription?: ProvPrescriptionView | null
  /** The four rules read out before a pass starts. */
  rules: string[]
}

export type ProvGridCellView = {
  n: number
  qid: string
  section: Section
  answered: boolean
  /** No real source: the real runner has no flags. */
  flagged?: boolean
}

export type ProvRunningView = {
  passId: string
  half: Half
  sitting: string
  pass: string
  mode: 'authentic' | 'synthetic'
  durationSeconds: number
  remainingSeconds: number
  /** The pass's questions in printed order (no explanations in a pass). */
  questions: DrillQuestion[]
  grid: ProvGridCellView[]
  /** Section runs, for the grid's labels (0-based, end exclusive). */
  sections: { section: Section; start: number; end: number }[]
  /** Index of the question on screen. */
  current: number
  /** Answers so far, by qid. */
  answers: Partial<Record<string, AnswerLetter>>
  /** Flagged qids. No real source. */
  flags?: string[]
}

export type ProvSectionResultView = {
  section: Section
  presented: number
  correct: number
  timeSeconds: number
  /** The section's share of the 55 minutes. */
  quotaSeconds: number
  /** A linear estimate (2 × correct / presented). No real source for a
   *  normed per-section score. */
  estimate?: Score | null
}

export type ProvResultView = {
  id: string
  passId: string | null
  half: Half
  sitting: string | null
  pass: string | null
  mode: 'authentic' | 'synthetic'
  presented: number
  answered: number
  correct: number
  /** The half's score: read from the sitting's official table
   *  ('official-derived', "normerat (härlett)") or linear ('linear',
   *  "skattad"). */
  score: { value: Score | null; derived: 'official-derived' | 'linear'; label: string }
  sections: ProvSectionResultView[]
  seenBefore: number
  durationSeconds: number
  missed: string[]
  /** A trap behind two or more misses (KVA/NOG/XYZ). */
  trap?: { frameworkId: string; section: Section; count: number; headline: string | null } | null
  /** Earlier passes of the same half and mode, newest first. */
  history: ProvResultSummaryView[]
  /** Verbal and quant combined. No real source: a pass is one half. */
  total?: { verbal: Score | null; kvant: Score | null; total: Score | null }
}

export type ProvpassView = {
  hub: ProvHubView
  running: ProvRunningView
  result: ProvResultView
}

// ── Framsteg and Historik ────────────────────────────────────────────

export type HistoryRowView = {
  id: string
  kind: 'drill' | 'adaptive_review' | 'mock' | 'mock_diagnostic' | 'lesson'
  /** "KVA", "Repetition" */
  label: string
  section: Section | null
  correct: number
  total: number
  endedAt: string
  /** "12 maj" */
  when: string
}

export type FramstegView = {
  prognosis: PrognosisView
  sections: SectionScoreView[]
  /** The three sections to practise next. */
  focus: Section[]
  week: {
    streakDays: number
    /** The longest run in the shown days. */
    record?: number
    attemptsThisWeek: number
    accuracy7d: number | null
    minutesToday: number | null
    daysPractised?: number
    /** No real source. */
    goal?: number
  }
  /** Answers per UTC day, oldest first (84 days). */
  days: { date: string; n: number }[]
  /** Weekly score series, oldest first: pooled accuracy, 12 weeks. */
  weekly: { weekStart: string; score: Score | null }[]
  totals: { attempts: number; drills: number; mistakesActive: number; mistakesResolved: number }
  /** Historik: finished drills and repetitions, newest first. */
  history: HistoryRowView[]
}

// ── Uppslag and lektion ──────────────────────────────────────────────

export type FrameworkFamily = Framework['family']

/** Mastery steps per framework entry (the worker's progress table). */
export type FrameworkStatus = 'untaught' | 'learning' | 'practicing' | 'retaining' | 'mastered'

export type FrameworkEntry =
  | TrapEntry
  | TacticEntry
  | ConstraintEntry
  | ProtocolEntry
  | LexiconEntry

export type UppslagEntryView = {
  id: string
  /** The entry's headword (data/frameworks entryHeadword). */
  title: string
  /** A one-line kicker, when the entry has one. */
  summary?: string
  read: boolean
  status?: FrameworkStatus
  /** Example questions to practise it on. */
  examples: number
}

export type UppslagSectionView = {
  section: Section
  name: string
  family: FrameworkFamily
  entries: UppslagEntryView[]
  /** The section's score, for "weakest first". */
  score: Score | null
}

export type LessonView = {
  id: string
  section: Section
  family: FrameworkFamily
  title: string
  /** The catalog entry verbatim (its fields depend on the family). */
  entry: FrameworkEntry
  read: boolean
  status?: FrameworkStatus
  /** Practise this entry: its example questions. */
  practice: { questions: number }
}

export type UppslagView = {
  sections: UppslagSectionView[]
  /** The lesson open beside the catalog. */
  open: LessonView
}

// ── Konto and inställningar ──────────────────────────────────────────

export type IdentityView = { name: string; email: string; initials: string; plan?: string }

export type PrefsView = {
  palette: PaletteKey
  mode: ThemeMode
  font: FontKey
  density: Density
  coach: CoachKey
  smartDrill: boolean
  showStreak: boolean
  dailyMinutes: number
}

export type PrefOption<K extends string> = { key: K; label: string; blurb?: string }

export type KontoView = {
  identity: IdentityView
  exam: { label: string; daysLeft: number }
  prefs: PrefsView
  options: {
    palette: PrefOption<PaletteKey>[]
    mode: PrefOption<ThemeMode>[]
    font: PrefOption<FontKey>[]
    density: PrefOption<Density>[]
    coach: PrefOption<CoachKey>[]
  }
  /** Links out of Konto. */
  links: { label: string; href: string }[]
}

// ── Everything a direction can show ──────────────────────────────────

export type CopyView = {
  /** »ÖVNINGSTEXT«: stored title-case, uppercased by CSS. */
  ovningstextBadge: string
  ovningstextNote: string
  estimateCaveat: string
}

export type DirectionData = {
  home: HomeView
  /** 2–3 Läsfråga/Facit (LÄS), 6 Kvantfråga, 7 DTK, 14 ELF. */
  drills: {
    reading: DrillSessionView
    quant: DrillSessionView
    dtk: DrillSessionView
    elf: DrillSessionView
  }
  ova: OvaView
  repetera: RepeteraView
  provpass: ProvpassView
  framsteg: FramstegView
  uppslag: UppslagView
  konto: KontoView
  copy: CopyView
  /** Framework id → name, for "Ramverk" links in feedback. */
  frameworks: Record<string, string>
}

/** What a screen may ask for. The bake-off maps each onto its switcher;
 *  the real app will map them onto routes and mutations. */
export type DirectionActions = {
  /** One of the five destinations. */
  go: (to: Destination) => void
  /** Home's primary action. */
  resume: () => void
  openPlanItem: (id: string) => void
  startDrill: (request: DrillRequest) => void
  openRepetera: () => void
  openLesson: (frameworkId: string) => void
  toggleLessonRead: (frameworkId: string) => void
  openKonto: () => void
  startProvpass: (passId: string) => void
  /** Hand in the running pass. */
  submitProvpass: () => void
  openProvResult: (id: string) => void
  setTheme: (theme: ThemeMode) => void
  setPrefs: (patch: Partial<PrefsView>) => void
  exportData: () => void
  /** Asks first; the bake-off never deletes anything. */
  deleteAccount: () => void
  signOut: () => void
  /** Grades and hears a drill's moves (pass it to useDrillCore). */
  drill: DrillController
}

export type { DrillResult }
