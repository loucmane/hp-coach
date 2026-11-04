import type { Section } from '@/data/questions'
import { useFolioMotion } from '../lib/useFolioMotion'
import { SEC_KEY } from './SecChip'
import './ui.css'

/** Where the solid core sits in the drawn band. ui.css's gradient stops and grow origin match. */
export const BAND_CORE = { start: 0.2, end: 0.8 } as const

const round = (x: number) => Number(x.toFixed(4))
const percent = (value: number, min: number, max: number) =>
  round(((value - min) / (max - min)) * 100)

/** Swedish numbers: a decimal comma and a real minus, at most two decimals. */
export function svNumber(n: number): string {
  const text = String(Number(n.toFixed(2))).replace('.', ',')
  return text.startsWith('-') ? `−${text.slice(1)}` : text
}

/**
 * The band's box on the axis, in percent. It is wide enough that its solid
 * core (BAND_CORE) covers exactly low–high, so only the evidence beyond the
 * stated range fades. The axis ends clip what falls outside.
 */
export function bandGeometry(low: number, high: number, min: number, max: number) {
  const span = max - min
  const width = (Math.max(high - low, 0) / span / (BAND_CORE.end - BAND_CORE.start)) * 100
  const left = ((low - min) / span) * 100 - BAND_CORE.start * width
  return { left: round(left), width: round(width) }
}

export type RangeBandProps = {
  low: number
  high: number
  /** The axis: 0–1 unless given (a prognosis runs 0–2). */
  min?: number
  max?: number
  /** The observed value, a ring on the band (Provresultat's 10 of 12). */
  point?: number
  /** A goal tick and its words ("Mål 2,0"). */
  goal?: { value: number; label: string }
  /** Axis words, spread evenly from min to max ("0", "0,5" … "2,0"). */
  ticks?: readonly string[]
  /** A section's own band, in its hue (data); ink otherwise. */
  section?: Section
  /** Öva's thin level band. */
  size?: 'mini'
  /** The spoken name; "mellan 0,4 och 0,7" unless given. */
  label?: string
  /** Silent, for a band beside text that already says the numbers. */
  decorative?: boolean
  format?: (n: number) => string
  className?: string
}

/**
 * An honest range: a solid core that is the stated range, edges that fade,
 * growing out of the lower bound unless Rörelse (or the OS) says no motion.
 */
export function RangeBand({
  low,
  high,
  min = 0,
  max = 1,
  point,
  goal,
  ticks,
  section,
  size,
  label,
  decorative,
  format = svNumber,
  className,
}: RangeBandProps) {
  const { level } = useFolioMotion()
  const box = bandGeometry(low, high, min, max)
  const name = label ?? `mellan ${format(low)} och ${format(high)}`
  const plot = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': name }
  const goalAt = goal ? percent(goal.value, min, max) : 0
  return (
    <div
      className={className ? `fa-ui-band ${className}` : 'fa-ui-band'}
      data-motion={level}
      data-sec={section ? SEC_KEY[section] : undefined}
      data-size={size}
      data-goal={goal ? '' : undefined}
    >
      <div className="fa-ui-band-plot" {...plot}>
        <span className="fa-ui-band-track">
          <span
            className="fa-ui-band-range"
            style={{ left: `${box.left}%`, width: `${box.width}%` }}
          />
        </span>
        {point !== undefined ? (
          <span className="fa-ui-band-point" style={{ left: `${percent(point, min, max)}%` }} />
        ) : null}
        {goal ? (
          <span
            className="fa-ui-band-goal"
            style={{ left: `${goalAt}%`, transform: `translateX(-${goalAt}%)` }}
          >
            <span
              className="fa-ui-band-goal-label"
              style={{ transform: `translateX(-${goalAt}%)` }}
            >
              {goal.label}
            </span>
          </span>
        ) : null}
      </div>
      {ticks?.length ? (
        <div className="fa-ui-band-ticks" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
