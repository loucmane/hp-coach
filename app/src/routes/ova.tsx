// /ova — the Öva hub. The practice door lands here, not straight into a
// drill: two lanes shown UNCONDITIONALLY (owner nav redesign 2026-07-11).
//
//   Öva      — drill entry. Pick a section (the scheduler suggests your
//              weakest), or take a blended pass across all eight. Each
//              lane is a DOOR (A2/owner 2026-07-12): tapping it starts
//              that section's drill immediately (`start: true`, no idle
//              interstitial) with the section code morphing from the row
//              into the first question's eyebrow, and each lane shows its
//              live due-repetition count ("N väntar", dueCountsBySection).
//   Repetera — the spaced-repetition queue. Stands even at 0 in queue
//              ("kön är tom just nu"): a door that disappears is a door
//              you can't learn the location of (ADHD-PI: stable geography
//              beats adaptive hiding).
//
// The hub absorbs the nav entries for /drill and /repetition — those
// routes keep working (drills in progress, deep links), but the door
// goes here.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useMemo } from 'react'

import { useActiveMistakes, useDueMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { countsBySection } from '@/lib/dueBySection'
import { sectionDoorLayoutId, useArketMotion } from '@/lib/motion'
import { TAB_ROUTE } from '@/lib/nav'
import { computeSectionScore, rankWeakness } from '@/lib/scoring'

export const Route = createFileRoute('/ova')({
  component: OvaRoute,
})

function OvaRoute() {
  const navigate = useNavigate()
  const stats = useStats()
  // Two vocabularies (see useMistakes.ts):
  //   - active = the whole repetition queue → the nav numeral + the
  //     per-section "N väntar" lane counts (matches the numeral, rolls up
  //     on a fresh mistake).
  //   - due = ripe-now → the repetera lane's "mogna för återkoppling"
  //     copy and CTA (you can only replay what's ripe).
  const active = useActiveMistakes()
  const due = useDueMistakes()
  const activeCount = active.data?.length ?? 0
  const dueCount = due.data?.length ?? 0
  const ark = useArketMotion()

  // The live per-lane folio signal: how many mistakes each section carries
  // in the ACTIVE queue — same slice the nav numeral counts, so the lane
  // numbers and the numeral agree. Zero → no number (real data or nothing).
  const activeBySection = useMemo(() => countsBySection(active.data), [active.data])

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
      ovaDueCount={activeCount}
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
                const laneDue = activeBySection[s]
                return (
                  // The row is the door (A2): the lane starts the drill
                  // IMMEDIATELY (`start: true` — no idle interstitial on
                  // the hub path) and the section code travels with you:
                  // it morphs from this row into the first question's
                  // eyebrow via the shared door layoutId.
                  <Link
                    key={s}
                    to="/drill"
                    search={{ section: s, start: true }}
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
                    {ark.rm ? (
                      s
                    ) : (
                      <motion.span
                        layoutId={sectionDoorLayoutId(s)}
                        transition={ark.arket}
                        style={{ display: 'inline-block' }}
                      >
                        {s}
                      </motion.span>
                    )}
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
                    {laneDue > 0 && (
                      // The lane's live folio signal (bake-off idiom:
                      // "3 väntar") — this section's CURRENT due
                      // repetitions. Mono + muted: the accent numeral
                      // stays reserved for the nav station.
                      <span
                        data-testid={`ova-due-${s}`}
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.06em',
                          color: 'var(--muted)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {laneDue} väntar
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
            <Link
              to="/drill"
              search={{ mixed: true, start: true }}
              data-testid="ova-mixed"
              style={laneCta}
            >
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
                ? // "mogna" = due now (replayable). When the whole queue is
                  // larger, name the total as "i kön" so the two numbers can't
                  // be confused — you replay the ripe ones, the rest wait.
                  `${dueCount} ${dueCount === 1 ? 'miss' : 'missar'} ${dueCount === 1 ? 'är mogen' : 'är mogna'} för återkoppling — de äldsta först.${
                    activeCount > dueCount ? ` ${activeCount} i kön totalt.` : ''
                  }`
                : activeCount > 0
                  ? `Inget är moget för återkoppling just nu — ${activeCount} ${activeCount === 1 ? 'miss ligger' : 'missar ligger'} i kön och mognar snart.`
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
              {dueCount > 0
                ? `Repetera ${Math.min(dueCount, 10)} →`
                : activeCount > 0
                  ? 'Inget moget än'
                  : 'Kön är tom'}
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
