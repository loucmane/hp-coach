// Home resumption panel — "Fortsätt här →".
//
// Reads SERVER state now (active sessions + the lesson bookmark), so a
// session paused on one device surfaces on another. Renders the single
// freshest resumable thing across kinds, within the EDITION vocabulary:
// mono eyebrow (relative time + device provenance) → display headline
// (kind · section) → marginalia (progress) → Sage-accent CTA.
//
// Cross-device freshness rides on the underlying queries' refetch-on-focus
// + 30s interval; same-device feels instant via the mutations' cache
// write-through. When nothing is resumable, the panel renders nothing
// (the right column is intentional air).

import { Link } from '@tanstack/react-router'
import { useLessonProgress } from '@/api/hooks/useLessonProgress'
import { useActiveSessions } from '@/api/hooks/useSessions'
import { type DeviceKind, deviceLabel } from '@/lib/device'

// Sessions older than this read as "för gammal" — demoted, never hidden
// (an ADHD-PI user may still mean to come back), and the resume route
// degrades gracefully if the stored qids no longer resolve.
const STALE_DAYS = 7

type Candidate = {
  /** ms epoch of last engagement — drives freshness + which one wins. */
  freshAt: number
  device: DeviceKind | null
  headline: string
  marginalia: string
  href: string
}

export function ResumptionPanel({ now }: { now: Date }) {
  const sessions = useActiveSessions()
  const lesson = useLessonProgress()

  const candidate = pickCandidate(sessions.data ?? [], lesson.data ?? null)
  if (!candidate) return null

  const ageDays = (now.getTime() - candidate.freshAt) / (1000 * 60 * 60 * 24)
  const stale = ageDays > STALE_DAYS
  const dimColor = stale ? 'var(--muted-2, var(--muted))' : 'var(--muted)'

  const dev = deviceLabel(candidate.device)
  const eyebrow = [formatRelative(candidate.freshAt, now), dev, stale ? 'för gammal' : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <aside
      data-testid="home-resumption-panel"
      style={{
        padding: 'clamp(40px, 5vh, 72px) 28px 0 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        data-testid="home-resumption-eyebrow"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track, 0.08em)',
          textTransform: 'uppercase',
          color: dimColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {eyebrow}
      </div>
      <div
        aria-hidden
        style={{ height: 1, background: 'var(--hairline)', margin: '14px 0 18px' }}
      />
      <h2
        data-testid="home-resumption-headline"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(20px, 1vw + 16px, 26px)',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          color: stale ? 'var(--ink-2)' : 'var(--ink)',
          margin: 0,
        }}
      >
        {candidate.headline}
      </h2>
      <div
        data-testid="home-resumption-marginalia"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          color: stale ? 'var(--muted-2, var(--muted))' : 'var(--ink-2)',
          margin: '8px 0 0 0',
        }}
      >
        {candidate.marginalia}
      </div>
      <Link
        to={candidate.href}
        data-testid="home-resumption-link"
        style={{
          marginTop: 22,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: 'var(--font-mono-track, 0.08em)',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          textDecoration: 'none',
        }}
      >
        Fortsätt här →
      </Link>
    </aside>
  )
}

// ── Candidate assembly ─────────────────────────────────────────────

type SessionRow = ReturnType<typeof useActiveSessions>['data']
type LessonRow = ReturnType<typeof useLessonProgress>['data']

/**
 * Fold active sessions + the lesson bookmark into resumable candidates
 * and return the freshest, or null. Exported for unit testing the
 * selection + formatting without the network.
 */
export function pickCandidate(
  sessions: NonNullable<SessionRow>,
  lesson: LessonRow,
): Candidate | null {
  const out: Candidate[] = []

  for (const s of sessions) {
    if (s.kind !== 'drill' && s.kind !== 'adaptive_review') continue
    const total = s.plan?.length ?? 0
    const qid = s.currentQuestionId ?? s.plan?.[0] ?? null
    if (!qid || total === 0) continue
    const freshAt = toMs(s.startedAt)
    const progress = `vid fråga ${Math.min(s.position + 1, total)} av ${total}`
    if (s.kind === 'drill') {
      const section = (s.sections ?? '').toUpperCase()
      out.push({
        freshAt,
        device: s.device,
        headline: section ? `${section}-övning · pausad` : 'Övning · pausad',
        marginalia: progress,
        href: section
          ? `/drill?section=${section}&qid=${encodeURIComponent(qid)}`
          : `/drill?qid=${encodeURIComponent(qid)}`,
      })
    } else {
      out.push({
        freshAt,
        device: s.device,
        headline: 'Repetition · pausad',
        marginalia: progress,
        href: `/repetition?qid=${encodeURIComponent(qid)}`,
      })
    }
  }

  if (lesson) {
    const section = lesson.section.toUpperCase()
    const anchor = lesson.frameworkId ? `#${lesson.frameworkId}` : ''
    out.push({
      freshAt: toMs(lesson.updatedAt),
      device: lesson.device,
      headline: `${section}-lektion · pausad`,
      marginalia: lesson.frameworkId ? `vid ${lesson.frameworkId}` : 'pågående lektion',
      href: `/lektion?section=${section}${anchor}`,
    })
  }

  if (out.length === 0) return null
  return out.reduce((best, c) => (c.freshAt > best.freshAt ? c : best))
}

function toMs(ts: string | number | null | undefined): number {
  if (ts == null) return 0
  const n = typeof ts === 'number' ? ts : Date.parse(ts)
  return Number.isFinite(n) ? n : 0
}

// ── Formatters ─────────────────────────────────────────────────────

function formatRelative(at: number, now: Date): string {
  const d = new Date(at)
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) return `Idag · ${formatTime(d)}`
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const wasYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  if (wasYesterday) return `Igår · ${formatTime(d)}`
  const days = Math.max(1, Math.round((now.getTime() - at) / (1000 * 60 * 60 * 24)))
  return `${days} dagar sedan`
}

function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
