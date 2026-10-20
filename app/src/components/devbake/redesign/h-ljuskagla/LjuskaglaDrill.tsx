import { ArrowRight, Check, ChevronDown, ChevronUp, LampDesk } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillController,
  type DrillStart,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import { type DirectionProps, useKeyMap, useSheet } from '@/components/devbake/redesign/r1Kit'
import type { DrillSessionView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { LjuskaglaFeedback } from './LjuskaglaFeedback'
import { DrillHead } from './LjuskaglaNav'
import { AnswerRows } from './LjuskaglaParts'

/**
 * The reading session on the bake-off's two round-1 screens. Läsfråga (2)
 * opens the session's question unanswered and Facit (3) opens it graded
 * with the session's wrong pick. Clicking Facit or Läsfråga in the switcher
 * mid-question grades or reopens the question in place, so an answer given
 * on 2 carries into 3 without a remount.
 */
function useSwitcherDrill(
  { screen, live }: Pick<DirectionProps, 'screen' | 'live'>,
  session: DrillSessionView,
  controller: DrillController,
) {
  const [start] = useState<DrillStart>(() => {
    const qid = session.questions[session.start.index ?? 0]?.qid
    return { ...session.start, graded: screen === 3 && qid ? session.wrongPick?.[qid] : undefined }
  })
  const core = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start,
    elapsed: session.elapsedSeconds,
    controller,
    live,
  })
  const { gradeAs, reopen, reset } = core.act
  const phase = core.view.phase
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the switcher's screen only
  useLayoutEffect(() => {
    if (screen === 3 && phase === 'question') gradeAs((q) => session.wrongPick?.[q.qid])
    else if (screen === 2 && phase === 'feedback') reopen()
    else if (screen === 2 && phase === 'done') reset()
  }, [screen])
  return core
}

/** "Magasinet i Hökaryd: en handbok …" → the title and its subtitle. */
function splitTitle(title: string | undefined): [string, string | null] | null {
  if (!title) return null
  const cut = title.indexOf(': ')
  return cut === -1 ? [title, null] : [title.slice(0, cut), title.slice(cut + 2)]
}

export function LjuskaglaDrill(props: DirectionProps) {
  const { data, actions } = useDirectionData()
  const session = data.drills.reading
  const { view, act, refs } = useSwitcherDrill(props, session, actions.drill)
  const sheet = useSheet(view)
  const [spotlight, setSpotlight] = useState(true)
  const [note, setNote] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLDivElement>(null)
  const scrollQuietUntil = useRef(0)
  const noteId = useId()
  const questionId = useId()
  const { onScreen } = props
  const phone = props.width === 'phone'
  const feedback = view.phase === 'feedback'
  const done = view.phase === 'done'
  const sheetVisible = !phone || sheet.state !== 'peek'
  const question = view.question
  const passage = question.passage ?? null
  const paragraphs = view.passage?.paragraphs ?? []
  const title = passage?.title ?? session.title
  const heading = splitTitle(passage?.title)
  const active = view.focusPara ?? 1
  const nextItem = data.home.plan.items.find((item) => !item.completed)
  const { setFocusPara, cite } = act

  // Start feedback at its evidence, but leave still thumbnails motionless.
  const firstEvidence = feedback ? (view.stepCites[2]?.[0] ?? view.cited[0] ?? 1) : 1
  useEffect(() => {
    if (!feedback) return
    setFocusPara(firstEvidence)
    if (props.live && !phone) {
      scrollQuietUntil.current = Date.now() + 500
      cite(firstEvidence)
    }
  }, [feedback, firstEvidence, setFocusPara, cite, props.live, phone])

  // A new question or verdict starts at the top of its own reading surface.
  // biome-ignore lint/correctness/useExhaustiveDependencies: index and phase reset the pane
  useEffect(() => {
    if (questionRef.current) questionRef.current.scrollTop = 0
  }, [view.index, view.phase])

  const lock = () => {
    if (act.lock()) onScreen(3)
  }
  const next = () => {
    if (act.next() === 'next') onScreen(2)
  }
  const point = (n: number, source?: string) => {
    scrollQuietUntil.current = Date.now() + 500
    setFocusPara(n)
    if (phone) sheet.setState('peek')
    cite(n, source)
    if (phone && props.live) {
      window.requestAnimationFrame(() => {
        scrollRef.current
          ?.querySelector<HTMLButtonElement>(`[data-paragraph="${n}"] button`)
          ?.focus({ preventScroll: true })
      })
    }
  }
  const move = (delta: number) => {
    if (!spotlight) return
    point(Math.max(1, Math.min(paragraphs.length, active + delta)))
  }
  const nextPlan = () => {
    if (nextItem) actions.openPlanItem(nextItem.id)
    else onScreen(1)
  }
  const advance = () => {
    if (done) nextPlan()
    else if (feedback) next()
    else if (phone && sheet.state === 'peek') sheet.setState('open')
    else lock()
  }
  const keys: Record<string, () => void> = {
    Enter: advance,
    ' ': advance,
  }
  if (spotlight && !done) {
    keys.j = () => move(1)
    keys.k = () => move(-1)
    keys.ArrowDown = () => move(1)
    keys.ArrowUp = () => move(-1)
  }
  if (!feedback && !done) {
    for (const letter of view.letters) {
      keys[letter.toLowerCase()] = () => {
        if (phone) sheet.setState('open')
        act.select(letter)
      }
      keys[`Shift+${letter.toLowerCase()}`] = () => act.toggleEliminate(letter)
    }
  }
  useKeyMap(keys, props.live && !accountOpen)

  const onPassageScroll = () => {
    const box = scrollRef.current
    if (!box || !props.live || !spotlight || Date.now() < scrollQuietUntil.current) return
    const rect = box.getBoundingClientRect()
    if (rect.height === 0) return
    const line = rect.top + rect.height * 0.28
    const nodes = [...box.querySelectorAll<HTMLElement>('[data-paragraph]')]
    const nearest = nodes.reduce<HTMLElement | null>((found, paragraph) => {
      const distance = (element: HTMLElement) => {
        const bounds = element.getBoundingClientRect()
        return line < bounds.top
          ? bounds.top - line
          : line > bounds.bottom
            ? line - bounds.bottom
            : 0
      }
      return !found || distance(paragraph) < distance(found) ? paragraph : found
    }, null)
    if (nearest) setFocusPara(Number(nearest.dataset.paragraph))
  }

  const sheetActions = { ...act, cite: point }
  return (
    <div className="lj-drill" data-spotlight={String(spotlight)}>
      <DrillHead
        section={question.section}
        position={done ? view.total : view.index + 1}
        total={view.total}
        elapsed={view.elapsed}
        progress={(view.index + (feedback || done ? 1 : 0)) / view.total}
        onExit={() => onScreen(1)}
        theme={props.theme}
        onTheme={props.onTheme}
        onAccountOpenChange={setAccountOpen}
      />
      {done ? (
        <div className="lj-done" data-testid="rd-done">
          <Check size={32} strokeWidth={1.5} aria-hidden />
          <p className="lj-eyebrow">Texten är färdigläst</p>
          <h1>En stund som räknas.</h1>
          <p>
            {view.results.filter((result) => result.correct).length} av {view.total} rätt ·{' '}
            {Math.round(view.elapsed / 60)} minuter
          </p>
          <p>{title}</p>
          {nextItem ? (
            <>
              <button
                className="lj-primary"
                type="button"
                data-testid="rd-done-next"
                onClick={nextPlan}
              >
                Nästa: {nextItem.title}
                <ArrowRight size={20} aria-hidden />
              </button>
              <button className="lj-text-button" type="button" onClick={() => onScreen(1)}>
                Till Idag
              </button>
            </>
          ) : (
            <button
              className="lj-primary"
              type="button"
              data-testid="rd-done-next"
              onClick={() => onScreen(1)}
            >
              Till Idag
              <ArrowRight size={20} aria-hidden />
            </button>
          )}
        </div>
      ) : (
        <div className="lj-reading-layout">
          <div className="lj-reading-column" inert={phone && sheet.state === 'full'}>
            <div className="lj-light-controls">
              <button
                type="button"
                data-testid="rd-spotlight-toggle"
                aria-pressed={spotlight}
                onClick={() => setSpotlight(!spotlight)}
              >
                <LampDesk size={19} strokeWidth={1.5} aria-hidden />
                <span>Styckeljus {spotlight ? 'på' : 'av'}</span>
                <i className="lj-switch" aria-hidden />
              </button>
              <span className="lj-key-hint">J / K · ↑ / ↓</span>
              <span className="lj-reading-position" aria-live="polite">
                ¶{active} / {paragraphs.length}
              </span>
            </div>
            <div
              className="lj-passage-scroll"
              data-testid="rd-passage-scroll"
              ref={scrollRef}
              onScroll={onPassageScroll}
            >
              <header className="lj-passage-title">
                {passage?.synthetic && (
                  <>
                    <div className="lj-disclosure">
                      <span className="lj-eyebrow" data-testid="rd-badge">
                        {data.copy.ovningstextBadge}
                      </span>
                      <button
                        type="button"
                        className="lj-text-button"
                        data-testid="rd-note-toggle"
                        aria-expanded={note}
                        aria-controls={noteId}
                        onClick={() => setNote(!note)}
                      >
                        Om texten <ChevronDown size={15} aria-hidden />
                      </button>
                    </div>
                    <p className="lj-note" id={noteId} data-testid="rd-note" hidden={!note}>
                      {data.copy.ovningstextNote}
                    </p>
                  </>
                )}
                {heading && <h1>{heading[0]}</h1>}
                {heading?.[1] && <p>{heading[1]}</p>}
              </header>
              <article className="lj-passage" data-testid="rd-passage" aria-label={title}>
                {paragraphs.map((text, index) => {
                  const n = index + 1
                  const lit = spotlight && active === n
                  return (
                    <div
                      key={n}
                      ref={refs.para(n)}
                      className="lj-paragraph"
                      data-testid={`rd-para-${n}`}
                      data-paragraph={n}
                      data-lit={String(lit)}
                      data-cited={String(view.flashPara === n)}
                    >
                      <button
                        type="button"
                        className="lj-para-number"
                        aria-label={`Lys upp stycke ${n}`}
                        aria-pressed={lit}
                        onClick={() => setFocusPara(n)}
                      >
                        {n}
                      </button>
                      {/* A paragraph remains readable/selectable prose. Its margin
                          button provides the same action for keyboard users. */}
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the adjacent native paragraph-number button provides this same action to keyboard users. */}
                      <p onClick={() => setFocusPara(n)}>{text}</p>
                    </div>
                  )
                })}
                {view.passage?.byline && <p className="lj-byline">{view.passage.byline}</p>}
              </article>
              <p className="lj-text-end">Slut på texten</p>
            </div>
          </div>
          <section
            className="lj-question"
            data-testid={phone ? 'rd-sheet' : 'rd-question'}
            data-state={phone ? sheet.state : 'open'}
            aria-label={feedback ? 'Facit och förklaring' : `Fråga ${view.index + 1}`}
          >
            {phone && (
              <button
                type="button"
                className="lj-sheet-handle"
                {...sheet.grab}
                aria-controls={questionId}
                aria-expanded={sheetVisible}
              >
                <span className="lj-grip" aria-hidden />
                <span>
                  {sheetVisible ? 'Visa texten' : feedback ? 'Tillbaka till facit' : 'Visa frågan'}
                  {sheetVisible ? (
                    <ChevronDown size={16} aria-hidden />
                  ) : (
                    <ChevronUp size={16} aria-hidden />
                  )}
                </span>
              </button>
            )}
            <div className="lj-question-scroll" id={questionId} ref={questionRef}>
              <p className="lj-eyebrow">
                Fråga {view.index + 1} av {view.total} · {question.section}
              </p>
              {sheetVisible ? (
                feedback ? (
                  <LjuskaglaFeedback view={view} act={sheetActions} refs={refs} />
                ) : (
                  <>
                    <h2 className="lj-prompt">
                      <MathText>{question.prompt}</MathText>
                    </h2>
                    <AnswerRows view={view} act={act} />
                  </>
                )
              ) : (
                <p className="lj-peek-prompt">
                  {feedback ? (
                    `Rätt svar: ${question.answer} · öppna förklaringen`
                  ) : (
                    <MathText>{question.prompt}</MathText>
                  )}
                </p>
              )}
            </div>
            {sheetVisible && (
              <footer className="lj-action-bar">
                <button
                  type="button"
                  className="lj-primary"
                  data-testid={feedback ? 'rd-next' : 'rd-lock'}
                  disabled={!feedback && !view.selected}
                  onClick={feedback ? next : lock}
                >
                  <span>
                    {feedback
                      ? 'Nästa'
                      : view.selected
                        ? `Svara ${view.selected}`
                        : 'Välj ett svar'}
                  </span>
                  {feedback ? <ArrowRight size={20} aria-hidden /> : <kbd aria-hidden>↵</kbd>}
                </button>
                {!phone && (
                  <p>
                    {feedback
                      ? 'Ta med dig tekniken till nästa fråga.'
                      : 'A–E välj · ⇧ + bokstav stryk · Enter svara'}
                  </p>
                )}
              </footer>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
