import { fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Stats } from '@/api/hooks/useStats'
import { SECTION_KEYS } from '@/data/questions'
import { useFolioPrefs } from '@/folio/lib/folioPrefs'
import { computeHonestProjected, formatScoreSv } from '@/lib/scoring'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'
import FolioFramsteg from './FolioFramsteg'
import { TrendChart } from './TrendChart'

const extras = vi.hoisted(() => ({
  viewport: 'studio',
  days: 170,
  sitting: { label: 'Vårprov 27', date: new Date(2027, 3, 10) as Date | undefined },
  due: { data: Array.from({ length: 12 }, (_, i) => ({ questionId: `2024v-1-ORD-${i + 1}` })) },
  sample: {
    data: [
      { questionId: '2024v-1-LÄS-1', correct: true },
      { questionId: '2024v-1-LÄS-2', correct: false },
      { questionId: '2024v-1-LÄS-3', correct: true },
    ],
  },
  active: { data: [{ questionId: '2024v-1-LÄS-2' }] },
}))
vi.mock('./useFramstegExtras', () => ({ useFramstegExtras: () => extras }))
const queries = vi.hoisted(() => ({
  results: [] as { half: string; sessionId: number; createdAt: number | null }[],
  attempts: vi.fn((id: number | null) => ({
    data: id == null ? undefined : [{ questionId: `pass-${id}-ORD-1`, correct: true }],
  })),
}))
vi.mock('@/api/hooks/useMockResults', () => ({ useMockResults: () => ({ data: queries.results }) }))
vi.mock('@/api/hooks/useSessions', () => ({ useSessionAttempts: queries.attempts }))
vi.mock('@/api/hooks/useMistakes', () => ({
  useActiveMistakes: () => extras.active,
  useDueMistakes: () => extras.due,
}))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => extras.viewport }))
vi.mock('@/stores/examStore', () => ({
  useDaysRemaining: () => extras.days,
  useSitting: () => extras.sitting,
}))
const navigateHref = vi.fn()
const stats = (): Stats => ({
  attempts: { total: 100, today: 5, thisWeek: 20 },
  drills: { total: 10, thisWeek: 2 },
  accuracy7d: 0.75,
  mistakes: { due: 1, active: 4, resolved: 8 },
  streakDays: 99,
  bySection: Object.fromEntries(
    SECTION_KEYS.map((section) => [
      section,
      {
        attempts90d: 100,
        correct90d: 70,
        attempts7d: 30,
        correct7d: 21,
        attempts7to14d: 30,
        correct7to14d: 21,
        attemptsToday: 0,
        avgTimeMs: null,
        lastAttemptedAt: Date.now(),
        firstTry90d: section === 'LÄS' ? 3 : section === 'XYZ' ? 0 : 20,
        firstTryCorrect90d: section === 'LÄS' ? 2 : section === 'XYZ' ? 0 : 14,
      },
    ]),
  ) as Stats['bySection'],
  weekly: [0.5, null, 0.7].map((n, i) => ({
    weekStart: Date.UTC(2026, 9, 5 + i * 7),
    attempts: n == null ? 0 : 10,
    correct: n == null ? 0 : n * 10,
  })),
})
beforeEach(() => {
  navigateHref.mockClear()
  extras.viewport = 'studio'
  extras.sitting.date = new Date(2027, 3, 10)
  extras.days = 170
  useFolioPrefs.setState({ kbd: true })
})

describe('Ljusbord Framsteg', () => {
  it('loads only the newest recent provpass of each half and discards obsolete samples', async () => {
    const { useFramstegExtras } =
      await vi.importActual<typeof import('./useFramstegExtras')>('./useFramstegExtras')
    const now = Date.now()
    queries.results = [
      { half: 'verbal', sessionId: 12, createdAt: now },
      { half: 'verbal', sessionId: 11, createdAt: now - 1000 },
      { half: 'kvant', sessionId: 10, createdAt: now - 2000 },
    ]
    queries.attempts.mockClear()
    const { result, rerender } = renderHook(useFramstegExtras)
    expect(queries.attempts.mock.calls).toEqual([[12], [10]])
    expect(result.current.sample.data.map((a) => a.questionId)).toEqual([
      'pass-12-ORD-1',
      'pass-10-ORD-1',
    ])
    expect(result.current.active).toBe(extras.active)
    expect(result.current.due).toBe(extras.due)
    queries.results = [
      { half: 'verbal', sessionId: 12, createdAt: null },
      { half: 'kvant', sessionId: 10, createdAt: now - 91 * 86400000 },
    ]
    queries.attempts.mockClear()
    rerender()
    expect(queries.attempts.mock.calls).toEqual([[null], [null]])
    expect(result.current.sample.data).toEqual([])
    queries.results = []
  })
  it('shows one lit prognosis and one data-backed lever, then the sections', () => {
    const { container } = render(
      <FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Var du står, ärligt.')
    expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual([
      'Var du står, ärligt.',
      'Prognos just nu',
      'Hur säker är den?',
      'Delproven',
      'Poäng per vecka',
      'Fler sätt att smalna intervallet',
    ])
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    expect(screen.getByTestId('framsteg-primary')).toHaveTextContent('Prova XYZ')
    expect(screen.getByTestId('framsteg-primary')).toHaveTextContent(
      `Prova XYZ · 10 frågor, ca ${SECTION_DURATIONS.XYZ} min`,
    )
    expect(screen.getByTestId('framsteg-primary')).toHaveAttribute(
      'href',
      '/drill?section=XYZ&start=1',
    )
    expect(screen.getByText(/Totalen är medelvärdet av halvorna/)).toHaveTextContent(
      '123 förstaförsök',
    )
    expect(screen.getByTestId('progress-first-try-note')).toHaveTextContent('bara första försöket')
    expect(container.textContent).not.toMatch(
      /streak|serie|rekord|du borde|på väg ner|sämst|forecast|prognos framåt/i,
    )
    expect(screen.queryByText('Nästa steg uppåt')).not.toBeInTheDocument()
    expect(screen.queryByText('Sedan')).not.toBeInTheDocument()
    expect(screen.queryByText('Mönstret i dina KVA-missar')).not.toBeInTheDocument()
  })
  it('uses real section links, ten-answer bands and recorded dots', () => {
    render(<FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />)
    for (const s of SECTION_KEYS) {
      expect(screen.getByTestId(`progress-section-${s}`).tagName).toBe('A')
      expect(screen.getByTestId(`progress-section-${s}`)).toHaveAttribute(
        'href',
        `/lektion?section=${encodeURIComponent(s)}`,
      )
    }
    const thin = screen.getByTestId('progress-section-LÄS')
    expect(thin).toHaveTextContent('2 av 3 · första glimt')
    expect(thin.querySelector('.fa-ui-band')).toBeNull()
    expect(thin.querySelectorAll('[data-answer]')).toHaveLength(3)
    expect(thin.querySelectorAll('[data-returning="true"]')).toHaveLength(1)
    expect(screen.getByTestId('progress-section-ORD').querySelector('.fa-ui-band')).not.toBeNull()
    expect(screen.getByTestId('progress-section-XYZ')).toHaveTextContent('inte provat')
    expect(screen.getByTestId('progress-historik')).toHaveAttribute('href', '/historik')
  })
  it.each([
    0, 10,
  ])('fits the soft band inside the axis without moving its core (%s correct)', (correct) => {
    const data = stats()
    Object.assign(data.bySection.ORD, { firstTry90d: 10, firstTryCorrect90d: correct })
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    const band = screen
      .getByTestId('progress-section-ORD')
      .querySelector<HTMLElement>('.fa-fr-band')!
    expect(band).not.toBeNull()
    const fill = band.querySelector<HTMLElement>('.fa-ui-band-range')!
    const rawLeft = Number.parseFloat(fill.style.left)
    const left = rawLeft + Number.parseFloat(band.style.getPropertyValue('--fa-fr-band-shift'))
    const width = Number.parseFloat(band.style.getPropertyValue('--fa-fr-band-width'))
    expect(left).toBeGreaterThanOrEqual(0)
    expect(left + width).toBeLessThanOrEqual(100.0001)
    const range = screen
      .getByTestId('progress-section-ORD')
      .querySelector('b')!
      .textContent!.split('–')
      .map((s) => Number(s.replace(',', '.')))
    const coreLow =
      left +
      (width * Number.parseFloat(band.style.getPropertyValue('--fa-fr-band-core-start'))) / 100
    const coreHigh =
      left + (width * Number.parseFloat(band.style.getPropertyValue('--fa-fr-band-core-end'))) / 100
    // Text rounds to tenths; the painted core retains the scorer's exact endpoints.
    expect(Math.abs(coreLow / 50 - range[0])).toBeLessThan(0.05)
    expect(Math.abs(coreHigh / 50 - range[1])).toBeLessThan(0.05)
    expect(Number.parseFloat(fill.style.width)).toBeGreaterThan(width)
  })
  it('keeps Enter scoped, honours preferences and preserves native modified links', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />,
    )
    const page = screen.getByTestId('folio-framsteg')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
    fireEvent.keyDown(page, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/drill?section=XYZ&start=1')
    navigateHref.mockClear()
    const link = screen.getByTestId('progress-section-ORD')
    link.focus()
    await user.keyboard('{Enter}')
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/lektion?section=ORD')
    navigateHref.mockClear()
    fireEvent.click(link, { ctrlKey: true })
    fireEvent.click(screen.getByTestId('framsteg-primary'), { metaKey: true })
    for (const options of [
      { repeat: true },
      { ctrlKey: true },
      { shiftKey: true },
      { isComposing: true },
    ])
      fireEvent.keyDown(page, { key: 'Enter', ...options })
    const input = document.createElement('input')
    page.appendChild(input)
    fireEvent.keyDown(input, { key: 'Enter' })
    page.setAttribute('inert', '')
    fireEvent.keyDown(page, { key: 'Enter' })
    page.removeAttribute('inert')
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    container.appendChild(dialog)
    fireEvent.keyDown(page, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
    dialog.remove()
    useFolioPrefs.setState({ kbd: false })
    await user.keyboard('{Escape}')
    fireEvent.keyDown(page, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
  })
  it.each([
    'studio',
    'phone',
  ])('preserves the existing trend markup and table in %s', async (viewport) => {
    extras.viewport = viewport
    const data = stats()
    const original = render(<TrendChart weekly={data.weekly} phone={viewport === 'phone'} />)
    const chartMarkup = original.container.innerHTML
    original.unmount()
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    const region = screen.getByRole('region', { name: 'Poäng per vecka' })
    expect(region.querySelector('.fa-chart')?.outerHTML).toBe(chartMarkup)
    const toggle = within(region).getByRole('button', { name: 'Visa som tabell' })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(region).getByRole('table')).toHaveTextContent('ingen övning')
    expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
    expect(within(region).queryByRole('table')).not.toBeInTheDocument()
  })
  it('keeps one phone action outside the transformed lit sheet', () => {
    extras.viewport = 'phone'
    const { container } = render(
      <FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />,
    )
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    const action = screen.getByTestId('framsteg-primary')
    expect(action).toHaveAttribute('data-dock')
    expect(action).toHaveTextContent(`10 frågor, ca ${SECTION_DURATIONS.XYZ} min`)
    expect(action.closest('[data-lit="true"]')).toBeNull()
    fireEvent.click(action)
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/drill?section=XYZ&start=1')
  })
  it('distinguishes loading, error, empty and a missing half without inventing a total', () => {
    const { container, rerender } = render(
      <FolioFramsteg stats={{ isPending: true }} navigateHref={navigateHref} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    expect(screen.queryByTestId('progress-empty-cta')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Ingen prognos än')
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(0)
    rerender(<FolioFramsteg stats={{ isError: true }} navigateHref={navigateHref} />)
    expect(screen.getByRole('status')).toHaveTextContent('Gick inte att hämta')
    const data = stats()
    data.bySection = {} as Stats['bySection']
    rerender(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(screen.getByTestId('progress-empty-cta')).toHaveAttribute('href', '/diagnostik?start=1')
    expect(screen.getByTestId('progress-projected')).toHaveTextContent('—')
    data.bySection = { ORD: stats().bySection.ORD } as Stats['bySection']
    rerender(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(screen.getByTestId('framsteg-primary')).toHaveTextContent('Prova XYZ')
    expect(screen.getByTestId('progress-projected')).toHaveTextContent('—')
    expect(screen.getByText(/Totalen visas när/)).toBeInTheDocument()
    expect(screen.getByTestId('framsteg-half-quant')).toHaveTextContent('Kvant inget underlag än')
    expect(screen.getByTestId('framsteg-half-quant').querySelector('.fa-ui-band')).toBeNull()
    expect(screen.getByTestId('framsteg-half-verbal').querySelector('.fa-ui-band')).not.toBeNull()
    expect(screen.getAllByText(/Totalen är medelvärdet av halvorna/)).toHaveLength(1)
  })
  it('keeps the real half estimates even for one answer and explains synthetic evidence', () => {
    const data = stats()
    data.bySection = {
      ORD: { ...data.bySection.ORD, firstTry90d: 1, firstTryCorrect90d: 1 },
      KVA: data.bySection.KVA,
    } as Stats['bySection']
    data.bySection.ORD.estimateBasis = { authentic: 0, synthetic: 1, calibrated: false }
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(screen.getByTestId('framsteg-half-verbal')).toHaveTextContent('Verbal 0,0–2,0')
    expect(screen.getByTestId('framsteg-half-quant')).toHaveTextContent('Kvant 1,0–1,8')
    expect(screen.getByTestId('progress-section-ORD')).toHaveTextContent('1 av 1 · första glimt')
    expect(screen.getByTestId('progress-section-ORD')).toHaveAttribute(
      'aria-describedby',
      'fa-fr-caveat',
    )
  })
  it.each([
    'studio',
    'phone',
  ])('renders each half range with its own soft band in %s', (viewport) => {
    extras.viewport = viewport
    const data = stats()
    const p = computeHonestProjected(data.bySection)
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    for (const [half, label] of [
      ['verbal', 'Verbal'],
      ['quant', 'Kvant'],
    ] as const) {
      const low = Math.max(0, p[half]! - p[`${half}Band`]!)
      const high = Math.min(2, p[half]! + p[`${half}Band`]!)
      const row = screen.getByTestId(`framsteg-half-${half}`)
      expect(row).toHaveTextContent(`${label} ${formatScoreSv(low)}–${formatScoreSv(high)}`)
      const band = row.querySelector<HTMLElement>('.fa-fr-band')!
      expect(band).not.toBeNull()
      expect(band.querySelector('.fa-ui-band')).toHaveAttribute('data-size', 'mini')
      expect(band.querySelector('.fa-ui-band-plot')).toHaveAttribute('aria-hidden', 'true')
      const fill = band.querySelector<HTMLElement>('.fa-ui-band-range')!
      const left =
        Number.parseFloat(fill.style.left) +
        Number.parseFloat(band.style.getPropertyValue('--fa-fr-band-shift'))
      const width = Number.parseFloat(band.style.getPropertyValue('--fa-fr-band-width'))
      for (const [edge, value] of [
        ['start', low],
        ['end', high],
      ] as const) {
        const stop = Number.parseFloat(band.style.getPropertyValue(`--fa-fr-band-core-${edge}`))
        expect((left + (width * stop) / 100) / 50).toBeCloseTo(value, 5)
      }
    }
  })
  it('rounds displayed half ranges and total identically when their endpoints match', () => {
    const data = stats()
    for (const s of SECTION_KEYS)
      Object.assign(data.bySection[s], { firstTry90d: 10000, firstTryCorrect90d: 5750 })
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(screen.getByTestId('progress-projected')).toHaveTextContent(/^1,0–1,3$/)
    expect(screen.getByTestId('framsteg-half-verbal')).toHaveTextContent('Verbal 1,0–1,3')
    expect(screen.getByTestId('framsteg-half-quant')).toHaveTextContent('Kvant 1,0–1,3')
  })
  it.each(['studio', 'phone'])('names the sitting and full date in %s', (viewport) => {
    extras.viewport = viewport
    const { rerender } = render(
      <FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />,
    )
    expect(screen.getByText('170 dagar kvar · vårprovet 10 april')).toBeInTheDocument()
    extras.sitting.date = new Date(2027, 9, 24)
    extras.days = 40
    rerender(<FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />)
    expect(screen.getByText('40 dagar kvar · höstprovet 24 oktober')).toBeInTheDocument()
    expect(screen.getByTestId('progress-historik')).toHaveAttribute('href', '/historik')
  })
  it('gives both other ways their real durations and explanatory sublines', () => {
    render(<FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />)
    const more = screen.getByRole('region', { name: 'Fler sätt att smalna intervallet' })
    const repetition = within(more).getByRole('link', { name: /Repetera · tio frågor, ca 8 min/ })
    expect(repetition).toHaveTextContent(
      'Missar som kommer tillbaka i rätt tid är de billigaste poängen.',
    )
    expect(repetition).toHaveAttribute('href', '/repetition')
    const mock = within(more).getByRole('link', { name: /Ett riktigt provpass · 55 min/ })
    expect(mock).toHaveTextContent('Ett verbalt pass ger LÄS, MEK och ELF tio svar var')
    expect(mock).not.toHaveTextContent('i stället för tre')
    expect(mock).toHaveAttribute('href', '/prov')
    fireEvent.click(repetition)
    expect(navigateHref).toHaveBeenLastCalledWith('/repetition')
    fireEvent.click(mock)
    expect(navigateHref).toHaveBeenLastCalledWith('/prov')
  })
  it('keeps the selected sitting label when an older extras source has no date', () => {
    extras.sitting.date = undefined
    render(<FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />)
    expect(screen.getByText('170 dagar kvar · vårprov 27')).toBeInTheDocument()
    expect(screen.queryByText(/10 april/)).not.toBeInTheDocument()
  })
  it('shows a single-answer section as a glimpse without a score promise or a lever', () => {
    const data = stats()
    for (const s of SECTION_KEYS)
      Object.assign(data.bySection[s], { firstTry90d: 20, firstTryCorrect90d: 14 })
    Object.assign(data.bySection.MEK, { firstTry90d: 1, firstTryCorrect90d: 1 })
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    const row = screen.getByTestId('progress-section-MEK')
    expect(row).toHaveTextContent('1 av 1 · första glimt')
    expect(row).not.toHaveTextContent(/2,0|Håll/)
    expect(row.querySelector('.fa-ui-band')).toBeNull()
    expect(screen.getByTestId('framsteg-primary')).not.toHaveTextContent('MEK')
  })
  it('keeps tied evidence neutral with one lever and no ordinal comparison', () => {
    const data = stats()
    for (const s of SECTION_KEYS)
      Object.assign(data.bySection[s], { firstTry90d: 100, firstTryCorrect90d: 75 })
    const { container } = render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    expect(screen.getByTestId('folio-framsteg-next')).not.toHaveTextContent(
      /lägst|näst|tredje|mest|på väg ner/i,
    )
    expect(screen.queryByRole('region', { name: 'Sedan' })).not.toBeInTheDocument()
  })
  it('describes marked section rows only when the caveat is rendered', () => {
    const data = stats()
    data.bySection.LÄS.attempts90d = 0
    data.bySection.LÄS.estimateBasis = { authentic: 0, synthetic: 0, calibrated: false }
    const { container, rerender } = render(
      <FolioFramsteg stats={{ data }} navigateHref={navigateHref} />,
    )
    expect(container.querySelector('#fa-fr-caveat')).not.toBeInTheDocument()
    expect(screen.getByTestId('progress-section-LÄS')).not.toHaveAttribute('aria-describedby')
    data.bySection.LÄS.attempts90d = 100
    data.bySection.LÄS.estimateBasis = { authentic: 0, synthetic: 100, calibrated: false }
    rerender(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(container.querySelector('#fa-fr-caveat')).toBeInTheDocument()
    expect(screen.getByTestId('progress-section-LÄS')).toHaveAttribute(
      'aria-describedby',
      'fa-fr-caveat',
    )
  })
  it('renders a noncollapsed range in both visible and accessible prognosis text', () => {
    const data = stats()
    for (const s of SECTION_KEYS)
      Object.assign(data.bySection[s], { firstTry90d: 10000, firstTryCorrect90d: 9500 })
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(screen.getByTestId('progress-projected')).toHaveTextContent(/^1,8–2,0$/)
    expect(
      screen.getByRole('img', { name: 'Prognos 1,9 av 2,0, intervall 1,8–2,0' }),
    ).toBeInTheDocument()
  })
  it('keeps the common half explanation as a glimpse grows into a section interval', () => {
    const data = stats()
    Object.assign(data.bySection.MEK, { firstTry90d: 1, firstTryCorrect90d: 0 })
    const { rerender } = render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    for (const n of [1, 2, 10]) {
      data.bySection.MEK.firstTry90d = n
      rerender(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
      expect(screen.getAllByText(/Totalen är medelvärdet av halvorna/)).toHaveLength(1)
      const row = screen.getByTestId('progress-section-MEK')
      expect(row.querySelector('.fa-ui-band') != null).toBe(n === 10)
      expect(row).not.toHaveTextContent('Håll')
    }
  })
  it.each([
    { fractions: [] },
    { fractions: [0.5] },
    { fractions: [0.5, null] },
  ])('keeps the chart absent until two weeks have scores ($fractions)', ({ fractions }) => {
    const data = stats()
    data.weekly = fractions.map((fraction, i) => ({
      weekStart: Date.UTC(2026, 9, 5 + i * 7),
      attempts: fraction == null ? 0 : 10,
      correct: fraction == null ? 0 : fraction * 10,
    }))
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(screen.getByText('Kurvan börjar när du har övat två veckor.')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Poäng per vecka/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Visa som tabell' })).not.toBeInTheDocument()
  })
  it.each([
    'ready',
    'empty',
    'loading',
    'error',
    'phone',
  ] as const)('has no axe violations in %s', async (state) => {
    const data = stats()
    if (state === 'empty') data.bySection = {} as Stats['bySection']
    if (state === 'phone') extras.viewport = 'phone'
    const { container } = render(
      <main data-folio>
        <FolioFramsteg
          stats={
            state === 'loading'
              ? { isPending: true }
              : state === 'error'
                ? { isError: true }
                : { data }
          }
          navigateHref={navigateHref}
        />
      </main>,
    )
    if (state === 'ready' || state === 'phone')
      fireEvent.click(screen.getByRole('button', { name: 'Visa som tabell' }))
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(result.violations).toEqual([])
  })
})
