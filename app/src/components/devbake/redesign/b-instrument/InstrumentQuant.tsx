import { ChevronDown, ChevronUp, Maximize2, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { type CSSProperties, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { useDirectionData } from '../directionData'
import { useDrillCore } from '../drillCore'
import { type DirectionProps, fmtClock, useKeyMap, useSheet } from '../r1Kit'
import type { DrillFigure, DrillQuestion, DrillSessionView } from '../viewModel'
import { AnswerSummary, Explanation, Options } from './InstrumentDrill'
import { type ImageState, Kc, nextPlanItem, optionImageId, Segs, useImageReadiness } from './parts'

export function InstrumentQuant(props: DirectionProps) {
  const { data, actions } = useDirectionData()
  const session = props.screen === 7 ? data.drills.dtk : data.drills.quant
  if (!session.questions.length)
    return (
      <div className="in-done">
        <h1>Frågan är inte tillgänglig</h1>
        <button
          type="button"
          className="in-btn2"
          data-testid="rd-exit"
          onClick={() => actions.go('ova')}
        >
          Till Öva
        </button>
      </div>
    )
  return (
    <QuantSession
      key={`${session.id}:${session.questions.map((q) => q.qid).join('|')}`}
      {...props}
      session={session}
    />
  )
}

function QuantSession({
  session,
  width,
  live,
  screen,
}: DirectionProps & { session: DrillSessionView }) {
  const { data, actions } = useDirectionData()
  const { view, act, refs } = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const q = view.question
  const phone = width === 'phone'
  const dtk = screen === 7
  const feedback = view.phase === 'feedback'
  const done = view.phase === 'done'
  const [focus, setFocus] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [exOpen, setExOpen] = useState(view.correct === false)
  const images = useImageReadiness()
  const [answerWidth, setAnswerWidth] = useState(452)
  const workspace = useRef<HTMLDivElement>(null)
  const answerScroll = useRef<HTMLDivElement>(null)
  const peek = useRef<HTMLDivElement>(null)
  const { state: sheet, setState: setSheet, toggle, grab } = useSheet(view)
  const missing = !q.prompt || !q.options?.length || (q.section === 'DTK' && !q.figure)
  const figureState = q.figure ? images.state(`source:${q.figure.src}`) : 'ready'
  const optionFigures = (q.options ?? []).flatMap((option) =>
    option.figure ? [optionImageId(q, option.letter, option.figure.src)] : [],
  )
  const optionError = optionFigures.some((id) => images.state(id) === 'error')
  const available =
    !missing && figureState === 'ready' && optionFigures.every((id) => images.state(id) === 'ready')
  const batchNext = nextPlanItem(data.home.plan)
  const continueAfter = () => (batchNext ? actions.openPlanItem(batchNext.id) : actions.go('ova'))

  useEffect(() => {
    setExOpen(view.correct === false)
  }, [view.correct])
  // biome-ignore lint/correctness/useExhaustiveDependencies: reseat the answer viewport on question/phase changes
  useEffect(() => {
    answerScroll.current?.scrollTo?.({ top: 0 })
  }, [view.index, view.phase])
  // biome-ignore lint/correctness/useExhaustiveDependencies: remeasure the newly rendered prompt
  useLayoutEffect(() => {
    if (!phone || !dtk || sheet !== 'peek') return
    const el = peek.current
    if (!el) return
    const fitPeek = () => {
      const height = workspace.current?.clientHeight ?? 0
      if (height > 0 && el.scrollHeight + 100 > height * 0.45) setSheet('open')
    }
    fitPeek()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fitPeek)
    observer?.observe(el)
    return () => observer?.disconnect()
  }, [phone, dtk, sheet, setSheet, q.qid])

  const advance = () => {
    if (done) continueAfter()
    else if (feedback) act.next()
    else if (available) act.lock()
  }
  const keys: Record<string, () => void> = {
    Enter: advance,
    ' ': advance,
    f: () => setFocus((on) => !on),
    x: () => {
      if (feedback) setExOpen((on) => !on)
    },
    Escape: () => setFocus(false),
  }
  for (const letter of view.letters) {
    keys[letter.toLowerCase()] = () => {
      if (available) act.select(letter)
    }
    keys[`Shift+${letter.toLowerCase()}`] = () => {
      if (available) act.toggleEliminate(letter)
    }
  }
  useKeyMap(keys, live && !expanded)

  const status = (node: HTMLImageElement, state: ImageState) => {
    if (q.figure) images.report(`source:${q.figure.src}`, node, state)
  }
  const figureGroup = session.questions.filter(
    (question) => q.figure && question.figure?.src === q.figure.src,
  )
  const source = q.figure ? (
    <>
      <FigureWorkspace
        key={q.figure.src}
        figure={q.figure}
        onStatus={status}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      {figureGroup.length > 1 ? (
        <p className="in-figure-alt">
          {figureGroup.findIndex((question) => question.qid === q.qid) + 1} av {figureGroup.length}{' '}
          frågor · samma sida
        </p>
      ) : null}
    </>
  ) : null
  const prompt = (
    <div className="in-quant-prompt" data-testid="rd-quant-prompt">
      <QuantPrompt question={q} />
    </div>
  )
  const body = (
    <>
      {feedback ? (
        <>
          <AnswerSummary key={q.qid} view={view} />
          {exOpen || !view.explanation ? (
            <Explanation view={view} act={act} refs={refs} />
          ) : (
            <button type="button" className="in-show-ex" onClick={() => setExOpen(true)}>
              Visa förklaringen<Kc>X</Kc>
            </button>
          )}
        </>
      ) : (
        <>
          {dtk || phone ? prompt : null}
          {missing ? (
            <p className="in-quant-notice">
              {q.section === 'DTK' && !q.figure
                ? 'Underlaget saknas. Frågan kan inte besvaras här.'
                : 'Frågan är inte tillgänglig.'}
            </p>
          ) : null}
          {optionError ? (
            <p role="status" className="in-quant-notice">
              Ett svarsalternativ kunde inte visas. Frågan kan inte besvaras här.
            </p>
          ) : null}
          <Options
            view={view}
            act={act}
            quant
            disabled={!available}
            onFigureStatus={images.report}
          />
        </>
      )}
    </>
  )
  const foot = (
    <div className="in-qfoot">
      {feedback ? (
        <button type="button" className="in-btn" data-testid="rd-next" onClick={act.next}>
          {view.index + 1 === view.total ? 'Avsluta övningen' : 'Nästa fråga'}
          <Kc>↵</Kc>
        </button>
      ) : (
        <button
          type="button"
          className="in-btn"
          data-testid="rd-lock"
          disabled={!available || !view.selected}
          onClick={() => {
            if (available) act.lock()
          }}
        >
          {view.selected ? `Svara ${view.selected}` : 'Välj ett alternativ'}
          <Kc>↵</Kc>
        </button>
      )}
    </div>
  )

  return (
    <div
      className="in-quant"
      data-phone={String(phone)}
      data-dtk={String(dtk)}
      data-focus={String(focus)}
      ref={workspace}
    >
      <header className="in-quant-top">
        <button type="button" className="in-btn2" data-testid="rd-exit" onClick={act.exit}>
          Avsluta
        </button>
        <span className="in-crumbs">
          <span>{session.request.kind === 'repetition' ? 'Repetera' : 'Öva'}</span>
          <i aria-hidden>/</i>
          <b>{q.section}</b>
        </span>
        <span className="in-spacer" />
        <span className="in-num">{done ? 'Klar' : `${view.index + 1} av ${view.total}`}</span>
        {!phone ? (
          <Segs
            total={view.total}
            done={view.results.length}
            now={view.index}
            label={`${view.results.length} av ${view.total} besvarade`}
          />
        ) : null}
        {session.elapsedSeconds != null ? (
          <span className="in-timer" role="timer">
            {fmtClock(view.elapsed)}
          </span>
        ) : null}
        {!phone ? (
          <button
            type="button"
            className="in-btn2"
            aria-pressed={focus}
            onClick={() => setFocus(!focus)}
          >
            {focus ? 'Lämna fokus' : 'Fokus'}
            <Kc>F</Kc>
          </button>
        ) : null}
      </header>
      {done ? (
        <div className="in-scroll in-quant-done">
          <div className="in-done">
            <span className="in-pane-label">{session.title}</span>
            <h1>Övningen är klar</h1>
            <p className="in-done-facts">
              <span className="in-num">
                {view.results.filter((r) => r.correct).length} av {view.results.length}
              </span>{' '}
              rätt
            </p>
            <button type="button" className="in-btn" onClick={continueAfter}>
              {batchNext ? `Nästa: ${batchNext.title}` : 'Till Öva'}
            </button>
          </div>
        </div>
      ) : phone ? (
        <>
          <div className="in-quant-scroll">
            {source}
            {dtk ? (
              <div className="in-figure-clearance" aria-hidden />
            ) : (
              <section className="in-pane">
                <div className="in-qbody">{body}</div>
                {foot}
              </section>
            )}
          </div>
          {dtk ? (
            <section
              className="in-sheet"
              data-testid="rd-sheet"
              data-state={sheet}
              aria-label="Fråga och svar"
            >
              <div className="in-sheet-top">
                <button
                  type="button"
                  className="in-grab"
                  aria-label={sheet === 'peek' ? 'Visa frågan' : 'Visa underlaget'}
                  aria-expanded={sheet !== 'peek'}
                  {...grab}
                />
                <div className="in-sheet-head">
                  <span className="in-pane-label">
                    Fråga {view.index + 1}
                    {feedback ? ' · facit' : ''}
                  </span>
                  <span className="in-spacer" />
                  <button
                    type="button"
                    className="in-ghost"
                    onClick={() => setSheet(sheet === 'peek' ? 'open' : 'peek')}
                  >
                    {sheet === 'peek' ? 'Öppna' : 'Visa underlaget'}
                    <ChevronDown size={16} aria-hidden />
                  </button>
                </div>
              </div>
              <div className="in-sheet-body" ref={answerScroll}>
                {sheet === 'peek' ? (
                  <div ref={peek}>
                    {feedback ? <p>Svaret är rättat.</p> : prompt}
                    <button type="button" className="in-peekctl" onClick={toggle}>
                      {feedback ? 'Tillbaka till facit' : 'Visa alternativen'}
                      <ChevronUp size={16} aria-hidden />
                    </button>
                  </div>
                ) : (
                  body
                )}
              </div>
              {sheet === 'peek' ? null : foot}
            </section>
          ) : null}
        </>
      ) : (
        <div
          className="in-quant-columns"
          style={{ '--in-quant-answer': `${answerWidth}px` } as CSSProperties}
        >
          <section className="in-pane">
            <div className="in-pane-head">
              <span className="in-pane-label">{dtk ? 'Underlag' : 'Uppgift'}</span>
              <span className="in-spacer" />
              <span>{q.source.label}</span>
            </div>
            <div className="in-scroll">
              {source}
              {!dtk ? (
                <div className="in-qbody">{prompt}</div>
              ) : !q.figure ? (
                <p className="in-qbody">Underlaget saknas.</p>
              ) : null}
            </div>
          </section>
          {/* biome-ignore lint/a11y/useSemanticElements: keyboard-operable valued splitter */}
          <div
            className="in-handle"
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Svarspanelens bredd"
            aria-valuemin={360}
            aria-valuemax={640}
            aria-valuenow={answerWidth}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
              e.preventDefault()
              setAnswerWidth((w) =>
                Math.max(360, Math.min(640, w + (e.key === 'ArrowLeft' ? 20 : -20))),
              )
            }}
            onPointerDown={(e) => e.currentTarget.setPointerCapture?.(e.pointerId)}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return
              const right = workspace.current?.getBoundingClientRect().right
              if (right != null) setAnswerWidth(Math.max(360, Math.min(640, right - e.clientX - 8)))
            }}
          />
          <section className="in-pane">
            <div className="in-pane-head">
              <span className="in-pane-label">{feedback ? 'Facit' : 'Svar'}</span>
            </div>
            <div className="in-scroll" ref={answerScroll}>
              <div className="in-qbody">{body}</div>
            </div>
            {foot}
          </section>
        </div>
      )}
      {!phone && !focus ? (
        <footer className="in-statusbar">
          <span className="in-hint">
            {feedback ? (
              <>
                <Kc>↵</Kc> nästa <Kc>X</Kc> förklaringen
              </>
            ) : done ? (
              'Övningen är klar'
            ) : (
              <>
                <Kc>A</Kc>–<Kc>{view.letters.at(-1) ?? 'D'}</Kc> välj <Kc>⇧</Kc> + bokstav stryk{' '}
                <Kc>↵</Kc> svara
              </>
            )}
          </span>
          <span className="in-spacer" />
          <span>{view.results.length} besvarade</span>
        </footer>
      ) : null}
    </div>
  )
}

function QuantPrompt({ question }: { question: DrillQuestion }) {
  const text = question.prompt ?? ''
  const kva = question.section === 'KVA' ? splitKvaPrompt(text) : null
  const nog = question.section === 'NOG' ? parseNogPrompt(text) : null
  if (kva)
    return (
      <>
        {kva.condition ? (
          <p className="in-quant-condition">
            <MathText>{kva.condition}</MathText>
          </p>
        ) : null}
        <dl className="in-quant-cells">
          <div>
            <dt>Kvantitet I</dt>
            <dd>
              <MathText>{kva.kvI}</MathText>
            </dd>
          </div>
          <div>
            <dt>Kvantitet II</dt>
            <dd>
              <MathText>{kva.kvII}</MathText>
            </dd>
          </div>
        </dl>
      </>
    )
  if (nog)
    return (
      <>
        <p>
          <MathText>{nog.question}</MathText>
        </p>
        <dl className="in-quant-cells">
          <div>
            <dt>(1)</dt>
            <dd>
              <MathText>{nog.statement1}</MathText>
            </dd>
          </div>
          <div>
            <dt>(2)</dt>
            <dd>
              <MathText>{nog.statement2}</MathText>
            </dd>
          </div>
        </dl>
        {nog.tail ? (
          <p>
            <MathText>{nog.tail}</MathText>
          </p>
        ) : null}
      </>
    )
  return (
    <p>
      <MathText>{text}</MathText>
    </p>
  )
}

function FigureWorkspace({
  figure,
  onStatus,
  expanded,
  setExpanded,
}: {
  figure: DrillFigure
  onStatus: (node: HTMLImageElement, state: ImageState) => void
  expanded: boolean
  setExpanded: (on: boolean) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const img = useRef<HTMLImageElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const label = useId()
  const statusRef = useRef(onStatus)
  statusRef.current = onStatus
  const loaded = (node: HTMLImageElement) => {
    setState('ready')
    statusRef.current(node, 'ready')
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: a retry mounts a fresh image
  useLayoutEffect(() => {
    const node = img.current
    if (!node) return
    const state = node.complete && node.naturalWidth > 0 ? 'ready' : 'loading'
    setState(state)
    statusRef.current(node, state)
  }, [attempt])
  useEffect(() => {
    if (expanded) dialog.current?.showModal()
    else if (dialog.current?.open) dialog.current.close()
  }, [expanded])
  const close = () => {
    setExpanded(false)
    trigger.current?.focus()
  }
  const tools = (
    <div className="in-figure-tools">
      <button
        type="button"
        className="in-btn2"
        aria-label="Zooma ut"
        disabled={zoom <= 1}
        onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
      >
        <ZoomOut size={16} aria-hidden />
      </button>
      <span className="in-num" aria-live="polite">
        {zoom * 100} %
      </span>
      <button
        type="button"
        className="in-btn2"
        aria-label="Zooma in"
        disabled={zoom >= 4}
        onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
      >
        <ZoomIn size={16} aria-hidden />
      </button>
      <button
        type="button"
        className="in-btn2"
        onClick={() => {
          setZoom(1)
          setRotation(0)
        }}
      >
        Anpassa
      </button>
      <button type="button" className="in-btn2" onClick={() => setRotation((r) => (r + 90) % 360)}>
        <RotateCw size={16} aria-hidden />
        Rotera
      </button>
    </div>
  )
  const rotated = rotation % 180 !== 0
  const ratio = figure.width / figure.height
  const picture = (modal: boolean) => (
    <section
      className="in-figure-viewport"
      data-rd-keyscope
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the figure viewport must be keyboard-scrollable at zoom
      tabIndex={0}
      aria-label="Figur, rulla för att läsa hela underlaget"
    >
      <div
        className="in-figure-canvas"
        style={{ width: `${zoom * 100}%`, aspectRatio: rotated ? 1 / ratio : ratio }}
      >
        <img
          key={attempt}
          ref={modal ? undefined : img}
          src={`/${figure.src}`}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          onLoad={modal ? undefined : (event) => loaded(event.currentTarget)}
          onError={
            modal
              ? undefined
              : (event) => {
                  setState('error')
                  statusRef.current(event.currentTarget, 'error')
                }
          }
          style={{
            width: rotated ? `${100 * ratio}%` : '100%',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
        />
      </div>
    </section>
  )
  return (
    <div className="in-figure" data-testid="rd-figure">
      <div className="in-figure-bar">
        <button type="button" className="in-btn2" ref={trigger} onClick={() => setExpanded(true)}>
          <Maximize2 size={16} aria-hidden />
          Förstora figur
        </button>
        {!expanded ? tools : null}
      </div>
      {state !== 'ready' ? (
        <div className="in-quant-notice" role="status">
          {state === 'loading'
            ? 'Laddar underlaget…'
            : 'Underlaget kunde inte hämtas. Frågan kan inte besvaras här.'}
          {state === 'error' ? (
            <button
              type="button"
              className="in-btn2"
              onClick={() => {
                setState('loading')
                setAttempt((n) => n + 1)
              }}
            >
              Försök igen
            </button>
          ) : null}
        </div>
      ) : null}
      {picture(false)}
      <p className="in-figure-alt">{figure.alt}</p>
      <dialog
        className="in-figure-dialog"
        ref={dialog}
        aria-labelledby={label}
        onCancel={(e) => {
          e.preventDefault()
          close()
        }}
        onClose={close}
      >
        {expanded ? (
          <>
            <header className="in-figure-bar">
              <h2 id={label}>Underlag</h2>
              <span className="in-spacer" />
              <button type="button" className="in-btn2" onClick={close}>
                <X size={16} aria-hidden />
                Stäng figur
              </button>
            </header>
            {tools}
            {picture(true)}
            <p className="in-figure-alt">{figure.alt}</p>
          </>
        ) : null}
      </dialog>
    </div>
  )
}
