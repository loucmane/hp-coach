// /repetition — Samma fälla, ny fråga (hpf-bz6f.2). The route turns the due
// queue into a round where a trapped miss is repeated through a NEW
// question with the same trap. Pins the wiring around SessionPlayer
// (stubbed here; its own lifecycle has its own tests):
//   - every answer on a planned item reviews THE MISTAKE IT REPEATS by row
//     id — a wrong answer on a new question lapses the original mistake,
//     it never records a mistake for the new question;
//   - a fresh round's stored plan carries each new question's source, and a
//     resume answers against exactly that source — never one re-derived
//     from the due list, which changes between pause and resume;
//   - a resume picks up at the saved cursor and skips a question whose
//     mistake left the due list without ending the round;
//   - a fresh round never treats the questions just answered as unseen;
//   - a new question carries the quiet "Samma fälla, ny fråga" label.
//
// Real bank + real replay logic; the trap index is a small synthetic one.

import { act, render, screen } from '@testing-library/react'
import type { FunctionComponent } from 'react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Mistake } from '@/api/hooks/useMistakes'
import type { ExposureMap } from '@/api/hooks/useMockResults'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { SessionPlayerProps } from '@/components/session/SessionPlayer'
import { EXCLUDED_QUESTIONS } from '@/data/figureOverrides'
import { loadBank, type Question } from '@/data/questions'
import type * as TrapIndexModule from '@/lib/trapIndex'

const h = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
  props: null as SessionPlayerProps | null,
  due: [] as Mistake[],
  exposure: {
    data: {} as ExposureMap | undefined,
    isError: false,
    refetch: vi.fn(),
  },
  traps: {} as Record<string, string>,
  session: null as ActiveSession | null,
  review: vi.fn(),
  record: vi.fn(),
  resolve: vi.fn(),
  link: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => h.search }),
  useNavigate: () => vi.fn(),
  Link: () => null,
}))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: h.due, refetch: async () => ({ data: h.due }) }),
  useRecordMistake: () => ({ mutate: h.record }),
  useResolveMistakeByQuestion: () => ({ mutate: h.resolve }),
  useReviewMistake: () => ({ mutate: h.review }),
  useLinkRound: () => ({ mutate: h.link }),
}))
vi.mock('@/api/hooks/useMockResults', () => ({
  useExposure: () => h.exposure,
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessionOfKind: () => ({ data: h.session }),
}))
vi.mock('@/components/session/SessionPlayer', () => ({
  SessionPlayer: (props: SessionPlayerProps) => {
    h.props = props
    return null
  },
}))
vi.mock('@/lib/trapIndex', async (importOriginal) => {
  const actual = await importOriginal<typeof TrapIndexModule>()
  return { ...actual, loadTrapIndex: async () => actual.buildTrapIndex(h.traps) }
})

import { Route } from './repetition'

const Screen = Route.options.component as FunctionComponent

let las: Question[]
let ord: Question
let byQid: Map<string, Question>

beforeAll(async () => {
  const bank = await loadBank()
  byQid = new Map(bank.map((q) => [q.qid, q]))
  las = bank
    .filter(
      (q) =>
        q.section === 'LÄS' &&
        q.parsing_status === 'complete' &&
        q.options &&
        !EXCLUDED_QUESTIONS.has(q.qid),
    )
    .slice(0, 6)
  const firstOrd = bank.find((q) => q.section === 'ORD' && q.parsing_status === 'complete')
  if (!firstOrd || las.length < 6) throw new Error('bank fixture is missing LÄS/ORD questions')
  ord = firstOrd
})

function mistake(id: number, questionId: string): Mistake {
  return {
    id,
    userId: 1,
    questionId,
    layer1Ids: null,
    status: 'active',
    errorCount7d: 1,
    lastErrorAt: null,
    nextReviewAt: null,
  }
}

function question(qid: string): Question {
  const q = byQid.get(qid)
  if (!q) throw new Error(`no question ${qid}`)
  return q
}

/** The open adaptive_review session SessionPlayer creates for a round. */
function activeRound(id: number, plan: string[]): ActiveSession {
  return {
    id,
    userId: 1,
    kind: 'adaptive_review',
    sections: 'alla',
    position: 0,
    currentQuestionId: plan[0] ?? null,
    plan,
    device: null,
    startedAt: null,
    endedAt: null,
  }
}

/** One trap shared by all six LÄS fixture questions. */
function oneTrap(): Record<string, string> {
  return Object.fromEntries(las.map((q) => [q.qid, 'LAS-TYPE-T']))
}

function player(): SessionPlayerProps {
  if (!h.props) throw new Error('SessionPlayer was not rendered')
  return h.props
}

async function pick(): Promise<string[]> {
  let questions: Question[] = []
  await act(async () => {
    questions = await player().pickQuestions()
  })
  return questions.map((q) => q.qid)
}

async function resume(entries: string[], position?: number): Promise<string[]> {
  let questions: Question[] = []
  await act(async () => {
    questions = await (player().resolvePlan?.(entries, position) ?? Promise.resolve([]))
  })
  return questions.map((q) => q.qid)
}

/** The plans the route asked to store, in call order. */
function linkedPlans(): Array<{ sessionId: number; plan: string[] }> {
  return h.link.mock.calls.map(([vars]) => vars as { sessionId: number; plan: string[] })
}

/** Start a fresh round the way SessionPlayer does — pick it, then create
 *  its session with the plain qids — and return what the session stores
 *  once the route has linked it. */
async function startRound(view: ReturnType<typeof render>) {
  const plan = await pick()
  h.session = activeRound(7, plan)
  view.rerender(<Screen />)
  return { plan, stored: linkedPlans().at(-1)?.plan ?? plan }
}

/** Leave and come back: a new mount adopts the stored session. */
function remount(view: ReturnType<typeof render>) {
  view.unmount()
  h.props = null
  return render(<Screen />)
}

beforeEach(() => {
  h.search = {}
  h.props = null
  h.exposure = { data: {}, isError: false, refetch: vi.fn(async () => ({ data: {} })) }
  h.traps = { [las[0].qid]: 'LAS-TYPE-T', [las[1].qid]: 'LAS-TYPE-T' }
  h.due = [mistake(101, las[0].qid), mistake(102, ord.qid)]
  h.session = null
  for (const fn of [h.review, h.record, h.resolve, h.link]) fn.mockReset()
})

describe('/repetition — samma fälla, ny fråga', () => {
  it('repeats a trapped miss through a new question and keeps ORD on the same item', async () => {
    render(<Screen />)
    expect(await pick()).toEqual([las[1].qid, ord.qid])
  })

  it('answers on a new question review the source mistake — right and wrong alike', async () => {
    render(<Screen />)
    await pick()
    player().onCorrect?.(las[1])
    player().onWrong?.(las[1])
    expect(h.review.mock.calls).toEqual([
      [{ id: 101, correct: true }],
      [{ id: 101, correct: false }],
    ])
    // A miss on the new question lapses the original: no mistake of its own.
    expect(h.record).not.toHaveBeenCalled()
    expect(h.resolve).not.toHaveBeenCalled()
  })

  it('answers on a same-question item review its own mistake', async () => {
    render(<Screen />)
    await pick()
    player().onCorrect?.(ord)
    player().onWrong?.(ord)
    expect(h.review.mock.calls).toEqual([
      [{ id: 102, correct: true }],
      [{ id: 102, correct: false }],
    ])
    expect(h.record).not.toHaveBeenCalled()
  })

  it('labels a new question "Samma fälla, ny fråga", and only a new question', async () => {
    const { rerender } = render(<Screen />)
    await pick()
    h.search = { qid: las[1].qid }
    rerender(<Screen />)
    expect(screen.getByTestId('repetition-sibling-label')).toHaveTextContent(
      'Samma fälla, ny fråga',
    )
    h.search = { qid: ord.qid }
    rerender(<Screen />)
    expect(screen.queryByTestId('repetition-sibling-label')).toBeNull()
  })

  it('waits for the exposure map so an unseen question wins', async () => {
    h.traps = {
      [las[0].qid]: 'LAS-TYPE-T',
      [las[1].qid]: 'LAS-TYPE-T',
      [las[2].qid]: 'LAS-TYPE-T',
    }
    const seen = { [las[1].qid]: { n: 1, last: 1 }, [las[2].qid]: { n: 0, last: 0 } }
    h.exposure = {
      data: undefined,
      isError: false,
      refetch: vi.fn(async () => ({ data: seen })),
    }
    // las[2] is unseen whatever the qid order, so it must be the pick.
    h.due = [mistake(101, las[0].qid)]
    render(<Screen />)
    expect(await pick()).toEqual([las[2].qid])
    expect(h.exposure.refetch).toHaveBeenCalledTimes(1)
  })
})

describe('/repetition — a fresh round stores its links', () => {
  it('stores each new question with the mistake it repeats, once the session exists', async () => {
    const view = render(<Screen />)
    const plan = await pick()
    expect(plan).toEqual([las[1].qid, ord.qid])
    // SessionPlayer has not created the session yet: nothing to link.
    expect(h.link).not.toHaveBeenCalled()

    h.session = activeRound(7, plan)
    view.rerender(<Screen />)
    const linked = [`${las[1].qid}~${las[0].qid}`, ord.qid]
    expect(linkedPlans()).toEqual([{ sessionId: 7, plan: linked }])

    // Once the session stores the links, nothing is sent again.
    h.session = activeRound(7, linked)
    view.rerender(<Screen />)
    view.rerender(<Screen />)
    expect(h.link).toHaveBeenCalledTimes(1)
  })

  it('writes the links again whenever the session shows up without them', async () => {
    // A failed write, or a slower response of SessionPlayer's own that puts
    // the plain plan back in the cache.
    h.link.mockImplementation((_vars: unknown, options?: { onSettled?: () => void }) =>
      options?.onSettled?.(),
    )
    const view = render(<Screen />)
    const plan = await pick()
    const linked = [`${las[1].qid}~${las[0].qid}`, ord.qid]
    h.session = activeRound(7, plan)
    view.rerender(<Screen />)
    h.session = activeRound(7, linked)
    view.rerender(<Screen />)
    h.session = activeRound(7, plan)
    view.rerender(<Screen />)
    expect(linkedPlans()).toEqual([
      { sessionId: 7, plan: linked },
      { sessionId: 7, plan: linked },
    ])
  })

  it('never links a session that is not this open round', async () => {
    const view = render(<Screen />)
    const plan = await pick()
    h.session = activeRound(8, [ord.qid, las[1].qid])
    view.rerender(<Screen />)
    h.session = { ...activeRound(7, plan), endedAt: '2026-10-20T21:00:00Z' }
    view.rerender(<Screen />)
    expect(h.link).not.toHaveBeenCalled()
  })

  it('has nothing to store for a round without new questions', async () => {
    h.traps = {}
    const view = render(<Screen />)
    const plan = await pick()
    expect(plan).toEqual([las[0].qid, ord.qid])
    h.session = activeRound(7, plan)
    view.rerender(<Screen />)
    expect(h.link).not.toHaveBeenCalled()
  })
})

describe('/repetition — resuming a stored plan', () => {
  const linkedPlan = () => [`${las[1].qid}~${las[0].qid}`, ord.qid]

  it('keeps a stored new question, mapped to the mistake it repeats', async () => {
    render(<Screen />)
    expect(await resume(linkedPlan(), 0)).toEqual([las[1].qid, ord.qid])
    player().onWrong?.(las[1])
    player().onCorrect?.(ord)
    expect(h.review.mock.calls).toEqual([
      [{ id: 101, correct: false }],
      [{ id: 102, correct: true }],
    ])
    expect(h.record).not.toHaveBeenCalled()
  })

  it('labels a resumed new question too', async () => {
    h.search = { qid: las[1].qid }
    const { rerender } = render(<Screen />)
    await resume(linkedPlan(), 0)
    rerender(<Screen />)
    expect(screen.getByTestId('repetition-sibling-label')).toBeInTheDocument()
  })

  it('drops a stored new question once its mistake left the due list', async () => {
    h.due = [mistake(102, ord.qid)]
    render(<Screen />)
    expect(await resume(linkedPlan(), 0)).toEqual([ord.qid])
  })

  it('reads a round with nothing left from the cursor on as finished', async () => {
    h.due = [mistake(101, las[0].qid)]
    render(<Screen />)
    expect(await resume(linkedPlan(), 1)).toEqual([])
  })

  it('falls back to the question-keyed routes for a question outside the plan', async () => {
    render(<Screen />)
    await pick()
    player().onCorrect?.(las[2])
    player().onWrong?.(las[2])
    expect(h.resolve).toHaveBeenCalledWith({ questionId: las[2].qid })
    expect(h.record).toHaveBeenCalledWith({ questionId: las[2].qid })
    expect(h.review).not.toHaveBeenCalled()
  })
})

describe('/repetition — resuming a partly answered round after the due list changed', () => {
  // Misses A and B share a trap, so the round repeats them through new
  // questions X (for A) and Y (for B). C is a newer miss with the same trap
  // that is not in the round.
  async function startedRound() {
    h.traps = oneTrap()
    const [a, b] = las.map((q) => q.qid)
    h.due = [mistake(101, a), mistake(102, b)]
    const view = render(<Screen />)
    const { plan, stored } = await startRound(view)
    const [x, y] = plan
    const c = las.map((q) => q.qid).find((qid) => ![a, b, x, y].includes(qid))
    if (!c) throw new Error('the fixture needs a fifth LÄS question with the trap')
    return { view, plan, stored, x, y, b, c }
  }

  it('A left the due list: the round goes on at the paused question, against its own source', async () => {
    const { view, plan, stored, x, y, b } = await startedRound()
    // X answered right moves A out of the due list; the student pauses on Y.
    player().onCorrect?.(question(x))
    h.review.mockReset()
    h.due = [mistake(102, b)]

    remount(view)
    expect(await resume(stored, 1)).toEqual(plan)
    player().onCorrect?.(question(y))
    expect(h.review.mock.calls).toEqual([[{ id: 102, correct: true }]])
  })

  it('a newer due miss with the same trap never takes over a stored link', async () => {
    const { view, plan, stored, x, y, b, c } = await startedRound()
    player().onCorrect?.(question(x))
    h.review.mockReset()
    h.due = [mistake(102, b), mistake(103, c)]

    remount(view)
    expect(await resume(stored, 1)).toEqual(plan)
    player().onCorrect?.(question(y))
    player().onWrong?.(question(y))
    expect(h.review.mock.calls).toEqual([
      [{ id: 102, correct: true }],
      [{ id: 102, correct: false }],
    ])
  })

  it('at the cursor, a question whose source left the due list is skipped and the round goes on', async () => {
    // A left the due list before X was answered (say, it was answered in a
    // drill); the student is still on X when the newer miss C arrives.
    const { view, stored, y, b, c } = await startedRound()
    h.due = [mistake(102, b), mistake(103, c)]

    remount(view)
    expect(await resume(stored, 0)).toEqual([y])
    player().onWrong?.(question(y))
    expect(h.review.mock.calls).toEqual([[{ id: 102, correct: false }]])
  })
})

describe('/repetition — the next round after a round', () => {
  // Round one repeats miss A through a new question X. Then another miss
  // with the same trap is due, and the cached exposure map predates round
  // one — it knows A was seen, not X.
  async function twoRounds({ answerHere, serverKnowsX }: Record<string, boolean>) {
    h.traps = oneTrap()
    const a = las[0].qid
    const cached: ExposureMap = { [a]: { n: 1, last: 10 } }
    let server = cached
    h.exposure = { data: cached, isError: false, refetch: vi.fn(async () => ({ data: server })) }
    h.due = [mistake(101, a)]
    const view = render(<Screen />)
    const [x] = await pick()
    if (answerHere) player().onCorrect?.(question(x))
    if (serverKnowsX) server = { ...cached, [x]: { n: 1, last: 20 } }

    const b = las.map((q) => q.qid).find((qid) => qid !== a && qid !== x)
    if (!b) throw new Error('the fixture needs another LÄS question with the trap')
    h.due = [mistake(102, b)]
    view.rerender(<Screen />)
    const [next] = await pick()
    return { x, next }
  }

  it('reads the exposure map afresh, so the question the last round played is not unseen', async () => {
    // X was answered on another device: only the server map knows it.
    const { x, next } = await twoRounds({ answerHere: false, serverKnowsX: true })
    expect(next).not.toBe(x)
    expect(h.exposure.refetch).toHaveBeenCalledTimes(2)
  })

  it('counts a question answered on this visit as seen before the server map has it', async () => {
    const { x, next } = await twoRounds({ answerHere: true, serverKnowsX: false })
    expect(next).not.toBe(x)
  })
})
