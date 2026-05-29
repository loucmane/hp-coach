// Shared resumption-candidate selection + formatting.
//
// Both the desktop ResumptionPanel and the phone resumption line read
// the same server state (active sessions + the lesson bookmark) and the
// same "freshest across kinds" selection, so they never drift. The pure
// `pickCandidate` is unit-tested; `useResumptionCandidate` layers the
// time/device/stale formatting on top.

import { useLessonProgress } from '@/api/hooks/useLessonProgress'
import { useActiveSessions } from '@/api/hooks/useSessions'
import { type DeviceKind, deviceLabel } from '@/lib/device'

// Sessions older than this read as "för gammal" — demoted, never hidden
// (an ADHD-PI user may still mean to come back), and the resume route
// degrades gracefully if the stored qids no longer resolve.
export const STALE_DAYS = 7

/** The raw resumable thing, before time/stale formatting. */
export type ResumptionRaw = {
  /** Display subject without the "· pausad" suffix — "ORD-övning",
   *  "Repetition", "XYZ-lektion". Phone composes "subject · progress";
   *  desktop composes "subject · pausad". */
  subject: string
  /** "vid fråga 3 av 10" | "vid XYZ-TRAP-016" | "pågående lektion". */
  progress: string
  href: string
  device: DeviceKind | null
  /** ms epoch of last engagement — drives freshness + which one wins. */
  freshAt: number
}

export type FormattedResumption = ResumptionRaw & {
  /** "ORD-övning · pausad" — the desktop headline. */
  headline: string
  /** "Idag · 11:07" | "Igår · 19:42" | "3 dagar sedan". */
  relativeLabel: string
  /** "telefon" | "surfplatta" | "dator" | null. */
  deviceLabel: string | null
  stale: boolean
}

type SessionRow = ReturnType<typeof useActiveSessions>['data']
type LessonRow = ReturnType<typeof useLessonProgress>['data']

/**
 * Fold active sessions + the lesson bookmark into resumable candidates
 * and return the freshest, or null. Pure — exported for unit testing the
 * selection + href construction without the network.
 */
export function pickCandidate(
  sessions: NonNullable<SessionRow>,
  lesson: LessonRow,
): ResumptionRaw | null {
  const out: ResumptionRaw[] = []

  for (const s of sessions) {
    if (s.kind !== 'drill' && s.kind !== 'adaptive_review') continue
    const total = s.plan?.length ?? 0
    const qid = s.currentQuestionId ?? s.plan?.[0] ?? null
    if (!qid || total === 0) continue
    const progress = `vid fråga ${Math.min(s.position + 1, total)} av ${total}`
    if (s.kind === 'drill') {
      const section = (s.sections ?? '').toUpperCase()
      out.push({
        subject: section ? `${section}-övning` : 'Övning',
        progress,
        href: section
          ? `/drill?section=${section}&qid=${encodeURIComponent(qid)}`
          : `/drill?qid=${encodeURIComponent(qid)}`,
        device: s.device,
        freshAt: toMs(s.startedAt),
      })
    } else {
      out.push({
        subject: 'Repetition',
        progress,
        href: `/repetition?qid=${encodeURIComponent(qid)}`,
        device: s.device,
        freshAt: toMs(s.startedAt),
      })
    }
  }

  if (lesson) {
    const section = lesson.section.toUpperCase()
    const anchor = lesson.frameworkId ? `#${lesson.frameworkId}` : ''
    out.push({
      subject: `${section}-lektion`,
      progress: lesson.frameworkId ? `vid ${lesson.frameworkId}` : 'pågående lektion',
      href: `/lektion?section=${section}${anchor}`,
      device: lesson.device,
      freshAt: toMs(lesson.updatedAt),
    })
  }

  if (out.length === 0) return null
  return out.reduce((best, c) => (c.freshAt > best.freshAt ? c : best))
}

/** Reactive, formatted candidate for the Home surfaces. Null = nothing
 *  resumable (the surface should render nothing). */
export function useResumptionCandidate(now: Date): FormattedResumption | null {
  const sessions = useActiveSessions()
  const lesson = useLessonProgress()
  const raw = pickCandidate(sessions.data ?? [], lesson.data ?? null)
  if (!raw) return null
  const ageDays = (now.getTime() - raw.freshAt) / (1000 * 60 * 60 * 24)
  return {
    ...raw,
    headline: `${raw.subject} · pausad`,
    relativeLabel: formatRelative(raw.freshAt, now),
    deviceLabel: deviceLabel(raw.device),
    stale: ageDays > STALE_DAYS,
  }
}

// ── helpers ─────────────────────────────────────────────────────────

function toMs(ts: string | number | null | undefined): number {
  if (ts == null) return 0
  const n = typeof ts === 'number' ? ts : Date.parse(ts)
  return Number.isFinite(n) ? n : 0
}

export function formatRelative(at: number, now: Date): string {
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
