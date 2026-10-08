// Attempt provenance — which bank an answered question belongs to, decided on
// the server from the qid alone (P5 infold PR 3, docs/p5-infold-design.md
// Amendment 1 E).
//
//   authentic — a question of a real högskoleprov sitting the bank holds. The
//               qid grammar of the authentic bank, `{exam}-{provpass}-{SECTION}-{nnn}`:
//                 · exam      one of AUTHENTIC_EXAM_IDS, the sittings of
//                             app/public/data/_index.json (pinned by a test);
//                 · provpass  verb1 / verb2 / kvant1 / kvant2, the tokens the app
//                             keys exams by (app/src/data/explanations.ts:131);
//                 · SECTION   a section of that pass's half — verb holds ORD, LÄS,
//                             MEK, ELF and kvant XYZ, KVA, NOG, DTK
//                             (app/src/lib/mock.ts:35) — in lib/section.ts's
//                             spelling, which also accepts the legacy LAS;
//                 · nnn       three ASCII digits, as every bank qid has.
//   synthetic — a qid of the approved P5 registry, worker/data/p5-qid-registry.json,
//               exported deterministically from the approval roster by
//               pipeline/synthetic/infold/export_qid_registry.py. It counts
//               toward the assessment like an authentic answer, and every number
//               it feeds is marked uncalibrated (estimateBasis).
//   unknown   — anything else: a seed or test id, a malformed qid, a sitting the
//               bank does not hold, or a P5 qid whose unit is retired, revised
//               away or unapproved. Fails closed: stored for history, never assessed.
//
// The client never chooses. POST /api/attempts, the mock-result route and the
// import route derive the value here and ignore anything provenance-like in a
// payload. This is a provenance rule, not an anti-cheat one: an answer's
// correctness is still client-reported, as it always was.

import registry from '../../data/p5-qid-registry.json'
import { ATTEMPT_SOURCES, type AttemptSource } from '../db/schema'
import { extractSection } from './section'

export { ATTEMPT_SOURCES, type AttemptSource }

/** The sources whose answers feed the assessment: section scores, the weekly
 *  trend, accuracy, ability, item stats and Provpass. Never `unknown`. */
export const ASSESSED_SOURCES = [
  'authentic',
  'synthetic',
] as const satisfies readonly AttemptSource[]

/** The sittings of the authentic bank — the exam ids of
 *  app/public/data/_index.json. A test fails when the bank gains or loses a
 *  sitting and this list does not follow; until it does, the new sitting's
 *  answers stay `unknown` (fail closed), never authentic by accident. */
export const AUTHENTIC_EXAM_IDS: ReadonlySet<string> = new Set([
  'host-2013',
  'host-2014',
  'host-2015',
  'host-2016',
  'host-2017',
  'host-2018',
  'host-ver1-2019',
  'host-ver2-2019',
  'host-2020',
  'host-2021',
  'host-2022',
  'host-2023',
  'host-2024',
  'host-2025',
  'var-2013',
  'var-2014',
  'var-2015',
  'var-2016',
  'var-2017',
  'var-2018-1',
  'var-2019',
  'var-2022-1',
  'var-2022-2',
  'var-2023',
  'var-2024',
  'var-2025',
  'var-2026',
])

const AUTHENTIC_VERBAL_QID = /^(.+)-verb[12]-(?:ORD|LÄS|LAS|MEK|ELF)-[0-9]{3}$/
const AUTHENTIC_QUANT_QID = /^(.+)-kvant[12]-(?:XYZ|KVA|NOG|DTK)-[0-9]{3}$/

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

/** A qid of a real sitting the bank holds, in the bank's qid grammar. */
export function isAuthenticQid(qid: string): boolean {
  const m = AUTHENTIC_VERBAL_QID.exec(qid) ?? AUTHENTIC_QUANT_QID.exec(qid)
  return m != null && AUTHENTIC_EXAM_IDS.has(m[1])
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

/** A Provpass result's basis also counts the plan's unknown qids: the
 *  client-computed score includes them and the server cannot take them out,
 *  so they make the result uncalibrated too. */
export type PlanBasis = {
  authentic: number
  synthetic: number
  unknown: number
  calibrated: boolean
}
export type MockEstimateBasis = PlanBasis & { perSection: Record<string, PlanBasis> }

/** The basis of a Provpass result, from the qids its session presented, by
 *  their server-side source, overall and per section (sections in first-seen
 *  order; a qid without a section counts overall only). */
export function planEstimateBasis(plan: readonly string[]): MockEstimateBasis {
  const seed = (): PlanBasis => ({ authentic: 0, synthetic: 0, unknown: 0, calibrated: true })
  const total = seed()
  const perSection: Record<string, PlanBasis> = {}
  for (const qid of plan) {
    const { source } = classifyAttempt(qid)
    const section = extractSection(qid)
    const buckets = [total]
    if (section !== null) {
      perSection[section] ??= seed()
      buckets.push(perSection[section])
    }
    for (const bucket of buckets) {
      bucket[source] += 1
      bucket.calibrated = bucket.synthetic === 0 && bucket.unknown === 0
    }
  }
  return { ...total, perSection }
}
