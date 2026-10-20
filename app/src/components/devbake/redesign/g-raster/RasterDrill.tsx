import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useDrillCore } from '@/components/devbake/redesign/drillCore'
import {
  type Destination,
  type DirectionProps,
  fmtClock,
  useHideOnScroll,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import { MathText } from '@/components/MathText'
import { RasterFeedback } from './RasterFeedback'
import { PassageText, type RasterDrillState } from './RasterParts'

type ReadingProps = DirectionProps & { onGo: (dest: Destination) => void; returnToHome: boolean }

export function RasterDrill(props: ReadingProps) {
  const { data } = useDirectionData()
  const session = data.drills.reading
  if (!session.questions.length)
    return (
      <main className="ra-done">
        <button type="button" data-testid="rd-exit" onClick={() => props.onGo('ova')}>
          ← Avsluta
        </button>
        <h1>Frågan saknar fullständigt innehåll</h1>
        <button type="button" className="ra-primary" onClick={() => props.onGo('ova')}>
          Till Öva
        </button>
      </main>
    )
  return <ReadingSession key={session.id} {...props} />
}

function ReadingSession({ screen, width, live, onScreen, onGo, returnToHome }: ReadingProps) {
  const { data, actions } = useDirectionData()
  const session = data.drills.reading
  const [start] = useState(() => ({
    ...session.start,
    graded:
      screen === 3
        ? session.wrongPick?.[session.questions[session.start.index ?? 0].qid]
        : session.start.graded,
  }))
  const {
    view,
    act: core,
    refs,
  } = useDrillCore({
    ...session,
    start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  // biome-ignore lint/correctness/useExhaustiveDependencies: only switcher moves resynchronize the display
  useLayoutEffect(() => {
    if (screen === 3 && view.phase === 'question') core.gradeAs((q) => session.wrongPick?.[q.qid])
    else if (screen === 2 && view.phase === 'feedback') core.reopen()
    else if (screen === 2 && view.phase === 'done') core.reset()
  }, [screen])
  const act = {
    ...core,
    lock: () => {
      const locked = core.lock()
      if (locked) onScreen(3)
      return locked
    },
    next: () => {
      const next = core.next()
      if (next === 'next') onScreen(2)
      return next
    },
    exit: () => {
      core.exit()
      if (returnToHome) onScreen(1)
    },
  }
  const sheet = useSheet(view)
  const phone = width === 'phone'
  const [note, setNote] = useState(false)
  const [clock, setClock] = useState(true)
  const scrolling = useHideOnScroll()
  const questionScroll = useRef<HTMLDivElement>(null)
  const questionId = useId()
  const nextItem = data.home.plan.items.find((item) => !item.completed)
  const nextPlan = () => (nextItem ? actions.openPlanItem(nextItem.id) : onGo('ova'))
  const usable = !!view.question.prompt && !!view.question.options?.length && !!view.passage
  const advance = () => {
    if (view.phase === 'done') nextPlan()
    else if (view.phase === 'feedback') act.next()
    else if (usable) act.lock()
  }
  const keys: Record<string, () => void> = {
    Enter: advance,
    ' ': advance,
    f: () => act.setFocusPara(view.focusPara == null ? 1 : null),
    j: () => act.moveFocusPara(1),
    k: () => act.moveFocusPara(-1),
    Escape: () => act.setFocusPara(null),
  }
  for (const option of view.question.options ?? []) {
    const letter = option.letter.toLowerCase()
    keys[letter] = () => {
      act.select(option.letter)
      if (phone && view.phase === 'question') sheet.setState('open')
    }
    keys[`Shift+${letter}`] = () => act.toggleEliminate(option.letter)
  }
  useKeyMap(keys, live)
  // A new question/verdict starts at its heading, without moving the passage.
  // biome-ignore lint/correctness/useExhaustiveDependencies: phase/index are scroll reset boundaries
  useEffect(() => {
    if (questionScroll.current) questionScroll.current.scrollTop = 0
  }, [view.phase, view.index])
  const cite: typeof act.cite = (n, source) => {
    // First expose the passage, then let the shared hook reveal its paragraph.
    if (phone) sheet.setState('peek')
    act.cite(n, source)
  }
  const shared = { view, refs, act: { ...act, cite } }
  const peek = phone && sheet.state === 'peek'

  return (
    <main className="ra-drill">
      <header className="ra-drill-bar" data-quiet={String(phone && scrolling.hidden)}>
        <button type="button" className="ra-exit" data-testid="rd-exit" onClick={act.exit}>
          ← Avsluta
        </button>
        <span className="ra-badge" data-testid="rd-badge">
          {view.question.passage?.synthetic ? data.copy.ovningstextBadge : view.question.section}
        </span>
        <span
          className="ra-drill-position"
          role="img"
          aria-label={`Fråga ${view.index + 1} av ${view.total}`}
        >
          <b>{String(view.index + 1).padStart(2, '0')}</b>
          <span>/{String(view.total).padStart(2, '0')}</span>
        </span>
        {session.elapsedSeconds != null ? (
          <button
            type="button"
            className="ra-clock"
            onClick={() => setClock(!clock)}
            aria-label={clock ? 'Dölj tidtagningen' : 'Visa tidtagningen'}
          >
            {clock ? fmtClock(view.elapsed) : 'Visa tid'}
          </button>
        ) : null}
      </header>
      <div
        className="ra-progress"
        role="progressbar"
        aria-label="Besvarade frågor"
        aria-valuemin={0}
        aria-valuemax={view.total}
        aria-valuenow={view.results.length}
      >
        <span style={{ width: `${(view.results.length / view.total) * 100}%` }} />
      </div>
      {view.phase === 'done' ? (
        <section className="ra-done" data-testid="rd-done">
          <p className="ra-label">LÄS / Texten är klar</p>
          <h1>En text närmare.</h1>
          <p className="ra-display">
            {view.results.filter((r) => r.correct).length}
            <small>/{view.total}</small>
          </p>
          <p>
            Rätt i den här texten
            {session.elapsedSeconds != null ? ` · ${fmtClock(view.elapsed)}` : ''}
          </p>
          <p>Ta med dig tekniken till nästa text. Missarna finns kvar att repetera.</p>
          <button
            type="button"
            className="ra-primary"
            data-testid="rd-done-next"
            onClick={nextPlan}
          >
            {nextItem ? `Nästa: ${nextItem.title}` : 'Till Öva'} <span aria-hidden>↗</span>
          </button>
          <button type="button" className="ra-outline" onClick={() => onGo('idag')}>
            Till Idag
          </button>
        </section>
      ) : (
        <div className="ra-drill-grid">
          <div className="ra-reading-scroll" onScroll={scrolling.onScroll}>
            <Passage {...shared} note={note} setNote={setNote} />
          </div>
          <section
            className="ra-question-sheet"
            data-testid={phone ? 'rd-sheet' : undefined}
            data-state={phone ? sheet.state : 'desktop'}
            aria-label={view.phase === 'feedback' ? 'Facit' : 'Fråga och svar'}
          >
            {phone ? (
              <button
                type="button"
                className="ra-sheet-toggle"
                aria-expanded={!peek}
                aria-controls={questionId}
                {...sheet.grab}
              >
                <span>
                  {view.phase === 'feedback' ? 'Facit' : `Fråga ${view.index + 1} av ${view.total}`}
                </span>
                <span>
                  {peek ? 'Visa' : 'Till texten'} <span aria-hidden>{peek ? '↑' : '↓'}</span>
                </span>
              </button>
            ) : null}
            {peek ? (
              <p className="ra-peek-prompt">
                {view.phase === 'feedback'
                  ? `${view.correct ? 'Rätt.' : 'Fel.'} Rätt svar är ${view.question.answer}. Visa förklaringen.`
                  : view.question.prompt}
              </p>
            ) : null}
            {/* Keep the question mounted to preserve detail state when following a citation. */}
            <div className="ra-answer-area" id={questionId} hidden={peek}>
              <div className="ra-question-scroll" ref={questionScroll}>
                {view.phase === 'feedback' ? (
                  <RasterFeedback {...shared} />
                ) : usable ? (
                  <Question {...shared} />
                ) : (
                  <p className="ra-missing">Frågan saknar fullständigt innehåll.</p>
                )}
              </div>
              <footer className="ra-actionbar">
                {view.phase === 'question' ? (
                  <>
                    <span aria-live="polite">
                      {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
                    </span>
                    <button
                      type="button"
                      className="ra-primary"
                      data-testid="rd-lock"
                      disabled={!view.selected || !usable}
                      onClick={act.lock}
                    >
                      Svara <kbd aria-hidden>↵</kbd>
                    </button>
                  </>
                ) : (
                  <>
                    <span>
                      {view.index + 1 === view.total
                        ? 'Sista frågan'
                        : `Härnäst: fråga ${view.index + 2}`}
                    </span>
                    <button
                      type="button"
                      className="ra-primary"
                      data-testid="rd-next"
                      onClick={act.next}
                    >
                      {view.index + 1 === view.total ? 'Slutför texten' : 'Nästa fråga'}{' '}
                      <span aria-hidden>→</span>
                    </button>
                  </>
                )}
              </footer>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function Passage({
  view,
  act,
  refs,
  note,
  setNote,
}: RasterDrillState & { note: boolean; setNote: (open: boolean) => void }) {
  const { data } = useDirectionData()
  const noteId = useId()
  const titleId = useId()
  const [title, subtitle] = (view.question.passage?.title ?? view.question.source.label).split(': ')
  return (
    <article className="ra-passage" aria-labelledby={titleId} lang="sv">
      <div className="ra-reading-tools">
        {view.question.passage?.synthetic ? (
          <button
            type="button"
            data-testid="rd-note-toggle"
            aria-expanded={note}
            aria-controls={noteId}
            onClick={() => setNote(!note)}
          >
            {note ? 'Dölj textinformationen −' : 'Om texten ＋'}
          </button>
        ) : null}
        <button
          type="button"
          aria-pressed={view.focusPara != null}
          onClick={() => act.setFocusPara(view.focusPara == null ? 1 : null)}
        >
          ¶ Styckefokus
        </button>
      </div>
      <p
        className="ra-note"
        id={noteId}
        data-testid="rd-note"
        hidden={!note || !view.question.passage?.synthetic}
      >
        {data.copy.ovningstextNote}
      </p>
      <div className="ra-passage-heading">
        <span className="ra-label">{view.question.section} / Läsförståelse</span>
        <h1 id={titleId}>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="ra-passage-body" data-testid="rd-passage">
        {view.passage?.paragraphs.map((text, i) => (
          <p
            className="ra-paragraph"
            key={text}
            ref={refs.para(i + 1)}
            data-testid={`rd-para-${i + 1}`}
            data-focused={String(view.focusPara === i + 1)}
            data-flash={String(view.flashPara === i + 1)}
          >
            <button
              type="button"
              className="ra-pilcrow"
              tabIndex={-1}
              aria-label={`Stycke ${i + 1}`}
              aria-pressed={view.focusPara === i + 1}
              onClick={() => act.setFocusPara(view.focusPara === i + 1 ? null : i + 1)}
            >
              <span aria-hidden>¶</span>
              {i + 1}
            </button>
            <PassageText text={text} number={i + 1} view={view} />
          </p>
        ))}
        {view.passage?.byline ? <p className="ra-byline">{view.passage.byline}</p> : null}
      </div>
    </article>
  )
}

function Question({ view, act }: RasterDrillState) {
  return (
    <div className="ra-question">
      <p className="ra-label">{view.question.section} / Läsförståelse</p>
      <h2>
        <MathText>{view.question.prompt}</MathText>
      </h2>
      <p className="ra-key-hints">
        {view.letters.join('–')} väljer · ⇧ + bokstav stryker · ↵ svarar
      </p>
      <ol className="ra-options" aria-label="Svarsalternativ">
        {view.question.options?.map((option) => {
          const eliminated = view.eliminated.has(option.letter)
          const selected = view.selected === option.letter
          return (
            <li
              key={option.letter}
              data-selected={String(selected)}
              data-eliminated={String(eliminated)}
            >
              <button
                type="button"
                className="ra-option"
                data-testid={`rd-option-${option.letter}`}
                aria-pressed={selected}
                onClick={() => act.select(option.letter)}
              >
                <kbd>{option.letter}</kbd>
                <span>
                  <span className="ra-sr">{eliminated ? 'Struket alternativ: ' : ''}</span>
                  <MathText>{option.text}</MathText>
                </span>
                <span className="ra-option-mark" aria-hidden>
                  {selected ? '●' : ''}
                </span>
              </button>
              <button
                type="button"
                className="ra-eliminate"
                data-testid={`rd-eliminate-${option.letter}`}
                aria-label={
                  eliminated ? `Ångra strykning av ${option.letter}` : `Stryk ${option.letter}`
                }
                aria-pressed={eliminated}
                onClick={() => act.toggleEliminate(option.letter)}
              >
                {eliminated ? '↶' : '╱'}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
