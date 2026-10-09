// Spår's small shared parts: the trail mark, the destination icons, the
// section names, the keycap and the calm-mode switch.

import { Footprints, Hourglass, Leaf, Lightbulb, Mountain, Route } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Destination } from '@/components/devbake/redesign/r1Kit'

/** The högskoleprov sections by code. REP is cross-section repetition. */
export const SECTION_NAMES: Record<string, string> = {
  ORD: 'Ordförståelse',
  LÄS: 'Läsförståelse',
  MEK: 'Meningskomplettering',
  ELF: 'Engelsk läsförståelse',
  XYZ: 'Matematisk problemlösning',
  KVA: 'Kvantitativa jämförelser',
  NOG: 'Kvantitativa resonemang',
  DTK: 'Diagram, tabeller och kartor',
  REP: 'Repetition',
}

/** A label from the fixtures ("ORD", "Repetition") → its data-sec key. */
export function secOf(label: string | null): string {
  if (!label || label === 'Repetition') return 'REP'
  return label
}

/** Trail glyphs for the five destinations: Idag is today's route, Öva the
 *  steps you take, Framsteg the summit. */
export const NAV_ICONS: Record<Destination, (size: number) => ReactNode> = {
  idag: (s) => <Route size={s} strokeWidth={2} aria-hidden />,
  ova: (s) => <Footprints size={s} strokeWidth={2} aria-hidden />,
  provpass: (s) => <Hourglass size={s} strokeWidth={2} aria-hidden />,
  uppslag: (s) => <Lightbulb size={s} strokeWidth={2} aria-hidden />,
  framsteg: (s) => <Mountain size={s} strokeWidth={2} aria-hidden />,
}

/** The Spår mark: a rounded tile with a winding trail between two stops. */
export function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg
      className="sp-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="13" fill="var(--sp-primary)" />
      <path
        d="M12.5 29.5c0-6.5 15-3.5 15-10s-8.5-4.5-8.5-9.5"
        fill="none"
        stroke="var(--sp-on-primary)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="29.5" r="2.7" fill="var(--sp-on-primary)" />
      <circle cx="19" cy="10" r="2.7" fill="var(--sp-on-primary)" />
    </svg>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="sp-kbd" aria-hidden>
      {children}
    </kbd>
  )
}

/** "Lugnt läge" as a visible switch: fewer colours and numbers, no
 *  springs. On Home and in the drill's top bar, not only in a menu. */
export function CalmSwitch({
  calm,
  setCalm,
  compact = false,
  testid,
}: {
  calm: boolean
  setCalm: (calm: boolean) => void
  compact?: boolean
  testid: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={calm}
      className="sp-calm"
      data-compact={String(compact)}
      data-testid={testid}
      title="Lugnt läge: färre färger och siffror, inga studsar"
      onClick={() => setCalm(!calm)}
    >
      <Leaf size={18} strokeWidth={2} aria-hidden />
      <span className="sp-calm-label">{compact ? 'Lugnt' : 'Lugnt läge'}</span>
      <i className="sp-switch sp-switch--sm" aria-hidden />
    </button>
  )
}
