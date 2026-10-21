import { attemptTimeMs, formatDrillTime, type TimedDrillSection } from '@/lib/timedDrill'
import { uhrTimeMs } from '@/lib/uhrPacing'

function timeDifference(elapsed: number, budget: number): string {
  const diff = Math.floor(elapsed / 1000) - Math.floor(budget / 1000)
  if (Math.abs(diff) <= 2) return 'i takt'
  const minutes = Math.floor(Math.abs(diff) / 60)
  const seconds = Math.abs(diff) % 60
  const amount = [minutes ? `${minutes} min` : '', seconds ? `${seconds} s` : '']
    .filter(Boolean)
    .join(' ')
  return `${amount} ${diff > 0 ? 'mer' : 'kvar'}`
}

export function TempoLine({
  section,
  questionCount,
  attempts,
}: {
  section: TimedDrillSection
  questionCount: number
  attempts: readonly { timeTakenMs?: number | null }[] | undefined
}) {
  const elapsed = attemptTimeMs(attempts)
  const budget = uhrTimeMs(section, questionCount)
  const complete = attempts && attempts.length >= questionCount && questionCount > 0
  return (
    <p
      data-testid="drill-tempo"
      style={{
        flexShrink: 0,
        margin: 0,
        padding: '12px 20px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--muted)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {complete && elapsed !== null && budget !== null
        ? `${formatDrillTime(elapsed)} · UHR:s tid ${formatDrillTime(budget)} · ${timeDifference(elapsed, budget)}`
        : 'Tiden för hela övningen är inte tillgänglig än.'}
    </p>
  )
}
