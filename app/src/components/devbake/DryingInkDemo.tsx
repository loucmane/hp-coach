// D1 · Torkande bläck — the drying-ink data-arrival treatment, replayable.
//
// W1 of the motion wave: query resolution used to POP content in,
// violating Arket's One Sheet law. The product treatment (shipped on
// Home / Öva / Framsteg / the session interstitial) makes the skeleton
// and the content the SAME surface: a static faint pre-impression
// (Impress — never shimmering, never looping) reserves the ink's honest
// dimensions, and when the data lands the impression lifts off (ut,
// 90ms, popLayout so nothing reflows) while the real ink dries in over
// the same box (tork register, opacity only, zero travel).
//
// This stage fakes a slow query so the owner can replay the arrival at
// will: "Ladda om" resets to the pre-impression state and re-resolves
// after a beat. Three representative surfaces, all running the ACTUAL
// product components/tokens:
//
//   1. the Home plan-card handoff (the real DailyPlanCard, plan null →
//      plan) — chrome and heading are ink from frame one, rows dry in;
//   2. an Öva-style lane line (copy + a "N väntar" count slot);
//   3. a Framsteg-style hero numeral.
//
// Reduced motion: every tween collapses to duration 0 — instant swap.

import { useEffect, useState } from 'react'

import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { Impress, InkSlot } from '@/components/motion/InkDry'
import { type DailyPlan, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'

/** How long the faked query "runs" — long enough to read the impression. */
const FAKE_LATENCY_MS = 1600

const DEMO_PLAN: DailyPlan = {
  version: PLAN_SCHEMA_VERSION,
  date: '2026-07-15',
  estimatedMinutes: 14,
  items: [
    {
      id: 'demo-rep',
      kind: 'repetition',
      section: null,
      headline: 'Repetition · 6 missar',
      rationale: 'Gör dem först — de äldsta håller på att glida.',
      estimatedMinutes: 5,
      href: '/repetition',
      completed: false,
    },
    {
      id: 'demo-drill',
      kind: 'drill',
      section: 'NOG',
      headline: 'NOG-drill · 10 frågor',
      rationale: 'Svagast just nu; påstående 1 ≠ påstående 2 spökar.',
      estimatedMinutes: 6,
      href: '/drill?section=NOG',
      completed: false,
    },
    {
      id: 'demo-lesson',
      kind: 'lesson',
      section: 'DTK',
      headline: 'Uppslag · DTK-diagramtyper',
      rationale: 'Kort läsning innan nästa DTK-pass.',
      estimatedMinutes: 3,
      href: '/lektion?section=DTK',
      completed: false,
    },
  ],
}

export function INKDEMO() {
  // `run` is the faked query's generation: mount = the cold load, each
  // "Ladda om" bumps it. The effect resets to the pre-impression state
  // and re-resolves after FAKE_LATENCY_MS.
  const [run, setRun] = useState(0)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    void run
    setReady(false)
    const t = setTimeout(() => setReady(true), FAKE_LATENCY_MS)
    return () => clearTimeout(t)
  }, [run])

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', color: 'var(--ink)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 8,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            margin: 0,
          }}
        >
          datan anländer · skelettet är samma ark — bläcket torkar in
        </p>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          data-testid="inkdemo-reload"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.06em',
            padding: '7px 14px',
            borderRadius: 999,
            border: '1px solid var(--hairline)',
            background: 'var(--panel)',
            color: 'var(--ink)',
            cursor: 'pointer',
          }}
        >
          Ladda om ↻
        </button>
      </div>

      {/* 1 · The real plan-card handoff — DailyPlanCard owns its own
       *  pre-impression state; passing plan null → plan replays exactly
       *  what Home does when useDailyPlan resolves. */}
      <DailyPlanCard plan={ready ? DEMO_PLAN : null} allComplete={false} />

      {/* 2 · Öva-lane grammar: copy line + count slot, product tokens. */}
      <section style={{ marginTop: 36 }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            margin: 0,
            maxWidth: '46ch',
          }}
        >
          <InkSlot
            ready={ready}
            impression={
              <>
                <Impress w={42} />
                <br />
                <Impress w={26} />
              </>
            }
          >
            Schemat föreslår NOG — svagast just nu. Välj fritt om du hellre tar något annat.
          </InkSlot>
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.08em',
            margin: '14px 0 0',
          }}
        >
          ORD{' '}
          <span style={{ fontSize: 10, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
            <InkSlot ready={ready} w={7}>
              3 väntar
            </InkSlot>
          </span>
        </p>
      </section>

      {/* 3 · Framsteg hero numeral: the impression sized to the score. */}
      <section style={{ marginTop: 36 }}>
        <h2 className="hpc-m3-display" style={{ margin: 0 }}>
          <InkSlot ready={ready} w={4}>
            1,41
          </InkSlot>
          <span style={{ fontSize: '0.45em', color: 'var(--muted)' }}> av 2,0</span>
        </h2>
      </section>
    </div>
  )
}
