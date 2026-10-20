// Lager · Läsfråga and Facit — sheets in space.
//
// Desktop: the field has drained to a calm grey. The reading sheet (¶
// pills in its margin) and, a level higher, the question sheet float side
// by side under three glass control pills (Avsluta · place and clock ·
// reading aids). After the answer the explanation stacks on top of the
// question sheet; the sheet behind shows only its top strip, sharp, and the
// strip is the way back to it ("Visa frågan").
// Facit reads, in every direction: verdict and the right answer once
// ("A → D") → why the trap tempted → what to take with you (pitfall,
// technique) → the solution with its evidence → the steps → the other
// options, collapsed. The exact sentences the solution and the trap quote
// are underlined in the passage.
// Phone: a full-width reading sheet; the question is an opaque bottom sheet
// that peeks (the whole question), opens and goes full for the facit; the
// glass head (exit · place and clock · reading aids) never leaves.

import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  Clock,
  Info,
  Layers,
  Lightbulb,
  Pilcrow,
  TriangleAlert,
  Undo2,
  X,
} from 'lucide-react'
import {
  createContext,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillCoreActions as DrillActions,
  type DrillCoreRefs as DrillRefs,
  type DrillCoreView as DrillView,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import {
  type DirectionProps,
  fmtClock,
  prefersReducedMotion,
  type QuoteMark,
  splitStepRefs,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type { DrillQuestion, DrillSessionView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'

type Shared = {
  view: DrillView
  act: DrillActions
  refs: DrillRefs
  blocked?: boolean
  images?: ImageReadiness
}
type NoteState = { note: boolean; setNote: (open: boolean) => void }
type Front = 'explain' | 'question'

export function LagerDrill({ ...props }: DirectionProps & { onDone: (done: boolean) => void }) {
  const { data, actions } = useDirectionData()
  const session = props.screen === 14 ? data.drills.elf : data.drills.reading
  if (!session.questions.length)
    return (
      <div className="la-done-wrap">
        <section className="la-sheet la-done" data-depth="2">
          <h1>Ingen fråga att visa</h1>
          <button
            type="button"
            className="la-btn"
            data-testid="rd-exit"
            onClick={() => actions.go('ova')}
          >
            Till Öva
          </button>
        </section>
      </div>
    )
  // The core requires a stable deck. Remount on a changed sitting or deck
  // topology before it can dereference a removed question.
  return (
    <ReadingSession
      key={JSON.stringify([session.id, session.questions.map((q) => q.qid)])}
      session={session}
      {...props}
    />
  )
}

function ReadingSession({
  screen,
  width,
  live,
  onScreen,
  onDone,
  session,
}: DirectionProps & { onDone: (done: boolean) => void; session: DrillSessionView }) {
  const { actions } = useDirectionData()
  const startIndex = Math.min(Math.max(0, session.start.index ?? 0), session.questions.length - 1)
  const [start] = useState(() => ({
    ...session.start,
    index: startIndex,
    results: session.start.results?.filter((r) => session.questions.some((q) => q.qid === r.qid)),
    graded:
      screen === 3
        ? session.wrongPick?.[session.questions[startIndex].qid]
        : startIndex === (session.start.index ?? 0)
          ? session.start.graded
          : undefined,
  }))
  const {
    view,
    act: core,
    refs,
  } = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const images = useRequiredImages(view.question)
  const blocked =
    images.blocked || !view.passage?.paragraphs.some((p) => p.trim()) || !view.letters.length
  const focus = useRef<HTMLDivElement>(null)
  // Explicit session transitions focus the front sheet, never provider ticks.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a question/phase transition moves focus
  useEffect(() => {
    const target = focus.current?.querySelector<HTMLElement>(
      view.phase === 'done'
        ? '.la-done-line'
        : view.phase === 'feedback'
          ? '.la-verdict'
          : '.la-prompt',
    )
    target?.setAttribute('tabindex', '-1')
    target?.focus({ preventScroll: true })
  }, [view.index, view.phase])
  // Only switcher transitions synchronize the preview phase; controller results remain authoritative.
  // biome-ignore lint/correctness/useExhaustiveDependencies: switcher changes only
  useLayoutEffect(() => {
    if (screen === 3 && view.phase === 'question') core.gradeAs((q) => session.wrongPick?.[q.qid])
    else if (screen === 2 && view.phase === 'feedback') core.reopen()
    else if (screen === 2 && view.phase === 'done') core.reset()
  }, [screen])
  const act: DrillActions = {
    ...core,
    lock: () => {
      if (blocked) return false
      const locked = core.lock()
      if (locked && screen !== 14) onScreen(3)
      return locked
    },
    next: () => {
      const next = core.next()
      if (next === 'next' && screen !== 14) onScreen(2)
      return next
    },
    exit: () => {
      core.exit()
      if (screen !== 14) onScreen(1)
    },
  }
  const [note, setNote] = useState(false)
  const [large, setLarge] = useState(false)
  // Which sheet of the feedback stack is in front; every verdict starts with
  // the explanation there.
  const [front, setFront] = useState<Front>('explain')
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new question or verdict
  useEffect(() => {
    setFront('explain')
  }, [view.index, view.phase])

  const done = view.phase === 'done'
  // The field warms back to LÄS as the done sheet rises.
  useEffect(() => {
    onDone(done)
  }, [done, onDone])
  useEffect(() => () => onDone(false), [onDone])

  const focusOn = view.focusPara != null
  const toggleFocus = () => act.setFocusPara(focusOn ? null : 1)
  const toggleLarge = () => setLarge((l) => !l)

  const keys: Record<string, () => void> = {
    Enter: () => {
      if (view.phase === 'question') act.lock()
      else if (view.phase === 'feedback') act.next()
      else actions.go('idag')
    },
    ' ': () => {
      if (view.phase === 'question') act.lock()
      else if (view.phase === 'feedback') act.next()
    },
    j: () => act.moveFocusPara(1),
    k: () => act.moveFocusPara(-1),
    f: toggleFocus,
    Escape: () => act.setFocusPara(null),
  }
  for (const o of view.question.options ?? []) {
    const l = o.letter.toLowerCase()
    keys[l] = () => act.select(o.letter)
    keys[`Shift+${l}`] = () => act.toggleEliminate(o.letter)
  }
  useKeyMap(keys, live)

  const shared = { view, act, refs, blocked, images }
  if (width === 'phone') {
    return (
      <div className="la-reading-root" ref={focus}>
        <PhoneDrill
          {...shared}
          note={note}
          setNote={setNote}
          large={large}
          toggleLarge={toggleLarge}
          toggleFocus={toggleFocus}
          onHome={() => actions.go('idag')}
          live={live}
          timed={session.elapsedSeconds != null}
        />
      </div>
    )
  }
  const feedback = view.phase === 'feedback'
  return (
    <div className="la-drill" ref={focus}>
      {/* The done moment is quiet: no controls, no clock. */}
      {done ? null : (
        <div className="la-controls">
          <div className="la-pill la-glass">
            <button type="button" className="la-pill-btn" onClick={act.exit} data-testid="rd-exit">
              <X size={20} strokeWidth={2} aria-hidden />
              Avsluta
            </button>
          </div>
          <div className="la-pill la-glass">
            <span className="la-pill-text">
              <Segs view={view} />
              Fråga {view.index + 1} av {view.total}
            </span>
            <span className="la-pill-sep" aria-hidden />
            {session.elapsedSeconds != null ? <ClockText seconds={view.elapsed} /> : null}
          </div>
          <fieldset className="la-pill la-glass">
            <legend className="la-sr">Läshjälp</legend>
            <button
              type="button"
              className="la-pill-btn"
              aria-pressed={focusOn}
              onClick={toggleFocus}
              title="Styckefokus: F slår på, J och K byter stycke"
            >
              <Pilcrow size={16} strokeWidth={1.75} aria-hidden />
              Styckefokus
            </button>
            <button
              type="button"
              className="la-pill-btn"
              aria-pressed={large}
              onClick={toggleLarge}
              title="Större text"
            >
              Aa<span className="la-sr"> – större text</span>
            </button>
            {feedback ? (
              <>
                <span className="la-pill-sep" aria-hidden />
                <button
                  type="button"
                  className="la-pill-btn"
                  aria-pressed={front === 'question'}
                  onClick={() => setFront(front === 'question' ? 'explain' : 'question')}
                  title="Lägg frågan överst i bunten"
                >
                  <Layers size={16} strokeWidth={1.75} aria-hidden />
                  Visa frågan
                </button>
              </>
            ) : null}
          </fieldset>
        </div>
      )}
      {done ? (
        <Done
          view={view}
          onHome={() => actions.go('idag')}
          live={live}
          timed={session.elapsedSeconds != null}
        />
      ) : (
        <Desk
          {...shared}
          note={note}
          setNote={setNote}
          large={large}
          front={front}
          setFront={setFront}
        />
      )}
    </div>
  )
}

function Segs({ view, small = false }: { view: DrillView; small?: boolean }) {
  return (
    <span
      className="la-segs"
      data-size={small ? 's' : undefined}
      role="img"
      aria-label={`${view.index} av ${view.total} klara`}
    >
      {Array.from({ length: view.total }, (_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length progress marks
          key={i}
          data-state={i < view.index ? 'done' : i === view.index ? 'now' : 'todo'}
        />
      ))}
    </span>
  )
}

function ClockText({ seconds }: { seconds: number }) {
  return (
    <span className="la-pill-text" role="timer" aria-label={`Tid ${fmtClock(seconds)}`}>
      <Clock size={15} strokeWidth={1.75} aria-hidden />
      <span aria-hidden>{fmtClock(seconds)}</span>
    </span>
  )
}

// ── Evidence ─────────────────────────────────────────────────────────

function essentialSteps(view: DrillView): ExplanationStep[] {
  return (view.explanation?.steps ?? []).filter((s) => s.tier !== 'detail')
}

/** Paragraphs the essential solution steps stand on. */
function evidenceParas(view: DrillView): Set<number> {
  return new Set(essentialSteps(view).flatMap((s) => view.stepCites[s.n] ?? []))
}

/** The first of them — where the evidence is. */
function evidencePara(view: DrillView): number | undefined {
  for (const s of essentialSteps(view)) {
    const cites = view.stepCites[s.n]
    if (cites?.length) return cites[0]
  }
  return view.cited[0]
}

/** The step whose quotations mark paragraph n (for the evidence flash). */
function evidenceSource(view: DrillView, n: number): string | undefined {
  const step = essentialSteps(view).find((s) => (view.stepCites[s.n] ?? []).includes(n))
  return step ? `step-${step.n}` : undefined
}

/** Paragraphs the chosen trap leans on (a wrong answer only). */
function trapParas(view: DrillView): Set<number> {
  if (view.correct !== false || !view.picked) return new Set()
  const c = view.distractorCites[view.picked]
  return new Set([...(c?.tempting ?? []), ...(c?.wrong ?? [])])
}

/** Quotations marked while the facit is open: the essential steps', and the
 *  chosen trap's. Any other part's show while its ¶ link flashes. */
function shownSources(view: DrillView): Set<string> {
  const out = new Set(essentialSteps(view).map((s) => `step-${s.n}`))
  if (view.correct === false && view.picked) out.add(`why-${view.picked}`)
  return out
}

/** A paragraph's text with its quoted sentences wrapped — verbatim. */
function Marked({
  text,
  marks,
  flash,
}: {
  text: string
  marks: QuoteMark[]
  flash: string | null
}) {
  if (marks.length === 0) return <>{text}</>
  const sorted = [...marks].sort(
    (a, b) => a.start - b.start || Number(b.source === flash) - Number(a.source === flash),
  )
  const parts: ReactNode[] = []
  let at = 0
  for (const m of sorted) {
    if (m.start < at) continue
    if (m.start > at) parts.push(<Fragment key={`t${at}`}>{text.slice(at, m.start)}</Fragment>)
    parts.push(
      <span
        key={`m${m.start}`}
        className="la-q"
        data-kind={m.source.startsWith('step-') ? 'evidence' : 'trap'}
        data-flash={String(flash != null && flash === m.source)}
      >
        {text.slice(m.start, m.end)}
      </span>,
    )
    at = m.end
  }
  if (at < text.length) parts.push(<Fragment key={`t${at}`}>{text.slice(at)}</Fragment>)
  return <>{parts}</>
}

/** Match the printed cloze run, keeping ordinary numbers as source text. */
function ClozeText({
  text,
  paragraphs,
  number,
}: {
  text: string
  paragraphs: string[]
  number: number
}) {
  const pattern = /(?<![\w–-])_{0,14}(\d{2})_{0,14}(?![\w–\-%])/g
  const candidates = [...paragraphs.join('\n').matchAll(pattern)]
    .map((m) => Number(m[1]))
    .filter((n) => Math.abs(n - number) <= 6)
  let chain: number[] = []
  for (let i = 0; i < candidates.length; i++) {
    const run = [candidates[i]]
    for (let j = i + 1; j < candidates.length; j++)
      if (candidates[j] === run[run.length - 1] + 1) run.push(candidates[j])
    if (run.includes(number) && run.length > chain.length) chain = run
  }
  const parts: ReactNode[] = []
  let at = 0
  for (const match of text.matchAll(pattern)) {
    const n = Number(match[1])
    // No evidence for a run: identify the current gap only.
    if (!(chain.length > 1 ? chain.includes(n) : n === number)) continue
    parts.push(text.slice(at, match.index))
    parts.push(
      <span key={match.index} className="la-cloze-gap" data-active={String(n === number)}>
        <span className="la-sr">{`Gap ${n}${n === number ? ', current question' : ''}: `}</span>
        {match[0]}
      </span>,
    )
    at = match.index + match[0].length
  }
  parts.push(text.slice(at))
  return <>{parts}</>
}

// ── Desktop: the reading sheet beside a question sheet / stack ───────

function Desk({
  view,
  act,
  refs,
  note,
  setNote,
  large,
  front,
  setFront,
  blocked,
  images,
}: Shared & NoteState & { large: boolean; front: Front; setFront: (front: Front) => void }) {
  const readRef = useRef<HTMLElement>(null)
  const exRef = useRef<HTMLDivElement>(null)
  const firstTurn = useRef(true)
  const feedback = view.phase === 'feedback'

  // Every verdict starts with the explanation at its top and the reading
  // sheet turned to the evidence (instantly the first time, so a deep link
  // lands there).
  // biome-ignore lint/correctness/useExhaustiveDependencies: on question/phase change only
  useEffect(() => {
    exRef.current?.scrollTo?.({ top: 0 })
    const read = readRef.current
    const n = feedback ? evidencePara(view) : undefined
    const el = n ? read?.querySelector<HTMLElement>(`[data-n="${n}"]`) : null
    if (read && el) {
      const smooth = !firstTurn.current && !prefersReducedMotion()
      read.scrollTo?.({
        top: Math.max(0, el.offsetTop - 120),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
    firstTurn.current = false
  }, [view.index, view.phase])

  const n = view.index + 1
  const qPos = !feedback ? 'solo' : front === 'question' ? 'front' : 'back'
  const ePos = front === 'explain' ? 'front' : 'back'
  return (
    <div className="la-desk">
      <article
        className="la-sheet la-read"
        data-depth="1"
        data-size={large ? 'large' : 'normal'}
        ref={readRef}
        aria-labelledby="la-ptitle"
        data-rd-keyscope
        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll the passage
        tabIndex={0}
      >
        <PassageBody
          view={view}
          act={act}
          refs={refs}
          note={note}
          setNote={setNote}
          images={images}
        />
      </article>
      <div className="la-qcol">
        <section
          className="la-sheet la-question la-stack"
          data-depth="2"
          data-pos={qPos}
          aria-label={`Fråga ${n}`}
        >
          {qPos === 'back' ? (
            <button type="button" className="la-strip" onClick={() => setFront('question')}>
              <span>
                Fråga {n} av {view.total}
              </span>
              <span className="la-strip-go">
                Visa frågan
                <ChevronUp size={16} strokeWidth={2} aria-hidden />
              </span>
            </button>
          ) : null}
          <div className="la-stack-body" inert={qPos === 'back'}>
            <div className="la-q-scroll" data-rd-keyscope>
              <span className="la-eyebrow">
                Fråga {n} av {view.total} · {view.question.options?.length ?? 0} alternativ
              </span>
              <ReadingPrompt question={view.question} />
              <ReadingAvailability view={view} images={images} />
              <Options view={view} act={act} images={images} />
              {view.phase === 'question' ? <KeyHints last={view.letters.at(-1) ?? 'D'} /> : null}
            </div>
            {qPos === 'back' ? null : <Actions view={view} act={act} blocked={blocked} />}
          </div>
        </section>
        {feedback ? (
          <section
            className="la-sheet la-explain la-stack"
            data-depth="3"
            data-pos={ePos}
            aria-label="Förklaring"
          >
            {ePos === 'back' ? (
              <button type="button" className="la-strip" onClick={() => setFront('explain')}>
                <span>
                  Förklaring ·{' '}
                  {view.correct ? 'Rätt' : `Fel, ${view.picked} → ${view.question.answer}`}
                </span>
                <span className="la-strip-go">
                  Visa förklaringen
                  <ChevronUp size={16} strokeWidth={2} aria-hidden />
                </span>
              </button>
            ) : null}
            <div className="la-stack-body" inert={ePos === 'back'}>
              <div className="la-ex-scroll" ref={exRef} data-rd-keyscope>
                <Explanation view={view} act={act} refs={refs} />
              </div>
              <Actions view={view} act={act} />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function ReadingPrompt({ question }: { question: DrillQuestion }) {
  const cloze = question.section === 'ELF' && !question.prompt
  return (
    <h2
      className="la-prompt"
      lang={cloze ? 'sv' : (question.passage?.lang ?? (question.section === 'ELF' ? 'en' : 'sv'))}
    >
      <MathText>{cloze ? `Lucka ${question.number}` : question.prompt}</MathText>
    </h2>
  )
}

function ReadingAvailability({ view, images }: Pick<Shared, 'view' | 'images'>) {
  if (!view.letters.length)
    return (
      <p className="la-note" role="status">
        Svarsalternativen kunde inte hämtas.
      </p>
    )
  if (!images?.blocked || view.phase !== 'question') return null
  const q = view.question
  const failed =
    (q.figure && images.failed(q.figure.src)) ||
    q.options?.some((o) => o.figure && images.failed(o.figure.src, o.letter))
  return (
    <p className="la-note" role="status">
      {failed
        ? 'En bild kunde inte hämtas. Försök igen innan du svarar.'
        : 'Hämtar bilderna innan du kan svara.'}
    </p>
  )
}

function KeyHints({ last }: { last: string }) {
  return (
    <p className="la-keys">
      <span>
        <kbd className="la-kbd">A</kbd>–<kbd className="la-kbd">{last}</kbd> väljer
      </span>
      <span>
        <kbd className="la-kbd">↵</kbd> svarar
      </span>
      <span>
        <kbd className="la-kbd">⇧</kbd> + bokstav stryker
      </span>
    </p>
  )
}

export function Actions({
  view,
  act,
  blocked = false,
  lastLabel = 'Avsluta texten',
  unit = 'texten',
}: Pick<Shared, 'view' | 'act'> & { blocked?: boolean; lastLabel?: string; unit?: string }) {
  const last = view.index + 1 >= view.total
  if (view.phase === 'question') {
    return (
      <div className="la-actions">
        <button
          type="button"
          className="la-btn"
          disabled={!view.selected || blocked || !view.letters.length}
          onClick={act.lock}
          data-testid="rd-lock"
        >
          Svara
          <kbd className="la-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
        <span className="la-echo" aria-live="polite">
          {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
        </span>
      </div>
    )
  }
  return (
    <div className="la-actions">
      <button type="button" className="la-btn" onClick={act.next} data-testid="rd-next">
        {last ? lastLabel : 'Nästa fråga'}
        <kbd className="la-kbd" aria-hidden>
          ↵
        </kbd>
      </button>
      <span className="la-echo">
        {last ? `Sista frågan i ${unit}` : `Fråga ${view.index + 2} av ${view.total} väntar`}
      </span>
    </div>
  )
}

// ── The reading sheet ────────────────────────────────────────────────

function PassageBody({ view, act, refs, note, setNote, images }: Shared & NoteState) {
  const { data } = useDirectionData()
  const { paragraphs, byline } = view.passage ?? { paragraphs: [], byline: null }
  const passage = view.question.passage
  const title = passage?.title
  const graded = view.phase === 'feedback'
  const evidence = graded ? evidenceParas(view) : new Set<number>()
  const traps = graded ? trapParas(view) : new Set<number>()
  const shown = graded ? shownSources(view) : new Set<string>()
  return (
    <div className="la-read-inner">
      {view.question.passage?.synthetic ? (
        <>
          <div className="la-badge-row">
            <span className="la-chip la-badge" data-testid="rd-badge">
              {data.copy.ovningstextBadge}
            </span>
            <button
              type="button"
              className="la-quiet"
              aria-expanded={note}
              aria-controls="la-note"
              onClick={() => setNote(!note)}
              data-testid="rd-note-toggle"
            >
              <Info size={15} strokeWidth={1.75} aria-hidden />
              {note ? 'Dölj noten' : 'Om texten'}
            </button>
          </div>
          <p className="la-note" id="la-note" hidden={!note} data-testid="rd-note">
            {data.copy.ovningstextNote}
          </p>
        </>
      ) : null}
      <h1 className="la-ptitle" id="la-ptitle" lang={title ? passage?.lang : 'sv'}>
        {title ?? view.question.source.label}
      </h1>
      {title && view.question.source.authentic ? (
        <p className="la-note">{view.question.source.label}</p>
      ) : null}
      {!paragraphs.some((p) => p.trim()) ? (
        <p role="status" className="la-note">
          Texten kunde inte hämtas.
        </p>
      ) : null}
      {view.question.figure ? (
        <div className="la-reading-figure">
          <img
            key={images?.key(view.question.figure.src)}
            {...images?.props(view.question.figure.src)}
            src={`/${view.question.figure.src}`}
            alt={view.question.figure.alt}
            width={view.question.figure.width}
            height={view.question.figure.height}
          />
          {images?.failed(view.question.figure.src) ? (
            <button
              type="button"
              className="la-quiet"
              onClick={() => images.retry(view.question.figure!.src)}
            >
              Försök hämta bilden igen
            </button>
          ) : null}
        </div>
      ) : null}
      <div
        className="la-pbody"
        lang={passage?.lang ?? (view.question.section === 'ELF' ? 'en' : 'sv')}
        data-focus={String(view.focusPara != null)}
        data-testid={view.question.section === 'ELF' ? 'rd-elf-passage' : 'rd-passage'}
      >
        {paragraphs.map((p, i) => {
          const n = i + 1
          // Marks only after the answer: before it they would give it away.
          const marks = graded
            ? view.marks.filter(
                (m) => m.para === n && (shown.has(m.source) || m.source === view.flashSource),
              )
            : []
          return (
            <p
              key={n}
              ref={refs.para(n)}
              className="la-para"
              data-n={n}
              data-testid={`rd-para-${n}`}
              data-evidence={String(evidence.has(n))}
              data-trap={String(!evidence.has(n) && traps.has(n))}
              data-flash={String(view.flashPara === n)}
              data-focused={String(view.focusPara === n)}
            >
              {/* Out of the tab order: nine stops before the options would be
               *  a toll on every question. J and K move the focus instead. */}
              <button
                type="button"
                className="la-pn"
                lang="sv"
                tabIndex={-1}
                aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                aria-pressed={view.focusPara === n}
                onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
              >
                {n}
              </button>
              {view.question.section === 'ELF' && !view.question.prompt ? (
                <ClozeText text={p} paragraphs={paragraphs} number={view.question.number} />
              ) : (
                <Marked text={p} marks={marks} flash={view.flashSource} />
              )}
            </p>
          )
        })}
        {byline ? <p className="la-byline">{byline}</p> : null}
      </div>
    </div>
  )
}

// ── Options ──────────────────────────────────────────────────────────

/** A required image is usable only after load (including a cached load).
 * Retry returns to loading; readiness covers every option, not just the selected one. */
export function useRequiredImages(question: Pick<DrillQuestion, 'figure' | 'options'>) {
  const [images, setImages] = useState<
    Record<string, { status: 'loading' | 'ready' | 'error'; attempt: number }>
  >({})
  const callbacks = useRef(new Map<string, (img: HTMLImageElement | null) => void>())
  const report = useCallback((src: string, status: 'loading' | 'ready' | 'error') => {
    setImages((old) =>
      old[src]?.status === status
        ? old
        : { ...old, [src]: { status, attempt: old[src]?.attempt ?? 0 } },
    )
  }, [])
  // Slot as well as source: an option may use the same URL as the main figure.
  const id = (src: string, slot = 'main') => `${slot}:${src}`
  const sources = [
    ...(question.figure ? [id(question.figure.src)] : []),
    ...(question.options ?? []).flatMap((o) => (o.figure ? [id(o.figure.src, o.letter)] : [])),
  ]
  const imageKey = (src: string, slot = 'main') =>
    `${id(src, slot)}:${images[id(src, slot)]?.attempt ?? 0}`
  const imageRef = (src: string, slot = 'main') => {
    const key = imageKey(src, slot)
    let ref = callbacks.current.get(key)
    if (!ref) {
      ref = (img) => {
        if (img)
          report(
            id(src, slot),
            img.complete ? (img.naturalWidth > 0 ? 'ready' : 'error') : 'loading',
          )
      }
      callbacks.current.set(key, ref)
    }
    return ref
  }
  return {
    blocked: sources.some((src) => images[src]?.status !== 'ready'),
    failed: (src: string, slot = 'main') => images[id(src, slot)]?.status === 'error',
    key: imageKey,
    props: (src: string, slot = 'main') => ({
      ref: imageRef(src, slot),
      onLoad: () => report(id(src, slot), 'ready'),
      onError: () => report(id(src, slot), 'error'),
    }),
    retry: (src: string, slot = 'main') =>
      setImages((old) => ({
        ...old,
        [id(src, slot)]: { status: 'loading', attempt: (old[id(src, slot)]?.attempt ?? 0) + 1 },
      })),
  }
}

export type ImageReadiness = ReturnType<typeof useRequiredImages>

export function Options({
  view,
  act,
  quant = false,
  images,
}: Pick<Shared, 'view' | 'act'> & { quant?: boolean; images?: ImageReadiness }) {
  const graded = view.phase !== 'question'
  return (
    <ol className="la-opts" aria-label="Svarsalternativ">
      {(view.question.options ?? []).map((o) => {
        if (graded) {
          const right = o.letter === view.question.answer
          const mine = o.letter === view.picked
          return (
            <li
              key={o.letter}
              className="la-opt"
              data-grade={right ? 'right' : mine ? 'wrong' : 'other'}
            >
              <div className="la-opt-main">
                <span className="la-key" aria-hidden>
                  {o.letter}
                </span>
                <span className="la-opt-text">
                  <span className="la-sr">Alternativ {o.letter}: </span>
                  <span lang={view.question.section === 'ELF' ? 'en' : undefined}>
                    <MathText>{o.text}</MathText>
                  </span>
                  {o.figure ? (
                    <img
                      className="la-option-figure"
                      src={`/${o.figure.src}`}
                      alt={o.figure.alt}
                      width={o.figure.width}
                      height={o.figure.height}
                    />
                  ) : null}
                  {right || mine ? (
                    <span className="la-grade-tag">
                      {right ? (
                        <Check size={14} strokeWidth={2.5} aria-hidden />
                      ) : (
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      )}
                      {right && mine ? 'Ditt svar · rätt' : right ? 'Rätt svar' : 'Ditt svar'}
                    </span>
                  ) : null}
                </span>
              </div>
            </li>
          )
        }
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="la-opt"
            data-state={selected ? 'on' : out ? 'out' : undefined}
          >
            <button
              type="button"
              className="la-opt-main"
              aria-pressed={selected}
              onClick={() => act.select(o.letter)}
              data-testid={`rd-${quant ? 'quant-' : ''}option-${o.letter}`}
            >
              <span className="la-key" aria-hidden>
                {o.letter}
              </span>
              <span className="la-opt-text">
                <span className="la-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                <span lang={view.question.section === 'ELF' ? 'en' : undefined}>
                  <MathText>{o.text}</MathText>
                </span>
                {o.figure ? (
                  <img
                    key={images?.key(o.figure.src, o.letter)}
                    {...images?.props(o.figure.src, o.letter)}
                    className="la-option-figure"
                    src={`/${o.figure.src}`}
                    alt={o.figure.alt}
                    width={o.figure.width}
                    height={o.figure.height}
                  />
                ) : null}
              </span>
            </button>
            {o.figure && images?.failed(o.figure.src, o.letter) ? (
              <button
                type="button"
                className="la-link la-image-retry"
                onClick={() => images.retry(o.figure!.src, o.letter)}
              >
                Försök hämta alternativ {o.letter} igen
              </button>
            ) : null}
            <button
              type="button"
              className="la-opt-x"
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
              title={out ? 'Ångra' : 'Stryk alternativet (⇧ + bokstav)'}
              onClick={() => act.toggleEliminate(o.letter)}
              data-testid={`rd-eliminate-${o.letter}`}
            >
              {out ? (
                <Undo2 size={17} strokeWidth={1.75} aria-hidden />
              ) : (
                <CircleSlash size={17} strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// ── Facit ────────────────────────────────────────────────────────────

/** The verdict, with the pick and the answer once ("A → D"), and then the
 *  two answers themselves as small sheets lifted out of a recessed well —
 *  each with a coloured rim, a ringed glyph and its words, never a tinted
 *  tile. */
function Verdict({ view, answer = true }: { view: DrillView; answer?: boolean }) {
  const q = view.question
  const correct = view.correct === true
  const text = (letter: string) => q.options?.find((o) => o.letter === letter)?.text ?? ''
  return (
    <div className="la-verdict-block">
      <p className="la-verdict" data-correct={String(correct)} data-testid="rd-verdict">
        <span className="la-verdict-glyph" aria-hidden>
          {correct ? <Check size={22} strokeWidth={2.5} /> : <X size={22} strokeWidth={2.5} />}
        </span>
        <span>{correct ? 'Rätt' : 'Fel'}</span>
        <span className="la-pair">
          <span className="la-sr">
            {correct
              ? `, ditt svar ${q.answer} är rätt.`
              : `, du valde ${view.picked} och rätt svar är ${q.answer}.`}
          </span>
          <span className="la-pair-vis" aria-hidden>
            {correct ? null : (
              <>
                <span className="la-key" data-kind="mine">
                  {view.picked}
                </span>
                <span className="la-arrow">→</span>
              </>
            )}
            <span className="la-key" data-kind="right">
              {q.answer}
            </span>
          </span>
        </span>
      </p>
      {answer ? (
        <div className="la-anspair">
          {correct || !view.picked ? null : (
            <AnswerSheet
              kind="mine"
              letter={view.picked}
              text={text(view.picked)}
              lang={q.section === 'ELF' ? 'en' : undefined}
            />
          )}
          <AnswerSheet
            kind="right"
            letter={q.answer}
            text={text(q.answer)}
            mine={correct}
            lang={q.section === 'ELF' ? 'en' : undefined}
          />
        </div>
      ) : null}
    </div>
  )
}

function AnswerSheet({
  kind,
  letter,
  text,
  mine = false,
  lang,
}: {
  kind: 'mine' | 'right'
  letter: string
  text: string
  /** The right answer was the reader's own. */
  mine?: boolean
  lang?: string
}) {
  const right = kind === 'right'
  return (
    <div className="la-ans" data-kind={kind}>
      <span className="la-ans-badge" aria-hidden>
        {right ? <Check size={15} strokeWidth={2.5} /> : <X size={15} strokeWidth={2.5} />}
      </span>
      <span className="la-ans-label">
        {right ? (mine ? 'Ditt svar · rätt' : 'Rätt svar') : 'Ditt svar'} · {letter}
      </span>
      <span className="la-ans-text">
        <span className="la-sr">Alternativ {letter}: </span>
        <span lang={lang}>
          <MathText>{text}</MathText>
        </span>
      </span>
    </div>
  )
}

export function Explanation({
  view,
  act,
  refs,
  badge = true,
  prompt = false,
}: Shared & {
  /** Desktop: the ÖVNINGSTEXT badge leads the sheet (the phone sheet's
   *  head already carries it). */
  badge?: boolean
  /** Phone: the question again under the verdict, for context. */
  prompt?: boolean
}) {
  const { data, actions } = useDirectionData()
  const e = view.explanation
  const q = view.question
  const correct = view.correct === true
  const optionText = (letter: string) => q.options?.find((o) => o.letter === letter)?.text ?? ''
  if (!e)
    return (
      <>
        <Verdict view={view} />
        <p className="la-solution">Förklaringen kunde inte hämtas.</p>
      </>
    )
  const lure = correct ? undefined : e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== lure?.letter)
  const ev = evidencePara(view)
  const frameworkId = e.framework_id
  const framework = frameworkId ? data.frameworks[frameworkId] : undefined
  const none = { tempting: [] as number[], wrong: [] as number[] }
  return (
    <ExplanationLanguage.Provider value={q.passage?.lang === 'en' ? q.passage.paragraphs : []}>
      {badge && q.passage?.synthetic ? (
        <span className="la-chip la-badge">{data.copy.ovningstextBadge}</span>
      ) : null}
      <Verdict view={view} />
      {prompt ? (
        <p className="la-ex-prompt" lang={q.section === 'ELF' ? 'en' : undefined}>
          <MathText>{q.prompt}</MathText>
        </p>
      ) : null}

      {lure ? (
        <section
          className="la-ex-sec"
          data-testid={`rd-distractor-${lure.letter}`}
          aria-labelledby="la-lure-h"
        >
          {/* The option itself stands in the answer pair above. */}
          <h3 className="la-ex-h" id="la-lure-h">
            Därför lockade {lure.letter}
          </h3>
          <Why
            title="Varför det lockar"
            text={lure.why_tempting}
            cites={(view.distractorCites[lure.letter] ?? none).tempting}
            letter={lure.letter}
            act={act}
          />
          <Why
            title="Varför det är fel"
            text={lure.why_wrong}
            cites={(view.distractorCites[lure.letter] ?? none).wrong}
            letter={lure.letter}
            act={act}
          />
        </section>
      ) : null}

      <section className="la-ex-sec" aria-labelledby="la-take-h">
        <h3 className="la-ex-h" id="la-take-h">
          Att ta med dig
        </h3>
        <div className="la-callouts">
          {e.pitfall ? (
            <div className="la-callout" data-kind="pitfall" data-testid="rd-pitfall">
              <h4>
                <TriangleAlert size={16} strokeWidth={1.75} aria-hidden />
                Fallgrop
              </h4>
              <p>
                <ExplanationText text={e.pitfall} />
              </p>
            </div>
          ) : null}
          <div className="la-callout" data-kind="technique" data-testid="rd-technique">
            <h4>
              <Lightbulb size={16} strokeWidth={1.75} aria-hidden />
              Teknik
            </h4>
            <p>
              <ExplanationText text={e.technique} />
            </p>
          </div>
        </div>
      </section>

      <section className="la-ex-sec" aria-labelledby="la-sol-h">
        <div className="la-ex-hrow">
          <h3 className="la-ex-h" id="la-sol-h">
            Lösningen
          </h3>
          {ev ? (
            <button
              type="button"
              className="la-cite"
              data-kind="evidence"
              data-testid={`rd-cite-${ev}`}
              onClick={() => act.cite(ev, evidenceSource(view, ev))}
            >
              Belägg ¶{ev}
              <span className="la-sr"> – visa i texten</span>
            </button>
          ) : null}
        </div>
        <p className="la-solution">
          <ExplanationText text={e.solution_path} />
        </p>
      </section>

      <section className="la-ex-sec" aria-labelledby="la-steps-h">
        <h3 className="la-ex-h" id="la-steps-h">
          Så löser du den
        </h3>
        <ol className="la-steps">
          {(e.steps ?? []).map((s) => (
            <Step key={s.n} step={s} view={view} act={act} refs={refs} />
          ))}
        </ol>
      </section>

      <section className="la-ex-sec" aria-labelledby="la-others-h">
        <h3 className="la-ex-h" id="la-others-h">
          {lure ? 'De andra alternativen' : 'Alternativen'}
        </h3>
        {others.map((d) => (
          <Other
            key={d.letter}
            d={d}
            text={optionText(d.letter)}
            cites={view.distractorCites[d.letter] ?? none}
            act={act}
            lang={q.section === 'ELF' ? 'en' : undefined}
          />
        ))}
      </section>

      {framework ? (
        <p className="la-framework">
          {q.section === 'LÄS' ? (
            <>
              Ramverk: <b>{framework}</b> · finns att slå upp i Uppslag
            </>
          ) : (
            <button
              type="button"
              className="la-link"
              onClick={() => frameworkId && actions.openLesson(frameworkId)}
            >
              Slå upp {framework}
            </button>
          )}
        </p>
      ) : null}
    </ExplanationLanguage.Provider>
  )
}

function Why({
  title,
  text,
  cites,
  letter,
  act,
}: {
  title: string
  text: string
  cites: number[]
  letter: string
  act: DrillActions
}) {
  return (
    <div className="la-why">
      <h4>{title}</h4>
      <p>
        <Rich text={text} act={act} />
      </p>
      {cites.length ? (
        <span className="la-cites">
          {cites.map((n) => (
            <button
              key={n}
              type="button"
              className="la-cite"
              data-kind="trap"
              data-testid={`rd-cite-${n}`}
              onClick={() => act.cite(n, `why-${letter}`)}
            >
              <span className="la-sr">Stycke </span>¶{n} <b>{letter}</b>
              <span className="la-sr"> – fällan, visa i texten</span>
            </button>
          ))}
        </span>
      ) : null}
    </div>
  )
}

function Step({ step, view, act, refs }: Shared & { step: ExplanationStep }) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  const cites = view.stepCites[step.n] ?? []
  return (
    <li
      className="la-step"
      data-tier={step.tier ?? 'essential'}
      ref={refs.step(step.n)}
      data-testid={`rd-step-${step.n}`}
    >
      <span className="la-step-n" aria-hidden>
        {step.n}
      </span>
      <div>
        <div className="la-step-head">
          <h4 className="la-step-title">
            <span className="la-sr">Steg {step.n}: </span>
            <ExplanationText text={step.title} />
          </h4>
          {detail ? (
            <button
              type="button"
              className="la-more"
              aria-expanded={open}
              onClick={() => act.toggleStep(step.n)}
              data-testid={`rd-step-toggle-${step.n}`}
            >
              {open ? 'Dölj fördjupningen' : 'Fördjupning'}
              <ChevronDown
                size={14}
                strokeWidth={2}
                aria-hidden
                style={{ rotate: open ? '180deg' : '0deg' }}
              />
            </button>
          ) : null}
          {cites.length ? (
            <span className="la-cites">
              {cites.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="la-cite"
                  data-kind="evidence"
                  data-testid={`rd-cite-${n}`}
                  onClick={() => act.cite(n, `step-${step.n}`)}
                >
                  <span className="la-sr">Stycke </span>¶{n}
                  <span className="la-sr"> – visa i texten</span>
                </button>
              ))}
            </span>
          ) : null}
        </div>
        {open ? (
          <p className="la-step-text">
            <Rich text={step.text} act={act} />
          </p>
        ) : null}
      </div>
    </li>
  )
}

/** One of the other options: its full text, the why behind a disclosure. */
function Other({
  d,
  text,
  cites,
  act,
  lang,
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: DrillActions
  lang?: string
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `la-dis-${d.letter}`
  return (
    <article className="la-dis" data-testid={`rd-distractor-${d.letter}`}>
      <button
        type="button"
        className="la-dis-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className="la-key" aria-hidden>
          {d.letter}
        </span>
        <span className="la-dis-opt">
          <span className="la-sr">Alternativ {d.letter}: </span>
          <span lang={lang}>
            <MathText>{text}</MathText>
          </span>
        </span>
        <ChevronDown
          className="la-dis-chev"
          size={18}
          strokeWidth={1.75}
          aria-hidden
          style={{ rotate: open ? '180deg' : '0deg' }}
        />
      </button>
      {open ? (
        <div className="la-dis-body" id={bodyId}>
          <Why
            title="Varför det lockar"
            text={d.why_tempting}
            cites={cites.tempting}
            letter={d.letter}
            act={act}
          />
          <Why
            title="Varför det är fel"
            text={d.why_wrong}
            cites={cites.wrong}
            letter={d.letter}
            act={act}
          />
        </div>
      ) : null}
    </article>
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
          <span key={key}>
            <ExplanationText text={seg.text} />
          </span>
        ) : (
          <button
            key={key}
            type="button"
            className="la-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}

// ── Done: a calm sheet as the field warms back ───────────────────────

const ExplanationLanguage = createContext<string[]>([])

/** Only exact source quotations have a known English language. The kit
 * does not declare the surrounding explanation's language. */
function ExplanationText({ text = '' }: { text?: string }) {
  const paragraphs = useContext(ExplanationLanguage)
  if (!paragraphs.length) return <MathText>{text}</MathText>
  const parts: ReactNode[] = []
  let at = 0
  for (const match of text.matchAll(/[“”"«]([^“”"«»]+)[“”"»]/g)) {
    if (!paragraphs.some((p) => p.includes(match[1]))) continue
    parts.push(<MathText key={`before-${match.index}`}>{text.slice(at, match.index)}</MathText>)
    parts.push(
      <span key={match.index} lang="en">
        {match[0]}
      </span>,
    )
    at = match.index + match[0].length
  }
  parts.push(<MathText key="after">{text.slice(at)}</MathText>)
  return <>{parts}</>
}

function Done({
  view,
  onHome,
  live,
  timed,
}: {
  view: DrillView
  onHome: () => void
  live: boolean
  timed: boolean
}) {
  const right = view.results.filter((r) => r.correct).length
  const minutes = Math.max(1, Math.round(view.elapsed / 60))
  return (
    <div className="la-done-wrap">
      <section
        className={`la-sheet la-done${live ? ' la-rise' : ''}`}
        data-depth="3"
        data-testid="rd-done"
        aria-labelledby="la-done-h"
      >
        <p className="la-eyebrow">
          {view.question.section} ·{' '}
          <span lang={view.question.passage?.title ? view.question.passage.lang : 'sv'}>
            {view.question.passage?.title ?? view.question.source.label}
          </span>
        </p>
        <h2 className="la-done-line" id="la-done-h">
          Texten är läst.
        </h2>
        <p className="la-done-stats">
          {view.results.length} frågor · {right} rätt
          {timed ? ` · ${minutes} min` : ''}
        </p>
        <p className="la-done-copy">Resten av dagens plan väntar på Idag.</p>
        <button type="button" className="la-btn" onClick={onHome}>
          Till Idag
        </button>
      </section>
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
  large,
  toggleLarge,
  toggleFocus,
  onHome,
  live,
  timed,
  blocked,
  images,
}: Shared &
  NoteState & {
    large: boolean
    toggleLarge: () => void
    toggleFocus: () => void
    onHome: () => void
    live: boolean
    timed: boolean
  }) {
  const { data } = useDirectionData()
  const { state: sheet, setState: setSheet, toggle, grab } = useSheet(view)
  // The passage scrolls clear of the sheet, whatever its height.
  const sheetRef = useRef<HTMLElement>(null)
  const [sheetH, setSheetH] = useState(180)
  useLayoutEffect(() => {
    const el = sheetRef.current
    if (!el) return
    setSheetH(el.offsetHeight)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setSheetH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // A ¶ link folds the sheet to its peek so the cited paragraph shows.
  const cite = (n: number, source?: string) => {
    setSheet('peek')
    act.cite(n, source)
  }
  const sheetAct: DrillActions = { ...act, cite }

  if (view.phase === 'done') {
    return (
      <div className="la-pdrill">
        <Done view={view} onHome={onHome} live={live} timed={timed} />
      </div>
    )
  }

  const feedback = view.phase === 'feedback'
  const n = view.index + 1
  const focusOn = view.focusPara != null
  return (
    <div className="la-pdrill">
      {/* The head never leaves: exit · place and clock · reading aids. */}
      <div className="la-phead">
        <button
          type="button"
          className="la-round la-glass"
          onClick={act.exit}
          data-testid="rd-exit"
          aria-label="Avsluta"
        >
          <X size={20} strokeWidth={2} aria-hidden />
        </button>
        <div className="la-pill la-glass la-pill-mid">
          <span className="la-pill-text">
            <Segs view={view} small />
            <span>
              <span className="la-sr">Fråga </span>
              {n}/{view.total}
            </span>
            <span className="la-dot" aria-hidden>
              ·
            </span>
            {timed ? (
              <span role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
                <span aria-hidden>{fmtClock(view.elapsed)}</span>
              </span>
            ) : null}
          </span>
        </div>
        <fieldset className="la-pill la-glass">
          <legend className="la-sr">Läshjälp</legend>
          <button
            type="button"
            className="la-pill-btn la-pill-ico"
            aria-pressed={focusOn}
            onClick={toggleFocus}
            title="Styckefokus"
          >
            <Pilcrow size={18} strokeWidth={1.75} aria-hidden />
            <span className="la-sr">Styckefokus</span>
          </button>
          <button
            type="button"
            className="la-pill-btn la-pill-ico"
            aria-pressed={large}
            onClick={toggleLarge}
            title="Större text"
          >
            Aa<span className="la-sr"> – större text</span>
          </button>
        </fieldset>
      </div>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard-accessible scrolling region */}
      <section className="la-pscroll" data-rd-keyscope tabIndex={0} aria-label="Lästext">
        <article
          className="la-sheet la-read la-pread"
          data-depth="1"
          data-size={large ? 'large' : 'normal'}
          aria-labelledby="la-ptitle"
        >
          <PassageBody
            view={view}
            act={act}
            refs={refs}
            note={note}
            setNote={setNote}
            images={images}
          />
        </article>
        {/* Room to scroll the last lines clear of the floating sheet. */}
        <div style={{ height: sheetH + 24 }} aria-hidden />
      </section>
      <section
        ref={sheetRef}
        className="la-psheet"
        data-state={sheet}
        data-testid="rd-sheet"
        aria-label={`Fråga ${n}`}
      >
        {/* Half open, the text still shows above the sheet: a glass button
         *  floats there to fold it away. Full, the sheet's head has it. */}
        {sheet === 'open' ? (
          <button
            type="button"
            className="la-sheet-fab la-glass"
            onClick={() => setSheet('peek')}
            aria-label="Visa texten"
            title="Visa texten"
          >
            <ChevronDown size={20} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
        {/* The grab is for thumbs and pointers; the keyboard has the same
         *  moves as labelled buttons in every state (the peek's line, the
         *  fab, the head's button), so it stays out of the tab order. */}
        <button
          type="button"
          className="la-grab"
          tabIndex={-1}
          aria-label={sheet === 'peek' ? 'Visa frågan' : 'Visa texten'}
          aria-expanded={sheet !== 'peek'}
          {...grab}
        />
        <div className="la-psheet-head">
          <span className="la-eyebrow-row">
            <span className="la-eyebrow">
              Fråga {n} av {view.total}
            </span>
            {view.question.passage?.synthetic ? (
              <span className="la-chip la-badge la-badge-sm">{data.copy.ovningstextBadge}</span>
            ) : null}
          </span>
          {sheet === 'full' ? (
            <button
              type="button"
              className="la-quiet la-quiet-ico"
              onClick={() => setSheet('peek')}
              aria-label="Visa texten"
              title="Visa texten"
            >
              <ChevronDown size={18} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
        <div className="la-psheet-body" data-rd-keyscope>
          {feedback ? (
            sheet === 'peek' ? (
              <>
                <Verdict view={view} answer={false} />
                <button type="button" className="la-link la-peekline" onClick={toggle}>
                  Tillbaka till facit
                  <ChevronUp size={16} strokeWidth={2} aria-hidden />
                </button>
              </>
            ) : (
              <Explanation view={view} act={sheetAct} refs={refs} badge={false} prompt />
            )
          ) : (
            <>
              <ReadingPrompt question={view.question} />
              {sheet === 'peek' ? (
                <button type="button" className="la-link la-peekline" onClick={toggle}>
                  Visa alternativen
                  <ChevronUp size={16} strokeWidth={2} aria-hidden />
                </button>
              ) : (
                <>
                  <ReadingAvailability view={view} images={images} />
                  <Options view={view} act={act} images={images} />
                </>
              )}
            </>
          )}
        </div>
        {sheet === 'peek' ? null : <Actions view={view} act={act} blocked={blocked} />}
      </section>
    </div>
  )
}
