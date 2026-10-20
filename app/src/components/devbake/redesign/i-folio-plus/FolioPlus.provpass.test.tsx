// Folio+ · Provpass: the borrowings and fixes built on Folio's pass
// (bead hpf-qr0p.48) — Spår's phone action row, the hand-in summary of
// Samtal and Ljuskägla, safe default focus in the slips, Markera that never
// swallows ↵, phone tap targets and the practice wording of the hub.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { stubLayout } from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { FolioPlus as Folio } from './FolioPlus'

type Mount = {
  data?: DirectionData
  actions?: Partial<DirectionActions>
  width?: DirectionProps['width']
}

function mount(s: DirectionProps['screen'], opts: Mount = {}) {
  const data = opts.data ?? structuredClone(FIXTURE_DATA)
  return render(
    <DirectionDataProvider data={data} actions={opts.actions}>
      <Folio
        screen={s}
        width={opts.width ?? 'desktop'}
        theme="light"
        live
        onScreen={vi.fn()}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>,
  )
}

beforeAll(stubLayout)

const RUN = FIXTURE_DATA.provpass.running
const cell = (n: number) => screen.getByTestId(`rd-prov-cell-${n}`)
const names = (els: HTMLElement[]) =>
  els.map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim())

function startPass() {
  fireEvent.click(screen.getByTestId('rd-prov-start'))
  fireEvent.click(screen.getByTestId('rd-confirm'))
}

/** A pass with every question answered but those at `blank` (1-based). */
function withBlanks(blank: number[]): DirectionData {
  const data = structuredClone(FIXTURE_DATA)
  const run = data.provpass.running
  run.answers = Object.fromEntries(
    run.questions.filter((_, i) => !blank.includes(i + 1)).map((q) => [q.qid, 'A' as const]),
  )
  return data
}

describe('Folio+ · Provpass on phone: the thumb row', () => {
  it('puts Markera · Översikt · Lämna in above Nästa, and Lämna in leaves the head', () => {
    mount(9, { width: 'phone' })
    startPass()
    const head = document.querySelector<HTMLElement>('.fp-ppass-head')
    if (!head) throw new Error('the pass has no head')
    expect(within(head).queryByRole('button', { name: /Lämna in/ })).toBeNull()
    expect(within(head).queryByRole('button', { name: 'Översikt' })).toBeNull()
    expect(within(head).getByRole('timer')).toBeInTheDocument()
    const foot = document.querySelector<HTMLElement>('.fp-pfoot')
    if (!foot) throw new Error('the pass has no foot')
    expect(foot).toContainElement(screen.getByTestId('rd-prov-submit'))
    expect(screen.getAllByTestId('rd-prov-submit')).toHaveLength(1)
    const row = within(foot).getByRole('group', { name: 'Passets verktyg' })
    expect(
      within(row)
        .getAllByRole('button')
        .map((b) => b.textContent?.trim()),
    ).toEqual(['Markera för återkomst', 'Översikt', 'Lämna in'])
    // The row comes before Nästa, which keeps the thumb's lowest place.
    const next = within(foot).getByRole('button', { name: /^Nästa fråga/ })
    expect(row.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(screen.getByRole('dialog', { name: 'Lämna in provpasset?' })).toBeInTheDocument()
  })

  it('keeps the row on a plate’s slip even at its peek, once', () => {
    mount(9, { width: 'phone' })
    startPass()
    fireEvent.click(cell(29))
    const sheet = screen.getByRole('region', { name: 'Fråga 29' })
    expect(sheet).toHaveAttribute('data-state', 'peek')
    expect(within(sheet).getByTestId('rd-prov-submit')).toBeInTheDocument()
    expect(within(sheet).getByTestId('rd-prov-flag')).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: /Visa de fyra alternativen/ }))
    expect(screen.getAllByTestId('rd-prov-submit')).toHaveLength(1)
    expect(screen.getAllByTestId('rd-prov-flag')).toHaveLength(1)
  })

  it('keeps Lämna in in the running head on desktop', () => {
    mount(9)
    startPass()
    const head = document.querySelector<HTMLElement>('.fp-runhead--pass')
    expect(head).toContainElement(screen.getByTestId('rd-prov-submit'))
  })
})

describe('Folio+ · Provpass: the hand-in summary', () => {
  it('lists the blanks as ranges and the marked as chips, each a way to its question', () => {
    const data = withBlanks([4, 5, 6, 11])
    const flags = RUN.flags ?? []
    const marked = flags.map((qid) => RUN.questions.findIndex((q) => q.qid === qid) + 1)
    mount(9, { data })
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    const slip = screen.getByRole('dialog', { name: 'Lämna in provpasset?' })
    expect(slip).toHaveTextContent('Obesvarade: 4–6, 11')
    expect(slip).toHaveTextContent('36 av 40 besvarade')
    const blanks = within(slip).getByRole('group', { name: 'Obesvarade frågor' })
    expect(names(within(blanks).getAllByRole('button'))).toEqual([
      'Till fråga 4, första av de obesvarade 4–6',
      'Till fråga 11, obesvarad',
    ])
    const chips = within(slip).getByRole('group', { name: 'Markerade frågor' })
    expect(names(within(chips).getAllByRole('button'))).toEqual(
      marked.map((n) => `Till fråga ${n}, markerad`),
    )
    fireEvent.click(within(blanks).getByRole('button', { name: /^Till fråga 4,/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cell(4)).toHaveAttribute('data-current', 'true')
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: `Till fråga ${marked[0]}, markerad`,
      }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cell(marked[0])).toHaveAttribute('data-current', 'true')
  })

  it('says so when nothing is blank or marked', () => {
    const data = withBlanks([])
    delete data.provpass.running.flags
    mount(9, { data })
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    const slip = screen.getByRole('dialog', { name: 'Lämna in provpasset?' })
    expect(slip).toHaveTextContent('Alla 40 frågor är besvarade.')
    expect(within(slip).queryByRole('group')).toBeNull()
  })

  it('opens on the safe button: ↵ goes back to the pass and never hands in', async () => {
    const user = userEvent.setup()
    const submitProvpass = vi.fn()
    mount(9, { actions: { submitProvpass } })
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    const slip = screen.getByRole('dialog', { name: 'Lämna in provpasset?' })
    expect(within(slip).getByRole('button', { name: /^Tillbaka till passet/ })).toHaveFocus()
    expect(within(slip).getByTestId('rd-confirm')).not.toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(submitProvpass).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
  })
})

describe('Folio+ · Provpass: Översikt', () => {
  it('opens on Tillbaka till passet, so ↵ never starts a hand-in', async () => {
    const user = userEvent.setup()
    const submitProvpass = vi.fn()
    mount(9, { actions: { submitProvpass } })
    startPass()
    fireEvent.click(screen.getByRole('button', { name: 'Översikt' }))
    const slip = screen.getByRole('dialog', { name: 'Översikt' })
    expect(within(slip).getByRole('button', { name: /^Tillbaka till passet/ })).toHaveFocus()
    expect(within(slip).getByRole('button', { name: /^Lämna in/ })).not.toHaveTextContent('↵')
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(submitProvpass).not.toHaveBeenCalled()
  })
})

describe('Folio+ · Provpass: Markera keeps ↵ for the next question', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('after a press on Markera, ↵ moves on and the mark stays, on %s', async (width) => {
    const user = userEvent.setup()
    mount(9, { width })
    startPass()
    const flag = screen.getByTestId('rd-prov-flag')
    await user.click(flag)
    expect(cell(17)).toHaveAttribute('data-flagged', 'true')
    await user.keyboard('{Enter}')
    expect(cell(17)).toHaveAttribute('data-flagged', 'true')
    expect(cell(18)).toHaveAttribute('data-current', 'true')
    // The mark was said, not only drawn.
    expect(screen.getByText('Fråga 17 markerad för återkomst.')).toBeInTheDocument()
  })

  it('says a mark taken back from the keyboard, too', async () => {
    const user = userEvent.setup()
    mount(9)
    startPass()
    const flag = screen.getByTestId('rd-prov-flag')
    flag.focus()
    await user.keyboard(' ')
    expect(cell(17)).toHaveAttribute('data-flagged', 'true')
    await user.keyboard(' ')
    expect(cell(17)).not.toHaveAttribute('data-flagged')
    expect(screen.getByText('Markeringen på fråga 17 är borttagen.')).toBeInTheDocument()
  })
})

describe('Folio+ · Provpass on phone: touch first', () => {
  it('shows no keyboard hint on phone, and keeps it on desktop', () => {
    const phone = mount(9, { width: 'phone' })
    startPass()
    expect(document.querySelector('.fp-keys')).toBeNull()
    phone.unmount()
    mount(9)
    startPass()
    expect(document.querySelector('.fp-keys')).not.toBeNull()
  })

  it('sets the index as its own strip of tap targets under the head', () => {
    mount(9, { width: 'phone' })
    startPass()
    const grid = screen.getByTestId('rd-prov-grid')
    expect(grid).toHaveClass('fp-passindex--strip')
    expect(grid.closest('.fp-ppass-head')).not.toBeNull()
    fireEvent.click(cell(22))
    expect(cell(22)).toHaveAttribute('data-current', 'true')
    // The hit area: at least 24 × 24 px a cell, whatever the slim mark.
    const css = readFileSync(
      join(process.cwd(), 'src/components/devbake/redesign/i-folio-plus/fpProvpass.css'),
      'utf8',
    )
    const rule = /\.fp-passindex--strip \.fp-passindex-cell[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(rule).toMatch(/min-width:\s*24px/)
    expect(rule).toMatch(/height:\s*24px/)
  })
})

describe('Folio+ · Provpass: a practice pass, not a registration', () => {
  it('words the hub as timed practice under real conditions', () => {
    mount(9)
    expect(screen.getByRole('heading', { level: 1, name: 'Öva på tid.' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Ett övningspass under riktiga provvillkor: 40 frågor på 55 minuter – ingen feedback förrän du lämnar in.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Förslag · minst sett')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Alla pass' })).toBeInTheDocument()
    const page = screen.getByTestId('rd-folio-plus')
    expect(page).not.toHaveTextContent(/Anmälan|anmälan|Kallelse|Inskriven|Register/)
  })

  it('leads back to the passes, never to an anmälan, once a pass is over', () => {
    mount(9)
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByRole('button', { name: /^Till provpassen/ })).toBeEnabled()
    expect(screen.getByTestId('rd-folio-plus')).not.toHaveTextContent(/anmälan/i)
  })
})
