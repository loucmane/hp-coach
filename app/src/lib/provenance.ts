// Question provenance on the client (P5 infold PR 3, docs/p5-infold-design.md §E).
//
// The worker decides the provenance of everything it stores or scores
// (worker/src/lib/provenance.ts classifies every attempt authentic,
// synthetic or unknown from its qid, never from the client). The SPA needs
// one defensive rule for the numbers it computes itself — Provpass scoring
// (and the normering read from it) and the automatic hot-trap and top-trap
// counts: P5 practice questions never feed them.
//
// A P5 qid lives in the synthetic namespace the exporter mints,
// `p5-<unit>-r<revision>-<SECTION>-<nnn>` (pipeline/synthetic/infold/
// export_product.py), whose `p5-` prefix no authentic exam id carries
// (`var-…` / `host-…`, see lib/examNames.ts). Every id in that namespace —
// approved, retired, revised away or malformed — is excluded.

export const P5_QID_PREFIX = 'p5-'

/** True for any qid in the P5 practice namespace. */
export function isP5Qid(qid: string): boolean {
  return qid.startsWith(P5_QID_PREFIX)
}

/** The rows whose question is not P5 practice, in order — what an automatic
 *  trap count may read. P5 mistakes stay in the replay queue itself. */
export function withoutP5<T extends { questionId: string }>(rows: readonly T[]): T[] {
  return rows.filter((row) => !isP5Qid(row.questionId))
}
