// /repetition — Samma fälla, ny fråga (hpf-bz6f.2). The route turns the due
// queue into a round where a trapped miss is repeated through a NEW
// question with the same trap. Pins the wiring around SessionPlayer
// (stubbed here; its own lifecycle has its own tests):
//   - every answer on a planned item reviews THE MISTAKE IT REPEATS by row
//     id — a wrong answer on a new question lapses the original mistake,
//     it never records a mistake for the new question;
//   - resuming a stored plan keeps its new questions mapped to their source
//     mistakes (and still drops the ones whose mistake left the due list);
//   - a new question carries the quiet "Samma fälla, ny fråga" label.
//
// Real bank + real replay logic; the trap index is a small synthetic one.

import { act, render, screen } from '@testing-library/react'
import type { FunctionComponent } from 'react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Mistake } from '@/api/hooks/useMistakes'
import type { ExposureMap } from '@/api/hooks/useMockResults'
import type { SessionPlayerProps } from '@/components/session/SessionPlayer'
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
  review: vi.fn(),
  record: vi.fn(),
  resolve: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => h.search }),
  useNavigate: () => vi.fn(),
  Link: () => null,
}))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: h.due }),
  useRecordMistake: () => ({ mutate: h.record }),
  useResolveMistakeByQuestion: () => ({ mutate: h.resolve }),
  useReviewMistake: () => ({ mutate: h.review }),
}))
vi.mock('@/api/hooks/useMockResults', () => ({
  useExposure: () => h.exposure,
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

beforeAll(async () => {
  const bank = await loadBank()
  las = bank
    .filter((q) => q.section === 'LÄS' && q.parsing_status === 'complete' && q.options)
    .slice(0, 3)
  const firstOrd = bank.find((q) => q.section === 'ORD' && q.parsing_status === 'complete')
  if (!firstOrd || las.length < 3) throw new Error('bank fixture is missing LÄS/ORD questions')
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

async function resume(qids: string[], position?: number): Promise<string[]> {
  let questions: Question[] = []
  await act(async () => {
    questions = await (player().resolvePlan?.(qids, position) ?? Promise.resolve([]))
  })
  return questions.map((q) => q.qid)
}

beforeEach(() => {
  h.search = {}
  h.props = null
  h.exposure = { data: {}, isError: false, refetch: vi.fn() }
  h.traps = { [las[0].qid]: 'LAS-TYPE-T', [las[1].qid]: 'LAS-TYPE-T' }
  h.due = [mistake(101, las[0].qid), mistake(102, ord.qid)]
  for (const fn of [h.review, h.record, h.resolve]) fn.mockReset()
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

describe('/repetition — resuming a stored plan', () => {
  it('keeps a stored new question, mapped to the mistake it repeats', async () => {
    render(<Screen />)
    expect(await resume([las[1].qid, ord.qid], 0)).toEqual([las[1].qid, ord.qid])
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
    await resume([las[1].qid, ord.qid], 0)
    rerender(<Screen />)
    expect(screen.getByTestId('repetition-sibling-label')).toBeInTheDocument()
  })

  it('drops a stored new question once its mistake left the due list', async () => {
    h.due = [mistake(102, ord.qid)]
    render(<Screen />)
    expect(await resume([las[1].qid, ord.qid], 0)).toEqual([ord.qid])
  })

  it('reads a cursor past the end of the pruned plan as a finished round', async () => {
    h.due = [mistake(102, ord.qid)]
    render(<Screen />)
    expect(await resume([las[1].qid, ord.qid], 1)).toEqual([])
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
