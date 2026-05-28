// HomeVariantD — third pass. Editorial single-column with marginalia rail.
//
// Web references that drove the moves (real product UI, not landing copy):
//   1. Linear redesign post (linear.app/now/how-we-redesigned-the-linear-ui):
//      "align labels, icons, buttons vertically and horizontally" — the whole
//      page rides on ONE anchored vertical line. Inter Display for headings,
//      Inter for the rest. Translates here as: every primary element starts
//      at column-left, Newsreader owns headline + lead, JetBrains Mono owns
//      metadata, no second column ever competes.
//   2. Vercel dashboard redesign + "new dashboard overview" changelog:
//      they REMOVED the header. State is ambient (production status appears
//      where projects live, not stacked above them). I removed the kicker
//      tower; date + days-to-exam migrate into a left marginalia rail.
//   3. Raycast My Schedule docs (manual.raycast.com/calendar): "the summary
//      at the top shows your next upcoming meeting" — one item is promoted
//      to focal, the rest are an ambient list. Plan item 01 here gets full
//      editorial weight (headline-scale Newsreader + accent hairline);
//      items 02–03 are a hanging-figure continuation list.
//   4. Stripe Press (press.stripe.com): book detail pattern — long title
//      column with terse data (pages, author, year) flanking in tabular
//      mono. Score + day-shape live in this exact slot here, NOT promoted
//      to a hero numeral. The score is contextual gauge, not headline.
//   5. McMaster-Carr / HN density thread (item 43925732): "consistent
//      grid layouts presented uniformly by specification." Plan items and
//      trap rows share one shared grid: hanging figure / title / time.
//      Density via uniformity, not via different treatments per row.
//   6. Granola brand post (granola.ai/blog/a-new-look-for-granola):
//      "slab serif for display + neutral UI font." Maps to Newsreader +
//      JetBrains Mono already in the system. The display serif holds
//      the lead; mono recedes to ambient state without competing.
//
// What this fixes about Variant C:
//   - One type system per region, not 5 treatments stacked. The "hero
//     numeral" experiment is dropped; the score is a marginalia gauge.
//   - No 2-column composition fighting itself. Single editorial column.
//   - The eye lands on the lead plan item (where the action is), not on
//     a competing numeral block.
//   - Accent enters once: the 24px hairline at the lead row's start.
//   - Trap rows reuse the SAME hanging-figure grid as plan rows. The
//     page reads as one publication, not three.

import type { ReactNode } from 'react'

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { Eyebrow, Hairline } from '@/components/primitives'
import { Display, Marginalia } from '@/components/Typography'
import type { PlanItem } from '@/lib/scheduler'

import { FIXTURE_PLAN, FIXTURE_TOP_TRAPS } from './homeBakeoffFixtures'

// ── Layout constants ──────────────────────────────────────────────────
//
// The whole page is one grid: a narrow marginalia rail on the left and a
// reading column on the right. The rail is wide enough for "ONS 27 MAJ"
// + "151 DAGAR" but narrow enough that it reads as a margin, not a
// second column. The column is capped at ~64ch — measured-density width.

const RAIL_WIDTH = 132
const COLUMN_PAD_X = 28
const COLUMN_MAX_CH = '60ch'

// ── HomeVariantD ──────────────────────────────────────────────────────

export function HomeVariantD() {
  const [lead, ...rest] = FIXTURE_PLAN.items
  const score = '0.64'
  const ceiling = '2.0'
  const verbal = '0.79'
  const kvant = '0.49'
  const totalMin = FIXTURE_PLAN.estimatedMinutes
  const doneCount = FIXTURE_PLAN.items.filter((i) => i.completed).length
  const totalCount = FIXTURE_PLAN.items.length

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        display: 'grid',
        gridTemplateColumns: `${RAIL_WIDTH}px minmax(0, 1fr)`,
        color: 'var(--ink)',
        minHeight: 720,
      }}
    >
      {/* ── Marginalia rail ──
       *  Date, days-to-exam, score, day-shape. All in the margin so the
       *  reading column starts unobstructed. Vercel's "kill the header"
       *  move; Stripe Press's "data in the margin." */}
      <aside
        style={{
          padding: '32px 0 32px 28px',
          borderRight: '1px solid var(--hairline)',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <RailItem label="Idag">
          <RailValue>Ons 27 maj</RailValue>
          <RailNote>151 dagar · höst 26</RailNote>
        </RailItem>

        <RailItem label="Just nu">
          <ScoreGauge score={score} ceiling={ceiling} />
          <RailNote>
            v <RailNum>{verbal}</RailNum>
            <span style={{ margin: '0 6px', color: 'var(--muted)' }}>·</span>k{' '}
            <RailNum>{kvant}</RailNum>
          </RailNote>
        </RailItem>

        <RailItem label="Plan">
          <RailValue>
            <RailNum>{doneCount}</RailNum>
            <span style={{ color: 'var(--muted)' }}>/{totalCount}</span>
          </RailValue>
          <RailNote>~{totalMin} min</RailNote>
        </RailItem>
      </aside>

      {/* ── Reading column ── */}
      <main
        style={{
          padding: `40px ${COLUMN_PAD_X}px 40px ${COLUMN_PAD_X + 8}px`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Greeting — single line, Display 2. No comma-then-name break;
         *  reads as a sentence, not a card title. */}
        <Display level={2} as="h1" style={{ maxWidth: COLUMN_MAX_CH, lineHeight: 1.06 }}>
          God eftermiddag, Loucmane.
        </Display>

        <Marginalia
          tone="ink-2"
          style={{
            marginTop: 14,
            display: 'block',
            maxWidth: COLUMN_MAX_CH,
            lineHeight: 1.5,
          }}
        >
          Tre punkter idag. Vi börjar med repetitionen — tio gamla missar väntar och de är de äldsta
          först.
        </Marginalia>

        <div style={{ height: 40 }} />

        {/* ── Lead row ── the promoted next action. Raycast's "next
         *  upcoming meeting at top" pattern. Full editorial weight,
         *  single accent hairline at the start. */}
        <PlanLead item={lead} index={1} />

        <div style={{ height: 28 }} />

        {/* ── Continuation list ── */}
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxWidth: COLUMN_MAX_CH,
          }}
        >
          {rest.map((item, idx) => (
            <PlanRow key={item.id} item={item} index={idx + 2} />
          ))}
        </ol>

        <div style={{ flex: 1, minHeight: 56 }} />

        {/* ── Index of traps ── same hanging-figure grid as plan rows,
         *  so the page reads as one publication. No left-rule, no
         *  italic, no decoration. Pure index. */}
        <TrapIndex traps={FIXTURE_TOP_TRAPS} />
      </main>
    </div>
  )
}

// ── Marginalia rail primitives ────────────────────────────────────────

function RailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Eyebrow style={{ color: 'var(--muted)' }}>{label}</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  )
}

function RailValue({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 17,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {children}
    </span>
  )
}

function RailNote({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {children}
    </span>
  )
}

function RailNum({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--ink-2)' }}>{children}</span>
}

// ScoreGauge — score lives in the margin as a gauge, NOT as a hero
// numeral. Stripe Press "404pp" treatment: terse, present, contextual.
// The denominator is tonally subordinate; the value sits with the
// other rail items at the same display size so the rail reads even.
function ScoreGauge({ score, ceiling }: { score: string; ceiling: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        fontFamily: 'var(--font-display)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.1,
        letterSpacing: '-0.01em',
      }}
    >
      <span style={{ fontSize: 22, color: 'var(--ink)' }}>{score}</span>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>/ {ceiling}</span>
    </span>
  )
}

// ── Plan rows ─────────────────────────────────────────────────────────
//
// Two treatments off one grid:
//   - PlanLead:  hanging figure "01" + accent hairline + Display 3
//                headline + editorial rationale + minutes
//   - PlanRow:   hanging figure NN + body-size headline + rationale +
//                minutes; hairline above each row (Linear's "alignment
//                everywhere" — the figures align across both states)
//
// The hanging-figure grid is shared with TrapIndex so plan and traps
// read as the same instrument.

const ROW_GRID = '36px minmax(0, 1fr) 64px' // figure | content | minutes

function PlanLead({ item, index }: { item: PlanItem; index: number }) {
  return (
    <article
      data-testid={`daily-plan-item-${item.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: ROW_GRID,
        columnGap: 16,
        alignItems: 'baseline',
        maxWidth: COLUMN_MAX_CH,
      }}
    >
      <HangingFigure index={index} accent />
      <div style={{ minWidth: 0 }}>
        <Eyebrow style={{ marginBottom: 10 }}>{kickerFor(item)}</Eyebrow>
        <a
          href={item.href}
          data-testid={`daily-plan-link-${item.id}`}
          style={{ textDecoration: 'none', color: 'var(--ink)', display: 'block' }}
        >
          <Display level={3} as="h2" style={{ letterSpacing: '-0.018em', lineHeight: 1.12 }}>
            {item.headline}
          </Display>
        </a>
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 15.5,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            maxWidth: '52ch',
          }}
        >
          {item.rationale}
        </p>
      </div>
      <TimeHint minutes={item.estimatedMinutes} />
    </article>
  )
}

function PlanRow({ item, index }: { item: PlanItem; index: number }) {
  return (
    <li
      data-testid={`daily-plan-item-${item.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: ROW_GRID,
        columnGap: 16,
        alignItems: 'baseline',
        paddingBlock: 18,
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <HangingFigure index={index} />
      <div style={{ minWidth: 0 }}>
        <Eyebrow style={{ marginBottom: 6 }}>{kickerFor(item)}</Eyebrow>
        <a
          href={item.href}
          data-testid={`daily-plan-link-${item.id}`}
          style={{ textDecoration: 'none', color: 'var(--ink)', display: 'block' }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              lineHeight: 1.3,
              letterSpacing: '-0.012em',
              fontWeight: 500,
            }}
          >
            {item.headline}
          </h3>
        </a>
        <p
          style={{
            margin: '4px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
          }}
        >
          {item.rationale}
        </p>
      </div>
      <TimeHint minutes={item.estimatedMinutes} />
    </li>
  )
}

// HangingFigure — the "01" / "02" / "03" gutter figure. Stripe Press
// chapter-figure pattern: tabular mono, baseline-aligned with the
// content's first line. The accent variant gets a 2px Sage rule above
// the figure — the ONE place accent enters on the home page.
function HangingFigure({ index, accent }: { index: number; accent?: boolean }) {
  const label = String(index).padStart(2, '0')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {accent && (
        <span
          aria-hidden
          style={{
            display: 'block',
            width: 20,
            height: 2,
            background: 'var(--accent)',
            marginTop: 4,
          }}
        />
      )}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.08em',
          color: accent ? 'var(--ink-2)' : 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  )
}

function TimeHint({ minutes }: { minutes: number }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        alignSelf: 'baseline',
      }}
    >
      ~{minutes} min
    </span>
  )
}

// ── Trap index ────────────────────────────────────────────────────────
//
// Same hanging-figure grid as plan rows. The framework id replaces the
// "01/02/03" numeral; everything else aligns. Density via uniformity.

function TrapIndex({ traps }: { traps: TopTrap[] }) {
  if (traps.length === 0) return null
  return (
    <section style={{ maxWidth: COLUMN_MAX_CH }}>
      <Eyebrow>Återkommande fällor</Eyebrow>
      <Hairline style={{ background: 'var(--ink)', height: 1, width: 24, marginTop: 10 }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
        {traps.map((trap) => (
          <li
            key={trap.framework_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '104px minmax(0, 1fr) 64px',
              columnGap: 16,
              alignItems: 'baseline',
              paddingBlock: 14,
              borderTop: '1px solid var(--hairline)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                letterSpacing: '0.06em',
                color: 'var(--ink-2)',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 500,
              }}
            >
              {trap.framework_id}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14.5,
                lineHeight: 1.45,
                color: 'var(--ink)',
              }}
            >
              {trap.headline ?? '—'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {trap.count} ggr
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────

function kickerFor(item: PlanItem): string {
  const sectionPart = item.section ? ` · ${item.section}` : ''
  switch (item.kind) {
    case 'repetition':
      return `Repetition${sectionPart}`
    case 'lesson':
      return `Lektion${sectionPart}`
    case 'drill':
      return `Drill${sectionPart}`
  }
}
