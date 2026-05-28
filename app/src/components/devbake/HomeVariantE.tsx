// HomeVariantE — radical reduction. Home as a verb, not a dashboard.
//
// The other four variants all preserved the same set of regions —
// kicker / metadata / greeting / score / plan / traps — and competed
// only on how to arrange them. E takes the opposite move: aggressively
// cut everything that isn't *today's primary action*. The score lives
// on /progress, the traps live on /repetition; neither needs to live
// here.
//
// References (top-tier products solving the same "morning landing" job):
//   - Notion home: greeting + ONE block. That's the page.
//   - Stripe dashboard home: greeting + one metric. Two regions.
//   - Linear Triage: header + one column. One region.
//   - Raycast Calendar Today: one upcoming + small list.
//
// Composition (top-down):
//   1. Tiny date kicker (minimum register).
//   2. Greeting — Display 2 on two lines, the focal element.
//   3. Big breath (~96px).
//   4. ONE focal action card — kind eyebrow + headline + rationale +
//      "Börja →" CTA. The only place --accent appears on the page.
//   5. Quiet "eller börja någon annan punkt" italic introducer.
//   6. The remaining plan items as a muted list (headline + time).
//
// Cut: score readout (→ /progress), verbal+kvant (→ /progress),
// streak (→ chrome status line), exam phase (irrelevant), trap recap
// (→ /repetition), day-shape line (the focal card IS the day-shape),
// marginalia rail (no remaining data to put in it).

import { Mono } from '@/components/primitives'
import { Display } from '@/components/Typography'
import type { PlanItem } from '@/lib/scheduler'

import { FIXTURE_PLAN } from './homeBakeoffFixtures'

export function HomeVariantE() {
  const [focal, ...rest] = FIXTURE_PLAN.items

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--ink)',
        minHeight: 720,
      }}
    >
      <div
        style={{
          padding: 'clamp(40px, 5vw, 72px) clamp(32px, 5vw, 72px)',
          maxWidth: 780,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Date kicker — minimum register. The only metadata. */}
        <Mono style={{ color: 'var(--muted)' }}>Onsdag 27 maj</Mono>

        {/* Big breath before the greeting. */}
        <div style={{ height: 'clamp(40px, 5vh, 64px)' }} />

        <Display level={2} as="h1" style={{ maxWidth: '24ch', lineHeight: 1.02 }}>
          God eftermiddag,
          <br />
          Loucmane.
        </Display>

        {/* The biggest breath on the page — separates greeting from
         *  the focal action so the action lands as its own moment. */}
        <div style={{ height: 'clamp(72px, 9vh, 112px)' }} />

        {focal && <FocalAction item={focal} />}

        {/* Quieter breath before the alternatives — they're not the
         *  action, just a side door. */}
        <div style={{ height: 'clamp(56px, 7vh, 88px)' }} />

        {rest.length > 0 && <Alternatives items={rest} />}

        <div style={{ height: 56 }} />
      </div>
    </div>
  )
}

// ── Focal action — the ONE thing on the page ───────────────────────

function FocalAction({ item }: { item: PlanItem }) {
  const kindLabel =
    item.kind === 'repetition' ? 'Repetition' : item.kind === 'lesson' ? 'Lektion' : 'Övning'

  return (
    <section>
      {/* Single Sage accent hairline — the only place --accent
       *  appears on Home. Marks the focal action without a card. */}
      <div
        style={{
          width: 24,
          height: 2,
          background: 'var(--accent)',
          marginBottom: 16,
        }}
      />

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {kindLabel} · ~{item.estimatedMinutes} min
      </div>

      <div style={{ height: 14 }} />

      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(26px, 2vw + 12px, 36px)',
          lineHeight: 1.12,
          letterSpacing: '-0.018em',
          color: 'var(--ink)',
          maxWidth: '20ch',
        }}
      >
        {item.headline}
      </h2>

      <div style={{ height: 16 }} />

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          maxWidth: '52ch',
        }}
      >
        {item.rationale}
      </p>

      <div style={{ height: 32 }} />

      <a
        href={item.href}
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 10,
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 500,
          color: 'var(--accent)',
          textDecoration: 'none',
        }}
      >
        Börja
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>→</span>
      </a>
    </section>
  )
}

// ── Alternatives — the side door, never the front ─────────────────

function Alternatives({ items }: { items: PlanItem[] }) {
  return (
    <section>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--muted)',
          marginBottom: 16,
        }}
      >
        eller börja någon annan punkt
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 24,
                alignItems: 'baseline',
                padding: '10px 0',
                color: 'var(--ink-2)',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  lineHeight: 1.4,
                }}
              >
                {item.headline}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ~{item.estimatedMinutes} min
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
