// Framework prerequisite graph (hpf-0026.2) — gates which lesson the daily
// plan INTRODUCES next.
//
// Data: frameworks/framework_prereqs.json (canonical), served byte-identical
// from app/public/frameworks/. Semantics, approved by the owner 2026-10-07 in
// docs/framework-prereqs-proposal.md ("Semantics proposal"):
//
//   - hard A → B: the plan does not introduce B while any hard prerequisite A
//     is untaught. Introduction only — a B that is already past untaught is
//     never re-blocked, whatever later happens to A.
//   - A blocked candidate pulls its deepest untaught hard prerequisite forward
//     into the lesson slot rather than skipping, so a weak section is never
//     starved of lessons.
//   - soft A → B: never blocks. Among a section's unread entries, those whose
//     soft prerequisites are taught come first; ties keep catalog order.
//   - taught = a framework_progress status past untaught OR a lesson read
//     (server ∪ localStorage), so a fresh local read counts before it syncs.
//   - An invalid or missing graph FAILS OPEN — no gating, a console warning —
//     so bad data never blocks learning.
//
// Only lesson introduction in the daily plan consults this module.
// Repetition, trap drills, the hot-trap boost, Provpass, free drills and
// self-opened lessons never do.
//
// Pure, no I/O: the loader is `loadPrereqGraph` (data/frameworks.ts) and the
// wiring is `resolveFrameworkHints` (hooks/useDailyPlan.ts).

import type { FrameworkProgressRow, FrameworkStatus } from './frameworkProgress'

export type PrereqStrength = 'hard' | 'soft'

/** One edge of framework_prereqs.json: `from` is a prerequisite of `to`. */
export type PrereqEdge = {
  from: string
  to: string
  reason: string
  strength: PrereqStrength
}

/** A validated graph indexed by dependent: `hard.get(B)` lists B's hard
 *  prerequisites in file order. A missing key means none. */
export type PrereqGraph = {
  hard: ReadonlyMap<string, readonly string[]>
  soft: ReadonlyMap<string, readonly string[]>
}

export type PrereqValidation = { ok: true; graph: PrereqGraph } | { ok: false; errors: string[] }

/** Every status past `untaught`. Reading a lesson sets `learning`; practice
 *  without a read lands on `practicing` — both satisfy a hard edge. */
const TAUGHT_STATUSES: ReadonlySet<FrameworkStatus> = new Set([
  'learning',
  'practicing',
  'retaining',
  'mastered',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Validate a parsed framework_prereqs.json. Rejects a payload without an
 * `edges` array, edges without string `from`/`to`, unknown ids, self-loops,
 * duplicate from/to pairs (whatever their strengths), a strength other than
 * hard|soft, and cycles across hard and soft edges together.
 *
 * `knownIds` is every entry id of the eight catalogs. Pass null while the
 * catalog set is incomplete (a catalog failed to load): an id from the
 * missing catalog cannot be told from a typo, so only the unknown-id check is
 * deferred; every structural check still runs.
 */
export function validatePrereqGraph(
  raw: unknown,
  knownIds: ReadonlySet<string> | null,
): PrereqValidation {
  if (!isRecord(raw) || !Array.isArray(raw.edges)) {
    return { ok: false, errors: ['the graph must be an object with an edges array'] }
  }
  const errors: string[] = []
  const edges: PrereqEdge[] = []
  const pairs = new Set<string>()
  raw.edges.forEach((value: unknown, i: number) => {
    if (!isRecord(value) || typeof value.from !== 'string' || typeof value.to !== 'string') {
      errors.push(`edge ${i}: from and to must be strings`)
      return
    }
    const { from, to, strength } = value
    if (strength !== 'hard' && strength !== 'soft') {
      errors.push(`edge ${i}: strength must be hard or soft, got ${JSON.stringify(strength)}`)
    }
    if (knownIds) {
      for (const id of [from, to]) {
        if (!knownIds.has(id)) errors.push(`edge ${i}: unknown id ${id}`)
      }
    }
    if (from === to) errors.push(`edge ${i}: self-loop on ${from}`)
    const pair = `${from} -> ${to}`
    if (pairs.has(pair)) errors.push(`edge ${i}: duplicate ${pair}`)
    pairs.add(pair)
    const reason = typeof value.reason === 'string' ? value.reason : ''
    edges.push({ from, to, reason, strength: strength === 'soft' ? 'soft' : 'hard' })
  })
  const cycle = findCycle(edges)
  if (cycle) errors.push(`cycle ${cycle.join(' -> ')}`)
  return errors.length > 0 ? { ok: false, errors } : { ok: true, graph: indexByDependent(edges) }
}

/** The first cycle a depth-first search finds over hard and soft edges
 *  together, as a closed path (`[A, B, A]`), or null when acyclic. */
function findCycle(edges: readonly PrereqEdge[]): string[] | null {
  const next = new Map<string, string[]>()
  for (const { from, to } of edges) {
    const list = next.get(from)
    if (list) list.push(to)
    else next.set(from, [to])
  }
  const done = new Set<string>()
  const path: string[] = []
  const visit = (node: string): string[] | null => {
    path.push(node)
    for (const succ of next.get(node) ?? []) {
      if (path.includes(succ)) return [...path.slice(path.indexOf(succ)), succ]
      if (done.has(succ)) continue
      const cycle = visit(succ)
      if (cycle) return cycle
    }
    path.pop()
    done.add(node)
    return null
  }
  for (const node of next.keys()) {
    if (done.has(node)) continue
    const cycle = visit(node)
    if (cycle) return cycle
  }
  return null
}

function indexByDependent(edges: readonly PrereqEdge[]): PrereqGraph {
  const hard = new Map<string, string[]>()
  const soft = new Map<string, string[]>()
  for (const { from, to, strength } of edges) {
    const byDependent = strength === 'hard' ? hard : soft
    const list = byDependent.get(to)
    if (list) list.push(from)
    else byDependent.set(to, [from])
  }
  return { hard, soft }
}

/**
 * The runtime entry point: the validated graph, or null — FAIL OPEN, with a
 * console warning — when the file is missing or unreadable (`raw` null) or
 * does not validate. A null graph gates nothing.
 */
export function prereqGraphOrNull(
  raw: unknown,
  knownIds: ReadonlySet<string> | null,
): PrereqGraph | null {
  if (raw == null) {
    console.warn(
      '[prereqs] framework_prereqs.json is missing or unreadable — lesson prerequisites are not enforced (fail open)',
    )
    return null
  }
  const result = validatePrereqGraph(raw, knownIds)
  if (result.ok) return result.graph
  console.warn(
    `[prereqs] framework_prereqs.json is invalid — lesson prerequisites are not enforced (fail open): ${result.errors.join('; ')}`,
  )
  return null
}

/**
 * Entry ids that count as taught for the gate: a framework_progress status
 * past untaught, or a read in the merged lesson-read set. A row that is
 * untaught or carries an unknown status reads as untaught, and the newest row
 * per id wins (as in summarizeFrameworkProgress). `rows` undefined — the
 * progress query has no data, e.g. it errored — leaves the read set alone.
 */
export function taughtEntryIds(
  rows: readonly FrameworkProgressRow[] | undefined,
  reads: ReadonlySet<string>,
): Set<string> {
  const taught = new Set(reads)
  const latest = new Map((rows ?? []).map((row) => [row.layer1Id, row.status]))
  for (const [id, status] of latest) {
    if (TAUGHT_STATUSES.has(status)) taught.add(id)
  }
  return taught
}

/** What one section's lesson slot gets: an entry of that section, or — when
 *  the section's candidate is blocked — the candidate's deepest untaught hard
 *  prerequisite, with `blockedId` naming the candidate. Null: no lesson. */
export type LessonPick = { id: string; blockedId?: string } | null

export type LessonPickInput = {
  /** The section's catalog entries, in catalog order. */
  entries: readonly { id: string }[]
  /** Merged lesson-read set (server ∪ localStorage). Read entries are never
   *  candidates. */
  reads: ReadonlySet<string>
  /** `taughtEntryIds` output, a superset of `reads`. */
  taught: ReadonlySet<string>
  /** Null when the graph failed open: catalog order, nothing blocked. */
  graph: PrereqGraph | null
  /** Whether a prerequisite can be offered as a lesson (its catalog loaded). */
  canShow: (id: string) => boolean
}

/**
 * Pick the lesson the plan introduces for one section.
 *
 *  1. Candidates are the unread entries: soft-satisfied ones first (every soft
 *     prerequisite taught), each group in catalog order.
 *  2. The first candidate is introduced unless it is BLOCKED: still untaught,
 *     with an untaught hard prerequisite.
 *  3. A blocked candidate pulls forward its deepest untaught hard
 *     prerequisite, following the first untaught one in file order at each
 *     step, down to one whose own hard prerequisites are all taught.
 *  4. If that prerequisite cannot be offered, the next unblocked candidate is
 *     introduced instead, else nothing (null), as for an all-read section.
 */
export function pickLessonEntry({
  entries,
  reads,
  taught,
  graph,
  canShow,
}: LessonPickInput): LessonPick {
  const unread = entries.filter((entry) => !reads.has(entry.id))
  if (unread.length === 0) return null
  if (!graph) return { id: unread[0].id }

  const candidates = softOrder(unread, graph, taught)
  const isBlocked = (id: string) =>
    !taught.has(id) && (graph.hard.get(id) ?? []).some((prereq) => !taught.has(prereq))
  const [candidate] = candidates
  if (!isBlocked(candidate.id)) return { id: candidate.id }

  const prereq = deepestUntaughtPrereq(candidate.id, graph, taught)
  if (prereq && canShow(prereq)) return { id: prereq, blockedId: candidate.id }
  const next = candidates.find((entry) => !isBlocked(entry.id))
  return next ? { id: next.id } : null
}

function softOrder<T extends { id: string }>(
  unread: readonly T[],
  graph: PrereqGraph,
  taught: ReadonlySet<string>,
): T[] {
  const ready: T[] = []
  const waiting: T[] = []
  for (const entry of unread) {
    const prereqs = graph.soft.get(entry.id) ?? []
    if (prereqs.every((prereq) => taught.has(prereq))) ready.push(entry)
    else waiting.push(entry)
  }
  return [...ready, ...waiting]
}

/** Null when `id` has no untaught hard prerequisite. The graph is acyclic
 *  (validated); `seen` only bounds the walk. */
function deepestUntaughtPrereq(
  id: string,
  graph: PrereqGraph,
  taught: ReadonlySet<string>,
  seen: Set<string> = new Set(),
): string | null {
  for (const prereq of graph.hard.get(id) ?? []) {
    if (taught.has(prereq) || seen.has(prereq)) continue
    seen.add(prereq)
    return deepestUntaughtPrereq(prereq, graph, taught, seen) ?? prereq
  }
  return null
}
