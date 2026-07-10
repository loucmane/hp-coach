// Adaptive review — hot-trap detection + offer-suppression policy.
//
// The mechanic (owner-approved 2026-07-10): when a learner keeps hitting
// the SAME trap, offer — never force — a targeted 5-minute detour at the
// START of a normal drill. This module is the pure decision core:
//
//   - detectHotTrap    → is there a framework the user is actively falling
//                        for (>=3 mistakes in the last 7 days), NOT already
//                        treated recently, NOT suppressed by declines?
//   - encode/decode session `sections` marker → treated-trap round-trip
//                        (rides the free-form sessions.sections field, the
//                        same trick MockRunner's encodeMockSections uses;
//                        NO schema migration).
//   - decline policy   → 2 declines suppress a trap until a NEW mistake on
//                        it arrives after the second decline (localStorage).
//
// Everything here is a pure function over explicit inputs — no DOM, no
// network, no clock beyond an injected `now`. The hook layer
// (useAdaptiveReview) resolves the async framework_id lookups (mirroring
// useTopTraps) and localStorage reads, then calls into these.

const HOT_TRAP_THRESHOLD = 3
const HOT_TRAP_WINDOW_DAYS = 7
const HOT_TRAP_WINDOW_MS = HOT_TRAP_WINDOW_DAYS * 24 * 60 * 60 * 1000
/** How recently a trap must have been "treated" (a completed adaptive-review
 *  detour) to suppress a fresh offer. Same window as detection — one week of
 *  peace after you did the work. */
const TREATED_WINDOW_MS = HOT_TRAP_WINDOW_MS
/** Two declines and we stop asking about this trap until a genuinely NEW
 *  mistake lands. Zero-guilt: the user said "not now" twice, believe them. */
const DECLINE_SUPPRESS_THRESHOLD = 2

/** One active mistake, already resolved to its framework. `at` is the
 *  mistake's most-recent-error timestamp (ms epoch) — lastErrorAt on the
 *  server row. */
export type TrapMistake = {
  framework_id: string
  /** ms epoch of the most recent error on this question. */
  at: number
}

/** A completed adaptive-review detour, decoded from a session's `sections`
 *  marker (see decodeTreatedMarker). `at` is when the detour finished. */
export type TreatedTrap = {
  framework_id: string
  at: number
}

/** Per-framework decline bookkeeping (localStorage-backed; see
 *  useAdaptiveReview). `count` is how many times the user tapped "Inte nu"
 *  for this trap; `lastDeclineAt` is when the most recent decline happened
 *  — a NEW mistake timestamped after it re-arms the offer. */
export type DeclineRecord = {
  count: number
  lastDeclineAt: number
}

export type DetectHotTrapInput = {
  now: Date
  /** Active mistakes resolved to framework_id + lastErrorAt. */
  mistakes: TrapMistake[]
  /** Completed adaptive-review detours (decoded from session rows). */
  treated?: TreatedTrap[]
  /** Per-framework decline records (localStorage). */
  declines?: Record<string, DeclineRecord>
}

export type HotTrap = {
  framework_id: string
  /** How many active mistakes on this framework fall inside the 7-day
   *  window — always >= HOT_TRAP_THRESHOLD. */
  count: number
}

/** Detect the single hottest trap eligible for an offer, or null.
 *
 *  A framework qualifies when:
 *   - it has >= 3 active mistakes whose `at` is within the last 7 days,
 *   - it was NOT treated by an adaptive-review detour in the last 7 days,
 *   - it is NOT decline-suppressed (2+ declines with no newer mistake).
 *
 *  When several qualify, the one with the most recent-window mistakes wins
 *  (ties broken by framework_id for determinism). */
export function detectHotTrap(input: DetectHotTrapInput): HotTrap | null {
  const nowMs = input.now.getTime()
  const cutoff = nowMs - HOT_TRAP_WINDOW_MS

  // Count in-window mistakes per framework.
  const counts = new Map<string, number>()
  for (const m of input.mistakes) {
    if (m.at < cutoff || m.at > nowMs) continue
    counts.set(m.framework_id, (counts.get(m.framework_id) ?? 0) + 1)
  }

  const treated = input.treated ?? []
  const declines = input.declines ?? {}

  let best: HotTrap | null = null
  for (const [framework_id, count] of counts) {
    if (count < HOT_TRAP_THRESHOLD) continue
    if (isTreatedRecently(framework_id, treated, nowMs)) continue
    if (isDeclineSuppressed(framework_id, input.mistakes, declines[framework_id])) continue
    if (!best || count > best.count || (count === best.count && framework_id < best.framework_id)) {
      best = { framework_id, count }
    }
  }
  return best
}

function isTreatedRecently(framework_id: string, treated: TreatedTrap[], nowMs: number): boolean {
  const cutoff = nowMs - TREATED_WINDOW_MS
  for (const t of treated) {
    if (t.framework_id === framework_id && t.at >= cutoff && t.at <= nowMs) return true
  }
  return false
}

/** A trap is decline-suppressed once the user has declined it
 *  DECLINE_SUPPRESS_THRESHOLD times AND no fresh mistake on it has arrived
 *  since the last decline. A new mistake (any `at` strictly after
 *  `lastDeclineAt`) re-arms the offer — the pattern is clearly still
 *  hurting them. */
function isDeclineSuppressed(
  framework_id: string,
  mistakes: TrapMistake[],
  record: DeclineRecord | undefined,
): boolean {
  if (!record || record.count < DECLINE_SUPPRESS_THRESHOLD) return false
  // Any mistake on this framework newer than the last decline re-arms.
  for (const m of mistakes) {
    if (m.framework_id === framework_id && m.at > record.lastDeclineAt) return false
  }
  return true
}

// ── Treated-trap session marker ────────────────────────────────────────────
//
// An adaptive-review detour is a normal `kind: 'drill'` session — so it can
// reuse the entire SessionPlayer lifecycle — tagged in the free-form
// `sections` field so completed detours are recoverable as "treated". The
// marker round-trips through the same field a plain drill uses for its
// section code ("DTK"), so we prefix a sentinel that a bare section code can
// never collide with.
//
// Format:  ar:<section>:<framework_id>
//   e.g.   ar:DTK:DTK-TACTIC-004
// The leading `ar:` sentinel is what decode keys on; a plain drill session's
// `sections` is just "DTK" (no colon), so the two never confuse.

const MARKER_PREFIX = 'ar'

/** Encode an adaptive-review session's `sections` marker. `section` keeps
 *  the running-head/section chrome working; `framework_id` is what
 *  treated-detection reads back. */
export function encodeTreatedMarker(section: string, framework_id: string): string {
  return [MARKER_PREFIX, section, framework_id].join(':')
}

export type DecodedTreatedMarker = {
  section: string
  framework_id: string
}

/** Decode a session's `sections` field into an adaptive-review marker, or
 *  null when it isn't one (a plain drill's "DTK", a mock's 4-field
 *  `mode:half:exam:provpass`, an empty field, etc.). */
export function decodeTreatedMarker(sections: string | null): DecodedTreatedMarker | null {
  if (!sections) return null
  const parts = sections.split(':')
  if (parts.length !== 3) return null
  const [prefix, section, framework_id] = parts
  if (prefix !== MARKER_PREFIX) return null
  if (!section || !framework_id) return null
  return { section, framework_id }
}

// ── Decline bookkeeping (pure state transitions) ───────────────────────────
//
// The store itself is localStorage (see useAdaptiveReview); these are the
// pure transitions the hook applies so they can be unit-tested without a DOM.

/** Register one decline for a framework at `now`. Increments the count and
 *  stamps `lastDeclineAt`, which a later fresh mistake compares against to
 *  re-arm the offer. */
export function recordDecline(
  declines: Record<string, DeclineRecord>,
  framework_id: string,
  now: Date,
): Record<string, DeclineRecord> {
  const prev = declines[framework_id]
  return {
    ...declines,
    [framework_id]: {
      count: (prev?.count ?? 0) + 1,
      lastDeclineAt: now.getTime(),
    },
  }
}

/** Section code from a framework_id prefix — "DTK-TACTIC-004" → "DTK",
 *  "LAS-TYPE-001" → "LÄS". Mirrors the taxonomy quirk useTopTraps handles.
 *  Returns the raw prefix for the quant/DTK/verbal codes that match 1:1, so
 *  the detour drill lands on the right section chrome. */
export function sectionFromFrameworkId(framework_id: string): string {
  const prefix = framework_id.split('-', 1)[0]
  return prefix === 'LAS' ? 'LÄS' : prefix
}
