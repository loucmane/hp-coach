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
//   7) Resume (prunePlan / resolveReplayPlan): the ghost-replay guard keeps
//      a stored sibling linked to the due mistake it repeats.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Mistake } from '@/api/hooks/useMistakes'
import { EXCLUDED_QUESTIONS } from '@/data/figureOverrides'
import { loadBank, type Question } from '@/data/questions'

import { type PlanLink, pickReplayQuestions, prunePlan, resolveReplayPlan } from './replay'
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
    .slice(0, 4)
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

// prunePlan — ghost-replay guard (residual #290): an adopted adaptive_review
// session's stored plan may include qids whose mistakes were since resolved
// or rescheduled out. prunePlan drops those, keeping the plan's own order,
// and links every survivor to the due mistake it repeats.
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
      { qid: ordQids[0], mistakeId: m.id, sourceQid: ordQids[0], sibling: false },
    ])
  })

  it('keeps a new question with a due mistake’s trap, linked to that mistake', () => {
    const traps = buildTrapIndex({ [lasQids[0]]: 'LAS-TYPE-T', [lasQids[1]]: 'LAS-TYPE-T' })
    const m = mistake(lasQids[0])
    expect(prunePlan([lasQids[1]], [m], traps)).toEqual([
      { qid: lasQids[1], mistakeId: m.id, sourceQid: lasQids[0], sibling: true },
    ])
  })

  it('drops a new question once no due mistake carries its trap', () => {
    const traps = buildTrapIndex({
      [lasQids[0]]: 'LAS-TYPE-T',
      [lasQids[1]]: 'LAS-TYPE-T',
      [lasQids[2]]: 'LAS-TYPE-U',
    })
    expect(prunePlan([lasQids[1]], [mistake(lasQids[2])], traps)).toEqual([])
  })

  it('lets a same-question entry claim its own mistake before a new question can', () => {
    const traps = buildTrapIndex({
      [lasQids[0]]: 'LAS-TYPE-T',
      [lasQids[1]]: 'LAS-TYPE-T',
      [lasQids[2]]: 'LAS-TYPE-T',
    })
    // Due order puts m1 first, but m1 is repeated by its own question.
    const m1 = mistake(lasQids[1])
    const m0 = mistake(lasQids[0])
    expect(prunePlan([lasQids[2], lasQids[1]], [m1, m0], traps)).toEqual([
      { qid: lasQids[2], mistakeId: m0.id, sourceQid: lasQids[0], sibling: true },
      { qid: lasQids[1], mistakeId: m1.id, sourceQid: lasQids[1], sibling: false },
    ])
  })

  it('links two new questions with one trap to two different mistakes, in due order', () => {
    const traps = buildTrapIndex({
      [lasQids[0]]: 'LAS-TYPE-T',
      [lasQids[1]]: 'LAS-TYPE-T',
      [lasQids[2]]: 'LAS-TYPE-T',
      [lasQids[3]]: 'LAS-TYPE-T',
    })
    const m0 = mistake(lasQids[0])
    const m1 = mistake(lasQids[1])
    const links = prunePlan([lasQids[2], lasQids[3]], [m0, m1], traps)
    expect(links.map((l) => [l.qid, l.mistakeId])).toEqual([
      [lasQids[2], m0.id],
      [lasQids[3], m1.id],
    ])
  })

  it('never links a new question to a mistake in another section', () => {
    const traps = buildTrapIndex({ [kvaQid]: 'LAS-TYPE-T', [lasQids[1]]: 'LAS-TYPE-T' })
    expect(prunePlan([lasQids[1]], [mistake(kvaQid)], traps)).toEqual([])
  })
})

describe('resolveReplayPlan', () => {
  it('resolves a stored plan to questions, siblings linked, unresolvable qids dropped', async () => {
    const traps = buildTrapIndex({ [lasQids[0]]: 'LAS-TYPE-T', [lasQids[1]]: 'LAS-TYPE-T' })
    const mLas = mistake(lasQids[0])
    const mOrd = mistake(ordQids[0])
    const mGone = mistake('var-2026-verb1-ORD-999')
    const items = await resolveReplayPlan(
      [lasQids[1], 'var-2026-verb1-ORD-999', ordQids[0]],
      [mLas, mOrd, mGone],
      { traps },
    )
    expect(items.map((i) => [i.question.qid, i.mistakeId, i.sourceQid, i.sibling])).toEqual([
      [lasQids[1], mLas.id, lasQids[0], true],
      [ordQids[0], mOrd.id, ordQids[0], false],
    ])
  })
})
