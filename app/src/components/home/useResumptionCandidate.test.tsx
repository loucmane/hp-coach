// Unit tests for resumption-candidate selection + href construction.
// The pure `pickCandidate` is shared by the desktop panel and the phone
// line, so both surfaces inherit these guarantees. End-to-end rendering +
// cross-device behavior is covered by the two-context Playwright drive.

import { describe, expect, it } from 'vitest'

import type { LessonProgress } from '@/api/hooks/useLessonProgress'
import type { ActiveSession } from '@/api/hooks/useSessions'

import { pickCandidate } from './useResumptionCandidate'

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

  it('maps a drill to subject / progress / section-qualified href', () => {
    const c = pickCandidate([drill()], null)
    expect(c?.subject).toBe('ORD-övning')
    expect(c?.progress).toBe('vid fråga 3 av 10')
    expect(c?.href).toBe('/drill?section=ORD&qid=q3')
    expect(c?.device).toBe('phone')
  })

  it('maps repetition (adaptive_review) without a section', () => {
    const c = pickCandidate([drill({ kind: 'adaptive_review', sections: null })], null)
    expect(c?.subject).toBe('Repetition')
    expect(c?.href).toBe('/repetition?qid=q3')
  })

  it('maps a lesson bookmark to a search-param + hash href (never a 404 path)', () => {
    const c = pickCandidate([], lesson())
    expect(c?.subject).toBe('XYZ-lektion')
    expect(c?.progress).toBe('vid XYZ-TRAP-016')
    expect(c?.href).toBe('/lektion?section=XYZ#XYZ-TRAP-016')
  })

  it('falls back to "pågående lektion" when the bookmark has no entry anchor', () => {
    const c = pickCandidate([], lesson({ frameworkId: null }))
    expect(c?.progress).toBe('pågående lektion')
    expect(c?.href).toBe('/lektion?section=XYZ')
  })

  it('surfaces the freshest across kinds', () => {
    const c = pickCandidate(
      [drill({ startedAt: '2026-05-29T07:00:00.000Z' })],
      lesson({ updatedAt: '2026-05-29T10:00:00.000Z' }),
    )
    expect(c?.subject).toBe('XYZ-lektion')
  })

  it('skips sessions with no plan / no resumable question', () => {
    expect(pickCandidate([drill({ plan: null })], null)).toBeNull()
    expect(pickCandidate([drill({ plan: [], currentQuestionId: null })], null)).toBeNull()
  })
})
