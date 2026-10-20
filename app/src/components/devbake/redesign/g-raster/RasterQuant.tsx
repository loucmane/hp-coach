import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useDrillCore } from '@/components/devbake/redesign/drillCore'
import {
  type DirectionProps,
  fmtClock,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillOptionFigure,
  DrillQuestion,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { RasterFeedback } from './RasterFeedback'
import type { RasterDrillState } from './RasterParts'

export function RasterQuant(props: DirectionProps) {
  const { data, actions } = useDirectionData()
  const session = props.screen === 7 ? data.drills.dtk : data.drills.quant
  if (!session.questions.length)
    return (
      <main className="ra-done">
        <button type="button" data-testid="rd-exit" onClick={() => actions.drill.exit?.()}>
          ← Avsluta
        </button>
        <h1>Frågan saknar fullständigt innehåll</h1>
        <button type="button" className="ra-primary" onClick={() => actions.go('ova')}>
          Till Öva
        </button>
      </main>
    )
  return <QuantSession key={session.id} {...props} session={session} />
}

function QuantSession({
  session,
  live,
  width,
  screen,
}: DirectionProps & { session: DrillSessionView }) {
  const { actions } = useDirectionData()
  const state = useDrillCore({
    ...session,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const { view, act } = state
  const question = view.question
  const sheet = useSheet(view)
  const tray = screen === 7 && width === 'phone'
  const peek = tray && sheet.state === 'peek'
  const [clock, setClock] = useState(true)
  const [zoom, setZoom] = useState(false)
  const [images, setImages] = useState<Record<string, ImageState>>({})
  const imageStatus = useCallback<ImageStatus>((key, status) => {
    setImages((old) => {
      if (old[key] === status || (status === null && !(key in old))) return old
      const next = { ...old }
      if (status === null) delete next[key]
      else next[key] = status
      return next
    })
  }, [])
  const required = [
    ...(question.figure ? [`figure:${question.figure.src}`] : []),
    ...(question.options?.flatMap((o) =>
      o.figure ? [optionImageKey(view.index, o.letter, o.figure.src)] : [],
    ) ?? []),
  ]
  const content =
    !!question.prompt?.trim() &&
    !!question.options?.length &&
    (question.section !== 'DTK' || !!question.figure)
  const ready = content && required.every((key) => images[key] === 'ready')
  const failedImage = required.some((key) => images[key] === 'error')
  const advance = () => {
    if (view.phase === 'feedback') act.next()
    else if (view.phase === 'question' && ready) act.lock()
  }
  const keys: Record<string, () => void> = { Enter: advance, ' ': advance }
  for (const letter of view.letters) {
    keys[letter.toLowerCase()] = () => {
      act.select(letter)
      if (tray) sheet.setState('open')
    }
    keys[`Shift+${letter.toLowerCase()}`] = () => act.toggleEliminate(letter)
  }
  useKeyMap(keys, live && !zoom)
  const answerId = useId()
  const questionScroll = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the answer side only at a new question or verdict
  useEffect(() => {
    if (questionScroll.current) questionScroll.current.scrollTop = 0
  }, [view.index, view.phase])
  return (
    <main className="ra-drill ra-quant" data-figure-drill={String(screen === 7)}>
      <header className="ra-drill-bar">
        <button type="button" className="ra-exit" data-testid="rd-exit" onClick={act.exit}>
          ← Avsluta
        </button>
        <span className="ra-badge">
          {question.section} / {session.request.kind === 'repetition' ? 'Repetition' : 'Övning'}
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
          <p className="ra-label">{session.title}</p>
          <h1>{session.request.kind === 'repetition' ? 'Repetitionen klar' : 'Övningen klar'}</h1>
          <p className="ra-display">
            {view.results.filter((r) => r.correct).length}
            <small>/{view.results.length}</small>
          </p>
          <p>
            Rätt av besvarade{session.elapsedSeconds != null ? ` · ${fmtClock(view.elapsed)}` : ''}
          </p>
          <button type="button" className="ra-primary" onClick={() => actions.go('ova')}>
            Till Öva <span aria-hidden>↗</span>
          </button>
        </section>
      ) : (
        <div className="ra-drill-grid">
          <div className="ra-quant-workspace">
            <p className="ra-label">
              {screen === 7 ? 'Underlaget' : question.section} / {question.source.label}
            </p>
            {screen !== 7 ? <QuantPrompt question={question} /> : null}
            {question.figure ? (
              <FigureWorkspace
                key={question.figure.src}
                figure={question.figure}
                onStatus={imageStatus}
                onZoom={setZoom}
                onExit={act.exit}
              />
            ) : screen === 7 ? (
              <p className="ra-missing">Underlaget saknas.</p>
            ) : null}
          </div>
          <section
            className="ra-question-sheet"
            data-testid={tray ? 'rd-sheet' : undefined}
            data-state={tray ? sheet.state : 'desktop'}
            aria-label={view.phase === 'feedback' ? 'Facit' : 'Fråga och svar'}
          >
            {tray ? (
              <button
                type="button"
                className="ra-sheet-toggle"
                aria-expanded={!peek}
                aria-controls={answerId}
                {...sheet.grab}
              >
                <span>
                  {view.phase === 'feedback' ? 'Facit' : `Fråga ${view.index + 1} av ${view.total}`}
                </span>
                <span>{peek ? 'Visa alternativen ↑' : 'Visa underlaget ↓'}</span>
              </button>
            ) : null}
            {peek ? (
              <p className="ra-peek-prompt">
                <MathText>{question.prompt}</MathText>
              </p>
            ) : null}
            <div className="ra-answer-area" id={answerId} hidden={peek}>
              <div className="ra-question-scroll" ref={questionScroll}>
                {screen === 7 ? (
                  <div className="ra-dtk-prompt">
                    <QuantPrompt question={question} />
                  </div>
                ) : null}
                {view.phase === 'feedback' ? (
                  <RasterFeedback {...state} />
                ) : (
                  <div className="ra-question">
                    <h2>Välj svar</h2>
                    <p className="ra-key-hints">
                      {view.letters.join('–')} väljer · ⇧ + bokstav stryker · ↵ svarar
                    </p>
                    {!content ? (
                      <p className="ra-missing">Frågan saknar fullständigt innehåll.</p>
                    ) : null}
                    <QuantOptions {...state} onStatus={imageStatus} />
                  </div>
                )}
              </div>
              <footer className="ra-actionbar">
                {view.phase === 'question' ? (
                  <>
                    <span aria-live="polite">
                      {!ready
                        ? failedImage
                          ? 'En bild kunde inte laddas'
                          : 'Inväntar fullständigt innehåll'
                        : view.selected
                          ? `Ditt val: ${view.selected}`
                          : 'Välj ett alternativ'}
                    </span>
                    <button
                      type="button"
                      className="ra-primary"
                      data-testid="rd-lock"
                      disabled={!ready || !view.selected}
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
                      {view.index + 1 === view.total ? 'Slutför övningen' : 'Nästa fråga'}{' '}
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

function QuantPrompt({ question }: { question: DrillQuestion }) {
  const prompt = question.prompt ?? ''
  const kva = question.section === 'KVA' ? splitKvaPrompt(prompt) : null
  const nog = question.section === 'NOG' ? parseNogPrompt(prompt) : null
  const id = useId()
  return (
    <section className="ra-quant-prompt" data-testid="rd-quant-prompt" aria-labelledby={id}>
      <h1 id={id}>
        {question.section === 'KVA'
          ? 'Kvantitativa jämförelser'
          : question.section === 'NOG'
            ? 'Tillräcklig information'
            : question.section === 'DTK'
              ? 'Läs av underlaget'
              : 'Matematisk problemlösning'}
      </h1>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll long equations */}
      <section className="ra-math-scroll" aria-label="Frågeinnehåll" tabIndex={0}>
        {kva ? (
          <>
            {kva.condition ? (
              <p>
                <MathText>{kva.condition}</MathText>
              </p>
            ) : null}
            <dl className="ra-givens">
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
        ) : nog ? (
          <>
            <p>
              <MathText>{nog.question}</MathText>
            </p>
            <dl className="ra-givens">
              <div>
                <dt>Påstående (1)</dt>
                <dd>
                  <MathText>{nog.statement1}</MathText>
                </dd>
              </div>
              <div>
                <dt>Påstående (2)</dt>
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
        ) : (
          <p>
            <MathText>{prompt}</MathText>
          </p>
        )}
      </section>
    </section>
  )
}

type ImageState = 'loading' | 'ready' | 'error'
type ImageStatus = (key: string, status: ImageState | null) => void

function optionImageKey(index: number, letter: string, src: string) {
  return `option:${index}:${letter}:${src}`
}

function ContentImage({
  figure,
  onStatus,
  imageKey = `figure:${figure.src}`,
}: {
  figure: DrillFigure | DrillOptionFigure
  onStatus?: ImageStatus
  imageKey?: string
}) {
  const ref = useRef<HTMLImageElement>(null)
  // Readiness belongs to this mounted image, not a URL seen earlier in the
  // session. Reconcile cached loads before paint and unregister on unmount.
  useLayoutEffect(() => {
    if (!onStatus) return
    const img = ref.current
    onStatus(imageKey, img?.complete ? (img.naturalWidth > 0 ? 'ready' : 'error') : 'loading')
    return () => onStatus(imageKey, null)
  }, [imageKey, onStatus])
  return (
    <img
      ref={ref}
      src={`/${figure.src.replace(/^\/+/, '')}`}
      alt={figure.alt}
      width={figure.width}
      height={figure.height}
      draggable={false}
      onLoad={() => onStatus?.(imageKey, 'ready')}
      onError={() => onStatus?.(imageKey, 'error')}
    />
  )
}

function QuantOptions({ view, act, onStatus }: RasterDrillState & { onStatus: ImageStatus }) {
  return (
    <ol className="ra-options" aria-label="Svarsalternativ">
      {view.question.options?.map((option) => {
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
              className="ra-option"
              data-testid={`rd-quant-option-${option.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(option.letter)}
            >
              <kbd>{option.letter}</kbd>
              <span>
                <span className="ra-sr">{eliminated ? 'Struket alternativ: ' : ''}</span>
                <MathText>{option.text}</MathText>
                {option.figure ? (
                  <ContentImage
                    key={option.figure.src}
                    figure={option.figure}
                    imageKey={optionImageKey(view.index, option.letter, option.figure.src)}
                    onStatus={onStatus}
                  />
                ) : null}
              </span>
              <span className="ra-option-mark" aria-hidden>
                {selected ? '●' : ''}
              </span>
            </button>
            <button
              type="button"
              className="ra-eliminate"
              data-testid={`rd-eliminate-${option.letter}`}
              aria-pressed={eliminated}
              aria-label={
                eliminated ? `Ångra strykning av ${option.letter}` : `Stryk ${option.letter}`
              }
              onClick={() => act.toggleEliminate(option.letter)}
            >
              {eliminated ? '↶' : '╱'}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function FigureWorkspace({
  figure,
  onStatus,
  onZoom,
  onExit,
}: {
  figure: DrillFigure
  onStatus: ImageStatus
  onZoom: (open: boolean) => void
  onExit: () => void
}) {
  const [status, setStatus] = useState<ImageState>('loading')
  const [open, setOpen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const pane = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const report = useCallback<ImageStatus>(
    (key, next) => {
      setStatus(next ?? 'loading')
      onStatus(key, next)
    },
    [onStatus],
  )
  const rotated = rotation % 180 !== 0
  const ratio = figure.width / figure.height
  const close = () => {
    dialog.current?.close()
    setOpen(false)
    onZoom(false)
    opener.current?.focus()
  }
  const image = (trackReadiness = false) => (
    <div
      className="ra-figure-frame"
      style={
        {
          aspectRatio: String(rotated ? 1 / ratio : ratio),
          '--ra-image-width': `${rotated ? 100 * ratio : 100}%`,
          '--ra-image-height': `${rotated ? 100 / ratio : 100}%`,
          '--ra-rotation': `${rotation}deg`,
        } as React.CSSProperties
      }
    >
      <ContentImage figure={figure} onStatus={trackReadiness ? report : undefined} />
    </div>
  )
  const rotate = () => setRotation((value) => (value + 90) % 360)
  const reset = () => {
    setScale(1)
    setRotation(0)
    pane.current?.scrollTo({ top: 0, left: 0 })
  }
  return (
    <figure className="ra-figure-workspace" data-testid="rd-figure">
      {image(true)}
      {status !== 'ready' ? (
        <p role="status">
          {status === 'error'
            ? 'Underlaget kunde inte laddas. Avsluta och välj en annan övning.'
            : 'Laddar underlaget…'}
        </p>
      ) : null}
      <figcaption>{figure.alt}</figcaption>
      <div className="ra-figure-tools">
        <button
          type="button"
          ref={opener}
          disabled={status !== 'ready'}
          onClick={() => {
            setOpen(true)
            onZoom(true)
            dialog.current?.showModal()
          }}
        >
          Förstora
        </button>
        <button type="button" onClick={rotate}>
          Rotera ↻
        </button>
        <button type="button" onClick={reset}>
          Återställ
        </button>
      </div>
      <dialog
        ref={dialog}
        className="ra-figure-dialog"
        aria-label="Förstorad figur"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        onClose={() => {
          setOpen(false)
          onZoom(false)
        }}
      >
        {open ? (
          <>
            <header className="ra-figure-tools">
              <button
                type="button"
                data-testid="rd-exit"
                onClick={() => {
                  close()
                  onExit()
                }}
              >
                ← Avsluta
              </button>
              <button type="button" onClick={close}>
                Till frågan ×
              </button>
            </header>
            <section
              ref={pane}
              className="ra-figure-pan"
              data-rd-keyscope
              aria-label="Förstorad figur, rulla för att läsa hela underlaget"
              // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to the image scroll region
              tabIndex={0}
              onPointerDown={(event) => {
                if (event.pointerType !== 'mouse' || event.button !== 0) return
                const el = event.currentTarget
                drag.current = {
                  x: event.clientX,
                  y: event.clientY,
                  left: el.scrollLeft,
                  top: el.scrollTop,
                }
                el.setPointerCapture?.(event.pointerId)
              }}
              onPointerMove={(event) => {
                if (!drag.current) return
                event.currentTarget.scrollLeft = drag.current.left + drag.current.x - event.clientX
                event.currentTarget.scrollTop = drag.current.top + drag.current.y - event.clientY
              }}
              onPointerUp={() => {
                drag.current = null
              }}
              onPointerCancel={() => {
                drag.current = null
              }}
            >
              <div style={{ width: `${scale * 100}%` }}>{image()}</div>
            </section>
            <footer className="ra-figure-tools">
              <button
                type="button"
                aria-label="Zooma ut"
                disabled={scale <= 1}
                onClick={() => setScale((value) => Math.max(1, value / 1.5))}
              >
                −
              </button>
              <output aria-live="polite">{Math.round(scale * 100)}%</output>
              <button
                type="button"
                aria-label="Zooma in"
                disabled={scale >= 6}
                onClick={() => setScale((value) => Math.min(6, value * 1.5))}
              >
                ＋
              </button>
              <button type="button" onClick={rotate}>
                Rotera ↻
              </button>
              <button type="button" onClick={reset}>
                Återställ
              </button>
            </footer>
          </>
        ) : null}
      </dialog>
    </figure>
  )
}
