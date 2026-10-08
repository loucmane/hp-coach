import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NormeringSitting } from './normering'
import {
  __resetNormeringCacheForTests,
  loadNormeringTable,
  normedEstimate,
  normedScore,
} from './normering'

// A tiny hand-built sitting whose 80q verbal table we can reason about
// exactly. Bands: only what the tests below touch matter; the dense
// `table` array (index = raw 0..80) is the lookup surface.
function makeTable(fill: (raw: number) => number): number[] {
  return Array.from({ length: 81 }, (_, raw) => fill(raw))
}

// Verbal: score = raw/40 capped at 2.0 (so raw 50 -> 1.25, raw 80 -> 2.0).
// This lets us predict the doubled-raw lookup for a 40q pass precisely.
const SITTING: NormeringSitting = {
  exam_id: 'test-2099',
  source_url: 'https://example.test',
  verbal: {
    source_pdf: 'https://example.test/verb.pdf',
    bands: [{ lo: 0, hi: 80, score: 0 }],
    table: makeTable((raw) => Math.min(2, Math.round((raw / 40) * 100) / 100)),
  },
  kvant: {
    source_pdf: 'https://example.test/kvant.pdf',
    bands: [{ lo: 0, hi: 80, score: 0 }],
    table: makeTable((raw) => Math.min(2, Math.round((raw / 40) * 100) / 100)),
  },
}

describe('normedScore (pure)', () => {
  it('table hit on an even doubled raw score reads the table directly', () => {
    // 40q pass, 20 correct -> doubled raw 40 -> table[40] = 1.0.
    const r = normedScore(SITTING, 'verbal', 20, 40)
    expect(r.derived).toBe('official-derived')
    expect(r.score).toBe(1.0)
  })

  it('midpoint-interpolates when the doubled raw is odd', () => {
    // 40q pass, 15/40 wrong... 15 correct -> doubled raw 30 -> even.
    // Use a half-question: presented 39, correct 15 -> ratio 15/39,
    // scaled to /80 -> 30.77 -> we double the RAW (15*2=30) but the
    // odd case comes from an odd doubled value; construct one:
    // correct 15 on presented 40 gives doubled 30 (even). To force odd
    // we interpolate between table[k] and table[k+1] for a fractional
    // doubled raw. Here presented 40, correct 15 is even; instead test
    // the documented interpolation entrypoint: a fractional raw.
    // 17/40 -> doubled 34 (even). Odd example: use correct=15,
    // presented=39 -> scaledRaw = 15/39*80 = 30.769 -> between
    // table[30]=0.75 and table[31]=0.78 (0.775 rounding). Assert it
    // lands strictly between the two neighbours.
    const r = normedScore(SITTING, 'verbal', 15, 39)
    expect(r.derived).toBe('official-derived')
    const lo = SITTING.verbal!.table[30]
    const hi = SITTING.verbal!.table[31]
    expect(r.score).toBeGreaterThanOrEqual(Math.min(lo, hi))
    expect(r.score).toBeLessThanOrEqual(Math.max(lo, hi))
  })

  it('caps a perfect 40q pass at the table max (raw 80 -> 2.0)', () => {
    const r = normedScore(SITTING, 'verbal', 40, 40)
    expect(r.score).toBe(2.0)
    expect(r.derived).toBe('official-derived')
  })

  it('falls back to linear when the sitting table is missing', () => {
    const r = normedScore(null, 'verbal', 30, 40)
    expect(r.derived).toBe('linear')
    // linear: 30/40 * 2 = 1.5
    expect(r.score).toBe(1.5)
  })

  it('falls back to linear when the requested half is absent', () => {
    const partial: NormeringSitting = { ...SITTING, kvant: undefined }
    const r = normedScore(partial, 'kvant', 20, 40)
    expect(r.derived).toBe('linear')
    expect(r.score).toBe(1.0)
  })

  it('returns null score when nothing was presented', () => {
    const r = normedScore(SITTING, 'verbal', 0, 0)
    expect(r.score).toBeNull()
  })
})

describe('loadNormeringTable (fetch loader)', () => {
  afterEach(() => {
    __resetNormeringCacheForTests()
    vi.restoreAllMocks()
  })

  it('fetches and returns the sitting json for an exam id', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/normering/test-2099.json')) {
        return new Response(JSON.stringify(SITTING), { status: 200 })
      }
      return new Response('not found', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const t = await loadNormeringTable('test-2099')
    expect(t?.exam_id).toBe('test-2099')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('returns null (not throw) for a sitting with no table', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 404 })),
    )
    const t = await loadNormeringTable('nope-1900')
    expect(t).toBeNull()
  })

  it('memoises per exam id (second call does not refetch)', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(SITTING), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await loadNormeringTable('test-2099')
    await loadNormeringTable('test-2099')
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

// P5 infold PR 3 (docs/p5-infold-design.md Amendment 1 E): the HP-scale
// conversion reads a pass's raw performance whatever its questions' source,
// and the result says whether it is calibrated.
describe('normedEstimate — the same conversion, flagged when P5 contributes', () => {
  const P5_BASIS = {
    authentic: 20,
    synthetic: 20,
    unknown: 0,
    calibrated: false,
    perSection: {},
  }

  it('converts exactly as normedScore does, whatever the basis', () => {
    for (const [sitting, correct, presented] of [
      [SITTING, 20, 40],
      [SITTING, 15, 39],
      [null, 31, 40],
      [SITTING, 0, 0],
    ] as const) {
      const plain = normedScore(sitting, 'verbal', correct, presented)
      expect(normedEstimate(sitting, 'verbal', correct, presented, P5_BASIS)).toEqual({
        ...plain,
        calibrated: false,
      })
      expect(normedEstimate(sitting, 'verbal', correct, presented, null)).toEqual({
        ...plain,
        calibrated: true,
      })
    }
  })

  it('is calibrated for an authentic-only pass and uncalibrated when a P5 question counted', () => {
    const authenticOnly = {
      authentic: 40,
      synthetic: 0,
      unknown: 0,
      calibrated: true,
      perSection: {},
    }
    expect(normedEstimate(SITTING, 'kvant', 30, 40, authenticOnly).calibrated).toBe(true)
    expect(normedEstimate(SITTING, 'verbal', 30, 40, P5_BASIS).calibrated).toBe(false)
    // A result row from before P5 has no basis: it rests on authentic questions.
    expect(normedEstimate(SITTING, 'verbal', 30, 40, undefined).calibrated).toBe(true)
  })
})
