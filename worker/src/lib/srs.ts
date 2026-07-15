// SM-2-lite spacing for the mistakes queue.
//
// Real SM-2 (the Anki algorithm) tunes an "ease factor" per item from a
// 4-grade response (Again/Hard/Good/Easy). Our drill UI is binary —
// right or wrong — which doesn't carry enough signal to fit an ease
// factor, so we use a fixed-doubling Leitner ladder instead:
//
//   wrong              → relearn in 10 min   (interval reset)
//   1st correct        → 1 day
//   2nd correct        → 2 days
//   3rd correct        → 4 days
//   4th correct        → 8 days
//   5th correct        → 16 days
//   6th correct        → 30 days   (capped)
//   7th correct        → graduate  (status = 'resolved')
//
// Seven correct answers across ~61 days to fully graduate a mistake.
// The cap stops intervals from drifting into "you'll never see it
// again" territory, and the graduation step keeps the queue from
// growing unbounded over months of dogfooding.
//
// LAPSE MEMORY (FSRS-lite, PL-L.2). A wrong answer still relearns
// TODAY — `intervalMinutes` drops to RELEARN_MINUTES and the item is
// due again in ~10 min, which is what keeps it on today's pile — but
// the ladder no longer forgets how high it had climbed. Before the
// relearn rung overwrites the interval, the previous height is stashed
// on the row (`lapse_interval_minutes`); the NEXT correct answer
// resumes at half that height (floored at FIRST_INTERVAL) instead of
// restarting from day 1, then clears the stash so normal doubling
// continues. A second lapse during relearn keeps the MAX of the two
// stashed heights, so climbing progress survives repeated stumbles.
// This replaces the old "single wrong resets the whole ladder"
// behaviour — the best-documented failure mode of naive SRS.
//
// All math is in minutes so we can express the relearn step (10 min)
// in the same currency as the day-scale steps. `nextReviewAt` is the
// only timestamp the rest of the system reads — interval lives on the
// row only so the next call can compute the doubling.

const MIN = 1
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** First step after a fresh wrong answer — see again in 10 min. */
export const RELEARN_MINUTES = 10
/** Step the user enters after their first correct in /repetition. */
export const FIRST_INTERVAL_MINUTES = 1 * DAY
/** Ceiling after which one more correct graduates the mistake out. */
export const MAX_INTERVAL_MINUTES = 30 * DAY

export type WrongOutcome = {
  intervalMinutes: number
  nextReviewAt: Date
  /**
   * The ladder height to stash on the row so the next correct answer can
   * resume from it. 0 means "nothing worth remembering" (a fresh mistake
   * that had never climbed) — the caller stores that as NULL. Carries the
   * MAX of the row's previous rung and any existing stash, so a second
   * lapse during relearn cannot erase a height already banked.
   */
  lapseIntervalMinutes: number
}

export type CorrectOutcome =
  | { graduated: true }
  | {
      graduated: false
      intervalMinutes: number
      nextReviewAt: Date
      /**
       * Always null on a correct answer — advancing (or resuming) the
       * ladder consumes and clears any stashed lapse height. The caller
       * writes this straight to the row's `lapse_interval_minutes`.
       */
      lapseIntervalMinutes: null
    }

/**
 * Wrong answer — relearn TODAY but remember the height. `intervalMinutes`
 * and `nextReviewAt` are UNCHANGED from the old behaviour (10-min relearn
 * rung), which is what keeps the item on today's pile. What's new: we
 * stash the height it fell from so the next correct answer resumes there
 * instead of restarting at day 1.
 *
 * `prev` carries the row's current `intervalMinutes` and any existing
 * `lapseIntervalMinutes`; the stash is the MAX of the two so repeated
 * lapses during relearn never lose banked progress. Both fields are
 * optional — called with no `prev` (a brand-new mistake) the stash is 0
 * and the outcome is byte-identical to the pre-FSRS-lite reset.
 */
export function nextOnWrong(
  now: Date = new Date(),
  prev: { intervalMinutes?: number; lapseIntervalMinutes?: number | null } = {},
): WrongOutcome {
  const stash = Math.max(prev.intervalMinutes ?? 0, prev.lapseIntervalMinutes ?? 0)
  return {
    intervalMinutes: RELEARN_MINUTES,
    nextReviewAt: addMinutes(now, RELEARN_MINUTES),
    lapseIntervalMinutes: stash,
  }
}

/**
 * Correct answer — advance the ladder, or RESUME it after a lapse.
 *
 * If a lapse height was stashed (`lapseIntervalMinutes > 0`), resume at
 * half that height, floored at FIRST_INTERVAL, and clear the stash —
 * normal doubling continues from there on later corrects. Resume is
 * mutually exclusive with graduation in practice: a stashed row sits on
 * the relearn rung, so it never satisfies the cap gate.
 *
 * With no stash the behaviour is unchanged: from 0 (or any sub-1d step)
 * jump to FIRST_INTERVAL; from there double; already at the cap means
 * this correct was the long-haul confirmation, so the mistake graduates.
 */
export function nextOnCorrect(
  prevIntervalMinutes: number,
  now: Date = new Date(),
  lapseIntervalMinutes: number | null = null,
): CorrectOutcome {
  const stash = lapseIntervalMinutes ?? 0
  if (stash > 0) {
    const resumed = Math.min(
      Math.max(FIRST_INTERVAL_MINUTES, Math.floor(stash * 0.5)),
      MAX_INTERVAL_MINUTES,
    )
    return {
      graduated: false,
      intervalMinutes: resumed,
      nextReviewAt: addMinutes(now, resumed),
      lapseIntervalMinutes: null,
    }
  }
  if (prevIntervalMinutes >= MAX_INTERVAL_MINUTES) {
    return { graduated: true }
  }
  const next =
    prevIntervalMinutes < FIRST_INTERVAL_MINUTES
      ? FIRST_INTERVAL_MINUTES
      : Math.min(prevIntervalMinutes * 2, MAX_INTERVAL_MINUTES)
  return {
    graduated: false,
    intervalMinutes: next,
    nextReviewAt: addMinutes(now, next),
    lapseIntervalMinutes: null,
  }
}

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000)
}
