// Typography primitives — the system, not inline.
//
// Before this module: every screen redefined its own `fontFamily: var
// (--font-display)` + a unique `clamp()` expression. Components were
// internally consistent but globally drifting; "what size is a
// headline here" had to be re-decided every time.
//
// After: one source of truth. `<Display level={1}>` on Home renders
// the same as `<Display level={1}>` on /lektion. The product reads
// like one publication because it's typeset by one instrument.
//
// Roles, in scale order:
//
//   Display 1 — "Klart." · masthead. Single-word headlines.
//   Display 2 — Section masthead · TrapCard headword.
//   Display 3 — Score readout · projected total.
//   Display 4 — Section letters on /progress · inline emphasis.
//   Body Editorial — reading paragraphs · 17/1.55. The instrument.
//   PullQuote     — italic editorial pulls · CoachLine elevated.
//   Marginalia    — italic 13px side notes · Sigil status line.
//   Folio         — mono · page-numbering · status line.
//   Eyebrow       — mono 10.5px small-caps · section labels.
//
// All roles read from `--type-*` tokens declared in `index.css`. The
// `prefers-reduced-motion` guard there collapses every motion-token
// duration to 0; this module has no motion of its own.

import type { CSSProperties, ReactNode } from 'react'

type CommonProps = {
  children: ReactNode
  style?: CSSProperties
  className?: string
  /** Optional id for skip-links / aria-labelled-by. */
  id?: string
}

// ── Display ────────────────────────────────────────────────────────────
//
// The four-level display scale. Pass `as="h1"` etc. to control the
// semantic level independently from the visual level.

type DisplayLevel = 1 | 2 | 3 | 4
type DisplayAs = 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'span' | 'p'

type DisplayProps = CommonProps & {
  level: DisplayLevel
  as?: DisplayAs
  /** Tabular numerics — turn on for any number you want columnar-aligned. */
  tabular?: boolean
}

const DISPLAY_SIZE: Record<DisplayLevel, string> = {
  1: 'var(--type-display-1)',
  2: 'var(--type-display-2)',
  3: 'var(--type-display-3)',
  4: 'var(--type-display-4)',
}
const DISPLAY_TRACK: Record<DisplayLevel, string> = {
  1: '-0.02em',
  2: '-0.02em',
  3: '-0.015em',
  4: '-0.012em',
}
const DISPLAY_LINE: Record<DisplayLevel, number> = {
  1: 1.05,
  2: 1.1,
  3: 1.15,
  4: 1.2,
}

export function Display({
  level,
  as: Tag = 'div',
  tabular,
  children,
  style,
  className,
  id,
}: DisplayProps) {
  return (
    <Tag
      id={id}
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: DISPLAY_SIZE[level],
        letterSpacing: DISPLAY_TRACK[level],
        lineHeight: DISPLAY_LINE[level],
        color: 'var(--ink)',
        margin: 0,
        fontVariantNumeric: tabular ? 'tabular-nums' : undefined,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

// ── Body Editorial ─────────────────────────────────────────────────────
//
// 17/1.55 reading paragraphs. The instrument. Newsreader at body weight.

type BodyTone = 'ink' | 'ink-2' | 'muted'
type BodyProps = CommonProps & {
  as?: 'p' | 'div' | 'span'
  /** Default color is --ink-2 (reading body). `ink` for emphasised, `muted` for de-emphasis. */
  tone?: BodyTone
  italic?: boolean
}

const TONE: Record<BodyTone, string> = {
  ink: 'var(--ink)',
  'ink-2': 'var(--ink-2)',
  muted: 'var(--muted)',
}

export function BodyEditorial({
  as: Tag = 'p',
  tone = 'ink-2',
  italic,
  children,
  style,
  className,
  id,
}: BodyProps) {
  return (
    <Tag
      id={id}
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 400,
        fontSize: 'var(--type-body-editorial)',
        lineHeight: 'var(--type-body-editorial-leading)',
        color: TONE[tone],
        margin: 0,
        fontStyle: italic ? 'italic' : 'normal',
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

// ── PullQuote ──────────────────────────────────────────────────────────
//
// Italic editorial pulls. Used for the heatmap epigraph, the CoachLine
// editorial treatment, and any "single declarative sentence" beat.

type PullQuoteProps = CommonProps & {
  as?: 'p' | 'blockquote' | 'div'
}

export function PullQuote({ as: Tag = 'p', children, style, className, id }: PullQuoteProps) {
  return (
    <Tag
      id={id}
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 'clamp(17px, 0.8vw + 14px, 22px)',
        lineHeight: 1.4,
        letterSpacing: '-0.005em',
        color: 'var(--ink)',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

// ── Marginalia ─────────────────────────────────────────────────────────
//
// Italic 13px side notes. Sigil status line, hanging-indent sublines,
// pull-quote attributions when not mono.

type MarginaliaProps = CommonProps & {
  as?: 'span' | 'div' | 'p'
  tone?: BodyTone
}

export function Marginalia({
  as: Tag = 'span',
  tone = 'ink-2',
  children,
  style,
  className,
  id,
}: MarginaliaProps) {
  return (
    <Tag
      id={id}
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 'var(--type-marginalia)',
        lineHeight: 1.4,
        color: TONE[tone],
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

// ── Folio ──────────────────────────────────────────────────────────────
//
// Mono page-number style. Status-line context, spread indicators,
// `pp. 04 / 12` notation. Always tabular-nums.

type FolioProps = CommonProps & {
  as?: 'span' | 'div'
}

export function Folio({ as: Tag = 'span', children, style, className, id }: FolioProps) {
  return (
    <Tag
      id={id}
      className={className}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--type-folio)',
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
