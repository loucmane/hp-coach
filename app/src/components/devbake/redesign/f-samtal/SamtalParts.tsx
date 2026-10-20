// Samtal's small shared parts: the speech marks every screen is built from.
//   - Coach / You    — a turn: the coach's on a faint oat tint (left, a
//                      small "speaker" corner top left), yours in plum
//                      (right). No avatars, no typing dots: a turn is there
//                      at once, with a 120 ms fade.
//   - Replies, Chip  — the reply buttons that stand where your next turn
//                      will go; the coach proposes, you choose. Never a text
//                      field.
//   - Divider        — the centred, dated line a conversation opens with.
//   - Cites, Rich    — ¶ links into the passage and "(steg N)" links; Rich
//                      renders the explanation's math (MathText) as it goes.
//   - Dots, DoorIcon, Kbd, Mark — progress, the doors' icons, keys, the logo.
//   - FigureImg      — a figure's image that says when it is there or has
//                      failed, a cached one at once; the quant drill holds
//                      the answer on it (FigureLoadsContext), and so do a
//                      running Provpass and ELF, each mounted image a load
//                      of its own (useFigureLoadState, fresh).
//   - FigurePage, FigurePan, FigureInspector — a printed page (DTK) as a
//                      document: in a box of its own shape, turned in quarter
//                      steps, panned by drag or keys, enlarged over the
//                      screen. (The quant drill keeps its own copy in
//                      SamtalQuant until its next batch.)
//   - Gate           — the coach's question before a step that cannot be
//                      taken back (a timed pass's start, its hand-in, giving
//                      it up): two replies, over the whole screen.
//   - ScoreCard, Scale — the prognosis on HP's scale and its caveat as the
//                      card's footnote (Idag, Framsteg).
//   - ContentLang, En — the language of a drill's content (ELF: English):
//                      the passage, the question, the options and the
//                      explanation are marked lang="en" in place, while the
//                      coach's Swedish words around them stay Swedish.
//   - bringIntoView  — a section the reader asked for, scrolled to the top
//                      of its own scroller (Konto, Uppslag).
//   - words, count   — numbers said the way the coach says them.

import { BookOpen, Minus, PenLine, Plus, RotateCw, Sun, Timer, TrendingUp, X } from 'lucide-react'
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { prefersReducedMotion, splitStepRefs } from '@/components/devbake/redesign/drillCore'
import {
  type Destination,
  fmtDelta,
  fmtScore,
  useDismiss,
} from '@/components/devbake/redesign/r1Kit'
import type { DrillFigure, PrognosisView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'

// ── Turns ────────────────────────────────────────────────────────────

type TurnProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  /** Extra classes beside sa-turn. */
  kind?: string
  /** A turn that carries a heading is a section; a plain line a div. */
  as?: 'div' | 'section' | 'li'
  ref?: Ref<HTMLElement>
}

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}

export function Coach({ children, kind, as = 'div', className, ref, ...rest }: TurnProps) {
  const Tag = as
  return (
    <Tag
      // biome-ignore lint/suspicious/noExplicitAny: one ref type across the three tags
      ref={ref as any}
      className={cx('sa-turn', 'sa-turn--coach', kind, className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function You({ children, kind, as = 'div', className, ref, ...rest }: TurnProps) {
  const Tag = as
  return (
    <Tag
      // biome-ignore lint/suspicious/noExplicitAny: one ref type across the three tags
      ref={ref as any}
      className={cx('sa-turn', 'sa-turn--you', kind, className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** The reply buttons: right-aligned, where your answer will stand. */
export function Replies({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('sa-replies', className)}>{children}</div>
}

/** A centred line between hairlines: a date, a place in the unit. */
export function Divider({ children, quiet }: { children: ReactNode; quiet?: boolean }) {
  return (
    <p className={cx('sa-divider', quiet && 'sa-divider--quiet')}>
      <span>{children}</span>
    </p>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="sa-kbd" aria-hidden>
      {children}
    </kbd>
  )
}

// ── The content's language ───────────────────────────────────────────

/** The language of a drill's content when it is not Swedish: an ELF text,
 *  its question, options and explanation are English. Undefined: Swedish,
 *  like the coach. */
export type ContentLang = 'en' | undefined

export const ContentLangContext = createContext<ContentLang>(undefined)

/** A run of the drill's content in its own language (lang="en" for ELF);
 *  the coach's Swedish labels stand outside it. In Swedish content it is a
 *  plain span. */
export function En({ children, className }: { children: ReactNode; className?: string }) {
  const lang = useContext(ContentLangContext)
  return (
    <span className={className} lang={lang}>
      {children}
    </span>
  )
}

// ── Actions that may answer later ────────────────────────────────────

/** An action that answers with a promise (a real host may, though the kit
 *  types it void): its refusal is heard, never left unhandled. */
export function isPromise(value: unknown): value is Promise<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function' &&
    typeof (value as { catch?: unknown }).catch === 'function'
  )
}

// ── Scrolling to what the reader asked for ───────────────────────────

/** Scrolls `el` to just under the top of its own scroller (the page's), and
 *  never the clipping stage around it; instant under reduced motion, a no-op
 *  without layout. */
export function bringIntoView(el: HTMLElement | null, offset = 24): void {
  if (!el) return
  let box: HTMLElement | null = null
  for (let n = el.parentElement; n; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY
    if (y === 'auto' || y === 'scroll') {
      box = n
      break
    }
  }
  if (!box || typeof box.scrollTo !== 'function') return
  const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
  box.scrollTo({
    top: Math.max(0, top - offset),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

// ── Citations ────────────────────────────────────────────────────────

/** ¶ links: each one turns the passage to its paragraph and lights it. */
export function Cites({
  list,
  source,
  act,
}: {
  list: number[]
  source: string
  act: { cite: (n: number, source?: string) => void }
}) {
  if (list.length === 0) return null
  return (
    <span className="sa-cites">
      <span className="sa-cites-see">I texten</span>
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="sa-cite"
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

/** Explanation text, verbatim, with its "(steg 2)" references made into
 *  links to the step and its math rendered. */
export function Rich({ text, act }: { text: string; act: { goToStep: (n: number) => void } }) {
  let at = 0
  return (
    <>
      {splitStepRefs(text).map((seg) => {
        const key = at
        at += seg.text.length
        return seg.kind === 'text' ? (
          <span key={key}>
            <MathText>{seg.text}</MathText>
          </span>
        ) : (
          <button
            key={key}
            type="button"
            className="sa-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}

// ── Progress, doors, mark ────────────────────────────────────────────

/** Answered questions as filled dots, the current one as a ring. */
export function Dots({ total, done, label }: { total: number; done: number; label?: string }) {
  return (
    <span className="sa-dots" role="img" aria-label={label ?? `${done} av ${total} besvarade`}>
      {Array.from({ length: total }, (_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length progress marks
          key={i}
          data-state={i < done ? 'done' : i === done ? 'now' : 'todo'}
        />
      ))}
    </span>
  )
}

const DOOR_ICONS: Record<Destination, typeof Sun> = {
  idag: Sun,
  ova: PenLine,
  provpass: Timer,
  uppslag: BookOpen,
  framsteg: TrendingUp,
}

export function DoorIcon({ id, size = 18 }: { id: Destination; size?: number }) {
  const Icon = DOOR_ICONS[id]
  return <Icon size={size} strokeWidth={1.75} aria-hidden />
}

/** The logo: two speech marks, the coach's and yours, beside the name. */
export function Mark({ name = true }: { name?: boolean }) {
  return (
    <span className="sa-mark" role="img" aria-label="HP-Coach">
      <span className="sa-mark-glyph" aria-hidden>
        <i />
        <i />
      </span>
      {name ? (
        <span className="sa-mark-name" aria-hidden>
          HP-Coach
        </span>
      ) : null}
    </span>
  )
}

// ── Figures ──────────────────────────────────────────────────────────

export type FigureStatus = 'loading' | 'ready' | 'error'

/** Load status and retries, per figure source (a DTK page, a diagram or an
 *  option's image): a failure belongs to its own source and never follows
 *  the reader to the next one. A source not heard from yet is loading. */
export type FigureLoads = {
  status: (src: string) => FigureStatus
  attempt: (src: string) => number
  report: (src: string, s: FigureStatus) => void
  retry: (src: string) => void
}

/** The quant drill's figure loads; null outside it (the reading drill has
 *  no figure to wait for). */
export const FigureLoadsContext = createContext<FigureLoads | null>(null)

/** Figure loads held by a screen that waits for its figures: per source,
 *  loading until heard from; a retry is a new load. */
export function useFigureLoadState(): FigureLoads {
  const [status, setStatus] = useState<Record<string, FigureStatus>>({})
  const [attempts, setAttempts] = useState<Record<string, number>>({})
  return {
    status: (src) => status[src] ?? 'loading',
    attempt: (src) => attempts[src] ?? 0,
    report: (src, s) => setStatus((m) => (m[src] === s ? m : { ...m, [src]: s })),
    retry: (src) => {
      setStatus((m) => ({ ...m, [src]: 'loading' }))
      setAttempts((m) => ({ ...m, [src]: (m[src] ?? 0) + 1 }))
    },
  }
}

type FigureImgProps = Omit<ComponentProps<'img'>, 'ref' | 'onLoad' | 'onError'> & {
  alt: string
  onStatus: (s: FigureStatus) => void
  /** Each mounted image is a load of its own: it reports `loading` when it
   *  mounts unless the browser already holds it, so a source shown again
   *  is waited for again. */
  fresh?: boolean
}

/** A figure's image that reports when it is there or has failed — a cached
 *  one too: an image already complete when it mounts reports at once, and
 *  never waits for a load event that has come and gone. Key it by source
 *  and attempt, so another source, or a retry, is a new image, checked
 *  again. Only a mounted image speaks: one that has gone (a tray folded, a
 *  retry in its place) never reports for the image after it. */
export function FigureImg({ alt, onStatus, fresh = false, ...img }: FigureImgProps) {
  const ref = useRef<HTMLImageElement>(null)
  const report = useRef(onStatus)
  report.current = onStatus
  const freshRef = useRef(fresh)
  const mounted = useRef(false)
  useLayoutEffect(() => {
    mounted.current = true
    const el = ref.current
    if (el?.complete && el.naturalWidth > 0) report.current('ready')
    else if (freshRef.current) report.current('loading')
    return () => {
      mounted.current = false
    }
  }, [])
  const say = (s: FigureStatus) => {
    if (mounted.current) report.current(s)
  }
  return (
    <img ref={ref} alt={alt} {...img} onLoad={() => say('ready')} onError={() => say('error')} />
  )
}

/** In place: from the page's width (100 %) to three times it. */
export const FIGURE_ZOOMS = [1, 1.25, 1.5, 2, 2.5, 3]
/** Enlarged: from the whole page on screen (100 %) to four times it. */
const INSPECT_ZOOMS = [1, 1.5, 2, 3, 4]
/** How far an arrow key moves a page. */
const PAN_STEP = 48

export function pct(zoom: number): string {
  return `${Math.round(zoom * 100)} %`
}

/** The page image in a box of its own proportions, turned in quarter
 *  steps (the box takes the turned page's shape). It keeps its size while
 *  it loads, so nothing around it moves. */
export function FigurePage({
  figure,
  rotation,
  width,
  status,
  attempt,
  onStatus,
  fresh = false,
}: {
  figure: DrillFigure
  rotation: number
  width: string
  status: FigureStatus
  attempt: number
  onStatus: (s: FigureStatus) => void
  fresh?: boolean
}) {
  const turned = rotation % 180 !== 0
  const ratio = figure.width / figure.height
  return (
    <div
      className="sa-fig-box"
      data-status={status}
      data-turned={String(turned)}
      aria-busy={status === 'loading'}
      style={{ width, aspectRatio: String(turned ? 1 / ratio : ratio) }}
    >
      <FigureImg
        // Another page, or a retry, is a new image: nothing carries over.
        key={`${figure.src}#${attempt}`}
        className="sa-fig-img"
        src={`/${figure.src}`}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        draggable={false}
        onStatus={onStatus}
        fresh={fresh}
        style={{
          width: turned ? `${100 * ratio}%` : '100%',
          height: turned ? `${100 / ratio}%` : '100%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      />
      {status === 'loading' ? (
        <span className="sa-fig-wait" aria-hidden>
          Hämtar underlaget …
        </span>
      ) : null}
    </div>
  )
}

/** A region the page pans in: drag with a pointer (touch scrolls as
 *  usual), the arrow keys move it, + and − zoom. It pans itself — a
 *  screen that claims the arrows for its own (a running Provpass keeps
 *  them from the bake-off's switcher) leaves the region its moves — and is
 *  marked as a key scope, so the switcher's ←/→ leave it alone. */
export function FigurePan({
  className,
  label,
  onZoomKey,
  children,
}: {
  className: string
  label: string
  onZoomKey: (dir: 1 | -1) => void
  children: ReactNode
}) {
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || e.pointerType === 'touch') return
    const el = e.currentTarget
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      // No capture (jsdom): the moves still bubble here.
    }
    setGrabbing(true)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const el = e.currentTarget
    el.scrollLeft = d.left - (e.clientX - d.x)
    el.scrollTop = d.top - (e.clientY - d.y)
  }
  const end = () => {
    drag.current = null
    setGrabbing(false)
  }
  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    const el = e.currentTarget
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-PAN_STEP, 0],
      ArrowRight: [PAN_STEP, 0],
      ArrowUp: [0, -PAN_STEP],
      ArrowDown: [0, PAN_STEP],
    }
    const m = moves[e.key]
    if (m) {
      e.preventDefault()
      el.scrollLeft += m[0]
      el.scrollTop += m[1]
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      onZoomKey(1)
    } else if (e.key === '-') {
      e.preventDefault()
      onZoomKey(-1)
    }
  }
  return (
    <section
      className={className}
      data-grabbing={String(grabbing)}
      data-rd-keyscope=""
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region the keyboard pans
      tabIndex={0}
      aria-label={`${label}. Piltangenterna flyttar, plus och minus zoomar.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      {children}
    </section>
  )
}

/** Tab and ⇧Tab go round inside `e.currentTarget`. */
function keepFocusInside(e: ReactKeyboardEvent<HTMLElement>): void {
  if (e.key !== 'Tab') return
  const stops = [
    ...e.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex="0"]',
    ),
  ]
  const first = stops[0]
  const last = stops[stops.length - 1]
  if (!first || !last) return
  if (
    e.shiftKey &&
    (document.activeElement === first || !stops.includes(document.activeElement as HTMLElement))
  ) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

/** "Förstora figur": the page over the whole screen, opaque, with zoom,
 *  rotation and "Stäng figur". It owns the screen until it is closed (Esc
 *  or the button): the caller makes the screen under it inert, and Tab
 *  stays inside. It opens with the whole page on screen. */
export function FigureInspector({
  figure,
  rotation,
  attempt,
  onRotate,
  onStatus,
  onClose,
}: {
  figure: DrillFigure
  rotation: number
  attempt: number
  onRotate: () => void
  onStatus: (s: FigureStatus) => void
  onClose: () => void
}) {
  const titleId = useId()
  const [zoom, setZoom] = useState(0)
  const [room, setRoom] = useState({ w: 0, h: 0 })
  const paneRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const el = paneRef.current
    if (!el) return
    const measure = () => setRoom({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  const turned = rotation % 180 !== 0
  const ratio = figure.width / figure.height
  const shape = turned ? 1 / ratio : ratio
  // The whole page in the pane (less its 24 px padding), then the zoom.
  const fit = room.w > 0 && room.h > 0 ? Math.min(room.w - 48, (room.h - 48) * shape) : 0
  const width =
    fit > 0
      ? `${Math.round(fit * INSPECT_ZOOMS[zoom])}px`
      : `${Math.round(INSPECT_ZOOMS[zoom] * 100)}%`
  const stepZoom = (dir: 1 | -1) =>
    setZoom((z) => Math.min(INSPECT_ZOOMS.length - 1, Math.max(0, z + dir)))

  return (
    <div
      className="sa-inspect"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-rd-keyscope=""
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
          return
        }
        keepFocusInside(e)
      }}
    >
      <header className="sa-inspect-head">
        <h2 className="sa-inspect-title" id={titleId}>
          {figure.alt}
        </h2>
        <fieldset className="sa-inspect-tools" aria-label="Förstoring och rotering">
          <button
            type="button"
            className="sa-tool sa-tool--icon"
            aria-label="Zooma ut"
            disabled={zoom === 0}
            onClick={() => stepZoom(-1)}
          >
            <Minus size={16} strokeWidth={1.75} aria-hidden />
          </button>
          <span className="sa-zoom-n" aria-live="polite">
            {pct(INSPECT_ZOOMS[zoom])}
          </span>
          <button
            type="button"
            className="sa-tool sa-tool--icon"
            aria-label="Zooma in"
            disabled={zoom === INSPECT_ZOOMS.length - 1}
            onClick={() => stepZoom(1)}
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="sa-tool"
            aria-label="Rotera underlaget 90 grader"
            onClick={onRotate}
          >
            <RotateCw size={15} strokeWidth={1.75} aria-hidden />
            Rotera
          </button>
          <button
            type="button"
            className="sa-tool"
            disabled={zoom === 0}
            onClick={() => setZoom(0)}
          >
            Hela sidan
          </button>
        </fieldset>
        <button
          type="button"
          ref={closeRef}
          className="sa-chip sa-chip--primary sa-inspect-close"
          onClick={onClose}
        >
          <X size={17} strokeWidth={2} aria-hidden />
          Stäng figur
        </button>
      </header>
      <div className="sa-inspect-pane" ref={paneRef}>
        <FigurePan className="sa-inspect-scroll" label="Förstorat underlag" onZoomKey={stepZoom}>
          <FigurePage
            figure={figure}
            rotation={rotation}
            width={width}
            status="ready"
            attempt={attempt}
            onStatus={onStatus}
          />
        </FigurePan>
      </div>
    </div>
  )
}

// ── Gates ────────────────────────────────────────────────────────────

/** The direction's root element (Samtal.tsx): a gate stands there, over
 *  the frame too, inside Samtal's theme scope. */
export const SamtalRoot = createContext<HTMLElement | null>(null)

/**
 * A gate before a step that cannot be taken back — a timed pass's start,
 * its hand-in, giving it up: the coach's question as its heading, the
 * replies at its foot. It stands over the whole screen (a card on the
 * desktop, a sheet on the phone) as a dialog; the caller makes the screen
 * under it inert. Esc, a press outside it or the quiet reply back out, so
 * backing out is always the safe way. Focus starts on the question and goes
 * back to the control that opened it; Tab stays inside. Mark the heading
 * with `data-gate-title` and give it `titleId`.
 */
export function Gate({
  titleId,
  onDismiss,
  children,
  testId,
}: {
  titleId: string
  onDismiss: () => void
  children: ReactNode
  testId?: string
}) {
  const root = useContext(SamtalRoot)
  const panel = useRef<HTMLDivElement>(null)
  const dismiss = useRef(onDismiss)
  dismiss.current = onDismiss
  const close = useCallback(() => dismiss.current(), [])
  useDismiss(true, close, panel)
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panel.current?.querySelector<HTMLElement>('[data-gate-title]')?.focus({ preventScroll: true })
    return () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])
  const node = (
    <div className="sa-gate" data-rd-keyscope="" data-testid={testId}>
      <div className="sa-scrim sa-gate-scrim" aria-hidden />
      <div
        className="sa-gate-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panel}
        onKeyDown={keepFocusInside}
      >
        {children}
      </div>
    </div>
  )
  return root ? createPortal(node, root) : node
}

// ── The prognosis ────────────────────────────────────────────────────

/** HP's scale runs from 0 to 2,0. */
const SCALE_MAX = 2

/** The prognosis and the caveat that goes with it, as its footnote. With
 *  `withTarget`, a supplied target stands on the scale, named as one. */
export function ScoreCard({
  p,
  withTarget = false,
  testId,
}: {
  p: PrognosisView
  withTarget?: boolean
  testId?: string
}) {
  const headingId = useId()
  const caveatId = useId()
  const halves = [
    p.verbal != null ? `Verbal ${fmtScore(p.verbal)}` : null,
    p.quant != null ? `Kvant ${fmtScore(p.quant)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className="sa-score-wrap" data-testid={testId}>
      <section className="sa-card sa-card--score" aria-labelledby={headingId}>
        <header className="sa-card-head">
          <h2 id={headingId}>Prognos</h2>
          {halves ? <span>{halves}</span> : null}
        </header>
        {p.total != null ? (
          <>
            <p className="sa-score">
              <span className="sa-score-n" aria-describedby={p.caveat ? caveatId : undefined}>
                {fmtScore(p.total)}
                {p.caveat ? <sup aria-hidden>*</sup> : null}
              </span>{' '}
              <span className="sa-score-of">av 2,0</span>
              {p.delta != null ? (
                <>
                  {' '}
                  <span className="sa-score-delta">{fmtDelta(p.delta)} sedan förra veckan</span>
                </>
              ) : null}
            </p>
            <Scale
              total={p.total}
              low={p.low}
              high={p.high}
              target={withTarget ? p.target : undefined}
            />
          </>
        ) : (
          <p className="sa-say sa-say--quiet">Prognosen visas när du har svarat i båda delarna.</p>
        )}
      </section>
      {/* The caveat is the coach's footnote to the card above. */}
      {p.caveat ? (
        <p className="sa-footnote" id={caveatId}>
          <b aria-hidden>*</b>
          <span>{p.caveat}</span>
        </p>
      ) : null}
    </div>
  )
}

/** The prognosis on its 0–2,0 scale: the likely range, when there is one,
 *  the point, and a supplied target, named. */
export function Scale({
  total,
  low,
  high,
  target,
}: {
  total: number
  low?: number
  high?: number
  target?: number
}) {
  const at = (v: number) => `${(Math.min(SCALE_MAX, Math.max(0, v)) / SCALE_MAX) * 100}%`
  const range = low != null && high != null
  const level = range
    ? `Trolig nivå ${fmtScore(low)} till ${fmtScore(high)} på skalan 0 till 2,0`
    : `Nivå ${fmtScore(total)} på skalan 0 till 2,0`
  return (
    <div
      className="sa-scale"
      data-target={target != null ? 'true' : undefined}
      role="img"
      aria-label={target != null ? `${level}, målet ${fmtScore(target)}` : level}
    >
      <span className="sa-scale-track" />
      {range ? (
        <span className="sa-scale-range" style={{ left: at(low), width: at(high - low) }} />
      ) : null}
      {target != null ? (
        <span className="sa-scale-goal" style={{ left: at(target) }}>
          <span>mål</span>
        </span>
      ) : null}
      <span className="sa-scale-mark" style={{ left: at(total) }} />
      {[0, 0.5, 1, 1.5, 2].map((v) => (
        <span key={v} className="sa-scale-tick" style={{ left: at(v) }}>
          {v === 0 ? '0' : fmtScore(v)}
        </span>
      ))}
    </div>
  )
}

// ── Numbers, said ────────────────────────────────────────────────────

const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']

/** 4 → "fyra"; past ten the digits. */
export function words(n: number): string {
  return WORDS[n] ?? String(n)
}

/** 1 → "1 fråga", 3 → "3 frågor". */
export function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** 1.32 → "1,32": a pass's normed score, as the app gives it. */
export function fmtScore2(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

/** 1872 → "31:12"; an hour or more as "1:02:05". */
export function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`
}
