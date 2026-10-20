import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

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
import type { DrillOptionFigure, DrillSessionView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { RasterFeedback } from './RasterFeedback'
import { PassageText, type RasterDrillState } from './RasterParts'

type ReadingProps = DirectionProps & { onGo: (dest: Destination) => void; returnToHome: boolean }

export function RasterDrill(props: ReadingProps) {
  const { data, actions } = useDirectionData()
  const session = props.screen === 14 ? data.drills.elf : data.drills.reading
  if (!session.questions.length)
    return (
      <main className="ra-done">
        <button type="button" data-testid="rd-exit" onClick={() => actions.drill.exit?.()}>
          ← Avsluta
        </button>
        <h1>
          {props.screen === 14
            ? 'Texten eller frågan saknas'
            : 'Frågan saknar fullständigt innehåll'}
        </h1>
        <button type="button" className="ra-primary" onClick={() => props.onGo('ova')}>
          Till Öva
        </button>
      </main>
    )
  // The core requires a stable nonempty deck. Reset before it can dereference
  // an old index when a provider replaces or shrinks the question list.
  return (
    <ReadingSession
      key={`${session.id}:${session.questions.map((q) => q.qid).join('|')}`}
      {...props}
      session={session}
    />
  )
}

function ReadingSession({
  screen,
  width,
  live,
  onScreen,
  onGo,
  returnToHome,
  session,
}: ReadingProps & { session: DrillSessionView }) {
  const { data, actions } = useDirectionData()
  const elf = screen === 14
  const [start] = useState(() => ({
    ...session.start,
    graded:
      screen === 3
        ? session.wrongPick?.[
            session.questions[
              Math.max(0, Math.min(session.questions.length - 1, session.start.index ?? 0))
            ].qid
          ]
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
      if (!ready) return false
      const locked = core.lock()
      if (locked && !elf) onScreen(3)
      return locked
    },
    next: () => {
      const next = core.next()
      if (next === 'next' && !elf) onScreen(2)
      return next
    },
    exit: () => {
      core.exit()
      if (returnToHome && !elf) onScreen(1)
    },
  }
  const sheet = useSheet(view)
  const phone = width === 'phone'
  const [note, setNote] = useState(false)
  const [clock, setClock] = useState(true)
  const scrolling = useHideOnScroll()
  const questionScroll = useRef<HTMLElement>(null)
  const passageScroll = useRef<HTMLElement>(null)
  const savedSheet = useRef(sheet.state)
  const returnScroll = useRef(0)
  const [citing, setCiting] = useState(false)
  const questionId = useId()
  const nextItem = data.home.plan.allComplete
    ? undefined
    : data.home.plan.items.find((item) => !item.completed)
  const nextPlan = () => (nextItem ? actions.openPlanItem(nextItem.id) : onGo('ova'))
  const cloze = view.question.section === 'ELF' && !view.question.prompt?.trim()
  const usable =
    (!!view.question.prompt?.trim() || cloze) &&
    !!view.question.options?.length &&
    !!view.passage?.paragraphs.some((p) => p.trim())
  const [images, setImages] = useState<Record<string, ImageState>>({})
  const report = useCallback<ReportImage>((id, status) => {
    setImages((old) => {
      if (old[id] === status || (status === null && !(id in old))) return old
      const next = { ...old }
      if (status === null) delete next[id]
      else next[id] = status
      return next
    })
  }, [])
  const mainImage = view.question.figure ? `main:${view.question.figure.src}` : null
  const required = [
    ...(mainImage ? [mainImage] : []),
    ...(view.question.options?.flatMap((o) =>
      o.figure ? [optionKey(view.question.qid, o.letter, o.figure.src)] : [],
    ) ?? []),
  ]
  const ready = usable && required.every((id) => images[id] === 'ready')
  const advance = () => {
    if (view.phase === 'done') nextPlan()
    else if (view.phase === 'feedback') act.next()
    else if (ready) act.lock()
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
    setCiting(false)
  }, [view.phase, view.index])
  const passageKey = JSON.stringify([
    view.question.passage?.unitId,
    view.question.passage?.title,
    view.passage?.paragraphs,
  ])
  // biome-ignore lint/correctness/useExhaustiveDependencies: content identity is the scroll reset boundary
  useEffect(() => {
    if (passageScroll.current) passageScroll.current.scrollTop = 0
    setNote(false)
  }, [passageKey])
  const cite: typeof act.cite = (n, source) => {
    // First expose the passage, then let the shared hook reveal its paragraph.
    if (phone) {
      savedSheet.current = sheet.state
      returnScroll.current = questionScroll.current?.scrollTop ?? 0
      setCiting(true)
      sheet.setState('peek')
    }
    act.cite(n, source)
  }
  const returnToExplanation = () => {
    sheet.setState(savedSheet.current === 'peek' ? 'open' : savedSheet.current)
    setCiting(false)
    window.requestAnimationFrame(() => {
      if (questionScroll.current) questionScroll.current.scrollTop = returnScroll.current
    })
  }
  const shared = { view, refs, act: { ...act, cite } }
  const peek = phone && sheet.state === 'peek'

  return (
    <main className="ra-drill" data-reading="true">
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
          <p className="ra-label">{view.question.section} / Texten klar</p>
          <h1>En text närmare.</h1>
          <p className="ra-display">
            {view.results.filter((r) => r.correct).length}
            <small>/{view.total}</small>
          </p>
          <p>
            Rätt i den här texten
            {session.elapsedSeconds != null ? ` · ${fmtClock(view.elapsed)}` : ''}
          </p>
          <p>Ta med dig tekniken till nästa text.</p>
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
          <section
            className="ra-reading-scroll"
            onScroll={scrolling.onScroll}
            ref={passageScroll}
            data-rd-keyscope
            // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard-scrollable passage
            tabIndex={0}
            aria-label="Lästext"
          >
            <Passage {...shared} note={note} setNote={setNote} />
            {view.question.figure && mainImage ? (
              <figure className="ra-reading-figure" data-testid="rd-figure">
                <ReadingImage
                  key={mainImage}
                  id={mainImage}
                  figure={view.question.figure}
                  report={report}
                  lang={elf ? 'en' : 'sv'}
                />
                <figcaption lang={elf ? 'en' : 'sv'}>{view.question.figure.alt}</figcaption>
              </figure>
            ) : null}
          </section>
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
                  {peek ? 'Visa alternativen' : 'Visa texten'}{' '}
                  <span aria-hidden>{peek ? '↑' : '↓'}</span>
                </span>
              </button>
            ) : null}
            {peek ? (
              <p
                className="ra-peek-prompt"
                lang={view.phase === 'feedback' || cloze ? 'sv' : elf ? 'en' : 'sv'}
              >
                {view.phase === 'feedback'
                  ? `${view.correct ? 'Rätt.' : 'Fel.'} Rätt svar är ${view.question.answer}. Visa förklaringen.`
                  : cloze
                    ? `Lucka ${view.question.number}`
                    : view.question.prompt}
              </p>
            ) : null}
            {citing ? (
              <button type="button" className="ra-citation-return" onClick={returnToExplanation}>
                Till förklaringen ↑
              </button>
            ) : null}
            {/* Keep the question mounted to preserve detail state when following a citation. */}
            <div className="ra-answer-area" id={questionId} hidden={peek}>
              <section
                className="ra-question-scroll"
                ref={questionScroll}
                data-rd-keyscope
                // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard-scrollable question and feedback
                tabIndex={0}
                aria-label="Fråga och förklaring"
              >
                {view.phase === 'feedback' ? (
                  <RasterFeedback {...shared} />
                ) : usable ? (
                  <Question {...shared} report={report} />
                ) : (
                  <div className="ra-missing">
                    <p>Texten eller frågan saknas.</p>
                    <button type="button" className="ra-outline" onClick={() => onGo('ova')}>
                      Till Öva
                    </button>
                  </div>
                )}
              </section>
              <footer className="ra-actionbar">
                {view.phase === 'question' ? (
                  <>
                    <span aria-live="polite">
                      {!usable
                        ? 'Innehåll saknas'
                        : !ready
                          ? 'Inväntar bilderna'
                          : view.selected
                            ? `Ditt val: ${view.selected}`
                            : 'Välj ett alternativ'}
                    </span>
                    {usable ? (
                      <button
                        type="button"
                        className="ra-primary"
                        data-testid="rd-lock"
                        disabled={!view.selected || !ready}
                        onClick={act.lock}
                      >
                        Svara <kbd aria-hidden>↵</kbd>
                      </button>
                    ) : null}
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
  const english = view.question.section === 'ELF'
  const title = view.question.passage?.title
  const cloze = english && !view.question.prompt?.trim()
  const gaps = cloze
    ? gapChain(view.passage?.paragraphs.join('\n\n') ?? '', view.question.number)
    : new Set<number>()
  return (
    <section className="ra-passage">
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
      <article
        lang={english ? 'en' : 'sv'}
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : english ? 'English passage' : 'Lästext'}
        data-testid={english ? 'rd-elf-passage' : 'rd-passage'}
      >
        <div className="ra-passage-heading">
          <span className="ra-label" lang="sv">
            {view.question.section} / {english ? 'Engelsk läsförståelse' : 'Läsförståelse'}
          </span>
          {title ? <h1 id={titleId}>{title}</h1> : <p lang="sv">{view.question.source.label}</p>}
        </div>
        <div className="ra-passage-body">
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
                lang="sv"
                aria-label={`Läs stycke ${i + 1}`}
                aria-pressed={view.focusPara === i + 1}
                onClick={() => act.setFocusPara(view.focusPara === i + 1 ? null : i + 1)}
              >
                <span aria-hidden>¶</span>
                {i + 1}
              </button>
              {cloze ? (
                <ClozeText text={text} current={view.question.number} gaps={gaps} />
              ) : (
                <PassageText text={text} number={i + 1} view={view} />
              )}
            </p>
          ))}
          {view.passage?.byline ? <p className="ra-byline">{view.passage.byline}</p> : null}
        </div>
      </article>
    </section>
  )
}

function Question({ view, act, report }: RasterDrillState & { report: ReportImage }) {
  const english = view.question.section === 'ELF'
  const cloze = english && !view.question.prompt?.trim()
  return (
    <div className="ra-question">
      <p className="ra-label">{view.question.section} / Läsförståelse</p>
      <h2 lang={cloze ? 'sv' : english ? 'en' : 'sv'}>
        {cloze ? `Lucka ${view.question.number}` : <MathText>{view.question.prompt}</MathText>}
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
                  <span lang={english ? 'en' : 'sv'}>
                    <MathText>{option.text}</MathText>
                  </span>
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
              {option.figure ? (
                <div className="ra-reading-option-image">
                  <ReadingImage
                    key={optionKey(view.question.qid, option.letter, option.figure.src)}
                    id={optionKey(view.question.qid, option.letter, option.figure.src)}
                    figure={option.figure}
                    report={report}
                    lang={english ? 'en' : 'sv'}
                  />
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

type ImageState = 'loading' | 'ready' | 'error'
type ReportImage = (id: string, status: ImageState | null) => void
const optionKey = (qid: string, letter: string, src: string) => `${qid}:${letter}:${src}`

/** A keyed mounted copy owns its own readiness, including cached images and retries. */
function ReadingImage({
  id,
  figure,
  report,
  lang,
}: {
  id: string
  figure: DrillOptionFigure
  report: ReportImage
  lang?: 'en' | 'sv'
}) {
  const ref = useRef<HTMLImageElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<ImageState>('loading')
  const update = useCallback(
    (next: ImageState) => {
      setStatus(next)
      report(id, next)
    },
    [id, report],
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: each retry mounts a new image and rechecks its cache state
  useLayoutEffect(() => {
    const image = ref.current
    update(image?.complete ? (image.naturalWidth > 0 ? 'ready' : 'error') : 'loading')
    return () => report(id, null)
  }, [id, report, update, attempt])
  return (
    <div className="ra-required-image">
      <img
        key={attempt}
        ref={ref}
        src={`/${figure.src.replace(/^\/+/, '')}`}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        lang={lang}
        onLoad={() => update('ready')}
        onError={() => update('error')}
      />
      {status !== 'ready' ? (
        <p role="status">{status === 'error' ? 'Bilden kunde inte visas.' : 'Laddar bilden…'}</p>
      ) : null}
      {status === 'error' ? (
        <button
          type="button"
          className="ra-outline"
          onClick={() => {
            update('loading')
            setAttempt((n) => n + 1)
          }}
        >
          Försök igen
        </button>
      ) : null}
    </div>
  )
}

// Same extraction semantics as DrillQuestion's private cloze helpers: accept
// the consecutive question-number chain, leaving ages, ranges and percentages.
const GAP = /(?<![\w–-])_{0,14}(\d{2})_{0,14}(?![\w–\-%])/g
function gapChain(context: string, current: number): Set<number> {
  const candidates = [...context.matchAll(GAP)]
    .map((m) => Number(m[1]))
    .filter((n) => Math.abs(n - current) <= 6)
  let best: number[] = []
  for (let i = 0; i < candidates.length; i++) {
    const chain = [candidates[i]]
    for (let j = i + 1; j < candidates.length; j++) {
      if (candidates[j] === chain[chain.length - 1] + 1) chain.push(candidates[j])
    }
    if (chain.includes(current) && chain.length > best.length) best = chain
  }
  return new Set(best.length ? best : candidates)
}
function ClozeText({ text, current, gaps }: { text: string; current: number; gaps: Set<number> }) {
  const out: ReactNode[] = []
  let at = 0
  for (const match of text.matchAll(GAP)) {
    const n = Number(match[1])
    if (!gaps.has(n)) continue
    out.push(text.slice(at, match.index))
    out.push(
      <span
        key={match.index}
        role="img"
        className="ra-cloze-gap"
        data-testid={`cloze-gap-${n}`}
        data-active={String(n === current)}
        lang="sv"
        aria-label={`Lucka ${n}${n === current ? ', aktuell' : ''}`}
      >
        {n}
      </span>,
    )
    at = match.index + match[0].length
  }
  out.push(text.slice(at))
  return out
}
