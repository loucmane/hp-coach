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
//                      the answer on it (FigureLoadsContext).
//   - words, count   — numbers said the way the coach says them.

import { BookOpen, PenLine, Sun, Timer, TrendingUp } from 'lucide-react'
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useLayoutEffect,
  useRef,
} from 'react'

import { splitStepRefs } from '@/components/devbake/redesign/drillCore'
import type { Destination } from '@/components/devbake/redesign/r1Kit'
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

type FigureImgProps = Omit<ComponentProps<'img'>, 'ref' | 'onLoad' | 'onError'> & {
  alt: string
  onStatus: (s: FigureStatus) => void
}

/** A figure's image that reports when it is there or has failed — a cached
 *  one too: an image already complete when it mounts reports at once, and
 *  never waits for a load event that has come and gone. Key it by source
 *  and attempt, so another source, or a retry, is a new image, checked
 *  again. */
export function FigureImg({ alt, onStatus, ...img }: FigureImgProps) {
  const ref = useRef<HTMLImageElement>(null)
  const report = useRef(onStatus)
  report.current = onStatus
  useLayoutEffect(() => {
    const el = ref.current
    if (el?.complete && el.naturalWidth > 0) report.current('ready')
  }, [])
  return (
    <img
      ref={ref}
      alt={alt}
      {...img}
      onLoad={() => report.current('ready')}
      onError={() => report.current('error')}
    />
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
  return `${n} ${n === 1 ? one : many}`
}
