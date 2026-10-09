// Instrument's small shared parts: the mark, the destination glyphs, the
// G-sequence keys, the platform's modifier key, keycaps that hide on touch,
// labelled readouts, the segmented progress meter and a width hook.

import { Activity, CalendarDays, Library, Target, Timer } from 'lucide-react'
import { type ReactNode, type RefObject, useLayoutEffect, useState } from 'react'

import type { Destination } from '@/components/devbake/redesign/r1Kit'

export const DEST_ICONS: Record<Destination, (size: number) => ReactNode> = {
  idag: (size) => <CalendarDays size={size} strokeWidth={1.5} aria-hidden />,
  ova: (size) => <Target size={size} strokeWidth={1.5} aria-hidden />,
  provpass: (size) => <Timer size={size} strokeWidth={1.5} aria-hidden />,
  uppslag: (size) => <Library size={size} strokeWidth={1.5} aria-hidden />,
  framsteg: (size) => <Activity size={size} strokeWidth={1.5} aria-hidden />,
}

/** The mark: a keycap with a signal cursor under the letters. */
export function Mark() {
  return (
    <span className="in-mark" aria-hidden>
      HP
    </span>
  )
}

/** The second key of each G-sequence (G then I → Idag …). */
export const G_KEYS: Record<Destination, string> = {
  idag: 'i',
  ova: 'ö',
  provpass: 'p',
  uppslag: 'u',
  framsteg: 'f',
}

/** ⌘ on Apple platforms, Ctrl everywhere else. */
export const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '')
export const MOD = IS_MAC ? '⌘' : 'Ctrl'

/** A keycap. Hints (the default) hide on touch screens and at phone
 *  width, where there is no keyboard to press them on. */
export function Kc({ children, hint = true }: { children: ReactNode; hint?: boolean }) {
  return (
    <kbd className={hint ? 'in-kc in-hint' : 'in-kc'} aria-hidden>
      {children}
    </kbd>
  )
}

/** A labelled instrument readout: label, value (tabular mono), unit. */
export function Readout({
  label,
  value,
  unit,
  title,
}: {
  label: string
  value: string
  unit?: string
  title?: string
}) {
  return (
    <span className="in-ro" title={title}>
      <span className="in-ro-l">{label}</span>
      <span className="in-ro-v">{value}</span>
      {unit ? <span className="in-ro-u">{unit}</span> : null}
    </span>
  )
}

/** A segmented progress meter: answered, the current one, the rest. */
export function Segs({
  total,
  done,
  now,
  label,
}: {
  total: number
  done: number
  now: number
  label?: string
}) {
  return (
    <span className="in-segs" role="img" aria-label={label ?? `${done} av ${total} besvarade`}>
      {Array.from({ length: total }, (_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length progress marks
          key={i}
          data-s={i < done ? 'done' : i === now ? 'now' : 'todo'}
        />
      ))}
    </span>
  )
}

/** The rendered width of an element, kept current. Zero until measured. */
export function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}
