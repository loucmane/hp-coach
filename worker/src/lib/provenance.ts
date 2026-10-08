// Attempt provenance — which bank an answered question belongs to, decided on
// the server from the qid alone (P5 infold PR 3, docs/p5-infold-design.md
// Amendment 1 E).
//
//   authentic — a question of the authentic bank the app serves: the qid is in
//               worker/data/authentic-qids.json, exported deterministically from
//               app/public/data (one file per sitting of _index.json) by
//               pipeline/synthetic/infold/export_authentic_qids.py and pinned to
//               the bank by a test. Membership, not shape: a qid in the bank's
//               grammar that names a question the bank does not hold
//               (var-2024-verb1-ORD-015) is unknown. The legacy LAS spelling of a
//               bank LÄS qid, which lib/section.ts normalises, is authentic too.
//   synthetic — a qid of the approved P5 registry, worker/data/p5-qid-registry.json,
//               exported deterministically from the approval roster by
//               pipeline/synthetic/infold/export_qid_registry.py. It counts
//               toward the assessment like an authentic answer, and every number
//               it feeds is marked uncalibrated (estimateBasis).
//   unknown   — anything else: a seed or test id, a malformed qid, a question
//               the bank does not hold, or a P5 qid whose unit is retired,
//               revised away or unapproved. Fails closed: stored for history,
//               never assessed.
//
// The client never chooses. POST /api/attempts, the mock-result route and the
// import route derive the value here and ignore anything provenance-like in a
// payload. This is a provenance rule, not an anti-cheat one: an answer's
// correctness is still client-reported, as it always was.

import authenticSet from '../../data/authentic-qids.json'
import registry from '../../data/p5-qid-registry.json'
import { ATTEMPT_SOURCES, type AttemptSource } from '../db/schema'

export { ATTEMPT_SOURCES, type AttemptSource }

/** The sources whose answers feed the assessment: section scores, the weekly
 *  trend, accuracy, ability, item stats and Provpass. Never `unknown`. */
export const ASSESSED_SOURCES = [
  'authentic',
  'synthetic',
] as const satisfies readonly AttemptSource[]

/** Whether answers of `source` feed the assessment. */
export function isAssessedSource(source: string): source is (typeof ASSESSED_SOURCES)[number] {
  return source === 'authentic' || source === 'synthetic'
}

// The authentic bank's qids. A set in any other format is read as empty, so
// every answer is then unknown (fail closed), never authentic by accident.
const AUTHENTIC_QIDS: ReadonlySet<string> =
  authenticSet.format === 'authentic-qid-set-v1' ? new Set(authenticSet.qids) : new Set()

/** The sittings of the authentic bank — the exam ids of
 *  app/public/data/_index.json, as the bundled set records them. */
export const AUTHENTIC_EXAM_IDS: ReadonlySet<string> =
  authenticSet.format === 'authentic-qid-set-v1' ? new Set(authenticSet.exams) : new Set()

// The legacy spelling of the LÄS section token: a corpus-import quirk where the
// Ä got dropped (lib/section.ts). Replaced everywhere, as the backfill
// migration's SQL replace() does.
const LEGACY_LAS = '-LAS-'
const LAS = '-LÄS-'

// The P5 qid the exporter mints (export_product.QID): the unit id, its
// revision, the unit's section and the question number.
const P5_QID = /^p5-((?:las|elf)-b[0-9]+-[0-9]{3})-r([1-9][0-9]*)-(LÄS|ELF)-[0-9]{3}$/
// A Layer-1 framework id of a P5 section (frameworks/las_taxonomy.json and
// elf_taxonomy.json): LÄS ids are spelled LAS-…, ELF ids ELF-….
const P5_FRAMEWORK_ID: Readonly<Record<string, RegExp>> = {
  LÄS: /^LAS-[A-Z]+-[0-9]{3}$/,
  ELF: /^ELF-[A-Z]+-[0-9]{3}$/,
}

type P5Item = { revision: number; frameworkId: string | null }

// The registered P5 questions. A registry in any other format is read as
// empty, and a row whose qid disagrees with its own unit, revision or section
// is skipped: those answers then fall to `unknown`, out of every number,
// rather than being guessed at. The same goes for a framework id that is not
// one of its question's section (the exporter has already refused that).
const P5_ITEMS: ReadonlyMap<string, P5Item> = (() => {
  const items = new Map<string, P5Item>()
  if (registry.format !== 'p5-qid-registry-v1') return items
  const frameworkIds: Record<string, unknown> = registry.framework_ids
  for (const unit of registry.units) {
    for (const qid of unit.qids) {
      const m = P5_QID.exec(qid)
      if (!m || m[1] !== unit.unit_id || Number(m[2]) !== unit.revision || m[3] !== unit.section) {
        continue
      }
      const frameworkId = frameworkIds[qid]
      items.set(qid, {
        revision: unit.revision,
        frameworkId:
          typeof frameworkId === 'string' && P5_FRAMEWORK_ID[unit.section]?.test(frameworkId)
            ? frameworkId
            : null,
      })
    }
  }
  return items
})()

export type Provenance = {
  source: AttemptSource
  /** The P5 unit revision of a synthetic answer; null otherwise. */
  itemRevision: number | null
}

/** A question of the authentic bank: its qid, or the legacy LAS spelling of
 *  one, is in the bundled set. */
export function isAuthenticQid(qid: string): boolean {
  if (AUTHENTIC_QIDS.has(qid)) return true
  return qid.includes(LEGACY_LAS) && AUTHENTIC_QIDS.has(qid.split(LEGACY_LAS).join(LAS))
}

/** A qid of the approved P5 registry: approved, not retired, current revision. */
export function isRegisteredP5Qid(qid: string): boolean {
  return P5_ITEMS.has(qid)
}

/** What an attempt on `qid` stores: authentic, synthetic (with its unit
 *  revision), else unknown. */
export function classifyAttempt(qid: string): Provenance {
  if (isAuthenticQid(qid)) return { source: 'authentic', itemRevision: null }
  const p5 = P5_ITEMS.get(qid)
  if (p5) return { source: 'synthetic', itemRevision: p5.revision }
  return { source: 'unknown', itemRevision: null }
}

/** The provenance stored on an attempt: authentic, synthetic, else unknown. */
export function classifyAttemptSource(qid: string): AttemptSource {
  return classifyAttempt(qid).source
}

/** The Layer-1 framework_id of a registered P5 question's reviewed
 *  explanation, or null (no explanation names one, or not a P5 question). */
export function p5FrameworkId(qid: string): string | null {
  return P5_ITEMS.get(qid)?.frameworkId ?? null
}

/**
 * The Layer-1 ids an answer may fold into mastery / framework_progress.
 * Duplicates collapse (one answer is one observation), first occurrence first.
 *   authentic — every client tag, the contract /api/mistakes shares;
 *   synthetic — only the framework_id of the question's reviewed explanation,
 *               and only when the client tagged it: a P5 question without a
 *               valid framework_id moves nothing (Amendment 1 E);
 *   unknown   — nothing.
 */
export function masteryLayer1Ids(
  qid: string,
  source: AttemptSource,
  layer1Ids: readonly string[] | undefined,
): string[] {
  const tags = [...new Set(layer1Ids ?? [])]
  if (source === 'authentic') return tags
  if (source === 'synthetic') {
    const frameworkId = p5FrameworkId(qid)
    return frameworkId !== null && tags.includes(frameworkId) ? [frameworkId] : []
  }
  return []
}

/** How much of an estimate rests on synthetic answers. `calibrated` is false
 *  whenever any does: P5 difficulty is not yet calibrated against real HP
 *  results, so that estimate carries the caveat (PR 4 shows it). */
export type EstimateBasis = { authentic: number; synthetic: number; calibrated: boolean }

export function estimateBasis(authentic: number, synthetic: number): EstimateBasis {
  return { authentic, synthetic, calibrated: synthetic === 0 }
}

// A Provpass result's basis, and the result itself, are decided in
// lib/mockScore.ts.
