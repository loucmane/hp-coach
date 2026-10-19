// Samtal's small shared parts: the speech marks every screen is built from.
//   - Coach / You    — a turn: the coach's on a faint oat tint (left, a
//                      small "speaker" corner top left), yours in plum
//                      (right). No avatars, no typing dots: a turn is there
//                      at once, with a 120 ms fade.
//   - Replies, Chip  — the reply buttons that stand where your next turn
//                      will go; the coach proposes, you choose. Never a text
//                      field.
//   - Divider        — the centred, dated line a conversation opens with.
//   - Cites, Rich    — ¶ links into the passage and "(steg N)" links.
//   - Dots, DoorIcon, Kbd, Mark — progress, the doors' icons, keys, the logo.

import { BookOpen, PenLine, Sun, Timer, TrendingUp } from 'lucide-react'
import type { HTMLAttributes, ReactNode, Ref } from 'react'

import {
  type Destination,
  type DrillActions,
  splitStepRefs,
} from '@/components/devbake/redesign/r1Kit'

// ── Turns ────────────────────────────────────────────────────────────

type TurnProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  /** Extra classes beside sa-turn. */
  kind?: string
  /** A turn that carries a heading is a section; a plain line a div. */
  as?: 'div' | 'section' | 'li'
  ref?: Ref<HTMLElement>
}

function cx(...names: (string | false | null | undefined)[]): string {
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
  act: Pick<DrillActions, 'cite'>
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
 *  links to the step. */
export function Rich({ text, act }: { text: string; act: Pick<DrillActions, 'goToStep'> }) {
  let at = 0
  return (
    <>
      {splitStepRefs(text).map((seg) => {
        const key = at
        at += seg.text.length
        return seg.kind === 'text' ? (
          <span key={key}>{seg.text}</span>
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
