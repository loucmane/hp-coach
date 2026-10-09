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
import { Fragment, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'

import {
  FRAMEWORK_NAMES,
  OVNINGSTEXT_BADGE,
  OVNINGSTEXT_NOTE,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type DirectionProps,
  type DrillActions,
  type DrillRefs,
  type DrillView,
  fmtClock,
  prefersReducedMotion,
  type QuoteMark,
  splitStepRefs,
  useDrill,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'

const [TITLE, SUBTITLE] = UNIT.title.split(': ')

type Shared = { view: DrillView; act: DrillActions; refs: DrillRefs }
type NoteState = { note: boolean; setNote: (open: boolean) => void }
type Front = 'explain' | 'question'

export function LagerDrill({
  screen,
  width,
  live,
  onScreen,
  onDone,
}: DirectionProps & { onDone: (done: boolean) => void }) {
  const { view, act, refs } = useDrill({ screen, onScreen, live })
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
      else onScreen(1)
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
        large={large}
        toggleLarge={toggleLarge}
        toggleFocus={toggleFocus}
        onHome={() => onScreen(1)}
        live={live}
      />
    )
  }
  const feedback = view.phase === 'feedback'
  return (
    <div className="la-drill">
      {/* The done moment is quiet: no controls, no clock. */}
      {done ? null : (
        <div className="la-controls">
          <div className="la-pill la-glass">
            <button
              type="button"
              className="la-pill-btn"
              onClick={act.exit}
              data-testid="rd-exit"
              title="Dina svar är sparade"
            >
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
            <ClockText seconds={view.elapsed} />
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
        <Done view={view} onHome={() => onScreen(1)} live={live} />
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
  return (view.explanation.steps ?? []).filter((s) => s.tier !== 'detail')
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
      >
        <PassageBody view={view} act={act} refs={refs} note={note} setNote={setNote} />
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
            <div className="la-q-scroll">
              <span className="la-eyebrow">
                Fråga {n} av {view.total} · {view.question.options.length} alternativ
              </span>
              <h2 className="la-prompt">{view.question.prompt}</h2>
              <Options view={view} act={act} />
              {view.phase === 'question' ? <KeyHints /> : null}
            </div>
            {qPos === 'back' ? null : <Actions view={view} act={act} />}
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
              <div className="la-ex-scroll" ref={exRef}>
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

function KeyHints() {
  return (
    <p className="la-keys">
      <span>
        <kbd className="la-kbd">A</kbd>–<kbd className="la-kbd">D</kbd> väljer
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

function Actions({ view, act }: Pick<Shared, 'view' | 'act'>) {
  const last = view.index + 1 >= view.total
  if (view.phase === 'question') {
    return (
      <div className="la-actions">
        <button
          type="button"
          className="la-btn"
          disabled={!view.selected}
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
        {last ? 'Avsluta texten' : 'Nästa fråga'}
        <kbd className="la-kbd" aria-hidden>
          ↵
        </kbd>
      </button>
      <span className="la-echo">
        {last ? 'Sista frågan i texten' : `Fråga ${view.index + 2} av ${view.total} väntar`}
      </span>
    </div>
  )
}

// ── The reading sheet ────────────────────────────────────────────────

function PassageBody({ view, act, refs, note, setNote }: Shared & NoteState) {
  const { paragraphs, byline } = view.passage
  const graded = view.phase === 'feedback'
  const evidence = graded ? evidenceParas(view) : new Set<number>()
  const traps = graded ? trapParas(view) : new Set<number>()
  const shown = graded ? shownSources(view) : new Set<string>()
  return (
    <div className="la-read-inner">
      <div className="la-badge-row">
        <span className="la-chip la-badge" data-testid="rd-badge">
          {OVNINGSTEXT_BADGE}
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
        {OVNINGSTEXT_NOTE}
      </p>
      <h1 className="la-ptitle" id="la-ptitle">
        {TITLE}
        <span>{SUBTITLE}</span>
      </h1>
      <div
        className="la-pbody"
        data-focus={String(view.focusPara != null)}
        data-testid="rd-passage"
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
                tabIndex={-1}
                aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                aria-pressed={view.focusPara === n}
                onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
              >
                {n}
              </button>
              <Marked text={p} marks={marks} flash={view.flashSource} />
            </p>
          )
        })}
        {byline ? <p className="la-byline">{byline}</p> : null}
      </div>
    </div>
  )
}

// ── Options ──────────────────────────────────────────────────────────

function Options({ view, act }: Pick<Shared, 'view' | 'act'>) {
  const graded = view.phase !== 'question'
  return (
    <ol className="la-opts" aria-label="Svarsalternativ">
      {view.question.options.map((o) => {
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
                  {o.text}
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
              data-testid={`rd-option-${o.letter}`}
            >
              <span className="la-key" aria-hidden>
                {o.letter}
              </span>
              <span className="la-opt-text">
                <span className="la-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                {o.text}
              </span>
            </button>
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
  const text = (letter: string) => q.options.find((o) => o.letter === letter)?.text ?? ''
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
            <AnswerSheet kind="mine" letter={view.picked} text={text(view.picked)} />
          )}
          <AnswerSheet kind="right" letter={q.answer} text={text(q.answer)} mine={correct} />
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
}: {
  kind: 'mine' | 'right'
  letter: string
  text: string
  /** The right answer was the reader's own. */
  mine?: boolean
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
        {text}
      </span>
    </div>
  )
}

function Explanation({
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
  const e = view.explanation
  const q = view.question
  const correct = view.correct === true
  const optionText = (letter: string) => q.options.find((o) => o.letter === letter)?.text ?? ''
  const lure = correct ? undefined : e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== lure?.letter)
  const ev = evidencePara(view)
  const framework = e.framework_id ? FRAMEWORK_NAMES[e.framework_id] : undefined
  const none = { tempting: [] as number[], wrong: [] as number[] }
  return (
    <>
      {badge ? <span className="la-chip la-badge">{OVNINGSTEXT_BADGE}</span> : null}
      <Verdict view={view} />
      {prompt ? <p className="la-ex-prompt">{q.prompt}</p> : null}

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
              <p>{e.pitfall}</p>
            </div>
          ) : null}
          <div className="la-callout" data-kind="technique" data-testid="rd-technique">
            <h4>
              <Lightbulb size={16} strokeWidth={1.75} aria-hidden />
              Teknik
            </h4>
            <p>{e.technique}</p>
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
        <p className="la-solution">{e.solution_path}</p>
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
          />
        ))}
      </section>

      {framework ? (
        <p className="la-framework">
          Ramverk: <b>{framework}</b> · finns att slå upp i Uppslag
        </p>
      ) : null}
    </>
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
            {step.title}
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
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: DrillActions
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
          {text}
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
          <span key={key}>{seg.text}</span>
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

function Done({ view, onHome, live }: { view: DrillView; onHome: () => void; live: boolean }) {
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
        <p className="la-eyebrow">LÄS · {TITLE}</p>
        <h2 className="la-done-line" id="la-done-h">
          Texten är läst.
        </h2>
        <p className="la-done-stats">
          {view.total} frågor · {right} rätt · {minutes} min
        </p>
        <p className="la-done-copy">
          Missarna ligger nu i Repetera, de äldsta först. Resten av dagens plan väntar på Idag.
        </p>
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
}: Shared &
  NoteState & {
    large: boolean
    toggleLarge: () => void
    toggleFocus: () => void
    onHome: () => void
    live: boolean
  }) {
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
        <Done view={view} onHome={onHome} live={live} />
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
          title="Avsluta – dina svar är sparade"
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
            <span role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
              <span aria-hidden>{fmtClock(view.elapsed)}</span>
            </span>
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
      <div className="la-pscroll">
        <article
          className="la-sheet la-read la-pread"
          data-depth="1"
          data-size={large ? 'large' : 'normal'}
          aria-labelledby="la-ptitle"
        >
          <PassageBody view={view} act={act} refs={refs} note={note} setNote={setNote} />
        </article>
        {/* Room to scroll the last lines clear of the floating sheet. */}
        <div style={{ height: sheetH + 24 }} aria-hidden />
      </div>
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
            <span className="la-chip la-badge la-badge-sm">{OVNINGSTEXT_BADGE}</span>
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
        <div className="la-psheet-body">
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
              <h2 className="la-prompt">{view.question.prompt}</h2>
              {sheet === 'peek' ? (
                <button type="button" className="la-link la-peekline" onClick={toggle}>
                  Visa alternativen
                  <ChevronUp size={16} strokeWidth={2} aria-hidden />
                </button>
              ) : (
                <Options view={view} act={act} />
              )}
            </>
          )}
        </div>
        {sheet === 'peek' ? null : <Actions view={view} act={act} />}
      </section>
    </div>
  )
}
