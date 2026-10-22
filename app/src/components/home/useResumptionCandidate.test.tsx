// Unit tests for resumption-candidate selection + href construction.
// The pure `pickCandidate` is shared by the desktop panel and the phone
// line, so both surfaces inherit these guarantees. End-to-end rendering +
// cross-device behavior is covered by the two-context Playwright drive.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LessonProgress } from '@/api/hooks/useLessonProgress'
import type { ActiveSession } from '@/api/hooks/useSessions'
import { type Framework, loadFramework } from '@/data/frameworks'

import { ResumptionPanel } from './ResumptionPanel'
import { pickCandidate, useResumptionCandidate } from './useResumptionCandidate'

const live = vi.hoisted(() => ({
  sessions: [] as ActiveSession[],
  lesson: null as LessonProgress | null,
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessions: () => ({ data: live.sessions }),
}))
vi.mock('@/api/hooks/useLessonProgress', () => ({
  useLessonProgress: () => ({ data: live.lesson }),
}))
vi.mock('@/data/frameworks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/frameworks')>()),
  loadFramework: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props} />
  ),
}))

const headword = 'Två yttre marginaler i en 2×2-tabell'
const framework: Framework = {
  section: 'NOG',
  family: 'nog_traps',
  version: 1,
  authored_at: '',
  entries: [
    {
      id: 'NOG-TRAP-001',
      pattern_description: headword,
      why_it_occurs: '',
      common_distractor_signature: '',
      countermeasure: '',
      example_questions: [],
    },
  ],
}
const rawIdPattern = /\b[A-ZÄÖ]+-[A-Z]+-\d+\b/

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

  it.each([
    ['ORD · PÅ TID', 'ORD på tid', 'section=ORD&timed=1'],
    ['LÄS · PÅ TID', 'LÄS på tid', 'section=L%C3%84S&timed=1'],
    ['ORD · ORDBANK', 'Ordbank', 'section=ORD&words=1'],
    ['ar:ORD:FW', 'ORD · repetition', 'section=ORD&framework=FW&ar=1'],
    ['ar:LÄS:FW & 1', 'LÄS · repetition', 'section=L%C3%84S&framework=FW%20%26%201&ar=1'],
  ])('preserves the mode of %s in the resume link', (sections, subject, query) => {
    const c = pickCandidate([drill({ sections, currentQuestionId: 'q&3' })], null)
    expect(c?.subject).toBe(subject)
    expect(c?.href).toBe(`/drill?${query}&qid=q%263`)
  })

  it('maps a lesson bookmark to a search-param + hash href (never a 404 path)', () => {
    const c = pickCandidate([], lesson())
    expect(c?.subject).toBe('XYZ-lektion')
    expect(c?.progress).toBe('pågående lektion')
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

describe('lesson resume display', () => {
  const now = new Date('2026-05-29T10:00:00.000Z')
  let client: QueryClient
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  beforeEach(() => {
    live.sessions = []
    live.lesson = lesson({ section: 'NOG', frameworkId: 'NOG-TRAP-001' })
    vi.mocked(loadFramework).mockReset().mockResolvedValue(framework)
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })
  afterEach(() => client.clear())

  it('uses the cached headword shared with the Folio lesson query', () => {
    client.setQueryData(['folio-lesson', 'NOG'], framework)
    const { result } = renderHook(() => useResumptionCandidate(now), { wrapper })
    expect(result.current?.progress).toBe(`vid ${headword}`)
    expect(result.current?.progress).not.toMatch(rawIdPattern)
    expect(result.current?.href).toBe('/lektion?section=NOG#NOG-TRAP-001')
    expect(loadFramework).not.toHaveBeenCalled()
  })

  it('stays neutral while loading, then resolves the entry without changing its link', async () => {
    let resolve!: (value: Framework) => void
    vi.mocked(loadFramework).mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    const { result } = renderHook(() => useResumptionCandidate(now), { wrapper })
    expect(result.current?.progress).toBe('pågående lektion')
    expect(result.current?.progress).not.toMatch(rawIdPattern)
    expect(result.current?.href).toBe('/lektion?section=NOG#NOG-TRAP-001')
    expect(loadFramework).toHaveBeenCalledWith('NOG')
    await act(async () => resolve(framework))
    await waitFor(() => expect(result.current?.progress).toBe(`vid ${headword}`))
    expect(result.current?.href).toBe('/lektion?section=NOG#NOG-TRAP-001')
  })

  it.each(['NOG-TRAP-999', null])('stays neutral for a missing entry: %s', (frameworkId) => {
    live.lesson = lesson({ section: 'NOG', frameworkId })
    client.setQueryData(['folio-lesson', 'NOG'], framework)
    const { result } = renderHook(() => useResumptionCandidate(now), { wrapper })
    expect(result.current?.progress).toBe('pågående lektion')
    expect(result.current?.progress).not.toMatch(rawIdPattern)
    expect(result.current?.href).toBe(`/lektion?section=NOG${frameworkId ? `#${frameworkId}` : ''}`)
  })

  it('stays neutral when the framework request fails', async () => {
    vi.mocked(loadFramework).mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useResumptionCandidate(now), { wrapper })
    await waitFor(() => expect(client.getQueryState(['folio-lesson', 'NOG'])?.status).toBe('error'))
    expect(result.current?.progress).toBe('pågående lektion')
    expect(result.current?.progress).not.toMatch(rawIdPattern)
  })

  it('uses the new section and family when the bookmark changes', () => {
    client.setQueryData(['folio-lesson', 'NOG'], framework)
    client.setQueryData(['folio-lesson', 'ORD'], {
      section: 'ORD',
      family: 'ord_roots',
      version: 1,
      authored_at: '',
      entries: [
        {
          id: 'ORD-ROOT-010',
          root: 'o-',
          origin: '',
          meaning: '',
          example_words: [],
          example_questions: [],
        },
      ],
    } satisfies Framework)
    const { result, rerender } = renderHook(() => useResumptionCandidate(now), { wrapper })
    expect(result.current?.progress).toBe(`vid ${headword}`)
    live.lesson = lesson({ section: 'ord', frameworkId: 'ORD-ROOT-010' })
    rerender()
    expect(result.current?.progress).toBe('vid o-')
    expect(result.current?.href).toBe('/lektion?section=ORD#ORD-ROOT-010')
  })

  it('keeps the fresher session and its question progress unchanged', () => {
    live.sessions = [drill()]
    client.setQueryData(['folio-lesson', 'NOG'], framework)
    const { result } = renderHook(() => useResumptionCandidate(now), { wrapper })
    expect(result.current?.subject).toBe('ORD-övning')
    expect(result.current?.progress).toBe('vid fråga 3 av 10')
    expect(result.current?.href).toBe('/drill?section=ORD&qid=q3')
  })

  it('does not request a framework without a supported lesson section', () => {
    live.lesson = null
    const { result, rerender } = renderHook(() => useResumptionCandidate(now), { wrapper })
    expect(result.current).toBeNull()
    live.lesson = lesson({ section: 'unknown' })
    rerender()
    expect(result.current?.progress).toBe('pågående lektion')
    expect(loadFramework).not.toHaveBeenCalled()
  })

  it.each([
    'known',
    'loading',
    'unknown',
  ] as const)('renders the classic panel without raw ids: %s', (state) => {
    if (state === 'loading') {
      vi.mocked(loadFramework).mockReturnValue(new Promise(() => {}))
    } else {
      client.setQueryData(['folio-lesson', 'NOG'], framework)
    }
    if (state === 'unknown') live.lesson = lesson({ section: 'NOG', frameworkId: 'NOG-TRAP-999' })
    render(<ResumptionPanel now={now} />, { wrapper })
    expect(screen.getByTestId('home-resumption-marginalia')).toHaveTextContent(
      state === 'known' ? `vid ${headword}` : 'pågående lektion',
    )
    expect(screen.getByTestId('home-resumption-panel').textContent).not.toMatch(rawIdPattern)
    expect(screen.getByRole('link', { name: 'Fortsätt här' })).toHaveAttribute(
      'href',
      `/lektion?section=NOG#${live.lesson?.frameworkId}`,
    )
  })
})
