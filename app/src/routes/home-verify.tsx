// /home-verify — dev-only visual verification harness for Home,
// specifically the Kallelse / ProvpassStatusLine / ConfirmSheet surfaces
// (kallelsen-surfaces PR). Same rationale as /prov-verify: the real `/`
// route renders inside the Clerk-gated <SignedIn> tree, and the house
// verification rule requires a screenshot of real components with real
// output before claiming a UI change done. HomeMobile is prop-driven (see
// its own test file), so it renders here with a fixture DailyPlan that
// includes a `kind: 'mock'` item — outside the auth gate, no
// QueryClient/Clerk needed.
//
// Dev-gated via isDevSurface() — same mechanism as every other dev route.
// Kept per house rule (memory: "keep bake-offs" — dev verification routes
// are historical references, never deleted).

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Btn, Eyebrow } from '@/components/primitives'
import { isDevSurface } from '@/lib/devSurface'
import { PLAN_SCHEMA_VERSION, type PlanItem } from '@/lib/scheduler'
import { HomeMobile } from '@/screens/HomeMobile'

export const Route = createFileRoute('/home-verify')({
  component: HomeVerify,
})

const MOCK_PLAN_ITEM: PlanItem = {
  id: 'mock-2026-07-08',
  kind: 'mock',
  section: null,
  headline: 'Provpass · Verbal',
  rationale: '12 dagar sedan senaste — dags att mäta.',
  estimatedMinutes: 55,
  href: '/prov',
  completed: false,
}

function fixturePlan(withMock: boolean) {
  const items = [
    MOCK_PLAN_ITEM,
    {
      id: 'lesson-NOG-2026-07-08',
      kind: 'lesson' as const,
      section: 'NOG' as const,
      headline: 'NOG-lektion',
      rationale: 'Svagast sektionen — 1.2, börja med lektionen.',
      estimatedMinutes: 5,
      href: '/lektion?section=NOG',
      completed: false,
    },
  ]
  return {
    version: PLAN_SCHEMA_VERSION,
    date: '2026-07-08',
    items: withMock ? items : items.slice(1),
    estimatedMinutes: items.reduce((s, i) => s + i.estimatedMinutes, 0),
  }
}

function HomeVerify() {
  const dev = isDevSurface()
  const [provpassDag, setProvpassDag] = useState(true)
  const [layout, setLayout] = useState<'phone' | 'studio'>('phone')
  const [sparse, setSparse] = useState(false)

  if (!dev) {
    return (
      <div style={{ padding: 40 }}>
        <Eyebrow>Otillgänglig</Eyebrow>
        <p>Denna sida är endast tillgänglig i utvecklingsläge.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Btn
          size="sm"
          variant={provpassDag ? 'accent' : 'secondary'}
          onClick={() => setProvpassDag(true)}
        >
          Provpass-dag
        </Btn>
        <Btn
          size="sm"
          variant={!provpassDag ? 'accent' : 'secondary'}
          onClick={() => setProvpassDag(false)}
        >
          Vanlig dag
        </Btn>
        <Btn
          size="sm"
          variant={layout === 'phone' ? 'accent' : 'secondary'}
          onClick={() => setLayout('phone')}
        >
          Phone
        </Btn>
        <Btn
          size="sm"
          variant={layout === 'studio' ? 'accent' : 'secondary'}
          onClick={() => setLayout('studio')}
        >
          Desktop
        </Btn>
        <Btn
          size="sm"
          variant={sparse ? 'accent' : 'secondary'}
          onClick={() => setSparse((s) => !s)}
        >
          Sparse (low-data)
        </Btn>
      </div>
      {sparse ? (
        <HomeMobile
          forceLayout={layout}
          plan={sparsePlan() as never}
          projected={null}
          firstName="Loucmane"
          now={new Date(2026, 6, 8, 9)}
          topTraps={[]}
          recentPasses={[]}
          mockPrescription={null}
          lastMockResult={null}
        />
      ) : (
        <HomeMobile
          forceLayout={layout}
          plan={fixturePlan(provpassDag) as never}
          projected={{ total: 0.65, verbal: 0.81, quant: 0.49 }}
          firstName="Loucmane"
          now={new Date(2026, 6, 8, 9)}
          // "Inte idag" defer — the real hook writes the synced pref and
          // regenerates; here the harness just swaps the fixture to the
          // ordinary (non-mock) plan so the visual swap can be verified.
          onDeferMock={() => setProvpassDag(false)}
          mockPrescription={
            provpassDag
              ? { due: true, half: 'verbal', daysSinceLast: 12, daysUntilNext: 0, interval: 14 }
              : { due: false, half: 'verbal', daysSinceLast: 5, daysUntilNext: 2, interval: 14 }
          }
          lastMockResult={{
            id: 1,
            userId: 1,
            sessionId: 1,
            mode: 'authentic',
            half: 'verbal',
            examId: 'var-2026',
            provpass: '1',
            presented: 40,
            answered: 40,
            correct: 31,
            seenBefore: 0,
            durationMs: 3_000_000,
            breakdown: { perSection: {}, missedQids: [], version: 1 },
            createdAt: Date.now(),
          }}
        />
      )}
    </div>
  )
}

/** First-day / low-data fixture: one plan item, no traps, no history, no
 *  resumable session, no prognosis yet — the degenerate state task #78
 *  targets. */
function sparsePlan() {
  return {
    version: PLAN_SCHEMA_VERSION,
    date: '2026-07-08',
    items: [
      {
        id: 'lesson-XYZ-2026-07-08',
        kind: 'lesson' as const,
        section: 'XYZ' as const,
        headline: 'XYZ-lektion',
        rationale: 'Första passet — börja här.',
        estimatedMinutes: 5,
        href: '/lektion?section=XYZ',
        completed: false,
      },
    ],
    estimatedMinutes: 5,
  }
}
