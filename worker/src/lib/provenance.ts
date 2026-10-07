// Attempt provenance — which bank an answered question belongs to, decided on
// the server from the qid alone (P5 infold PR 3, docs/p5-infold-design.md §E).
//
//   authentic — a question of a real högskoleprov sitting the bank holds. The
//               qid grammar of the authentic bank, `{exam}-{provpass}-{SECTION}-{nnn}`:
//                 · exam      one of AUTHENTIC_EXAM_IDS, the sittings of
//                             app/public/data/_index.json (pinned by a test);
//                 · provpass  verb1 / verb2 / kvant1 / kvant2, the tokens the app
//                             keys exams by (app/src/data/explanations.ts:131);
//                 · SECTION   a section of that pass's half — verb holds ORD, LÄS,
//                             MEK, ELF and kvant XYZ, KVA, NOG, DTK
//                             (app/src/lib/mock.ts:96) — in lib/section.ts's
//                             spelling, which also accepts the legacy LAS;
//                 · nnn       three ASCII digits, as every bank qid has.
//   synthetic — a qid of the approved P5 reading-unit registry,
//               worker/data/p5-qid-registry.json, exported deterministically from
//               the approval roster by pipeline/synthetic/infold/export_qid_registry.py.
//   unknown   — anything else: a seed or test id, a malformed qid, a sitting the
//               bank does not hold, or a P5 qid whose unit is retired, revised
//               away or unapproved. Fails closed: stored for history, never assessed.
//
// The client never chooses. POST /api/attempts and the import route derive the
// value here and ignore anything provenance-like in the payload. This is a
// provenance rule, not an anti-cheat one: an authentic qid's correctness is
// still client-reported, as it always was.

import registry from '../../data/p5-qid-registry.json'
import { ATTEMPT_SOURCES, type AttemptSource } from '../db/schema'

export { ATTEMPT_SOURCES, type AttemptSource }

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

// The P5 qid the exporter mints (export_product.QID): a unit id, its
// revision, the unit's section and the question number.
const P5_QID =
  /^p5-(?:las-b[0-9]+-[0-9]{3}-r[1-9][0-9]*-LÄS|elf-b[0-9]+-[0-9]{3}-r[1-9][0-9]*-ELF)-[0-9]{3}$/

// A registry in any other format is read as empty: P5 answers then fall to
// `unknown`, out of every number, rather than being guessed at.
const P5_QIDS: ReadonlySet<string> = new Set(
  registry.format === 'p5-qid-registry-v1'
    ? registry.units.flatMap((unit) => unit.qids.filter((qid) => P5_QID.test(qid)))
    : [],
)

/** A qid of a real sitting the bank holds, in the bank's qid grammar. */
export function isAuthenticQid(qid: string): boolean {
  const m = AUTHENTIC_VERBAL_QID.exec(qid) ?? AUTHENTIC_QUANT_QID.exec(qid)
  return m != null && AUTHENTIC_EXAM_IDS.has(m[1])
}

/** A qid of the approved P5 registry: approved, not retired, current revision. */
export function isRegisteredP5Qid(qid: string): boolean {
  return P5_QIDS.has(qid)
}

/** The provenance stored on an attempt: authentic, synthetic, else unknown. */
export function classifyAttemptSource(qid: string): AttemptSource {
  if (isAuthenticQid(qid)) return 'authentic'
  if (isRegisteredP5Qid(qid)) return 'synthetic'
  return 'unknown'
}
