// /ova — the Öva hub. The practice door lands here, not straight into a
// drill: two lanes shown UNCONDITIONALLY (owner nav redesign 2026-07-11).
//
//   Öva      — drill entry. Pick a section (the scheduler suggests your
//              weakest), or take a blended pass across all eight.
//   Repetera — the spaced-repetition queue. Stands even at 0 in queue
//              ("kön är tom just nu"): a door that disappears is a door
//              you can't learn the location of (ADHD-PI: stable geography
//              beats adaptive hiding).
//
// The hub absorbs the nav entries for /drill and /repetition — those
// routes keep working (drills in progress, deep links), but the door
// goes here.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { TAB_ROUTE } from '@/lib/nav'
import { computeSectionScore, rankWeakness } from '@/lib/scoring'

export const Route = createFileRoute('/ova')({
  component: OvaRoute,
})

function OvaRoute() {
  const navigate = useNavigate()
  const stats = useStats()
  const due = useDueMistakes()
  const dueCount = due.data?.length ?? 0

  // The scheduler's suggestion — the weakest section with real signal.
  // Null on a cold start (no ranking signal yet), which just means no
  // section carries the "svagast" tag.
  const weakest = useMemo<Section | null>(() => {
    if (!stats.data) return null
    const scores = SECTION_KEYS.map((s) => computeSectionScore(s, stats.data.bySection[s]))
    return rankWeakness(scores)[0]?.section ?? null
  }, [stats.data])

  return (
    <MobileFrame
      tabs
      activeTab="ova"
      onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
      ovaDueCount={dueCount}
    >
      <Page
        runningHead={['HP · COACH', 'Öva']}
        status={{
          mode: 'ÖVA',
          context: 'två spår',
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <div className="hpc-m3-frame" style={{ width: '100%', color: 'var(--ink)' }}>
          <DrillRailSection
            meta={
              <>
                <strong>Öva</strong>
                två spår · alltid öppna
              </>
            }
            delay={0}
          >
            <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
              Vad tränar vi?
            </h1>
          </DrillRailSection>

          {/* ── Spår A · Öva nytt ─────────────────────────────────── */}
          <DrillRailSection meta="Öva" delay={120} testid="ova-lane-drill">
            <h2 className="hpc-m3-h">Drilla en sektion</h2>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                lineHeight: 1.5,
                color: 'var(--ink-2)',
                margin: '8px 0 0',
                maxWidth: '46ch',
              }}
            >
              {weakest
                ? `Schemat föreslår ${weakest} — svagast just nu. Välj fritt om du hellre tar något annat.`
                : 'Välj en sektion att öva, eller ta en blandad övning över alla åtta delprov.'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {SECTION_KEYS.map((s) => {
                const hot = s === weakest
                return (
                  <Link
                    key={s}
                    to="/drill"
                    search={{ section: s }}
                    data-testid={`ova-section-${s}`}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      padding: '8px 13px',
                      border: hot ? '1px solid var(--ink-2)' : '1px solid var(--hairline)',
                      background: 'var(--panel)',
                      color: 'var(--ink)',
                      borderRadius: 'calc(var(--radius) * 0.4)',
                      textDecoration: 'none',
                      fontWeight: hot ? 600 : 400,
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 7,
                    }}
                  >
                    {s}
                    {hot && (
                      <span
                        data-testid="ova-suggested"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-2)',
                        }}
                      >
                        svagast
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
            <Link to="/drill" search={{ mixed: true }} data-testid="ova-mixed" style={laneCta}>
              Blandad övning · alla åtta delprov →
            </Link>
          </DrillRailSection>

          {/* ── Spår B · Repetera ─────────────────────────────────── */}
          <DrillRailSection meta="Repetera" delay={220} testid="ova-lane-repetition">
            <h2 className="hpc-m3-h">Dina missar</h2>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                lineHeight: 1.5,
                color: 'var(--ink-2)',
                margin: '8px 0 0',
                maxWidth: '46ch',
              }}
            >
              {dueCount > 0
                ? `${dueCount} ${dueCount === 1 ? 'miss' : 'missar'} är mogna för återkoppling — de äldsta först.`
                : 'Kön är tom just nu — allt du missat är återlärt. Repetitionen står kvar här ändå.'}
            </p>
            <Link
              to="/repetition"
              data-testid="ova-repetition"
              aria-disabled={dueCount === 0 ? true : undefined}
              style={{
                ...laneCta,
                color: dueCount === 0 ? 'var(--muted)' : laneCta.color,
              }}
            >
              {dueCount > 0 ? `Repetera ${Math.min(dueCount, 10)} →` : 'Kön är tom'}
            </Link>
          </DrillRailSection>
        </div>
      </Page>
    </MobileFrame>
  )
}

const laneCta = {
  display: 'inline-block',
  marginTop: 18,
  fontFamily: 'var(--font-mono)' as const,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--accent)',
  textDecoration: 'none' as const,
}
