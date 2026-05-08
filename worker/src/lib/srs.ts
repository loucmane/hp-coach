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
// growing unbounded over months of dogfooding. A wrong answer at any
// point resets the ladder — full reset is appropriate for binary
// feedback because we can't tell HOW wrong the answer was.
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
}

export type CorrectOutcome =
  | { graduated: true }
  | { graduated: false; intervalMinutes: number; nextReviewAt: Date }

/**
 * Wrong answer — reset the ladder. Ten minutes is short enough to feel
 * like "you'll see it again right away" and long enough that the user
 * has actually moved on from the question they just missed.
 */
export function nextOnWrong(now: Date = new Date()): WrongOutcome {
  return {
    intervalMinutes: RELEARN_MINUTES,
    nextReviewAt: addMinutes(now, RELEARN_MINUTES),
  }
}

/**
 * Correct answer — advance the ladder. From 0 (or any sub-1d step) we
 * jump to FIRST_INTERVAL; from there we double. Already at the cap
 * means this correct answer was the long-haul confirmation, so the
 * mistake graduates.
 */
export function nextOnCorrect(prevIntervalMinutes: number, now: Date = new Date()): CorrectOutcome {
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
  }
}

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000)
}
