import { fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { type ComponentType, StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FolioHostContext } from '@/folio/host'
import { logMockEvent } from '@/lib/mockEvents'
import { PLAN_SCHEMA_VERSION, type PlanItem } from '@/lib/scheduler'
import { Route } from '@/routes/index'
import FolioIdag from './FolioIdag'

const extras = vi.hoisted(() => ({
  now: new Date(2026, 9, 22, 9),
  daysLeft: 170,
  examDate: new Date(2027, 3, 10),
  resume: null as unknown,
  trapNames: {},
  viewport: 'studio',
}))
vi.mock('./useIdagExtras', () => ({ useIdagExtras: () => extras, useIdagTelemetry: vi.fn() }))
const routeState = vi.hoisted(() => ({
  navigate: vi.fn(),
  daily: vi.fn(),
  statsPending: false,
  userId: null as string | null,
}))
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ userId: routeState.userId }),
  useUser: () => ({ user: { firstName: 'Kim' } }),
}))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => routeState.navigate,
}))
vi.mock('@/api/hooks/useStats', () => ({
  useStats: () => ({ data: undefined, isPending: routeState.statsPending }),
}))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: [] }),
  usePileMistakes: () => ({ data: [] }),
}))
vi.mock('@/api/hooks/useSessions', () => ({ useSessionHistory: () => ({ data: [] }) }))
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => [] }))
vi.mock('@/api/hooks/useMockResults', () => ({ useMockResults: () => ({ data: [] }) }))
vi.mock('@/hooks/useDailyPlan', () => ({ useDailyPlan: routeState.daily }))
vi.mock('@/components/account/AccountMenu', () => ({ AccountMenu: () => null }))
vi.mock('@/screens/HomeMobile', () => ({ HomeMobile: () => <div data-testid="classic-home" /> }))
vi.mock('@/lib/mockEvents', () => ({ logMockEvent: vi.fn() }))
const item: PlanItem = {
  id: 'ord',
  kind: 'drill',
  section: 'ORD',
  headline: 'ORD-övning · 10 frågor',
  rationale: 'Träna orden.',
  estimatedMinutes: 8,
  href: '/drill?section=ORD',
  completed: false,
}
const plan = {
  version: PLAN_SCHEMA_VERSION,
  date: '2026-10-22',
  items: [item],
  estimatedMinutes: 8,
}
const navigateHref = vi.fn()
beforeEach(() => {
  extras.resume = null
  extras.viewport = 'studio'
  extras.daysLeft = 170
  navigateHref.mockClear()
  localStorage.clear()
  routeState.userId = null
  routeState.statsPending = false
  routeState.navigate.mockClear()
  routeState.daily.mockReset().mockReturnValue({ plan, allComplete: false })
  vi.mocked(logMockEvent).mockClear()
})
afterEach(() => vi.useRealTimers())

describe('FolioIdag', () => {
  it('makes every day step clickable, including completed and current steps', () => {
    render(
      <FolioIdag
        plan={{ ...plan, items: [{ ...item, id: 'done', completed: true }, item] }}
        navigateHref={navigateHref}
      />,
    )
    for (const id of ['done', 'ord']) {
      const row = screen.getByTestId(`daily-plan-item-${id}`)
      expect(row).toHaveAttribute('data-completed', String(id === 'done'))
      const link = within(row).getByRole('link')
      expect(link).toHaveAccessibleName(
        `${id === 'done' ? 'Klar: ' : ''}ORD-övning 10 frågor ${id === 'done' ? 'klar' : 'nu'} Träna orden.`,
      )
      expect(link).toHaveAttribute('href', item.href)
      fireEvent.click(link)
      expect(navigateHref).toHaveBeenLastCalledWith(item.href)
    }
  })
  it('keeps one completed-plan primary action and the continuation link', () => {
    const view = render(
      <FolioIdag
        plan={{ ...plan, items: [{ ...item, completed: true }] }}
        allComplete
        dueCount={3}
        navigateHref={navigateHref}
      />,
    )
    const complete = screen.getByTestId('daily-plan-complete')
    expect(
      within(complete).getByRole('heading', { name: 'Allt i dagens plan är gjort' }),
    ).toBeInTheDocument()
    expect(within(complete).getByRole('link', { name: /Repetera 3 missar/ })).toHaveAttribute(
      'href',
      '/repetition?start=1',
    )
    expect(
      within(complete).getByRole('link', { name: 'Vill du fortsätta? Öva en sektion →' }),
    ).toHaveAttribute('href', '/ova')
    expect(view.container.querySelectorAll('.fa-btn')).toHaveLength(1)
  })
  it('preserves the first-pass card and its completed result link', () => {
    render(
      <FolioIdag
        plan={{
          ...plan,
          items: [{ ...item, id: 'onboarding-one', completed: true, href: '/drill?done=19' }],
        }}
        allComplete
        navigateHref={navigateHref}
      />,
    )
    expect(
      within(screen.getByTestId('daily-plan-complete')).getByRole('link', {
        name: 'Första passet · klart ✓',
      }),
    ).toHaveAttribute('href', '/drill?done=19')
    expect(
      screen.getByRole('link', { name: 'Vill du fortsätta? Öva en sektion →' }),
    ).toHaveAttribute('href', '/ova')
  })
  it('preserves the cold-start copy and its single door', () => {
    render(
      <FolioIdag
        plan={{ ...plan, items: [{ ...item, id: 'cold-one', href: '/diagnostik?start=1' }] }}
        navigateHref={navigateHref}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Börja här.' })).toBeInTheDocument()
    expect(screen.getByTestId('daily-plan-card')).toBeInTheDocument()
    expect(screen.getByTestId('daily-plan-first-cta')).toHaveAttribute(
      'href',
      '/diagnostik?start=1',
    )
    expect(screen.getByTestId('daily-plan-first-cta')).toHaveTextContent('Starta första övningen →')
    expect(screen.queryByRole('heading', { name: 'Dagens steg' })).not.toBeInTheDocument()
  })
  it('settles plan errors, then renders a cached plan despite a background error', () => {
    const view = render(<FolioIdag plan={null} navigateHref={navigateHref} />)
    expect(screen.getByTestId('daily-plan-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-card')).not.toBeInTheDocument()
    view.rerender(<FolioIdag plan={null} planError navigateHref={navigateHref} />)
    expect(screen.getByTestId('daily-plan-error')).toHaveTextContent('Gick inte att hämta planen')
    expect(screen.queryByTestId('daily-plan-complete')).not.toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-card')).not.toBeInTheDocument()
    view.rerender(<FolioIdag plan={plan} planError navigateHref={navigateHref} />)
    expect(screen.getByTestId('daily-plan-link-ord')).toBeInTheDocument()
    expect(screen.getByTestId('daily-plan-card')).toBeInTheDocument()
  })
  it('separates the title and detail in a day link accessible name', () => {
    render(
      <FolioIdag
        plan={{ ...plan, items: [{ ...item, kind: 'repetition' }] }}
        dueCount={12}
        pileCount={30}
        navigateHref={navigateHref}
      />,
    )
    expect(screen.getByTestId('daily-plan-link-ord')).toHaveAccessibleName(
      'Repetition 10 av 30 missar nu De äldsta missarna först.',
    )
  })
  it('labels the whole margin as an overview and the prognosis section separately', () => {
    render(<FolioIdag plan={plan} navigateHref={navigateHref} />)
    expect(screen.getByRole('complementary', { name: 'Översikt' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Prognos' })).toBeInTheDocument()
  })
  it.each([
    [0, 'Idag är det högskoleprov'],
    [1, '1 dag kvar till högskoleprovet'],
    [2, '2 dagar kvar till högskoleprovet'],
  ])('inflects the exam countdown at %s days', (days, text) => {
    extras.daysLeft = days
    render(<FolioIdag plan={plan} navigateHref={navigateHref} />)
    expect(screen.getByText((_, element) => element?.className === 'fa-count')).toHaveTextContent(
      text,
    )
  })
  it.each([
    1, 2,
  ])('uses the correct count wording for %s completed steps and trap occurrences', (count) => {
    render(
      <FolioIdag
        plan={{
          ...plan,
          items: Array.from({ length: count }, (_, i) => ({
            ...item,
            id: String(i),
            completed: true,
          })),
        }}
        allComplete
        topTraps={[
          {
            framework_id: 'NOG-TRAP-007',
            section: 'NOG',
            count,
            headline: null,
            trend: { kind: 'unknown' },
          },
        ]}
        navigateHref={navigateHref}
      />,
    )
    expect(
      screen.getByText(`${count} av ${count} ${count === 1 ? 'klart' : 'klara'}`),
    ).toBeInTheDocument()
    expect(screen.getByText(`${count} ${count === 1 ? 'gång' : 'gånger'}`)).toBeInTheDocument()
  })
  it.each([
    ['Idag · 07:52', 'Påbörjad idag 07:52'],
    ['Igår · 14:02', 'Påbörjad igår 14:02'],
    ['1 dagar sedan', 'Påbörjad för 1 dag sedan'],
    ['1 dag sedan', 'Påbörjad för 1 dag sedan'],
    ['3 dagar sedan', 'Påbörjad för 3 dagar sedan'],
  ])('formats the resume age %s as natural Swedish', (relativeLabel, expected) => {
    extras.resume = {
      subject: 'ORD-övning',
      progress: 'vid fråga 1 av 1',
      href: '/drill?section=ORD',
      relativeLabel,
      deviceLabel: null,
      stale: false,
    }
    render(<FolioIdag plan={plan} navigateHref={navigateHref} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
    expect(screen.getByText('Fråga 1 av 1')).toBeInTheDocument()
  })
  it('opens mock conditions and leaves Inte idag as a quiet button', () => {
    const deferMock = vi.fn()
    render(
      <FolioIdag
        plan={{
          ...plan,
          items: [
            {
              ...item,
              kind: 'mock',
              headline: 'Provpass · Kvant',
              href: '/prov?half=kvant&prescribed=1',
            },
          ],
        }}
        deferMock={deferMock}
        navigateHref={navigateHref}
      />,
    )
    fireEvent.click(screen.getByTestId('daily-plan-link-ord'))
    expect(navigateHref).toHaveBeenLastCalledWith('/prov?half=kvant')
    const defer = screen.getByRole('button', { name: 'Inte idag' })
    expect(defer).not.toHaveClass('fa-btn')
    fireEvent.click(defer)
    expect(deferMock).toHaveBeenCalledOnce()
  })
  it('renders resume with age and device, no banned copy, and no fake lesson position', () => {
    extras.resume = {
      subject: 'XYZ-lektion',
      progress: 'vid XYZ-TRAP-016',
      href: '/lektion?section=XYZ#XYZ-TRAP-016',
      headline: 'XYZ-lektion · pausad',
      relativeLabel: '8 dagar sedan',
      deviceLabel: 'telefon',
      stale: true,
    }
    const view = render(<FolioIdag plan={plan} navigateHref={navigateHref} />)
    expect(screen.getByTestId('home-resumption-link')).toHaveAttribute(
      'href',
      '/lektion?section=XYZ#XYZ-TRAP-016',
    )
    expect(view.container.textContent).toContain('telefonen')
    expect(view.container.textContent).toContain('mer än en vecka sedan')
    expect(view.container.textContent).not.toMatch(
      /fråga undefined|vila|paus|sluta|förlorar|klart för idag/i,
    )
  })
  it('keeps a falling delta and rising trap neutral, and links recent passes', () => {
    const view = render(
      <FolioIdag
        plan={plan}
        projected={{ total: 1.2, verbal: 1.3, quant: 1.1, band: 0.2 }}
        projectedDelta={{ kind: 'change', delta: -0.2, band: 0.1 }}
        topTraps={[
          {
            framework_id: 'NOG-TRAP-007',
            section: 'NOG',
            count: 4,
            headline: null,
            trend: { kind: 'delta', delta: 2, daysAgo: 7 },
          },
        ]}
        history={[
          {
            id: 7,
            kind: 'adaptive_review',
            sections: null,
            total: 10,
            correct: 8,
            endedAt: extras.now.toISOString(),
          },
        ]}
        navigateHref={navigateHref}
      />,
    )
    expect(screen.getByText('−0,2 sedan förra veckan')).toHaveClass('fa-delta')
    expect(screen.getByText('−0,2 sedan förra veckan')).not.toHaveAttribute('style')
    expect(screen.getByTestId('top-trap-link')).toHaveAttribute(
      'href',
      '/drill?framework=NOG-TRAP-007',
    )
    expect(screen.getByText(/ökar/)).not.toHaveAttribute('style')
    expect(screen.getByTestId('home-recent-pass-7')).toHaveAttribute('href', '/repetition?done=7')
    expect(screen.getByTestId('home-recent-all')).toHaveAttribute('href', '/historik')
    expect(view.container.textContent).not.toMatch(/vila|paus|sluta|förlorar|klart för idag/i)
  })
  it('uses the phone composition without another frame or navigation shell', () => {
    extras.viewport = 'phone'
    render(<FolioIdag plan={plan} firstName="Kim" navigateHref={navigateHref} />)
    expect(screen.getByTestId('folio-idag')).toHaveClass('fa-phome')
    expect(screen.getByTestId('home-greeting')).toHaveTextContent('God morgon, Kim.')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('keeps modified clicks native', () => {
    render(<FolioIdag plan={plan} navigateHref={navigateHref} />)
    // Observe the React handler before suppressing jsdom's unsupported navigation.
    const preventNavigation = vi.fn((event: MouseEvent) => {
      expect(event.defaultPrevented).toBe(false)
      event.preventDefault()
    })
    document.addEventListener('click', preventNavigation, { once: true })
    fireEvent.click(screen.getByTestId('daily-plan-link-ord'), { ctrlKey: true })
    expect(preventNavigation).toHaveBeenCalledOnce()
    expect(navigateHref).not.toHaveBeenCalled()
  })

  it('mounts the quiet calendar invitation immediately under the completed card', () => {
    routeState.userId = 'student-a'
    vi.useFakeTimers()
    vi.setSystemTime(extras.now)
    render(
      <FolioIdag
        plan={{ ...plan, items: [{ ...item, completed: true }] }}
        allComplete
        history={[
          {
            id: 2,
            kind: 'drill',
            sections: 'ORD',
            total: 10,
            correct: 8,
            startedAt: new Date(2026, 9, 22, 7, 52).toISOString(),
            endedAt: extras.now.toISOString(),
          },
          {
            id: 1,
            kind: 'drill',
            sections: 'ORD',
            total: 10,
            correct: 8,
            startedAt: new Date(2026, 9, 21, 7, 52).toISOString(),
            endedAt: extras.now.toISOString(),
          },
        ]}
        navigateHref={navigateHref}
      />,
    )
    expect(
      screen.getByTestId('daily-plan-complete').nextElementSibling?.getAttribute('data-testid'),
    ).toBe('return-prompt')
  })
})

describe('Home route handoff', () => {
  const Home = Route.options.component as ComponentType
  it('waits for stats before showing the missing-prognosis explanation', async () => {
    routeState.statsPending = true
    const view = render(
      <FolioHostContext.Provider value={true}>
        <Home />
      </FolioHostContext.Provider>,
    )
    await screen.findByTestId('folio-idag')
    expect(
      screen.queryByText('Prognosen visas när du har svarat i båda delarna.'),
    ).not.toBeInTheDocument()
    routeState.statsPending = false
    view.rerender(
      <FolioHostContext.Provider value={true}>
        <Home />
      </FolioHostContext.Provider>,
    )
    expect(
      screen.getByText('Prognosen visas när du har svarat i båda delarna.'),
    ).toBeInTheDocument()
  })
  it('keeps classic Home outside the Folio context, and invokes the plan writer once', () => {
    render(<Home />)
    expect(screen.getByTestId('classic-home')).toBeInTheDocument()
    expect(screen.queryByTestId('folio-idag')).not.toBeInTheDocument()
    expect(routeState.daily).toHaveBeenCalledTimes(1)
  })
  it('loads Folio inside its shell with one plan writer and preserves resume query/hash', async () => {
    extras.resume = {
      subject: 'XYZ-lektion',
      progress: 'vid XYZ-TRAP-016',
      href: '/lektion?section=XYZ#XYZ-TRAP-016',
      relativeLabel: 'Idag · 07:52',
      deviceLabel: null,
      stale: false,
    }
    render(
      <FolioHostContext.Provider value={true}>
        <Home />
      </FolioHostContext.Provider>,
    )
    expect(await screen.findByTestId('folio-idag')).toBeInTheDocument()
    expect(screen.queryByTestId('classic-home')).not.toBeInTheDocument()
    expect(routeState.daily).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('home-resumption-link'))
    expect(routeState.navigate).toHaveBeenLastCalledWith({
      to: '/lektion',
      search: { section: 'XYZ' },
      hash: 'XYZ-TRAP-016',
    })
  })
})

describe('Folio Home telemetry', () => {
  it('preserves daily dedupe across StrictMode and classic/Folio visits', async () => {
    const { useIdagTelemetry } =
      await vi.importActual<typeof import('./useIdagExtras')>('./useIdagExtras')
    const mockPlan = { ...plan, items: [{ ...item, kind: 'mock' as const }] }
    const prescription = {
      due: true,
      half: 'kvant' as const,
      daysSinceLast: 20,
      interval: 14,
      daysUntilNext: 0,
    }
    const first = renderHook(() => useIdagTelemetry(mockPlan, prescription), {
      wrapper: StrictMode,
    })
    expect(logMockEvent).toHaveBeenCalledWith('provpassdag_shown')
    expect(logMockEvent).toHaveBeenCalledWith('window_slid', { slidDays: 6 })
    expect(logMockEvent).toHaveBeenCalledTimes(2)
    first.unmount()
    renderHook(() => useIdagTelemetry(mockPlan, prescription))
    expect(logMockEvent).toHaveBeenCalledTimes(2)
  })
  it('does not log completed mock steps or a first mock as a slid window', async () => {
    const { useIdagTelemetry } =
      await vi.importActual<typeof import('./useIdagExtras')>('./useIdagExtras')
    renderHook(() =>
      useIdagTelemetry(
        { ...plan, items: [{ ...item, kind: 'mock', completed: true }] },
        { due: true, half: 'kvant', daysSinceLast: null, interval: 14, daysUntilNext: 0 },
      ),
    )
    expect(logMockEvent).not.toHaveBeenCalled()
  })
})
