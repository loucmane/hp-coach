// DiagnosticReport — post-/diagnostik coached summary.
//
// Replaces the generic DrillResult after a diagnostic session. Three
// editorial moves:
//
//   1. Headline — "Vad vi tror nu" takes ownership; declares an
//      opinion, not a tally.
//   2. Weakest section — single line, the section the student missed
//      most. Drives the next-study decision in one read.
//   3. Trap cluster (optional) — when 2+ missed questions share a
//      framework_id, name the trap. Deep-links into the lektion entry
//      that teaches it. Without ≥2 same-trap misses, this section
//      hides — clustering without signal is noise.
//   4. CTA — single button, the lesson the student should read next.
//      No choice paralysis; "Hem" stays as the quiet footer.
//
// The clustering uses framework_id backfilled in #57 (KVA + NOG) and
// extended in #60 (XYZ). Sections without rich-schema entries
// (MEK/DTK/LÄS/ELF/ORD) won't cluster — the weakest-section line still
// works, and we fall back to a section-level lesson link.

import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { Btn, Eyebrow, Hairline } from '@/components/primitives'
import { loadExplanation } from '@/data/explanations'
import { wiredSections } from '@/data/frameworks'
import type { AnswerLetter, Question, Section } from '@/data/questions'
import { markDiagnosticComplete } from '@/lib/diagnosticMemory'

export type DiagnosticSummary = {
  questions: Question[]
  picks: (AnswerLetter | null)[]
}

type Props = {
  summary: DiagnosticSummary
  onReplay: () => void
  onHome: () => void
}

type SectionStat = {
  section: Section
  total: number
  correct: number
  ratio: number
}

type TrapCluster = {
  framework_id: string
  section: Section
  count: number
  headline: string | null
}

export function DiagnosticReport({ summary, onReplay, onHome }: Props) {
  const { questions, picks } = summary
  const correct = picks.reduce<number>((n, p, i) => (p === questions[i].answer ? n + 1 : n), 0)
  const total = questions.length

  // Per-section accuracy. Section with the lowest ratio (and at least
  // one question) is the headline section. Ties broken by raw miss
  // count (higher = weaker).
  const sectionStats = computeSectionStats(questions, picks)
  const weakest = pickWeakest(sectionStats)

  // Cluster misses by framework_id — needs explanations, fetched async.
  // Memoize so the array is stable across renders when inputs don't change;
  // the trap-cluster effect depends on this identity.
  const missedQids = useMemo(
    () =>
      questions
        .map((q, i) => ({ q, picked: picks[i] }))
        .filter(({ q, picked }) => picked !== q.answer)
        .map(({ q }) => q.qid),
    [questions, picks],
  )
  const cluster = useTrapCluster(missedQids)

  // Persist "diagnostic just finished" so Home can render a memory
  // line ("DIAGNOSTIK · 2 d sedan · baseline 0.62 · rebaseline →").
  // The baseline score is the overall accuracy on this 10-question
  // diagnostic, scaled to the HP 0.0–2.0 grade. (It's a coarse signal
  // — 10 questions is a tiny n — but it's what the user *saw* at the
  // moment, which is the right semantic for "your baseline.")
  const baselineScore = total > 0 ? (correct / total) * 2 : null
  // Mark only once per mount — the report renders at the END of the
  // session, so baselineScore is already final. Re-running the effect
  // on every score recompute would write the same value.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only intentional
  useEffect(() => {
    markDiagnosticComplete(baselineScore)
  }, [])

  return (
    <div
      data-testid="diagnostic-report"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingInline: 'clamp(20px, 4vw + 12px, 56px)',
        paddingTop: 'clamp(32px, 4vw + 16px, 64px)',
        paddingBottom: 'clamp(48px, 6vw, 96px)',
        maxWidth: '60ch',
        width: '100%',
        margin: '0 auto',
      }}
    >
      <Eyebrow>Diagnos · klar</Eyebrow>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 5vw + 14px, 72px)',
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          margin: '12px 0 0 0',
        }}
      >
        Vad vi tror nu.
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(16px, 0.6vw + 14px, 19px)',
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          marginTop: 18,
          marginBottom: 0,
        }}
      >
        {correct} av {total} rätt. Här är vår läsning.
      </p>

      <Hairline style={{ marginBlock: 'clamp(24px, 3vw, 36px)' }} />

      {weakest ? <WeakestSection stat={weakest} /> : <NoSignal />}

      {cluster && <ClusterCallout cluster={cluster} />}

      <PlanenBlock weakest={weakest} cluster={cluster} />

      <Footer weakest={weakest} cluster={cluster} onReplay={onReplay} onHome={onHome} />
    </div>
  )
}

// ── Sections ───────────────────────────────────────────────────────

function WeakestSection({ stat }: { stat: SectionStat }) {
  return (
    <section data-testid="weakest-section">
      <Eyebrow>Svagast</Eyebrow>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 1.6vw + 14px, 32px)',
          lineHeight: 1.25,
          letterSpacing: '-0.012em',
          color: 'var(--ink)',
          margin: '8px 0 0 0',
        }}
      >
        Du är svagast i <strong style={{ fontWeight: 600 }}>{stat.section}</strong> ({stat.correct}{' '}
        av {stat.total} rätt).
      </p>
    </section>
  )
}

function NoSignal() {
  return (
    <section>
      <Eyebrow>Signal</Eyebrow>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(16px, 0.6vw + 14px, 19px)',
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          margin: '8px 0 0 0',
        }}
      >
        Inga starka signaler från denna diagnos. Kör en till — eller börja med vilken sektion som
        helst.
      </p>
    </section>
  )
}

function ClusterCallout({ cluster }: { cluster: TrapCluster }) {
  return (
    <section
      data-testid="trap-cluster"
      style={{
        marginTop: 'clamp(24px, 3vw, 36px)',
        paddingLeft: 'clamp(16px, 1vw + 10px, 24px)',
        borderLeft: '2px solid var(--ink)',
      }}
    >
      <Eyebrow>Återkommande fälla</Eyebrow>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(18px, 0.9vw + 14px, 22px)',
          lineHeight: 1.35,
          color: 'var(--ink)',
          margin: '8px 0 0 0',
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
    </section>
  )
}

// ── Planen ─────────────────────────────────────────────────────────
//
// Tier 2 #5. Pre-existing report told the user where they're weak +
// what trap they keep falling for, then handed them ONE button. The
// shape of the next few days wasn't visible — just a single click.
// Planen makes the sequence explicit: read → drill → repetition. The
// existing primary CTA stays below as the entry point to step 1.

function PlanenBlock({
  weakest,
  cluster,
}: {
  weakest: SectionStat | null
  cluster: TrapCluster | null
}) {
  const steps: { kicker: string; body: string }[] = []

  // Step 1 — read the most-leveraged framework entry. Cluster wins
  // when present (specific trap > section average), weakest section
  // otherwise.
  if (cluster) {
    steps.push({
      kicker: 'Steg 1',
      body: `Läs lektionen för ${cluster.framework_id} — det är mönstret du tappar oftast.`,
    })
  } else if (weakest) {
    steps.push({
      kicker: 'Steg 1',
      body: `Läs ${weakest.section}-lektionen — där tappade du flest poäng på diagnosen.`,
    })
  }

  // Step 2 — drill the same section. Only worth showing when we
  // have a section to point at.
  if (weakest) {
    steps.push({
      kicker: 'Steg 2',
      body: `Drilla ${weakest.section} — tio frågor, fokus på det du just läste.`,
    })
  }

  // Step 3 — repetition. Always relevant: the diagnostic itself just
  // seeded the mistake queue, so the user has fresh things to repeat.
  steps.push({
    kicker: 'Steg 3',
    body: 'Repetera dina missar i morgon — de äldsta först.',
  })

  // Skip the whole block when we have nothing to anchor it to (no
  // weakest section + no cluster = only step 3 would render, which
  // is just "do repetition tomorrow" — not a plan).
  if (steps.length < 2) return null

  return (
    <section data-testid="diagnostic-planen" style={{ marginTop: 'clamp(28px, 4vw, 48px)' }}>
      <Eyebrow>Planen</Eyebrow>
      <ol
        style={{
          listStyle: 'none',
          margin: '12px 0 0 0',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {steps.map((s) => (
          <li
            key={s.kicker}
            style={{
              paddingBlock: 'clamp(12px, 1vw + 6px, 18px)',
              borderTop: '1px solid var(--hairline)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 'var(--font-mono-track)',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 4,
              }}
            >
              {s.kicker}
            </div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(16px, 0.6vw + 14px, 18px)',
                lineHeight: 1.45,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Footer({
  weakest,
  cluster,
  onReplay,
  onHome,
}: {
  weakest: SectionStat | null
  cluster: TrapCluster | null
  onReplay: () => void
  onHome: () => void
}) {
  // Primary CTA: if we have a cluster with a framework_id, deep-link
  // to the specific lektion entry. Otherwise, link to the weakest
  // section's lektion picker. If neither, hide the primary CTA and
  // just show the home/replay footer.
  const wired = new Set(wiredSections())
  const clusterWired = cluster && wired.has(cluster.section)
  const weakestWired = weakest && wired.has(weakest.section)

  return (
    <div
      style={{
        marginTop: 'clamp(28px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {clusterWired ? (
        <PrimaryCtaLink
          to="/lektion"
          search={{ section: cluster.section }}
          hash={cluster.framework_id}
          testid="diagnostic-cta-cluster"
        >
          Läs lektionen → {cluster.framework_id}
        </PrimaryCtaLink>
      ) : weakestWired ? (
        <PrimaryCtaLink
          to="/lektion"
          search={{ section: weakest.section }}
          testid="diagnostic-cta-weakest"
        >
          Läs {weakest.section}-lektionen →
        </PrimaryCtaLink>
      ) : null}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Btn variant="secondary" onClick={onHome} data-testid="diagnostic-home">
          Hem
        </Btn>
        <Btn variant="ghost" onClick={onReplay} data-testid="diagnostic-replay">
          Kör en till
        </Btn>
      </div>
    </div>
  )
}

function PrimaryCtaLink({
  to,
  search,
  hash,
  testid,
  children,
}: {
  to: '/lektion'
  search: { section: Section }
  hash?: string
  testid: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      search={search}
      hash={hash}
      data-testid={testid}
      style={{
        display: 'block',
        background: 'var(--ink)',
        color: 'var(--bg)',
        padding: '14px 18px',
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        lineHeight: 1.3,
        textDecoration: 'none',
        textAlign: 'left',
        borderRadius: 'calc(var(--radius) * 0.6)',
      }}
    >
      {children}
    </Link>
  )
}

// ── Stats helpers ──────────────────────────────────────────────────

function computeSectionStats(questions: Question[], picks: (AnswerLetter | null)[]): SectionStat[] {
  const map = new Map<Section, { total: number; correct: number }>()
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const slot = map.get(q.section) ?? { total: 0, correct: 0 }
    slot.total += 1
    if (picks[i] === q.answer) slot.correct += 1
    map.set(q.section, slot)
  }
  const out: SectionStat[] = []
  for (const [section, { total, correct }] of map) {
    out.push({ section, total, correct, ratio: total === 0 ? 1 : correct / total })
  }
  return out
}

function pickWeakest(stats: SectionStat[]): SectionStat | null {
  if (stats.length === 0) return null
  // Need at least one miss in this section to call it "weakest" —
  // a 1/1 perfect-but-undersampled section isn't a useful headline.
  const withMiss = stats.filter((s) => s.total > s.correct)
  if (withMiss.length === 0) return null
  return [...withMiss].sort((a, b) => {
    if (a.ratio !== b.ratio) return a.ratio - b.ratio
    return b.total - b.correct - (a.total - a.correct)
  })[0]
}

// ── Trap clustering ────────────────────────────────────────────────

/** Load explanations for each missed qid, group by framework_id, and
 *  return the dominant cluster when ≥2 misses share the same trap.
 *  Caller passes a stable (memoized) array so the effect doesn't
 *  thrash on every parent render. */
function useTrapCluster(missedQids: string[]): TrapCluster | null {
  const [cluster, setCluster] = useState<TrapCluster | null>(null)

  useEffect(() => {
    let alive = true
    if (missedQids.length === 0) {
      setCluster(null)
      return
    }
    Promise.all(missedQids.map((qid) => loadExplanation(qid))).then((entries) => {
      if (!alive) return
      const counts = new Map<string, { count: number; qids: string[] }>()
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i]
        if (!e?.framework_id) continue
        const slot = counts.get(e.framework_id) ?? { count: 0, qids: [] }
        slot.count += 1
        slot.qids.push(missedQids[i])
        counts.set(e.framework_id, slot)
      }
      let best: TrapCluster | null = null
      for (const [framework_id, { count }] of counts) {
        if (count < 2) continue
        const section = sectionFromFrameworkId(framework_id)
        if (!section) continue
        if (!best || count > best.count) {
          best = { framework_id, section, count, headline: null }
        }
      }
      if (best) {
        // Resolve a one-line headline from the trap entry's tldr or
        // pattern_description. Best-effort — the cluster still renders
        // without it.
        loadTrapHeadline(best.framework_id).then((headline) => {
          if (!alive) return
          setCluster(best ? { ...best, headline } : null)
        })
      } else {
        setCluster(null)
      }
    })
    return () => {
      alive = false
    }
  }, [missedQids])

  return cluster
}

function sectionFromFrameworkId(id: string): Section | null {
  const prefix = id.split('-', 1)[0]
  if (['KVA', 'NOG', 'XYZ'].includes(prefix)) return prefix as Section
  return null
}

const FRAMEWORK_FILES: Record<string, string> = {
  KVA: '/frameworks/kva_traps.json',
  NOG: '/frameworks/nog_traps.json',
  XYZ: '/frameworks/xyz_traps.json',
}
const frameworkCache = new Map<string, Promise<Record<string, string>>>()

async function loadTrapHeadline(framework_id: string): Promise<string | null> {
  const section = sectionFromFrameworkId(framework_id)
  if (!section) return null
  const url = FRAMEWORK_FILES[section]
  if (!url) return null
  let promise = frameworkCache.get(url)
  if (!promise) {
    promise = fetch(url)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{
              entries: Array<{ id: string; tldr?: string; pattern_description?: string }>
            }>)
          : null,
      )
      .then((data) => {
        const map: Record<string, string> = {}
        for (const e of data?.entries ?? []) {
          map[e.id] = e.tldr ?? e.pattern_description ?? ''
        }
        return map
      })
    frameworkCache.set(url, promise)
  }
  const map = await promise
  return map[framework_id] || null
}
