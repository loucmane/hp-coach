// D1 · Skriften (levererad) — the shipped data-arrival treatment,
// replayable.
//
// Owner verdict on the original drying-ink (a gray impression that fades
// to content): "i didnt get the drying ink feeling" — it read as a
// quieter skeleton, not ink. W1 round 2 replaced it with L2 "Skriften"
// (the pen school), now SHIPPED on Home / Öva / Framsteg: before data,
// almost nothing — a faint BASELINE RULE per line; when the data lands
// each line WRITES IN, a left→right clip wipe at a snappy top-to-bottom
// cadence, the rule lifting as its line is written. The whole block
// finishes within ~600 ms however many lines (the cadence compresses),
// and a cached query skips the write-in entirely.
//
// This stage fakes a slow query so the owner can replay the arrival at
// will: "Ladda om" resets to the ruled sheet and re-resolves after a
// beat. Three representative surfaces, all running the ACTUAL product
// components/tokens:
//
//   1. the Home plan-card handoff (the real DailyPlanCard, plan null →
//      plan) — chrome and heading are ink from frame one, rows write in;
//   2. an Öva-style lane line (copy + a "N väntar" count slot);
//   3. a Framsteg-style hero numeral.
//
// Reduced motion / cached query: content written instantly, no rule.

import { useEffect, useState } from 'react'

import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { Skrift, SkriftLine } from '@/components/motion/Skrift'
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
          datan anländer · sidan skrivs in rad för rad — pennans skola (Skriften)
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
      <Skrift ready={ready} lines={2}>
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
            <SkriftLine line={0} inline ruleW="42ch">
              Schemat föreslår NOG — svagast just nu. Välj fritt om du hellre tar något annat.
            </SkriftLine>
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
            <span
              style={{ fontSize: 10, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}
            >
              <SkriftLine line={1} inline ruleW="7ch">
                3 väntar
              </SkriftLine>
            </span>
          </p>
        </section>
      </Skrift>

      {/* 3 · Framsteg hero numeral: the rule sized to the score. */}
      <Skrift ready={ready} lines={1}>
        <section style={{ marginTop: 36 }}>
          <h2 className="hpc-m3-display" style={{ margin: 0 }}>
            <SkriftLine line={0} inline ruleW="4ch">
              1,41
            </SkriftLine>
            <span style={{ fontSize: '0.45em', color: 'var(--muted)' }}> av 2,0</span>
          </h2>
        </section>
      </Skrift>
    </div>
  )
}
