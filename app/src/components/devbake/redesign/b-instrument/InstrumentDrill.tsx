// Instrument · Läsfråga and Facit — the drill as a precision workspace.
//
// Desktop: the grey chassis stays; the sidebar recedes to a dimmed rail and
// a breadcrumb names where you are. The chassis' top strip carries the
// progress, the clock, Fokus and Avsluta; its status bar the key legend for
// the current phase. Passage and question are two inset panels, each with
// a mono panel head; the gap between them is the resizable separator.
// After the answer the question panel becomes the answer panel — verdict,
// your answer and the right one in full, the rest behind a disclosure —
// and the explanation opens in place (at once after a wrong answer; on X
// after a right one). Only from ~1680 px is there room for a third panel,
// the inspector. Focus mode (F) drops all chrome but a hairline of
// progress and a corner cluster with the clock and Avsluta.
// Phone: the passage first, the question in a bottom sheet — a panel with
// a chassis head strip — whose peek shows the whole question; the head
// folds to a strip that keeps the way out while reading.

import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  Clock,
  Info,
  Lightbulb,
  Maximize2,
  Minimize2,
  Pilcrow,
  TriangleAlert,
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
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
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
import type { AnswerLetter } from '@/data/questions'
import { DEST_ICONS, Kc, Mark, Segs, useWidth } from './parts'

const [TITLE, SUBTITLE] = UNIT.title.split(': ')

/** From here on the explanation may take a pane of its own. */
const WIDE = 1680
const Q_MIN = 360
const Q_MAX = 640

type Shared = {
  view: DrillView
  act: DrillActions
  refs: DrillRefs
}

type NoteState = { note: boolean; setNote: (open: boolean) => void }

type ExState = { exOpen: boolean; setExOpen: (open: boolean) => void }

export function InstrumentDrill({
  screen,
  width,
  live,
  onScreen,
  onGo,
}: DirectionProps & { onGo: (d: Destination) => void }) {
  const { view, act, refs } = useDrill({ screen, onScreen, live })
  const [note, setNote] = useState(false)
  const [focus, setFocus] = useState(false)
  const feedback = view.phase === 'feedback'
  // The explanation opens by itself after a wrong answer; a right answer
  // keeps it one key (X) away.
  const [exOpen, setExOpen] = useState(view.correct === false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seat on each new verdict only
  useEffect(() => {
    if (feedback) setExOpen(view.correct === false)
  }, [feedback, view.index])

  const rootRef = useRef<HTMLDivElement>(null)
  const wide = useWidth(rootRef) >= WIDE
  const nextInPlan = PLAN.items.find((i) => i.primary) ?? PLAN.items[0]
  const goNextInPlan = () => onGo('ova')

  const paraOn = view.focusPara != null
  const keys: Record<string, () => void> = {
    Enter: () => {
      if (view.phase === 'question') act.lock()
      else if (feedback) act.next()
      else goNextInPlan()
    },
    j: () => act.moveFocusPara(1),
    k: () => act.moveFocusPara(-1),
    f: () => setFocus((f) => !f),
    x: () => {
      if (feedback) setExOpen(!exOpen)
    },
    Escape: () => {
      if (paraOn) act.setFocusPara(null)
      else if (focus) setFocus(false)
    },
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
        exOpen={exOpen}
        setExOpen={setExOpen}
        onHome={() => onScreen(1)}
        onNextInPlan={goNextInPlan}
        nextLabel={`${nextInPlan.title} · ${nextInPlan.minutes} min`}
      />
    )
  }

  const done = view.phase === 'done'
  return (
    <div className="in-drill" data-focus={String(focus && !done)} ref={rootRef}>
      {focus && !done ? null : (
        <nav className="in-rail" aria-label="Huvudmeny">
          <Mark />
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="in-icon-btn in-tip"
              data-tip={`${d.label} – lämnar övningen`}
              data-testid={`rd-nav-${d.id}`}
              aria-label={`${d.label} (lämnar övningen)`}
              onClick={() => onGo(d.id)}
            >
              {DEST_ICONS[d.id](16)}
              {d.id === 'ova' ? <span className="in-dot" aria-hidden /> : null}
            </button>
          ))}
        </nav>
      )}
      <div className="in-work">
        {focus && !done ? (
          <FocusChrome view={view} act={act} onLeave={() => setFocus(false)} />
        ) : (
          <TopBar view={view} act={act} focus={focus} setFocus={setFocus} />
        )}
        {done ? (
          <div className="in-scroll in-done-scroll">
            <Done
              view={view}
              onHome={() => onScreen(1)}
              onNextInPlan={goNextInPlan}
              nextLabel={`${nextInPlan.title} · ${nextInPlan.minutes} min`}
            />
          </div>
        ) : (
          <Split
            {...shared}
            note={note}
            setNote={setNote}
            exOpen={exOpen}
            setExOpen={setExOpen}
            wide={wide}
            focus={focus}
          />
        )}
        {focus && !done ? null : <StatusBar view={view} />}
      </div>
    </div>
  )
}

function Timer({ seconds }: { seconds: number }) {
  return (
    <span className="in-timer" role="timer" aria-label={`Tid ${fmtClock(seconds)}`}>
      <Clock size={14} strokeWidth={1.5} aria-hidden />
      <span aria-hidden>{fmtClock(seconds)}</span>
    </span>
  )
}

function TopBar({
  view,
  act,
  focus,
  setFocus,
}: Pick<Shared, 'view' | 'act'> & { focus: boolean; setFocus: (on: boolean) => void }) {
  const done = view.phase === 'done'
  return (
    <header className="in-bar in-dbar">
      <nav className="in-crumbs" aria-label="Plats">
        <span>Öva</span>
        <i aria-hidden>/</i>
        <span>LÄS</span>
        <i aria-hidden>/</i>
        <span>{TITLE}</span>
        <i aria-hidden>/</i>
        <b aria-current="page">{done ? 'Klar' : `Fråga ${view.index + 1}`}</b>
      </nav>
      <span className="in-spacer" />
      {done ? (
        <button type="button" className="in-btn2" data-testid="rd-exit" onClick={act.exit}>
          Stäng
        </button>
      ) : (
        <>
          <span className="in-sub">
            Fråga {view.index + 1} av {view.total}
          </span>
          <Segs
            total={view.total}
            done={view.index}
            now={view.index}
            label={`Fråga ${view.index + 1} av ${view.total}`}
          />
          <span className="in-sep" aria-hidden />
          <Timer seconds={view.elapsed} />
          <span className="in-sep" aria-hidden />
          <button
            type="button"
            className="in-ghost"
            aria-pressed={focus}
            onClick={() => setFocus(!focus)}
            title="Fokusläge: bara text och fråga (F)"
          >
            <Maximize2 size={15} strokeWidth={1.5} aria-hidden />
            Fokus
            <Kc>F</Kc>
          </button>
          <button
            type="button"
            className="in-btn2"
            data-testid="rd-exit"
            onClick={act.exit}
            title="Dina svar är sparade"
          >
            Avsluta
          </button>
        </>
      )}
    </header>
  )
}

/** Focus mode keeps only a hairline of progress and one corner cluster. */
function FocusChrome({
  view,
  act,
  onLeave,
}: Pick<Shared, 'view' | 'act'> & { onLeave: () => void }) {
  return (
    <>
      <div className="in-focusline">
        <Segs
          total={view.total}
          done={view.index}
          now={view.index}
          label={`Fråga ${view.index + 1} av ${view.total}`}
        />
      </div>
      <div className="in-corner">
        <Timer seconds={view.elapsed} />
        <button
          type="button"
          className="in-btn2"
          data-testid="rd-exit"
          onClick={act.exit}
          title="Dina svar är sparade"
        >
          Avsluta
        </button>
        <button
          type="button"
          className="in-icon-btn in-tip"
          data-tip="Lämna fokus (F)"
          data-tip-side="top"
          aria-label="Lämna fokusläget (F)"
          onClick={onLeave}
        >
          <Minimize2 size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    </>
  )
}

/** The key legend for the phase the reader is in — never keys that do
 *  nothing right now. */
function StatusBar({ view }: { view: DrillView }) {
  const items: [ReactNode, string][] =
    view.phase === 'question'
      ? [
          [
            <>
              <Kc>A</Kc>–<Kc>D</Kc>
            </>,
            'välj',
          ],
          [
            <>
              <Kc>⇧</Kc>
              <Kc>A</Kc>
            </>,
            'stryk',
          ],
          [<Kc key="e">↵</Kc>, 'svara'],
          [
            <>
              <Kc>J</Kc>
              <Kc>K</Kc>
            </>,
            'stycke',
          ],
          [<Kc key="f">F</Kc>, 'fokus'],
        ]
      : view.phase === 'feedback'
        ? [
            [<Kc key="e">↵</Kc>, 'nästa'],
            [<Kc key="x">X</Kc>, 'förklaringen'],
            [
              <>
                <Kc>J</Kc>
                <Kc>K</Kc>
              </>,
              'stycke',
            ],
            [<Kc key="f">F</Kc>, 'fokus'],
          ]
        : [[<Kc key="e">↵</Kc>, 'nästa i planen']]
  return (
    <footer className="in-statusbar">
      {items.map(([keys, label]) => (
        <span key={label} className="in-hint">
          {keys} {label}
        </span>
      ))}
      <span className="in-spacer" />
      <span>{view.phase === 'done' ? 'Sparat' : 'Sparas automatiskt'}</span>
    </footer>
  )
}

// ── Desktop split ────────────────────────────────────────────────────

function evidencePara(view: DrillView): number | undefined {
  for (const s of view.explanation.steps ?? []) {
    const cites = view.stepCites[s.n]
    if (s.tier !== 'detail' && cites?.length) return cites[0]
  }
  return view.cited[0]
}

function Split({
  view,
  act,
  refs,
  note,
  setNote,
  exOpen,
  setExOpen,
  wide,
  focus,
}: Shared &
  NoteState &
  ExState & {
    wide: boolean
    focus: boolean
  }) {
  const feedback = view.phase === 'feedback'
  const inspector = feedback && wide && exOpen
  const [qW, setQW] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const splitRef = useRef<HTMLDivElement>(null)
  const inspRef = useRef<HTMLElement>(null)
  const passageRef = useRef<HTMLDivElement>(null)
  const qRef = useRef<HTMLDivElement>(null)
  const firstJump = useRef(true)
  // The answer pane needs room for the explanation when it holds it.
  const width = qW ?? (feedback && !wide ? 520 : 452)

  // A new question or verdict starts the question pane at the top; a verdict
  // also jumps the passage to the paragraph its steps cite (instantly the
  // first time, so a deep link lands there).
  // biome-ignore lint/correctness/useExhaustiveDependencies: on question/phase change only
  useEffect(() => {
    qRef.current?.scrollTo?.({ top: 0 })
    const scroller = passageRef.current
    const n = feedback ? evidencePara(view) : undefined
    const el = n ? scroller?.querySelector<HTMLElement>(`[data-n="${n}"]`) : null
    if (scroller && el) {
      const smooth = !firstJump.current && !prefersReducedMotion()
      scroller.scrollTo?.({
        top: Math.max(0, el.offsetTop - 96),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
    firstJump.current = false
  }, [view.index, view.phase])

  const clamp = (v: number) => Math.round(Math.min(Q_MAX, Math.max(Q_MIN, v)))
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !splitRef.current) return
    const r = splitRef.current.getBoundingClientRect()
    // The split's 8 px chassis margin on the right, the inspector's track
    // (its panel plus its 8 px gap), half the 8 px gap under the pointer.
    const insp = inspRef.current ? inspRef.current.getBoundingClientRect().width + 8 : 0
    setQW(clamp(r.right - 8 - insp - e.clientX - 4))
  }
  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 60 : 20
    if (e.key === 'ArrowLeft') setQW(clamp(width + step))
    else if (e.key === 'ArrowRight') setQW(clamp(width - step))
    else if (e.key === 'Home') setQW(Q_MAX)
    else if (e.key === 'End') setQW(Q_MIN)
    else return
    e.preventDefault()
  }

  const paraOn = view.focusPara != null
  const last = view.index + 1 >= view.total

  return (
    <div
      className="in-split"
      ref={splitRef}
      data-inspector={String(inspector)}
      style={{ '--in-q-w': `${width}px` } as CSSProperties}
    >
      <section className="in-pane" aria-label="Texten">
        {focus ? null : (
          <div className="in-pane-head">
            <span className="in-pane-label">Text · {view.passage.paragraphs.length} stycken</span>
            <span className="in-badge" data-testid="rd-badge">
              {OVNINGSTEXT_BADGE}
            </span>
            <NoteToggle note={note} setNote={setNote} />
            <span className="in-spacer" />
            <button
              type="button"
              className="in-ghost"
              aria-pressed={paraOn}
              onClick={() => act.setFocusPara(paraOn ? null : 1)}
              title="Styckefokus: J och K byter stycke"
            >
              <Pilcrow size={14} strokeWidth={1.5} aria-hidden />
              Styckefokus
              <span className="in-kc-row">
                <Kc>J</Kc>
                <Kc>K</Kc>
              </span>
            </button>
          </div>
        )}
        <div className="in-scroll" ref={passageRef}>
          <PassageBody
            view={view}
            act={act}
            refs={refs}
            note={note}
            setNote={setNote}
            badge={focus}
          />
        </div>
      </section>

      {/* biome-ignore lint/a11y/useSemanticElements: a focusable, valued separator is the WAI-ARIA splitter pattern; <hr> cannot take focus or a value */}
      <div
        className="in-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Frågans bredd – dra eller använd piltangenterna"
        aria-valuemin={Q_MIN}
        aria-valuemax={Q_MAX}
        aria-valuenow={width}
        aria-valuetext={`${width} pixlar`}
        tabIndex={0}
        data-dragging={String(dragging)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onDoubleClick={() => setQW(null)}
        onKeyDown={onKey}
      />

      <section
        className="in-pane"
        aria-label={feedback ? `Facit, fråga ${view.index + 1}` : `Fråga ${view.index + 1}`}
      >
        <div className="in-pane-head">
          <span className="in-pane-label">
            Fråga {view.index + 1} av {view.total}
            {feedback ? ' · facit' : ''}
          </span>
        </div>
        <div className="in-scroll" ref={qRef}>
          <div className="in-qbody">
            {feedback ? (
              <>
                <AnswerSummary view={view} />
                {exOpen && !wide ? (
                  <Explanation view={view} act={act} refs={refs} />
                ) : exOpen ? null : (
                  <ShowExplanation correct={view.correct === true} onOpen={() => setExOpen(true)} />
                )}
              </>
            ) : (
              <>
                <h2 className="in-prompt">{view.question.prompt}</h2>
                <Options view={view} act={act} />
              </>
            )}
          </div>
        </div>
        <div className="in-qfoot">
          {feedback ? (
            <button type="button" className="in-btn" data-testid="rd-next" onClick={act.next}>
              {last ? 'Avsluta texten' : 'Nästa fråga'}
              <Kc>↵</Kc>
            </button>
          ) : (
            <button
              type="button"
              className="in-btn"
              data-testid="rd-lock"
              disabled={!view.selected}
              onClick={act.lock}
            >
              {view.selected ? `Svara ${view.selected}` : 'Välj ett alternativ'}
              <Kc>↵</Kc>
            </button>
          )}
        </div>
      </section>

      {inspector ? (
        <aside className="in-pane in-insp" aria-label="Förklaring" ref={inspRef}>
          <div className="in-pane-head">
            <span className="in-pane-label">Förklaring</span>
            <span className="in-spacer" />
            <button
              type="button"
              className="in-icon-btn"
              onClick={() => setExOpen(false)}
              aria-label="Stäng förklaringen (X)"
              title="Stäng (X)"
            >
              <X size={15} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <div className="in-scroll">
            <div className="in-insp-body">
              <Explanation view={view} act={act} refs={refs} />
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  )
}

function NoteToggle({ note, setNote }: NoteState) {
  return (
    <button
      type="button"
      className="in-ghost"
      data-testid="rd-note-toggle"
      aria-expanded={note}
      aria-controls="in-note"
      onClick={() => setNote(!note)}
    >
      <Info size={14} strokeWidth={1.5} aria-hidden />
      {note ? 'Dölj noten' : 'Om texten'}
    </button>
  )
}

function ShowExplanation({ correct, onOpen }: { correct: boolean; onOpen: () => void }) {
  return (
    <button type="button" className="in-show-ex" aria-expanded={false} onClick={onOpen}>
      {correct ? 'Rätt · visa förklaringen' : 'Visa förklaringen'}
      <span className="in-key-note in-hint">(X)</span>
    </button>
  )
}

// ── Passage ──────────────────────────────────────────────────────────

/** The quotations to underline: every step's, and — after a wrong answer —
 *  the ones that say why the chosen option is wrong. */
function shownMarks(view: DrillView): QuoteMark[] {
  if (view.phase !== 'feedback') return []
  return view.marks.filter(
    (m) => m.source.startsWith('step-') || (!view.correct && m.source === `why-${view.picked}`),
  )
}

/** A paragraph's text with its marks, overlaps dropped (first wins). */
function marked(text: string, marks: QuoteMark[], view: DrillView): ReactNode[] {
  const sorted = [...marks].sort((a, b) => a.start - b.start || b.end - a.end)
  const out: ReactNode[] = []
  let at = 0
  for (const m of sorted) {
    if (m.start < at) continue
    if (m.start > at) out.push(text.slice(at, m.start))
    out.push(
      <mark
        key={`${m.source}-${m.start}`}
        className="in-ev"
        data-kind={m.source.startsWith('why-') ? 'wrong' : 'evidence'}
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

function PassageBody({
  view,
  act,
  refs,
  note,
  setNote,
  badge,
}: Shared & NoteState & { badge: boolean }) {
  const { paragraphs, byline } = view.passage
  const graded = view.phase === 'feedback'
  const marks = shownMarks(view)
  return (
    <div className="in-passage-wrap">
      <div className="in-passage-head">
        {badge ? (
          <div className="in-badge-row">
            <span className="in-badge" data-testid="rd-badge">
              {OVNINGSTEXT_BADGE}
            </span>
            <NoteToggle note={note} setNote={setNote} />
          </div>
        ) : null}
        <p className="in-note" id="in-note" data-testid="rd-note" hidden={!note}>
          {OVNINGSTEXT_NOTE}
        </p>
        <h1 className="in-ptitle" style={{ marginTop: note ? 16 : 0 }}>
          {TITLE}
        </h1>
        <p className="in-psub">{SUBTITLE}</p>
      </div>
      <div
        className="in-pbody"
        data-testid="rd-passage"
        data-focus={String(view.focusPara != null)}
      >
        {paragraphs.map((p, i) => {
          const n = i + 1
          const own = marks.filter((m) => m.para === n)
          // A ¶ link whose part quotes this paragraph marks the sentence;
          // otherwise the whole paragraph takes the mark.
          const sentence = own.some((m) => m.source === view.flashSource)
          return (
            <div
              key={n}
              ref={refs.para(n)}
              className="in-para"
              data-n={n}
              data-testid={`rd-para-${n}`}
              data-cited={String(graded && view.cited.includes(n))}
              data-flash={String(view.flashPara === n && !sentence)}
              data-focused={String(view.focusPara === n)}
            >
              {/* Out of the tab order: nine of these must not stand between
               *  the reader and the options; F, J and K drive the same aid. */}
              <button
                type="button"
                className="in-pnum"
                tabIndex={-1}
                aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                aria-pressed={view.focusPara === n}
                onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
              >
                {n}
              </button>
              <p>{own.length ? marked(p, own, view) : p}</p>
            </div>
          )
        })}
        {byline ? <p className="in-byline">{byline}</p> : null}
      </div>
    </div>
  )
}

// ── Options (question phase) ─────────────────────────────────────────

function Options({ view, act }: Pick<Shared, 'view' | 'act'>) {
  return (
    <ol className="in-opts" aria-label="Svarsalternativ">
      {view.question.options.map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="in-opt"
            data-state={selected ? 'selected' : out ? 'eliminated' : undefined}
          >
            <button
              type="button"
              className="in-opt-main"
              data-testid={`rd-option-${o.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(o.letter)}
            >
              <span className="in-letter" aria-hidden>
                {o.letter}
              </span>
              <span className="in-opt-text">
                <span className="in-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                {o.text}
              </span>
            </button>
            <button
              type="button"
              className="in-opt-x in-tip"
              data-tip={out ? 'Ångra' : 'Stryk'}
              data-tip-side="top"
              data-testid={`rd-eliminate-${o.letter}`}
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
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

// ── Facit: the answer summary ────────────────────────────────────────

function Verdict({ view }: { view: DrillView }) {
  const correct = view.correct === true
  return (
    <p className="in-verdict" data-testid="rd-verdict" data-correct={String(correct)}>
      <span className="in-verdict-glyph" aria-hidden>
        {correct ? <Check size={15} strokeWidth={2.5} /> : <X size={15} strokeWidth={2.5} />}
      </span>
      <b>{correct ? 'Rätt' : 'Fel'}</b>
      <span>
        {correct ? `Svaret är ${view.question.answer}.` : `Rätt svar är ${view.question.answer}.`}
      </span>
    </p>
  )
}

/** Verdict, the question, your answer and the right one in full; the
 *  options that played no part wait behind a disclosure. */
function AnswerSummary({ view }: { view: DrillView }) {
  const [others, setOthers] = useState(false)
  const q = view.question
  const text = (l: AnswerLetter) => q.options.find((o) => o.letter === l)?.text ?? ''
  const correct = view.correct === true
  const rest = q.options.filter((o) => o.letter !== q.answer && o.letter !== view.picked)
  const letters = rest.map((o) => o.letter)
  // "B och C", "A, B och C".
  const restLabel =
    letters.length > 1
      ? `${letters.slice(0, -1).join(', ')} och ${letters[letters.length - 1]}`
      : (letters[0] ?? '')
  return (
    <>
      <Verdict view={view} />
      <h2 className="in-q-after">{q.prompt}</h2>
      <div className="in-ans">
        {correct ? null : view.picked ? (
          <AnswerRow kind="mine" letter={view.picked} text={text(view.picked)} />
        ) : null}
        <AnswerRow kind="right" letter={q.answer} text={text(q.answer)} mine={correct} />
        {others
          ? rest.map((o) => (
              <AnswerRow key={o.letter} kind="other" letter={o.letter} text={o.text} />
            ))
          : null}
      </div>
      {rest.length ? (
        <button
          type="button"
          className="in-disclose"
          aria-expanded={others}
          onClick={() => setOthers(!others)}
        >
          {others ? `Dölj ${restLabel}` : `Visa ${restLabel}`}
          <ChevronDown size={15} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </>
  )
}

function AnswerRow({
  kind,
  letter,
  text,
  mine = false,
}: {
  kind: 'mine' | 'right' | 'other'
  letter: AnswerLetter
  text: string
  mine?: boolean
}) {
  const tag =
    kind === 'mine' ? (
      <>
        <X size={13} strokeWidth={2.5} aria-hidden /> Ditt svar
      </>
    ) : kind === 'right' ? (
      <>
        <Check size={13} strokeWidth={2.5} aria-hidden /> {mine ? 'Ditt svar · rätt' : 'Rätt svar'}
      </>
    ) : null
  return (
    <div className="in-ans-row" data-kind={kind} data-testid={`rd-option-${letter}`}>
      <span className="in-letter" aria-hidden>
        {letter}
      </span>
      <div>
        {tag ? <p className="in-ans-tag">{tag}</p> : null}
        <p className="in-ans-text">
          <span className="in-sr">Alternativ {letter}: </span>
          {text}
        </p>
      </div>
    </div>
  )
}

// ── Facit: the explanation ───────────────────────────────────────────
// Wrong: Din fälla → Teknik + Fallgrop → Lösningen → Steg → Övriga.
// Right: Teknik + Fallgrop → Lösningen → Steg → Övriga.

function Explanation({ view, act, refs }: Shared) {
  const e = view.explanation
  const q = view.question
  const optionText = (letter: string) => q.options.find((o) => o.letter === letter)?.text ?? ''
  const mine = view.correct ? undefined : e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const framework = e.framework_id ? FRAMEWORK_NAMES[e.framework_id] : undefined
  return (
    <div className="in-ex">
      {mine ? (
        <section
          className="in-trapbox"
          data-testid={`rd-distractor-${mine.letter}`}
          aria-labelledby="in-trap-h"
        >
          <h3 id="in-trap-h">
            <TriangleAlert size={16} strokeWidth={1.75} aria-hidden />
            Din fälla: {mine.letter}
          </h3>
          <h4>Varför det lockar</h4>
          <p>
            <Rich text={mine.why_tempting} act={act} />
          </p>
          <Cites
            list={view.distractorCites[mine.letter]?.tempting ?? []}
            source={`why-${mine.letter}`}
            act={act}
          />
          <h4>Varför det är fel</h4>
          <p>
            <Rich text={mine.why_wrong} act={act} />
          </p>
          <Cites
            list={view.distractorCites[mine.letter]?.wrong ?? []}
            source={`why-${mine.letter}`}
            act={act}
          />
        </section>
      ) : null}

      <section aria-label="Teknik och fallgrop">
        <div className="in-tips">
          <div className="in-tipbox" data-kind="technique" data-testid="rd-technique">
            <Lightbulb size={17} strokeWidth={1.75} aria-hidden />
            <div>
              <h3>Teknik</h3>
              <p>{e.technique}</p>
            </div>
          </div>
          {e.pitfall ? (
            <div className="in-tipbox" data-kind="pitfall" data-testid="rd-pitfall">
              <TriangleAlert size={17} strokeWidth={1.75} aria-hidden />
              <div>
                <h3>Fallgrop</h3>
                <p>{e.pitfall}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="in-sol-h">
        <h3 className="in-ex-h" id="in-sol-h">
          Lösningen
        </h3>
        <p className="in-sol">{e.solution_path}</p>
        {view.cited.length > 0 ? (
          <div className="in-evidence">
            <span>Belägg i texten</span>
            <Cites list={view.cited} act={act} />
          </div>
        ) : null}
      </section>

      <section aria-labelledby="in-steps-h">
        <h3 className="in-ex-h" id="in-steps-h">
          Steg för steg
        </h3>
        <ol>
          {(e.steps ?? []).map((s) => (
            <Step key={s.n} step={s} view={view} act={act} refs={refs} />
          ))}
        </ol>
      </section>

      {others.length ? (
        <section aria-labelledby="in-others-h">
          <h3 className="in-ex-h" id="in-others-h">
            {mine ? 'Övriga alternativ' : 'Alternativen'}
          </h3>
          {others.map((d) => (
            <Distractor
              key={d.letter}
              d={d}
              text={optionText(d.letter)}
              cites={view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }}
              act={act}
            />
          ))}
        </section>
      ) : null}

      {framework ? (
        <p className="in-fw">
          Ramverk: <b>{framework}</b> · finns i Uppslag
        </p>
      ) : null}
    </div>
  )
}

function Step({ step, view, act, refs }: Shared & { step: ExplanationStep }) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  return (
    <li
      className="in-step"
      data-tier={step.tier ?? 'essential'}
      data-testid={`rd-step-${step.n}`}
      ref={refs.step(step.n)}
    >
      <span className="in-step-n" aria-hidden>
        {String(step.n).padStart(2, '0')}
      </span>
      <div>
        <div className="in-step-head">
          <h4 className="in-step-title">
            <span className="in-sr">Steg {step.n}: </span>
            {step.title}
          </h4>
          {detail ? (
            <button
              type="button"
              className="in-more"
              data-testid={`rd-step-toggle-${step.n}`}
              aria-expanded={open}
              onClick={() => act.toggleStep(step.n)}
            >
              {open ? 'Dölj fördjupningen' : 'Fördjupning'}
              <ChevronDown
                size={13}
                strokeWidth={1.75}
                aria-hidden
                style={{ rotate: open ? '180deg' : '0deg' }}
              />
            </button>
          ) : null}
          <Cites list={view.stepCites[step.n] ?? []} source={`step-${step.n}`} act={act} />
        </div>
        {open ? (
          <p className="in-step-text">
            <Rich text={step.text} act={act} />
          </p>
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
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: DrillActions
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `in-dis-${d.letter}`
  return (
    <article className="in-dis" data-testid={`rd-distractor-${d.letter}`}>
      <div className="in-dis-head">
        <span className="in-letter" aria-hidden>
          {d.letter}
        </span>
        <div>
          <p className="in-dis-opt">
            <span className="in-sr">Alternativ {d.letter}: </span>
            {text}
          </p>
          <button
            type="button"
            className="in-disclose"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Dölj' : 'Varför det lockar – och varför det är fel'}
            <ChevronDown size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
      {open ? (
        <div className="in-dis-body" id={bodyId}>
          <div>
            <h4>Varför det lockar</h4>
            <p>
              <Rich text={d.why_tempting} act={act} />
            </p>
            <Cites list={cites.tempting} source={`why-${d.letter}`} act={act} />
          </div>
          <div>
            <h4>Varför det är fel</h4>
            <p>
              <Rich text={d.why_wrong} act={act} />
            </p>
            <Cites list={cites.wrong} source={`why-${d.letter}`} act={act} />
          </div>
        </div>
      ) : null}
    </article>
  )
}

function Cites({ list, source, act }: { list: number[]; source?: string; act: DrillActions }) {
  if (list.length === 0) return null
  return (
    <span className="in-cites">
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="in-cite"
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
            className="in-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}

// ── End of the unit ──────────────────────────────────────────────────

function Done({
  view,
  onHome,
  onNextInPlan,
  nextLabel,
}: {
  view: DrillView
  onHome: () => void
  onNextInPlan: () => void
  nextLabel: string
}) {
  const right = view.results.filter((r) => r.correct).length
  return (
    <div className="in-done" data-testid="rd-done">
      <Landscape />
      <h2>Texten är klar</h2>
      <p className="in-done-facts">
        <span className="in-num">
          {right}/{view.total}
        </span>{' '}
        rätt · <span className="in-num">{Math.max(1, Math.round(view.elapsed / 60))}</span> min
      </p>
      <p>
        {TITLE} är genomläst. Missarna ligger i Repetera, de äldsta först – nästa del av planen
        börjar där.
      </p>
      <div className="in-done-actions">
        <button type="button" className="in-btn" onClick={onNextInPlan}>
          Nästa i planen: {nextLabel}
          <Kc>↵</Kc>
        </button>
        <button type="button" className="in-btn2" onClick={onHome}>
          Till Idag
        </button>
      </div>
    </div>
  )
}

/** One calm line drawing: a valley at dusk, a path reaching the ridge. */
function Landscape() {
  return (
    <svg
      className="in-art"
      viewBox="0 0 640 340"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="En stilla dal i kvällsljus, med en stig upp till en flagga på åsen"
    >
      <circle cx="452" cy="104" r="34" />
      <path d="M452 52 V40 M452 168 V156 M400 104 H388 M516 104 H504 M415 67 L407 59 M497 149 L489 141 M415 141 L407 149 M497 59 L489 67" />
      <path d="M150 92 q8 -8 16 0 q8 -8 16 0" />
      <path d="M196 70 q6 -6 12 0 q6 -6 12 0" />
      <path d="M20 250 C 90 196, 170 184, 250 214 S 410 262, 470 226 S 590 168, 620 186" />
      <path
        d="M20 284 C 110 240, 210 236, 300 262 S 470 300, 540 270 S 600 246, 620 252"
        opacity="0.7"
      />
      <path d="M20 312 H620" />
      <path
        d="M300 312 C 312 292, 300 276, 322 262 S 352 238, 344 224 S 372 204, 380 196"
        strokeDasharray="2 7"
      />
      <path d="M380 196 V160" />
      <path d="M380 160 L404 168 L380 176" fill="currentColor" fillOpacity="0.18" />
      <path d="M60 326 H580" strokeDasharray="1 9" opacity="0.6" />
    </svg>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneDrill({
  view,
  act,
  refs,
  note,
  setNote,
  exOpen,
  setExOpen,
  onHome,
  onNextInPlan,
  nextLabel,
}: Shared &
  NoteState &
  ExState & {
    onHome: () => void
    onNextInPlan: () => void
    nextLabel: string
  }) {
  const { state: sheet, setState: setSheet, toggle, grab } = useSheet(view)
  const { hidden: folded, onScroll } = useHideOnScroll()
  const feedback = view.phase === 'feedback'

  // A ¶ link folds the sheet to its peek so the cited paragraph shows.
  const cite = (n: number, source?: string) => {
    setSheet('peek')
    act.cite(n, source)
  }
  const sheetAct: DrillActions = { ...act, cite }

  if (view.phase === 'done') {
    return (
      <div className="in-pdrill">
        <div className="in-pdscroll in-done-scroll">
          <Done view={view} onHome={onHome} onNextInPlan={onNextInPlan} nextLabel={nextLabel} />
        </div>
      </div>
    )
  }

  const last = view.index + 1 >= view.total
  return (
    <div className="in-pdrill">
      <header className="in-pdhead" data-folded={String(folded)}>
        <button
          type="button"
          className="in-ghost"
          data-testid="rd-exit"
          onClick={act.exit}
          aria-label="Avsluta"
          title="Dina svar är sparade"
        >
          <X size={18} strokeWidth={1.75} aria-hidden />
          <span className="in-exit-word" aria-hidden>
            Avsluta
          </span>
        </button>
        <div className="in-pdhead-mid">
          <Segs
            total={view.total}
            done={view.index}
            now={view.index}
            label={`Fråga ${view.index + 1} av ${view.total}`}
          />
          <span className="in-num in-sub">
            {view.index + 1}/{view.total}
          </span>
        </div>
        <Timer seconds={view.elapsed} />
      </header>
      <div className="in-pdscroll" onScroll={onScroll}>
        <PassageBody view={view} act={act} refs={refs} note={note} setNote={setNote} badge />
        <div className="in-sheet-spacer" aria-hidden />
      </div>
      <section
        className="in-sheet"
        data-testid="rd-sheet"
        data-state={sheet}
        aria-label={`Fråga ${view.index + 1}`}
      >
        <div className="in-sheet-top">
          <button
            type="button"
            className="in-grab"
            aria-label={sheet === 'peek' ? 'Visa frågan' : 'Visa texten'}
            aria-expanded={sheet !== 'peek'}
            {...grab}
          />
          <div className="in-sheet-head">
            <span className="in-pane-label">
              Fråga {view.index + 1} av {view.total}
              {feedback ? ' · facit' : ''}
            </span>
            <span className="in-spacer" />
            {/* At the peek the passage shows its own badge; over the
             *  passage the sheet carries it. */}
            {sheet === 'peek' ? null : <span className="in-badge">{OVNINGSTEXT_BADGE}</span>}
          </div>
        </div>
        <div className="in-sheet-body">
          {feedback ? (
            sheet === 'peek' ? (
              <>
                <Verdict view={view} />
                <button type="button" className="in-peekctl" aria-expanded={false} onClick={toggle}>
                  <span>Tillbaka till facit</span>
                  <ChevronUp size={16} strokeWidth={1.75} aria-hidden />
                </button>
              </>
            ) : (
              <>
                <AnswerSummary view={view} />
                {exOpen ? (
                  <Explanation view={view} act={sheetAct} refs={refs} />
                ) : (
                  <ShowExplanation correct={view.correct === true} onOpen={() => setExOpen(true)} />
                )}
              </>
            )
          ) : (
            <>
              <h2 className="in-prompt">{view.question.prompt}</h2>
              {sheet === 'peek' ? (
                <button type="button" className="in-peekctl" aria-expanded={false} onClick={toggle}>
                  <span>Visa alternativen</span>
                  <span className="in-peekctl-n">
                    <span className="in-sr">(</span>
                    {view.question.options.length}
                    <span className="in-sr">)</span>
                  </span>
                  <ChevronUp size={16} strokeWidth={1.75} aria-hidden />
                </button>
              ) : (
                <Options view={view} act={act} />
              )}
            </>
          )}
        </div>
        {sheet === 'peek' ? null : (
          <div className="in-qfoot">
            {feedback ? (
              <button type="button" className="in-btn" data-testid="rd-next" onClick={act.next}>
                {last ? 'Avsluta texten' : 'Nästa fråga'}
              </button>
            ) : (
              <button
                type="button"
                className="in-btn"
                data-testid="rd-lock"
                disabled={!view.selected}
                onClick={act.lock}
              >
                {view.selected ? `Svara ${view.selected}` : 'Välj ett alternativ'}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
