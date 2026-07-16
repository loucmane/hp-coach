// LandingBakeoffR3.logic — beat-model tests for the landing v3 bake-off
// (P3S "Scenen" / P3B "Bläddran"). TDD: these encode the owner-ratified
// choreography decisions before the components exist.
//
//   - Scenen plays din-fälla-först: on a wrong pick the visitor's own
//     distractor autopsy leads (full, din-gissning tagged), remaining
//     fällor follow compressed, in canonical order.
//   - Bläddran plays product-verbatim order: UTFALL → steg → ALL fällor
//     equally (canonical order, full), picked one tagged in place.
//   - Both start at UTFALL and end at KVITTO; all 4 fällor always play.

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  buildBeats,
  closeTakeover,
  DISTRACTOR_LETTERS,
  useTakeoverHistory,
  VEDERHAFTIG,
} from './LandingBakeoffR3.logic'

describe('buildBeats — Scenen (din-fälla-först)', () => {
  it('wrong pick d: utfall → 3 steg → din fälla d (full) → a,c,e compressed → kvitto', () => {
    const beats = buildBeats({ mode: 'scenen', picked: 'd' })
    expect(beats.map((b) => b.kind)).toEqual([
      'utfall',
      'steg',
      'steg',
      'steg',
      'falla',
      'falla',
      'falla',
      'falla',
      'kvitto',
    ])
    const fallor = beats.filter((b) => b.kind === 'falla')
    expect(fallor.map((b) => b.letter)).toEqual(['d', 'a', 'c', 'e'])
    expect(fallor[0]).toMatchObject({ dinGissning: true, compressed: false })
    expect(fallor.slice(1).every((b) => b.compressed && !b.dinGissning)).toBe(true)
  })

  it('wrong pick a leads with a; remaining keep canonical order c,d,e', () => {
    const fallor = buildBeats({ mode: 'scenen', picked: 'a' }).filter((b) => b.kind === 'falla')
    expect(fallor.map((b) => b.letter)).toEqual(['a', 'c', 'd', 'e'])
    expect(fallor[0].dinGissning).toBe(true)
  })

  it('correct pick: genomgång still plays, exemplar fälla d leads, no din-gissning tag', () => {
    const beats = buildBeats({ mode: 'scenen', picked: 'b' })
    expect(beats[0]).toMatchObject({ kind: 'utfall', correct: true })
    const fallor = beats.filter((b) => b.kind === 'falla')
    expect(fallor.map((b) => b.letter)).toEqual(['d', 'a', 'c', 'e'])
    expect(fallor.every((b) => b.dinGissning === false)).toBe(true)
    expect(fallor[0].compressed).toBe(false)
  })

  it('steg beats carry indices 0..2 in order', () => {
    const steg = buildBeats({ mode: 'scenen', picked: 'e' }).filter((b) => b.kind === 'steg')
    expect(steg.map((b) => b.stegIndex)).toEqual([0, 1, 2])
  })
})

describe('buildBeats — Bläddran (product-verbatim order)', () => {
  it('always canonical fälla order a,c,d,e — full, never compressed', () => {
    for (const picked of ['a', 'c', 'd', 'e', 'b'] as const) {
      const beats = buildBeats({ mode: 'bladdran', picked })
      const fallor = beats.filter((b) => b.kind === 'falla')
      expect(fallor.map((b) => b.letter)).toEqual(['a', 'c', 'd', 'e'])
      expect(fallor.every((b) => !b.compressed)).toBe(true)
    }
  })

  it('the picked distractor is tagged din-gissning in place', () => {
    const fallor = buildBeats({ mode: 'bladdran', picked: 'c' }).filter((b) => b.kind === 'falla')
    expect(fallor.find((b) => b.letter === 'c')?.dinGissning).toBe(true)
    expect(fallor.filter((b) => b.dinGissning)).toHaveLength(1)
  })

  it('starts at UTFALL, ends at KVITTO, 9 beats total', () => {
    const beats = buildBeats({ mode: 'bladdran', picked: 'b' })
    expect(beats).toHaveLength(9)
    expect(beats[0].kind).toBe('utfall')
    expect(beats.at(-1)?.kind).toBe('kvitto')
  })
})

describe('content invariants', () => {
  it('all four distractor letters have autopsy content', () => {
    expect(DISTRACTOR_LETTERS).toEqual(['a', 'c', 'd', 'e'])
    for (const l of DISTRACTOR_LETTERS) {
      const d = VEDERHAFTIG.distractors[l]
      expect(d.whyTempting.length).toBeGreaterThan(20)
      expect(d.whyWrong.length).toBeGreaterThan(20)
    }
    expect(VEDERHAFTIG.correct).toBe('b')
    expect(VEDERHAFTIG.steps).toHaveLength(3)
  })
})

describe('useTakeoverHistory — P3B back-button contract', () => {
  it('pushes one marker entry on open; browser back (popstate past it) closes', () => {
    const before = window.history.length
    const onClose = vi.fn()
    renderHook(({ o }) => useTakeoverHistory(o, onClose), { initialProps: { o: true } })
    expect(window.history.length).toBe(before + 1)
    expect(window.history.state?.hpcLandingTakeover).toBe(true)

    // A pop that still lands on a marker entry is bookkeeping (StrictMode
    // double-mount) — it must NOT close the takeover.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { hpcLandingTakeover: true } }))
    })
    expect(onClose).not.toHaveBeenCalled()

    // The real back: pop past the marker → close.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not push a second entry when the marker is already current (StrictMode remount)', () => {
    const first = renderHook(({ o }) => useTakeoverHistory(o, () => {}), {
      initialProps: { o: true },
    })
    const after = window.history.length
    // Remount while the marker entry is still current — no extra push.
    first.unmount()
    renderHook(({ o }) => useTakeoverHistory(o, () => {}), { initialProps: { o: true } })
    expect(window.history.length).toBe(after)
  })

  it('closeTakeover consumes the pushed entry via history.back → popstate → onClose', async () => {
    const onClose = vi.fn()
    renderHook(({ o }) => useTakeoverHistory(o, onClose), { initialProps: { o: true } })
    act(() => {
      closeTakeover()
    })
    // jsdom traverses asynchronously; wait for the popstate to land.
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(window.history.state?.hpcLandingTakeover).toBeFalsy()
  })
})
