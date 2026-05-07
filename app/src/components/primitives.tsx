// HP-Coach shared UI primitives.
// Ported from the design prototype (components.jsx). Built on Tailwind v4
// + the OKLCH design tokens in src/index.css. No emoji icons; no animation
// overshoot; type, ink, and accent are the only expressive variables.

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import { COACH_LABELS, type CoachKey } from '@/lib/voice'

// ── Button ─────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'soft'
type BtnSize = 'sm' | 'md' | 'lg' | 'xl'

const BTN_SIZES: Record<BtnSize, { h: number; px: number; fz: number }> = {
  sm: { h: 36, px: 14, fz: 13 },
  md: { h: 44, px: 18, fz: 14 },
  lg: { h: 56, px: 22, fz: 16 },
  xl: { h: 64, px: 28, fz: 18 },
}

const BTN_VARIANTS: Record<BtnVariant, { bg: string; color: string; border: string }> = {
  primary: { bg: 'var(--ink)', color: 'var(--bg)', border: 'transparent' },
  secondary: { bg: 'transparent', color: 'var(--ink)', border: 'var(--hairline)' },
  accent: { bg: 'var(--accent)', color: 'var(--accent-ink)', border: 'transparent' },
  ghost: { bg: 'transparent', color: 'var(--ink-2)', border: 'transparent' },
  soft: { bg: 'var(--panel-2)', color: 'var(--ink)', border: 'transparent' },
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant
  size?: BtnSize
  full?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

export function Btn({
  variant = 'primary',
  size = 'md',
  full,
  leading,
  trailing,
  children,
  style,
  ...rest
}: BtnProps) {
  const s = BTN_SIZES[size]
  const v = BTN_VARIANTS[variant]
  return (
    <button
      className="hpc-btn"
      style={{
        height: s.h,
        padding: `0 ${s.px}px`,
        borderRadius: 'calc(var(--radius) * 0.6)',
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        fontSize: s.fz,
        fontWeight: 500,
        fontFamily: 'inherit',
        letterSpacing: 'var(--font-ui-track)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        width: full ? '100%' : undefined,
        ...style,
      }}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  )
}

// ── Card ───────────────────────────────────────────────────────────
type CardProps = {
  children: ReactNode
  padded?: boolean
  onClick?: () => void
  style?: CSSProperties
  className?: string
}

export function Card({ children, padded = true, onClick, style, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
        padding: padded ? 'var(--pad-lg)' : 0,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Layer 1 ID chip ────────────────────────────────────────────────
type L1ChipProps = {
  id: string
  size?: 'sm' | 'md'
  locked?: boolean
  onClick?: (id: string) => void
}

export function L1Chip({ id, size = 'md', locked = false, onClick }: L1ChipProps) {
  const sz = size === 'sm' ? { fz: 10.5, py: 2, px: 6 } : { fz: 11, py: 3, px: 7 }
  return (
    <button
      title={locked ? 'Inte upplåst än' : id}
      onClick={(e) => {
        e.stopPropagation()
        if (!locked) onClick?.(id)
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-mono)',
        letterSpacing: 'var(--font-mono-track)',
        fontSize: sz.fz,
        padding: `${sz.py}px ${sz.px}px`,
        background: locked ? 'transparent' : 'var(--panel-2)',
        border: '1px solid var(--hairline)',
        borderRadius: 4,
        color: locked ? 'var(--muted-2)' : 'var(--ink-2)',
        cursor: locked ? 'default' : 'pointer',
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          background: locked ? 'var(--muted-2)' : 'var(--accent)',
        }}
      />
      {id}
    </button>
  )
}

// ── Mono caption (data label) ──────────────────────────────────────
export function Mono({
  children,
  size = 11,
  style,
}: {
  children: ReactNode
  size?: number
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        letterSpacing: 'var(--font-mono-track)',
        fontSize: size,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// ── Eyebrow (section heading kicker) ───────────────────────────────
export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.08em',
        fontSize: 10.5,
        textTransform: 'uppercase',
        color: 'var(--muted)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Hairline divider ───────────────────────────────────────────────
export function Hairline({
  vertical = false,
  style,
}: {
  vertical?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: 'var(--hairline)',
        flexShrink: 0,
        ...(vertical ? { width: 1, alignSelf: 'stretch' } : { height: 1, alignSelf: 'stretch' }),
        ...style,
      }}
    />
  )
}

// ── Stack (flex helper) ────────────────────────────────────────────
export function Stack({
  dir = 'col',
  gap = 'var(--gap)',
  align,
  justify,
  style,
  children,
}: {
  dir?: 'row' | 'col'
  gap?: string | number
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: dir === 'row' ? 'row' : 'column',
        gap,
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Coach voice attribution ────────────────────────────────────────
// Renders any voice string as monologue: thin accent left rule + small mono
// byline. No avatar, no chat bubble — just attributed text.
type CoachLineProps = {
  children: ReactNode
  coach?: CoachKey
  as?: 'headline' | 'title' | 'body' | 'small'
  style?: CSSProperties
  className?: string
}

const COACHLINE_SIZES = {
  headline: { fontSize: 32, lineHeight: 1.15 },
  title: { fontSize: 22, lineHeight: 1.2 },
  body: { fontSize: 17, lineHeight: 1.5 },
  small: { fontSize: 14, lineHeight: 1.5 },
}

export function CoachLine({
  children,
  coach = 'taktiker',
  as = 'body',
  style,
  className,
}: CoachLineProps) {
  const s = COACHLINE_SIZES[as]
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderLeft: '1.5px solid var(--accent)',
        paddingLeft: 14,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--font-display-w)',
          letterSpacing: 'var(--font-display-track)',
          textWrap: 'pretty',
          color: 'var(--ink)',
          ...s,
        }}
      >
        {children}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        — Coach · {COACH_LABELS[coach]}
      </div>
    </div>
  )
}
