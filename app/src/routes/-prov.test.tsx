// prov.tsx — Provpass picker + instructions interstitial (PR 3) plus the
// PR 4 integration helpers. Picker/Instructions tests target the exported
// screens directly (no router harness needed — they take plain props/
// callbacks, same idiom as DrillResult/DiagnosticReport tests). The PR 4
// session-metadata/search/duration helpers are plain functions, tested
// directly for the same reason lib/mock.ts's functions are — ProvRoute
// itself (Route.useSearch/useNavigate) isn't mounted anywhere in this
// codebase's test suite.

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { PassOption } from '@/lib/mock'
import {
  countSeenBefore,
  decodeMockSections,
  encodeMockSections,
  Picker,
  resolveDurationMs,
  validateSearch,
} from './prov'

function pass(overrides: Partial<PassOption> = {}): PassOption {
  return {
    examId: 'var-2018-1',
    provpass: 'verb1',
    half: 'verbal',
    presented: 40,
    seenBefore: 3,
    totalExposure: 5,
    ...overrides,
  }
}

describe('Picker', () => {
  it('renders the mode and half toggles with the given value active', () => {
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('prov-mode-authentic')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('prov-mode-synthetic')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('prov-half-verbal')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('prov-half-kvant')).toHaveAttribute('aria-pressed', 'false')
  })

  it('fires onModeChange / onHalfChange when a toggle word is clicked', () => {
    const onModeChange = vi.fn()
    const onHalfChange = vi.fn()
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={onModeChange}
        onHalfChange={onHalfChange}
        passes={[]}
        onStart={() => {}}
      />,
    )
    fireEvent.click(screen.getByTestId('prov-mode-synthetic'))
    expect(onModeChange).toHaveBeenCalledWith('synthetic')
    fireEvent.click(screen.getByTestId('prov-half-kvant'))
    expect(onHalfChange).toHaveBeenCalledWith('kvant')
  })

  it('shows the empty state in authentic mode when no passes match the half', () => {
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('prov-authentic-empty')).toBeInTheDocument()
  })

  // ── Kallelse-lead (both breakpoints) ─────────────────────────────────

  it('leads with the least-seen pass as the Kallelse, addressed to the candidate, in canonical Swedish', () => {
    const passes = [
      pass({ examId: 'host-2025', provpass: 'verb2', seenBefore: 1, totalExposure: 1 }),
      pass({ examId: 'var-2019', provpass: 'verb1', seenBefore: 8, totalExposure: 12 }),
    ]
    render(
      <Picker
        mode="authentic"
        half="verbal"
        candidateName="Lookman Benali"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={passes}
        onStart={() => {}}
      />,
    )
    const kallelse = screen.getByTestId('prov-kallelse')
    // Suggestion consistency: the Kallelse is passes[0] filtered to half —
    // the least-exposed pass in listAuthenticPasses ordering — named in
    // canonical Swedish (no raw exam id leak).
    expect(kallelse).toHaveTextContent('Hösten 2025')
    expect(kallelse).toHaveTextContent('Provpass 2')
    expect(kallelse).not.toHaveTextContent('host-2025')
    expect(screen.getByTestId('prov-kallelse-candidate')).toHaveTextContent('Lookman Benali')
  })

  it('drops the addressee line when no candidate name is available', () => {
    render(
      <Picker
        mode="authentic"
        half="verbal"
        candidateName={null}
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[pass()]}
        onStart={() => {}}
      />,
    )
    expect(screen.queryByTestId('prov-kallelse-candidate')).not.toBeInTheDocument()
  })

  it('starting from the Kallelse fires onStart with the suggested (least-seen) pass', () => {
    const onStart = vi.fn()
    const suggested = pass({ examId: 'host-2025', provpass: 'verb2', seenBefore: 1 })
    const other = pass({ examId: 'var-2019', provpass: 'verb1', seenBefore: 8 })
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[suggested, other]}
        onStart={onStart}
      />,
    )
    fireEvent.click(screen.getByTestId('prov-kallelse-start'))
    expect(onStart).toHaveBeenCalledWith(suggested)
  })

  // ── Mobile register: one tap target per sitting, auto-picks least-seen ─

  it('phone lists sittings (not passes) filtered to the half, newest first, in canonical Swedish', () => {
    const passes = [
      pass({ examId: 'host-2025', provpass: 'verb1', seenBefore: 1 }),
      pass({ examId: 'var-2019', provpass: 'verb1', seenBefore: 8 }),
      pass({ examId: 'var-2020', provpass: 'kvant1', half: 'kvant', seenBefore: 0 }),
    ]
    render(
      <Picker
        mode="authentic"
        half="verbal"
        forceViewport="phone"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={passes}
        onStart={() => {}}
      />,
    )
    // One row per verbal SITTING — no "Provpass N" menu on mobile.
    expect(screen.getByTestId('prov-sitting-host-2025')).toBeInTheDocument()
    expect(screen.getByTestId('prov-sitting-var-2019')).toBeInTheDocument()
    expect(screen.queryByTestId('prov-sitting-var-2020')).not.toBeInTheDocument()
    expect(screen.getByTestId('prov-sitting-host-2025')).toHaveTextContent('Hösten 2025')
  })

  it('phone: tapping a sitting auto-picks its least-seen pass and fires onStart with it', () => {
    const onStart = vi.fn()
    // Same sitting, both passes present; listAuthenticPasses ordering puts
    // the least-exposed pass first in the array → auto-pick is verb2.
    const leastSeen = pass({
      examId: 'var-2019',
      provpass: 'verb2',
      seenBefore: 1,
      totalExposure: 1,
    })
    const moreSeen = pass({
      examId: 'var-2019',
      provpass: 'verb1',
      seenBefore: 9,
      totalExposure: 14,
    })
    render(
      <Picker
        mode="authentic"
        half="verbal"
        forceViewport="phone"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[leastSeen, moreSeen]}
        onStart={onStart}
      />,
    )
    fireEvent.click(screen.getByTestId('prov-sitting-var-2019'))
    expect(onStart).toHaveBeenCalledWith(leastSeen)
  })

  it('phone: shows the red completeness flag only when a pass is short', () => {
    const passes = [
      pass({ examId: 'var-2018-1', provpass: 'verb1', presented: 39 }),
      pass({ examId: 'var-2019', provpass: 'verb1', presented: 40 }),
    ]
    render(
      <Picker
        mode="authentic"
        half="verbal"
        forceViewport="phone"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={passes}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('prov-sitting-var-2018-1')).toHaveTextContent('39/40 frågor')
    expect(screen.getByTestId('prov-sitting-var-2019')).not.toHaveTextContent('40/40 frågor')
  })

  // ── Desktop register: explicit sitting × pass matrix ─────────────────

  it('desktop renders per-pass cells, the suggested cell marked, and starts that exact pass', () => {
    const onStart = vi.fn()
    const suggested = pass({
      examId: 'var-2019',
      provpass: 'verb2',
      seenBefore: 1,
      totalExposure: 1,
    })
    const other = pass({ examId: 'var-2019', provpass: 'verb1', seenBefore: 9, totalExposure: 14 })
    render(
      <Picker
        mode="authentic"
        half="verbal"
        forceViewport="studio"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[suggested, other]}
        onStart={onStart}
      />,
    )
    // Both passes are explicit cells on desktop.
    expect(screen.getByTestId('prov-pass-var-2019-verb1')).toBeInTheDocument()
    const suggestedCell = screen.getByTestId('prov-pass-var-2019-verb2')
    expect(suggestedCell.querySelector('[data-testid="prov-meta-suggested"]')).toBeInTheDocument()
    // Sticky MINST SETT strip names the suggested pass.
    expect(screen.getByTestId('prov-minst-sett')).toHaveTextContent('Provpass 2')
    // Clicking the other cell starts THAT pass, not the suggested one.
    fireEvent.click(screen.getByTestId('prov-pass-var-2019-verb1'))
    expect(onStart).toHaveBeenCalledWith(other)
  })

  it('renders the synthetic CTA card with the quota line and indikativ note', () => {
    render(
      <Picker
        mode="synthetic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={() => {}}
      />,
    )
    const cta = screen.getByTestId('prov-synthetic-cta')
    expect(cta).toHaveTextContent('40 frågor · ORD 10 · LÄS 10 · MEK 10 · ELF 10')
    expect(screen.getByTestId('prov-synthetic-note')).toHaveTextContent(
      'Indikativt resultat — inte ett riktigt pass.',
    )
  })

  it('renders the kvant quota line when half is kvant', () => {
    render(
      <Picker
        mode="synthetic"
        half="kvant"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('prov-synthetic-cta')).toHaveTextContent(
      '40 frågor · XYZ 12 · KVA 10 · NOG 6 · DTK 12',
    )
  })

  it('starting a synthetic pass fires onStart', () => {
    const onStart = vi.fn()
    render(
      <Picker
        mode="synthetic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={onStart}
      />,
    )
    fireEvent.click(screen.getByTestId('prov-synthetic-cta'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})

// The old "Instructions" full-page interstitial (and its tests) was
// replaced by src/components/mock/ConfirmSheet.tsx — a bottom-sheet
// pre-commitment gate wired directly into ProvRoute's `instructions`
// phase. Its coverage (rules, start/dismiss callbacks, event logging)
// lives in ConfirmSheet.test.tsx now.

// ── PR 4 integration helpers (pure) ─────────────────────────────────
// Route-level wiring itself (ProvRoute) leans on TanStack Router's
// Route.useSearch()/useNavigate — this codebase's route tests never
// mount the full router (see every other *.test.tsx alongside a route
// file), so the load-bearing logic PR 4 added is kept in small pure
// functions and tested directly here, same idiom as lib/mock.ts.

describe('encodeMockSections / decodeMockSections', () => {
  it('round-trips an authentic pass', () => {
    const encoded = encodeMockSections('authentic', 'verbal', 'var-2018-1', 'verb1')
    expect(encoded).toBe('authentic:verbal:var-2018-1:verb1')
    expect(decodeMockSections(encoded)).toEqual({
      mode: 'authentic',
      half: 'verbal',
      examId: 'var-2018-1',
      provpass: 'verb1',
    })
  })

  it('round-trips a synthetic pass with blank examId/provpass', () => {
    const encoded = encodeMockSections('synthetic', 'kvant', '', '')
    expect(encoded).toBe('synthetic:kvant::')
    expect(decodeMockSections(encoded)).toEqual({
      mode: 'synthetic',
      half: 'kvant',
      examId: '',
      provpass: '',
    })
  })

  it('returns null for null/empty/malformed input instead of throwing', () => {
    expect(decodeMockSections(null)).toBeNull()
    expect(decodeMockSections('')).toBeNull()
    expect(decodeMockSections('not-enough-fields')).toBeNull()
    expect(decodeMockSections('bogus:verbal:x:y')).toBeNull()
    expect(decodeMockSections('authentic:bogus-half:x:y')).toBeNull()
  })
})

describe('validateSearch', () => {
  it('parses result and devMinutes from numbers or numeric strings', () => {
    expect(validateSearch({ result: 5 })).toEqual({ result: 5 })
    expect(validateSearch({ result: '5' })).toEqual({ result: 5 })
    expect(validateSearch({ devMinutes: 3 })).toEqual({ devMinutes: 3 })
    expect(validateSearch({ devMinutes: '3' })).toEqual({ devMinutes: 3 })
  })

  it('ignores non-positive or non-numeric devMinutes', () => {
    expect(validateSearch({ devMinutes: 0 })).toEqual({})
    expect(validateSearch({ devMinutes: -1 })).toEqual({})
    expect(validateSearch({ devMinutes: 'x' })).toEqual({})
  })

  it('parses run=1 (number or string)', () => {
    expect(validateSearch({ run: 1 })).toEqual({ run: 1 })
    expect(validateSearch({ run: '1' })).toEqual({ run: 1 })
    expect(validateSearch({ run: 2 })).toEqual({})
  })

  it('returns an empty object for no recognized keys', () => {
    expect(validateSearch({})).toEqual({})
    expect(validateSearch({ unrelated: 'x' })).toEqual({})
  })

  it('parses half=verbal|kvant from the Kallelse summons link', () => {
    expect(validateSearch({ half: 'verbal' })).toEqual({ half: 'verbal' })
    expect(validateSearch({ half: 'kvant' })).toEqual({ half: 'kvant' })
  })

  it('ignores an unrecognized half value', () => {
    expect(validateSearch({ half: 'quant' })).toEqual({})
    expect(validateSearch({ half: 'Verbal' })).toEqual({})
  })

  it('parses prescribed=1 (number or string)', () => {
    expect(validateSearch({ prescribed: 1 })).toEqual({ prescribed: 1 })
    expect(validateSearch({ prescribed: '1' })).toEqual({ prescribed: 1 })
    expect(validateSearch({ prescribed: 2 })).toEqual({})
  })
})

describe('resolveDurationMs', () => {
  it('defaults to 55 minutes when devMinutes is absent', () => {
    expect(resolveDurationMs(undefined)).toBe(55 * 60_000)
  })

  it('honors devMinutes only on a dev surface (import.meta.env.DEV is true under vitest)', () => {
    // vitest runs with import.meta.env.DEV = true, so isDevSurface() is
    // unconditionally true in this test environment — this test documents
    // that devMinutes IS honored here, and the isDevSurface() gate itself
    // is covered by lib/devSurface's own tests (DEV / ?dev=1 / sessionStorage).
    expect(resolveDurationMs(3)).toBe(3 * 60_000)
  })
})

describe('countSeenBefore', () => {
  it('counts only qids with a positive exposure n', () => {
    const plan = [{ qid: 'a' } as never, { qid: 'b' } as never, { qid: 'c' } as never]
    const exposure = { a: { n: 2 }, b: { n: 0 }, d: { n: 5 } }
    expect(countSeenBefore(plan, exposure)).toBe(1)
  })

  it('returns 0 for an empty plan or empty exposure map', () => {
    expect(countSeenBefore([], {})).toBe(0)
    expect(countSeenBefore([{ qid: 'a' } as never], {})).toBe(0)
  })
})
