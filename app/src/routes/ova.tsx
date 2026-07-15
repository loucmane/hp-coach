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

import { useDueMistakes, usePileMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { InkDryOnMount, Skrift, SkriftLine } from '@/components/motion/Skrift'
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
  //   - pile = today's "att repetera" pile → the nav numeral + the
  //     per-section "N väntar" lane counts (matches the numeral exactly).
  //   - due = ripe-now → what the repetera lane can actually replay right
  //     now (drives the CTA and its enabled/disabled state).
  const pile = usePileMistakes()
  const due = useDueMistakes()
  const pileCount = pile.data?.length ?? 0
  const dueCount = due.data?.length ?? 0
  const ark = useArketMotion()
  // Drying ink (A2): while the queue/stats queries resolve, the slots
  // where their numbers and copy will land hold static pre-impressions;
  // the ink dries in (opacity only) when the data arrives. Cached
  // queries skip the ceremony (isPending false on first render).
  const laneCopyPending = stats.isPending
  const queuePending = pile.isPending || due.isPending

  // The live per-lane folio signal: how many mistakes each section carries
  // in today's PILE — same slice the nav numeral counts, so the lane numbers
  // and the numeral agree. Zero → no number (real data or nothing).
  const pileBySection = useMemo(() => countsBySection(pile.data), [pile.data])
  // Ripe-now per section — the repetera lane's section chips replay only
  // what is actually due (you can't replay tomorrow's items early).
  const dueBySection = useMemo(() => countsBySection(due.data), [due.data])

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
      ovaDueCount={pileCount}
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
              {/* Inline write-in (a <p> cannot host a div) — the copy
               *  writes itself in over a faint baseline rule. */}
              <Skrift ready={!laneCopyPending} lines={1}>
                <SkriftLine line={0} inline ruleW="42ch">
                  {weakest
                    ? `Schemat föreslår ${weakest} — svagast just nu. Välj fritt om du hellre tar något annat.`
                    : 'Välj en sektion att öva, eller ta en blandad övning över alla åtta delprov.'}
                </SkriftLine>
              </Skrift>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {SECTION_KEYS.map((s) => {
                const hot = s === weakest
                const laneDue = pileBySection[s]
                return (
                  // The row is the door (A2): the lane starts the drill
                  // IMMEDIATELY (`start: true` — no idle interstitial on
                  // the hub path) and the section code travels with you:
                  // it morphs from this row into the first question's
                  // eyebrow via the shared door layoutId.
                  // The layout wrapper lets a chip whose live count
                  // arrives (or resolves to zero) re-seat its width on
                  // the veck spring instead of snapping, and its flex
                  // siblings glide rather than jump (A2: small in-place
                  // layout shifts ride veck).
                  <motion.span
                    key={s}
                    layout
                    transition={ark.veck}
                    style={{ display: 'inline-flex' }}
                  >
                    <Link
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
                        // Post-data material with no honest pre-reservation
                        // (any of the eight could be "svagast") — dries in
                        // on mount instead of popping.
                        <InkDryOnMount>
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
                        </InkDryOnMount>
                      )}
                      {(pile.isPending || laneDue > 0) && (
                        // The lane's live folio signal (bake-off idiom:
                        // "3 väntar") — this section's CURRENT due
                        // repetitions. Mono + muted: the accent numeral
                        // stays reserved for the nav station. While the
                        // pile resolves the slot holds a pre-impression;
                        // the count dries in over it, or the slot closes
                        // up on the veck spring when the lane is clear.
                        <span
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.06em',
                            color: 'var(--muted)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <Skrift ready={!pile.isPending} lines={1}>
                            <SkriftLine line={0} inline ruleW="7ch">
                              {laneDue > 0 ? (
                                <span data-testid={`ova-due-${s}`}>{laneDue} väntar</span>
                              ) : null}
                            </SkriftLine>
                          </Skrift>
                        </span>
                      )}
                    </Link>
                  </motion.span>
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
              <Skrift ready={!queuePending} lines={1}>
                <SkriftLine line={0} inline ruleW="40ch">
                  {pileCount > 0
                    ? // Prefer ONE number — today's pile — wherever the two agree.
                      // Only when some of the pile isn't ripe yet do we name both
                      // ("N redo nu · M i dagens hög"), since you replay the ripe
                      // ones and the rest become ready soon.
                      dueCount === pileCount
                      ? `${pileCount} ${pileCount === 1 ? 'miss' : 'missar'} att repetera — de äldsta först.`
                      : dueCount > 0
                        ? `${dueCount} redo att repetera nu · ${pileCount} i dagens hög — de äldsta först.`
                        : `Inget är redo just nu — ${pileCount} ${pileCount === 1 ? 'miss ligger' : 'missar ligger'} i dagens hög och blir redo snart.`
                    : 'Kön är tom just nu — allt du missat är återlärt. Repetitionen står kvar här ändå.'}
                </SkriftLine>
              </Skrift>
            </p>
            {dueCount > 0 && (
              // Section-scoped repetition (owner 2026-07-14): chips for the
              // sections that have ripe misses, same door grammar as the
              // drill lanes — "just the ORD ones" without taking the whole
              // queue. Only ripe sections render (real data or nothing);
              // the all-sections door below is the stable geography.
              // Post-data material (which sections are ripe is unknowable
              // beforehand) — the whole row dries in on mount.
              <InkDryOnMount block>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  {SECTION_KEYS.filter((s) => (dueBySection[s] ?? 0) > 0).map((s) => (
                    <Link
                      key={s}
                      to="/repetition"
                      search={{ section: s, start: true }}
                      data-testid={`ova-rep-${s}`}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        padding: '8px 13px',
                        border: '1px solid var(--hairline)',
                        background: 'var(--panel)',
                        color: 'var(--ink)',
                        borderRadius: 'calc(var(--radius) * 0.4)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: 7,
                      }}
                    >
                      {s}
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.06em',
                          color: 'var(--muted)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {dueBySection[s]}
                      </span>
                    </Link>
                  ))}
                </div>
              </InkDryOnMount>
            )}
            <Link
              to="/repetition"
              // The row is the door (Fix C, owner 2026-07-13): tapping starts
              // the repetition session immediately (?start=1 → autoStart), no
              // idle interstitial — same pattern as the section lanes. Direct
              // /repetition navigation keeps its idle screen.
              search={{ start: true }}
              data-testid="ova-repetition"
              aria-disabled={!queuePending && dueCount === 0 ? true : undefined}
              style={{
                ...laneCta,
                color: !queuePending && dueCount === 0 ? 'var(--muted)' : laneCta.color,
              }}
            >
              <Skrift ready={!queuePending} lines={1}>
                <SkriftLine line={0} inline ruleW="12ch">
                  {dueCount > 0
                    ? `Repetera ${Math.min(dueCount, 10)} →`
                    : pileCount > 0
                      ? 'Inget redo än'
                      : 'Kön är tom'}
                </SkriftLine>
              </Skrift>
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
