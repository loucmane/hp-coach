// /historik — the drill-history journal (owner request 2026-07-05).
//
// Every completed pass is already persisted server-side (a session row +
// its attempts); this surfaces them as a reverse-chronological list where
// each row permalinks to that pass's Klart via `?done=<id>` — reusing the
// reconstruction wired into drill + repetition. So you can reopen "that
// KVA pass on Tuesday, 7/10" and expand its facit to see exactly which
// questions you blew and why.
//
// Only drill + repetition passes are listed — the two kinds whose routes
// reconstruct `?done`. Diagnostic/mock passes have their own report and
// aren't wired here yet.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { type SessionHistoryRow, useSessionHistory } from '@/api/hooks/useSessions'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

export const Route = createFileRoute('/historik')({
  component: HistorikRoute,
})

const SV_MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'maj',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
]

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${SV_MONTHS[d.getMonth()]}`
}

// Only these kinds' routes reconstruct ?done; others are filtered out.
const LISTABLE = new Set(['drill', 'adaptive_review'])

function passLabel(row: SessionHistoryRow): string {
  if (row.kind === 'adaptive_review') return 'Repetition'
  return row.sections ?? 'Övning'
}

function HistorikRoute() {
  const navigate = useNavigate()
  const sitting = useSitting()
  const days = useDaysRemaining()
  const history = useSessionHistory()

  const rows = (history.data ?? []).filter((r) => LISTABLE.has(r.kind))

  return (
    <MobileFrame tabs={false}>
      <Page>
        <div className="hpc-m3-frame" style={{ width: '100%', color: 'var(--ink)' }}>
          <DrillRailSection
            meta={
              <>
                <strong>Historik</strong>
                {days} dagar · {sitting.label.toLowerCase()}
              </>
            }
            delay={0}
          >
            <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
              Tidigare pass.
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 16,
                lineHeight: 1.55,
                color: 'var(--ink-2)',
                margin: '10px 0 0',
                maxWidth: '58ch',
              }}
            >
              Öppna ett pass för att se hela facit igen — vilka frågor du fastnade på och
              pedagogiken bakom.
            </p>
          </DrillRailSection>

          <DrillRailSection meta="Pass" delay={120}>
            {history.isPending ? (
              <MonoNote>laddar…</MonoNote>
            ) : rows.length === 0 ? (
              <MonoNote>Inga avslutade pass än. Kör en övning så landar den här.</MonoNote>
            ) : (
              <div>
                {rows.map((row) => (
                  <PassRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </DrillRailSection>

          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              marginLeft: 'clamp(0px, 128px, 128px)',
              paddingLeft: 24,
              marginTop: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              color: 'var(--muted-2)',
            }}
          >
            ← tillbaka hem
          </button>
        </div>
      </Page>
    </MobileFrame>
  )
}

function PassRow({ row }: { row: SessionHistoryRow }) {
  const to = row.kind === 'adaptive_review' ? '/repetition' : '/drill'
  return (
    <Link
      to={to}
      search={{ done: row.id }}
      className="hpc-m3-trap"
      data-testid={`historik-pass-${row.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <span className="hpc-m3-trap-t">
        <span className="hpc-m3-tag">{passLabel(row)}</span>
        <span
          style={{
            marginLeft: 10,
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          {row.correct}/{row.total}
        </span>
        <span
          style={{
            marginLeft: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--muted)',
          }}
        >
          rätt
        </span>
      </span>
      <span className="hpc-m3-trap-n">{formatDate(row.endedAt)}</span>
    </Link>
  )
}

function MonoNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--muted)',
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}
