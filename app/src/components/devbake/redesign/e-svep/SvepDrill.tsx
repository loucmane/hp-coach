// Svep · Läsfråga and Facit — the drill as two cards on a LÄS-tinted
// table, the navigation hidden behind one always-visible "Avsluta".
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
  useEffect,
  useId,
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
  isForeignKey,
  prefersReducedMotion,
  type QuoteMark,
  type SheetState,
  splitStepRefs,
  useDrill,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import { type Deck, useDeck } from './deck'
import { type DeckCard, DeckCounter, DeckStage, DeckTicks, Kbd, QuestionCards } from './parts'

const [TITLE, SUBTITLE] = UNIT.title.split(': ')
/** The plan's next part, dealt when the text is done. */
const NEXT = PLAN.items[0]
const NEXT_DEST: Destination = NEXT?.kind === 'lektion' ? 'uppslag' : 'ova'
/** The card turn and the deal (svep.css --sv-d-turn), plus a frame. */
const TURN_MS = 260 + 60

type Sheet = ReturnType<typeof useSheet>

type RunId = 'svar' | 'lockade' | 'tamed' | 'losning' | 'andra'

type Run = { cards: (DeckCard & { id: RunId })[]; deck: Deck }

export function SvepDrill({
  screen,
  width,
  live,
  onScreen,
  onGo,
}: DirectionProps & { onGo: (d: Destination) => void }) {
  const { view, act, refs } = useDrill({ screen, onScreen, live })
  const phone = width === 'phone'
  const [note, setNote] = useState(false)
  const focusOn = view.focusPara != null
  const toggleFocus = () => act.setFocusPara(focusOn ? null : 1)
  const onNextPart = () => onGo(NEXT_DEST)
  const sheet = useSheet(view)

  // The run's cards and its deck. A ¶ link on phone folds the sheet so the
  // text shows; a "(steg 2)" link turns the run to the steps card.
  const plan = runPlan(view)
  const deck = useDeck(Math.max(1, plan.length), `${view.index}-${view.phase}`)
  const runAct: DrillActions = {
    ...act,
    cite: (n, source) => {
      if (phone) sheet.setState('peek')
      act.cite(n, source)
    },
    goToStep: (n) => {
      const at = plan.findIndex((p) => p.id === 'losning')
      if (at !== -1) deck.go(at)
      act.goToStep(n)
    },
  }
  const run: Run = {
    deck,
    cards: plan.map((p) => ({ ...p, body: runBody(p.id, view, runAct, refs, deck) })),
  }
  const motion = useCardMotion(view, live)

  const keys: Record<string, () => void> = {
    j: () => act.moveFocusPara(1),
    k: () => act.moveFocusPara(-1),
    f: toggleFocus,
    // Esc never leaves the drill: it only lets go of the paragraph focus.
    Escape: () => act.setFocusPara(null),
  }
  if (view.phase === 'question') {
    for (const o of view.question.options) {
      const l = o.letter.toLowerCase()
      keys[l] = () => {
        act.select(o.letter)
        if (phone) sheet.setState((s) => (s === 'peek' ? 'open' : s))
      }
      keys[`Shift+${l}`] = () => act.toggleEliminate(o.letter)
    }
    if (view.selected) keys.Enter = act.lock
  } else if (view.phase === 'feedback') {
    keys.Enter = act.next
    if (deck.index > 0) keys.ArrowLeft = deck.prev
    if (deck.index < deck.count - 1) keys.ArrowRight = deck.next
  } else {
    keys.Enter = onNextPart
  }
  useKeyMap(keys, live)
  useSpaceAdvance(live, () => {
    if (view.phase === 'question') {
      if (!view.selected) return false
      act.lock()
    } else if (view.phase === 'feedback') act.next()
    else onNextPart()
    return true
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
    onHome: () => onScreen(1),
    onNextPart,
  }
  return phone ? <PhoneDrill {...chrome} sheet={sheet} /> : <DeskDrill {...chrome} />
}

type Chrome = {
  view: DrillView
  act: DrillActions
  refs: DrillRefs
  run: Run
  motion: { turning: boolean; dealt: boolean }
  live: boolean
  note: boolean
  setNote: (open: boolean) => void
  focusOn: boolean
  toggleFocus: () => void
  onHome: () => void
  /** The end of the unit's way on: the plan's next part. */
  onNextPart: () => void
}

/**
 * Space advances like Enter (answers once a choice is made, then deals the
 * next question) — except inside the text or a facit card, where it keeps
 * its meaning and scrolls, and on a focused control, which it presses.
 */
function useSpaceAdvance(live: boolean, advance: () => boolean) {
  const ref = useRef(advance)
  ref.current = advance
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.defaultPrevented || isForeignKey(e) || e.shiftKey) return
      const t = e.target
      if (t instanceof Element) {
        if (t.closest('button, a[href], summary, [role="button"], .sv-pcard, .sv-dcard')) return
      }
      if (ref.current()) e.preventDefault()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live])
}

/**
 * The two card moves: the question card turning over to its verdict (on
 * the answer) and the next question being dealt (on Nästa). Neither runs
 * on a first mount, in a still thumbnail or when the switcher jumps.
 */
function useCardMotion(view: DrillView, live: boolean) {
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
function lessonFirst(view: DrillView, run: Run): boolean {
  return !view.correct && run.deck.index === 0 && run.cards[1]?.id === 'lockade'
}

/** The chosen distractor after a wrong answer. */
function minePick(view: DrillView): DistractorExplanation | null {
  if (view.correct) return null
  return view.explanation.distractors.find((d) => d.letter === view.picked) ?? null
}

/** A short run, in the shared order: the verdict and the right answer →
 *  why your pick tempted and why it is wrong → what to take away (pitfall,
 *  technique) → the solution and its steps → the other options. */
function runPlan(view: DrillView): { id: RunId; label: string }[] {
  if (view.phase !== 'feedback') return []
  const e = view.explanation
  const mine = minePick(view)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const plan: { id: RunId; label: string }[] = [{ id: 'svar', label: 'Utfallet' }]
  if (mine) plan.push({ id: 'lockade', label: `Därför lockade ${mine.letter}` })
  plan.push({ id: 'tamed', label: 'Att ta med dig' })
  plan.push({ id: 'losning', label: 'Lösningen' })
  if (others.length)
    plan.push({ id: 'andra', label: mine ? 'De andra alternativen' : 'Alternativen' })
  return plan
}

function runBody(
  id: RunId,
  view: DrillView,
  act: DrillActions,
  refs: DrillRefs,
  deck: Deck,
): ReactNode {
  const e = view.explanation
  const mine = minePick(view)
  switch (id) {
    case 'svar':
      return <VerdictCard view={view} deck={deck} />
    case 'lockade':
      return mine ? <LureCard view={view} d={mine} act={act} /> : null
    case 'tamed': {
      // The lesson: the pitfall first, then the technique — two short
      // halves of one idea, what to carry into the next question.
      const framework = e.framework_id ? FRAMEWORK_NAMES[e.framework_id] : undefined
      return (
        <div className="sv-rc sv-rc--center">
          <p className="sv-rc-eyebrow">Att ta med dig</p>
          {e.pitfall ? (
            <section className="sv-take" data-testid="rd-pitfall">
              <h3 className="sv-rc-title">Fallgropen</h3>
              <p className="sv-rc-text sv-rc-text--lead">{e.pitfall}</p>
            </section>
          ) : null}
          <section className="sv-take" data-testid="rd-technique">
            <h3 className="sv-rc-title">Tekniken</h3>
            <p className="sv-rc-text">{e.technique}</p>
            {framework ? (
              <p className="sv-rc-note">
                Frågetyp: <b>{framework}</b> – finns att slå upp i Uppslag.
              </p>
            ) : null}
          </section>
        </div>
      )
    }
    case 'losning':
      return (
        <div className="sv-rc sv-rc--steps">
          <p className="sv-rc-eyebrow">Hela vägen</p>
          <h3 className="sv-rc-title">Lösningen</h3>
          <p className="sv-rc-text sv-rc-text--lead">{e.solution_path}</p>
          <h4 className="sv-steps-head">Steg för steg</h4>
          <ol className="sv-steps">
            {(e.steps ?? []).map((s) => (
              <Step key={s.n} step={s} view={view} act={act} refs={refs} />
            ))}
          </ol>
        </div>
      )
    case 'andra': {
      const others = e.distractors.filter((d) => d.letter !== mine?.letter)
      const text = (l: string) => view.question.options.find((o) => o.letter === l)?.text ?? ''
      return (
        <div className="sv-rc">
          <p className="sv-rc-eyebrow">Sist</p>
          <h3 className="sv-rc-title">{mine ? 'De andra alternativen' : 'Alternativen'}</h3>
          <div className="sv-dis-list">
            {others.map((d) => (
              <Distractor
                key={d.letter}
                d={d}
                text={text(d.letter)}
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

/** The back of the question card, set like a card's face: the verdict in a
 *  glyph and a word (never colour alone), the right answer's letter as the
 *  card's large rank with its text in the text's own face, and your pick
 *  under one thin rule. After a miss the card's one action is the lesson:
 *  "Varför lockade A?" deals the next card of the run. */
function VerdictCard({ view, deck }: { view: DrillView; deck: Deck }) {
  const q = view.question
  const correct = view.correct === true
  const right = q.options.find((o) => o.letter === q.answer)
  const mine = correct ? null : q.options.find((o) => o.letter === view.picked)
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
              {right.text}
            </p>
          </div>
        </div>
      ) : null}
      {mine ? (
        <p className="sv-chose">
          <span className="sv-chose-label">Du valde {mine.letter}</span>
          {mine.text}
        </p>
      ) : null}
      {mine && deck.count > 1 ? (
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
  view: DrillView
  d: DistractorExplanation
  act: DrillActions
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
  view: DrillView
  act: DrillActions
  refs: DrillRefs
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
          {step.title}
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
  const bodyId = useId()
  return (
    <article className="sv-dis" data-testid={`rd-distractor-${d.letter}`} data-open={String(open)}>
      <div className="sv-dis-head">
        <span className="sv-opt-key" aria-hidden>
          {d.letter}
        </span>
        <p className="sv-dis-opt">
          <span className="sv-sr">Alternativ {d.letter}: </span>
          {text}
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
 *  the part quotes. */
function Cites({ list, source, act }: { list: number[]; source: string; act: DrillActions }) {
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

/** Explanation text, verbatim, with its "(steg 2)" references made links
 *  to the step. */
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
function leaningOn(id: RunId | undefined, view: DrillView): (source: string) => boolean {
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
function evidenceFor(id: RunId | undefined, view: DrillView): number | undefined {
  if (id === 'lockade') {
    const c = view.distractorCites[view.picked ?? '']
    return c?.wrong[0] ?? c?.tempting[0]
  }
  if (id === 'svar' || id === 'losning') {
    for (const s of view.explanation.steps ?? []) {
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
  view: DrillView,
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
  note,
  setNote,
  focusOn,
  toggleFocus,
  front,
  phone,
  inert,
  scrollRef,
}: {
  view: DrillView
  act: DrillActions
  refs: DrillRefs
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
  const { paragraphs, byline } = view.passage
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
          <span className="sv-sec" data-sec="las">
            LÄS
          </span>
          <span className="sv-badge" data-testid="rd-badge">
            {OVNINGSTEXT_BADGE}
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
        <p className="sv-note" id={noteId} hidden={!note} data-testid="rd-note">
          {OVNINGSTEXT_NOTE}
        </p>
        <h1 className="sv-ptitle" id={titleId}>
          {TITLE}
          <span>{SUBTITLE}</span>
        </h1>
        <div
          className="sv-pbody"
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

function Options({ view, act, still }: { view: DrillView; act: DrillActions; still: boolean }) {
  return (
    <ol className="sv-opts" aria-label="Svarsalternativ">
      {view.question.options.map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="sv-opt"
            data-state={selected ? 'selected' : out ? 'out' : undefined}
          >
            <button
              type="button"
              className="sv-opt-main"
              data-testid={still ? undefined : `rd-option-${o.letter}`}
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
                {o.text}
              </span>
            </button>
            <button
              type="button"
              className="sv-opt-x"
              data-testid={still ? undefined : `rd-eliminate-${o.letter}`}
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

function LockBar({ view, act, still }: { view: DrillView; act: DrillActions; still: boolean }) {
  return (
    <div className="sv-lockbar">
      <button
        type="button"
        className="sv-btn sv-btn--primary sv-btn--wide"
        disabled={!view.selected}
        onClick={still ? undefined : act.lock}
        data-testid={still ? undefined : 'rd-lock'}
        tabIndex={still ? -1 : undefined}
      >
        {view.selected ? `Svara ${view.selected}` : 'Svara'}
        <Kbd>↵</Kbd>
      </button>
      <span className="sv-echo" aria-live={still ? undefined : 'polite'}>
        {view.selected ? 'Du kan ändra dig tills du svarar.' : 'Välj ett alternativ först.'}
      </span>
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
  view: DrillView
  act: DrillActions
  still: boolean
}) {
  return (
    <div className="sv-card sv-qcard">
      <div className="sv-qcard-scroll">
        <p className="sv-qlabel">
          Fråga {view.index + 1} <span>av {view.total}</span>
        </p>
        <h2 className="sv-prompt">{view.question.prompt}</h2>
        <Options view={view} act={act} still={still} />
      </div>
      <LockBar view={view} act={act} still={still} />
    </div>
  )
}

/** The card's two faces. While it turns, both are there: the question
 *  turns away and the verdict turns in. At rest only one face exists, so
 *  no 3D transform is left on the text. */
function Faces({
  feedback,
  motion,
  front,
  back,
}: {
  feedback: boolean
  motion: { turning: boolean; dealt: boolean }
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

function Timer({ seconds }: { seconds: number }) {
  return (
    <span className="sv-timer" role="timer" aria-label={`Tid ${fmtClock(seconds)}`}>
      <Clock size={15} strokeWidth={2} aria-hidden />
      <span aria-hidden>{fmtClock(seconds)}</span>
    </span>
  )
}

function ExitButton({ act }: { act: DrillActions }) {
  return (
    <button
      type="button"
      className="sv-exit"
      onClick={act.exit}
      title="Dina svar är sparade"
      data-testid="rd-exit"
    >
      <X size={18} strokeWidth={2} aria-hidden />
      Avsluta
    </button>
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
          <ExitButton act={act} />
        </div>
        <div className="sv-done-wrap">
          <DoneCard view={view} live={live} onHome={c.onHome} onNext={c.onNextPart} />
        </div>
      </div>
    )
  }

  const last = view.index + 1 >= view.total
  // The waiting questions' edges stay while the card turns over.
  const waiting = feedback && !motion.turning ? 0 : Math.min(2, view.total - view.index - 1)
  return (
    <div className="sv-drill">
      <div className="sv-drill-top">
        <ExitButton act={act} />
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
          note={c.note}
          setNote={c.setNote}
          focusOn={c.focusOn}
          toggleFocus={c.toggleFocus}
          front={front}
          phone={false}
          scrollRef={scrollRef}
        />
        <section className="sv-qcol" aria-label={feedback ? 'Facit' : `Fråga ${view.index + 1}`}>
          <div className="sv-qslot" data-waiting={waiting}>
            {Array.from({ length: waiting }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the waiting questions' edges
              <span key={i} className="sv-qedge" data-n={i + 1} aria-hidden />
            ))}
            <Faces
              feedback={feedback}
              motion={motion}
              front={(still) => <QuestionFace view={view} act={act} still={still} />}
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
                {/* "Slutför", not "Avsluta": Avsluta is the way out mid-text.
                 *  Quiet while a miss's verdict card is in front: there the
                 *  lesson is the card's own action. */}
                <button
                  type="button"
                  className={`sv-btn ${lessonFirst(view, run) ? 'sv-btn--quiet' : 'sv-btn--primary'}`}
                  onClick={act.next}
                  data-testid="rd-next"
                >
                  {last ? 'Slutför texten' : 'Nästa fråga'}
                  <Kbd>↵</Kbd>
                </button>
              </>
            ) : (
              <p className="sv-keys">
                <span>
                  <Kbd>A</Kbd>–<Kbd>D</Kbd> väljer
                </span>
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
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneDrill(c: Chrome & { sheet: Sheet }) {
  const { view, act, refs, run, motion, live, sheet } = c
  const state: SheetState = sheet.state
  const feedback = view.phase === 'feedback'
  const front = feedback ? run.cards[run.deck.index]?.id : undefined

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
          <ExitButton act={act} />
        </header>
        <div className="sv-done-wrap">
          <DoneCard view={view} live={live} onHome={c.onHome} onNext={c.onNextPart} />
        </div>
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
        <ExitButton act={act} />
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
        <Timer seconds={view.elapsed} />
      </header>
      <div className="sv-pdbody">
        <PassageCard
          view={view}
          act={act}
          refs={refs}
          note={c.note}
          setNote={c.setNote}
          focusOn={c.focusOn}
          toggleFocus={c.toggleFocus}
          front={front}
          phone
          inert={up}
        />
        {up ? (
          // A tap on the text behind puts the card back down (the labelled
          // "Till texten" does the same from the keyboard).
          <button
            type="button"
            className="sv-pdscrim"
            tabIndex={-1}
            aria-label="Till texten"
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
            aria-label={up ? 'Till texten' : feedback ? 'Tillbaka till facit' : 'Till frågan'}
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
              />
            )}
          />
        </section>
      </div>
    </div>
  )
}

function PhoneQuestion({
  view,
  act,
  still,
  state,
  setState,
  peekRef,
}: {
  view: DrillView
  act: DrillActions
  still: boolean
  state: SheetState
  setState: Sheet['setState']
  peekRef?: { current: HTMLDivElement | null }
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
              Till texten
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
        <h2 className="sv-prompt">{view.question.prompt}</h2>
      </div>
      <div className="sv-qs-rest" inert={!up}>
        <Options view={view} act={act} still={still} />
        <LockBar view={view} act={act} still={still} />
      </div>
    </div>
  )
}

function PhoneFacit({
  view,
  act,
  run,
  live,
  state,
  setState,
  peekRef,
}: {
  view: DrillView
  act: DrillActions
  run: Run
  live: boolean
  state: SheetState
  setState: Sheet['setState']
  peekRef: { current: HTMLDivElement | null }
}) {
  const up = state !== 'peek'
  const last = view.index + 1 >= view.total
  const correct = view.correct === true
  // Down to the text at the evidence the card in front leans on, marked for
  // a moment — never back at ¶1.
  const toText = () => {
    setState('peek')
    const n = evidenceFor(run.cards[run.deck.index]?.id, view) ?? view.cited[0]
    if (n) act.cite(n)
  }
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
          {up ? (
            <button type="button" className="sv-link" onClick={toText}>
              Till texten
              <ChevronDown size={16} strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              className="sv-chip sv-chip--raise"
              aria-expanded={false}
              onClick={() => setState('full')}
            >
              Till facit
              <ArrowUp size={16} strokeWidth={2} aria-hidden />
            </button>
          )}
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
          {last ? 'Slutför texten' : 'Nästa fråga'}
          <Kbd>↵</Kbd>
        </button>
      </div>
    </div>
  )
}

// ── The end of the unit: the hand turned face up ─────────────────────

function DoneCard({
  view,
  live,
  onHome,
  onNext,
}: {
  view: DrillView
  live: boolean
  onHome: () => void
  onNext: () => void
}) {
  const titleId = useId()
  const right = view.results.filter((r) => r.correct).length
  const misses = view.total - right
  const minutes = Math.max(1, Math.round(view.elapsed / 60))
  return (
    <section
      className="sv-card sv-done"
      data-testid="rd-done"
      data-live={String(live)}
      aria-labelledby={titleId}
    >
      <p className="sv-rc-eyebrow">LÄS · klart</p>
      <h2 className="sv-done-title" id={titleId}>
        Hela leken är vänd.
      </h2>
      <p className="sv-done-sub">
        {/* A number never parts from its unit. */}
        {TITLE} · {`${view.total} frågor`} · {`${right} rätt`} · {`${minutes} min`}
      </p>
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
        {NEXT ? (
          <button
            type="button"
            className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
            onClick={onNext}
            data-testid="rd-done-next"
          >
            Nästa kort: {NEXT.title} · {NEXT.minutes} min
            <Kbd>↵</Kbd>
          </button>
        ) : null}
        <button type="button" className="sv-link sv-link--center" onClick={onHome}>
          Till Idag
        </button>
      </div>
    </section>
  )
}
