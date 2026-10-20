import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  CircleSlash,
  House,
  LampDesk,
  Layers,
  Maximize2,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCw,
  Sun,
  Timer,
  Undo2,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  type ReactEventHandler,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefCallback,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type {
  DrillCoreActions,
  DrillCoreRefs,
  DrillCoreView,
} from '@/components/devbake/redesign/drillCore'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  splitStepRefs,
  useDismiss,
} from '@/components/devbake/redesign/r1Kit'
import type { DrillFigure, DrillQuestion, Half } from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import type { Section } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'

/** What a drill hands its answer rows and feedback: drillCore's view, the
 *  moves they make and the scroll targets they attach. */
export type ReadingActions = Pick<
  DrillCoreActions,
  'select' | 'toggleEliminate' | 'cite' | 'toggleStep' | 'goToStep'
>
export type Reading = { view: DrillCoreView; act: ReadingActions; refs: DrillCoreRefs }

/** The pages of the normal shell. Repetera lives inside Öva, a pass's
 *  result inside Provpass. */
export type FramePage =
  | 'idag'
  | 'ova'
  | 'repetera'
  | 'provpass'
  | 'resultat'
  | 'uppslag'
  | 'framsteg'

/** Frame-level navigation: ask the host (`ask`), and open `page` in the
 *  frame as well, for a host that does not navigate. */
export type OpenPage = (page: FramePage, ask: () => void) => void

export const NAV_ICONS = {
  idag: House,
  ova: Layers,
  provpass: Timer,
  uppslag: BookOpen,
  framsteg: ChartNoAxesCombined,
} satisfies Record<Destination, typeof House>

/** 'LÄS' → 'las', as the contract's ids spell a section. */
export function sectionId(section: Section): string {
  return section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
}

/** 'host-2025:kvant1' → 'host-2025-kvant1', as the contract's ids spell a pass. */
export function passId(id: string): string {
  return id.replace(':', '-')
}

const COUNT_WORDS = ['Inga', 'En', 'Två', 'Tre', 'Fyra', 'Fem', 'Sex', 'Sju', 'Åtta', 'Nio', 'Tio']

/** 2 → "Två": small counts read as words at the start of a sentence. */
export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n)
}

/** 1 → "1 fråga", 3 → "3 frågor". */
export function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** 2840 → "2 840" (a Swedish thin grouping space). */
export function fmtInt(n: number): string {
  return n.toLocaleString('sv-SE')
}

/** 0.7 → "70 %". */
export function fmtPercent(fraction: number): string {
  return `${Math.round(fraction * 100)} %`
}

/** "ingen paus" → "Ingen paus". */
export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('sv-SE') + text.slice(1)
}

/** "Lördag" → "lördag", "Igår" → "igår": a day label inside a line. */
export function midLine(when: string): string {
  return when.toLocaleLowerCase('sv-SE')
}

/** The half as a reader says it: "Verbal", "Kvantitativ". */
export function halfName(half: Half): string {
  return half === 'verbal' ? 'Verbal' : 'Kvantitativ'
}

export function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="lj-mark">
      <LampDesk size={24} strokeWidth={1.5} aria-hidden />
      {!compact && <span>HP-Coach</span>}
    </span>
  )
}

/**
 * The normal shell's outside, around the page it holds: the five doors and
 * the account in a sidebar that gains light on approach and folds (desktop),
 * or under a head and in a bottom bar (phone). `door` is the lit one. The
 * frame holds its pages in it, and a pass that has ended without a result
 * holds its read-only answers in it.
 */
export function FrameShell({
  door,
  onGo,
  width,
  account,
  initiallyCollapsed = false,
  inert = false,
  children,
}: {
  door: Destination
  onGo: (door: Destination) => void
  width: DirectionProps['width']
  account: ReactNode
  initiallyCollapsed?: boolean
  /** While a dialog covers the shell. */
  inert?: boolean
  children: ReactNode
}) {
  const { data } = useDirectionData()
  const [collapsed, setCollapsed] = useState(initiallyCollapsed)
  const phone = width === 'phone'
  const nav = (
    <nav className="lj-nav" aria-label="Huvudmeny">
      {DESTINATIONS.map((d) => {
        const Icon = NAV_ICONS[d.id]
        return (
          <button
            type="button"
            key={d.id}
            data-testid={`rd-nav-${d.id}`}
            aria-current={door === d.id ? 'page' : undefined}
            aria-label={d.label}
            title={d.label}
            onClick={() => onGo(d.id)}
          >
            <Icon size={20} strokeWidth={1.5} aria-hidden />
            <span className="lj-nav-label">{d.label}</span>
            {!phone && d.id === 'ova' && data.home.ovaDue > 0 && (
              <span className="lj-nav-count" title={`${data.home.ovaDue} att repetera`}>
                {data.home.ovaDue}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
  return (
    <div className="lj-frame" data-collapsed={String(collapsed)} inert={inert}>
      {phone ? (
        <header className="lj-phone-head">
          <Mark />
          {account}
        </header>
      ) : (
        <aside className="lj-sidebar">
          <Mark compact={collapsed} />
          <button
            className="lj-collapse"
            type="button"
            data-testid="rd-collapse"
            aria-label={collapsed ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} aria-hidden />
            ) : (
              <PanelLeftClose size={19} aria-hidden />
            )}
          </button>
          {nav}
          <div className="lj-sidebar-foot">{account}</div>
        </aside>
      )}
      {children}
      {phone && nav}
    </div>
  )
}

/** The account and settings, a disclosure from the sidebar foot, the phone
 *  head or a focus head. */
export function Account({
  theme,
  onTheme,
  initiallyOpen = false,
  onOpenChange,
}: Pick<DirectionProps, 'theme' | 'onTheme'> & {
  initiallyOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(initiallyOpen)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const close = useCallback(() => {
    if (ref.current?.contains(document.activeElement)) trigger.current?.focus()
    setOpen(false)
    onOpenChange?.(false)
  }, [onOpenChange])
  useDismiss(open, close, ref)
  return (
    <div className="lj-account" ref={ref}>
      <button
        ref={trigger}
        className="lj-account-trigger"
        type="button"
        data-testid="rd-account"
        aria-label="Konto och inställningar"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(!open)
          onOpenChange?.(!open)
        }}
      >
        <UserRound size={19} strokeWidth={1.5} aria-hidden />
        <span className="lj-account-label">Ditt konto</span>
      </button>
      {open && (
        <section
          className="lj-account-menu"
          id={id}
          data-testid="rd-account-menu"
          aria-label="Konto och inställningar"
        >
          <div className="lj-menu-heading">
            <h2>Ditt läsrum</h2>
            <button
              type="button"
              aria-label="Stäng kontomenyn"
              onClick={() => {
                close()
                trigger.current?.focus()
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <p>Konto · Gratisplan</p>
          <h3>Inställningar</h3>
          <button
            type="button"
            className="lj-theme"
            data-testid="rd-theme-toggle"
            onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
            <span>{theme === 'dark' ? 'Byt till ljust läge' : 'Byt till mörkt läge'}</span>
          </button>
          <details>
            <summary>Hjälp med läsningen</summary>
            <p>
              J/K eller ↑/↓ flyttar styckeljuset. A–E väljer svar. Enter bekräftar. Stäng av ljuset
              om du vill läsa hela texten jämnt belyst.
            </p>
          </details>
        </section>
      )}
    </div>
  )
}

export function Cites({
  list,
  source,
  act,
}: {
  list: number[]
  source?: string
  act: Pick<ReadingActions, 'cite'>
}) {
  return list.length ? (
    <span className="lj-cites">
      <span>Se texten</span>
      {list.map((n) => (
        <button
          key={n}
          type="button"
          data-testid={`rd-cite-${n}`}
          aria-label={`Lys upp stycke ${n} i texten`}
          onClick={() => act.cite(n, source)}
        >
          ¶{n}
        </button>
      ))}
    </span>
  ) : null
}

/** Explanation text, verbatim: math rendered, "(steg 2)" a jump to the step. */
export function Rich({ text, act }: { text: string; act: Pick<ReadingActions, 'goToStep'> }) {
  let offset = 0
  return splitStepRefs(text).map((segment) => {
    const key = offset
    offset += segment.text.length
    return segment.kind === 'text' ? (
      <span key={key}>
        <MathText>{segment.text}</MathText>
      </span>
    ) : (
      <button
        className="lj-inline-link"
        type="button"
        key={key}
        onClick={() => act.goToStep(segment.steps[0])}
      >
        {segment.text}
      </button>
    )
  })
}

/**
 * The answer rows of any question: its own letters only (A–D or A–E), the
 * option text with its math, or an option image named by its text. Select,
 * then confirm elsewhere; each row has its own visible strike control.
 */
export function AnswerRows({
  view,
  act,
  testId = 'rd-option',
  label = 'Svarsalternativ',
}: {
  view: DrillCoreView
  act: Pick<ReadingActions, 'select' | 'toggleEliminate'>
  testId?: 'rd-option' | 'rd-quant-option'
  label?: string
}) {
  return (
    <ol className="lj-options" aria-label={label}>
      {(view.question.options ?? []).map((option) => {
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
              data-testid={`${testId}-${option.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(option.letter)}
            >
              <kbd>{option.letter}</kbd>
              {option.figure ? (
                <span className="lj-option-figure">
                  <img
                    src={`/${option.figure.src}`}
                    alt={option.figure.alt}
                    width={option.figure.width}
                    height={option.figure.height}
                  />
                </span>
              ) : (
                <span>
                  <MathText>{option.text}</MathText>
                </span>
              )}
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

// ── Reading text ─────────────────────────────────────────────────────

/**
 * A passage's paragraphs in the reading room: the margin number lights its
 * paragraph (as a click on the prose does), the lit one takes the lamp and
 * the warm line. The LÄS drill and a running pass both read through it.
 */
export function PassageParagraphs({
  paragraphs,
  byline,
  lit,
  cited,
  onLight,
  paraRef,
  ids = false,
}: {
  paragraphs: string[]
  byline?: string | null
  lit: (n: number) => boolean
  cited?: (n: number) => boolean
  onLight: (n: number) => void
  paraRef?: (n: number) => RefCallback<HTMLElement>
  /** The contract's rd-para-<n> ids (the practice drills). */
  ids?: boolean
}) {
  return (
    <>
      {paragraphs.map((text, index) => {
        const n = index + 1
        const on = lit(n)
        return (
          <div
            key={n}
            ref={paraRef?.(n)}
            className="lj-paragraph"
            data-testid={ids ? `rd-para-${n}` : undefined}
            data-paragraph={n}
            data-lit={String(on)}
            data-cited={String(cited?.(n) ?? false)}
          >
            <button
              type="button"
              className="lj-para-number"
              aria-label={`Lys upp stycke ${n}`}
              aria-pressed={on}
              onClick={() => onLight(n)}
            >
              {n}
            </button>
            {/* A paragraph remains readable/selectable prose. Its margin
                button provides the same action for keyboard users. */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: the adjacent native paragraph-number button provides this same action to keyboard users. */}
            <p onClick={() => onLight(n)}>{text}</p>
          </div>
        )
      })}
      {byline && <p className="lj-byline">{byline}</p>}
    </>
  )
}

// ── Quant problems ───────────────────────────────────────────────────

/** A quant prompt in its parts: KVA's condition and two quantities, NOG's
 *  question, two statements and the line that leads into its options, or
 *  the prompt whole when it does not split (never cut). */
export type ProblemParts =
  | { kind: 'kva'; condition: string; first: string; second: string }
  | { kind: 'nog'; question: string; first: string; second: string; lead: string | null }
  | { kind: 'whole'; text: string }

export function problemParts(question: DrillQuestion): ProblemParts {
  const prompt = question.prompt ?? ''
  if (question.section === 'KVA') {
    const kva = splitKvaPrompt(prompt)
    if (kva) return { kind: 'kva', condition: kva.condition, first: kva.kvI, second: kva.kvII }
  }
  if (question.section === 'NOG') {
    const nog = parseNogPrompt(prompt)
    if (nog) {
      return {
        kind: 'nog',
        question: nog.question,
        first: nog.statement1,
        second: nog.statement2,
        lead: nog.tail,
      }
    }
  }
  return { kind: 'whole', text: prompt }
}

/** The problem in one pool of light: the quantities, or both statements,
 *  side by side or stacked but always read together. */
export function QuantProblem({ parts, testId }: { parts: ProblemParts; testId?: string }) {
  return (
    <div className="lj-problem" data-testid={testId}>
      {parts.kind === 'kva' ? (
        <>
          {parts.condition && (
            <p className="lj-problem-text">
              <MathText>{parts.condition}</MathText>
            </p>
          )}
          <dl className="lj-quantities">
            <div>
              <dt>Kvantitet I</dt>
              <dd>
                <MathText>{parts.first}</MathText>
              </dd>
            </div>
            <div>
              <dt>Kvantitet II</dt>
              <dd>
                <MathText>{parts.second}</MathText>
              </dd>
            </div>
          </dl>
        </>
      ) : parts.kind === 'nog' ? (
        <>
          <p className="lj-problem-text">
            <MathText>{parts.question}</MathText>
          </p>
          <ol className="lj-statements">
            <li>
              <span className="lj-statement-label">(1)</span>
              <span>
                <MathText>{parts.first}</MathText>
              </span>
            </li>
            <li>
              <span className="lj-statement-label">(2)</span>
              <span>
                <MathText>{parts.second}</MathText>
              </span>
            </li>
          </ol>
        </>
      ) : (
        <p className="lj-problem-text">
          <MathText>{parts.text}</MathText>
        </p>
      )}
    </div>
  )
}

// ── Figures ──────────────────────────────────────────────────────────

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 1.25

/** What an image tells the figure gate: that it is mounted (and whether it
 *  was complete already, a cached page), then that it loaded or failed. */
export type FigureImg = {
  ref?: RefCallback<HTMLImageElement>
  onLoad?: ReactEventHandler<HTMLImageElement>
  onError?: ReactEventHandler<HTMLImageElement>
}

/** The figure page at `zoom` × the box's width, upright or in quarter
 *  turns. The box takes the turned page's shape, so nothing is clipped. */
export function FigurePage({
  figure,
  rotation,
  zoom = 1,
  alt,
  img,
}: {
  figure: DrillFigure
  rotation: number
  zoom?: number
  alt: string
  img?: FigureImg
}) {
  const ratio = figure.width / figure.height
  const turned = rotation % 180 !== 0
  return (
    <div
      className="lj-figure-page"
      data-kind={figure.kind}
      style={{ width: `${zoom * 100}%`, aspectRatio: String(turned ? 1 / ratio : ratio) }}
    >
      <img
        ref={img?.ref}
        src={`/${figure.src}`}
        alt={alt}
        width={figure.width}
        height={figure.height}
        draggable={false}
        onLoad={img?.onLoad}
        onError={img?.onError}
        style={{
          width: turned ? `${ratio * 100}%` : '100%',
          height: turned ? `${100 / ratio}%` : '100%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      />
    </div>
  )
}

export type FigureView = { src: string; rotation: number; zoom: number }

/** The figure's turn and zoom. Questions on the same page keep them; a new
 *  page starts upright and fitted. */
export function useFigureView(figure: DrillFigure | null | undefined) {
  const [kept, setKept] = useState<FigureView | null>(null)
  const current: FigureView | null = figure
    ? kept?.src === figure.src
      ? kept
      : { src: figure.src, rotation: 0, zoom: 1 }
    : null
  const rotate = () => {
    if (current) setKept({ ...current, rotation: (current.rotation + 90) % 360 })
  }
  const zoomBy = (factor: number) => {
    if (current) {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor))
      setKept({ ...current, zoom: Math.round(zoom * 100) / 100 })
    }
  }
  const fit = () => {
    if (current) setKept({ ...current, zoom: 1 })
  }
  return { view: current, rotate, zoomBy, fit }
}

/** Keeps Tab inside `box`: the last stop wraps to the first and back. One
 *  selector over every element keeps document order (a selector list need
 *  not, in every engine). */
function trapTab(e: ReactKeyboardEvent, box: HTMLElement | null) {
  if (e.key !== 'Tab' || !box) return
  const stops = [...box.querySelectorAll<HTMLElement>('*')].filter((el) =>
    el.matches('button:not(:disabled), [tabindex="0"]'),
  )
  const first = stops[0]
  const last = stops[stops.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last?.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first?.focus()
  }
}

/**
 * A figure page in the workspace: its source, the page fitted to the width
 * on its warm edge (scrollable, and panned with the arrows when focused),
 * and the tools to enlarge and turn it. While the gate waits for the page,
 * the box keeps its shape and says so; a failed page offers a retry.
 */
export function FigurePane({
  figure,
  source,
  block,
  rotation,
  onRotate,
  onEnlarge,
  enlargeRef,
  img,
  load = 'ready',
  onRetry,
}: {
  figure: DrillFigure
  source: string
  block: { n: number; total: number } | null
  rotation: number
  onRotate: () => void
  onEnlarge: () => void
  enlargeRef: RefObject<HTMLButtonElement | null>
  img?: FigureImg
  load?: FigureLoad
  onRetry?: () => void
}) {
  return (
    <div className="lj-figure" data-testid="rd-figure" data-load={load}>
      <div className="lj-figure-head">
        <p className="lj-eyebrow">Underlag · {source}</p>
        {block && (
          <p className="lj-figure-block">
            Samma sida · fråga {block.n} av {block.total}
          </p>
        )}
      </div>
      <section
        className="lj-figure-scroll"
        // Arrows scroll the page here: the switcher and a running pass leave them alone.
        data-rd-keyscope=""
        data-lj-pan=""
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling page must be reachable to scroll it with the keyboard
        tabIndex={0}
        aria-label="Underlaget. Rulla för att se hela sidan."
      >
        <FigurePage figure={figure} rotation={rotation} alt={figure.alt} img={img} />
      </section>
      {load !== 'ready' && (
        <div className="lj-figure-status" role="status">
          {load === 'loading' ? (
            <p>Underlaget laddas …</p>
          ) : (
            <>
              <p>Underlaget kunde inte visas.</p>
              {onRetry && (
                <button type="button" className="lj-text-button" onClick={onRetry}>
                  Försök igen <RotateCw size={15} aria-hidden />
                </button>
              )}
            </>
          )}
        </div>
      )}
      <div className="lj-figure-tools">
        <button
          type="button"
          className="lj-tool"
          ref={enlargeRef}
          disabled={load !== 'ready'}
          onClick={onEnlarge}
        >
          <Maximize2 size={18} aria-hidden />
          <span>Förstora figur</span>
        </button>
        <button
          type="button"
          className="lj-tool"
          aria-label="Rotera figuren 90 grader"
          onClick={onRotate}
        >
          <RotateCw size={18} aria-hidden />
          <span>Rotera</span>
        </button>
      </div>
    </div>
  )
}

/**
 * The enlarged figure, inside the direction (so its theme reaches it) and
 * over the whole task: a dialog with its own close, zoom and turn. Focus
 * starts on Stäng and stays inside; Escape closes it and never the task.
 */
export function FigureViewer({
  figure,
  source,
  view,
  onZoom,
  onRotate,
  onFit,
  onClose,
}: {
  figure: DrillFigure
  source: string
  view: FigureView
  onZoom: (factor: number) => void
  onRotate: () => void
  onFit: () => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => close.current?.focus(), [])
  const keys = useRef({ onZoom, onRotate, onClose })
  keys.current = { onZoom, onRotate, onClose }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = keys.current
      const handled =
        e.key === 'Escape'
          ? k.onClose
          : e.key === '+' || e.key === '='
            ? () => k.onZoom(ZOOM_STEP)
            : e.key === '-'
              ? () => k.onZoom(1 / ZOOM_STEP)
              : e.key === 'r' || e.key === 'R'
                ? k.onRotate
                : null
      if (!handled) return
      e.preventDefault()
      e.stopImmediatePropagation()
      handled()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return (
    <div
      className="lj-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Förstorat underlag"
      data-testid="rd-figure-viewer"
      data-rd-keyscope=""
      ref={dialog}
      onKeyDown={(e) => trapTab(e, dialog.current)}
    >
      <header className="lj-viewer-head">
        <p className="lj-eyebrow">Underlag · {source}</p>
        <button type="button" className="lj-tool" ref={close} onClick={onClose}>
          <X size={18} aria-hidden />
          <span>Stäng</span>
        </button>
      </header>
      <section
        className="lj-viewer-scroll"
        data-lj-pan=""
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling page must be reachable to pan it with the keyboard
        tabIndex={0}
        aria-label="Det förstorade underlaget. Rulla för att panorera."
      >
        <FigurePage
          figure={figure}
          rotation={view.rotation}
          zoom={view.zoom}
          alt={`${figure.alt}, förstorat`}
        />
      </section>
      <fieldset className="lj-viewer-tools" aria-label="Förstoring och vridning">
        <button
          type="button"
          className="lj-tool"
          aria-label="Zooma ut"
          disabled={view.zoom <= MIN_ZOOM}
          onClick={() => onZoom(1 / ZOOM_STEP)}
        >
          <ZoomOut size={18} aria-hidden />
        </button>
        <span className="lj-zoom-level" aria-live="polite">
          {Math.round(view.zoom * 100)} %
        </span>
        <button
          type="button"
          className="lj-tool"
          aria-label="Zooma in"
          disabled={view.zoom >= MAX_ZOOM}
          onClick={() => onZoom(ZOOM_STEP)}
        >
          <ZoomIn size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="lj-tool"
          aria-label="Rotera figuren 90 grader"
          onClick={onRotate}
        >
          <RotateCw size={18} aria-hidden />
          <span>Rotera</span>
        </button>
        <button type="button" className="lj-tool" disabled={view.zoom === 1} onClick={onFit}>
          Hela bredden
        </button>
      </fieldset>
    </div>
  )
}

// ── Figure readiness ─────────────────────────────────────────────────

export type FigureLoad = 'loading' | 'ready' | 'failed'

/** The image mounted in a place now: its key (place, source and retry) and
 *  its own load. */
type ShownFigure = { el: HTMLImageElement; key: string; load: FigureLoad }

/**
 * Whether a question can be answered yet: every figure it needs — its page
 * or diagram, and every image option — has loaded. Readiness belongs to the
 * image element mounted in each place now, not to its source (the page and
 * an option may share a file, and each must load). A page that stays
 * mounted across consecutive questions stays ready; a newly mounted image
 * starts over, even on a source that loaded before (a page come back to, a
 * sheet that opens again), and an older image's late events change
 * nothing. An image complete before its handlers were attached (from the
 * cache) counts as loaded; a failed one waits for a deliberate retry, which
 * mounts a fresh image. The enlarged viewer has its own image, outside the
 * gate.
 */
export function useFigureGate(question: DrillQuestion | undefined) {
  const [shown, setShown] = useState<Record<string, ShownFigure>>({})
  const [tries, setTries] = useState<Record<string, number>>({})
  // One ref per image key, kept: a render must not detach and attach the
  // image it already has.
  const refs = useRef(new Map<string, RefCallback<HTMLImageElement>>())
  const slots: { slot: string; src: string }[] = []
  if (question?.figure) slots.push({ slot: 'figure', src: question.figure.src })
  for (const option of question?.options ?? []) {
    if (option.figure) slots.push({ slot: `option-${option.letter}`, src: option.figure.src })
  }
  const keyOf = (slot: string, src: string) => {
    const base = `${slot}|${src}`
    return `${base}|${tries[base] ?? 0}`
  }
  const status = (slot: string, src: string): FigureLoad => {
    const now = shown[slot]
    return now?.key === keyOf(slot, src) ? now.load : 'loading'
  }
  /** An image's own news, heard only while it is the one in its place. */
  const settle = (slot: string, el: HTMLImageElement, load: FigureLoad) =>
    setShown((old) => {
      const now = old[slot]
      return now?.el !== el || now.load === load ? old : { ...old, [slot]: { ...now, load } }
    })
  const refFor = (slot: string, key: string) => {
    let ref = refs.current.get(key)
    if (!ref) {
      ref = (el) => {
        if (!el) return
        const load: FigureLoad = el.complete && el.naturalWidth > 0 ? 'ready' : 'loading'
        setShown((old) => (old[slot]?.el === el ? old : { ...old, [slot]: { el, key, load } }))
        return () =>
          setShown((old) => {
            if (old[slot]?.el !== el) return old
            const { [slot]: _gone, ...rest } = old
            return rest
          })
      }
      refs.current.set(key, ref)
    }
    return ref
  }
  const img = (slot: string, src: string): FigureImg => ({
    ref: refFor(slot, keyOf(slot, src)),
    onLoad: (e) => settle(slot, e.currentTarget, 'ready'),
    onError: (e) => settle(slot, e.currentTarget, 'failed'),
  })
  const retry = (slot: string, src: string) =>
    setTries((old) => {
      const base = `${slot}|${src}`
      return { ...old, [base]: (old[base] ?? 0) + 1 }
    })
  const waiting = slots.filter((s) => status(s.slot, s.src) !== 'ready')
  return {
    /** True while a required figure is loading or has failed. */
    blocked: waiting.length > 0,
    status,
    /** The key that mounts a fresh image after a retry. */
    key: keyOf,
    img,
    retry,
  }
}

// ── Gates ────────────────────────────────────────────────────────────

/**
 * A confirmation's open state. Opening remembers the control that had
 * focus; closing gives focus back to it once the background is live again
 * (a layout effect, after the inert background has been restored).
 */
export function useGate<T>() {
  const [gate, setGate] = useState<T | null>(null)
  const back = useRef<HTMLElement | null>(null)
  const open = useCallback((value: T) => {
    const el = document.activeElement
    back.current = el instanceof HTMLElement && el !== document.body ? el : null
    setGate(value)
  }, [])
  const close = useCallback(() => setGate(null), [])
  useLayoutEffect(() => {
    if (gate != null) return
    const el = back.current
    back.current = null
    if (el?.isConnected) el.focus()
  }, [gate])
  return { gate, open, close }
}

/**
 * A decision that asks first: an opaque lamp panel over the room, inside
 * the direction so its theme reaches it. Focus starts on the safe choice
 * and stays inside; Escape takes the safe choice. The accept button is the
 * contract's rd-confirm. Keys pressed inside it never reach the switcher.
 */
export function Gate({
  eyebrow,
  title,
  accept,
  cancel,
  onAccept,
  onCancel,
  children,
}: {
  eyebrow: string
  title: string
  accept: string
  cancel: string
  onAccept: () => void
  onCancel: () => void
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  const safe = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel
  useLayoutEffect(() => safe.current?.focus(), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      cancelRef.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return (
    <div className="lj-gate" data-rd-keyscope="">
      <div
        className="lj-gate-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panel}
        onKeyDown={(e) => trapTab(e, panel.current)}
        // Focus that leaves for the room around the panel (a press on it)
        // comes back to the safe choice.
        onBlur={(e) => {
          const to = e.relatedTarget
          if (!(to instanceof Node) || !panel.current?.contains(to)) safe.current?.focus()
        }}
      >
        <p className="lj-eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        <div className="lj-gate-body">{children}</div>
        <div className="lj-gate-actions">
          <button type="button" className="lj-text-button" ref={safe} onClick={onCancel}>
            {cancel}
          </button>
          <button type="button" className="lj-primary" data-testid="rd-confirm" onClick={onAccept}>
            <span>{accept}</span>
            <ArrowRight size={20} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
