import { beforeEach, describe, expect, it } from 'vitest'

import { pickMostRecent, usePausedSessionStore } from './pausedSessionStore'

beforeEach(() => {
  usePausedSessionStore.getState().reset()
})

describe('pausedSessionStore', () => {
  it('starts empty', () => {
    const state = usePausedSessionStore.getState()
    expect(state.lesson).toBeNull()
    expect(state.drill).toBeNull()
    expect(state.repetition).toBeNull()
    expect(pickMostRecent(state)).toBeNull()
  })

  it('persists drill snapshot via setDrill', () => {
    usePausedSessionStore.getState().setDrill({
      kind: 'drill',
      section: 'ORD',
      qid: 'host-2013-verb1-ORD-005',
      questionIndex: 4,
      totalQuestions: 12,
      pausedAt: 1000,
    })
    const drill = usePausedSessionStore.getState().drill
    expect(drill?.qid).toBe('host-2013-verb1-ORD-005')
    expect(drill?.section).toBe('ORD')
  })

  it('picks the most recently paused session across slots', () => {
    const s = usePausedSessionStore.getState()
    s.setLesson({
      kind: 'lesson',
      section: 'XYZ',
      step: 3,
      totalSteps: 7,
      pausedAt: 1000,
    })
    s.setDrill({
      kind: 'drill',
      qid: 'q-x',
      questionIndex: 2,
      totalQuestions: 10,
      pausedAt: 3000,
    })
    s.setRepetition({
      kind: 'repetition',
      qid: 'q-y',
      questionIndex: 1,
      totalQuestions: 5,
      pausedAt: 2000,
    })
    const winner = pickMostRecent(usePausedSessionStore.getState())
    expect(winner?.kind).toBe('drill')
    expect(winner?.pausedAt).toBe(3000)
  })

  it('clearDrill removes the drill slot only', () => {
    const s = usePausedSessionStore.getState()
    s.setDrill({
      kind: 'drill',
      qid: 'q-x',
      questionIndex: 2,
      totalQuestions: 10,
      pausedAt: 1000,
    })
    s.setLesson({
      kind: 'lesson',
      section: 'NOG',
      step: 1,
      totalSteps: 4,
      pausedAt: 500,
    })
    s.clearDrill()
    expect(usePausedSessionStore.getState().drill).toBeNull()
    expect(usePausedSessionStore.getState().lesson?.section).toBe('NOG')
  })

  it('reset wipes every slot', () => {
    const s = usePausedSessionStore.getState()
    s.setLesson({
      kind: 'lesson',
      section: 'LÄS',
      step: 2,
      totalSteps: 6,
      pausedAt: 1000,
    })
    s.setDrill({
      kind: 'drill',
      qid: 'q',
      questionIndex: 1,
      totalQuestions: 5,
      pausedAt: 2000,
    })
    s.reset()
    const state = usePausedSessionStore.getState()
    expect(state.lesson).toBeNull()
    expect(state.drill).toBeNull()
    expect(state.repetition).toBeNull()
  })
})
