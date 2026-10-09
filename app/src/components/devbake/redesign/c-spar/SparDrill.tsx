// Spår · Läsfråga and Facit — one model on every screen. The passage sits
// in a single centred column; its tinted head folds into a 52 px title
// strip once the reader scrolls. The question lives in a tray docked to the
// bottom edge at the column's width: folded to the question and a "Visa
// alternativen" row by default, opened (≤45 % of the height) to the four
// options. Answering raises the tray into a feedback sheet over a little
// more than half the page, so the passage stays in view above it; a ¶ chip
// drops the sheet to below half and centres the cited paragraph there.
//
// Feedback reads in the order all four directions share: verdict and the
// two answer cards → why your pick tempted and why it is wrong → "Att ta
// med dig" (pitfall, technique) → the solution → its steps → the other
// options. Colour fills belong to the two answer cards alone. The top
// bar's progress is a path: a right answer fills its segment, a miss is
// "lagd i Repetera" — never a loss. Nothing moves inside the column.

import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  Clock,
  Flag,
  Focus,
  Info,
  RotateCcw,
  Route,
  TriangleAlert,
  Undo2,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import {
  FRAMEWORK_NAMES,
  OVNINGSTEXT_BADGE,
  OVNINGSTEXT_NOTE,
  PLAN,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type Destination,
  type DirectionProps,
  type DrillActions,
  type DrillRefs,
  type DrillView,
  fmtClock,
  type QuoteSpan,
  splitStepRefs,
  useDrill,
  useHideOnScroll,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import type { AnswerLetter } from '@/data/questions'
import { CalmSwitch, Kbd, SECTION_NAMES, secOf } from './sparParts'

const [TITLE, SUBTITLE] = UNIT.title.split(': ')
const WORDS = ['noll', 'en', 'två', 'tre', 'fyra']
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)
/** The day's first step is this text; the plan's items come after it. */
const DAY_STEPS = 1 + PLAN.items.length

type Shared = { view: DrillView; act: DrillActions; refs: DrillRefs }
type Note = {
  note: boolean
  setNote: (open: boolean) => void
  /** The band's ÖVNINGSTEXT badge, watched so the tray or sheet can carry
   *  it once the passage head is out of view — one badge on screen. */
  badgeRef: RefObject<HTMLSpanElement | null>
  bandRef?: RefObject<HTMLElement | null>
}
type Calm = { calm: boolean; setCalm: (calm: boolean) => void }

/** Whether an element is on screen (clipped by its scrollers). True where
 *  IntersectionObserver is missing, so nothing is hidden by accident. */
function useSeen(ref: RefObject<HTMLElement | null>): boolean {
  const [seen, setSeen] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return seen
}

/** The first paragraph the essential steps cite — where the evidence is. */
function evidencePara(view: DrillView): number | undefined {
  for (const s of view.explanation.steps ?? []) {
    const cites = view.stepCites[s.n]
    if (s.tier !== 'detail' && cites?.length) return cites[0]
  }
  return view.cited[0]
}

/**
 * On a verdict the passage turns to its evidence, so the text left in view
 * above the sheet is the part the explanation is about — instantly the
 * first time (a deep link lands there), smoothly after an answer.
 */
function useTurnToEvidence(
  view: DrillView,
  scrollRef: RefObject<HTMLDivElement | null>,
  offset: number,
  before?: () => void,
) {
  const first = useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: turn on a new verdict only
  useEffect(() => {
    const wasFirst = first.current
    first.current = false
    if (view.phase !== 'feedback') return
    const box = scrollRef.current
    const n = evidencePara(view)
    const el = n ? box?.querySelector<HTMLElement>(`[data-n="${n}"]`) : null
    if (!box || !el || typeof box.scrollTo !== 'function') return
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    before?.()
    box.scrollTo({
      top: Math.max(0, top - offset),
      behavior: wasFirst || reduce ? 'auto' : 'smooth',
    })
  }, [view.phase, view.index])
}

/** The paragraph nearest the top of a scroller's view — where focus mode
 *  starts, so switching it on never jumps the text. */
function firstVisiblePara(box: HTMLElement | null): number {
  if (!box) return 1
  const top = box.getBoundingClientRect().top + 72
  for (const el of box.querySelectorAll<HTMLElement>('[data-n]')) {
    if (el.getBoundingClientRect().bottom > top) return Number(el.dataset.n)
  }
  return 1
}

export function SparDrill({
  screen,
  width,
  live,
  onScreen,
  calm,
  setCalm,
  onGo,
}: DirectionProps & Calm & { onGo: (d: Destination) => void }) {
  const { view, act, refs } = useDrill({ screen, onScreen, live })
  const [note, setNote] = useState(false)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Desktop: the tray folds to its question; the feedback sheet stands tall.
  const [tray, setTray] = useState<'peek' | 'open'>('peek')
  const [fsheet, setFsheet] = useState<'tall' | 'half'>('tall')
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seat on a new question or verdict only
  useEffect(() => {
    setTray('peek')
    setFsheet('tall')
  }, [view.index, view.phase])

  // Choosing an option opens the tray, so the choice is always in view.
  const actSelect = act.select
  const select = useCallback(
    (letter: AnswerLetter) => {
      actSelect(letter)
      setTray('open')
    },
    [actSelect],
  )
  const dact: DrillActions = { ...act, select }

  const focusOn = view.focusPara != null
  const toggleFocus = () => act.setFocusPara(focusOn ? null : firstVisiblePara(scrollRef.current))
  const repeat = () => onGo('ova')

  const keys: Record<string, () => void> = {
    Enter: () => {
      if (view.phase === 'question') act.lock()
      else if (view.phase === 'feedback') act.next()
      else repeat()
    },
    j: () => act.moveFocusPara(1),
    k: () => act.moveFocusPara(-1),
    f: toggleFocus,
    Escape: () => act.setFocusPara(null),
  }
  if (width === 'desktop') {
    keys.t = () =>
      view.phase === 'feedback'
        ? setFsheet((s) => (s === 'tall' ? 'half' : 'tall'))
        : setTray((s) => (s === 'open' ? 'peek' : 'open'))
  }
  for (const o of view.question.options) {
    const l = o.letter.toLowerCase()
    keys[l] = () => select(o.letter)
    keys[`Shift+${l}`] = () => act.toggleEliminate(o.letter)
  }
  useKeyMap(keys, live)

  const shared = { view, act: dact, refs }
  const done = view.phase === 'done'
  if (width === 'phone') {
    return (
      <PhoneDrill
        {...shared}
        note={note}
        setNote={setNote}
        badgeRef={badgeRef}
        scrollRef={scrollRef}
        focusOn={focusOn}
        toggleFocus={toggleFocus}
        onHome={() => onScreen(1)}
        onRepeat={repeat}
      />
    )
  }
  return (
    <div className="sp-drill">
      <TopBar
        view={view}
        act={dact}
        focusOn={focusOn}
        toggleFocus={toggleFocus}
        calm={calm}
        setCalm={setCalm}
      />
      {done ? (
        <div className="sp-body sp-body--done">
          <Done view={view} onHome={() => onScreen(1)} onRepeat={repeat} />
        </div>
      ) : (
        <DeskBody
          {...shared}
          note={note}
          setNote={setNote}
          badgeRef={badgeRef}
          scrollRef={scrollRef}
          tray={tray}
          setTray={setTray}
          fsheet={fsheet}
          setFsheet={setFsheet}
        />
      )}
    </div>
  )
}

// ── Top bar ──────────────────────────────────────────────────────────

function TopBar({
  view,
  act,
  focusOn,
  toggleFocus,
  calm,
  setCalm,
}: Pick<Shared, 'view' | 'act'> & Calm & { focusOn: boolean; toggleFocus: () => void }) {
  return (
    <header className="sp-top">
      <div className="sp-top-left">
        <button
          type="button"
          className="sp-btn sp-btn--quiet"
          data-testid="rd-exit"
          onClick={act.exit}
          title="Dina svar är sparade"
        >
          <X size={18} strokeWidth={2.25} aria-hidden />
          Avsluta
        </button>
      </div>
      <div className="sp-top-mid">
        <span className="sp-sec-chip" data-sec="LÄS" title={SECTION_NAMES.LÄS}>
          LÄS
        </span>
        <Progress view={view} />
        <span className="sp-top-count">
          Fråga {Math.min(view.index + 1, view.total)} av {view.total}
        </span>
      </div>
      <div className="sp-top-right">
        <CalmSwitch calm={calm} setCalm={setCalm} compact testid="sp-calm-drill" />
        <button
          type="button"
          className="sp-btn sp-btn--quiet"
          aria-pressed={focusOn}
          onClick={toggleFocus}
          title="Styckefokus: F slår på, J och K byter stycke"
        >
          <Focus size={18} strokeWidth={2} aria-hidden />
          Fokus
        </button>
        <Timer seconds={view.elapsed} />
      </div>
    </header>
  )
}

/** The unit's questions as a short path: answered stops fill, the current
 *  one is ringed in ink, a miss shows the repeat glyph. */
function Progress({ view, compact = false }: { view: DrillView; compact?: boolean }) {
  return (
    <ol className="sp-prog" data-compact={String(compact)} aria-label="Frågorna i texten">
      {UNIT.questions.map((q, i) => {
        const r = view.results.find((x) => x.qid === q.qid)
        const current = i === view.index && view.phase === 'question'
        const state = current ? 'now' : r ? (r.correct ? 'right' : 'miss') : 'todo'
        const label = current ? 'pågår' : r ? (r.correct ? 'rätt' : 'lagd i Repetera') : 'kvar'
        return (
          <li key={q.qid} data-state={state}>
            <span className="sp-prog-node" aria-hidden>
              {state === 'right' ? (
                <Check size={compact ? 12 : 14} strokeWidth={3.25} />
              ) : state === 'miss' ? (
                <RotateCcw size={compact ? 11 : 12} strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
            <span className="sp-sr">
              Fråga {i + 1}: {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Timer({ seconds, compact = false }: { seconds: number; compact?: boolean }) {
  return (
    <span
      className="sp-timer"
      data-compact={String(compact)}
      role="timer"
      aria-label={`Tid ${fmtClock(seconds)}`}
    >
      {compact ? null : <Clock size={16} strokeWidth={2} aria-hidden />}
      <span aria-hidden>{fmtClock(seconds)}</span>
    </span>
  )
}

// ── Desktop body: column, strip, tray / sheet ────────────────────────

/** The feedback sheet's two heights, as a share of the body. */
const SHEET_PCT = { tall: 58, half: 40 } as const
/** The tray and sheet round their top corners over the column. */
const CORNER = 28

function DeskBody({
  view,
  act,
  refs,
  note,
  setNote,
  badgeRef,
  scrollRef,
  tray,
  setTray,
  fsheet,
  setFsheet,
}: Shared &
  Note & {
    scrollRef: RefObject<HTMLDivElement | null>
    tray: 'peek' | 'open'
    setTray: (s: 'peek' | 'open') => void
    fsheet: 'tall' | 'half'
    setFsheet: (s: 'tall' | 'half') => void
  }) {
  const bandRef = useRef<HTMLElement>(null)
  // Below the 52 px title strip, with a little air.
  useTurnToEvidence(view, scrollRef, 76)
  const [condensed, setCondensed] = useState(false)
  const onScroll = (e: { currentTarget: HTMLElement }) => {
    const band = bandRef.current
    const fold = band ? band.offsetHeight - 52 : 120
    setCondensed(e.currentTarget.scrollTop > fold)
  }

  // The column ends where the tray begins (it scrolls on behind the tray's
  // rounded corners only): the tray is measured, the sheet's height is set.
  const dockRef = useRef<HTMLElement>(null)
  const [dockH, setDockH] = useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the tray changes shape
  useLayoutEffect(() => {
    const el = dockRef.current
    if (!el || view.phase !== 'question') return
    const measure = () => setDockH(el.offsetHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [view.phase, view.index, tray])
  const bottom =
    view.phase === 'feedback'
      ? `calc(${SHEET_PCT[fsheet]}% - ${CORNER}px)`
      : `${Math.max(0, dockH - CORNER)}px`

  // A ¶ chip drops the sheet to below half and centres its paragraph above.
  const cite = (n: number, source?: string) => {
    setFsheet('half')
    act.cite(n, source)
  }

  const bandSeen = useSeen(badgeRef)
  const dockBadge = condensed || !bandSeen

  return (
    <div className="sp-body" data-phase={view.phase}>
      <div className="sp-scroll" ref={scrollRef} onScroll={onScroll} style={{ bottom }}>
        <Reader
          view={view}
          act={act}
          refs={refs}
          note={note}
          setNote={setNote}
          badgeRef={badgeRef}
          bandRef={bandRef}
        />
        <div aria-hidden style={{ height: CORNER + 32 }} />
      </div>
      <div className="sp-strip" data-sec="LÄS" data-shown={String(condensed)} aria-hidden>
        <span className="sp-strip-title">{TITLE}</span>
        <span className="sp-strip-sub">{SUBTITLE}</span>
      </div>
      {view.phase === 'question' ? (
        <Tray
          view={view}
          act={act}
          state={tray}
          setState={setTray}
          dockRef={dockRef}
          badge={dockBadge}
        />
      ) : null}
      {view.phase === 'feedback' ? (
        <FeedbackSheet
          view={view}
          act={{ ...act, cite }}
          refs={refs}
          state={fsheet}
          setState={setFsheet}
          badge={dockBadge}
        />
      ) : null}
    </div>
  )
}

// ── The reading column ───────────────────────────────────────────────

function Reader({ view, act, refs, note, setNote, badgeRef, bandRef }: Shared & Note) {
  const { paragraphs, byline } = view.passage
  const graded = view.phase === 'feedback'
  const marks = view.flashSource ? view.marks.filter((m) => m.source === view.flashSource) : []
  return (
    <article className="sp-reader" data-sec="LÄS" aria-labelledby="sp-title">
      <header className="sp-band" ref={bandRef}>
        <div className="sp-band-row">
          <span className="sp-badge-chip" data-testid="rd-badge" ref={badgeRef}>
            {OVNINGSTEXT_BADGE}
          </span>
          <button
            type="button"
            className="sp-band-toggle"
            data-testid="rd-note-toggle"
            aria-expanded={note}
            aria-controls="sp-note"
            onClick={() => setNote(!note)}
          >
            <Info size={16} strokeWidth={2} aria-hidden />
            {note ? 'Dölj' : 'Om texten'}
          </button>
        </div>
        <h1 className="sp-title" id="sp-title">
          {TITLE}
        </h1>
        <p className="sp-subtitle">{SUBTITLE}</p>
        <p className="sp-note" id="sp-note" data-testid="rd-note" hidden={!note}>
          {OVNINGSTEXT_NOTE}
        </p>
      </header>
      <div
        className="sp-passage"
        data-testid="rd-passage"
        data-focus={String(view.focusPara != null)}
      >
        {paragraphs.map((p, i) => {
          const n = i + 1
          return (
            <p
              key={n}
              ref={refs.para(n)}
              className="sp-para"
              data-n={n}
              data-testid={`rd-para-${n}`}
              data-cited={String(graded && view.cited.includes(n))}
              data-flash={String(view.flashPara === n)}
              data-focused={String(view.focusPara === n)}
            >
              {/* Out of the tab order: nine of these must not stand between
               *  the reader and the tray; F, J and K drive the same aid. */}
              <button
                type="button"
                className="sp-pnum"
                tabIndex={-1}
                aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                aria-pressed={view.focusPara === n}
                onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
              >
                {n}
              </button>
              <ParaText text={p} marks={marks.filter((m) => m.para === n)} />
            </p>
          )
        })}
        {byline ? <p className="sp-byline">{byline}</p> : null}
      </div>
    </article>
  )
}

/** A paragraph's text, verbatim, with the quotations a cited part makes
 *  marked in the one highlight style. */
function ParaText({ text, marks }: { text: string; marks: QuoteSpan[] }) {
  if (marks.length === 0) return <>{text}</>
  const out: ReactNode[] = []
  let at = 0
  for (const m of [...marks].sort((a, b) => a.start - b.start)) {
    if (m.start < at) continue
    if (m.start > at) out.push(text.slice(at, m.start))
    out.push(
      <mark key={m.start} className="sp-quote">
        {text.slice(m.start, m.end)}
      </mark>,
    )
    at = m.end
  }
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}

// ── The question tray (desktop) ──────────────────────────────────────

function Tray({
  view,
  act,
  state,
  setState,
  dockRef,
  badge,
}: Pick<Shared, 'view' | 'act'> & {
  state: 'peek' | 'open'
  setState: (s: 'peek' | 'open') => void
  dockRef: RefObject<HTMLElement | null>
  /** Carry ÖVNINGSTEXT here: the passage's own badge is out of view. */
  badge: boolean
}) {
  const open = state === 'open'
  return (
    <section
      className="sp-tray"
      data-state={state}
      ref={dockRef}
      aria-label={`Fråga ${view.index + 1}`}
    >
      <div className="sp-tray-head">
        <h2 className="sp-prompt">{view.question.prompt}</h2>
        <span
          className="sp-badge-chip sp-badge-chip--sm"
          data-hidden={String(!badge)}
          aria-hidden={!badge}
        >
          {OVNINGSTEXT_BADGE}
        </span>
        {open ? (
          <button
            type="button"
            className="sp-icon-btn sp-icon-btn--soft"
            aria-expanded
            aria-controls="sp-tray-body"
            aria-label="Dölj alternativen"
            title="Dölj alternativen (T)"
            onClick={() => setState('peek')}
          >
            <ChevronDown size={22} strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}
      </div>
      {open ? null : (
        <button
          type="button"
          className="sp-show"
          aria-expanded={false}
          aria-controls="sp-tray-body"
          onClick={() => setState('open')}
        >
          Visa alternativen ({view.question.options.length})
          <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
          <Kbd>T</Kbd>
        </button>
      )}
      <div className="sp-tray-body" id="sp-tray-body" hidden={!open}>
        <Options view={view} act={act} />
        <div className="sp-tray-foot">
          <p className="sp-keys">
            <span>
              <Kbd>T</Kbd> döljer frågan
            </span>
            <span>
              <Kbd>F</Kbd> fokus
            </span>
            <span>
              <Kbd>J</Kbd>/<Kbd>K</Kbd> stycke
            </span>
          </p>
          <span className="sp-echo" aria-live="polite">
            {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
          </span>
          <button
            type="button"
            className="sp-btn sp-btn--primary"
            data-testid="rd-lock"
            disabled={!view.selected}
            onClick={act.lock}
          >
            Svara
            <Kbd>↵</Kbd>
          </button>
        </div>
      </div>
    </section>
  )
}

function Options({ view, act }: Pick<Shared, 'view' | 'act'>) {
  return (
    <ol className="sp-opts" aria-label="Svarsalternativ">
      {view.question.options.map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="sp-opt"
            data-state={selected ? 'selected' : out ? 'out' : undefined}
          >
            <button
              type="button"
              className="sp-opt-main"
              data-testid={`rd-option-${o.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(o.letter)}
            >
              <span className="sp-blob" aria-hidden>
                {o.letter}
              </span>
              <span className="sp-opt-text">
                <span className="sp-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                {o.text}
              </span>
            </button>
            <button
              type="button"
              className="sp-opt-x"
              data-testid={`rd-eliminate-${o.letter}`}
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
              title={out ? 'Ångra' : 'Stryk alternativet (⇧ + bokstav)'}
              onClick={() => act.toggleEliminate(o.letter)}
            >
              {out ? (
                <Undo2 size={17} strokeWidth={2} aria-hidden />
              ) : (
                <CircleSlash size={17} strokeWidth={2} aria-hidden />
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// ── The feedback sheet (desktop) ─────────────────────────────────────

function FeedbackSheet({
  view,
  act,
  refs,
  state,
  setState,
  badge,
}: Shared & {
  state: 'tall' | 'half'
  setState: (s: 'tall' | 'half') => void
  badge: boolean
}) {
  const tall = state === 'tall'
  const last = view.index + 1 >= view.total
  const bodyRef = useRef<HTMLDivElement>(null)
  // A verdict starts at the top of its explanation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new verdict only
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
  }, [view.index])
  const toggle = () => setState(tall ? 'half' : 'tall')
  return (
    <section
      className="sp-fsheet"
      data-state={state}
      style={{ height: `${SHEET_PCT[state]}%` }}
      aria-labelledby="sp-verdict"
    >
      <button
        type="button"
        className="sp-grab"
        aria-label={tall ? 'Visa mer av texten' : 'Visa mer av facit'}
        title="T växlar"
        onClick={toggle}
      />
      <div className="sp-fsheet-head">
        <Verdict view={view} />
        <span
          className="sp-badge-chip sp-badge-chip--sm"
          data-hidden={String(!badge)}
          aria-hidden={!badge}
        >
          {OVNINGSTEXT_BADGE}
        </span>
      </div>
      <div className="sp-fsheet-body" ref={bodyRef}>
        <FeedbackBody view={view} act={act} refs={refs} />
      </div>
      <div className="sp-fsheet-foot">
        <button type="button" className="sp-btn sp-btn--quiet" onClick={toggle}>
          {tall ? (
            <ChevronDown size={18} strokeWidth={2.25} aria-hidden />
          ) : (
            <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
          )}
          {tall ? 'Visa mer av texten' : 'Visa mer av facit'}
          <Kbd>T</Kbd>
        </button>
        <button
          type="button"
          className="sp-btn sp-btn--primary sp-btn--lg"
          data-testid="rd-next"
          onClick={act.next}
        >
          {last ? 'Klart med texten' : 'Nästa fråga'}
          <Kbd>↵</Kbd>
        </button>
      </div>
    </section>
  )
}

function Verdict({ view, compact = false }: { view: DrillView; compact?: boolean }) {
  const correct = view.correct === true
  return (
    <div
      className="sp-verdict"
      data-testid="rd-verdict"
      data-correct={String(correct)}
      data-compact={String(compact)}
    >
      <span className="sp-verdict-glyph" aria-hidden>
        {correct ? (
          <Check size={compact ? 20 : 28} strokeWidth={3} />
        ) : (
          <X size={compact ? 20 : 28} strokeWidth={3} />
        )}
      </span>
      <div className="sp-verdict-text">
        <h2 className="sp-verdict-word" id="sp-verdict">
          {correct ? 'Rätt!' : 'Fel'}
        </h2>
        <p className="sp-verdict-sub">
          {correct ? `Svaret är ${view.question.answer}.` : `Rätt svar är ${view.question.answer}.`}
        </p>
      </div>
      {compact ? null : <VerdictChip view={view} />}
    </div>
  )
}

/** The real, visible change: a right answer fills its stop in the top
 *  bar's path; a miss goes to Repetera — never framed as a loss. */
function VerdictChip({ view }: { view: DrillView }) {
  const correct = view.correct === true
  return (
    <span className="sp-verdict-chip" data-correct={String(correct)}>
      {correct ? (
        <Check size={15} strokeWidth={2.75} aria-hidden />
      ) : (
        <RotateCcw size={15} strokeWidth={2.5} aria-hidden />
      )}
      {correct ? `${view.results.length} av ${view.total} klara` : 'Lagd i Repetera'}
    </span>
  )
}

function FeedbackBody({ view, act, refs, chip = false }: Shared & { chip?: boolean }) {
  const e = view.explanation
  const q = view.question
  const text = (l: string) => q.options.find((o) => o.letter === l)?.text ?? ''
  const picked = e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== view.picked)
  const framework = e.framework_id ? FRAMEWORK_NAMES[e.framework_id] : undefined
  const cites = (l: string) => view.distractorCites[l] ?? { tempting: [], wrong: [] }
  const steps = e.steps ?? []
  return (
    <div className="sp-fb">
      {chip ? <VerdictChip view={view} /> : null}
      <p className="sp-fb-q">{q.prompt}</p>
      <div className="sp-recap">
        {view.picked && view.picked !== q.answer ? (
          <Recap kind="mine" letter={view.picked} text={text(view.picked)} />
        ) : null}
        <Recap
          kind="right"
          letter={q.answer}
          text={text(q.answer)}
          mine={view.picked === q.answer}
        />
      </div>

      {picked ? (
        <section
          className="sp-lure"
          data-testid={`rd-distractor-${picked.letter}`}
          aria-labelledby="sp-lure-h"
        >
          <h3 className="sp-h4" id="sp-lure-h">
            Varför {picked.letter} lockade
          </h3>
          <p className="sp-fb-p">
            <Rich text={picked.why_tempting} act={act} />
            <Cites list={cites(picked.letter).tempting} act={act} />
          </p>
          <h3 className="sp-h4">Varför {picked.letter} är fel</h3>
          <p className="sp-fb-p">
            <Rich text={picked.why_wrong} act={act} />
            <Cites list={cites(picked.letter).wrong} act={act} source={`why-${picked.letter}`} />
          </p>
        </section>
      ) : null}

      <section className="sp-fsec" aria-labelledby="sp-take-h">
        <h3 className="sp-h3" id="sp-take-h">
          Att ta med dig
        </h3>
        <div className="sp-take">
          {e.pitfall ? (
            <div className="sp-take-item" data-kind="pit" data-testid="rd-pitfall">
              <h4 className="sp-take-h">
                <TriangleAlert size={17} strokeWidth={2.25} aria-hidden />
                Fallgrop
              </h4>
              <p className="sp-fb-p">{e.pitfall}</p>
            </div>
          ) : null}
          <div className="sp-take-item" data-kind="tech" data-testid="rd-technique">
            <h4 className="sp-take-h">
              <Route size={17} strokeWidth={2.25} aria-hidden />
              Teknik
            </h4>
            <p className="sp-fb-p">{e.technique}</p>
          </div>
        </div>
      </section>

      <section className="sp-fsec" aria-labelledby="sp-sol-h">
        <h3 className="sp-h3" id="sp-sol-h">
          Lösningen
        </h3>
        <p className="sp-fb-p">{e.solution_path}</p>
      </section>

      {steps.length > 0 ? (
        <section className="sp-fsec" aria-labelledby="sp-steps-h">
          <h3 className="sp-h3" id="sp-steps-h">
            Steg för steg <span className="sp-h3-meta">{steps.length} steg</span>
          </h3>
          <ol className="sp-steps">
            {steps.map((s) => (
              <Step key={s.n} step={s} view={view} act={act} refs={refs} />
            ))}
          </ol>
        </section>
      ) : null}

      {others.length > 0 ? (
        <section className="sp-fsec" aria-labelledby="sp-others-h">
          <h3 className="sp-h3" id="sp-others-h">
            {picked ? 'De andra alternativen' : 'Varför de andra lockar'}
          </h3>
          <div className="sp-others">
            {others.map((d) => (
              <Other key={d.letter} d={d} text={text(d.letter)} cites={cites(d.letter)} act={act} />
            ))}
          </div>
        </section>
      ) : null}

      {framework ? (
        <p className="sp-framework">Ramverk: {framework}. Finns att slå upp i Uppslag.</p>
      ) : null}
    </div>
  )
}

function Recap({
  kind,
  letter,
  text,
  mine = false,
}: {
  kind: 'mine' | 'right'
  letter: string
  text: string
  mine?: boolean
}) {
  return (
    <div className="sp-recap-tile" data-kind={kind}>
      <span className="sp-recap-icon" aria-hidden>
        {kind === 'right' ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
      </span>
      <span className="sp-recap-text">
        <span className="sp-recap-label">
          {kind === 'mine' ? 'Ditt svar' : mine ? 'Ditt svar · rätt' : 'Rätt svar'} · {letter}
        </span>
        {text}
      </span>
    </div>
  )
}

function Step({ step, view, act, refs }: Shared & { step: ExplanationStep }) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  return (
    <li
      className="sp-step-item"
      data-tier={step.tier ?? 'essential'}
      data-testid={`rd-step-${step.n}`}
      ref={refs.step(step.n)}
    >
      <span className="sp-step-dot" aria-hidden>
        {step.n}
      </span>
      <div className="sp-step-content">
        <div className="sp-step-head">
          <h4 className="sp-step-name">
            <span className="sp-sr">Steg {step.n}: </span>
            {step.title}
          </h4>
          {detail ? (
            <button
              type="button"
              className="sp-more"
              data-testid={`rd-step-toggle-${step.n}`}
              aria-expanded={open}
              onClick={() => act.toggleStep(step.n)}
            >
              {open ? 'Dölj fördjupningen' : 'Fördjupning'}
              <ChevronDown
                size={15}
                strokeWidth={2.25}
                aria-hidden
                style={{ rotate: open ? '180deg' : '0deg' }}
              />
            </button>
          ) : null}
        </div>
        {open ? (
          <p className="sp-fb-p sp-step-text">
            <Rich text={step.text} act={act} />
            <Cites list={view.stepCites[step.n] ?? []} act={act} source={`step-${step.n}`} />
          </p>
        ) : null}
      </div>
    </li>
  )
}

function Other({
  d,
  text,
  cites,
  act,
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: DrillActions
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `sp-other-${d.letter}`
  return (
    <article
      className="sp-other"
      data-testid={`rd-distractor-${d.letter}`}
      data-open={String(open)}
    >
      <button
        type="button"
        className="sp-other-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className="sp-blob sp-blob--sm" aria-hidden>
          {d.letter}
        </span>
        <span className="sp-other-text">
          <span className="sp-sr">Alternativ {d.letter}: </span>
          {text}
        </span>
        <ChevronDown className="sp-chev" size={18} strokeWidth={2.25} aria-hidden />
      </button>
      {open ? (
        <div className="sp-other-body" id={bodyId}>
          <h4 className="sp-h4">Varför det lockar</h4>
          <p className="sp-fb-p">
            <Rich text={d.why_tempting} act={act} />
            <Cites list={cites.tempting} act={act} />
          </p>
          <h4 className="sp-h4">Varför det är fel</h4>
          <p className="sp-fb-p">
            <Rich text={d.why_wrong} act={act} />
            <Cites list={cites.wrong} act={act} source={`why-${d.letter}`} />
          </p>
        </div>
      ) : null}
    </article>
  )
}

/** The one citation form: a ¶ chip at the end of the sentence it backs. */
function Cites({ list, act, source }: { list: number[]; act: DrillActions; source?: string }) {
  if (list.length === 0) return null
  return (
    <span className="sp-cites">
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="sp-cite"
          data-testid={`rd-cite-${n}`}
          onClick={() => act.cite(n, source)}
          aria-label={`Visa stycke ${n} i texten`}
        >
          ¶ {n}
        </button>
      ))}
    </span>
  )
}

/** Explanation text, verbatim, with its "(steg 2)" references made into
 *  links to the step. */
function Rich({ text, act }: { text: string; act: DrillActions }) {
  let at = 0
  return (
    <>
      {splitStepRefs(text).map((seg) => {
        const key = at
        at += seg.text.length
        return seg.kind === 'text' ? (
          <span key={key}>{seg.text}</span>
        ) : (
          <button
            key={key}
            type="button"
            className="sp-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}

// ── End of the unit: today's path, one step further ──────────────────

function Done({
  view,
  onHome,
  onRepeat,
}: {
  view: DrillView
  onHome: () => void
  onRepeat: () => void
}) {
  const right = view.results.filter((r) => r.correct).length
  const missed = view.results.length - right
  const next = PLAN.items[0]
  return (
    <section className="sp-done" data-testid="rd-done" aria-labelledby="sp-done-h">
      <span className="sp-done-chip">
        <Check size={16} strokeWidth={2.75} aria-hidden />
        Dagens stig 1 av {DAY_STEPS}
      </span>
      <p className="sp-eyebrow">{TITLE} är klar</p>
      <h2 className="sp-display" id="sp-done-h">
        {right} av {view.results.length} rätt
      </h2>
      <ol className="sp-done-qs" aria-label="Dina svar i texten">
        {view.results.map((r, i) => (
          <li key={r.qid} data-correct={String(r.correct)}>
            <span className="sp-done-q-node" aria-hidden>
              {r.correct ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <RotateCcw size={12} strokeWidth={3} />
              )}
            </span>
            <span className="sp-sr">
              Fråga {i + 1}
              {r.correct ? ', rätt' : ', lagd i Repetera'}
            </span>
          </li>
        ))}
      </ol>
      <p className="sp-lede">
        {missed === 0
          ? 'Hela texten satt.'
          : `${cap(WORDS[missed] ?? String(missed))} ${missed === 1 ? 'fråga ligger' : 'frågor ligger'} nu i Repetera och kommer tillbaka när du är redo.`}
      </p>
      <ol className="sp-mini" aria-label="Dagens stig">
        <li className="sp-mini-step" data-state="done" data-sec="LÄS">
          <span className="sp-mini-node" aria-hidden>
            <Check size={16} strokeWidth={3} />
          </span>
          <span className="sp-mini-text">
            <b>{TITLE}</b>
            <span>LÄS · klar</span>
          </span>
        </li>
        {PLAN.items.map((item, i) => (
          <li
            key={item.id}
            className="sp-mini-step"
            data-state={i === 0 ? 'next' : 'todo'}
            data-sec={secOf(item.section)}
          >
            <span className="sp-mini-node" aria-hidden>
              {i + 2}
            </span>
            <span className="sp-mini-text">
              <b>{item.title}</b>
              <span>
                {item.detail} · {item.minutes} min
              </span>
            </span>
            {i === 0 ? <span className="sp-next-chip">Nästa</span> : null}
          </li>
        ))}
        <li className="sp-mini-step" data-state="goal">
          <span className="sp-mini-node" aria-hidden>
            <Flag size={15} strokeWidth={2.25} />
          </span>
          <span className="sp-mini-text">
            <b>Klart för idag</b>
          </span>
        </li>
      </ol>
      <div className="sp-done-actions">
        <button type="button" className="sp-btn sp-btn--primary sp-btn--lg" onClick={onRepeat}>
          Fortsätt med {next.title} · {next.minutes} min
          <Kbd>↵</Kbd>
        </button>
        <button type="button" className="sp-btn sp-btn--quiet" onClick={onHome}>
          Till Idag
        </button>
      </div>
    </section>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneDrill({
  view,
  act,
  refs,
  note,
  setNote,
  badgeRef,
  scrollRef,
  focusOn,
  toggleFocus,
  onHome,
  onRepeat,
}: Shared &
  Note & {
    scrollRef: RefObject<HTMLDivElement | null>
    focusOn: boolean
    toggleFocus: () => void
    onHome: () => void
    onRepeat: () => void
  }) {
  const { state, setState, toggle, grab } = useSheet(view)
  const { hidden, onScroll: hideOnScroll } = useHideOnScroll()
  // The head hides when the reader scrolls, not when the app does.
  const quietUntil = useRef(0)
  const onScroll = (e: { currentTarget: HTMLElement }) => {
    if (Date.now() >= quietUntil.current) hideOnScroll(e)
  }
  const bandSeen = useSeen(badgeRef)
  const feedback = view.phase === 'feedback'
  // Below the 64 px head, with a little air.
  useTurnToEvidence(view, scrollRef, 80, () => {
    quietUntil.current = Date.now() + 900
  })

  // The sheet's body is reused across phases: a verdict, a new question or
  // an opening sheet starts at its top, not where the options left it.
  const bodyRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new question, verdict or opening
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
  }, [view.phase, view.index, state === 'peek'])

  // The passage ends where the sheet begins: the peek is measured, the
  // other states have set heights (CSS keys off data-sheet).
  const sheetRef = useRef<HTMLElement>(null)
  const [peekH, setPeekH] = useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the sheet changes shape
  useLayoutEffect(() => {
    const el = sheetRef.current
    if (!el || state !== 'peek') return
    const measure = () => setPeekH(el.offsetHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [state, view.phase, view.index])

  // Choosing opens the sheet; a ¶ chip drops it to half over the paragraph.
  const actSelect = act.select
  const select = (letter: AnswerLetter) => {
    actSelect(letter)
    setState('open')
  }
  const cite = (n: number, source?: string) => {
    setState('open')
    act.cite(n, source)
  }
  const sheetAct: DrillActions = { ...act, select, cite }

  if (view.phase === 'done') {
    return (
      <div className="sp-pdrill">
        <div className="sp-pdrill-scroll sp-pdrill-scroll--done">
          <Done view={view} onHome={onHome} onRepeat={onRepeat} />
        </div>
      </div>
    )
  }

  const last = view.index + 1 >= view.total
  const progress = ((view.index + (feedback ? 1 : 0)) / view.total) * 100
  const scrollStyle: CSSProperties | undefined =
    state === 'peek' ? { bottom: Math.max(0, peekH - 24) } : undefined
  return (
    <div className="sp-pdrill" data-sheet={state} data-phase={view.phase}>
      <div className="sp-thin" data-shown={String(hidden)} aria-hidden>
        <i style={{ width: `${progress}%` }} />
      </div>
      <header className="sp-ptop" data-hidden={String(hidden)}>
        <button
          type="button"
          className="sp-btn sp-btn--quiet sp-btn--sm"
          data-testid="rd-exit"
          onClick={act.exit}
        >
          <X size={17} strokeWidth={2.25} aria-hidden />
          Avsluta
        </button>
        <span className="sp-ptop-mid">
          <span className="sp-sec-chip sp-sec-chip--sm" data-sec="LÄS" title={SECTION_NAMES.LÄS}>
            LÄS
          </span>
          <Progress view={view} compact />
        </span>
        <button
          type="button"
          className="sp-icon-btn sp-icon-btn--sm"
          aria-pressed={focusOn}
          aria-label="Styckefokus"
          onClick={toggleFocus}
        >
          <Focus size={19} strokeWidth={2} aria-hidden />
        </button>
        <Timer seconds={view.elapsed} compact />
      </header>
      {hidden ? (
        <button
          type="button"
          className="sp-pin-exit"
          data-testid="sp-pin-exit"
          aria-label="Avsluta"
          onClick={act.exit}
        >
          <X size={20} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
      <div className="sp-pdrill-scroll" ref={scrollRef} onScroll={onScroll} style={scrollStyle}>
        <Reader
          view={view}
          act={sheetAct}
          refs={refs}
          note={note}
          setNote={setNote}
          badgeRef={badgeRef}
        />
        <div aria-hidden style={{ height: 32 }} />
      </div>
      <section
        className="sp-psheet"
        ref={sheetRef}
        data-testid="rd-sheet"
        data-state={state}
        data-phase={view.phase}
        aria-label={`Fråga ${view.index + 1}`}
      >
        <div className="sp-psheet-grabrow">
          <button
            type="button"
            className="sp-grab"
            aria-label={state === 'peek' ? 'Visa frågan' : 'Visa texten'}
            aria-expanded={state !== 'peek'}
            {...grab}
          />
          <span
            className="sp-badge-chip sp-badge-chip--sm"
            data-hidden={String(bandSeen)}
            aria-hidden={bandSeen}
          >
            {OVNINGSTEXT_BADGE}
          </span>
        </div>
        {feedback ? (
          <div className="sp-psheet-head">
            <Verdict view={view} compact />
          </div>
        ) : null}
        <div className="sp-psheet-body" ref={bodyRef}>
          {feedback ? (
            state === 'peek' ? (
              <button type="button" className="sp-show" onClick={toggle}>
                Tillbaka till facit
                <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
              </button>
            ) : (
              <FeedbackBody view={view} act={sheetAct} refs={refs} chip />
            )
          ) : (
            <>
              <h2 className="sp-prompt">{view.question.prompt}</h2>
              {state === 'peek' ? (
                <button type="button" className="sp-show" onClick={toggle}>
                  Visa alternativen ({view.question.options.length})
                  <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
                </button>
              ) : null}
              <div hidden={state === 'peek'}>
                <Options view={view} act={sheetAct} />
              </div>
            </>
          )}
        </div>
        {state === 'peek' ? null : (
          <div className="sp-psheet-foot">
            {feedback ? (
              <>
                <button
                  type="button"
                  className="sp-btn sp-btn--quiet"
                  onClick={() => setState('peek')}
                >
                  <ChevronDown size={18} strokeWidth={2.25} aria-hidden />
                  Visa texten
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn--primary sp-btn--lg sp-btn--grow"
                  data-testid="rd-next"
                  onClick={act.next}
                >
                  {last ? 'Klart med texten' : 'Nästa fråga'}
                </button>
              </>
            ) : (
              <>
                <span className="sp-echo" aria-live="polite">
                  {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
                </span>
                <button
                  type="button"
                  className="sp-btn sp-btn--primary sp-btn--lg"
                  data-testid="rd-lock"
                  disabled={!view.selected}
                  onClick={act.lock}
                >
                  Svara
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
