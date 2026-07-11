// /prov-verify — dev-only visual verification harness for the
// Provpass surfaces (PR 3). NOT a bake-off (there's one design, not
// variants to compare) — this exists because /prov itself renders
// inside the Clerk-gated <SignedIn> tree (see __root.tsx), and the
// house verification rule requires a screenshot of real components
// with real output before claiming a UI change done. This route
// renders the exact same Picker / ConfirmSheet / MockResult
// components /prov uses, fed realistic fixture data, outside the auth
// gate so it's reachable in a plain `pnpm dev` session.
//
// Dev-gated via isDevSurface() — same mechanism as every other
// *-bakeoff route. Kept per house rule (memory: "keep bake-offs" —
// dev verification routes are historical references, never deleted).

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { MockResultRow } from '@/api/hooks/useMockResults'
import { MobileFrame } from '@/components/MobileFrame'
import { ConfirmSheet } from '@/components/mock/ConfirmSheet'
import { MockResult } from '@/components/mock/MockResult'
import { Page } from '@/components/Page'
import { Btn, Eyebrow } from '@/components/primitives'
import { isDevSurface } from '@/lib/devSurface'
import type { PassOption } from '@/lib/mock'
import { Picker } from './prov'

export const Route = createFileRoute('/prov-verify')({
  component: ProvVerify,
})

const FIXTURE_PASSES: PassOption[] = [
  {
    examId: 'var-2018-1',
    provpass: 'verb1',
    half: 'verbal',
    presented: 40,
    seenBefore: 2,
    totalExposure: 3,
  },
  {
    examId: 'var-2019',
    provpass: 'verb1',
    half: 'verbal',
    presented: 39,
    seenBefore: 14,
    totalExposure: 21,
  },
  {
    examId: 'host-2021',
    provpass: 'verb2',
    half: 'verbal',
    presented: 40,
    seenBefore: 22,
    totalExposure: 30,
  },
  {
    examId: 'var-2020',
    provpass: 'kvant1',
    half: 'kvant',
    presented: 40,
    seenBefore: 5,
    totalExposure: 5,
  },
]

const FIXTURE_RESULT: MockResultRow = {
  id: 1,
  userId: 1,
  sessionId: 100,
  mode: 'authentic',
  half: 'verbal',
  examId: 'var-2018-1',
  provpass: 'verb1',
  presented: 40,
  answered: 40,
  correct: 31,
  seenBefore: 9,
  durationMs: 51 * 60_000,
  breakdown: {
    perSection: {
      ORD: { presented: 10, correct: 8, timeMs: 7 * 60_000 },
      LÄS: { presented: 10, correct: 7, timeMs: 16 * 60_000 },
      MEK: { presented: 10, correct: 9, timeMs: 6 * 60_000 },
      ELF: { presented: 10, correct: 7, timeMs: 12 * 60_000 },
    },
    missedQids: ['var-2018-1-verb1-ORD-003', 'var-2018-1-verb1-ORD-007'],
    version: 1,
  },
  createdAt: Date.now(),
}

function ProvVerify() {
  const navigate = useNavigate()
  const dev = isDevSurface()
  const [screen, setScreen] = useState<
    'picker-authentic' | 'picker-synthetic' | 'instructions' | 'result'
  >('picker-authentic')

  if (!dev) {
    return (
      <div style={{ padding: 40 }}>
        <Eyebrow>Otillgänglig</Eyebrow>
        <p>Denna sida är endast tillgänglig i utvecklingsläge.</p>
      </div>
    )
  }

  return (
    <MobileFrame tabs={false}>
      <Page>
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <Btn
              size="sm"
              variant={screen === 'picker-authentic' ? 'accent' : 'secondary'}
              onClick={() => setScreen('picker-authentic')}
            >
              Picker · riktigt
            </Btn>
            <Btn
              size="sm"
              variant={screen === 'picker-synthetic' ? 'accent' : 'secondary'}
              onClick={() => setScreen('picker-synthetic')}
            >
              Picker · genererat
            </Btn>
            <Btn
              size="sm"
              variant={screen === 'instructions' ? 'accent' : 'secondary'}
              onClick={() => setScreen('instructions')}
            >
              Bekräfta-sheet
            </Btn>
            <Btn
              size="sm"
              variant={screen === 'result' ? 'accent' : 'secondary'}
              onClick={() => setScreen('result')}
            >
              Resultat
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => navigate({ to: '/' })}>
              Hem
            </Btn>
          </div>
        </div>
        {screen === 'picker-authentic' && (
          <Picker
            mode="authentic"
            half="verbal"
            candidateName="Lookman Benali"
            onModeChange={() => {}}
            onHalfChange={() => {}}
            passes={FIXTURE_PASSES}
            onStart={() => setScreen('instructions')}
          />
        )}
        {screen === 'picker-synthetic' && (
          <Picker
            mode="synthetic"
            half="verbal"
            candidateName="Lookman Benali"
            onModeChange={() => {}}
            onHalfChange={() => {}}
            passes={FIXTURE_PASSES}
            onStart={() => setScreen('instructions')}
          />
        )}
        {screen === 'instructions' && (
          <ConfirmSheet
            half="verbal"
            target={{
              mode: 'authentic',
              examId: 'host-2021',
              provpass: 'verb2',
              presented: 40,
            }}
            onConfirm={() => setScreen('result')}
            onDismiss={() => setScreen('picker-authentic')}
          />
        )}
        {screen === 'result' && <MockResult result={FIXTURE_RESULT} />}
      </Page>
    </MobileFrame>
  )
}
