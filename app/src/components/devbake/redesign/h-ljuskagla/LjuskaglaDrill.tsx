import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  LampDesk,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  OVNINGSTEXT_BADGE,
  OVNINGSTEXT_NOTE,
  PLAN,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type Destination,
  type DirectionProps,
  fmtClock,
  useDrill,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import { LjuskaglaFeedback } from './LjuskaglaFeedback'
import { Account } from './LjuskaglaNav'
import type { Reading } from './LjuskaglaParts'

export function LjuskaglaDrill({
  onGo,
  ...props
}: DirectionProps & { onGo: (d: Destination) => void }) {
  const { view, act, refs } = useDrill(props)
  const sheet = useSheet(view)
  const [spotlight, setSpotlight] = useState(true)
  const [note, setNote] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLDivElement>(null)
  const scrollQuietUntil = useRef(0)
  const noteId = useId()
  const questionId = useId()
  const phone = props.width === 'phone'
  const feedback = view.phase === 'feedback'
  const done = view.phase === 'done'
  const sheetVisible = !phone || sheet.state !== 'peek'
  const active = view.focusPara ?? 1
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
    point(Math.max(1, Math.min(view.passage.paragraphs.length, active + delta)))
  }
  const nextPlan = () => onGo(PLAN.items[0].kind === 'lektion' ? 'uppslag' : 'ova')
  const advance = () => {
    if (done) nextPlan()
    else if (feedback) act.next()
    else if (phone && sheet.state === 'peek') sheet.setState('open')
    else act.lock()
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
    for (const option of view.question.options) {
      keys[option.letter.toLowerCase()] = () => {
        if (phone) sheet.setState('open')
        act.select(option.letter)
      }
      keys[`Shift+${option.letter.toLowerCase()}`] = () => act.toggleEliminate(option.letter)
    }
  }
  useKeyMap(keys, props.live && !accountOpen)

  const onPassageScroll = () => {
    const box = scrollRef.current
    if (!box || !props.live || !spotlight || Date.now() < scrollQuietUntil.current) return
    const rect = box.getBoundingClientRect()
    if (rect.height === 0) return
    const line = rect.top + rect.height * 0.28
    const paragraphs = [...box.querySelectorAll<HTMLElement>('[data-paragraph]')]
    const nearest = paragraphs.reduce<HTMLElement | null>((found, paragraph) => {
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
      <header className="lj-drill-head">
        <button
          type="button"
          className="lj-text-button lj-exit"
          data-testid="rd-exit"
          onClick={() => onGo('idag')}
        >
          <X size={18} aria-hidden />
          <span>Avsluta</span>
        </button>
        <span className="lj-drill-progress">
          LÄS{' '}
          <span>
            · {done ? view.total : view.index + 1} av {view.total}
          </span>
        </span>
        <span className="lj-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
          {fmtClock(view.elapsed)}
        </span>
        <Account {...props} onOpenChange={setAccountOpen} />
        <span className="lj-progress-line" aria-hidden>
          <i
            style={{ width: `${((view.index + (feedback || done ? 1 : 0)) / view.total) * 100}%` }}
          />
        </span>
      </header>
      {done ? (
        <div className="lj-done" data-testid="rd-done">
          <Check size={32} strokeWidth={1.5} aria-hidden />
          <p className="lj-eyebrow">Texten är färdigläst</p>
          <h1>En stund som räknas.</h1>
          <p>
            {view.results.filter((result) => result.correct).length} av {view.total} rätt ·{' '}
            {Math.round(view.elapsed / 60)} minuter
          </p>
          <p>{UNIT.title}</p>
          <button
            className="lj-primary"
            type="button"
            data-testid="rd-done-next"
            onClick={nextPlan}
          >
            Nästa: {PLAN.items[0].title}
            <ArrowRight size={20} aria-hidden />
          </button>
          <button className="lj-text-button" type="button" onClick={() => onGo('idag')}>
            Till Idag
          </button>
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
                ¶{active} / {view.passage.paragraphs.length}
              </span>
            </div>
            <div
              className="lj-passage-scroll"
              data-testid="rd-passage-scroll"
              ref={scrollRef}
              onScroll={onPassageScroll}
            >
              <header className="lj-passage-title">
                <div className="lj-disclosure">
                  <span className="lj-eyebrow" data-testid="rd-badge">
                    {OVNINGSTEXT_BADGE}
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
                  {OVNINGSTEXT_NOTE}
                </p>
                <h1>{UNIT.title.split(': ')[0]}</h1>
                <p>{UNIT.title.split(': ')[1]}</p>
              </header>
              <article className="lj-passage" data-testid="rd-passage" aria-label={UNIT.title}>
                {view.passage.paragraphs.map((text, index) => {
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
                {view.passage.byline && <p className="lj-byline">{view.passage.byline}</p>}
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
                Fråga {view.index + 1} av {view.total} · LÄS
              </p>
              {sheetVisible ? (
                feedback ? (
                  <LjuskaglaFeedback view={view} act={sheetActions} refs={refs} />
                ) : (
                  <>
                    <h2 className="lj-prompt">{view.question.prompt}</h2>
                    <Options view={view} act={act} refs={refs} />
                  </>
                )
              ) : (
                <p className="lj-peek-prompt">
                  {feedback
                    ? `Rätt svar: ${view.question.answer} · öppna förklaringen`
                    : view.question.prompt}
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
                  onClick={feedback ? act.next : act.lock}
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

function Options({ view, act }: Reading) {
  return (
    <ol className="lj-options" aria-label="Svarsalternativ">
      {view.question.options.map((option) => {
        const selected = view.selected === option.letter
        const eliminated = view.eliminated.has(option.letter)
        return (
          <li
            key={option.letter}
            data-selected={String(selected)}
            data-eliminated={String(eliminated)}
          >
            <button
              type="button"
              className="lj-option"
              data-testid={`rd-option-${option.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(option.letter)}
            >
              <kbd>{option.letter}</kbd>
              <span>{option.text}</span>
              {selected && <Check className="lj-selected-mark" size={16} aria-hidden />}
            </button>
            <button
              type="button"
              className="lj-eliminate"
              data-testid={`rd-eliminate-${option.letter}`}
              aria-label={
                eliminated ? `Ångra strykning av ${option.letter}` : `Stryk ${option.letter}`
              }
              aria-pressed={eliminated}
              onClick={() => act.toggleEliminate(option.letter)}
            >
              {eliminated ? <Undo2 size={17} aria-hidden /> : <CircleSlash size={17} aria-hidden />}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
