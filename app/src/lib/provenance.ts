// Question provenance on the client (P5 infold PR 3, docs/p5-infold-design.md
// Amendment 1 E).
//
// The worker decides the provenance of everything it stores or scores
// (worker/src/lib/provenance.ts classifies each answer authentic, synthetic or
// unknown from its qid, never from the client). Synthetic (P5) answers COUNT
// toward the estimates — section scores, the weekly trend, ability, Provpass
// and the HP-scale projection — and every estimate the worker serves carries
// an estimateBasis saying how much of it rests on them. An estimate a P5
// answer feeds is uncalibrated: P5 difficulty is not yet calibrated against
// real HP results, and PR 4 shows the caveat wherever such an estimate is.
//
// This module holds the shared shapes and the client-side rules:
//   · isCalibrated / combineBases — reading and joining bases; an absent
//     basis (an older worker, a row from before P5) rests on authentic
//     answers only, so it is calibrated;
//   · frameworkSignal — the automatic trap counts (useAdaptiveReview,
//     useTopTraps) take a P5 mistake only when its explanation names a
//     framework of the question's own section.

import { sectionOfQid } from './dueBySection'

/** How much of an estimate rests on synthetic answers; mirrors the worker's
 *  EstimateBasis. `calibrated` is false whenever any synthetic answer counts. */
export type EstimateBasis = { authentic: number; synthetic: number; calibrated: boolean }

/** A Provpass result's questions by provenance; mirrors the worker's
 *  MockBasisCounts (worker/src/lib/mockScore.ts). `unknown` questions are
 *  counted for the record only: the worker leaves them out of the stored
 *  result, so they never make it uncalibrated. */
export type PlanBasis = EstimateBasis & { unknown: number }
/** What a stored Provpass result rests on. `unclassified` counts questions
 *  the client reported that the worker could not identify; any of them, like
 *  any synthetic question, makes the result uncalibrated. */
export type MockEstimateBasis = PlanBasis & {
  unclassified: number
  perSection: Record<string, PlanBasis>
}

/** The synthetic qid namespace the exporter mints,
 *  `p5-<unit>-r<revision>-<SECTION>-<nnn>` (pipeline/synthetic/infold/
 *  export_product.py); no authentic exam id (`var-…`, `host-…`) carries it. */
export const P5_QID_PREFIX = 'p5-'

// A Layer-1 framework id of a P5 section (frameworks/las_taxonomy.json and
// elf_taxonomy.json): LÄS ids are spelled LAS-…, ELF ids ELF-…. Mirrors the
// worker's registry check.
const P5_FRAMEWORK_ID: Readonly<Record<string, RegExp>> = {
  LÄS: /^LAS-[A-Z]+-[0-9]{3}$/,
  ELF: /^ELF-[A-Z]+-[0-9]{3}$/,
}

/** True for any qid in the P5 namespace. */
export function isP5Qid(qid: string): boolean {
  return qid.startsWith(P5_QID_PREFIX)
}

/** Whether an estimate is calibrated: its basis says so, and an estimate
 *  without one (an older worker, a row from before P5) rests on authentic
 *  answers only. */
export function isCalibrated(basis: EstimateBasis | null | undefined): boolean {
  return basis?.calibrated ?? true
}

/** Several estimates' bases as one: the counts summed, calibrated only when
 *  every part is. Absent parts contribute nothing. */
export function combineBases(
  bases: ReadonlyArray<EstimateBasis | null | undefined>,
): EstimateBasis {
  const out: EstimateBasis = { authentic: 0, synthetic: 0, calibrated: true }
  for (const basis of bases) {
    if (!basis) continue
    out.authentic += basis.authentic
    out.synthetic += basis.synthetic
    out.calibrated = out.calibrated && basis.calibrated
  }
  out.calibrated = out.calibrated && out.synthetic === 0
  return out
}

/** The framework id an automatic trap count may take from a mistake on
 *  `qid`, given the framework_id its explanation names: unchanged for an
 *  authentic question; for a P5 question only a framework of its own
 *  section, else null (Amendment 1 E: a P5 mistake without a valid
 *  framework_id is skipped for those counts). */
export function frameworkSignal(
  qid: string,
  frameworkId: string | null | undefined,
): string | null {
  if (!frameworkId) return null
  if (!isP5Qid(qid)) return frameworkId
  const section = sectionOfQid(qid)
  return section !== null && P5_FRAMEWORK_ID[section]?.test(frameworkId) ? frameworkId : null
}
