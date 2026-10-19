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

import { ChevronDown, ChevronUp, CircleSlash, Clock, Info, Pilcrow, Undo2, X } from 'lucide-react'
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react'

import {
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
  prefersReducedMotion,
  type QuoteMark,
  useDrill,
  useHideOnScroll,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import {
  Closing,
  Explanation,
  type Folds,
  type Pointing,
  Verdict,
  YourAnswer,
} from './SamtalFeedback'
import { Coach, Dots, Kbd, Replies } from './SamtalParts'

const [TITLE, SUBTITLE] = UNIT.title.split(': ')
/** The plan's next part, offered when the text is done. */
const NEXT = PLAN.items[0]
const NEXT_DEST: Destination = NEXT?.kind === 'lektion' ? 'uppslag' : 'ova'
/** The document head's height (samtal.css .sa-doc-head). */
const DOC_HEAD = 56

type Chrome = {
  view: DrillView
  act: DrillActions
  refs: DrillRefs
  live: boolean
  note: boolean
  setNote: (open: boolean) => void
  focusOn: boolean
  toggleFocus: () => void
  onHome: () => void
  /** The end of the unit's way on: the plan's next part. */
  onNext: () => void
  folds: Folds
  /** Set by an in-drill answer or "Nästa", so focus follows to the new
   *  turn — never when the switcher changes the screen. */
  moved: { current: boolean }
} & Pointing

export function SamtalDrill({
  screen,
  width,
  live,
  onScreen,
  onGo,
}: DirectionProps & { onGo: (d: Destination) => void }) {
  const { view, act, refs } = useDrill({ screen, onScreen, live })
  const [note, setNote] = useState(false)
  const [active, point] = useState<string | null>(null)
  const [others, setOthers] = useState<ReadonlySet<string>>(() => new Set())
  // A new question starts with its folds closed and nothing pointed at.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new question only
  useEffect(() => {
    setOthers(new Set())
    point(null)
  }, [view.index])

  const focusOn = view.focusPara != null
  const toggleFocus = () => act.setFocusPara(focusOn ? null : 1)
  const onNext = () => onGo(NEXT_DEST)

  const moved = useRef(false)
  const lock = () => {
    moved.current = true
    act.lock()
  }
  const next = () => {
    moved.current = true
    act.next()
  }

  // "Visa allt": the detail steps and the other options, all at once.
  const detail = (view.explanation.steps ?? []).filter((s) => s.tier === 'detail').map((s) => s.n)
  const letters = view.explanation.distractors
    .filter((d) => !(view.correct === false && d.letter === view.picked))
    .map((d) => d.letter)
  const allOpen = detail.every((n) => view.openSteps.has(n)) && letters.every((l) => others.has(l))
  const folds: Folds = {
    others,
    allOpen,
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

  const advance = () => {
    if (view.phase === 'question') lock()
    else if (view.phase === 'feedback') next()
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
  for (const o of view.question.options) {
    const l = o.letter.toLowerCase()
    keys[l] = () => act.select(o.letter)
    keys[`Shift+${l}`] = () => act.toggleEliminate(o.letter)
  }
  useKeyMap(keys, live)

  const chrome: Chrome = {
    view,
    act: { ...act, lock, next },
    refs,
    live,
    note,
    setNote,
    focusOn,
    toggleFocus,
    onHome: () => onScreen(1),
    onNext,
    folds,
    moved,
    active,
    point,
  }
  return width === 'phone' ? <PhoneDrill {...chrome} /> : <DeskDrill {...chrome} />
}

// ── Desktop ──────────────────────────────────────────────────────────

/** The first paragraph the essential steps cite — where the evidence is. */
function evidencePara(view: DrillView): number | undefined {
  for (const s of view.explanation.steps ?? []) {
    const cites = view.stepCites[s.n]
    if (s.tier !== 'detail' && cites?.length) return cites[0]
  }
  return view.cited[0]
}

function DeskDrill(c: Chrome) {
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
            <Closing view={view} onHome={c.onHome} onNext={c.onNext} ref={turnRef} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sa-drill">
      <header className="sa-strip">
        <ExitButton act={act} />
        <div className="sa-progress">
          <Dots total={view.total} done={view.index} />
          <span className="sa-progress-text">
            Fråga {view.index + 1} av {view.total}
          </span>
          <span className="sa-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
            <Clock size={15} strokeWidth={1.75} aria-hidden />
            <span aria-hidden>{fmtClock(view.elapsed)}</span>
          </span>
        </div>
      </header>
      <div className="sa-dbody">
        <DocPanel c={c} ref={docRef} />
        <section className="sa-talk" aria-label={`Samtal om fråga ${view.index + 1}`}>
          {/* The action bar follows the thread and sticks to the column's
           *  foot only once the thread runs longer than the column. */}
          <div className="sa-thread sa-thread--drill" ref={threadRef}>
            <Conversation c={c} turnRef={turnRef} />
            <Dock c={c} />
          </div>
        </section>
      </div>
    </div>
  )
}

function ExitButton({ act, icon = false }: { act: DrillActions; icon?: boolean }) {
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

/** The thread: the coach's question, then either your reply buttons or
 *  your answer and the coach's answer to it. */
function Conversation({ c, turnRef }: { c: Chrome; turnRef: Ref<HTMLElement> }) {
  const { view, act } = c
  if (view.phase === 'question') {
    return (
      <>
        <QuestionTurn view={view} ref={turnRef} />
        <Options view={view} act={act} />
      </>
    )
  }
  return (
    <>
      <QuestionTurn view={view} />
      <YourAnswer view={view} />
      <Verdict view={view} ref={turnRef} />
      <Explanation
        view={view}
        act={act}
        refs={c.refs}
        active={c.active}
        point={c.point}
        folds={c.folds}
      />
    </>
  )
}

function QuestionTurn({ view, ref }: { view: DrillView; ref?: Ref<HTMLElement> }) {
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
        {view.question.prompt}
      </h2>
    </Coach>
  )
}

/** The options as replies in your lane, each with its strike control
 *  inside the card. Chosen, an option takes your turn's tint and corner. */
function Options({ view, act }: { view: DrillView; act: DrillActions }) {
  return (
    <ol className="sa-opts" aria-label="Svarsalternativ">
      {view.question.options.map((o) => {
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
              data-testid={`rd-option-${o.letter}`}
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
                {o.text}
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
 *  type into. Before the answer it names your choice (or the keys); after
 *  it, it holds "Visa allt" and the one way on. */
function Dock({ c, phone = false }: { c: Chrome; phone?: boolean }) {
  const { view, act, folds } = c
  if (view.phase === 'question') {
    return (
      <div className="sa-dock">
        <p className="sa-dock-status" aria-live="polite">
          {view.selected ? (
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
              <Kbd>A</Kbd>–<Kbd>D</Kbd> väljer · <Kbd>⇧</Kbd>+bokstav stryker · <Kbd>F</Kbd>{' '}
              styckefokus
            </span>
          )}
        </p>
        <button
          type="button"
          className="sa-send"
          disabled={!view.selected}
          onClick={act.lock}
          data-testid="rd-lock"
        >
          Svara
          <Kbd>↵</Kbd>
        </button>
      </div>
    )
  }
  const last = view.index + 1 >= view.total
  return (
    <div className="sa-dock">
      <button
        type="button"
        className="sa-chip sa-chip--quiet"
        aria-expanded={folds.allOpen}
        onClick={folds.showAll}
      >
        {folds.allOpen ? 'Visa mindre' : 'Visa allt'}
      </button>
      {/* "Slutför", not "Avsluta": Avsluta is the way out mid-text. */}
      <button type="button" className="sa-send" onClick={act.next} data-testid="rd-next">
        {last ? 'Slutför texten' : 'Nästa fråga'}
        <Kbd>↵</Kbd>
      </button>
    </div>
  )
}

// ── The document ─────────────────────────────────────────────────────

/** The quotations to light: every step's, and — after a wrong answer —
 *  the ones that say why the chosen option is wrong. */
function shownMarks(view: DrillView): QuoteMark[] {
  if (view.phase !== 'feedback') return []
  return view.marks.filter(
    (m) => m.source.startsWith('step-') || (!view.correct && m.source === `why-${view.picked}`),
  )
}

/** The paragraphs the turn under the pointer cites. */
function pointedParas(view: DrillView, active: string | null): ReadonlySet<number> {
  if (!active || view.phase !== 'feedback') return new Set()
  if (active.startsWith('step-')) return new Set(view.stepCites[Number(active.slice(5))] ?? [])
  const c = view.distractorCites[active.slice(4)]
  return new Set([...(c?.tempting ?? []), ...(c?.wrong ?? [])])
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
  c: Chrome
  phone?: boolean
  ref?: Ref<HTMLElement>
}) {
  const { view, act, refs, note, setNote, focusOn, toggleFocus, active } = c
  const { paragraphs, byline } = view.passage
  const graded = view.phase === 'feedback'
  const marks = shownMarks(view)
  const pointed = pointedParas(view, active)
  return (
    <article className="sa-doc" ref={ref} aria-labelledby="sa-doc-title">
      <header className="sa-doc-head">
        <span className="sa-doc-tag">
          <span>LÄS</span>
          <span className="sa-badge" data-testid="rd-badge">
            {OVNINGSTEXT_BADGE}
          </span>
        </span>
        <span className="sa-doc-tools">
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
        <p className="sa-note" id="sa-note" hidden={!note} data-testid="rd-note">
          {OVNINGSTEXT_NOTE}
        </p>
        <h1 className="sa-doc-title" id="sa-doc-title">
          {TITLE}
          <span>{SUBTITLE}</span>
        </h1>
        <div
          className="sa-pbody"
          data-focus={String(view.focusPara != null)}
          data-testid="rd-passage"
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

function PhoneDrill(chrome: Chrome) {
  // Touch has no hover: a tapped link would leave its turn "pointed at"
  // once the tray folds, so the phone does without pointing.
  const c: Chrome = { ...chrome, active: null, point: () => {} }
  const { view, act } = c
  const { state: tray, setState: setTray, toggle, grab } = useSheet(view)
  const { hidden: compact, onScroll } = useHideOnScroll()
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
  const trayChrome: Chrome = {
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

  // Back from the peek, focus returns to the ¶ link (or "Visa texten") the
  // reader left from, without scrolling Facit away from where it was.
  useEffect(() => {
    if (tray === 'peek' || !leftFrom.current) return
    leftFrom.current.focus({ preventScroll: true })
    leftFrom.current = null
  }, [tray])

  if (view.phase === 'done') {
    return (
      <div className="sa-pdrill" data-phase="done">
        <div className="sa-pdone">
          <Closing view={view} onHome={c.onHome} onNext={c.onNext} ref={turnRef} />
        </div>
      </div>
    )
  }

  const progress = ((view.index + (feedback ? 1 : 0)) / view.total) * 100
  return (
    <div className="sa-pdrill">
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
          <span className="sa-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
            <span aria-hidden>{fmtClock(view.elapsed)}</span>
          </span>
        </span>
        <span className="sa-phead-line" aria-hidden>
          <i style={{ width: `${progress}%` }} />
        </span>
      </header>
      {/* Under the full tray the passage is out of reach: inert, so focus
       *  never lands on something covered. */}
      <div className="sa-pdoc" onScroll={onScroll} inert={tray === 'full'}>
        <DocPanel c={c} phone />
        {/* Room for the last lines above the peek, the same whatever the
         *  tray does: a shorter range would pull a reader at the end of the
         *  text upward when it opens. */}
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
          aria-label={tray === 'peek' ? 'Visa frågan' : 'Visa texten'}
          aria-expanded={tray !== 'peek'}
          {...grab}
        />
        {peek ? (
          <div className="sa-tray-peek">
            {feedback ? <Verdict view={view} compact /> : <QuestionTurn view={view} />}
            <Replies>
              <button type="button" className="sa-chip sa-chip--primary" onClick={toggle}>
                {feedback ? 'Tillbaka till förklaringen' : 'Välj ett svar'}
                <ChevronUp size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </Replies>
          </div>
        ) : null}
        {/* Facit stays mounted while the tray peeks, hidden and inert behind
         *  the peek, so the way back finds it as the reader left it: the
         *  reply to the coach, the open folds, the place in the text. A
         *  question holds nothing of the reader's (the choice lives in the
         *  drill), so its peek lets it go. */}
        {peek && !feedback ? null : (
          <div className="sa-tray-main" ref={mainRef} inert={peek}>
            <div className="sa-tray-head">
              <span className="sa-tray-title">{feedback ? 'Facit' : null}</span>
              <button type="button" className="sa-quiet" onClick={fold}>
                Visa texten
                <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <div className="sa-tray-body" ref={bodyRef}>
              <div className="sa-thread">
                <Conversation c={trayChrome} turnRef={turnRef} />
              </div>
            </div>
            <Dock c={trayChrome} phone />
          </div>
        )}
      </section>
    </div>
  )
}
