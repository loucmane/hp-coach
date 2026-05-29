// Unit tests for the resumption-panel candidate selection + formatting.
// We test the pure `pickCandidate` over server-shaped rows rather than
// rendering (the panel itself is exercised by the cross-device e2e drive).

import { describe, expect, it } from 'vitest'
import type { LessonProgress } from '@/api/hooks/useLessonProgress'
import type { ActiveSession } from '@/api/hooks/useSessions'

import { pickCandidate } from './ResumptionPanel'

function drill(over: Partial<ActiveSession> = {}): ActiveSession {
  return {
    id: 1,
    userId: 1,
    kind: 'drill',
    sections: 'ORD',
    position: 2,
    currentQuestionId: 'q3',
    plan: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'],
    device: 'phone',
    startedAt: '2026-05-29T09:00:00.000Z',
    endedAt: null,
    ...over,
  }
}

function lesson(over: Partial<LessonProgress> = {}): LessonProgress {
  return {
    id: 1,
    userId: 1,
    section: 'XYZ',
    frameworkId: 'XYZ-TRAP-016',
    device: 'desktop',
    updatedAt: '2026-05-29T08:00:00.000Z',
    ...over,
  }
}

describe('pickCandidate', () => {
  it('returns null when nothing is resumable', () => {
    expect(pickCandidate([], null)).toBeNull()
  })

  it('maps a drill session to headline / progress / section-qualified href', () => {
    const c = pickCandidate([drill()], null)
    expect(c?.headline).toBe('ORD-övning · pausad')
    expect(c?.marginalia).toBe('vid fråga 3 av 10')
    expect(c?.href).toBe('/drill?section=ORD&qid=q3')
    expect(c?.device).toBe('phone')
  })

  it('maps repetition (adaptive_review) without a section', () => {
    const c = pickCandidate([drill({ kind: 'adaptive_review', sections: null })], null)
    expect(c?.headline).toBe('Repetition · pausad')
    expect(c?.href).toBe('/repetition?qid=q3')
  })

  it('maps a lesson bookmark to a search-param + hash href (never a 404 path)', () => {
    const c = pickCandidate([], lesson())
    expect(c?.headline).toBe('XYZ-lektion · pausad')
    expect(c?.marginalia).toBe('vid XYZ-TRAP-016')
    expect(c?.href).toBe('/lektion?section=XYZ#XYZ-TRAP-016')
  })

  it('falls back to "pågående lektion" when the bookmark has no entry anchor', () => {
    const c = pickCandidate([], lesson({ frameworkId: null }))
    expect(c?.marginalia).toBe('pågående lektion')
    expect(c?.href).toBe('/lektion?section=XYZ')
  })

  it('surfaces the freshest across kinds', () => {
    // lesson updated later than the drill started → lesson wins
    const c = pickCandidate(
      [drill({ startedAt: '2026-05-29T07:00:00.000Z' })],
      lesson({ updatedAt: '2026-05-29T10:00:00.000Z' }),
    )
    expect(c?.headline).toBe('XYZ-lektion · pausad')
  })

  it('skips sessions with no plan / no resumable question', () => {
    expect(pickCandidate([drill({ plan: null })], null)).toBeNull()
    expect(pickCandidate([drill({ plan: [], currentQuestionId: null })], null)).toBeNull()
  })
})
