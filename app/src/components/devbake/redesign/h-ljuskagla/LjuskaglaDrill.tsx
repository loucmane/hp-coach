import { ArrowRight, Check, ChevronDown, ChevronUp, LampDesk } from 'lucide-react'
import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillController,
  type DrillCoreActions,
  type DrillCoreRefs,
  type DrillCoreView,
  type DrillStart,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import { type DirectionProps, useKeyMap, useSheet } from '@/components/devbake/redesign/r1Kit'
import type { DrillSessionView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { LjuskaglaFeedback } from './LjuskaglaFeedback'
import { DrillHead } from './LjuskaglaNav'
import { AnswerRows, minutesSpent, PassageParagraphs, type ReadingLight } from './LjuskaglaParts'

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

type Finish = { label: string; run: () => void }

type WorkspaceProps = Pick<DirectionProps, 'width' | 'theme' | 'onTheme' | 'live'> & {
  session: DrillSessionView
  core: { view: DrillCoreView; act: DrillCoreActions; refs: DrillCoreRefs }
  light: ReadingLight
  /** The contract's passage id: LÄS rd-passage, ELF rd-elf-passage. */
  passageTestId: 'rd-passage' | 'rd-elf-passage'
  /** Seconds on the clock, or null to leave the clock out. */
  elapsed: number | null
  onLock: () => void
  onNext: () => void
  onExit: () => void
  /** The receipt's one filled action, and a quiet second way on. */
  finish: { primary: Finish; quiet?: Finish }
}

/**
 * The reading room for a passage question, LÄS or ELF: the text on its
 * opaque paper with the warm paragraph light, the question on its own
 * quiet surface beside it (on a phone: a sheet that peeks, opens and goes
 * full). Select, then confirm; the feedback starts at its evidence. An
 * English text, its title, the question, the options and the explanation
 * carry lang="en" on their own elements; the room's controls, headings and
 * labels stay Swedish around them. A question without its text or its
 * options cannot be read here, and says so.
 */
function ReadingWorkspace({
  width,
  theme,
  onTheme,
  live,
  session,
  core: { view, act, refs },
  light: { spotlight, onSpotlight },
  passageTestId,
  elapsed,
  onLock,
  onNext,
  onExit,
  finish,
}: WorkspaceProps) {
  const { data, actions } = useDirectionData()
  const sheet = useSheet(view)
  const [note, setNote] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLDivElement>(null)
  const scrollQuietUntil = useRef(0)
  const noteId = useId()
  const questionId = useId()
  const phone = width === 'phone'
  const feedback = view.phase === 'feedback'
  const done = view.phase === 'done'
  const sheetVisible = !phone || sheet.state !== 'peek'
  const question = view.question
  const passage = question.passage ?? null
  const paragraphs = view.passage?.paragraphs ?? []
  const title = passage?.title ?? session.title
  const heading = splitTitle(passage?.title)
  const active = view.focusPara ?? 1
  const english = passage?.lang === 'en' || question.section === 'ELF'
  const textLang = english ? ('en' as const) : undefined
  const readable = paragraphs.length > 0 && (question.options?.length ?? 0) > 0
  const { setFocusPara, cite } = act

  // Start feedback at its evidence, but leave still thumbnails motionless.
  const firstEvidence = feedback ? (view.stepCites[2]?.[0] ?? view.cited[0] ?? 1) : 1
  useEffect(() => {
    if (!feedback) return
    setFocusPara(firstEvidence)
    if (live && !phone) {
      scrollQuietUntil.current = Date.now() + 500
      cite(firstEvidence)
    }
  }, [feedback, firstEvidence, setFocusPara, cite, live, phone])

  // A new question or verdict starts at the top of its own reading surface.
  // biome-ignore lint/correctness/useExhaustiveDependencies: index and phase reset the pane
  useEffect(() => {
    if (questionRef.current) questionRef.current.scrollTop = 0
  }, [view.index, view.phase])

  const point = (n: number, source?: string) => {
    scrollQuietUntil.current = Date.now() + 500
    setFocusPara(n)
    if (phone) sheet.setState('peek')
    cite(n, source)
    if (phone && live) {
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
  const advance = () => {
    if (done) finish.primary.run()
    else if (!readable) return
    else if (feedback) onNext()
    else if (phone && sheet.state === 'peek') sheet.setState('open')
    else onLock()
  }
  const keys: Record<string, () => void> = {
    Enter: advance,
    ' ': advance,
  }
  if (spotlight && !done && readable) {
    keys.j = () => move(1)
    keys.k = () => move(-1)
    keys.ArrowDown = () => move(1)
    keys.ArrowUp = () => move(-1)
  }
  if (!feedback && !done && readable) {
    for (const letter of view.letters) {
      keys[letter.toLowerCase()] = () => {
        if (phone) sheet.setState('open')
        act.select(letter)
      }
      keys[`Shift+${letter.toLowerCase()}`] = () => act.toggleEliminate(letter)
    }
  }
  useKeyMap(keys, live && !accountOpen)

  const onPassageScroll = () => {
    const box = scrollRef.current
    if (!box || !live || !spotlight || Date.now() < scrollQuietUntil.current) return
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
  let body: ReactNode
  if (done) {
    body = (
      <div className="lj-done" data-testid="rd-done">
        <Check size={32} strokeWidth={1.5} aria-hidden />
        <p className="lj-eyebrow">Texten är färdigläst</p>
        <h1>En stund som räknas.</h1>
        <p>
          {view.results.filter((result) => result.correct).length} av {view.total} rätt ·{' '}
          {minutesSpent(view.elapsed)}
        </p>
        <p lang={textLang}>{title}</p>
        <button
          className="lj-primary"
          type="button"
          data-testid="rd-done-next"
          onClick={finish.primary.run}
        >
          {finish.primary.label}
          <ArrowRight size={20} aria-hidden />
        </button>
        {finish.quiet && (
          <button className="lj-text-button" type="button" onClick={finish.quiet.run}>
            {finish.quiet.label}
          </button>
        )}
      </div>
    )
  } else if (!readable) {
    body = (
      <div className="lj-done lj-unavailable-text" role="status">
        <p className="lj-eyebrow">
          Fråga {view.index + 1} av {view.total} · {question.section}
        </p>
        <h1>Texten går inte att läsa här.</h1>
        <p>
          {paragraphs.length === 0
            ? 'Frågan saknar sin text, så den kan inte besvaras.'
            : 'Frågan saknar sina svarsalternativ, så den kan inte besvaras.'}
        </p>
        <button className="lj-primary" type="button" onClick={() => actions.go('ova')}>
          Till Öva
          <ArrowRight size={20} aria-hidden />
        </button>
      </div>
    )
  } else {
    body = (
      <div className="lj-reading-layout">
        <div className="lj-reading-column" inert={phone && sheet.state === 'full'}>
          <div className="lj-light-controls">
            <button
              type="button"
              data-testid="rd-spotlight-toggle"
              aria-pressed={spotlight}
              onClick={() => onSpotlight(!spotlight)}
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
              {heading && <h1 lang={textLang}>{heading[0]}</h1>}
              {heading?.[1] && <p lang={textLang}>{heading[1]}</p>}
            </header>
            <article
              className="lj-passage"
              data-testid={passageTestId}
              aria-label={title}
              lang={textLang}
            >
              <PassageParagraphs
                paragraphs={paragraphs}
                byline={view.passage?.byline}
                lit={(n) => spotlight && active === n}
                cited={(n) => view.flashPara === n}
                onLight={setFocusPara}
                paraRef={refs.para}
                ids
              />
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
                <LjuskaglaFeedback view={view} act={sheetActions} refs={refs} lang={textLang} />
              ) : (
                <>
                  <h2 className="lj-prompt" lang={textLang}>
                    <MathText>{question.prompt}</MathText>
                  </h2>
                  <AnswerRows view={view} act={act} textLang={textLang} />
                </>
              )
            ) : (
              <p className="lj-peek-prompt">
                {feedback ? (
                  `Rätt svar: ${question.answer} · öppna förklaringen`
                ) : (
                  <span lang={textLang}>
                    <MathText>{question.prompt}</MathText>
                  </span>
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
                onClick={feedback ? onNext : onLock}
              >
                <span>
                  {feedback ? 'Nästa' : view.selected ? `Svara ${view.selected}` : 'Välj ett svar'}
                </span>
                {feedback ? <ArrowRight size={20} aria-hidden /> : <kbd aria-hidden>↵</kbd>}
              </button>
              {!phone && (
                <p>
                  {feedback
                    ? 'Ta med dig tekniken till nästa fråga.'
                    : `${view.letters[0] ?? 'A'}–${view.letters[view.letters.length - 1] ?? 'D'} välj · ⇧ + bokstav stryk · Enter svara`}
                </p>
              )}
            </footer>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="lj-drill" data-spotlight={String(spotlight)}>
      <DrillHead
        section={question.section}
        position={done ? view.total : view.index + 1}
        total={view.total}
        elapsed={elapsed}
        progress={(view.index + (feedback || done ? 1 : 0)) / view.total}
        onExit={onExit}
        theme={theme}
        onTheme={onTheme}
        onAccountOpenChange={setAccountOpen}
      />
      {body}
    </div>
  )
}

/** Screens 2–3: the LÄS session, kept in step with the bake-off's switcher. */
export function LjuskaglaDrill({ light, ...props }: DirectionProps & { light: ReadingLight }) {
  const { data, actions } = useDirectionData()
  const session = data.drills.reading
  const core = useSwitcherDrill(props, session, actions.drill)
  const { onScreen } = props
  const nextItem = data.home.plan.items.find((item) => !item.completed)
  const toIdag: Finish = { label: 'Till Idag', run: () => onScreen(1) }
  return (
    <ReadingWorkspace
      {...props}
      session={session}
      core={core}
      light={light}
      passageTestId="rd-passage"
      elapsed={core.view.elapsed}
      onLock={() => {
        if (core.act.lock()) onScreen(3)
      }}
      onNext={() => {
        if (core.act.next() === 'next') onScreen(2)
      }}
      onExit={() => onScreen(1)}
      finish={
        nextItem
          ? {
              primary: {
                label: `Nästa: ${nextItem.title}`,
                run: () => actions.openPlanItem(nextItem.id),
              },
              quiet: toIdag,
            }
          : { primary: toIdag }
      }
    />
  )
}

/** Screen 14 with a session to read: the drill core, graded and left
 *  through the host's controller. */
function ElfReading({
  session,
  light,
  ...props
}: DirectionProps & { session: DrillSessionView; light: ReadingLight }) {
  const { data, actions } = useDirectionData()
  const core = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live: props.live,
  })
  const nextItem = data.home.plan.items.find((item) => !item.completed)
  return (
    <ReadingWorkspace
      {...props}
      session={session}
      core={core}
      light={light}
      passageTestId="rd-elf-passage"
      elapsed={props.live || core.view.elapsed > 0 ? core.view.elapsed : null}
      onLock={() => core.act.lock()}
      onNext={() => core.act.next()}
      onExit={core.act.exit}
      finish={{
        primary: { label: 'Till Öva', run: () => actions.go('ova') },
        quiet: nextItem
          ? {
              label: `Nästa i dagens plan: ${nextItem.title}`,
              run: () => actions.openPlanItem(nextItem.id),
            }
          : undefined,
      }}
    />
  )
}

/** A drill session that arrived without questions: the focus head with its
 *  Avsluta, what happened, and the way back to Öva. Never a receipt. */
export function NoQuestions({
  section,
  theme,
  onTheme,
}: Pick<DirectionProps, 'theme' | 'onTheme'> & { section: string }) {
  const { actions } = useDirectionData()
  return (
    <div className="lj-drill">
      <DrillHead
        section={section}
        position={0}
        total={0}
        elapsed={null}
        progress={0}
        onExit={() => actions.drill.exit?.()}
        theme={theme}
        onTheme={onTheme}
        onAccountOpenChange={() => {}}
      />
      <div className="lj-done lj-unavailable-text" role="status">
        <p className="lj-eyebrow">{section}</p>
        <h1>Inga frågor att visa just nu.</h1>
        <p>Övningen kom utan frågor. Välj en annan övning under Öva.</p>
        <button className="lj-primary" type="button" onClick={() => actions.go('ova')}>
          Till Öva
          <ArrowRight size={20} aria-hidden />
        </button>
      </div>
    </div>
  )
}

/**
 * Screen 14, ELF-läsfråga: an English text in the same reading room as LÄS.
 * A new session, or one whose questions change in number, opens fresh, so
 * the place never points past the questions there are. A session with no
 * questions says so, with Avsluta and a way back to Öva.
 */
export function LjuskaglaElf({ light, ...props }: DirectionProps & { light: ReadingLight }) {
  const { data } = useDirectionData()
  const session = data.drills.elf
  if (session.questions.length === 0) {
    return <NoQuestions section="ELF" theme={props.theme} onTheme={props.onTheme} />
  }
  return (
    <ElfReading
      key={`${session.id}:${session.questions.length}`}
      {...props}
      session={session}
      light={light}
    />
  )
}
