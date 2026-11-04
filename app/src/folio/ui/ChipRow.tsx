import {
  type ComponentProps,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useFolioMotion } from '../lib/useFolioMotion'
import './ui.css'

type Overflow = 'start' | 'end' | 'both'

// A current chip closer than this to the right edge sits in the fade (r6/A kapitel: 40 px).
const EDGE = 40
// Where a chip brought into view lands, from the left edge (r6/A kapitel: 16 px).
const GUTTER = 16

/** Which edges hide chips, if any. */
function overflowOf(row: HTMLElement): Overflow | null {
  const hidden = row.scrollWidth - row.clientWidth
  if (!(hidden > 1)) return null
  const left = row.scrollLeft || 0
  const start = left > 1
  const end = left < hidden - 1
  if (start && end) return 'both'
  return start ? 'start' : end ? 'end' : null
}

export type ChipRowProps = ComponentProps<'div'> & {
  as?: 'div' | 'nav' | 'ol' | 'ul'
  /** Lay the chips out on lines from the reader width up (the kapitel stepper); a phone scrolls. */
  wrap?: boolean
}

/**
 * One scrolling row of chips (on a phone: the kapitel stepper, Konto's
 * jumps, facit's chips). An edge fades only where chips are hidden, and a
 * clipped current chip (`aria-current`) is brought into view: at once on
 * arrival, then as Rörelse allows.
 */
export function ChipRow({ as = 'div', wrap, className, children, ...rest }: ChipRowProps) {
  const { scrollBehavior } = useFolioMotion()
  const rowRef = useRef<HTMLDivElement>(null)
  // The current chip last placed: undefined until the row first had a layout.
  const placed = useRef<Element | null | undefined>(undefined)
  const [overflow, setOverflow] = useState<Overflow | null>(null)

  const measure = useCallback(() => {
    if (rowRef.current) setOverflow(overflowOf(rowRef.current))
  }, [])

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    row.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(row)
    return () => {
      row.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [measure])

  // After every commit, since the chips or the current one may have changed.
  useLayoutEffect(() => {
    measure()
    const row = rowRef.current
    if (!row) return
    const box = row.getBoundingClientRect()
    if (!(box.width > 0)) return
    const chip = row.querySelector('[aria-current]:not([aria-current="false"])')
    if (chip === placed.current) return
    const arriving = placed.current === undefined
    placed.current = chip
    if (!chip) return
    const at = chip.getBoundingClientRect()
    if (at.left >= box.left && at.right <= box.right - EDGE) return
    const left = Math.max(0, (row.scrollLeft || 0) + at.left - box.left - GUTTER)
    const behavior = arriving ? 'auto' : scrollBehavior
    if (typeof row.scrollTo === 'function') row.scrollTo({ left, behavior })
    else row.scrollLeft = left
  })

  const Row = as as 'div'
  return (
    <Row
      {...rest}
      ref={rowRef}
      className={className ? `fa-ui-chiprow ${className}` : 'fa-ui-chiprow'}
      data-wrap={wrap ? '' : undefined}
      data-overflow={overflow ?? undefined}
    >
      {children}
    </Row>
  )
}

type ChipOwn = {
  /** The chip you are on: `aria-current` true, or its kind (page, step, location). */
  current?: boolean | 'page' | 'step' | 'location'
}
type ChipLink = ChipOwn & Omit<ComponentProps<'a'>, 'aria-current'> & { href: string }
type ChipButton = ChipOwn & Omit<ComponentProps<'button'>, 'aria-current'> & { href?: undefined }
export type ChipProps = ChipLink | ChipButton

/** A chip in a row: a real link, or a button for an action. The current one takes the lamp's warmth. */
export function Chip({ current, className, ...rest }: ChipProps) {
  const here = current === true ? 'true' : current || undefined
  const chip = className ? `fa-ui-chip ${className}` : 'fa-ui-chip'
  if (rest.href !== undefined) return <a {...rest} aria-current={here} className={chip} />
  return <button type="button" {...rest} aria-current={here} className={chip} />
}
