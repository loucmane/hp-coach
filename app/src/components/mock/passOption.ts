// PassOption — a single "Riktigt pass" the picker can offer.
//
// NOTE (seam contract, PR 3 vs PR 2/4): this type is defined here,
// locally, because `app/src/lib/mock.ts` (the pure pass-selection
// engine — listAuthenticPasses / resolveAuthentic / pickSynthetic) is
// owned by a parallel PR and does not exist yet in this branch. PR 4
// (integration) will reconcile this shape with whatever `lib/mock.ts`
// ends up exporting — likely by having `lib/mock.ts` import THIS type,
// or by this file re-exporting from there once it lands. Keep the
// field names stable in the meantime; ProvPicker (prov.tsx) and its
// tests depend on them verbatim.
//
// Field meanings (see the Provpass plan, audit/_plans_archive/
// 2026-07-09-m3-rebuild-and-provpass-plan.md):
//   - examId/provpass: identify one authentic pass (e.g. 'var-2018-1',
//     'verbal-1').
//   - half: which half this pass belongs to — reuses MockHalf from
//     useMockResults (PR #208) so the picker's half toggle can filter
//     on it directly.
//   - presented: how many of the pass's 40 questions are drillable
//     (complete) right now. Some passes are 39/40 or worse — the
//     picker discloses this via a completeness badge below 40.
//   - seenBefore: how many of the `presented` questions this user has
//     already attempted at least once (exposure), per the snapshot
//     read from `useExposure()` at picker-render time.
//   - totalExposure: sum of attempt counts across `presented`
//     questions — used only as a least-exposed sort tiebreaker
//     (PR 4 owns the actual sort; this PR only renders whatever
//     order it's given).

import type { MockHalf } from '@/api/hooks/useMockResults'

export type PassOption = {
  examId: string
  provpass: string
  half: MockHalf
  presented: number
  seenBefore: number
  totalExposure: number
}
