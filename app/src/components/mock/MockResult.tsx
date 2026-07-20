// MockResult — the post-Provpass analysis screen (PR 3 of the
// Provpass plan). DiagnosticReport is the structural model (Rail
// sections, editorial headline); DrillResult supplies the facit-row /
// hpc-m3-stats idioms. Unlike those two, this component's input is a
// server-graded `MockResultRow` (PR #208's contract) — there is no
// live `Question[]`/picks array, only `breakdown.perSection` and
// `breakdown.missedQids`. That shapes every section below: per-question
// detail is qid-only, so trap clustering reuses the same
// `useTrapCluster(missedQids)` hook DrillResult/DiagnosticReport use,
// but there is no expandable facit row (no Question objects to render).
//
// Contents (task spec order):
//   1. Headline verdict + raw X/40 (or X/39 + "N frågor saknas ur detta
//      pass — rättat av N" disclosure when presented < 40).
//   2. scoreFromFraction(correct/presented) + linear-approximation
//      disclaimer.
//   3. Per-section bars (correct/presented per section).
//   4. Pacing table — per-section timeMs vs proportional budget
//      (55min × sectionQuota/40), over-budget sections highlighted.
//   5. Trap clusters on breakdown.missedQids.
//   6. Exposure line — "Du hade sett N/M frågor innan" from the
//      row's OWN snapshot (seenBefore/presented), never recomputed.
//   7. Own-mock history — useMockResults() filtered to same half+mode,
//      compact list, newest first.

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'

import type { MockHalf, MockResultRow } from '@/api/hooks/useMockResults'
import { useMockResults } from '@/api/hooks/useMockResults'
import { Eyebrow } from '@/components/primitives'
import { TermHint } from '@/components/ui/TermHint'
import { loadNormeringTable, type NormeringSitting, normedScore } from '@/lib/normering'
import { formatScore, scoreFromFraction } from '@/lib/scoring'
import { useTrapCluster } from '@/lib/trapCluster'

// Load the sitting's official UHR normeringstabell for an authentic
// pass (loadNormeringTable memoises per exam id, so re-renders and
// sibling screens share one round-trip). Synthetic passes have no
// single sitting table, so we never fetch for them — normedScore falls
// back to the linear "indikativ" estimate.
function useNormedScore(result: MockResultRow) {
  const { mode, examId, half, correct, presented } = result
  const enabled = mode === 'authentic' && !!examId
  const [table, setTable] = useState<NormeringSitting | null>(null)

  useEffect(() => {
    if (!enabled) {
      setTable(null)
      return
    }
    let live = true
    loadNormeringTable(examId).then((t) => {
      if (live) setTable(t)
    })
    return () => {
      live = false
    }
  }, [enabled, examId])

  return useMemo(
    () => normedScore(enabled ? table : null, half as MockHalf, correct, presented),
    [enabled, table, half, correct, presented],
  )
}

// 55-minute pass budget, proportioned per section by its quota. Kept
// local (mirrors the quota table in routes/prov.tsx) since PR 2's
// lib/mock.ts, which will own the canonical quota table, hasn't
// landed yet in this branch.
const PASS_BUDGET_MS = 55 * 60_000
const SECTION_QUOTA: Record<string, number> = {
  ORD: 10,
  LÄS: 10,
  MEK: 10,
  ELF: 10,
  XYZ: 12,
  KVA: 10,
  NOG: 6,
  DTK: 12,
}

function sectionBudgetMs(section: string): number {
  const quota = SECTION_QUOTA[section] ?? 0
  return (PASS_BUDGET_MS * quota) / 40
}

type Props = {
  result: MockResultRow
}

export function MockResult({ result }: Props) {
  const { presented, answered, correct, seenBefore, breakdown } = result
  const incomplete = presented < 40
  const normed = useNormedScore(result)
  const score = normed.score
  const isOfficial = normed.derived === 'official-derived'

  const missedQids = useMemo(() => breakdown.missedQids, [breakdown.missedQids])
  const cluster = useTrapCluster(missedQids)

  const sectionEntries = useMemo(
    () => Object.entries(breakdown.perSection).sort((a, b) => a[0].localeCompare(b[0])),
    [breakdown.perSection],
  )

  const history = useMockResults()
  const ownHistory = useMemo(() => {
    return (history.data ?? [])
      .filter((r) => r.half === result.half && r.mode === result.mode && r.id !== result.id)
      .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
  }, [history.data, result.half, result.mode, result.id])

  return (
    <div
      data-testid="mock-result"
      className="hpc-m3-page"
      style={{ height: '100%', overflowY: 'auto', width: '100%' }}
    >
      <div className="hpc-m3-frame" style={{ paddingBottom: 120 }}>
        {/* ── Headline + raw score + scoreFromFraction ─────────────── */}
        <Rail
          meta={
            <>
              <strong>{result.half === 'verbal' ? 'Verbal' : 'Kvant'}</strong>
              {result.mode === 'authentic' ? 'riktigt pass' : 'genererat pass'}
            </>
          }
        >
          <h1 className="hpc-m3-display" id="mock-result-headline" style={{ marginTop: 0 }}>
            <span data-testid="mock-result-headline">Provpasset klart.</span>
          </h1>
          <div className="hpc-m3-stats" data-testid="mock-result-stats">
            <div>
              <div className="hpc-m3-stat-n" data-testid="mock-result-raw">
                {correct} av {presented}
              </div>
              <div className="hpc-m3-stat-l">rätt</div>
            </div>
            {score != null && (
              <div>
                <div className="hpc-m3-stat-n" data-testid="mock-result-score">
                  {formatScore(score).replace('.', ',')}
                </div>
                <div className="hpc-m3-stat-l">
                  {isOfficial ? (
                    // P2.2 micro-glossary: the label itself is the tap
                    // target; the plain sentence unfolds inline below.
                    <>
                      <TermHint term="normerat-harlett" /> · 0–2,0
                    </>
                  ) : (
                    'skattad poäng · 0–2,0'
                  )}
                </div>
              </div>
            )}
          </div>
          {incomplete && (
            <p
              data-testid="mock-result-incomplete-note"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--muted)',
                marginTop: 12,
              }}
            >
              {40 - presented} {40 - presented === 1 ? 'fråga saknas' : 'frågor saknas'} ur detta
              pass — rättat av {presented}.
            </p>
          )}
          <p
            data-testid="mock-result-disclaimer"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              // WCAG AA: --muted-2 fails 4.5:1 at 13px — --muted passes.
              color: 'var(--muted)',
              marginTop: 8,
            }}
          >
            {isOfficial ? (
              'Härlett ur UHR:s normeringstabell för detta provtillfälle. UHR normerar hela delprovet (80 frågor) — ett provpass på 40 frågor har ingen officiell tabell, så poängen skalas upp och läses av tabellen.'
            ) : (
              // P2.2 micro-glossary on the epistemic word itself.
              <>
                Linjär skattning — <TermHint term="indikativ" tail=", inte UHR-normerad." />
              </>
            )}
          </p>
        </Rail>

        {/* ── Per-section bars ──────────────────────────────────────── */}
        <Rail meta="Per sektion">
          <h2 className="hpc-m3-h">Så gick det per sektion</h2>
          <div data-testid="mock-result-sections">
            {sectionEntries.map(([section, s]) => (
              <SectionBar
                key={section}
                section={section}
                correct={s.correct}
                presented={s.presented}
              />
            ))}
          </div>
        </Rail>

        {/* ── Pacing table ──────────────────────────────────────────── */}
        <Rail meta="Tempo">
          <h2 className="hpc-m3-h">Tempo per sektion</h2>
          <table
            data-testid="mock-result-pacing"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                <th style={pacingHeadStyle}>Sektion</th>
                <th style={pacingHeadStyle}>Tid</th>
                <th style={pacingHeadStyle}>Budget</th>
              </tr>
            </thead>
            <tbody>
              {sectionEntries.map(([section, s]) => {
                const budget = sectionBudgetMs(section)
                const over = s.timeMs > budget
                return (
                  <tr key={section} data-testid={`mock-result-pace-${section}`}>
                    <td style={pacingCellStyle}>{section}</td>
                    <td
                      style={{
                        ...pacingCellStyle,
                        color: over ? 'var(--bad)' : 'var(--ink-2)',
                        fontWeight: over ? 700 : 400,
                      }}
                    >
                      {formatMs(s.timeMs)}
                      {over && (
                        <span data-testid={`mock-result-pace-over-${section}`}> · över budget</span>
                      )}
                    </td>
                    <td style={pacingCellStyle}>{formatMs(budget)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Rail>

        {/* ── Trap clusters ─────────────────────────────────────────── */}
        {cluster && (
          <Rail meta="Återkommande fälla">
            <p
              data-testid="mock-result-cluster"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 16,
                lineHeight: 1.4,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {cluster.count} av dina missar tappade samma mönster.
              {cluster.headline && (
                <>
                  {' '}
                  <span style={{ fontStyle: 'normal' }}>{cluster.headline}</span>
                </>
              )}
            </p>
          </Rail>
        )}

        {/* ── Exposure ──────────────────────────────────────────────── */}
        <Rail meta="Exponering">
          <p
            data-testid="mock-result-exposure"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              color: 'var(--ink-2)',
              margin: 0,
            }}
          >
            Du hade sett {seenBefore}/{presented} frågor innan.
            {answered < presented && <> {presented - answered} lämnades obesvarade.</>}
          </p>
        </Rail>

        {/* ── Own-mock history ──────────────────────────────────────── */}
        <Rail meta="Tidigare pass">
          <h2 className="hpc-m3-h">
            {result.half === 'verbal' ? 'Verbal' : 'Kvant'} ·{' '}
            {result.mode === 'authentic' ? 'riktiga' : 'genererade'} pass
          </h2>
          {ownHistory.length === 0 ? (
            <p
              data-testid="mock-result-history-empty"
              // WCAG AA: --muted-2 fails 4.5:1 at the inherited (16px)
              // body size — --muted passes.
              style={{ fontFamily: 'var(--font-display)', color: 'var(--muted)', margin: 0 }}
            >
              Inga tidigare pass av samma sort ännu.
            </p>
          ) : (
            <ul
              data-testid="mock-result-history"
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {ownHistory.map((r) => {
                const s = r.presented > 0 ? scoreFromFraction(r.correct / r.presented) : null
                return (
                  <li
                    key={r.id}
                    data-testid={`mock-result-history-${r.id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--hairline-2)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--ink-2)',
                    }}
                  >
                    <span>{formatDate(r.createdAt)}</span>
                    <span>
                      {r.correct}/{r.presented}
                      {s != null && <> · {formatScore(s).replace('.', ',')}</>}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Rail>
      </div>
    </div>
  )
}

// ── Section bar ────────────────────────────────────────────────────

function SectionBar({
  section,
  correct,
  presented,
}: {
  section: string
  correct: number
  presented: number
}) {
  const pct = presented > 0 ? (correct / presented) * 100 : 0
  return (
    <div
      data-testid={`mock-result-section-${section}`}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}
    >
      <Eyebrow style={{ width: 40, flexShrink: 0 }}>{section}</Eyebrow>
      <div
        style={{
          flex: 1,
          height: 6,
          background: 'var(--panel-2)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'var(--accent)',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--ink-2)',
          width: 48,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {correct}/{presented}
      </span>
    </div>
  )
}

// ── Shared bits ────────────────────────────────────────────────────

function Rail({ meta, children }: { meta: ReactNode; children: ReactNode }) {
  return (
    <section className="hpc-m3-section">
      <hr className="hpc-m3-rule" />
      <div className="hpc-m3-row">
        <div className="hpc-m3-meta">{meta}</div>
        <div className="hpc-m3-spine" />
        <div className="hpc-m3-content">{children}</div>
      </div>
    </section>
  )
}

const pacingHeadStyle: CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  color: 'var(--muted)',
  borderBottom: '1px solid var(--hairline)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontSize: 10.5,
}

const pacingCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  borderBottom: '1px solid var(--hairline-2)',
}

function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function timeOf(createdAt: number | string | null): number {
  if (createdAt == null) return 0
  if (typeof createdAt === 'number') return createdAt
  const t = Date.parse(createdAt)
  return Number.isNaN(t) ? 0 : t
}

function formatDate(createdAt: number | string | null): string {
  const t = timeOf(createdAt)
  if (t === 0) return '—'
  const d = new Date(t)
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}
