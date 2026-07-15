// /lektion — Layer 1 framework reader.
//
// `/lektion` with no section shows a picker listing every section. The
// picker mirrors the drill section copy so the language is consistent.
// `/lektion?section=NOG` jumps straight into that section's reader.
//
// Auth-gated by __root.tsx. No D1 round-trip — frameworks are static
// JSON in public/.
//
// Naming caveat: PRD § 5.16 reserves "Lektion" for LLM-curated
// pedagogy (Phase B5). What this route renders today is raw framework
// JSON via LessonReader → TrapCard (B1.0). The chrome stays when B5
// swaps the content source.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'

import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { LessonReader } from '@/components/lesson/LessonReader'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Mono } from '@/components/primitives'
import { wiredSections } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { uppslagDoorLayoutId, useArketMotion, useFirstContentSignal } from '@/lib/motion'
import { computeSectionScore, formatScore, rankWeakness } from '@/lib/scoring'

type Search = { section?: Section }

function validateSearch(input: Record<string, unknown>): Search {
  const raw = input.section
  if (typeof raw === 'string' && (SECTION_KEYS as readonly string[]).includes(raw)) {
    return { section: raw as Section }
  }
  return {}
}

export const Route = createFileRoute('/lektion')({
  validateSearch,
  component: LektionRoute,
})

// One line per section, sold by the section's biggest leverage trap
// rather than its definition — so a student deciding "which lesson
// at 9pm?" feels "yes, that's me" rather than reading a glossary.
// By convention each line is the gist of the section framework's
// first entry (the highest-leverage one in the catalog).
const SECTION_BLURB: Record<Section, string> = {
  ORD: 'Ordförståelse — täta rotkluster (för-, be-, över-) återkommer ofta.',
  LÄS: 'Svensk läsförståelse — det texten säger, inte det texten antyder.',
  MEK: 'Meningskomplettering — verb och objekt sitter ihop. Bytt verb låter fel.',
  ELF: 'Engelsk läsförståelse — det passagen säger, inte det den antyder.',
  XYZ: 'Matematisk problemlösning — minustecken över en parentes byter ALLA termer.',
  KVA: 'Kvantitativa jämförelser — kvadrat-likhet låser inte tecken.',
  NOG: 'Datasufficiens — två radsummor räcker inte för en enskild cell.',
  DTK: 'Diagram, tabeller, kartor — pinna identifieraren först, läs av sedan.',
}

function LektionRoute() {
  // Boot-veil content signal (#305 owner verdict) — /lektion (Uppslag)
  // has no Skrift block at the picker/reader entry; content is local
  // framework data, ready by mount.
  useFirstContentSignal()
  const { section } = Route.useSearch()
  const navigate = useNavigate()
  // Esc-to-parent: reader → picker, picker → home. Status line shows
  // "esc tillbaka" so the gesture is discoverable; this wires it. The
  // CommandPalette also listens for Escape, but only when its overlay
  // is open, so there's no double-handle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if ((e.target as HTMLElement | null)?.closest('[data-palette-open]')) return
      e.preventDefault()
      if (section) navigate({ to: '/lektion' })
      else navigate({ to: '/' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [section, navigate])

  if (section) return <ReaderShell section={section} />
  return <PickerShell />
}

// ── Picker ─────────────────────────────────────────────────────────

function PickerShell() {
  return (
    <MobileFrame activeTab="uppslag">
      <Page
        runningHead={['HP · COACH', 'Uppslag']}
        status={{
          mode: 'UPPSLAG',
          context: 'välj sektion',
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <PickerBody />
      </Page>
    </MobileFrame>
  )
}

// Exported (not just used by PickerShell) so the W4 door-continuity unit
// test can render the chip list without a router context — PickerBody
// itself has no route dependency (no Route.useSearch()), only its parent
// LektionRoute does.
export function PickerBody() {
  const navigate = useNavigate()
  const wired = new Set(wiredSections())
  const stats = useStats()
  const dueCount = useDueMistakes().data?.length ?? 0
  const ark = useArketMotion()

  // Weakness ranking — sections the user is weakest at percolate to
  // the top of the picker so "what should I study?" answers itself.
  // The shared rankWeakness() helper excludes low-confidence sections
  // (fewer than 10 attempts) unless every section is low-confidence,
  // so we don't recommend studying noise. Anything not in the ranked
  // pool falls through to its original SECTION_KEYS order — keeps
  // wired-but-unattempted sections discoverable and never-attempted
  // sections together at the bottom.
  const orderedSections = useMemo<readonly Section[]>(() => {
    if (!stats.data) return SECTION_KEYS
    const scores = SECTION_KEYS.map((s) => computeSectionScore(s, stats.data.bySection[s]))
    const ranked = rankWeakness(scores).map((s) => s.section)
    const rankedSet = new Set(ranked)
    const remainder = SECTION_KEYS.filter((s) => !rankedSet.has(s))
    return [...ranked, ...remainder]
  }, [stats.data])

  // Per-section score map for the mono "0.42" tail badge. Re-derived
  // here rather than threaded through orderedSections so the score
  // lookup stays explicit at render time.
  const scoreBySection = useMemo<Partial<Record<Section, number | null>>>(() => {
    if (!stats.data) return {}
    const out: Partial<Record<Section, number | null>> = {}
    for (const s of SECTION_KEYS) {
      out[s] = computeSectionScore(s, stats.data.bySection[s]).score
    }
    return out
  }, [stats.data])

  // Index 0 in the ordered list gets the SVAGAST badge — but only when
  // the ranking actually reflects signal (otherwise the badge is a lie
  // about a cold-start ordering).
  const hasRankSignal = stats.data
    ? rankWeakness(SECTION_KEYS.map((s) => computeSectionScore(s, stats.data.bySection[s])))
        .length > 0
    : false

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        // Centered single-column to match the section reader (LessonReader)
        // — same content measure (68ch + symmetric gutters) so the picker
        // and the reader share one centred column.
        width: '100%',
        maxWidth: 'calc(68ch + 2 * clamp(20px, 4vw + 12px, 56px))',
        marginInline: 'auto',
        paddingInline: 'clamp(20px, 4vw + 12px, 56px)',
        paddingTop: 'clamp(32px, 4vw + 16px, 64px)',
        paddingBottom: 'clamp(48px, 6vw, 96px)',
      }}
    >
      <header className="reveal" style={{ animationDelay: '0ms' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Link
            to="/"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              textDecoration: 'none',
            }}
          >
            ← Hem
          </Link>
          <span aria-hidden style={{ color: 'var(--hairline)' }}>
            ·
          </span>
          <Mono>UPPSLAG</Mono>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 6vw + 16px, 88px)',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: '12px 0 0 0',
          }}
        >
          Läs först.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(17px, 0.8vw + 14px, 22px)',
            lineHeight: 1.4,
            color: 'var(--ink-2)',
            margin: '16px 0 0 0',
            maxWidth: '52ch',
          }}
        >
          Varje sektion har sitt eget mönsterbibliotek — fällor, motåtgärder och taktiker hämtade
          från 27 riktiga prov. Välj en sektion att läsa innan du övar.
        </p>
      </header>

      <ul
        className="reveal"
        style={{
          marginTop: 'clamp(32px, 4vw + 16px, 64px)',
          padding: 0,
          listStyle: 'none',
          animationDelay: '120ms',
        }}
      >
        {orderedSections.map((sec, i) => {
          const isWired = wired.has(sec)
          const isWeakest = i === 0 && hasRankSignal && isWired
          const score = scoreBySection[sec]
          return (
            <li key={sec} style={{ borderTop: '1px solid var(--hairline)' }}>
              <button
                type="button"
                onClick={() => isWired && navigate({ to: '/lektion', search: { section: sec } })}
                disabled={!isWired}
                style={{
                  all: 'unset',
                  display: 'block',
                  width: '100%',
                  cursor: isWired ? 'pointer' : 'default',
                  paddingBlock: 'clamp(20px, 2vw + 8px, 32px)',
                  opacity: isWired ? 1 : 0.45,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 'clamp(16px, 2vw, 28px)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(28px, 2.5vw + 10px, 44px)',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      color: 'var(--ink)',
                      minWidth: 80,
                    }}
                  >
                    {/* The chip is the door (W4): the section code morphs
                     *  into the reader's header eyebrow via the shared
                     *  uppslag-door layoutId. Only wired sections open a
                     *  reader, so only wired chips carry the id — a
                     *  disabled "kommer snart" chip has no landing station. */}
                    {ark.rm || !isWired ? (
                      sec
                    ) : (
                      <motion.span
                        layoutId={uppslagDoorLayoutId(sec)}
                        transition={ark.arket}
                        style={{ display: 'inline-block' }}
                      >
                        {sec}
                      </motion.span>
                    )}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(15px, 0.6vw + 13px, 18px)',
                      lineHeight: 1.45,
                      color: 'var(--ink-2)',
                      flex: 1,
                      minWidth: '20ch',
                    }}
                  >
                    {SECTION_BLURB[sec]}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 8,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {isWeakest && (
                      // WCAG AA: --accent measures ~3.65:1 on the Sand-light
                      // default at this 11px size — fails the 4.5:1
                      // normal-text threshold (axe-core audit). --ink
                      // passes; the word "svagast" itself carries the
                      // signal, not just the color.
                      <span
                        data-testid="lektion-svagast"
                        style={{ color: 'var(--ink)', fontWeight: 600 }}
                      >
                        svagast
                      </span>
                    )}
                    {score != null && (
                      <span data-testid={`lektion-score-${sec}`} style={{ color: 'var(--ink-2)' }}>
                        {formatScore(score)}
                      </span>
                    )}
                    <span>{isWired ? 'läs →' : 'kommer snart'}</span>
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {/* "Öva direkt" — practice without reading first: mixed interleaving
       *  (the daily-plan mastery item) + spaced repetition of your misses,
       *  kept subordinate to the read-first section list above (learning-
       *  modes design Phase 1). */}
      <div
        className="reveal"
        style={{ marginTop: 'clamp(30px, 3vw + 10px, 48px)', animationDelay: '200ms' }}
      >
        <Mono>Eller öva direkt</Mono>
        <Link to="/drill" search={{ mixed: true }} data-testid="lektion-mixed" style={shortcutRow}>
          <span style={shortcutLabel}>Blandad övning · alla åtta delprov</span>
          <span style={shortcutMeta}>10 frågor →</span>
        </Link>
        {dueCount > 0 && (
          <Link to="/repetition" data-testid="lektion-repetition" style={shortcutRow}>
            <span style={shortcutLabel}>Repetera dina missar</span>
            <span style={shortcutMeta}>{dueCount} st →</span>
          </Link>
        )}
      </div>
    </div>
  )
}

const shortcutRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 16,
  paddingBlock: 14,
  borderTop: '1px solid var(--hairline)',
  textDecoration: 'none',
}
const shortcutLabel: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(16px, 0.6vw + 13px, 19px)',
  color: 'var(--ink)',
}
const shortcutMeta: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
}

// ── Reader ─────────────────────────────────────────────────────────

function ReaderShell({ section }: { section: Section }) {
  return (
    <MobileFrame activeTab="uppslag">
      <Page
        runningHead={['HP · COACH', `Uppslag · ${section}`]}
        status={{
          mode: 'UPPSLAG',
          context: section,
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <LessonReader section={section} />
        <BackToPicker />
      </Page>
    </MobileFrame>
  )
}

function BackToPicker() {
  return (
    <div
      style={{
        paddingInline: 'clamp(20px, 4vw + 12px, 56px)',
        paddingBottom: 'clamp(32px, 4vw, 56px)',
      }}
    >
      <Link
        to="/lektion"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          textDecoration: 'none',
        }}
      >
        ← alla sektioner
      </Link>
    </div>
  )
}
