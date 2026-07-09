import { describe, expect, it } from 'vitest'

import type { ActiveSession } from '@/api/hooks/useSessions'

import { canAdoptActiveSession } from './canAdoptSession'

function session(over: Partial<ActiveSession> = {}): ActiveSession {
  return {
    id: 1,
    userId: 1,
    kind: 'drill',
    sections: 'XYZ',
    position: 0,
    currentQuestionId: null,
    plan: ['host-2016-kvant1-XYZ-001', 'host-2016-kvant1-XYZ-002'],
    device: null,
    startedAt: null,
    endedAt: null,
    ...over,
  }
}

describe('canAdoptActiveSession', () => {
  it('does NOT adopt a session whose section differs from the requested one', () => {
    // The reported bug: a leftover active ORD drill must not be resumed when
    // the user opens a drill for XYZ — clicking the XYZ daily-plan item loaded
    // host-2016-verb1-ORD-008 (an ORD question) because the adopt path ignored
    // the requested section.
    const ordSession = session({ sections: 'ORD', plan: ['host-2016-verb1-ORD-008'] })
    expect(canAdoptActiveSession(ordSession, 'XYZ', false)).toBe(false)
  })

  it('adopts a session whose section matches the request (legit cross-device resume)', () => {
    expect(canAdoptActiveSession(session({ sections: 'XYZ' }), 'XYZ', false)).toBe(true)
  })

  it('does not adopt once the prior resume was found stale (take a fresh pick)', () => {
    expect(canAdoptActiveSession(session({ sections: 'XYZ' }), 'XYZ', true)).toBe(false)
  })

  it('does NOT re-adopt a session this instance just ended (rapid re-drill race)', () => {
    // "öva igen" calls begin() synchronously; the end:true PATCH's cache
    // eviction hasn't landed, so activeOfKind.data still holds the finished
    // session. Without the locallyEnded guard it would resume the corpse at
    // its last answered question instead of picking a fresh batch.
    const finished = session({ sections: 'XYZ' })
    expect(canAdoptActiveSession(finished, 'XYZ', false, false)).toBe(true) // baseline: adoptable
    expect(canAdoptActiveSession(finished, 'XYZ', false, true)).toBe(false) // ended → fresh pick
  })

  it('does NOT adopt a session that already carries endedAt (cross-mount rapid re-drill)', () => {
    // Task #166 Symptom B: the `locallyEnded` ref only knows about ends THIS
    // component instance issued. After finishing a drill, navigating away and
    // re-drilling the SAME section remounts SessionPlayer with an empty ref,
    // so `locallyEnded` is false — yet the just-finished session can still sit
    // in the active-sessions cache (its end:true PATCH's onSuccess eviction
    // raced the refetch, or a stale write-through kept it). Sections match, so
    // the section guard passes and begin() would adopt the corpse and land on
    // its result screen. A row that carries endedAt is finished by definition
    // and must never be adopted, regardless of the instance ref.
    const finished = session({ sections: 'XYZ', endedAt: '2026-07-08T12:00:00.000Z' })
    expect(canAdoptActiveSession(finished, 'XYZ', false, false)).toBe(false)
    // …and the same holds even if the caller never got a chance to set the ref.
    expect(canAdoptActiveSession(finished, 'XYZ', false)).toBe(false)
  })

  it('does not adopt when there is no active session', () => {
    expect(canAdoptActiveSession(null, 'XYZ', false)).toBe(false)
    expect(canAdoptActiveSession(undefined, 'XYZ', false)).toBe(false)
  })

  it('does not adopt a session with an empty or absent plan', () => {
    expect(canAdoptActiveSession(session({ plan: [] }), 'XYZ', false)).toBe(false)
    expect(canAdoptActiveSession(session({ plan: null }), 'XYZ', false)).toBe(false)
  })

  it('still adopts the stable-section surfaces (repetition "ORD", diagnostik "diagnostic")', () => {
    // Regression guard: the section check must not break the surfaces that pass
    // a constant `sections` literal — they are separate session kinds anyway.
    expect(
      canAdoptActiveSession(session({ kind: 'adaptive_review', sections: 'ORD' }), 'ORD', false),
    ).toBe(true)
    expect(
      canAdoptActiveSession(
        session({ kind: 'mock_diagnostic', sections: 'diagnostic' }),
        'diagnostic',
        false,
      ),
    ).toBe(true)
  })
})
