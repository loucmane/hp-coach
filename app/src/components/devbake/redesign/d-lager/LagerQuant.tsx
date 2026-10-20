import { ChevronDown, ChevronUp, Maximize2, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useDrillCore } from '@/components/devbake/redesign/drillCore'
import { type DirectionProps, fmtClock, useKeyMap } from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillQuestion,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { Actions, Explanation, type ImageReadiness, Options, useRequiredImages } from './LagerDrill'

type Props = DirectionProps & { onDone: (done: boolean) => void }

export function LagerQuant(props: Props) {
  const { data, actions } = useDirectionData()
  const session = props.screen === 7 ? data.drills.dtk : data.drills.quant
  if (!session.questions.length)
    return (
      <div className="la-done-wrap">
        <section className="la-sheet la-done" data-depth="2">
          <h1>Ingen fråga att visa</h1>
          <button
            type="button"
            className="la-btn"
            data-testid="rd-exit"
            onClick={() => actions.go('ova')}
          >
            Till Öva
          </button>
        </section>
      </div>
    )
  return <QuantSession {...props} key={session.id} session={session} />
}

function QuantSession({ session, live, width, onDone }: Props & { session: DrillSessionView }) {
  const { actions } = useDirectionData()
  const { view, act, refs } = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const q = view.question
  const feedback = view.phase === 'feedback'
  const done = view.phase === 'done'
  const [front, setFront] = useState<'question' | 'explain'>('explain')
  const [expanded, setExpanded] = useState(false)
  const [viewer, setViewer] = useState(false)
  const images = useRequiredImages(q)
  const [narrow, setNarrow] = useState(width === 'phone')
  const root = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const answerScroll = useRef<HTMLDivElement>(null)
  const dtk = q.section === 'DTK'
  const sourceKey = q.figure?.src ?? ''
  const invalid = !q.prompt?.trim() || !q.options?.length || (dtk && !q.figure)
  const blocked = invalid || images.blocked
  const sourceGroup = sourceKey
    ? session.questions.filter((item) => item.figure?.src === sourceKey)
    : []
  const sourceIndex = sourceGroup.findIndex((item) => item.qid === q.qid) + 1

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const measure = () =>
      setNarrow(width === 'phone' || (el.clientWidth > 0 && el.clientWidth < 1120))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [width])
  // A new question reseats the task; a verdict brings its explanation forward.
  // biome-ignore lint/correctness/useExhaustiveDependencies: transitions, not refreshed data
  useEffect(() => {
    setFront('explain')
    setExpanded(feedback)
    answerScroll.current?.scrollTo?.({ top: 0 })
    const target = feedback
      ? root.current?.querySelector<HTMLElement>('[data-testid="rd-verdict"]')
      : heading.current
    target?.setAttribute('tabindex', '-1')
    target?.focus({ preventScroll: true })
  }, [view.index, view.phase])
  useEffect(() => {
    onDone(done)
    return () => onDone(false)
  }, [done, onDone])

  const advance = () => {
    if (view.phase === 'question' && !blocked) act.lock()
    else if (feedback) act.next()
  }
  const keys: Record<string, () => void> = {
    Enter: advance,
    ' ': advance,
    Escape: () => setExpanded(false),
  }
  for (const letter of view.letters) {
    keys[letter.toLowerCase()] = () => {
      act.select(letter)
      setExpanded(true)
    }
    keys[`Shift+${letter.toLowerCase()}`] = () => {
      act.toggleEliminate(letter)
      setExpanded(true)
    }
  }
  useKeyMap(keys, live && !viewer && !done)

  const prompt = (
    <div className="la-quant-prompt" data-testid="rd-quant-prompt">
      <QuantPrompt question={q} />
    </div>
  )
  const answer = (
    <>
      {dtk ? prompt : <h2 className="la-h">Välj ett alternativ</h2>}
      {invalid ? (
        <p role="status">
          {dtk && !q.figure ? 'Underlaget saknas.' : 'Frågan saknar fullständig text.'}
        </p>
      ) : null}
      <Options view={view} act={act} quant images={images} />
      <p className="la-keys">
        {view.letters.join('–')} väljer · Enter svarar · Shift + bokstav stryker
      </p>
    </>
  )
  const next = (
    <Actions view={view} act={act} blocked={blocked} lastLabel="Avsluta övningen" unit="övningen" />
  )

  return (
    <div
      className="la-quant"
      ref={root}
      data-layout={narrow ? 'narrow' : 'wide'}
      data-figure={String(dtk)}
    >
      <div className="la-quant-controls">
        <div className="la-pill la-glass">
          <button type="button" className="la-pill-btn" data-testid="rd-exit" onClick={act.exit}>
            <X size={18} aria-hidden />
            Avsluta
          </button>
        </div>
        <div className="la-pill la-glass">
          <span className="la-pill-text">
            {session.request.kind === 'repetition' ? 'Repetition · ' : ''}
            {q.section} · {view.index + 1}/{view.total}
            {session.elapsedSeconds != null ? (
              <span role="timer"> · {fmtClock(view.elapsed)}</span>
            ) : null}
          </span>
        </div>
      </div>
      {done ? (
        <div className="la-done-wrap">
          <section className="la-sheet la-done" data-depth="3" data-testid="rd-done">
            <h1 className="la-done-line" ref={heading} tabIndex={-1}>
              {session.request.kind === 'repetition' ? 'Repetitionen klar.' : 'Övningen klar.'}
            </h1>
            <p className="la-done-stats">
              {view.results.length} besvarade · {view.results.filter((r) => r.correct).length} rätt
              {session.elapsedSeconds != null
                ? ` · ${Math.max(1, Math.round(view.elapsed / 60))} min`
                : ''}
            </p>
            <button type="button" className="la-btn" onClick={() => actions.go('idag')}>
              Till Idag
            </button>
          </section>
        </div>
      ) : (
        <div className="la-quant-work">
          <section
            className="la-sheet la-quant-source"
            data-depth="1"
            aria-label={dtk ? 'Underlaget' : 'Förutsättning'}
          >
            <p className="la-eyebrow">
              {q.section} · {q.source.label}
            </p>
            <h1 className="la-h" ref={heading} tabIndex={-1}>
              {dtk ? 'Underlaget' : `Fråga ${view.index + 1}`}
            </h1>
            {dtk && sourceGroup.length > 1 ? (
              <p className="la-source-position">
                Fråga {sourceIndex} av {sourceGroup.length} · samma sida
              </p>
            ) : null}
            {!dtk ? prompt : null}
            {q.figure ? (
              <Figure key={sourceKey} figure={q.figure} images={images} onViewer={setViewer} />
            ) : dtk ? (
              <p>Underlaget saknas.</p>
            ) : null}
            {blocked ? (
              <p role="status">
                {invalid
                  ? 'Du kan avsluta och välja en annan övning.'
                  : 'Alla figurer behöver laddas innan du svarar. Om en figur saknas kan du försöka igen.'}
              </p>
            ) : null}
            {narrow && !dtk ? (
              <div className="la-quant-inline">
                {!feedback ? (
                  <>
                    {answer}
                    {next}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="la-strip"
                      onClick={() => setFront(front === 'explain' ? 'question' : 'explain')}
                    >
                      {front === 'explain' ? 'Visa frågan och ditt svar' : 'Visa förklaringen'}
                      <ChevronDown size={16} aria-hidden />
                    </button>
                    {front === 'explain' ? (
                      <Explanation view={view} act={act} refs={refs} badge={false} />
                    ) : (
                      answer
                    )}
                    {next}
                  </>
                )}
              </div>
            ) : null}
          </section>
          {narrow && !dtk ? null : (
            <section
              className="la-sheet la-quant-task"
              data-depth={feedback ? '3' : '2'}
              data-testid={narrow ? 'rd-sheet' : undefined}
              data-state={feedback ? 'full' : expanded ? 'open' : 'peek'}
              aria-label={feedback ? 'Förklaring' : 'Svar'}
            >
              {narrow && !expanded ? (
                <div className="la-quant-peek">
                  {prompt}
                  <button
                    type="button"
                    className="la-link"
                    aria-expanded={false}
                    onClick={() => setExpanded(true)}
                  >
                    {feedback ? 'Tillbaka till facit' : 'Visa alternativen'}
                    <ChevronUp size={18} aria-hidden />
                  </button>
                </div>
              ) : (
                <>
                  {feedback ? (
                    <button
                      type="button"
                      className="la-strip"
                      onClick={() => setFront(front === 'explain' ? 'question' : 'explain')}
                    >
                      <span>
                        Fråga {view.index + 1} av {view.total}
                      </span>
                      <span>
                        {front === 'explain' ? 'Visa frågan' : 'Visa förklaringen'}
                        <ChevronUp size={16} aria-hidden />
                      </span>
                    </button>
                  ) : null}
                  {narrow ? (
                    <button
                      type="button"
                      className="la-quiet la-quant-fold"
                      onClick={() => setExpanded(false)}
                    >
                      Visa underlaget
                      <ChevronDown size={18} aria-hidden />
                    </button>
                  ) : null}
                  <div className="la-quant-answer" ref={answerScroll}>
                    {feedback && front === 'explain' ? (
                      <Explanation view={view} act={act} refs={refs} badge={false} prompt={dtk} />
                    ) : (
                      answer
                    )}
                  </div>
                  {next}
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export function QuantPrompt({ question: q }: { question: DrillQuestion }) {
  const kva = q.section === 'KVA' ? splitKvaPrompt(q.prompt ?? '') : null
  const nog = q.section === 'NOG' ? parseNogPrompt(q.prompt ?? '') : null
  if (kva)
    return (
      <>
        {kva.condition ? (
          <p>
            <MathText>{kva.condition}</MathText>
          </p>
        ) : null}
        <div className="la-quantities">
          <section>
            <h2>Kvantitet I</h2>
            <MathText>{kva.kvI}</MathText>
          </section>
          <section>
            <h2>Kvantitet II</h2>
            <MathText>{kva.kvII}</MathText>
          </section>
        </div>
      </>
    )
  if (nog)
    return (
      <>
        <p>
          <MathText>{nog.question}</MathText>
        </p>
        <ol className="la-statements">
          <li>
            <span>(1)</span>
            <div>
              <MathText>{nog.statement1}</MathText>
            </div>
          </li>
          <li>
            <span>(2)</span>
            <div>
              <MathText>{nog.statement2}</MathText>
            </div>
          </li>
        </ol>
        {nog.tail ? (
          <p>
            <MathText>{nog.tail}</MathText>
          </p>
        ) : null}
      </>
    )
  return (
    <p>
      <MathText>{q.prompt}</MathText>
    </p>
  )
}

export function Figure({
  figure,
  images,
  onViewer,
}: {
  figure: DrillFigure
  images: ImageReadiness
  onViewer: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const failed = images.failed(figure.src)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [fitWidth, setFitWidth] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const viewport = useRef<HTMLElement>(null)
  const position = useRef({ top: 0, left: 0 })
  const rememberPosition = () => {
    if (viewport.current)
      position.current = { top: viewport.current.scrollTop, left: viewport.current.scrollLeft }
  }
  const close = () => {
    rememberPosition()
    dialog.current?.close()
    setOpen(false)
    onViewer(false)
    trigger.current?.focus()
  }
  const rotate = rotation % 180 !== 0
  const ratio = rotate ? figure.height / figure.width : figure.width / figure.height
  useEffect(() => {
    if (!open) return
    dialog.current?.showModal()
    const el = viewport.current
    if (!el) return
    el.scrollTo?.(position.current)
    const fitToViewport = () =>
      setFitWidth(Math.max(0, Math.min(el.clientWidth - 16, (el.clientHeight - 16) * ratio)))
    fitToViewport()
    const observer = new ResizeObserver(fitToViewport)
    observer.observe(el)
    return () => observer.disconnect()
  }, [open, ratio])
  return (
    <>
      <div className="la-figure" data-testid="rd-figure">
        <img
          key={images.key(figure.src)}
          {...images.props(figure.src)}
          src={`/${figure.src}`}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
        />
      </div>
      {failed ? (
        <button type="button" className="la-link" onClick={() => images.retry(figure.src)}>
          Försök hämta figuren igen
        </button>
      ) : null}
      <button
        type="button"
        className="la-quiet la-figure-open"
        ref={trigger}
        disabled={failed}
        onClick={() => {
          setOpen(true)
          onViewer(true)
        }}
      >
        <Maximize2 size={18} aria-hidden />
        Förstora figur
      </button>
      {open ? (
        <dialog
          className="la-figure-dialog"
          ref={dialog}
          aria-label="Förstorad figur"
          onKeyDown={(event) => {
            // Arrow keys pan the focused figure, rather than changing the bake-off screen.
            if (event.key.startsWith('Arrow') || /^[1-8]$/.test(event.key)) event.stopPropagation()
          }}
          onCancel={(event) => {
            event.preventDefault()
            close()
          }}
          onClose={() => {
            rememberPosition()
            setOpen(false)
            onViewer(false)
            trigger.current?.focus()
          }}
        >
          <div className="la-figure-toolbar">
            <button type="button" className="la-quiet" onClick={close}>
              <X size={18} aria-hidden />
              Stäng
            </button>
            <button
              type="button"
              className="la-quiet"
              onClick={() => {
                setScale(1)
                setRotation(0)
                viewport.current?.scrollTo?.({ top: 0, left: 0 })
              }}
            >
              Anpassa
            </button>
            <button
              type="button"
              className="la-quiet"
              aria-label="Zooma ut"
              disabled={scale <= 1}
              onClick={() => setScale((s) => Math.max(1, s - 0.5))}
            >
              <ZoomOut size={18} aria-hidden />
            </button>
            <output aria-live="polite">{scale * 100}%</output>
            <button
              type="button"
              className="la-quiet"
              aria-label="Zooma in"
              disabled={scale >= 4}
              onClick={() => setScale((s) => Math.min(4, s + 0.5))}
            >
              <ZoomIn size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="la-quiet"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw size={18} aria-hidden />
              Rotera
            </button>
          </div>
          <section
            className="la-figure-viewport"
            data-rd-keyscope
            ref={viewport}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll region needs keyboard panning
            tabIndex={0}
            aria-label="Figur, rulla med piltangenterna"
          >
            <div
              className="la-figure-canvas"
              style={{ width: fitWidth ? fitWidth * scale : `${scale * 100}%`, aspectRatio: ratio }}
            >
              <img
                src={`/${figure.src}`}
                alt={figure.alt}
                style={{
                  width: rotate ? `${100 / ratio}%` : '100%',
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
              />
            </div>
          </section>
        </dialog>
      ) : null}
    </>
  )
}
