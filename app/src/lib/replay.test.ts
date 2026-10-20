// Replay picker — covers:
//   1) Resolves due-mistake qids to real Question objects
//   2) Caps at the requested count even when more are due
//   3) Skips qids that don't resolve in the bank (parser drift)
//   4) Skips stub questions (parsing_status="answer_only")
//   5) Preserves the server-provided ordering (most-frequent first)
//   6) Samma fälla, ny fråga (hpf-bz6f.2): a miss with a trap is repeated
//      through an UNSEEN question with the same trap and section — the
//      least recently seen one when all have been seen — never a question
//      already in the round or itself a due miss; ORD, untagged questions
//      and traps with nothing left keep the missed question itself.
//   7) Resume (planEntry / prunePlan / resolveReplayPlan): a stored plan
//      carries each new question's source ("X~A") and a resume uses exactly
//      that link, never one re-derived from the due list; answered questions
//      before the cursor stay put as history, never graded, and from the
//      cursor on only questions whose mistakes are still due are played —
//      plus, in a plan whose links never landed, every plain question that
//      may be a new one (any outside ORD), graded nothing, whether or not
//      the trap index loads.
//   8) resumeQid: a resume opens a ?qid= only at or after the cursor.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Mistake } from '@/api/hooks/useMistakes'
import { EXCLUDED_QUESTIONS } from '@/data/figureOverrides'
import { loadBank, type Question } from '@/data/questions'

import {
  type PlanLink,
  parsePlanEntry,
  pickReplayQuestions,
  planEntry,
  prunePlan,
  type ReplayItem,
  resolveReplayPlan,
  resumeQid,
  samePlay,
} from './replay'
import {
  __resetTrapIndexCache,
  buildTrapIndex,
  TRAP_INDEX_URL,
  type TrapIndexFile,
} from './trapIndex'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const INDEX_FILE = path.resolve(HERE, '..', '..', 'public', 'trap-index.json')

// Resolved once per file from the lazy bank — keeps test bodies tight.
let bank: readonly Question[]
let ordQids: string[]
let stubQid: string
let lasQids: string[]
let kvaQid: string

const playable = (q: Question | undefined): q is Question =>
  !!q && q.parsing_status === 'complete' && !!q.options && !EXCLUDED_QUESTIONS.has(q.qid)

beforeAll(async () => {
  bank = await loadBank()
  ordQids = bank
    .filter((q) => q.section === 'ORD' && q.parsing_status === 'complete')
    .map((q) => q.qid)
    .slice(0, 5)
  stubQid = bank.find((q) => q.parsing_status === 'answer_only')?.qid ?? ''
  lasQids = bank
    .filter((q) => q.section === 'LÄS' && playable(q))
    .map((q) => q.qid)
    .slice(0, 5)
  kvaQid = bank.find((q) => q.section === 'KVA' && playable(q))?.qid ?? ''
})

/** Answer the static trap-index fetch; everything else (the bank) goes to
 *  the setup shim. */
function serveTrapIndex(respond: () => Response) {
  const base = globalThis.fetch
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
    String(input) === TRAP_INDEX_URL ? Promise.resolve(respond()) : base(input, init),
  )
}

// Default: no trap index served (404 = no traps), so the pre-trap tests
// below see exactly the old same-question replay.
beforeEach(() => serveTrapIndex(() => new Response('not found', { status: 404 })))
afterEach(() => {
  vi.unstubAllGlobals()
  __resetTrapIndexCache()
})

let nextId = 1
function mistake(questionId: string, errorCount = 1): Mistake {
  return {
    id: nextId++,
    userId: 1,
    questionId,
    layer1Ids: null,
    status: 'active',
    errorCount7d: errorCount,
    lastErrorAt: null,
    nextReviewAt: null,
  }
}

describe('pickReplayQuestions', () => {
  it('resolves due qids to fully-parsed Question objects', async () => {
    const due = ordQids.map((q) => mistake(q))
    const items = await pickReplayQuestions(due, 10)
    expect(items.length).toBe(ordQids.length)
    for (const it of items) {
      expect(it.question.parsing_status).toBe('complete')
      expect(it.question.options).not.toBeNull()
    }
  })

  it('caps at the requested count', async () => {
    const due = ordQids.map((q) => mistake(q))
    const items = await pickReplayQuestions(due, 2)
    expect(items.length).toBe(2)
  })

  it('skips qids that no longer resolve in the bank', async () => {
    const due = [mistake('var-2026-verb1-ORD-999'), mistake(ordQids[0])]
    const items = await pickReplayQuestions(due, 10)
    expect(items.length).toBe(1)
    expect(items[0].question.qid).toBe(ordQids[0])
  })

  it('skips stub (answer_only) questions', async () => {
    if (!stubQid) return // no stubs in fixture, nothing to assert
    const due = [mistake(stubQid), mistake(ordQids[0])]
    const items = await pickReplayQuestions(due, 10)
    const ids = items.map((i) => i.question.qid)
    expect(ids).not.toContain(stubQid)
    expect(ids).toContain(ordQids[0])
  })

  it('preserves server-provided ordering', async () => {
    const due = [mistake(ordQids[3]), mistake(ordQids[0]), mistake(ordQids[2])]
    const items = await pickReplayQuestions(due, 10)
    expect(items.map((i) => i.question.qid)).toEqual([ordQids[3], ordQids[0], ordQids[2]])
  })
})

describe('pickReplayQuestions — samma fälla, ny fråga', () => {
  // Synthetic trap: four real LÄS questions, plus a KVA question and a stub
  // tagged with the same id to prove section and playability are checked.
  const lasTrap = () =>
    buildTrapIndex({
      [lasQids[0]]: 'LAS-TYPE-T',
      [lasQids[1]]: 'LAS-TYPE-T',
      [lasQids[2]]: 'LAS-TYPE-T',
      [lasQids[3]]: 'LAS-TYPE-T',
      [kvaQid]: 'LAS-TYPE-T',
      ...(stubQid ? { [stubQid]: 'LAS-TYPE-T' } : {}),
    })

  it('repeats a trapped miss through a new question with the same trap and section', async () => {
    const m = mistake(lasQids[0])
    const traps = lasTrap()
    const [item] = await pickReplayQuestions([m], 10, { traps })
    expect(item.sibling).toBe(true)
    expect(item.mistakeId).toBe(m.id)
    expect(item.sourceQid).toBe(lasQids[0])
    expect(item.question.qid).not.toBe(lasQids[0])
    expect(traps.trapOf(item.question.qid)).toBe('LAS-TYPE-T')
    expect(item.question.section).toBe('LÄS')
    expect(item.question.parsing_status).toBe('complete')
    expect(item.question.options).not.toBeNull()
  })

  it('never offers a question from another section or one that cannot be played', async () => {
    const traps = buildTrapIndex({
      [lasQids[0]]: 'LAS-TYPE-T',
      [kvaQid]: 'LAS-TYPE-T',
      ...(stubQid ? { [stubQid]: 'LAS-TYPE-T' } : {}),
    })
    const [item] = await pickReplayQuestions([mistake(lasQids[0])], 10, { traps })
    expect(item.question.qid).toBe(lasQids[0])
    expect(item.sibling).toBe(false)
  })

  it('prefers a question the user has never seen', async () => {
    const exposure = {
      [lasQids[1]]: { n: 2, last: 100 },
      [lasQids[2]]: { n: 1, last: 50 },
    }
    const [item] = await pickReplayQuestions([mistake(lasQids[0])], 10, {
      traps: lasTrap(),
      exposure,
    })
    expect(item.question.qid).toBe(lasQids[3])
  })

  it('falls back to the least recently seen question when every one has been seen', async () => {
    const exposure = {
      [lasQids[1]]: { n: 1, last: 300 },
      [lasQids[2]]: { n: 4, last: 100 },
      [lasQids[3]]: { n: 1, last: 200 },
    }
    const [item] = await pickReplayQuestions([mistake(lasQids[0])], 10, {
      traps: lasTrap(),
      exposure,
    })
    expect(item.question.qid).toBe(lasQids[2])
  })

  it('gives two misses with one trap two different new questions, never a due one', async () => {
    const due = [mistake(lasQids[0]), mistake(lasQids[1])]
    const items = await pickReplayQuestions(due, 10, { traps: lasTrap() })
    const picked = items.map((i) => i.question.qid)
    expect(items.map((i) => i.sibling)).toEqual([true, true])
    expect(new Set(picked).size).toBe(2)
    expect(picked).not.toContain(lasQids[0])
    expect(picked).not.toContain(lasQids[1])
    expect(items.map((i) => i.mistakeId)).toEqual(due.map((m) => m.id))
  })

  it('keeps the missed question itself once no new question with the trap is left', async () => {
    const due = [mistake(lasQids[0]), mistake(lasQids[1]), mistake(lasQids[2])]
    const items = await pickReplayQuestions(due, 10, { traps: lasTrap() })
    expect(items.map((i) => [i.question.qid, i.sibling])).toEqual([
      [lasQids[3], true],
      [lasQids[1], false],
      [lasQids[2], false],
    ])
    expect(items.map((i) => i.sourceQid)).toEqual([lasQids[0], lasQids[1], lasQids[2]])
  })

  it('keeps same-item repetition for ORD, even if an ORD question ever carries a trap id', async () => {
    const traps = buildTrapIndex({ [ordQids[0]]: 'ORD-ROOT-T', [ordQids[1]]: 'ORD-ROOT-T' })
    const [item] = await pickReplayQuestions([mistake(ordQids[0])], 10, { traps })
    expect(item.question.qid).toBe(ordQids[0])
    expect(item.sibling).toBe(false)
  })

  it('keeps the missed question when it carries no trap id', async () => {
    const traps = buildTrapIndex({ [lasQids[1]]: 'LAS-TYPE-T', [lasQids[2]]: 'LAS-TYPE-T' })
    const [item] = await pickReplayQuestions([mistake(lasQids[0])], 10, { traps })
    expect(item.question.qid).toBe(lasQids[0])
    expect(item.sibling).toBe(false)
  })

  it('still caps the round at the requested count', async () => {
    const due = [mistake(lasQids[0]), mistake(ordQids[0]), mistake(ordQids[1])]
    const items = await pickReplayQuestions(due, 2, { traps: lasTrap() })
    expect(items.map((i) => i.sourceQid)).toEqual([lasQids[0], ordQids[0]])
  })

  it('replays the missed question itself when the trap index cannot load', async () => {
    serveTrapIndex(() => new Response('boom', { status: 503 }))
    const [item] = await pickReplayQuestions([mistake(lasQids[0])], 10)
    expect(item.question.qid).toBe(lasQids[0])
    expect(item.sibling).toBe(false)
  })

  it('loads the committed trap index by default', async () => {
    const text = readFileSync(INDEX_FILE, 'utf-8')
    const real = buildTrapIndex((JSON.parse(text) as TrapIndexFile).traps)
    const byQid = new Map(bank.map((q) => [q.qid, q]))
    // A MEK miss whose real trap has another playable MEK question.
    const source = bank.find((q) => {
      const trap = q.section === 'MEK' && playable(q) ? real.trapOf(q.qid) : null
      return (
        !!trap &&
        real
          .qidsFor(trap)
          .some((o) => o !== q.qid && byQid.get(o)?.section === 'MEK' && playable(byQid.get(o)))
      )
    })
    if (!source) throw new Error('corpus has no MEK trap with two playable questions')
    serveTrapIndex(() => new Response(text, { status: 200 }))
    const [item] = await pickReplayQuestions([mistake(source.qid)], 10)
    expect(item.sibling).toBe(true)
    expect(item.question.qid).not.toBe(source.qid)
    expect(real.trapOf(item.question.qid)).toBe(real.trapOf(source.qid))
  })
})

// planEntry / parsePlanEntry — what a round stores per question: a new
// question carries the question whose mistake it repeats ("X~A"); every
// other entry is a plain qid, which is all an older plan holds.
const link = (qid: string, sourceQid: string) => `${qid}~${sourceQid}`

describe('planEntry / parsePlanEntry', () => {
  const item = (qid: string, sourceQid: string): ReplayItem => {
    const question = bank.find((q) => q.qid === qid)
    if (!question) throw new Error(`no question ${qid}`)
    return { question, mistakeId: 1, sourceQid, sibling: qid !== sourceQid }
  }

  it('stores a new question with its source, and any other question as its plain qid', () => {
    expect(planEntry(item(lasQids[1], lasQids[0]))).toBe(link(lasQids[1], lasQids[0]))
    expect(planEntry(item(ordQids[0], ordQids[0]))).toBe(ordQids[0])
  })

  it('reads an entry back to the question it plays and the one whose mistake it repeats', () => {
    expect(parsePlanEntry(link(lasQids[1], lasQids[0]))).toEqual({
      qid: lasQids[1],
      sourceQid: lasQids[0],
    })
    // A plain qid — all an older plan holds — repeats its own mistake.
    expect(parsePlanEntry(ordQids[0])).toEqual({ qid: ordQids[0], sourceQid: ordQids[0] })
  })

  it('never stores an entry longer than a stored plan allows', () => {
    const long = { ...item(lasQids[1], lasQids[0]), sourceQid: 'x'.repeat(80) }
    expect(planEntry(long)).toBe(lasQids[1])
  })
})

// prunePlan — the ghost-replay guard (residual #290), resuming an adopted
// adaptive_review session's stored plan against the CURRENT due list. The
// plan keeps its own order; answered entries before the cursor stay; from
// the cursor on, an entry plays only while the mistake stored with it is
// still due — mistakes since resolved or rescheduled out are dropped.
const planQids = (links: PlanLink[]) => links.map((l) => l.qid)

describe('prunePlan', () => {
  it('drops stored qids that no longer have a matching due mistake', () => {
    const due = [mistake(ordQids[0]), mistake(ordQids[2])]
    const stored = [ordQids[0], ordQids[1], ordQids[2]]
    expect(planQids(prunePlan(stored, due))).toEqual([ordQids[0], ordQids[2]])
  })

  it('keeps the stored plan order, not the due list order', () => {
    const due = [mistake(ordQids[2]), mistake(ordQids[0]), mistake(ordQids[1])]
    const stored = [ordQids[1], ordQids[0], ordQids[2]]
    expect(planQids(prunePlan(stored, due))).toEqual([ordQids[1], ordQids[0], ordQids[2]])
  })

  it('returns an empty array when every stored qid was resolved out', () => {
    const due = [mistake(ordQids[4])]
    const stored = [ordQids[0], ordQids[1]]
    expect(prunePlan(stored, due)).toEqual([])
  })

  it('is a no-op when nothing was resolved', () => {
    const due = [mistake(ordQids[0]), mistake(ordQids[1])]
    const stored = [ordQids[0], ordQids[1]]
    expect(planQids(prunePlan(stored, due))).toEqual(stored)
  })

  it('handles an empty stored plan', () => {
    expect(prunePlan([], [mistake(ordQids[0])])).toEqual([])
  })

  it('links a same-question entry to its own mistake', () => {
    const m = mistake(ordQids[0])
    expect(prunePlan([ordQids[0]], [m])).toEqual([
      { qid: ordQids[0], sourceQid: ordQids[0], sibling: false, mistakeId: m.id },
    ])
  })

  it('links a new question to the mistake stored with it', () => {
    const m = mistake(lasQids[0])
    expect(prunePlan([link(lasQids[1], lasQids[0])], [m])).toEqual([
      { qid: lasQids[1], sourceQid: lasQids[0], sibling: true, mistakeId: m.id },
    ])
  })

  it('keeps every stored link when the due list reorders and gains a mistake with the same trap', () => {
    // X repeats A and Y repeats B. Now a newer miss C sorts first and B
    // before A: re-deriving from due order would hand X to C and Y to B.
    const [a, b, c] = [mistake(lasQids[0]), mistake(lasQids[1]), mistake(lasQids[4])]
    const stored = [link(lasQids[2], a.questionId), link(lasQids[3], b.questionId)]
    expect(prunePlan(stored, [c, b, a]).map((l) => [l.qid, l.mistakeId])).toEqual([
      [lasQids[2], a.id],
      [lasQids[3], b.id],
    ])
  })

  it('never re-derives a source for a stored new question that carries none', () => {
    // A plain qid repeats its own mistake only — never a due one it shares a
    // trap with.
    expect(prunePlan([lasQids[2]], [mistake(lasQids[0])])).toEqual([])
  })

  it('keeps the answered questions before the cursor, whatever their mistakes’ state', () => {
    // X was answered right, so A left the due list; the cursor is on Y.
    const b = mistake(lasQids[1])
    const stored = [link(lasQids[2], lasQids[0]), link(lasQids[3], lasQids[1])]
    expect(prunePlan(stored, [b], 1)).toEqual([
      { qid: lasQids[2], sourceQid: lasQids[0], sibling: true, mistakeId: null },
      { qid: lasQids[3], sourceQid: lasQids[1], sibling: true, mistakeId: b.id },
    ])
  })

  it('from the cursor on, skips a question whose mistake left the due list and keeps the rest', () => {
    const b = mistake(lasQids[1])
    const stored = [link(lasQids[2], lasQids[0]), link(lasQids[3], lasQids[1]), ordQids[0]]
    expect(planQids(prunePlan(stored, [b], 0))).toEqual([lasQids[3]])
  })

  it('repeats a due mistake once, even when a stored plan names it twice', () => {
    const a = mistake(lasQids[0])
    const stored = [link(lasQids[2], lasQids[0]), link(lasQids[3], lasQids[0])]
    expect(prunePlan(stored, [a]).map((l) => [l.qid, l.mistakeId])).toEqual([[lasQids[2], a.id]])
  })

  it('never maps an answered question before the cursor, even while its mistake is still due', () => {
    // X was answered but A is still due (its review never landed, say). X is
    // history all the same: an answer there must never move A again.
    const [a, b] = [mistake(lasQids[0]), mistake(lasQids[1])]
    const stored = [link(lasQids[2], lasQids[0]), link(lasQids[3], lasQids[1])]
    expect(prunePlan(stored, [a, b], 1)).toEqual([
      { qid: lasQids[2], sourceQid: lasQids[0], sibling: true, mistakeId: null },
      { qid: lasQids[3], sourceQid: lasQids[1], sibling: true, mistakeId: b.id },
    ])
  })

  it('in a plan without links, keeps a plain question that may be a new one, graded nothing', () => {
    // The round's links never reached the server: X and Y may be new
    // questions whose sources are unknown. They play on; the ORD item whose
    // mistake left the due list is still skipped (#290).
    const mOrd = mistake(ordQids[0])
    const mayBeNew = (qid: string) => qid === lasQids[2] || qid === lasQids[3]
    const stored = [lasQids[2], lasQids[3], ordQids[0], ordQids[1]]
    expect(prunePlan(stored, [mOrd], 1, mayBeNew)).toEqual([
      { qid: lasQids[2], sourceQid: lasQids[2], sibling: false, mistakeId: null },
      { qid: lasQids[3], sourceQid: lasQids[3], sibling: false, mistakeId: null },
      { qid: ordQids[0], sourceQid: ordQids[0], sibling: false, mistakeId: mOrd.id },
    ])
  })

  it('a plain question that may be new still reviews a due mistake of its own', () => {
    const own = mistake(lasQids[3])
    expect(prunePlan([lasQids[3]], [own], 0, () => true)).toEqual([
      { qid: lasQids[3], sourceQid: lasQids[3], sibling: false, mistakeId: own.id },
    ])
  })

  it('never keeps such a question once the plan stores a link', () => {
    // The server stores a round's links whole: a plan with one link has all
    // of them, so a plain entry there is a same-question repeat.
    const stored = [link(lasQids[2], lasQids[0]), lasQids[3]]
    expect(prunePlan(stored, [], 0, () => true)).toEqual([])
  })
})

describe('resolveReplayPlan', () => {
  it('resolves a stored round: questions in order, linked items, unresolvable qids dropped', async () => {
    const mLas = mistake(lasQids[0])
    const mOrd = mistake(ordQids[0])
    const mGone = mistake('var-2026-verb1-ORD-999')
    const round = await resolveReplayPlan(
      [link(lasQids[1], lasQids[0]), 'var-2026-verb1-ORD-999', ordQids[0]],
      [mLas, mOrd, mGone],
    )
    expect(round.questions.map((q) => q.qid)).toEqual([lasQids[1], ordQids[0]])
    expect(round.items.map((i) => [i.question.qid, i.mistakeId, i.sourceQid, i.sibling])).toEqual([
      [lasQids[1], mLas.id, lasQids[0], true],
      [ordQids[0], mOrd.id, ordQids[0], false],
    ])
    expect(round.remaining).toBe(2)
  })

  it('hands back the answered questions before the cursor and counts what is left', async () => {
    const mOrd = mistake(ordQids[1])
    const round = await resolveReplayPlan(
      [link(lasQids[1], lasQids[0]), ordQids[0], ordQids[1]],
      [mOrd],
      2,
    )
    expect(round.questions.map((q) => q.qid)).toEqual([lasQids[1], ordQids[0], ordQids[1]])
    expect(round.items.map((i) => i.question.qid)).toEqual([ordQids[1]])
    expect(round.remaining).toBe(1)
  })

  it('has nothing left once no question from the cursor on repeats a due mistake', async () => {
    const round = await resolveReplayPlan([ordQids[0], ordQids[1]], [mistake(ordQids[0])], 1)
    expect(round.questions.map((q) => q.qid)).toEqual([ordQids[0]])
    expect(round.remaining).toBe(0)
  })

  it('never hands an answered question over as an item, even while its mistake is due', async () => {
    const [mLas, mOrd] = [mistake(lasQids[0]), mistake(ordQids[0])]
    const round = await resolveReplayPlan(
      [link(lasQids[1], lasQids[0]), ordQids[0]],
      [mLas, mOrd],
      1,
    )
    expect(round.questions.map((q) => q.qid)).toEqual([lasQids[1], ordQids[0]])
    expect(round.items.map((i) => [i.question.qid, i.mistakeId])).toEqual([[ordQids[0], mOrd.id]])
    expect(round.remaining).toBe(1)
  })

  it('plays on through a plan whose links never landed: a question outside ORD is kept, graded nothing', async () => {
    // A plain plan: the LÄS question may be a new question whose source is
    // unknown. It stays in the round (so the round does not end), but it
    // reviews nothing.
    const mOrd = mistake(ordQids[0])
    const round = await resolveReplayPlan([lasQids[1], ordQids[0], ordQids[1]], [mOrd], 0)
    // ORD is never a new question: its mistake left the due list, so it is
    // skipped (#290).
    expect(round.questions.map((q) => q.qid)).toEqual([lasQids[1], ordQids[0]])
    expect(round.items.map((i) => [i.question.qid, i.mistakeId])).toEqual([[ordQids[0], mOrd.id]])
    expect(round.remaining).toBe(2)
  })

  it.each([
    ['fails to load', () => new Response('boom', { status: 503 })],
    ['is missing (404)', () => new Response('not found', { status: 404 })],
    [
      'does not know the questions',
      () => new Response(JSON.stringify({ version: 1, generator: 'test', traps: {} })),
    ],
  ])('plays on through a plan whose links never landed when the trap index %s', async (_label, respond) => {
    // X and Y were the round's new questions; the cursor is on Y. Nothing
    // the index serves, or fails to, can drop them and end the round.
    serveTrapIndex(respond)
    const round = await resolveReplayPlan([lasQids[2], lasQids[3], lasQids[4]], [], 1)
    expect(round.questions.map((q) => q.qid)).toEqual([lasQids[2], lasQids[3], lasQids[4]])
    expect(round.items).toEqual([])
    expect(round.remaining).toBe(2)
  })

  it('still skips a plain question whose mistake left the due list once the plan stores its links (#290)', async () => {
    // The server stores a round's links whole, so a plain entry beside a
    // link is a same-question repeat: its mistake is done.
    const round = await resolveReplayPlan([link(lasQids[1], lasQids[0]), lasQids[2]], [], 0)
    expect(round.questions).toEqual([])
    expect(round.remaining).toBe(0)
  })
})

// resumeQid — the ?qid= a resume may open. Only a question at or after the
// stored cursor: an answered one is history, and an answer there would
// grade it again.
describe('resumeQid', () => {
  const [x, y, z] = ['X-LÄS-1', 'Y-LÄS-2', 'Z-ORD-3']
  const plan = [link(x, 'A-LÄS-0'), link(y, 'B-LÄS-9'), z]

  it('opens a question at or after the cursor', () => {
    expect(resumeQid(y, plan, 1, y)).toBe(y)
    expect(resumeQid(z, plan, 1, y)).toBe(z)
  })

  it('opens the paused question instead of an answered one', () => {
    expect(resumeQid(x, plan, 1, y)).toBe(y)
  })

  it('opens the paused question instead of one the round does not hold', () => {
    expect(resumeQid('var-2026-verb1-LÄS-999', plan, 1, y)).toBe(y)
  })

  it('opens the question at the cursor when the paused one is not ahead of it', () => {
    expect(resumeQid(x, plan, 1, x)).toBe(y)
    expect(resumeQid(x, plan, 1, null)).toBe(y)
  })

  it('has nothing to open past the end of the round', () => {
    expect(resumeQid(x, plan, 3, null)).toBeNull()
  })
})

describe('samePlay', () => {
  it('compares the questions two plans play, in order, whatever links they carry', () => {
    expect(samePlay([link('X', 'A'), 'O'], ['X', 'O'])).toBe(true)
    expect(samePlay(['O', 'X'], ['X', 'O'])).toBe(false)
    expect(samePlay(['X'], ['X', 'O'])).toBe(false)
  })
})
