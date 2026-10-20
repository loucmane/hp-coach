// Svep · Läsfråga and Facit — the drill as two cards on a LÄS-tinted
// table, the navigation hidden behind one always-visible "Avsluta". The
// pieces every Svep drill shares live here too: Kvantfråga and DTK
// (SvepQuant.tsx) are the same question card, turn and facit run.
//
// The text is a tall card that scrolls; the question is the next card.
// Desktop lays them side by side as a pair, with the unit's remaining
// questions as card edges behind the question. Phone keeps the text in
// front and the question card peeking from below with its prompt and "Till
// frågan" (or a swipe up); raising it never moves the text, so the reading
// position is kept.
//
// Answering turns the question card over: its back is the verdict, set like
// a card's face (the right answer's letter as its rank), and the
// explanation continues as a short run of five cards in the shared order,
// one idea each — the verdict and the right answer → why your pick tempted
// and why it is wrong → what to take away (pitfall, technique) → the
// solution and its steps → the other options. ←/→, the arrows, a swipe or
// the run's index move through it; while a card is in front, the text
// highlights the sentences that card leans on. After a miss the verdict
// card's one filled action is the lesson; "Nästa fråga" deals the next
// question; the last answer ends in the unit's hand, turned face up.
//
// Kit v2: the sitting is the view model's (useDirectionData().data.drills
// .reading) and runs on useDrillCore with the context's controller. The
// switcher's round-1 moves stay on onScreen, as r1Kit's useDrill kept them:
// a lock opens Facit, Nästa Läsfråga, Avsluta Idag.

import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  CircleSlash,
  Clock,
  Info,
  Pilcrow,
  Undo2,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillController,
  type DrillCoreActions,
  type DrillCoreRefs,
  type DrillCoreView,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import {
  type DirectionProps,
  fmtClock,
  isForeignKey,
  prefersReducedMotion,
  type QuoteMark,
  type ScreenKey,
  type SheetState,
  splitStepRefs,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillOption,
  DrillOptionFigure,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import { type Deck, useDeck } from './deck'
import {
  type DeckCard,
  DeckCounter,
  DeckStage,
  DeckTicks,
  frameworkKind,
  Kbd,
  QuestionCards,
  SecChip,
} from './parts'

/** The card turn and the deal (svep.css --sv-d-turn), plus a frame. */
const TURN_MS = 260 + 60

export type Sheet = ReturnType<typeof useSheet>

export type RunId = 'svar' | 'lockade' | 'tamed' | 'losning' | 'andra'

export type Run = { cards: (DeckCard & { id: RunId })[]; deck: Deck }

export type Motion = { turning: boolean; dealt: boolean }

/** How far a picture a question needs has come. */
export type PictureState = 'loading' | 'ready' | 'error'

/**
 * The pictures a question needs before it can be answered (its DTK page,
 * its picture options), as the drill tracks them: by src, so a page shared
 * by consecutive questions stays loaded. A src not in `state` is loading;
 * `attempt` counts its retries (each mounts a fresh image).
 */
export type Pictures = {
  state: Readonly<Record<string, PictureState>>
  attempt: Readonly<Record<string, number>>
  report: (src: string, state: 'ready' | 'error') => void
}

/** Why Svara waits, and another try when one may help. */
export type Wait = { text: string; retry?: () => void }

export function SvepDrill({ screen, width, live, onScreen }: DirectionProps) {
  const { data, actions } = useDirectionData()
  const session = data.drills.reading
  const { view, act, refs } = useReadingDrill(session, {
    screen,
    onScreen,
    live,
    controller: actions.drill,
  })
  const phone = width === 'phone'
  const [note, setNote] = useState(false)
  const focusOn = view.focusPara != null
  const toggleFocus = () => act.setFocusPara(focusOn ? null : 1)
  // The end of the unit deals the plan's next part.
  const next = data.home.plan.items.find((i) => !i.completed) ?? null
  const onNextPart = () => {
    if (next) actions.openPlanItem(next.id)
  }
  const sheet = useSheet(view)

  // The run's cards and its deck. A ¶ link on phone folds the sheet so the
  // text shows; a "(steg 2)" link turns the run to the steps card.
  const run = useFacitRun(view, act, refs, {
    frameworks: data.frameworks,
    onCite: phone ? () => sheet.setState('peek') : undefined,
  })
  const motion = useCardMotion(view, live)

  useDrillKeys({
    view,
    act,
    run,
    live,
    extra: {
      j: () => act.moveFocusPara(1),
      k: () => act.moveFocusPara(-1),
      f: toggleFocus,
      // Esc never leaves the drill: it only lets go of the paragraph focus.
      Escape: () => act.setFocusPara(null),
    },
    onPick: phone ? () => sheet.setState((s) => (s === 'peek' ? 'open' : s)) : undefined,
    onDone: onNextPart,
  })

  const chrome: Chrome = {
    view,
    act,
    refs,
    run,
    motion,
    live,
    note,
    setNote,
    focusOn,
    toggleFocus,
    copy: data.copy,
    done: (
      <DoneCard
        view={view}
        live={live}
        eyebrow={`${view.question.section} · klart`}
        about={unitTitle(view)[0]}
        primary={
          next
            ? {
                label: `Nästa kort: ${next.title} · ${next.minutes} min`,
                onClick: onNextPart,
                testId: 'rd-done-next',
              }
            : null
        }
        secondary={{ label: 'Till Idag', onClick: () => onScreen(1) }}
      />
    ),
  }
  return phone ? <PhoneDrill {...chrome} sheet={sheet} /> : <DeskDrill {...chrome} />
}

/**
 * The reading sitting on the drill core, kept in step with the switcher as
 * r1Kit's useDrill keeps round 1's: screen 2 opens the question unanswered,
 * screen 3 opens it graded with the sitting's wrong pick. Answering moves
 * the switcher to 3 (and Nästa back to 2) without a remount, so the
 * reader's own answer stays; "Facit" clicked while the question is open
 * grades it with the wrong pick, "Läsfråga" while graded reopens it.
 */
function useReadingDrill(
  session: DrillSessionView,
  {
    screen,
    onScreen,
    live,
    controller,
  }: {
    screen: DirectionProps['screen']
    onScreen: (s: ScreenKey) => void
    live: boolean
    controller: DrillController
  },
) {
  const [start] = useState(() => {
    const at = session.start.index ?? 0
    const qid = session.questions[at]?.qid ?? ''
    return { ...session.start, graded: screen === 3 ? session.wrongPick?.[qid] : undefined }
  })
  const core = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start,
    elapsed: session.elapsedSeconds,
    controller,
    live,
  })
  const { gradeAs, reopen, reset, lock: coreLock, next: coreNext } = core.act
  const phase = core.view.phase
  const wrongPick = session.wrongPick

  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the switcher's screen only
  useLayoutEffect(() => {
    if (screen === 3 && phase === 'question') gradeAs((q) => wrongPick?.[q.qid])
    else if (screen === 2 && phase === 'feedback') reopen()
    else if (screen === 2 && phase === 'done') reset()
  }, [screen])

  const lock = useCallback(() => {
    const locked = coreLock()
    if (locked) onScreen(3)
    return locked
  }, [coreLock, onScreen])
  const next = useCallback(() => {
    const moved = coreNext()
    if (moved === 'next') onScreen(2)
    return moved
  }, [coreNext, onScreen])
  const exit = useCallback(() => onScreen(1), [onScreen])

  const act: DrillCoreActions = { ...core.act, lock, next, exit }
  return { view: core.view, act, refs: core.refs }
}

/** The unit's title and subtitle ("Magasinet i Hökaryd" · "en handbok om
 *  socknens spannmål"); an authentic passage has no title: its source. */
function unitTitle(view: DrillCoreView): [string, string | null] {
  const title = view.question.passage?.title
  if (!title) return [view.question.source.label, null]
  const cut = title.indexOf(': ')
  return cut === -1 ? [title, null] : [title.slice(0, cut), title.slice(cut + 2)]
}

type Chrome = {
  view: DrillCoreView
  act: DrillCoreActions
  refs: DrillCoreRefs
  run: Run
  motion: Motion
  live: boolean
  note: boolean
  setNote: (open: boolean) => void
  focusOn: boolean
  toggleFocus: () => void
  copy: { ovningstextBadge: string; ovningstextNote: string }
  /** The end of the unit: the hand turned face up. */
  done: ReactNode
}

// ── Keys ─────────────────────────────────────────────────────────────

/**
 * Space advances like Enter (answers once a choice is made, then deals the
 * next question) — except inside the text, a figure or a facit card, where
 * it keeps its meaning and scrolls, and on a focused control, which it
 * presses.
 */
export function useSpaceAdvance(live: boolean, advance: () => boolean) {
  const ref = useRef(advance)
  ref.current = advance
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.defaultPrevented || isForeignKey(e) || e.shiftKey) return
      const t = e.target
      if (t instanceof Element) {
        if (
          t.closest(
            'button, a[href], summary, [role="button"], .sv-pcard, .sv-dcard, .sv-fcard, .sv-viewer',
          )
        ) {
          return
        }
      }
      if (ref.current()) e.preventDefault()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live])
}

/**
 * A drill's keys: the question's own letters choose and Shift+letter
 * strikes, Enter and Space answer once a choice is made and then deal the
 * next question; in Facit ←/→ move through the run (and fall through to the
 * bake-off's screen keys at its ends). Digits are left to the switcher.
 */
export function useDrillKeys({
  view,
  act,
  run,
  live,
  extra,
  arrows = true,
  onPick,
  onDone,
}: {
  view: DrillCoreView
  act: Pick<DrillCoreActions, 'select' | 'toggleEliminate' | 'lock' | 'next'>
  run: Run
  live: boolean
  /** The drill's own keys besides (the paragraph focus aid). */
  extra?: Record<string, () => void>
  /** False while a scrollable figure has the focus: its arrows pan it. */
  arrows?: boolean
  /** After a letter chose an option (phone raises its question card). */
  onPick?: () => void
  /** Enter on the end card. */
  onDone: () => void
}) {
  const keys: Record<string, () => void> = { ...extra }
  if (view.phase === 'question') {
    for (const letter of view.letters) {
      const l = letter.toLowerCase()
      keys[l] = () => {
        act.select(letter)
        onPick?.()
      }
      keys[`Shift+${l}`] = () => act.toggleEliminate(letter)
    }
    if (view.selected) keys.Enter = act.lock
  } else if (view.phase === 'feedback') {
    keys.Enter = act.next
    if (arrows && run.deck.index > 0) keys.ArrowLeft = run.deck.prev
    if (arrows && run.deck.index < run.deck.count - 1) keys.ArrowRight = run.deck.next
  } else {
    keys.Enter = onDone
  }
  useKeyMap(keys, live)
  useSpaceAdvance(live, () => {
    // An answer refused (a picture still missing) leaves Space alone.
    if (view.phase === 'question') return view.selected ? act.lock() : false
    if (view.phase === 'feedback') act.next()
    else onDone()
    return true
  })
}

/**
 * The two card moves: the question card turning over to its verdict (on
 * the answer) and the next question being dealt (on Nästa). Neither runs
 * on a first mount, in a still thumbnail or when the switcher jumps.
 */
export function useCardMotion(view: Pick<DrillCoreView, 'phase' | 'index'>, live: boolean): Motion {
  const [turning, setTurning] = useState(false)
  const [dealt, setDealt] = useState(false)
  const last = useRef({ phase: view.phase, index: view.index })
  useLayoutEffect(() => {
    const was = last.current
    last.current = { phase: view.phase, index: view.index }
    const turn =
      live && was.index === view.index && was.phase === 'question' && view.phase === 'feedback'
    const deal = live && was.index !== view.index && view.phase === 'question'
    setTurning(turn)
    setDealt(deal)
    if (!turn && !deal) return
    const t = window.setTimeout(() => {
      setTurning(false)
      setDealt(false)
    }, TURN_MS)
    return () => window.clearTimeout(t)
  }, [view.phase, view.index, live])
  return { turning, dealt }
}

// ── The run of facit cards ───────────────────────────────────────────

/** After a miss, while the verdict card is in front, the lesson ("Varför
 *  lockade A?") is the filled action and Nästa steps back to quiet. */
export function lessonFirst(view: DrillCoreView, run: Run): boolean {
  return !view.correct && run.deck.index === 0 && run.cards[1]?.id === 'lockade'
}

/** The chosen distractor after a wrong answer. */
function minePick(view: DrillCoreView): DistractorExplanation | null {
  if (view.correct || !view.explanation) return null
  return view.explanation.distractors.find((d) => d.letter === view.picked) ?? null
}

function optionOf(view: DrillCoreView, letter: string | null): DrillOption | undefined {
  return view.question.options?.find((o) => o.letter === letter)
}

/** A short run, in the shared order: the verdict and the right answer →
 *  why your pick tempted and why it is wrong → what to take away (pitfall,
 *  technique) → the solution and its steps → the other options. Without an
 *  explanation yet, the verdict alone. */
function runPlan(view: DrillCoreView): { id: RunId; label: string }[] {
  if (view.phase !== 'feedback') return []
  const plan: { id: RunId; label: string }[] = [{ id: 'svar', label: 'Utfallet' }]
  const e = view.explanation
  if (!e) return plan
  const mine = minePick(view)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  if (mine) plan.push({ id: 'lockade', label: `Därför lockade ${mine.letter}` })
  plan.push({ id: 'tamed', label: 'Att ta med dig' })
  plan.push({ id: 'losning', label: 'Lösningen' })
  if (others.length)
    plan.push({ id: 'andra', label: mine ? 'De andra alternativen' : 'Alternativen' })
  return plan
}

type RunOptions = {
  /** Framework id → headword, for the "look it up" line. */
  frameworks: Record<string, string>
  /** Before a ¶ link scrolls the text (phone folds its sheet). */
  onCite?: () => void
  /** The problem itself, set again above the solution (quant and DTK:
   *  there is no passage beside the run to look back at). */
  problem?: ReactNode
}

/** The run's cards and its deck for the open question. A "(steg 2)" link
 *  turns the run to the steps card. */
export function useFacitRun(
  view: DrillCoreView,
  act: DrillCoreActions,
  refs: DrillCoreRefs,
  options: RunOptions,
): Run {
  const plan = runPlan(view)
  const deck = useDeck(plan, `${view.index}-${view.phase}`)
  const runAct: DrillCoreActions = {
    ...act,
    cite: (n, source) => {
      options.onCite?.()
      act.cite(n, source)
    },
    goToStep: (n) => {
      const at = plan.findIndex((p) => p.id === 'losning')
      if (at !== -1) deck.go(at)
      act.goToStep(n)
    },
  }
  return {
    deck,
    cards: plan.map((p) => ({
      ...p,
      body: runBody(p.id, view, runAct, refs, deck, options, plan),
    })),
  }
}

function runBody(
  id: RunId,
  view: DrillCoreView,
  act: DrillCoreActions,
  refs: DrillCoreRefs,
  deck: Deck,
  options: RunOptions,
  plan: { id: RunId }[],
): ReactNode {
  const e = view.explanation
  const mine = minePick(view)
  switch (id) {
    case 'svar':
      return <VerdictCard view={view} deck={deck} lure={plan[1]?.id === 'lockade'} />
    case 'lockade':
      return mine ? <LureCard view={view} d={mine} act={act} /> : null
    case 'tamed': {
      if (!e) return null
      // The lesson: the pitfall first, then the technique — two short
      // halves of one idea, what to carry into the next question.
      const framework = e.framework_id ? options.frameworks[e.framework_id] : undefined
      return (
        <div className="sv-rc sv-rc--center">
          <p className="sv-rc-eyebrow">Att ta med dig</p>
          {e.pitfall ? (
            <section className="sv-take" data-testid="rd-pitfall">
              <h3 className="sv-rc-title">Fallgropen</h3>
              <p className="sv-rc-text sv-rc-text--lead">
                <MathText>{e.pitfall}</MathText>
              </p>
            </section>
          ) : null}
          <section className="sv-take" data-testid="rd-technique">
            <h3 className="sv-rc-title">Tekniken</h3>
            <p className="sv-rc-text">
              <MathText>{e.technique}</MathText>
            </p>
            {framework && e.framework_id ? (
              <p className="sv-rc-note">
                {frameworkKind(e.framework_id)}: <b>{framework}</b> – finns att slå upp i Uppslag.
              </p>
            ) : null}
          </section>
        </div>
      )
    }
    case 'losning':
      if (!e) return null
      return (
        <div className="sv-rc sv-rc--steps">
          <p className="sv-rc-eyebrow">Hela vägen</p>
          <h3 className="sv-rc-title">Lösningen</h3>
          {options.problem ? (
            <div className="sv-rc-problem">
              <p className="sv-rc-problem-label">Uppgiften</p>
              {options.problem}
            </div>
          ) : null}
          <p className="sv-rc-text sv-rc-text--lead">
            <MathText>{e.solution_path}</MathText>
          </p>
          <h4 className="sv-steps-head">Steg för steg</h4>
          <ol className="sv-steps">
            {(e.steps ?? []).map((s) => (
              <Step key={s.n} step={s} view={view} act={act} refs={refs} />
            ))}
          </ol>
        </div>
      )
    case 'andra': {
      if (!e) return null
      const others = e.distractors.filter((d) => d.letter !== mine?.letter)
      return (
        <div className="sv-rc">
          <p className="sv-rc-eyebrow">Sist</p>
          <h3 className="sv-rc-title">{mine ? 'De andra alternativen' : 'Alternativen'}</h3>
          <div className="sv-dis-list">
            {others.map((d) => (
              <Distractor
                key={d.letter}
                d={d}
                option={optionOf(view, d.letter)}
                cites={view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }}
                act={act}
              />
            ))}
          </div>
        </div>
      )
    }
  }
}

/** An option's face: its text (math rendered), or its picture with the
 *  text as the picture's name. With `pictures` the picture is one the
 *  question needs: it reports its load, and a failed one says so. */
export function OptionText({ option, pictures }: { option: DrillOption; pictures?: Pictures }) {
  const figure = option.figure
  if (figure) {
    if (pictures?.state[figure.src] === 'error') {
      return <span className="sv-opt-img-failed">Bilden kunde inte laddas.</span>
    }
    return (
      <OptionPicture
        key={pictures?.attempt[figure.src] ?? 0}
        figure={figure}
        alt={figure.alt || option.text}
        report={pictures?.report}
      />
    )
  }
  return <MathText>{option.text}</MathText>
}

function OptionPicture({
  figure,
  alt,
  report,
}: {
  figure: DrillOptionFigure
  alt: string
  report?: Pictures['report']
}) {
  const ref = useRef<HTMLImageElement>(null)
  // A picture the browser already holds may have loaded before anyone
  // listened: it counts at once.
  useLayoutEffect(() => {
    const img = ref.current
    if (report && img?.complete && img.naturalWidth > 0) report(figure.src, 'ready')
  }, [figure.src, report])
  return (
    <img
      ref={ref}
      className="sv-opt-img"
      src={`/${figure.src}`}
      alt={alt}
      width={figure.width}
      height={figure.height}
      onLoad={report ? () => report(figure.src, 'ready') : undefined}
      onError={report ? () => report(figure.src, 'error') : undefined}
    />
  )
}

/** The back of the question card, set like a card's face: the verdict in a
 *  glyph and a word (never colour alone), the right answer's letter as the
 *  card's large rank with its text in the text's own face, and your pick
 *  under one thin rule. After a miss the card's one action is the lesson:
 *  "Varför lockade A?" deals the next card of the run. */
function VerdictCard({ view, deck, lure }: { view: DrillCoreView; deck: Deck; lure: boolean }) {
  const q = view.question
  const correct = view.correct === true
  const right = optionOf(view, q.answer)
  const mine = correct ? null : optionOf(view, view.picked)
  return (
    <div className="sv-rc sv-rc--verdict sv-rc--center" data-correct={String(correct)}>
      <p className="sv-verdict" data-testid="rd-verdict" data-correct={String(correct)}>
        <span className="sv-verdict-glyph" aria-hidden>
          {correct ? <Check size={20} strokeWidth={2.5} /> : <X size={20} strokeWidth={2.5} />}
        </span>
        <span className="sv-verdict-words">
          <b>{correct ? 'Rätt.' : 'Fel.'}</b>{' '}
          {correct ? `Svaret är ${q.answer}.` : `Rätt svar är ${q.answer}.`}
        </span>
      </p>
      {right ? (
        <div className="sv-rank">
          <span className="sv-rank-letter" aria-hidden>
            {right.letter}
          </span>
          <div className="sv-rank-body">
            <p className="sv-rank-label">{correct ? 'Ditt svar, rätt' : 'Rätt svar'}</p>
            <p className="sv-rank-text">
              <span className="sv-sr">Alternativ {right.letter}: </span>
              <OptionText option={right} />
            </p>
          </div>
        </div>
      ) : null}
      {mine ? (
        <p className="sv-chose">
          <span className="sv-chose-label">Du valde {mine.letter}</span>
          <OptionText option={mine} />
        </p>
      ) : null}
      {view.explanation ? null : (
        <p className="sv-rc-note sv-rc-note--missing">Förklaringen saknas just nu.</p>
      )}
      {mine && lure ? (
        <button type="button" className="sv-btn sv-btn--primary sv-onward" onClick={deck.next}>
          Varför lockade {mine.letter}?
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

function LureCard({
  view,
  d,
  act,
}: {
  view: DrillCoreView
  d: DistractorExplanation
  act: DrillCoreActions
}) {
  const cites = view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }
  return (
    <div className="sv-rc" data-testid={`rd-distractor-${d.letter}`}>
      <p className="sv-rc-eyebrow">Ditt svar · {d.letter}</p>
      <h3 className="sv-rc-title">Därför lockade {d.letter}</h3>
      <p className="sv-rc-text">
        <Rich text={d.why_tempting} act={act} />
      </p>
      <Cites list={cites.tempting} source={`why-${d.letter}`} act={act} />
      <h3 className="sv-rc-title sv-rc-title--next">Varför {d.letter} är fel</h3>
      <p className="sv-rc-text">
        <Rich text={d.why_wrong} act={act} />
      </p>
      <Cites list={cites.wrong} source={`why-${d.letter}`} act={act} />
    </div>
  )
}

function Step({
  step,
  view,
  act,
  refs,
}: {
  step: ExplanationStep
  view: DrillCoreView
  act: DrillCoreActions
  refs: DrillCoreRefs
}) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  return (
    <li
      className="sv-step"
      data-tier={step.tier ?? 'essential'}
      data-testid={`rd-step-${step.n}`}
      ref={refs.step(step.n)}
    >
      <span className="sv-step-n" aria-hidden>
        {step.n}
      </span>
      <div className="sv-step-body">
        <h4 className="sv-step-title">
          <span className="sv-sr">Steg {step.n}: </span>
          <MathText>{step.title}</MathText>
          {detail ? <span className="sv-step-tier"> · fördjupning</span> : null}
        </h4>
        {open ? (
          <p className="sv-step-text">
            <Rich text={step.text} act={act} />
          </p>
        ) : null}
        <div className="sv-step-tools">
          {detail ? (
            <button
              type="button"
              className="sv-link"
              data-testid={`rd-step-toggle-${step.n}`}
              aria-expanded={open}
              onClick={() => act.toggleStep(step.n)}
            >
              {open ? 'Dölj fördjupningen' : 'Visa fördjupningen'}
              <ChevronDown size={15} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
          <Cites list={view.stepCites[step.n] ?? []} source={`step-${step.n}`} act={act} />
        </div>
      </div>
    </li>
  )
}

function Distractor({
  d,
  option,
  cites,
  act,
}: {
  d: DistractorExplanation
  option: DrillOption | undefined
  cites: { tempting: number[]; wrong: number[] }
  act: DrillCoreActions
}) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <article className="sv-dis" data-testid={`rd-distractor-${d.letter}`} data-open={String(open)}>
      <div className="sv-dis-head">
        <span className="sv-opt-key" aria-hidden>
          {d.letter}
        </span>
        <p className="sv-dis-opt">
          <span className="sv-sr">Alternativ {d.letter}: </span>
          {option ? <OptionText option={option} /> : null}
        </p>
      </div>
      <button
        type="button"
        className="sv-link"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Dölj' : 'Varför det lockar – och varför det är fel'}
        <ChevronDown size={15} strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div className="sv-dis-body" id={bodyId}>
          <p className="sv-dis-sub">Varför det lockar</p>
          <p className="sv-rc-text">
            <Rich text={d.why_tempting} act={act} />
          </p>
          <Cites list={cites.tempting} source={`why-${d.letter}`} act={act} />
          <p className="sv-dis-sub">Varför det är fel</p>
          <p className="sv-rc-text">
            <Rich text={d.why_wrong} act={act} />
          </p>
          <Cites list={cites.wrong} source={`why-${d.letter}`} act={act} />
        </div>
      ) : null}
    </article>
  )
}

/** ¶ links: each scrolls the text to its paragraph and marks the sentence
 *  the part quotes. Empty without a passage. */
function Cites({ list, source, act }: { list: number[]; source: string; act: DrillCoreActions }) {
  if (list.length === 0) return null
  return (
    <span className="sv-cites">
      <span className="sv-cites-label">I texten</span>
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="sv-cite"
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

/** Explanation text, verbatim, with its math rendered and its "(steg 2)"
 *  references made links to the step. */
function Rich({ text, act }: { text: string; act: DrillCoreActions }) {
  let at = 0
  return (
    <>
      {splitStepRefs(text).map((seg) => {
        const key = at
        at += seg.text.length
        return seg.kind === 'text' ? (
          <span key={key}>
            <MathText>{seg.text}</MathText>
          </span>
        ) : (
          <button
            key={key}
            type="button"
            className="sv-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}

// ── The text card ────────────────────────────────────────────────────

/** The parts whose quotations the run card in front leans on (the verdict
 *  leans on none: the underlines alone show where the evidence is). */
function leaningOn(id: RunId | undefined, view: DrillCoreView): (source: string) => boolean {
  const picked = `why-${view.picked}`
  switch (id) {
    case 'losning':
      return (s) => s.startsWith('step-')
    case 'lockade':
      return (s) => s === picked
    case 'andra':
      return (s) => s.startsWith('why-') && s !== picked
    default:
      return () => false
  }
}

/** The paragraph the run card in front points at, for the desktop text to
 *  turn to: the steps' first evidence, or where the lure is answered. */
function evidenceFor(id: RunId | undefined, view: DrillCoreView): number | undefined {
  if (id === 'lockade') {
    const c = view.distractorCites[view.picked ?? '']
    return c?.wrong[0] ?? c?.tempting[0]
  }
  if (id === 'svar' || id === 'losning') {
    for (const s of view.explanation?.steps ?? []) {
      const cites = view.stepCites[s.n]
      if (s.tier !== 'detail' && cites?.length) return cites[0]
    }
    return view.cited[0]
  }
  return undefined
}

/** A paragraph's text with its marks, overlaps dropped (first wins). */
function marked(
  text: string,
  marks: QuoteMark[],
  view: DrillCoreView,
  lean: (s: string) => boolean,
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
        className="sv-ev"
        data-kind={m.source.startsWith('why-') ? 'wrong' : 'evidence'}
        data-lean={String(lean(m.source))}
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

function PassageCard({
  view,
  act,
  refs,
  copy,
  note,
  setNote,
  focusOn,
  toggleFocus,
  front,
  phone,
  inert,
  scrollRef,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  refs: DrillCoreRefs
  copy: Chrome['copy']
  note: boolean
  setNote: (open: boolean) => void
  focusOn: boolean
  toggleFocus: () => void
  /** The run card in front (facit), whose evidence the text leans on. */
  front: RunId | undefined
  phone: boolean
  inert?: boolean
  scrollRef?: { current: HTMLElement | null }
}) {
  const titleId = useId()
  const noteId = useId()
  const passage = view.question.passage
  const paragraphs = view.passage?.paragraphs ?? []
  const byline = view.passage?.byline ?? null
  const [title, subtitle] = unitTitle(view)
  const graded = view.phase === 'feedback'
  const lean = leaningOn(front, view)
  // Underlined always after the answer: the steps' quotations and the
  // sentences that answer your pick; the card in front lights its own.
  const marks = graded
    ? view.marks.filter(
        (m) =>
          m.source.startsWith('step-') ||
          (!view.correct && m.source === `why-${view.picked}`) ||
          lean(m.source),
      )
    : []
  const lit = new Set(marks.filter((m) => lean(m.source)).map((m) => m.para))
  return (
    <div className="sv-card sv-pcard" inert={inert}>
      {/* The text scrolls on its own, so the keyboard can reach it: a click
       *  or Tab puts the focus here, and Space then scrolls the text instead
       *  of answering. */}
      <section
        className="sv-pcard-scroll"
        ref={scrollRef}
        aria-labelledby={titleId}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must take the keyboard (WCAG 2.1.1)
        tabIndex={0}
      >
        <div className="sv-pcard-head">
          <SecChip section={view.question.section} />
          {passage?.synthetic ? (
            <>
              <span className="sv-badge" data-testid="rd-badge">
                {copy.ovningstextBadge}
              </span>
              <button
                type="button"
                className="sv-chip"
                data-testid="rd-note-toggle"
                aria-expanded={note}
                aria-controls={noteId}
                onClick={() => setNote(!note)}
              >
                <Info size={15} strokeWidth={2} aria-hidden />
                {note ? 'Dölj' : 'Om texten'}
              </button>
            </>
          ) : null}
          {phone ? null : (
            <button
              type="button"
              className="sv-chip sv-chip--end"
              aria-pressed={focusOn}
              onClick={toggleFocus}
              title="Styckefokus: F slår på, J och K byter stycke"
            >
              <Pilcrow size={15} strokeWidth={2} aria-hidden />
              Styckefokus
            </button>
          )}
        </div>
        {passage?.synthetic ? (
          <p className="sv-note" id={noteId} hidden={!note} data-testid="rd-note">
            {copy.ovningstextNote}
          </p>
        ) : null}
        <h1 className="sv-ptitle" id={titleId}>
          {title}
          {subtitle ? <span>{subtitle}</span> : null}
        </h1>
        <div
          className="sv-pbody"
          data-testid="rd-passage"
          data-focus={String(view.focusPara != null)}
          lang={passage?.lang}
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
                className="sv-para"
                data-testid={`rd-para-${n}`}
                data-n={n}
                data-cited={String(graded && view.cited.includes(n))}
                data-lit={String(lit.has(n))}
                data-flash={String(view.flashPara === n && !sentence)}
                data-focused={String(view.focusPara === n)}
              >
                {/* Out of the tab order: nine of these must not stand between
                 *  the reader and the question; F, J and K drive the same aid. */}
                <button
                  type="button"
                  className="sv-pnum"
                  tabIndex={-1}
                  aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                  aria-pressed={view.focusPara === n}
                  onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
                >
                  {n}
                </button>
                {own.length ? marked(p, own, view, lean) : p}
              </p>
            )
          })}
          {byline ? <p className="sv-byline">{byline}</p> : null}
        </div>
      </section>
    </div>
  )
}

// ── The question card ────────────────────────────────────────────────

/** The options as slips of card stock, each with its strike. `prefix`
 *  names them for the contract (rd-option on a reading question,
 *  rd-quant-option on a quant one, which carries no strike ids). */
export function Options({
  view,
  act,
  still,
  prefix = 'rd-option',
  pictures,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  still: boolean
  prefix?: 'rd-option' | 'rd-quant-option'
  /** The drill's pictures, for options that are pictures. */
  pictures?: Pictures
}) {
  const strikeIds = prefix === 'rd-option'
  return (
    <ol className="sv-opts" aria-label="Svarsalternativ">
      {(view.question.options ?? []).map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="sv-opt"
            data-state={selected ? 'selected' : out ? 'out' : undefined}
            data-figure={o.figure ? 'true' : undefined}
          >
            <button
              type="button"
              className="sv-opt-main"
              data-testid={still ? undefined : `${prefix}-${o.letter}`}
              aria-pressed={selected}
              tabIndex={still ? -1 : undefined}
              onClick={still ? undefined : () => act.select(o.letter)}
            >
              <span className="sv-opt-key" aria-hidden>
                {o.letter}
              </span>
              <span className="sv-opt-text">
                <span className="sv-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                <OptionText option={o} pictures={still ? undefined : pictures} />
              </span>
            </button>
            <button
              type="button"
              className="sv-opt-x"
              data-testid={still || !strikeIds ? undefined : `rd-eliminate-${o.letter}`}
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
              title={out ? 'Ångra' : 'Stryk alternativet (⇧ + bokstav)'}
              tabIndex={still ? -1 : undefined}
              onClick={still ? undefined : () => act.toggleEliminate(o.letter)}
            >
              {out ? (
                <Undo2 size={17} strokeWidth={2} aria-hidden />
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

export function LockBar({
  view,
  act,
  still,
  wait,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  still: boolean
  /** Why Svara waits (a picture the question needs), or nothing. */
  wait?: Wait | null
}) {
  return (
    <div className="sv-lockbar">
      <button
        type="button"
        className="sv-btn sv-btn--primary sv-btn--wide"
        disabled={!view.selected || wait != null}
        onClick={still ? undefined : act.lock}
        data-testid={still ? undefined : 'rd-lock'}
        tabIndex={still ? -1 : undefined}
      >
        {view.selected ? `Svara ${view.selected}` : 'Svara'}
        <Kbd>↵</Kbd>
      </button>
      <span
        className="sv-echo"
        data-wait={wait ? 'true' : undefined}
        aria-live={still ? undefined : 'polite'}
      >
        {wait
          ? wait.text
          : view.selected
            ? 'Du kan ändra dig tills du svarar.'
            : 'Välj ett alternativ först.'}
      </span>
      {wait?.retry && !still ? (
        <button type="button" className="sv-link" onClick={wait.retry}>
          Försök igen
        </button>
      ) : null}
    </div>
  )
}

/** Desktop: the question card in the pair. `still` is its face during the
 *  turn — a picture, no ids and no handlers. */
function QuestionFace({
  view,
  act,
  still,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  still: boolean
}) {
  return (
    <div className="sv-card sv-qcard">
      <div className="sv-qcard-scroll">
        <p className="sv-qlabel">
          Fråga {view.index + 1} <span>av {view.total}</span>
        </p>
        <h2 className="sv-prompt">
          <MathText>{view.question.prompt}</MathText>
        </h2>
        <Options view={view} act={act} still={still} />
      </div>
      <LockBar view={view} act={act} still={still} />
    </div>
  )
}

/** The card's two faces. While it turns, both are there: the question
 *  turns away and the verdict turns in. At rest only one face exists, so
 *  no 3D transform is left on the text. */
export function Faces({
  feedback,
  motion,
  front,
  back,
}: {
  feedback: boolean
  motion: Motion
  front: (still: boolean) => ReactNode
  back: () => ReactNode
}) {
  return (
    <div className="sv-faces">
      {!feedback || motion.turning ? (
        <div
          className="sv-face"
          data-turn={motion.turning ? 'out' : undefined}
          data-deal={!feedback && motion.dealt ? 'in' : undefined}
          inert={feedback}
          aria-hidden={feedback || undefined}
        >
          {front(feedback)}
        </div>
      ) : null}
      {feedback ? (
        <div className="sv-face" data-turn={motion.turning ? 'in' : undefined}>
          {back()}
        </div>
      ) : null}
    </div>
  )
}

export function Timer({ seconds }: { seconds: number }) {
  return (
    <span className="sv-timer" role="timer" aria-label={`Tid ${fmtClock(seconds)}`}>
      <Clock size={15} strokeWidth={2} aria-hidden />
      <span aria-hidden>{fmtClock(seconds)}</span>
    </span>
  )
}

export function ExitButton({
  act,
  hint,
}: {
  act: Pick<DrillCoreActions, 'exit'>
  /** The tooltip. */
  hint?: string
}) {
  return (
    <button type="button" className="sv-exit" onClick={act.exit} title={hint} data-testid="rd-exit">
      <X size={18} strokeWidth={2} aria-hidden />
      Avsluta
    </button>
  )
}

/** The reading drill's way out says what happens to the answers (round 1's
 *  copy). */
const READING_EXIT_HINT = 'Dina svar är sparade'

/**
 * Desktop: the question column — the question card with the unit's waiting
 * questions as edges behind it, turning over into the facit run, and its
 * foot (the key hints, then the run's counter and Nästa).
 */
export function QuestionColumn({
  view,
  act,
  run,
  motion,
  live,
  face,
  keys,
  finish,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  run: Run
  motion: Motion
  live: boolean
  face: (still: boolean) => ReactNode
  /** The foot while the question is open. */
  keys: ReactNode
  /** Nästa's words on the last question. */
  finish: string
}) {
  const feedback = view.phase === 'feedback'
  const last = view.index + 1 >= view.total
  // The waiting questions' edges stay while the card turns over.
  const waiting = feedback && !motion.turning ? 0 : Math.min(2, view.total - view.index - 1)
  return (
    <section className="sv-qcol" aria-label={feedback ? 'Facit' : `Fråga ${view.index + 1}`}>
      <div className="sv-qslot" data-waiting={waiting}>
        {Array.from({ length: waiting }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the waiting questions' edges
          <span key={i} className="sv-qedge" data-n={i + 1} aria-hidden />
        ))}
        <Faces
          feedback={feedback}
          motion={motion}
          front={face}
          back={() => (
            <DeckStage
              deck={run.deck}
              cards={run.cards}
              label={`Facit, ${run.cards.length} kort`}
              kind="run"
              live={live}
            />
          )}
        />
      </div>
      <div className="sv-qfoot" data-phase={view.phase} data-turning={String(motion.turning)}>
        {feedback ? (
          <>
            <DeckCounter deck={run.deck} cards={run.cards} />
            {/* "Slutför", not "Avsluta": Avsluta is the way out mid-drill.
             *  Quiet while a miss's verdict card is in front: there the
             *  lesson is the card's own action. */}
            <button
              type="button"
              className={`sv-btn ${lessonFirst(view, run) ? 'sv-btn--quiet' : 'sv-btn--primary'}`}
              onClick={act.next}
              data-testid="rd-next"
            >
              {last ? finish : 'Nästa fråga'}
              <Kbd>↵</Kbd>
            </button>
          </>
        ) : (
          keys
        )}
      </div>
    </section>
  )
}

/** "A–D väljer": the question's own first and last letter. */
export function letterSpan(view: DrillCoreView): ReactNode {
  const first = view.letters[0]
  const last = view.letters[view.letters.length - 1]
  if (!first || !last) return null
  return (
    <span>
      <Kbd>{first}</Kbd>–<Kbd>{last}</Kbd> väljer
    </span>
  )
}

// ── Desktop ──────────────────────────────────────────────────────────

function DeskDrill(c: Chrome) {
  const { view, act, refs, run, motion, live } = c
  const scrollRef = useRef<HTMLElement>(null)
  const feedback = view.phase === 'feedback'
  const front = feedback ? run.cards[run.deck.index]?.id : undefined
  const target = feedback ? evidenceFor(front, view) : undefined

  // The text turns to the evidence of the card in front — at once on a
  // fresh verdict, smoothly while the reader moves through the run.
  const turned = useRef(false)
  useEffect(() => {
    const box = scrollRef.current
    if (!feedback) {
      turned.current = false
      return
    }
    const el = target ? box?.querySelector<HTMLElement>(`[data-n="${target}"]`) : null
    if (!box || !el || typeof box.scrollTo !== 'function') return
    const top =
      el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 120
    const smooth = turned.current && !prefersReducedMotion()
    box.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' })
    turned.current = true
  }, [feedback, target])

  if (view.phase === 'done') {
    return (
      <div className="sv-drill sv-drill--done">
        <div className="sv-drill-top">
          <ExitButton act={act} hint={READING_EXIT_HINT} />
        </div>
        <div className="sv-done-wrap">{c.done}</div>
      </div>
    )
  }

  return (
    <div className="sv-drill">
      <div className="sv-drill-top">
        <ExitButton act={act} hint={READING_EXIT_HINT} />
        {/* The position in cards (the question card names it in words). */}
        <div className="sv-drill-status">
          <QuestionCards
            total={view.total}
            answered={view.results.length}
            current={feedback ? null : view.index}
          />
          <Timer seconds={view.elapsed} />
        </div>
      </div>
      <div className="sv-pair">
        <PassageCard
          view={view}
          act={act}
          refs={refs}
          copy={c.copy}
          note={c.note}
          setNote={c.setNote}
          focusOn={c.focusOn}
          toggleFocus={c.toggleFocus}
          front={front}
          phone={false}
          scrollRef={scrollRef}
        />
        <QuestionColumn
          view={view}
          act={act}
          run={run}
          motion={motion}
          live={live}
          face={(still) => <QuestionFace view={view} act={act} still={still} />}
          finish="Slutför texten"
          keys={
            <p className="sv-keys">
              {letterSpan(view)}
              <span>
                <Kbd>⇧</Kbd> + bokstav stryker
              </span>
              <span>
                <Kbd>↵</Kbd> svarar
              </span>
              <span>
                <Kbd>F</Kbd> styckefokus
              </span>
            </p>
          }
        />
      </div>
    </div>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

/**
 * Phone: a reference card that fills the screen (the text, or a DTK
 * figure) with the question card peeking from below — its head and whole
 * prompt — rising to its options, its facit side covering the reference.
 */
export function SheetDrill({
  view,
  act,
  run,
  motion,
  live,
  sheet,
  head,
  reference,
  refLabel,
  toReference,
  prompt,
  prefix,
  pictures,
  wait,
  finish,
  exitHint,
  done,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  run: Run
  motion: Motion
  live: boolean
  sheet: Sheet
  /** The head's tools between the position and the clock. */
  head?: ReactNode
  /** The card under the sheet; inert while the sheet is up. */
  reference: (inert: boolean) => ReactNode
  /** "Till texten", "Till figuren". */
  refLabel: string
  /** From the facit back down to the reference. */
  toReference: () => void
  prompt: ReactNode
  prefix?: 'rd-option' | 'rd-quant-option'
  /** The drill's pictures, for options that are pictures. */
  pictures?: Pictures
  /** Why Svara waits, or nothing. */
  wait?: Wait | null
  /** Nästa's words on the last question. */
  finish: string
  exitHint?: string
  done: ReactNode
}) {
  const state: SheetState = sheet.state
  const feedback = view.phase === 'feedback'

  // The peek shows the card's head: measured from the card's top edge to
  // the foot of its head, so the whole prompt and its button fit.
  const sheetRef = useRef<HTMLElement>(null)
  const peekRef = useRef<HTMLDivElement>(null)
  const [peek, setPeek] = useState(190)
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the card's content changes
  useLayoutEffect(() => {
    const el = peekRef.current
    const card = sheetRef.current
    if (!el || !card) return
    const measure = () => {
      const h = Math.round(el.getBoundingClientRect().bottom - card.getBoundingClientRect().top)
      if (h > 0) setPeek(h)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [view.index, view.phase, state])

  if (view.phase === 'done') {
    return (
      <div className="sv-pdrill sv-pdrill--done">
        <header className="sv-pdhead">
          <ExitButton act={act} hint={exitHint} />
        </header>
        <div className="sv-done-wrap">{done}</div>
      </div>
    )
  }

  const up = state !== 'peek'
  return (
    <div
      className="sv-pdrill"
      data-sheet={state}
      style={{ '--sv-peek': `${peek}px` } as CSSProperties}
    >
      <header className="sv-pdhead">
        <ExitButton act={act} hint={exitHint} />
        <PhonePosition view={view} />
        {head}
        <Timer seconds={view.elapsed} />
      </header>
      <div className="sv-pdbody">
        {reference(up)}
        {up ? (
          // A tap on the reference behind puts the card back down (the
          // labelled button in the card's head does the same from the keys).
          <button
            type="button"
            className="sv-pdscrim"
            tabIndex={-1}
            aria-label={refLabel}
            onClick={() => sheet.setState('peek')}
          />
        ) : null}
        <section
          ref={sheetRef}
          className="sv-qsheet"
          data-testid="rd-sheet"
          data-state={state}
          data-phase={view.phase}
          aria-label={feedback ? 'Facit' : `Fråga ${view.index + 1}`}
        >
          {/* For thumbs and pointers; the keyboard has the same moves as
           *  labelled buttons, so it stays out of the tab order. */}
          <button
            type="button"
            className="sv-grab"
            tabIndex={-1}
            aria-label={up ? refLabel : feedback ? 'Tillbaka till facit' : 'Till frågan'}
            aria-expanded={up}
            {...sheet.grab}
          >
            <i aria-hidden />
          </button>
          <Faces
            feedback={feedback}
            motion={motion}
            front={(still) => (
              <PhoneQuestion
                view={view}
                act={act}
                still={still}
                state={state}
                setState={sheet.setState}
                peekRef={still ? undefined : peekRef}
                refLabel={refLabel}
                prompt={prompt}
                prefix={prefix}
                pictures={pictures}
                wait={wait}
              />
            )}
            back={() => (
              <PhoneFacit
                view={view}
                act={act}
                run={run}
                live={live}
                state={state}
                setState={sheet.setState}
                peekRef={peekRef}
                reference={{ label: refLabel, go: toReference }}
                finish={finish}
              />
            )}
          />
        </section>
      </div>
    </div>
  )
}

/** The phone head's position: the questions as small cards and "3/4". */
export function PhonePosition({ view }: { view: DrillCoreView }) {
  const feedback = view.phase === 'feedback'
  return (
    <span className="sv-pdhead-pos">
      <QuestionCards
        total={view.total}
        answered={view.results.length}
        current={feedback ? null : view.index}
      />
      <span aria-hidden>
        {view.index + 1}/{view.total}
      </span>
      <span className="sv-sr">
        Fråga {view.index + 1} av {view.total}
      </span>
    </span>
  )
}

function PhoneDrill(c: Chrome & { sheet: Sheet }) {
  const { view, act, refs, run, sheet } = c
  const feedback = view.phase === 'feedback'
  const front = feedback ? run.cards[run.deck.index]?.id : undefined
  // Down to the text at the evidence the card in front leans on, marked for
  // a moment — never back at ¶1.
  const toText = () => {
    sheet.setState('peek')
    const n = evidenceFor(run.cards[run.deck.index]?.id, view) ?? view.cited[0]
    if (n) act.cite(n)
  }
  return (
    <SheetDrill
      view={view}
      act={act}
      run={run}
      motion={c.motion}
      live={c.live}
      sheet={sheet}
      head={
        <button
          type="button"
          className="sv-icon-btn"
          aria-pressed={c.focusOn}
          aria-label="Styckefokus"
          title="Styckefokus"
          onClick={c.toggleFocus}
        >
          <Pilcrow size={18} strokeWidth={2} aria-hidden />
        </button>
      }
      reference={(inert) => (
        <PassageCard
          view={view}
          act={act}
          refs={refs}
          copy={c.copy}
          note={c.note}
          setNote={c.setNote}
          focusOn={c.focusOn}
          toggleFocus={c.toggleFocus}
          front={front}
          phone
          inert={inert}
        />
      )}
      refLabel="Till texten"
      toReference={toText}
      prompt={
        <h2 className="sv-prompt">
          <MathText>{view.question.prompt}</MathText>
        </h2>
      }
      finish="Slutför texten"
      exitHint={READING_EXIT_HINT}
      done={c.done}
    />
  )
}

export function PhoneQuestion({
  view,
  act,
  still,
  state,
  setState,
  peekRef,
  refLabel,
  prompt,
  prefix,
  pictures,
  wait,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  still: boolean
  state: SheetState
  setState: Sheet['setState']
  peekRef?: { current: HTMLDivElement | null }
  refLabel: string
  prompt: ReactNode
  prefix?: 'rd-option' | 'rd-quant-option'
  pictures?: Pictures
  wait?: Wait | null
}) {
  const up = state !== 'peek'
  return (
    <div className="sv-qs">
      <div className="sv-qs-peek" ref={peekRef}>
        <div className="sv-qs-head">
          <p className="sv-qlabel">
            Fråga {view.index + 1} <span>av {view.total}</span>
          </p>
          {/* A quiet control in the card's head, not a filled bar: while you
           *  read, nothing pulls at the eye (the fill is Svara's). */}
          {up ? (
            <button type="button" className="sv-link" onClick={() => setState('peek')}>
              {refLabel}
              <ChevronDown size={16} strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              className="sv-chip sv-chip--raise"
              aria-expanded={false}
              onClick={() => setState('open')}
            >
              Till frågan
              <ArrowUp size={16} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
        {prompt}
      </div>
      <div className="sv-qs-rest" inert={!up}>
        <Options view={view} act={act} still={still} prefix={prefix} pictures={pictures} />
        <LockBar view={view} act={act} still={still} wait={wait} />
      </div>
    </div>
  )
}

/**
 * The facit side on phone: the run of cards on the table, its counter and
 * index, and Nästa. Under a reference card it lowers to a peek (the verdict
 * in one line and "Till facit") with `reference`'s way down; alone on the
 * table (Kvantfråga) it is always up.
 */
export function PhoneFacit({
  view,
  act,
  run,
  live,
  state,
  setState,
  peekRef,
  reference,
  finish = 'Slutför texten',
}: {
  view: DrillCoreView
  act: DrillCoreActions
  run: Run
  live: boolean
  state: SheetState
  setState?: Sheet['setState']
  peekRef?: { current: HTMLDivElement | null }
  reference?: { label: string; go: () => void }
  /** Nästa's words on the last question. */
  finish?: string
}) {
  const up = state !== 'peek'
  const last = view.index + 1 >= view.total
  const correct = view.correct === true
  return (
    <div className="sv-qs sv-qs--facit">
      <div className="sv-qs-peek" ref={peekRef}>
        <div className="sv-qs-head">
          {up ? (
            <p className="sv-qlabel">
              Facit <span>· fråga {view.index + 1}</span>
            </p>
          ) : (
            <p className="sv-miniverdict" data-correct={String(correct)}>
              <span className="sv-verdict-glyph" aria-hidden>
                {correct ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  <X size={16} strokeWidth={2.5} />
                )}
              </span>
              <span>
                <b>{correct ? 'Rätt.' : 'Fel.'}</b> Rätt svar är {view.question.answer}.
              </span>
            </p>
          )}
          {reference ? (
            up ? (
              <button type="button" className="sv-link" onClick={reference.go}>
                {reference.label}
                <ChevronDown size={16} strokeWidth={2} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                className="sv-chip sv-chip--raise"
                aria-expanded={false}
                onClick={() => setState?.('full')}
              >
                Till facit
                <ArrowUp size={16} strokeWidth={2} aria-hidden />
              </button>
            )
          ) : null}
        </div>
      </div>
      <div className="sv-qs-rest" inert={!up}>
        <DeckStage
          deck={run.deck}
          cards={run.cards}
          label={`Facit, ${run.cards.length} kort`}
          kind="run"
          live={live}
        />
        <div className="sv-runfoot">
          <DeckCounter deck={run.deck} cards={run.cards} arrows={false} />
          <DeckTicks deck={run.deck} cards={run.cards} label="Facitkorten" />
        </div>
        <button
          type="button"
          className={`sv-btn sv-btn--block ${lessonFirst(view, run) ? 'sv-btn--quiet' : 'sv-btn--primary'}`}
          onClick={act.next}
          data-testid="rd-next"
        >
          {last ? finish : 'Nästa fråga'}
          <Kbd>↵</Kbd>
        </button>
      </div>
    </div>
  )
}

// ── The end of a sitting: the hand turned face up ────────────────────

type DoneAction = { label: string; onClick: () => void; testId?: string }

export function DoneCard({
  view,
  live,
  eyebrow,
  about,
  primary,
  secondary,
}: {
  view: DrillCoreView
  live: boolean
  /** "LÄS · klart" */
  eyebrow: string
  /** What was drilled: the unit's title, or nothing for a mixed sitting. */
  about?: string | null
  /** The one filled action (Enter takes it). */
  primary: DoneAction | null
  secondary?: DoneAction | null
}) {
  const titleId = useId()
  const right = view.results.filter((r) => r.correct).length
  const misses = view.results.length - right
  const minutes = Math.max(1, Math.round(view.elapsed / 60))
  // A number never parts from its unit.
  const sub = [about, `${view.total} frågor`, `${right} rätt`, `${minutes} min`].filter(Boolean)
  return (
    <section
      className="sv-card sv-done"
      data-testid="rd-done"
      data-live={String(live)}
      aria-labelledby={titleId}
    >
      <p className="sv-rc-eyebrow">{eyebrow}</p>
      <h2 className="sv-done-title" id={titleId}>
        Hela leken är vänd.
      </h2>
      <p className="sv-done-sub">{sub.join(' · ')}</p>
      <ol className="sv-hand" aria-label="Dina svar">
        {view.results.map((r, i) => (
          <li
            key={r.qid}
            data-correct={String(r.correct)}
            style={{ '--i': i - (view.results.length - 1) / 2 } as CSSProperties}
          >
            <span className="sv-hand-n" aria-hidden>
              {i + 1}
            </span>
            <span className="sv-hand-glyph" aria-hidden>
              {r.correct ? (
                <Check size={18} strokeWidth={2.5} />
              ) : (
                <X size={18} strokeWidth={2.5} />
              )}
            </span>
            <span className="sv-hand-pick" aria-hidden>
              {r.pick}
            </span>
            <span className="sv-sr">
              Fråga {i + 1}: {r.pick}, {r.correct ? 'rätt' : 'fel'}
            </span>
          </li>
        ))}
      </ol>
      <p className="sv-done-note">
        {misses > 0
          ? `${misses === 1 ? 'Missen läggs' : 'Missarna läggs'} i nästa repetition, de äldsta först.`
          : 'Inga missar att repetera.'}
      </p>
      <div className="sv-done-actions">
        {primary ? (
          <button
            type="button"
            className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
            onClick={primary.onClick}
            data-testid={primary.testId}
          >
            {primary.label}
            <Kbd>↵</Kbd>
          </button>
        ) : null}
        {secondary ? (
          <button type="button" className="sv-link sv-link--center" onClick={secondary.onClick}>
            {secondary.label}
          </button>
        ) : null}
      </div>
    </section>
  )
}
