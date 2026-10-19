// Samtal · Läsfråga and Facit — a conversation beside a document.
//
// Desktop: focus mode keeps only a slim strip (Avsluta on the left, the
// progress and the clock on the right). The passage is a calm, opaque
// document panel on the left, ¶ numbers in its margin and its own small
// head (LÄS · ÖVNINGSTEXT, Om texten, Styckefokus). On the right the
// question arrives as a coach turn and the four options stand where your
// reply will go — reply buttons, each with its strike control. Below them
// is the reply dock: a send bar with no text field ("Ditt svar: A" ·
// Svara ↵). Once answered, the dock holds the one way on (Nästa fråga ↵)
// and "Visa allt".
// Phone: the passage first, the question in a reply tray docked to the
// bottom. It peeks with the coach's question and one reply ("Välj ditt
// svar"), opens over the passage without moving it, and goes full for the
// coach's answer. A ¶ link folds it so the cited paragraph shows; Facit
// waits behind the peek, so the way back finds it as the reader left it.
//
// Kit v2: the sitting is useDirectionData()'s drills.reading, run by
// useDrillCore and graded by the context's DrillController. Round 1's steps
// with the switcher stay (an answer opens Facit, Nästa the next Läsfråga,
// Avsluta Idag), and the controller hears every move too. The conversation
// pieces — the options, the action bar, the reply tray — are shared with
// Kvantfråga and DTK (SamtalQuant).

import { ChevronDown, ChevronUp, CircleSlash, Clock, Info, Pilcrow, Undo2, X } from 'lucide-react'
import {
  type ComponentType,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
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
  type DrillStart,
  prefersReducedMotion,
  type QuoteMark,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import {
  type DirectionProps,
  fmtClock,
  type ScreenKey,
  useHideOnScroll,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type { DrillSessionView, PlanItemView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import {
  Closing,
  Explanation,
  type Folds,
  luresFor,
  OptionBody,
  type Pointing,
  Verdict,
  YourAnswer,
} from './SamtalFeedback'
import { Coach, Dots, Kbd, Replies } from './SamtalParts'

/** The document head's height (samtal.css .sa-doc-head). */
const DOC_HEAD = 56

// ── Shared by every drill ────────────────────────────────────────────

/** What a drill screen hands its conversation pieces. */
export type DrillChrome = {
  view: DrillCoreView
  /** The core's actions; lock and next mark the move (moved). */
  act: DrillCoreActions
  refs: DrillCoreRefs
  live: boolean
  folds: Folds
  /** Set by an in-drill answer or "Nästa", so focus follows to the new
   *  turn — never when the switcher changes the screen. */
  moved: { current: boolean }
  /** The coach's reply chips after a wrong answer. */
  lures: readonly string[]
  frameworks: Record<string, string>
  /** The options' test ids: rd-option-<L> (reading) or rd-quant-option-<L>. */
  optionId: 'rd-option' | 'rd-quant-option'
  /** Why the answer cannot be sent (a stem, options or figure missing), or
   *  null. */
  blocked: string | null
  /** The way back while the answer cannot be sent ("Till Öva"). */
  out?: { label: string; onClick: () => void }
  /** A passage beside the thread: the action bar names the focus key. */
  focusAid: boolean
  /** The last question's way on ("Slutför texten", "Slutför övningen"). */
  lastLabel: string
} & Pointing

/** A drill's question turn, as each screen draws it. */
export type TurnComponent = ComponentType<{ view: DrillCoreView; ref?: Ref<HTMLElement> }>

/** The explanation's folds and "Visa allt" for the open question. */
export function useFolds(view: DrillCoreView, act: Pick<DrillCoreActions, 'toggleStep'>): Folds {
  const [others, setOthers] = useState<ReadonlySet<string>>(() => new Set())
  // A new question starts with its folds closed.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new question only
  useEffect(() => {
    setOthers(new Set())
  }, [view.index])
  const e = view.explanation
  const detail = (e?.steps ?? []).filter((s) => s.tier === 'detail').map((s) => s.n)
  const letters = (e?.distractors ?? [])
    .filter((d) => !(view.correct === false && d.letter === view.picked))
    .map((d) => d.letter)
  const allOpen = detail.every((n) => view.openSteps.has(n)) && letters.every((l) => others.has(l))
  return {
    others,
    allOpen,
    any: detail.length + letters.length > 0,
    toggleOther: (l) =>
      setOthers((s) => {
        const n = new Set(s)
        if (n.has(l)) n.delete(l)
        else n.add(l)
        return n
      }),
    showAll: () => {
      for (const n of detail) if (view.openSteps.has(n) === allOpen) act.toggleStep(n)
      setOthers(allOpen ? new Set() : new Set(letters))
    },
  }
}

export function ExitButton({
  act,
  icon = false,
}: {
  act: Pick<DrillCoreActions, 'exit'>
  icon?: boolean
}) {
  return (
    <button
      type="button"
      className="sa-ghost sa-exit"
      onClick={act.exit}
      title="Dina svar är sparade"
      aria-label={icon ? 'Avsluta' : undefined}
      data-testid="rd-exit"
    >
      <X size={18} strokeWidth={1.75} aria-hidden />
      <span className="sa-exit-word" aria-hidden={icon}>
        Avsluta
      </span>
    </button>
  )
}

/** The strip's progress: dots for a short set, the place, the clock. */
export function StripProgress({
  view,
  prefix,
  clock,
}: {
  view: DrillCoreView
  /** The section, when a set spans several ("KVA"). */
  prefix?: string
  clock: boolean
}) {
  return (
    <div className="sa-progress">
      {view.total <= 12 ? <Dots total={view.total} done={view.index} /> : null}
      <span className="sa-progress-text">
        {prefix ? `${prefix} · ` : null}Fråga {view.index + 1} av {view.total}
      </span>
      {clock ? (
        <span className="sa-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
          <Clock size={15} strokeWidth={1.75} aria-hidden />
          <span aria-hidden>{fmtClock(view.elapsed)}</span>
        </span>
      ) : null}
    </div>
  )
}

/** The thread: the coach's question, then either your reply buttons or
 *  your answer and the coach's answer to it. */
export function Conversation({
  c,
  turnRef,
  Turn,
}: {
  c: DrillChrome
  turnRef: Ref<HTMLElement>
  Turn: TurnComponent
}) {
  const { view, act } = c
  if (view.phase === 'question') {
    return (
      <>
        <Turn view={view} ref={turnRef} />
        <Options c={c} />
      </>
    )
  }
  return (
    <>
      <Turn view={view} />
      <YourAnswer view={view} />
      <Verdict view={view} ref={turnRef} />
      <Explanation
        view={view}
        act={act}
        refs={c.refs}
        active={c.active}
        point={c.point}
        folds={c.folds}
        lures={c.lures}
        frameworks={c.frameworks}
      />
    </>
  )
}

/** The options as replies in your lane, each with its strike control
 *  inside the card. Chosen, an option takes your turn's tint and corner.
 *  Only the letters the question has: four, five, or none. */
export function Options({ c }: { c: DrillChrome }) {
  const { view, act, optionId } = c
  const options = view.question.options ?? []
  if (!options.length) return null
  return (
    <ol className="sa-opts" aria-label="Svarsalternativ">
      {options.map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="sa-opt"
            data-state={selected ? 'selected' : out ? 'eliminated' : undefined}
          >
            <button
              type="button"
              className="sa-opt-main"
              data-testid={`${optionId}-${o.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(o.letter)}
            >
              <span className="sa-letter" aria-hidden>
                {o.letter}
              </span>
              <span className="sa-opt-text">
                <span className="sa-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                <OptionBody option={o} />
              </span>
            </button>
            <button
              type="button"
              className="sa-opt-x"
              data-testid={`rd-eliminate-${o.letter}`}
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
              title={out ? 'Ångra' : 'Stryk alternativet (⇧ + bokstav)'}
              onClick={() => act.toggleEliminate(o.letter)}
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

/** The action bar: a flat line of status and action — no field, nothing to
 *  type into. Before the answer it names your choice (or the keys, or why
 *  there is nothing to send, with the way back); after it, it holds "Visa
 *  allt" and the one way on. */
export function Dock({ c, phone = false }: { c: DrillChrome; phone?: boolean }) {
  const { view, act, folds, blocked } = c
  if (view.phase === 'question') {
    const first = view.letters[0]
    const last = view.letters[view.letters.length - 1]
    const send = (
      <button
        type="button"
        className="sa-send"
        disabled={!view.selected || blocked != null}
        onClick={act.lock}
        data-testid="rd-lock"
      >
        Svara
        <Kbd>↵</Kbd>
      </button>
    )
    return (
      <div className="sa-dock" data-blocked={blocked ? 'true' : undefined}>
        <p className="sa-dock-status" aria-live="polite">
          {blocked ? (
            blocked
          ) : view.selected ? (
            <>
              Ditt svar: <b className="sa-dock-pick">{view.selected}</b>
              {phone ? null : (
                <span className="sa-dock-keys">
                  <Kbd>↵</Kbd> svarar
                </span>
              )}
            </>
          ) : phone ? (
            'Välj ett svar'
          ) : (
            <span className="sa-dock-keys">
              <Kbd>{first}</Kbd>–<Kbd>{last}</Kbd> väljer · <Kbd>⇧</Kbd>+bokstav stryker
              {c.focusAid ? (
                <>
                  {' '}
                  · <Kbd>F</Kbd> styckefokus
                </>
              ) : null}
            </span>
          )}
        </p>
        {/* Blocked, the way back stands beside the resting Svara, and the
         *  two keep together when the line is too short for the reason. */}
        {blocked && c.out ? (
          <span className="sa-dock-acts">
            <button type="button" className="sa-chip sa-chip--quiet" onClick={c.out.onClick}>
              {c.out.label}
            </button>
            {send}
          </span>
        ) : (
          send
        )}
      </div>
    )
  }
  const lastOne = view.index + 1 >= view.total
  return (
    <div className="sa-dock">
      {folds.any ? (
        <button
          type="button"
          className="sa-chip sa-chip--quiet"
          aria-expanded={folds.allOpen}
          onClick={folds.showAll}
        >
          {folds.allOpen ? 'Visa mindre' : 'Visa allt'}
        </button>
      ) : (
        <span />
      )}
      {/* "Slutför", not "Avsluta": Avsluta is the way out mid-set. */}
      <button type="button" className="sa-send" onClick={act.next} data-testid="rd-next">
        {lastOne ? c.lastLabel : 'Nästa fråga'}
        <Kbd>↵</Kbd>
      </button>
    </div>
  )
}

/**
 * The phone's reply tray over a document (the passage, a DTK figure): it
 * peeks with the question and one reply, opens to the options, and goes
 * full for the coach's answer. A ¶ link folds it so the paragraph shows;
 * Facit waits behind the peek, mounted, hidden and inert, so the way back
 * finds it as the reader left it — the reply to the coach, the open folds,
 * the place in the explanation, the link in focus.
 */
export function TrayDrill({
  c: chrome,
  Turn,
  head,
  doc,
  foldLabel,
  onDocScroll,
}: {
  c: DrillChrome
  Turn: TurnComponent
  head: ReactNode
  doc: ReactNode
  /** The labelled way back to the document ("Visa texten"). */
  foldLabel: string
  onDocScroll?: (e: { currentTarget: HTMLElement }) => void
}) {
  // Touch has no hover: a tapped link would leave its turn "pointed at"
  // once the tray folds, so the phone does without pointing.
  const c: DrillChrome = { ...chrome, active: null, point: () => {} }
  const { view, act } = c
  const { state: tray, setState: setTray, toggle, grab } = useSheet(view)
  const turnRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  /** The control the reader left Facit from: the way back focuses it. */
  const leftFrom = useRef<HTMLElement | null>(null)
  const feedback = view.phase === 'feedback'
  const peek = tray === 'peek'

  /** Folds the tray to its peek, remembering where in Facit the reader was. */
  const fold = () => {
    const at = document.activeElement
    leftFrom.current =
      feedback && at instanceof HTMLElement && mainRef.current?.contains(at) ? at : null
    setTray('peek')
  }

  // A ¶ link folds the tray to its peek so the cited paragraph shows.
  const trayChrome: DrillChrome = {
    ...c,
    act: {
      ...act,
      cite: (n, source) => {
        fold()
        act.cite(n, source)
      },
    },
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: on question/phase change only
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
    leftFrom.current = null
    if (c.moved.current && c.live) turnRef.current?.focus({ preventScroll: true })
    c.moved.current = false
  }, [view.index, view.phase])

  // Back from the peek, focus returns to the ¶ link (or the fold reply) the
  // reader left from, without scrolling Facit away from where it was.
  useEffect(() => {
    if (tray === 'peek' || !leftFrom.current) return
    leftFrom.current.focus({ preventScroll: true })
    leftFrom.current = null
  }, [tray])

  return (
    <div className="sa-pdrill">
      {head}
      {/* Under the full tray the document is out of reach: inert, so focus
       *  never lands on something covered. */}
      <div className="sa-pdoc" onScroll={onDocScroll} inert={tray === 'full'}>
        {doc}
        {/* Room for the last lines above the peek, the same whatever the
         *  tray does: a shorter range would pull a reader at the end of the
         *  document upward when it opens. */}
        <div className="sa-pdoc-spacer" aria-hidden />
      </div>
      <section
        className="sa-tray"
        data-state={tray}
        data-testid="rd-sheet"
        aria-label={`Fråga ${view.index + 1}`}
      >
        {/* The grab is for thumbs and pointers: the keyboard has the same
         *  moves as labelled replies, so it stays out of the tab order. */}
        <button
          type="button"
          className="sa-tray-grab"
          tabIndex={-1}
          aria-label={tray === 'peek' ? 'Visa frågan' : foldLabel}
          aria-expanded={tray !== 'peek'}
          {...grab}
        />
        {peek ? (
          <div className="sa-tray-peek">
            {feedback ? <Verdict view={view} compact /> : <Turn view={view} />}
            <Replies>
              <button type="button" className="sa-chip sa-chip--primary" onClick={toggle}>
                {feedback ? 'Tillbaka till förklaringen' : 'Välj ett svar'}
                <ChevronUp size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </Replies>
          </div>
        ) : null}
        {/* Facit stays mounted while the tray peeks, hidden and inert behind
         *  the peek, so the way back finds it as the reader left it. A
         *  question holds nothing of the reader's (the choice lives in the
         *  drill), so its peek lets it go. */}
        {peek && !feedback ? null : (
          <div className="sa-tray-main" ref={mainRef} inert={peek}>
            <div className="sa-tray-head">
              <span className="sa-tray-title">{feedback ? 'Facit' : null}</span>
              <button type="button" className="sa-quiet" onClick={fold}>
                {foldLabel}
                <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <div className="sa-tray-body" ref={bodyRef}>
              <div className="sa-thread">
                <Conversation c={trayChrome} turnRef={turnRef} Turn={Turn} />
              </div>
            </div>
            <Dock c={trayChrome} phone />
          </div>
        )}
      </section>
    </div>
  )
}

/** The plan's next part, offered when a set is done. */
export function nextPlanItem(items: readonly PlanItemView[]): PlanItemView | null {
  return items.find((i) => !i.completed) ?? null
}

// ── Läsfråga and Facit ───────────────────────────────────────────────

/**
 * The reading sitting on the drill core, kept in step with the switcher as
 * round 1's useDrill was: screen 2 opens the question unanswered, screen 3
 * graded with the fixture's wrong pick; an answer moves the switcher to 3,
 * "Nästa" back to 2, Avsluta to 1 — without a remount, so the reader's own
 * answer stays. The controller hears every move as well.
 */
function useReadingDrill({
  screen,
  onScreen,
  live,
  session,
  controller,
}: {
  screen: DirectionProps['screen']
  onScreen: (s: ScreenKey) => void
  live: boolean
  session: DrillSessionView
  controller: DrillController
}) {
  const [start] = useState<DrillStart>(() => {
    const qid = session.questions[session.start.index ?? 0]?.qid
    return {
      ...session.start,
      graded: screen === 3 && qid ? session.wrongPick?.[qid] : undefined,
    }
  })
  const core = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start,
    elapsed: session.elapsedSeconds,
    controller,
    live,
  })
  const { gradeAs, reopen, reset, lock: coreLock, next: coreNext, exit: coreExit } = core.act
  const phase = core.view.phase
  const wrongPick = session.wrongPick

  // Keep in step with the switcher: a click on "Facit" while a question is
  // open grades it with the fixture's wrong pick; "Läsfråga" while graded
  // reopens the same question, and after the last one starts over.
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
  // Round 1's way out (Idag), then the controller's (back where the drill
  // was started, in the bake-off; leave the route, in the app).
  const exit = useCallback(() => {
    onScreen(1)
    coreExit()
  }, [coreExit, onScreen])

  return { view: core.view, act: { ...core.act, lock, next, exit }, refs: core.refs }
}

type ReadingChrome = DrillChrome & {
  note: boolean
  setNote: (open: boolean) => void
  focusOn: boolean
  toggleFocus: () => void
  /** The set's end: its name, the way out and the plan's next part. */
  title: string
  clock: boolean
  next: PlanItemView | null
  onOut: () => void
  onNext: () => void
}

/** "Magasinet i Hökaryd: en handbok …" → the title and its subtitle. */
function splitTitle(title: string): [string, string | null] {
  const at = title.indexOf(': ')
  return at === -1 ? [title, null] : [title.slice(0, at), title.slice(at + 2)]
}

export function SamtalDrill({ screen, width, live, onScreen }: DirectionProps) {
  const { data, actions } = useDirectionData()
  const session = data.drills.reading
  const { view, act, refs } = useReadingDrill({
    screen,
    onScreen,
    live,
    session,
    controller: actions.drill,
  })
  const [note, setNote] = useState(false)
  const [active, point] = useState<string | null>(null)
  const folds = useFolds(view, act)
  // A new question starts with nothing pointed at.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new question only
  useEffect(() => {
    point(null)
  }, [view.index])

  const focusOn = view.focusPara != null
  const toggleFocus = () => act.setFocusPara(focusOn ? null : 1)
  const next = nextPlanItem(data.home.plan.items)
  const onOut = () => actions.go('idag')
  const onNext = () => (next ? actions.openPlanItem(next.id) : onOut())

  const moved = useRef(false)
  const lock = () => {
    moved.current = true
    return act.lock()
  }
  const nextQuestion = () => {
    moved.current = true
    return act.next()
  }

  const advance = () => {
    if (view.phase === 'question') lock()
    else if (view.phase === 'feedback') nextQuestion()
    else onNext()
  }
  const keys: Record<string, () => void> = {
    Enter: advance,
    j: () => act.moveFocusPara(1),
    k: () => act.moveFocusPara(-1),
    f: toggleFocus,
    // Esc never leaves the drill: it only lets go of the paragraph focus.
    Escape: () => act.setFocusPara(null),
  }
  // Space advances once answered; while reading it scrolls the text.
  if (view.phase !== 'question') keys[' '] = advance
  for (const letter of view.letters) {
    const l = letter.toLowerCase()
    keys[l] = () => act.select(letter)
    keys[`Shift+${l}`] = () => act.toggleEliminate(letter)
  }
  useKeyMap(keys, live)

  const chrome: ReadingChrome = {
    view,
    act: { ...act, lock, next: nextQuestion },
    refs,
    live,
    folds,
    moved,
    active,
    point,
    lures: luresFor(view.question.section),
    frameworks: data.frameworks,
    optionId: 'rd-option',
    blocked: null,
    focusAid: true,
    lastLabel: 'Slutför texten',
    note,
    setNote,
    focusOn,
    toggleFocus,
    title: splitTitle(view.question.passage?.title ?? session.title)[0],
    clock: session.elapsedSeconds != null,
    next,
    onOut,
    onNext,
  }
  return width === 'phone' ? <PhoneDrill {...chrome} /> : <DeskDrill {...chrome} />
}

function ReadingClosing({ c, ref }: { c: ReadingChrome; ref?: Ref<HTMLElement> }) {
  return (
    <Closing
      view={c.view}
      title={c.title}
      divider="Texten är läst"
      clock={c.clock}
      out={{ label: 'Till Idag', onClick: c.onOut }}
      next={c.next}
      onNext={c.onNext}
      ref={ref}
    />
  )
}

// ── Desktop ──────────────────────────────────────────────────────────

/** The first paragraph the essential steps cite — where the evidence is. */
function evidencePara(view: DrillCoreView): number | undefined {
  for (const s of view.explanation?.steps ?? []) {
    const cites = view.stepCites[s.n]
    if (s.tier !== 'detail' && cites?.length) return cites[0]
  }
  return view.cited[0]
}

function DeskDrill(c: ReadingChrome) {
  const { view, act } = c
  const docRef = useRef<HTMLElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef<HTMLElement>(null)
  const firstTurn = useRef(true)

  // A new question starts the thread at its top. A verdict scrolls the
  // thread to your answer and turns the document to the evidence (at once
  // the first time, so a deep link lands there).
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on question/phase change only
  useEffect(() => {
    const thread = threadRef.current
    if (view.phase === 'feedback') {
      const mine = thread?.querySelector<HTMLElement>('[data-anchor="answer"]')
      // Just clear of the thread's 16 px edge fade.
      thread?.scrollTo?.({ top: mine ? Math.max(0, mine.offsetTop - 20) : 0 })
      const doc = docRef.current
      const n = evidencePara(view)
      const el = n ? doc?.querySelector<HTMLElement>(`[data-n="${n}"]`) : null
      if (doc && el) {
        const smooth = !firstTurn.current && !prefersReducedMotion()
        doc.scrollTo?.({
          top: Math.max(0, el.offsetTop - DOC_HEAD - 28),
          behavior: smooth ? 'smooth' : 'auto',
        })
      }
    } else thread?.scrollTo?.({ top: 0 })
    if (c.moved.current && c.live) turnRef.current?.focus({ preventScroll: true })
    c.moved.current = false
    firstTurn.current = false
  }, [view.index, view.phase])

  if (view.phase === 'done') {
    return (
      <div className="sa-drill" data-phase="done">
        <div className="sa-done-scroll">
          <div className="sa-col">
            <ReadingClosing c={c} ref={turnRef} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sa-drill">
      <header className="sa-strip">
        <ExitButton act={act} />
        <StripProgress view={view} clock={c.clock} />
      </header>
      <div className="sa-dbody">
        <DocPanel c={c} ref={docRef} />
        <section className="sa-talk" aria-label={`Samtal om fråga ${view.index + 1}`}>
          {/* The action bar follows the thread and sticks to the column's
           *  foot only once the thread runs longer than the column. */}
          <div className="sa-thread sa-thread--drill" ref={threadRef}>
            <Conversation c={c} turnRef={turnRef} Turn={QuestionTurn} />
            <Dock c={c} />
          </div>
        </section>
      </div>
    </div>
  )
}

function QuestionTurn({ view, ref }: { view: DrillCoreView; ref?: Ref<HTMLElement> }) {
  return (
    <Coach
      as="section"
      kind="sa-turn--q"
      aria-labelledby="sa-q"
      data-phase={view.phase}
      tabIndex={-1}
      ref={ref}
    >
      <p className="sa-turn-label">Fråga {view.index + 1}</p>
      <h2 className="sa-q" id="sa-q">
        <MathText>{view.question.prompt}</MathText>
      </h2>
    </Coach>
  )
}

// ── The document ─────────────────────────────────────────────────────

/** The quotations to light: every step's, and — after a wrong answer —
 *  the ones that say why the chosen option is wrong. */
function shownMarks(view: DrillCoreView): QuoteMark[] {
  if (view.phase !== 'feedback') return []
  return view.marks.filter(
    (m) => m.source.startsWith('step-') || (!view.correct && m.source === `why-${view.picked}`),
  )
}

/** The paragraphs the turn under the pointer cites. */
function pointedParas(view: DrillCoreView, active: string | null): ReadonlySet<number> {
  if (!active || view.phase !== 'feedback') return new Set()
  if (active.startsWith('step-')) return new Set(view.stepCites[Number(active.slice(5))] ?? [])
  const c = view.distractorCites[active.slice(4)]
  return new Set([...(c?.tempting ?? []), ...(c?.wrong ?? [])])
}

/** A paragraph's text with its marks, overlaps dropped (first wins). */
function marked(
  text: string,
  marks: QuoteMark[],
  view: DrillCoreView,
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
        className="sa-ev"
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

function DocPanel({
  c,
  phone = false,
  ref,
}: {
  c: ReadingChrome
  phone?: boolean
  ref?: Ref<HTMLElement>
}) {
  const { view, act, refs, note, setNote, focusOn, toggleFocus, active } = c
  const { paragraphs, byline } = view.passage ?? { paragraphs: [], byline: null }
  const meta = view.question.passage
  // A practice text carries the ÖVNINGSTEXT badge and its note; an
  // authentic passage has neither, and no title of its own.
  const synthetic = meta?.synthetic === true
  const [title, subtitle] = meta?.title
    ? splitTitle(meta.title)
    : [view.question.source.label, null]
  const { data } = useDirectionData()
  const graded = view.phase === 'feedback'
  const marks = shownMarks(view)
  const pointed = pointedParas(view, active)
  const lang = meta?.lang === 'en' ? 'en' : undefined
  return (
    <article className="sa-doc" ref={ref} aria-labelledby="sa-doc-title">
      <header className="sa-doc-head">
        <span className="sa-doc-tag">
          <span>{view.question.section}</span>
          {synthetic ? (
            <span className="sa-badge" data-testid="rd-badge">
              {data.copy.ovningstextBadge}
            </span>
          ) : null}
        </span>
        <span className="sa-doc-tools">
          {synthetic ? (
            <button
              type="button"
              className="sa-tool"
              data-testid="rd-note-toggle"
              aria-expanded={note}
              aria-controls="sa-note"
              onClick={() => setNote(!note)}
            >
              <Info size={15} strokeWidth={1.75} aria-hidden />
              Om texten
            </button>
          ) : null}
          {phone ? null : (
            <button
              type="button"
              className="sa-tool"
              aria-pressed={focusOn}
              onClick={toggleFocus}
              title="Styckefokus: F slår på, J och K byter stycke"
            >
              <Pilcrow size={15} strokeWidth={1.75} aria-hidden />
              Styckefokus
            </button>
          )}
        </span>
      </header>
      <div className="sa-doc-inner">
        {synthetic ? (
          <p className="sa-note" id="sa-note" hidden={!note} data-testid="rd-note">
            {data.copy.ovningstextNote}
          </p>
        ) : null}
        <h1 className="sa-doc-title" id="sa-doc-title" lang={lang}>
          {title}
          {subtitle ? <span>{subtitle}</span> : null}
        </h1>
        <div
          className="sa-pbody"
          data-focus={String(view.focusPara != null)}
          data-testid="rd-passage"
          lang={lang}
        >
          {paragraphs.map((p, i) => {
            const n = i + 1
            const own = marks.filter((m) => m.para === n)
            // A ¶ link whose part quotes this paragraph lights the
            // sentence; otherwise the whole paragraph takes the light.
            const sentence = own.some((m) => m.source === view.flashSource)
            return (
              <p
                key={n}
                ref={refs.para(n)}
                className="sa-para"
                data-testid={`rd-para-${n}`}
                data-n={n}
                data-cited={String(graded && view.cited.includes(n))}
                data-pointed={String(pointed.has(n))}
                data-flash={String(view.flashPara === n && !sentence)}
                data-focused={String(view.focusPara === n)}
              >
                {/* Out of the tab order: nine of these must not stand
                 *  between the reader and the replies; F, J and K drive the
                 *  same aid. */}
                <button
                  type="button"
                  className="sa-pnum"
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
          {byline ? <p className="sa-byline">{byline}</p> : null}
        </div>
      </div>
    </article>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneDrill(chrome: ReadingChrome) {
  // No pointing on touch (TrayDrill does the same for the thread).
  const c: ReadingChrome = { ...chrome, active: null, point: () => {} }
  const { view, act } = c
  const { hidden: compact, onScroll } = useHideOnScroll()
  const doneRef = useRef<HTMLElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: on the set's end only
  useEffect(() => {
    if (view.phase !== 'done') return
    if (c.moved.current && c.live) doneRef.current?.focus({ preventScroll: true })
    c.moved.current = false
  }, [view.phase])

  if (view.phase === 'done') {
    return (
      <div className="sa-pdrill" data-phase="done">
        <div className="sa-pdone">
          <ReadingClosing c={c} ref={doneRef} />
        </div>
      </div>
    )
  }

  const feedback = view.phase === 'feedback'
  const progress = ((view.index + (feedback ? 1 : 0)) / view.total) * 100
  return (
    <TrayDrill
      c={c}
      Turn={QuestionTurn}
      foldLabel="Visa texten"
      onDocScroll={onScroll}
      doc={<DocPanel c={c} phone />}
      head={
        <header className="sa-phead" data-compact={String(compact)}>
          <ExitButton act={act} icon />
          <span className="sa-phead-pos">
            Fråga {view.index + 1} av {view.total}
          </span>
          <span className="sa-phead-tools">
            <button
              type="button"
              className="sa-ghost sa-icon-ghost"
              aria-pressed={c.focusOn}
              aria-label="Styckefokus"
              onClick={c.toggleFocus}
            >
              <Pilcrow size={17} strokeWidth={1.75} aria-hidden />
            </button>
            {c.clock ? (
              <span className="sa-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
                <span aria-hidden>{fmtClock(view.elapsed)}</span>
              </span>
            ) : null}
          </span>
          <span className="sa-phead-line" aria-hidden>
            <i style={{ width: `${progress}%` }} />
          </span>
        </header>
      }
    />
  )
}
