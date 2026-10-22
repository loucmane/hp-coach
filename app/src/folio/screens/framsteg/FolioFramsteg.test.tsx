import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Stats } from '@/api/hooks/useStats'
import { SECTION_KEYS } from '@/data/questions'
import FolioFramsteg from './FolioFramsteg'

const extras = vi.hoisted(() => ({
  viewport: 'studio',
  days: 170,
  sitting: { label: 'Vårprov 27' },
  history: {
    data: [
      {
        id: 7,
        kind: 'drill',
        sections: 'ORD',
        total: 10,
        correct: 8,
        endedAt: '2026-10-22T12:00:00Z',
      },
    ],
  },
  due: { data: [{ questionId: '2024v-1-XYZ-1' }] },
  topTraps: [
    {
      section: 'KVA',
      framework_id: 'KVA-001',
      count: 1,
      headline: 'Jämför storheterna.',
      trend: { kind: 'unknown' },
    },
  ],
  trapNames: { 'KVA-001': 'Jämförelser' },
}))
vi.mock('./useFramstegExtras', () => ({ useFramstegExtras: () => extras }))
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
      },
    ]),
  ) as Stats['bySection'],
  weekly: [0.5, null, 0.7].map((n, i) => ({
    weekStart: Date.UTC(2026, 9, 5 + i * 7),
    attempts: n == null ? 0 : 10,
    correct: n == null ? 0 : n * 10,
  })),
  attemptsDaily: [{ date: new Date().toISOString().slice(0, 10), n: 5, verbal: 2, quant: 3 }],
})
beforeEach(() => {
  navigateHref.mockClear()
  localStorage.clear()
  extras.viewport = 'studio'
})

describe('Folio Framsteg', () => {
  it('keeps the report before the primary action and the remaining overview in order', () => {
    const { container } = render(
      <FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />,
    )
    expect(
      screen
        .getAllByRole('heading')
        .map((h) => h.textContent)
        .slice(0, 9),
    ).toEqual([
      'Framsteg',
      'Prognos',
      'Ordförståelse',
      'Nästa steg uppåt',
      'Poäng per vecka',
      'Delproven',
      'Sedan',
      'Historik',
      'Fällor',
    ])
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    expect(screen.getByTestId('progress-projected')).toHaveTextContent('1,4')
    expect(screen.getByTestId('progress-first-try-note')).toHaveTextContent('bara första försöket')
    expect(screen.getByTestId('progress-prose')).toHaveTextContent(
      '20 frågor den här veckan · 75 % rätt.',
    )
    expect(container.textContent).not.toMatch(/\b(?:serie|rekord|mål|fel)\b/i)
    expect(screen.queryByRole('link', { name: /Alla fällor/ })).not.toBeInTheDocument()
  })
  it('makes every section row, up-step, history row and trap a real destination', () => {
    render(<FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />)
    for (const s of SECTION_KEYS) {
      expect(screen.getByTestId(`progress-section-${s}`).tagName).toBe('A')
      expect(screen.getByTestId(`progress-section-${s}`)).toHaveAttribute(
        'href',
        `/lektion?section=${encodeURIComponent(s)}`,
      )
      expect(screen.getByTestId(`framsteg-up-${s}`).tagName).toBe('A')
    }
    expect(screen.getByTestId('framsteg-up-XYZ')).toHaveAttribute(
      'href',
      '/repetition?section=XYZ&start=1',
    )
    expect(screen.getByTestId('framsteg-up-KVA')).toHaveAttribute(
      'href',
      '/drill?section=KVA&framework=KVA-001&start=1',
    )
    expect(screen.getByTestId('framsteg-history-7')).toHaveAttribute('href', '/drill?done=7')
    expect(screen.getByTestId('progress-historik')).toHaveAttribute('href', '/historik')
    expect(screen.getByRole('link', { name: 'Jämförelser' })).toHaveAttribute(
      'href',
      '/drill?section=KVA&framework=KVA-001&start=1',
    )
    expect(screen.getByText('1 gång')).toBeInTheDocument()
  })
  it('runs the primary with Enter and preserves focused controls and modified links', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />,
    )
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/drill?section=ORD&start=1')
    navigateHref.mockClear()
    const link = screen.getByTestId('progress-section-XYZ')
    link.focus()
    await user.keyboard('{Enter}')
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/lektion?section=XYZ')
    navigateHref.mockClear()
    fireEvent.click(link, { ctrlKey: true })
    fireEvent.click(link, { metaKey: true })
    for (const options of [
      { repeat: true },
      { ctrlKey: true },
      { metaKey: true },
      { isComposing: true },
    ])
      fireEvent.keyDown(document.body, { key: 'Enter', ...options })
    const input = document.createElement('input')
    container.appendChild(input)
    fireEvent.keyDown(input, { key: 'Enter' })
    const page = screen.getByTestId('folio-framsteg')
    page.setAttribute('inert', '')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    page.removeAttribute('inert')
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    container.appendChild(dialog)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
  })
  it('expands the 84-day strip and the chart table with accessible controls', async () => {
    const user = userEvent.setup()
    render(<FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />)
    const heat = screen.getByTestId('folio-framsteg-week')
    expect(heat.querySelectorAll('[data-heat]')).toHaveLength(84)
    const toggle = within(heat).getByRole('button', { name: 'Visa alla veckor' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(heat).getByRole('button', { name: 'Visa färre veckor' })).toBe(toggle)
    expect(toggle).toHaveFocus()
    expect(within(heat).getByRole('table')).toBeInTheDocument()
    expect(within(heat).getByText(/En dag utan övning tar inte bort/)).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(within(heat).getByRole('button', { name: 'Visa alla veckor' })).toBe(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
    expect(within(heat).queryByRole('table')).not.toBeInTheDocument()
    const chartToggle = screen.getByRole('button', { name: 'Visa som tabell' })
    fireEvent.click(chartToggle)
    expect(chartToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('table', { name: 'Poäng per vecka' })).toHaveTextContent('ingen övning')
    fireEvent.click(chartToggle)
    expect(chartToggle).toHaveAttribute('aria-expanded', 'false')
  })
  it('renders day zero only after data resolves and keeps the retry line', () => {
    const { container, rerender } = render(
      <FolioFramsteg stats={{ isPending: true }} navigateHref={navigateHref} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    expect(screen.queryByTestId('progress-empty-cta')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Ingen prognos än')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
    rerender(<FolioFramsteg stats={{ isError: true }} navigateHref={navigateHref} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Gick inte att hämta just nu — försöker igen automatiskt.',
    )
    const data = stats()
    data.bySection = { ORD: data.bySection.ORD } as Stats['bySection']
    rerender(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(screen.getByTestId('progress-empty-cta')).toHaveAttribute('href', '/diagnostik?start=1')
    expect(container.textContent).not.toMatch(/lägst/i)
    expect(container.textContent).not.toMatch(/sedan förra veckan|inom felmarginalen/i)
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
  })
  it('keeps a single first try neutral in the ledger and up-step', () => {
    const data = stats()
    data.bySection.MEK.firstTry90d = 1
    data.bySection.MEK.firstTryCorrect90d = 1
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    const row = screen.getByTestId('progress-section-MEK')
    expect(row).toHaveTextContent('—')
    expect(row).toHaveTextContent('underlag: 1 svar')
    expect(row).not.toHaveTextContent('2,0')
    const up = screen.getByTestId('framsteg-up-MEK')
    expect(up).toHaveTextContent('Fler MEK-frågor ger ett tydligare underlag.')
    expect(up).not.toHaveTextContent(/Håll|2,0/)
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
    for (const s of SECTION_KEYS) {
      data.bySection[s].firstTry90d = 10000
      data.bySection[s].firstTryCorrect90d = 9500
    }
    render(<FolioFramsteg stats={{ data }} navigateHref={navigateHref} />)
    expect(screen.getByText('Intervall 1,8–2,0')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Prognos 1,9 av 2,0, intervall 1,8–2,0' }),
    ).toBeInTheDocument()
  })
  it('retains mastery peaks per account across decay, remounts and account switches', () => {
    const props = { stats: { data: stats() }, navigateHref }
    const { rerender, unmount } = render(
      <FolioFramsteg {...props} userId="one" patternsHeld={{ mastered: 12, total: 20 }} />,
    )
    rerender(<FolioFramsteg {...props} userId="one" patternsHeld={{ mastered: 2, total: 20 }} />)
    expect(screen.getByText('Mönster som sitter: 12 av 20')).toBeInTheDocument()
    rerender(<FolioFramsteg {...props} userId="two" patternsHeld={{ mastered: 0, total: 20 }} />)
    expect(screen.getByText('Mönster som sitter: 0 av 20')).toBeInTheDocument()
    unmount()
    render(<FolioFramsteg {...props} userId="one" patternsHeld={{ mastered: 2, total: 10 }} />)
    expect(screen.getByText('Mönster som sitter: 10 av 10')).toBeInTheDocument()
  })

  it('uses the phone layout without changing its links or count', () => {
    extras.viewport = 'phone'
    render(<FolioFramsteg stats={{ data: stats() }} navigateHref={navigateHref} />)
    expect(screen.getByTestId('folio-framsteg')).toHaveClass('fa-phome')
    expect(screen.getByText('170 dagar · vårprov 27')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Poäng per vecka/ })).toHaveAttribute(
      'viewBox',
      '0 0 350 200',
    )
    expect(screen.getByTestId('progress-historik')).toHaveAttribute('href', '/historik')
  })
  it.each([
    'ready',
    'empty',
    'loading',
  ] as const)('has no axe violations in the %s state', async (state) => {
    const data = stats()
    if (state === 'empty') data.bySection = {} as Stats['bySection']
    const { container } = render(
      <main data-folio>
        <FolioFramsteg
          stats={state === 'loading' ? { isPending: true } : { data }}
          navigateHref={navigateHref}
        />
      </main>,
    )
    if (state === 'ready') {
      fireEvent.click(screen.getByRole('button', { name: 'Visa alla veckor' }))
      fireEvent.click(screen.getByRole('button', { name: 'Visa som tabell' }))
    }
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([])
  })
})
