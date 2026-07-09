// MockRunner — permanent graded={false} rendering, grid navigation,
// keyboard picking, settle/abandon flows.
//
// The load-bearing assertion is the CORRECTNESS LEAK audit: a mock must
// never reveal rätt/fel anywhere, on any pick, because real exam
// conditions have zero per-question feedback. DrillQuestion/BoksidanDesk
// were audited (their pre-grade paths never touch `question.answer` for
// styling — PedagogyPanel itself returns null when `!graded`) — this
// test proves it end-to-end through MockRunner specifically, so a future
// change to either shared component that reintroduces a leak fails here.

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import { createMockSheet, mockSheetReducer } from '@/lib/mockSheet'
import { MockRunner, type MockRunnerSession } from './MockRunner'

vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
}))

const submitAttemptMutate = vi.fn()
vi.mock('@/api/hooks/useAttempts', () => ({
  useSubmitAttempt: () => ({ mutate: submitAttemptMutate }),
}))

const recordMistakeMutate = vi.fn()
vi.mock('@/api/hooks/useMistakes', () => ({
  useRecordMistake: () => ({ mutate: recordMistakeMutate }),
}))

const updateSessionMutate = vi.fn()
vi.mock('@/api/hooks/useSessions', () => ({
  useUpdateSession: () => ({ mutate: updateSessionMutate }),
}))

const submitMockResultMutate = vi.fn(
  (_input: unknown, opts?: { onSuccess?: (r: unknown) => void }) => {
    opts?.onSuccess?.({ id: 99 })
  },
)
vi.mock('@/api/hooks/useMockResults', async () => {
  const actual = await vi.importActual<typeof import('@/api/hooks/useMockResults')>(
    '@/api/hooks/useMockResults',
  )
  return {
    ...actual,
    useSubmitMockResult: () => ({ mutate: submitMockResultMutate }),
  }
})

function makeQuestion(
  overrides: Partial<Question> & Pick<Question, 'qid' | 'section' | 'number'>,
): Question {
  return {
    exam_id: 'var-2024',
    provpass: 'verb1',
    prompt: overrides.prompt ?? `prompt ${overrides.qid}`,
    options: [
      { letter: 'A', text: 'alpha' },
      { letter: 'B', text: 'beta' },
    ],
    answer: 'A',
    context: null,
    figure: null,
    parsing_status: 'complete',
    ...overrides,
  }
}

const PLAN: Question[] = [
  makeQuestion({ qid: 'q1', section: 'ORD', number: 1, answer: 'A' }),
  makeQuestion({ qid: 'q2', section: 'ORD', number: 2, answer: 'B' }),
  makeQuestion({ qid: 'q3', section: 'LÄS', number: 3, answer: 'A' }),
]

const SESSION: MockRunnerSession = {
  id: 42,
  startedAt: new Date(),
  mode: 'synthetic',
  half: 'verbal',
}

function renderRunner(overrides: Partial<ComponentProps<typeof MockRunner>> = {}) {
  const onSettled = vi.fn()
  const onVoid = vi.fn()
  const utils = render(
    <MockRunner
      plan={PLAN}
      session={SESSION}
      seenBefore={0}
      onSettled={onSettled}
      onVoid={onVoid}
      {...overrides}
    />,
  )
  return { ...utils, onSettled, onVoid }
}

beforeEach(() => {
  submitAttemptMutate.mockClear()
  recordMistakeMutate.mockClear()
  updateSessionMutate.mockClear()
  submitMockResultMutate.mockClear()
})

describe('MockRunner — no correctness leak', () => {
  it('never renders rätt/fel verdict text after a pick', async () => {
    const user = userEvent.setup()
    renderRunner()
    const optionA = await screen.findByTestId('option-A')
    await user.click(optionA)
    expect(screen.queryByText('Rätt svar')).not.toBeInTheDocument()
    expect(screen.queryByText('Ditt svar')).not.toBeInTheDocument()
  })

  it('option rows never carry a correct/incorrect data-state after a pick', async () => {
    const user = userEvent.setup()
    renderRunner()
    const optionA = await screen.findByTestId('option-A')
    await user.click(optionA)
    expect(screen.getByTestId('option-A')).toHaveAttribute('data-state', 'picked')
    expect(screen.getByTestId('option-B')).toHaveAttribute('data-state', 'idle')
  })

  it('does not render the pedagogy panel after a pick', async () => {
    const user = userEvent.setup()
    renderRunner()
    const optionA = await screen.findByTestId('option-A')
    await user.click(optionA)
    // PedagogyPanel returns null unless graded=true; assert none of its
    // rail sections (UTFALL / etc) mounted.
    expect(screen.queryByText(/UTFALL/)).not.toBeInTheDocument()
  })

  it('options stay clickable (not disabled) after a pick — real exam allows changing the answer', async () => {
    const user = userEvent.setup()
    renderRunner()
    const optionA = await screen.findByTestId('option-A')
    await user.click(optionA)
    expect(screen.getByTestId('option-B')).not.toBeDisabled()
  })
})

describe('MockRunner — grid navigation', () => {
  it('renders one cell per plan question, section boundary labels', async () => {
    renderRunner()
    await screen.findByTestId('mock-grid')
    for (let i = 1; i <= PLAN.length; i++) {
      expect(screen.getByTestId(`mock-cell-${i}`)).toBeInTheDocument()
    }
    expect(screen.getByTestId('mock-boundary-ORD')).toHaveTextContent('1–2')
    expect(screen.getByTestId('mock-boundary-LÄS')).toHaveTextContent('3–3')
  })

  it('marks the current cell and answered cells', async () => {
    const user = userEvent.setup()
    renderRunner()
    expect(screen.getByTestId('mock-cell-1')).toHaveAttribute('data-current', 'true')
    const optionA = await screen.findByTestId('option-A')
    await user.click(optionA)
    expect(screen.getByTestId('mock-cell-1')).toHaveAttribute('data-answered', 'true')
    expect(screen.getByTestId('mock-cell-2')).toHaveAttribute('data-answered', 'false')
  })

  it('free-jumps to any question via the grid', async () => {
    const user = userEvent.setup()
    renderRunner()
    await user.click(screen.getByTestId('mock-cell-3'))
    expect(screen.getByTestId('mock-cell-3')).toHaveAttribute('data-current', 'true')
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('prompt q3')
  })
})

describe('MockRunner — keyboard', () => {
  it('a–e picks the option', async () => {
    const user = userEvent.setup()
    renderRunner()
    await screen.findByTestId('option-A')
    await user.keyboard('b')
    expect(screen.getByTestId('option-B')).toHaveAttribute('data-state', 'picked')
  })

  it('ArrowRight/ArrowLeft navigate', async () => {
    const user = userEvent.setup()
    renderRunner()
    await screen.findByTestId('drill-prompt')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('prompt q2')
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('prompt q1')
  })
})

describe('MockRunner — settle', () => {
  it('submit posts the mock result and calls onSettled', async () => {
    vi.stubGlobal('confirm', () => true)
    const user = userEvent.setup()
    const { onSettled } = renderRunner()
    await user.click(await screen.findByTestId('option-A'))
    await user.click(screen.getByTestId('mock-submit'))
    await waitFor(() => expect(submitMockResultMutate).toHaveBeenCalled())
    expect(updateSessionMutate).toHaveBeenCalledWith({ id: 42, patch: { end: true } })
    expect(onSettled).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('records mistakes only for answered-and-wrong questions, none for blanks', async () => {
    vi.stubGlobal('confirm', () => true)
    const user = userEvent.setup()
    renderRunner()
    // q1 correct (A), q2 wrong (A picked, answer is B), q3 left blank.
    await user.click(await screen.findByTestId('option-A'))
    await user.click(screen.getByTestId('mock-cell-2'))
    await user.click(await screen.findByTestId('option-A'))
    await user.click(screen.getByTestId('mock-submit'))
    await waitFor(() => expect(submitMockResultMutate).toHaveBeenCalled())
    expect(recordMistakeMutate).toHaveBeenCalledTimes(1)
    expect(recordMistakeMutate).toHaveBeenCalledWith({ questionId: 'q2' })
    vi.unstubAllGlobals()
  })

  it('cancelling the submit confirm does not settle', async () => {
    vi.stubGlobal('confirm', () => false)
    const user = userEvent.setup()
    const { onSettled } = renderRunner()
    await user.click(screen.getByTestId('mock-submit'))
    expect(submitMockResultMutate).not.toHaveBeenCalled()
    expect(onSettled).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('MockRunner — abandon', () => {
  it('abandon ends the session, records wrong-so-far mistakes, calls onVoid, and never POSTs a result', async () => {
    vi.stubGlobal('confirm', () => true)
    const user = userEvent.setup()
    const { onVoid } = renderRunner()
    // q1 wrong (B picked, answer A).
    await user.click(await screen.findByTestId('option-B'))
    await user.click(screen.getByTestId('mock-abandon'))
    expect(updateSessionMutate).toHaveBeenCalledWith({ id: 42, patch: { end: true } })
    expect(recordMistakeMutate).toHaveBeenCalledWith({ questionId: 'q1' })
    expect(submitMockResultMutate).not.toHaveBeenCalled()
    expect(onVoid).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('cancelling the abandon confirm keeps the pass alive', async () => {
    vi.stubGlobal('confirm', () => false)
    const user = userEvent.setup()
    const { onVoid } = renderRunner()
    await user.click(screen.getByTestId('mock-abandon'))
    expect(updateSessionMutate).not.toHaveBeenCalled()
    expect(onVoid).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('MockRunner — reload-adopt props (initialSheet/initialIndex/durationMsOverride)', () => {
  it('renders the grid pre-filled from initialSheet instead of starting blank', async () => {
    const initialSheet = createMockSheet()
    const withPick = mockSheetReducer(initialSheet, {
      type: 'pick',
      qid: 'q1',
      letter: 'A',
      now: 1000,
    })
    renderRunner({ initialSheet: withPick })
    await screen.findByTestId('mock-grid')
    expect(screen.getByTestId('mock-cell-1')).toHaveAttribute('data-answered', 'true')
    expect(screen.getByTestId('mock-cell-2')).toHaveAttribute('data-answered', 'false')
  })

  it('lands on initialIndex instead of question 0', async () => {
    renderRunner({ initialIndex: 2 })
    expect(await screen.findByTestId('drill-prompt')).toHaveTextContent('prompt q3')
    expect(screen.getByTestId('mock-cell-3')).toHaveAttribute('data-current', 'true')
  })

  it('clamps an out-of-range initialIndex into the plan', async () => {
    renderRunner({ initialIndex: 999 })
    expect(await screen.findByTestId('drill-prompt')).toHaveTextContent('prompt q3')
  })

  it('durationMsOverride shortens the countdown instead of the default 55 minutes', async () => {
    renderRunner({ durationMsOverride: 3 * 60_000 })
    const clock = await screen.findByTestId('mock-countdown')
    // Just-mounted remaining time should read close to 03:00, never 55:00.
    expect(clock.textContent).toMatch(/^0[0-3]:/)
  })
})
