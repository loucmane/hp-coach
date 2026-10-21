import { attemptTimeMs, formatDrillTime, type TimedDrillSection } from '@/lib/timedDrill'
import { paceNote, uhrTimeMs } from '@/lib/uhrPacing'

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
        ? `${formatDrillTime(elapsed)} · UHR:s tid ${formatDrillTime(budget)} · ${paceNote(elapsed, budget)}`
        : 'Tiden för hela övningen är inte tillgänglig än.'}
    </p>
  )
}
