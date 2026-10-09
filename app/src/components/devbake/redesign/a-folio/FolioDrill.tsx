// Folio · Läsfråga and Facit — the drill as a book spread.
//
// Desktop: two facing pages and no app bar. Each page carries its own
// running head, as a book does: the verso's holds the exit, LÄS ·
// ÖVNINGSTEXT and Styckefokus; the recto's the position and the clock.
// The verso carries the passage with ¶ numbers on each first baseline in
// the margin; the recto carries the question, its options set as an
// indented list between hairlines (no boxes). After the answer the recto
// leads with the verdict and the one thing to learn — why the chosen option
// tempted, the pitfall, the technique — and only then the solution and its
// steps. The explanation's verbatim quotations are underlined in the
// passage itself, and a ¶ link marks the exact sentence it points at. The
// fold between the pages is a resizable separator (drag, or ←/→ when
// focused).
// Phone: the passage first, the whole question in a sheet that peeks,
// opens and goes full for the explanation; the head folds to a strip while
// reading, so the exit, the ¶ aid and a thin progress line stay in reach.

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleSlash,
  Clock,
  Info,
  Pilcrow,
  Undo2,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  FRAMEWORK_NAMES,
  OVNINGSTEXT_BADGE,
  OVNINGSTEXT_NOTE,
  PLAN,
  TODAY,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type Destination,
  type DirectionProps,
  type DrillActions,
  type DrillRefs,
  type DrillView,
  fmtClock,
  prefersReducedMotion,
  type QuoteMark,
  splitStepRefs,
  useDrill,
  useHideOnScroll,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import { Dots } from './FolioHome'

const [TITLE, SUBTITLE] = UNIT.title.split(': ')
/** A pace for the folded clock's line: about four minutes a question. */
const PACE_SECONDS = 15 * 60
const WORDS = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem']
/** The plan's next part, offered when the text is done. */
const NEXT = PLAN.items[0]
const NEXT_DEST: Destination = NEXT?.kind === 'lektion' ? 'uppslag' : 'ova'

type Shared = {
  view: DrillView
  act: DrillActions
  refs: DrillRefs
}

/** Which explanation part the reader is pointing at (hover or focus): its
 *  quotations are tinted in the passage. */
type Pointing = { active: string | null; point: (source: string | null) => void }

export function FolioDrill({
  screen,
  width,
  live,
  onScreen,
  onGo,
}: DirectionProps & { onGo: (d: Destination) => void }) {
  const { view, act, refs } = useDrill({ screen, onScreen, live })
  const [note, setNote] = useState(false)
  const focusOn = view.focusPara != null
  const toggleFocus = () => act.setFocusPara(focusOn ? null : 1)
  const onNext = () => onGo(NEXT_DEST)

  const keys: Record<string, () => void> = {
    Enter: () => {
      if (view.phase === 'question') act.lock()
      else if (view.phase === 'feedback') act.next()
      else onNext()
    },
    j: () => act.moveFocusPara(1),
    k: () => act.moveFocusPara(-1),
    f: toggleFocus,
    Escape: () => act.setFocusPara(null),
  }
  for (const o of view.question.options) {
    const l = o.letter.toLowerCase()
    keys[l] = () => act.select(o.letter)
    keys[`Shift+${l}`] = () => act.toggleEliminate(o.letter)
  }
  useKeyMap(keys, live)

  const shared = { view, act, refs }
  if (width === 'phone') {
    return (
      <PhoneDrill
        {...shared}
        note={note}
        setNote={setNote}
        focusOn={focusOn}
        toggleFocus={toggleFocus}
        onHome={() => onScreen(1)}
        onNext={onNext}
      />
    )
  }
  return (
    <DeskDrill
      {...shared}
      note={note}
      setNote={setNote}
      focusOn={focusOn}
      toggleFocus={toggleFocus}
      onHome={() => onScreen(1)}
      onNext={onNext}
    />
  )
}

type DrillChrome = Shared & {
  note: boolean
  setNote: (open: boolean) => void
  focusOn: boolean
  toggleFocus: () => void
  onHome: () => void
  /** The end of the unit's way on: the plan's next part. */
  onNext: () => void
}

// ── Desktop ──────────────────────────────────────────────────────────

function DeskDrill({
  view,
  act,
  refs,
  note,
  setNote,
  focusOn,
  toggleFocus,
  onHome,
  onNext,
}: DrillChrome) {
  const [clockShown, setClockShown] = useState(true)
  const exit = (
    <button
      type="button"
      className="fo-ghost"
      onClick={act.exit}
      title="Dina svar är sparade"
      data-testid="rd-exit"
    >
      <X size={18} strokeWidth={1.5} aria-hidden />
      Avsluta
    </button>
  )
  const badge = (
    <span className="fo-label fo-runhead-title">
      LÄS · <span data-testid="rd-badge">{OVNINGSTEXT_BADGE}</span>
    </span>
  )

  if (view.phase === 'done') {
    return (
      <div className="fo-drill">
        <header className="fo-runhead fo-runhead--solo">
          {exit}
          {badge}
          <span />
        </header>
        <div className="fo-main fo-done">
          <Colophon view={view} onHome={onHome} onNext={onNext} />
        </div>
      </div>
    )
  }

  const versoHead = (
    <header className="fo-runhead">
      {exit}
      {badge}
      <button
        type="button"
        className="fo-ghost"
        aria-pressed={focusOn}
        onClick={toggleFocus}
        title="Styckefokus: F slår på, J och K byter stycke"
      >
        <Pilcrow size={16} strokeWidth={1.5} aria-hidden />
        Styckefokus
      </button>
    </header>
  )
  const rectoHead = (
    <header className="fo-runhead fo-runhead--recto">
      <span className="fo-runhead-pos">
        <Dots total={view.total} done={view.index} />
        <span>
          Fråga {view.index + 1} av {view.total}
        </span>
      </span>
      <ClockButton
        seconds={view.elapsed}
        shown={clockShown}
        toggle={() => setClockShown((s) => !s)}
      />
      {clockShown ? null : <TimeLine seconds={view.elapsed} />}
    </header>
  )
  return (
    <div className="fo-drill">
      <Spread
        view={view}
        act={act}
        refs={refs}
        note={note}
        setNote={setNote}
        versoHead={versoHead}
        rectoHead={rectoHead}
      />
    </div>
  )
}

function ClockButton({
  seconds,
  shown,
  toggle,
}: {
  seconds: number
  shown: boolean
  toggle: () => void
}) {
  return (
    <button
      type="button"
      className="fo-clock"
      onClick={toggle}
      aria-pressed={!shown}
      aria-label={shown ? `Tid ${fmtClock(seconds)}. Dölj klockan` : 'Visa klockan'}
      title={shown ? 'Dölj klockan – en tunn linje visar tiden' : 'Visa klockan'}
    >
      <Clock size={15} strokeWidth={1.5} aria-hidden className="fo-clock-icon" />
      {shown ? <span aria-hidden>{fmtClock(seconds)}</span> : null}
    </button>
  )
}

function TimeLine({ seconds }: { seconds: number }) {
  return (
    <span className="fo-timeline" aria-hidden>
      <i style={{ width: `${Math.min(1, seconds / PACE_SECONDS) * 100}%` }} />
    </span>
  )
}

const SPLIT_MIN = 0.4
const SPLIT_MAX = 0.68
const SPLIT_START = 0.56
/** The running head's height (folio.css .fo-runhead). */
const RUNHEAD = 56

/** The first paragraph the essential steps cite — where the evidence is. */
function evidencePara(view: DrillView): number | undefined {
  for (const s of view.explanation.steps ?? []) {
    const cites = view.stepCites[s.n]
    if (s.tier !== 'detail' && cites?.length) return cites[0]
  }
  return view.cited[0]
}

function Spread({
  view,
  act,
  refs,
  note,
  setNote,
  versoHead,
  rectoHead,
}: Shared & {
  note: boolean
  setNote: (open: boolean) => void
  versoHead: ReactNode
  rectoHead: ReactNode
}) {
  const [split, setSplit] = useState(SPLIT_START)
  const [dragging, setDragging] = useState(false)
  const [active, point] = useState<string | null>(null)
  const spreadRef = useRef<HTMLDivElement>(null)
  const rectoRef = useRef<HTMLElement>(null)
  const versoRef = useRef<HTMLDivElement>(null)
  const firstTurn = useRef(true)

  // A new question or a fresh verdict starts at the top of the recto; a
  // verdict also turns the verso to the evidence its steps cite (instantly
  // the first time, so a deep link lands there).
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on question/phase change only
  useEffect(() => {
    rectoRef.current?.scrollTo?.({ top: 0 })
    const verso = versoRef.current
    const n = view.phase === 'feedback' ? evidencePara(view) : undefined
    const el = n ? verso?.querySelector<HTMLElement>(`[data-n="${n}"]`) : null
    if (verso && el) {
      const smooth = !firstTurn.current && !prefersReducedMotion()
      // Clear of the sticky running head, with a line of air above.
      verso.scrollTo?.({
        top: Math.max(0, el.offsetTop - RUNHEAD - 28),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
    firstTurn.current = false
  }, [view.index, view.phase])

  const clamp = (v: number) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, v))
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !spreadRef.current) return
    const r = spreadRef.current.getBoundingClientRect()
    setSplit(clamp((e.clientX - r.left) / r.width))
  }
  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.06 : 0.02
    if (e.key === 'ArrowLeft') setSplit((s) => clamp(s - step))
    else if (e.key === 'ArrowRight') setSplit((s) => clamp(s + step))
    else if (e.key === 'Home') setSplit(SPLIT_MIN)
    else if (e.key === 'End') setSplit(SPLIT_MAX)
    else return
    e.preventDefault()
  }

  return (
    <div
      className="fo-spread"
      ref={spreadRef}
      style={{ '--fo-split': `${split * 100}%` } as CSSProperties}
    >
      <div className="fo-page fo-page--verso" ref={versoRef}>
        {versoHead}
        <PassageView
          view={view}
          act={act}
          refs={refs}
          note={note}
          setNote={setNote}
          active={active}
        />
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: a focusable, valued separator is the WAI-ARIA splitter pattern; <hr> cannot take focus or a value */}
      <div
        className="fo-gutter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Uppslagets rygg – dra för att ändra sidornas bredd"
        aria-valuemin={SPLIT_MIN * 100}
        aria-valuemax={SPLIT_MAX * 100}
        aria-valuenow={Math.round(split * 100)}
        tabIndex={0}
        data-dragging={String(dragging)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onDoubleClick={() => setSplit(SPLIT_START)}
        onKeyDown={onKey}
      >
        <span className="fo-gutter-grip" />
      </div>
      <section
        className="fo-page fo-page--recto"
        aria-label={`Fråga ${view.index + 1}`}
        ref={rectoRef}
      >
        {rectoHead}
        {/* The action follows the options in the flow; it sticks to the
         *  page foot only once the facit runs longer than the page. */}
        <div className="fo-recto-body">
          <QuestionColumn view={view} act={act} refs={refs} active={active} point={point} />
          <ActionBar view={view} act={act} />
        </div>
      </section>
    </div>
  )
}

/** The recto's content in either phase (the running head above it carries
 *  the position). */
function QuestionColumn({ view, act, refs, active, point }: Shared & Pointing) {
  if (view.phase === 'question') {
    return (
      <>
        <h2 className="fo-prompt">{view.question.prompt}</h2>
        <Options view={view} act={act} />
        <KeyHints />
      </>
    )
  }
  return (
    <>
      <Verdict view={view} />
      <p className="fo-prompt" data-after="true">
        {view.question.prompt}
      </p>
      <GradedOptions view={view} />
      <Facit view={view} act={act} refs={refs} active={active} point={point} />
    </>
  )
}

function KeyHints() {
  return (
    <p className="fo-keys">
      <span>
        <kbd className="fo-kbd">A</kbd>–<kbd className="fo-kbd">D</kbd> väljer
      </span>
      <span>
        <kbd className="fo-kbd">↵</kbd> svarar
      </span>
      <span>
        <kbd className="fo-kbd">⇧</kbd> + bokstav stryker
      </span>
      <span>
        <kbd className="fo-kbd">F</kbd> styckefokus
      </span>
    </p>
  )
}

function ActionBar({ view, act }: Pick<Shared, 'view' | 'act'>) {
  const last = view.index + 1 >= view.total
  if (view.phase === 'question') {
    return (
      <div className="fo-actionbar">
        <button
          type="button"
          className="fo-btn"
          disabled={!view.selected}
          onClick={act.lock}
          data-testid="rd-lock"
        >
          Svara
          <kbd className="fo-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
        <span className="fo-echo" aria-live="polite">
          {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
        </span>
      </div>
    )
  }
  return (
    <div className="fo-actionbar">
      {/* "Slutför", not "Avsluta": Avsluta is the way out mid-text. */}
      <button type="button" className="fo-btn" onClick={act.next} data-testid="rd-next">
        {last ? 'Slutför texten' : 'Nästa fråga'}
        <kbd className="fo-kbd" aria-hidden>
          ↵
        </kbd>
      </button>
      <span className="fo-echo">
        {last ? 'Sista frågan i texten' : `Fråga ${view.index + 2} av ${view.total} väntar`}
      </span>
    </div>
  )
}

// ── The passage ──────────────────────────────────────────────────────

/** The quotations to underline: every step's, and — after a wrong answer —
 *  the ones that say why the chosen option is wrong. */
function shownMarks(view: DrillView): QuoteMark[] {
  if (view.phase !== 'feedback') return []
  return view.marks.filter(
    (m) => m.source.startsWith('step-') || (!view.correct && m.source === `why-${view.picked}`),
  )
}

/** A paragraph's text with its marks, overlaps dropped (first wins). */
function marked(
  text: string,
  marks: QuoteMark[],
  view: DrillView,
  active: string | null,
): ReactNode[] {
  const sorted = [...marks].sort((a, b) => a.start - b.start || b.end - a.end)
  const out: ReactNode[] = []
  let at = 0
  for (const m of sorted) {
    if (m.start < at) continue
    if (m.start > at) out.push(text.slice(at, m.start))
    out.push(
      <mark
        key={`${m.source}-${m.start}`}
        className="fo-ev"
        data-src={m.source}
        data-kind={m.source.startsWith('why-') ? 'wrong' : 'evidence'}
        data-active={String(active === m.source)}
        data-flash={String(view.flashSource === m.source && view.flashPara === m.para)}
      >
        {text.slice(m.start, m.end)}
      </mark>,
    )
    at = m.end
  }
  if (at < text.length) out.push(text.slice(at))
  return out
}

function PassageView({
  view,
  act,
  refs,
  note,
  setNote,
  active,
  badge = false,
}: Shared & {
  note: boolean
  setNote: (open: boolean) => void
  active: string | null
  /** Phone: the badge stands above the passage (desktop: in the head). */
  badge?: boolean
}) {
  const { paragraphs, byline } = view.passage
  const graded = view.phase === 'feedback'
  const marks = shownMarks(view)
  return (
    <article className="fo-passage" aria-labelledby="fo-ptitle">
      <div className="fo-ptools">
        {badge ? (
          <span className="fo-badge" data-testid="rd-badge">
            {OVNINGSTEXT_BADGE}
          </span>
        ) : null}
        <button
          type="button"
          className="fo-badge-toggle"
          data-testid="rd-note-toggle"
          aria-expanded={note}
          aria-controls="fo-note"
          onClick={() => setNote(!note)}
        >
          <Info size={14} strokeWidth={1.5} aria-hidden />
          {note ? 'Dölj noten' : 'Om texten'}
        </button>
      </div>
      <p className="fo-note" id="fo-note" hidden={!note} data-testid="rd-note">
        {OVNINGSTEXT_NOTE}
      </p>
      <h1 className="fo-ptitle" id="fo-ptitle">
        {TITLE}
        <span>{SUBTITLE}</span>
      </h1>
      <div
        className="fo-pbody"
        data-focus={String(view.focusPara != null)}
        data-testid="rd-passage"
      >
        {paragraphs.map((p, i) => {
          const n = i + 1
          const own = marks.filter((m) => m.para === n)
          // A ¶ link whose part quotes this paragraph marks the sentence;
          // otherwise the whole paragraph takes the mark.
          const sentence = own.some((m) => m.source === view.flashSource)
          return (
            <p
              key={n}
              ref={refs.para(n)}
              className="fo-para"
              data-testid={`rd-para-${n}`}
              data-n={n}
              data-cited={String(graded && view.cited.includes(n))}
              data-flash={String(view.flashPara === n && !sentence)}
              data-focused={String(view.focusPara === n)}
            >
              {/* Out of the tab order: nine of these must not stand between
               *  the reader and the options; F, J and K drive the same aid. */}
              <button
                type="button"
                className="fo-pnum"
                tabIndex={-1}
                aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                aria-pressed={view.focusPara === n}
                onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
              >
                {n}
              </button>
              {own.length ? marked(p, own, view, active) : p}
            </p>
          )
        })}
        {byline ? <p className="fo-byline">{byline}</p> : null}
      </div>
    </article>
  )
}

// ── Options ──────────────────────────────────────────────────────────

function Options({ view, act }: Pick<Shared, 'view' | 'act'>) {
  return (
    <ol className="fo-opts" aria-label="Svarsalternativ">
      {view.question.options.map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="fo-opt"
            data-state={selected ? 'selected' : out ? 'eliminated' : undefined}
          >
            <button
              type="button"
              className="fo-opt-main"
              data-testid={`rd-option-${o.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(o.letter)}
            >
              <span className="fo-letter" aria-hidden>
                {o.letter}
              </span>
              <span className="fo-opt-text">
                <span className="fo-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                {o.text}
              </span>
            </button>
            <button
              type="button"
              className="fo-opt-x"
              data-testid={`rd-eliminate-${o.letter}`}
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
              title={out ? 'Ångra' : 'Stryk alternativet (⇧ + bokstav)'}
              onClick={() => act.toggleEliminate(o.letter)}
            >
              {out ? (
                <Undo2 size={16} strokeWidth={1.5} aria-hidden />
              ) : (
                <CircleSlash size={16} strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** After the answer: the chosen option and the right one, in full and at
 *  the same size as before; the rest wait behind one quiet link. */
function GradedOptions({ view }: { view: DrillView }) {
  const [all, setAll] = useState(false)
  const key = view.question.answer
  const shown = view.question.options.filter(
    (o) => all || o.letter === key || o.letter === view.picked,
  )
  const rest = view.question.options.length - shown.length
  return (
    <>
      <ol className="fo-opts" aria-label="Svarsalternativ, rättade">
        {shown.map((o) => {
          const right = o.letter === key
          const mine = o.letter === view.picked
          return (
            <li
              key={o.letter}
              className="fo-opt"
              data-grade={right ? 'right' : mine ? 'wrong' : 'other'}
            >
              <div className="fo-opt-main">
                <span className="fo-letter" aria-hidden>
                  {o.letter}
                </span>
                <span className="fo-opt-text">
                  <span className="fo-sr">Alternativ {o.letter}: </span>
                  {o.text}
                  {right || mine ? (
                    <span className="fo-opt-tag">
                      {right ? (
                        <Check size={14} strokeWidth={2.25} aria-hidden />
                      ) : (
                        <X size={14} strokeWidth={2.25} aria-hidden />
                      )}
                      {right && mine ? 'Ditt svar · rätt' : right ? 'Rätt svar' : 'Ditt svar'}
                    </span>
                  ) : null}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      {rest > 0 || all ? (
        <button
          type="button"
          className="fo-more fo-more-opts"
          aria-expanded={all}
          onClick={() => setAll(!all)}
        >
          {all ? 'Visa bara ditt svar och det rätta' : 'Visa alla alternativ'}
          <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </>
  )
}

// ── The facit ────────────────────────────────────────────────────────

function Verdict({ view, as = 'h2' }: { view: DrillView; as?: 'h2' | 'p' }) {
  const correct = view.correct === true
  const Tag = as
  return (
    <Tag
      className="fo-verdict"
      id="fo-verdict"
      data-correct={String(correct)}
      data-testid="rd-verdict"
    >
      <span className="fo-verdict-glyph" aria-hidden>
        {correct ? <Check size={18} strokeWidth={2.25} /> : <X size={18} strokeWidth={2.25} />}
      </span>
      <span>
        <b>{correct ? 'Rätt.' : 'Fel.'}</b>{' '}
        {correct ? `Svaret är ${view.question.answer}.` : `Rätt svar är ${view.question.answer}.`}
      </span>
    </Tag>
  )
}

/**
 * The explanation, ordered for learning: why the chosen option tempted
 * (and why it is wrong), what to take away (pitfall, technique), the
 * solution and its steps, and last the other options, folded.
 */
function Facit({ view, act, refs, active, point }: Shared & Pointing) {
  const e = view.explanation
  const q = view.question
  const optionText = (letter: string) => q.options.find((o) => o.letter === letter)?.text ?? ''
  const mine = view.correct ? null : e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const framework = e.framework_id ? FRAMEWORK_NAMES[e.framework_id] : undefined
  const hover = (source: string) => ({
    onMouseEnter: () => point(source),
    onMouseLeave: () => point(null),
    onFocus: () => point(source),
    onBlur: () => point(null),
  })
  return (
    <div className="fo-facit">
      {mine ? (
        <section
          className="fo-fsec fo-fsec--lure"
          data-testid={`rd-distractor-${mine.letter}`}
          {...hover(`why-${mine.letter}`)}
        >
          {/* Two siblings, so one heading style for both. */}
          <h3 className="fo-h3">Därför lockade {mine.letter}</h3>
          <p className="fo-prose">
            <Rich text={mine.why_tempting} act={act} />
          </p>
          <Cites
            list={view.distractorCites[mine.letter]?.tempting ?? []}
            source={`why-${mine.letter}`}
            act={act}
          />
          <h3 className="fo-h3 fo-h3--next">Varför {mine.letter} är fel</h3>
          <p className="fo-prose">
            <Rich text={mine.why_wrong} act={act} />
          </p>
          <Cites
            list={view.distractorCites[mine.letter]?.wrong ?? []}
            source={`why-${mine.letter}`}
            act={act}
          />
        </section>
      ) : null}

      <section className="fo-fsec fo-notes">
        <h3 className="fo-h3">Att ta med dig</h3>
        {e.pitfall ? (
          <div className="fo-note-item" data-testid="rd-pitfall">
            <span className="fo-sub">Fallgropen</span>
            <p className="fo-prose">{e.pitfall}</p>
          </div>
        ) : null}
        <div className="fo-note-item" data-testid="rd-technique">
          <span className="fo-sub">Tekniken</span>
          <p className="fo-prose">{e.technique}</p>
        </div>
      </section>

      <section className="fo-fsec">
        <h3 className="fo-h3">Lösningen</h3>
        <p className="fo-prose">{e.solution_path}</p>
      </section>

      <section className="fo-fsec">
        <h3 className="fo-h3">Steg för steg</h3>
        <ol>
          {(e.steps ?? []).map((s) => (
            <Step key={s.n} step={s} view={view} act={act} refs={refs} hover={hover} />
          ))}
        </ol>
      </section>

      <section className="fo-fsec">
        <h3 className="fo-h3">{mine ? 'De andra alternativen' : 'Alternativen'}</h3>
        {others.map((d) => (
          <Distractor
            key={d.letter}
            d={d}
            text={optionText(d.letter)}
            cites={view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }}
            act={act}
            active={active}
          />
        ))}
      </section>

      {framework ? (
        <p className="fo-framework">
          Ramverk: <b>{framework}</b> · finns att slå upp i Uppslag
        </p>
      ) : null}
    </div>
  )
}

function Step({
  step,
  view,
  act,
  refs,
  hover,
}: Shared & {
  step: ExplanationStep
  hover: (source: string) => Record<string, () => void>
}) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  const source = `step-${step.n}`
  return (
    <li
      className="fo-step"
      data-tier={step.tier ?? 'essential'}
      data-testid={`rd-step-${step.n}`}
      ref={refs.step(step.n)}
      {...hover(source)}
    >
      <span className="fo-step-n" aria-hidden>
        {step.n}
      </span>
      <div>
        <div className="fo-step-head">
          <h4 className="fo-step-title">
            <span className="fo-sr">Steg {step.n}: </span>
            {step.title}
          </h4>
          <Cites list={view.stepCites[step.n] ?? []} source={source} act={act} />
        </div>
        {open ? (
          <p className="fo-step-text">
            <Rich text={step.text} act={act} />
          </p>
        ) : null}
        {detail ? (
          <button
            type="button"
            className="fo-more"
            data-testid={`rd-step-toggle-${step.n}`}
            aria-expanded={open}
            onClick={() => act.toggleStep(step.n)}
          >
            {open ? 'Dölj fördjupningen' : 'Fördjupning'}
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  )
}

function Distractor({
  d,
  text,
  cites,
  act,
  active,
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: DrillActions
  active: string | null
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `fo-dis-${d.letter}`
  return (
    <article
      className="fo-dis"
      data-testid={`rd-distractor-${d.letter}`}
      data-active={String(active === `why-${d.letter}`)}
    >
      <div className="fo-dis-head">
        <span className="fo-letter" aria-hidden>
          {d.letter}
        </span>
        <div>
          <p className="fo-dis-opt">
            <span className="fo-sr">Alternativ {d.letter}: </span>
            {text}
          </p>
          <button
            type="button"
            className="fo-more"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Dölj' : 'Varför det lockar – och varför det är fel'}
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
      {open ? (
        <div className="fo-dis-body" id={bodyId}>
          <span className="fo-sub">Varför det lockar</span>
          <p className="fo-prose">
            <Rich text={d.why_tempting} act={act} />
          </p>
          <Cites list={cites.tempting} source={`why-${d.letter}`} act={act} />
          <span className="fo-sub">Varför det är fel</span>
          <p className="fo-prose">
            <Rich text={d.why_wrong} act={act} />
          </p>
          <Cites list={cites.wrong} source={`why-${d.letter}`} act={act} />
        </div>
      ) : null}
    </article>
  )
}

/** Citations as a footnote's "see": inline ¶ references, no pills. */
function Cites({ list, source, act }: { list: number[]; source: string; act: DrillActions }) {
  if (list.length === 0) return null
  return (
    <span className="fo-cites">
      <span className="fo-cites-see" aria-hidden>
        Se
      </span>
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="fo-cite"
          data-testid={`rd-cite-${n}`}
          onClick={() => act.cite(n, source)}
          aria-label={`Visa stycke ${n} i texten`}
        >
          ¶{n}
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
            className="fo-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}

// ── End of the unit: a typographic colophon ──────────────────────────

function Colophon({
  view,
  onHome,
  onNext,
}: {
  view: DrillView
  onHome: () => void
  onNext: () => void
}) {
  const right = view.results.filter((r) => r.correct).length
  const misses = view.total - right
  return (
    <div className="fo-colophon" data-testid="rd-done">
      <div className="fo-colophon-text">
        <span className="fo-colophon-mark" aria-hidden>
          ⁂
        </span>
        <h2>
          {TITLE}
          <span>{SUBTITLE}</span>
        </h2>
        <p className="fo-colophon-facts">
          {view.total} frågor · {right} rätt · {Math.max(1, Math.round(view.elapsed / 60))} min
        </p>
        <p>
          Läst och besvarad {TODAY.dateLabel.toLowerCase()}.{' '}
          {misses > 0
            ? `${misses === 1 ? 'Missen väntar' : 'Missarna väntar'} i nästa repetition, de äldsta först.`
            : 'Inga missar att repetera.'}
        </p>
      </div>
      {/* The day goes on: the plan's next part is the one action. */}
      <div className="fo-colophon-actions">
        {NEXT ? (
          <button type="button" className="fo-btn" onClick={onNext} data-testid="rd-done-next">
            Nästa: {NEXT.title} · {NEXT.minutes} min
            <kbd className="fo-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
        ) : null}
        <button type="button" className="fo-more fo-colophon-home" onClick={onHome}>
          Till Idag
        </button>
      </div>
    </div>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneDrill({
  view,
  act,
  refs,
  note,
  setNote,
  focusOn,
  toggleFocus,
  onHome,
  onNext,
}: DrillChrome) {
  const { state: sheet, setState: setSheet, toggle, grab } = useSheet(view)
  const { hidden: compact, onScroll: onHeadScroll } = useHideOnScroll()
  // The passage's own badge has scrolled away: the sheet carries it.
  const [badgeGone, setBadgeGone] = useState(false)
  const onScroll = (e: { currentTarget: HTMLElement }) => {
    onHeadScroll(e)
    setBadgeGone(e.currentTarget.scrollTop > 120)
  }

  // A ¶ link folds the sheet to its peek so the cited paragraph shows.
  const cite = (n: number, source?: string) => {
    setSheet('peek')
    act.cite(n, source)
  }
  const sheetAct: DrillActions = { ...act, cite }

  if (view.phase === 'done') {
    return (
      <div className="fo-pdrill">
        <div className="fo-pdrill-scroll fo-done">
          <Colophon view={view} onHome={onHome} onNext={onNext} />
        </div>
      </div>
    )
  }

  const progress = ((view.index + (view.phase === 'feedback' ? 1 : 0)) / view.total) * 100
  const feedback = view.phase === 'feedback'
  return (
    <div className="fo-pdrill">
      <header className="fo-pdrill-head" data-compact={String(compact)}>
        <button
          type="button"
          className="fo-ghost"
          onClick={act.exit}
          aria-label="Avsluta"
          title="Dina svar är sparade"
          data-testid="rd-exit"
        >
          <X size={18} strokeWidth={1.5} aria-hidden />
          <span className="fo-exit-label" aria-hidden>
            Avsluta
          </span>
        </button>
        {/* Progress once here — the line along the head's foot; the slip
         *  names the question. */}
        <span />
        <div className="fo-head-right">
          <button
            type="button"
            className="fo-ghost fo-focus-btn"
            aria-pressed={focusOn}
            aria-label="Styckefokus"
            onClick={toggleFocus}
          >
            <Pilcrow size={16} strokeWidth={1.5} aria-hidden />
            <span aria-hidden>Fokus</span>
          </button>
          <span className="fo-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
            <Clock size={14} strokeWidth={1.5} aria-hidden className="fo-clock-icon" />
            <span aria-hidden>{fmtClock(view.elapsed)}</span>
          </span>
        </div>
        <span className="fo-head-progress" aria-hidden>
          <i style={{ width: `${progress}%` }} />
        </span>
      </header>
      {/* Under the full-height feedback sheet the passage is out of reach:
       *  inert, so focus never lands on something covered. */}
      <div className="fo-pdrill-scroll" onScroll={onScroll} inert={sheet === 'full'}>
        <PassageView
          view={view}
          act={act}
          refs={refs}
          note={note}
          setNote={setNote}
          active={null}
          badge
        />
        <div style={{ height: sheet === 'peek' ? 260 : 120 }} aria-hidden />
      </div>
      <section
        className="fo-sheet"
        data-state={sheet}
        data-testid="rd-sheet"
        aria-label={`Fråga ${view.index + 1}`}
      >
        {/* The grab is for thumbs and pointers: the keyboard has the same
         *  moves as labelled buttons (the peek's action, "Visa texten"),
         *  so it stays out of the tab order. */}
        <button
          type="button"
          className="fo-sheet-grab"
          tabIndex={-1}
          aria-label={sheet === 'peek' ? 'Visa frågan' : 'Visa texten'}
          aria-expanded={sheet !== 'peek'}
          {...grab}
        />
        <div className="fo-sheet-head">
          <span className="fo-label">
            Fråga {view.index + 1} av {view.total}
            {badgeGone || feedback ? (
              <span className="fo-sheet-badge"> · {OVNINGSTEXT_BADGE}</span>
            ) : null}
          </span>
          {/* The way back to the text, where the eye looks for it. */}
          {sheet === 'peek' ? null : (
            <button
              type="button"
              className="fo-more fo-sheet-back"
              onClick={() => setSheet('peek')}
            >
              Visa texten
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>
        <div className="fo-sheet-body">
          {sheet === 'peek' ? (
            <>
              {feedback ? <Verdict view={view} as="p" /> : null}
              {feedback ? null : <h2 className="fo-prompt">{view.question.prompt}</h2>}
              {/* The peek's one action: the screen's filled button. */}
              <button type="button" className="fo-btn fo-peek-btn" onClick={toggle}>
                {feedback
                  ? 'Tillbaka till facit'
                  : `Visa de ${WORDS[view.question.options.length] ?? view.question.options.length} alternativen`}
                <ChevronUp size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : feedback ? (
            <>
              <Verdict view={view} as="p" />
              <p className="fo-prompt" data-after="true">
                {view.question.prompt}
              </p>
              <GradedOptions view={view} />
              <Facit view={view} act={sheetAct} refs={refs} active={null} point={() => {}} />
            </>
          ) : (
            <>
              <h2 className="fo-prompt">{view.question.prompt}</h2>
              <Options view={view} act={act} />
            </>
          )}
        </div>
        {sheet === 'peek' ? null : <ActionBar view={view} act={act} />}
      </section>
    </div>
  )
}
