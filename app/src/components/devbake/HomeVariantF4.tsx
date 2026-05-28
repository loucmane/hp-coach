// HomeVariantF4 — SYNTHESIS (my pick).
//
// Conditional facing-page entry: render F2's editorial trap entry on
// the right ONLY when the user has ≥3 active traps with combined miss
// count ≥ 6. Otherwise the right column is air (F1's default state,
// minus the resumption line — that's a separate orthogonal feature).
//
// The principle: use the space when it's functionally earned, leave
// it air when it isn't. Marries Design's "use the space" with UX's
// "performed attentiveness reads as AI-slop." The entry only shows
// when there's real trap pressure — not as decoration.
//
// In this bake-off, the fixture has 3 traps with combined misses of
// 3+2+2 = 7 (above the threshold), so the entry IS rendered. To see
// the "off" state, imagine F1 with no resumption line — just air.
//
// Threshold rationale: 3 traps × 2 misses each is the soft floor for
// "this is structural, not noise." Below that, the user isn't
// chronically caught — the right side stays quiet.

import { HomeVariantF1 } from './HomeVariantF1'
import { HomeVariantF2 } from './HomeVariantF2'
import { FIXTURE_TOP_TRAPS } from './homeBakeoffFixtures'

const TRAP_THRESHOLD_COUNT = 3
const TRAP_THRESHOLD_MISSES = 6

export function HomeVariantF4() {
  const totalMisses = FIXTURE_TOP_TRAPS.reduce((sum, t) => sum + t.count, 0)
  const shouldFeature =
    FIXTURE_TOP_TRAPS.length >= TRAP_THRESHOLD_COUNT && totalMisses >= TRAP_THRESHOLD_MISSES

  // For the bake-off demo, the fixture meets the threshold so this
  // renders identically to F2. The variant exists to surface the
  // *policy* (conditional, not always-on) — pick F4 if you want the
  // rule, pick F2 if you want it always-on regardless of pressure.
  if (shouldFeature) return <HomeVariantF2 />

  // Off state — falls back to F1's composition without the resumption
  // panel (replaced by air). Won't render in this fixture but kept
  // explicit so the rule is legible from the code.
  return <HomeVariantF1 />
}
