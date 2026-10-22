import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COACH_BLURBS } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useExamStore } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'
import FolioKonto from './FolioKonto'
import { KontoLink } from './KontoSections'
import { useKontoExtras } from './useKontoExtras'

const state = vi.hoisted(() => ({
  user: {
    fullName: 'Test Läsare',
    firstName: null,
    primaryEmailAddress: { emailAddress: 'reader@example.test' },
  } as {
    fullName?: string | null
    firstName?: string | null
    primaryEmailAddress?: { emailAddress: string }
  } | null,
  viewport: 'studio',
  signOut: vi.fn(),
  exportData: vi.fn(),
  download: vi.fn(),
  deleteAccount: vi.fn(),
  setSitting: vi.fn(),
  setCoach: vi.fn(),
  setSmartDrill: vi.fn(),
  setMode: vi.fn(),
  setPalette: vi.fn(),
  navigate: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => state.navigate }))
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: state.user }),
  useClerk: () => ({ signOut: state.signOut }),
}))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => state.viewport }))
vi.mock('@/api/useSyncedPrefs', () => ({ useSyncedPrefs: () => state }))
vi.mock('@/api/hooks/useDataExport', () => ({
  useExportData: () => ({ mutateAsync: state.exportData }),
  downloadExport: (data: unknown) => state.download(data),
}))
vi.mock('@/api/hooks/useDeleteAccount', () => ({
  useDeleteAccount: () => ({ mutateAsync: state.deleteAccount }),
}))

const navigateHref = vi.fn()
const scrollIntoView = vi.fn()
function mount(entry: 'konto' | 'mer' = 'konto') {
  return render(
    <main data-folio>
      <FolioKonto entry={entry} navigateHref={navigateHref} />
    </main>,
  )
}
function openSlip() {
  const opener = screen.getByTestId('konto-delete')
  opener.focus()
  fireEvent.click(opener)
  return { opener, dialog: screen.getByRole('dialog', { name: 'Radera konto' }) }
}
function arm() {
  fireEvent.change(screen.getByTestId('konto-delete-confirm'), { target: { value: 'radera' } })
  return screen.getByTestId('konto-delete-submit')
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 23, 12))
  vi.clearAllMocks()
  state.user = {
    fullName: 'Test Läsare',
    primaryEmailAddress: { emailAddress: 'reader@example.test' },
  }
  state.viewport = 'studio'
  state.signOut.mockReset().mockResolvedValue(undefined)
  state.exportData.mockReset().mockResolvedValue({ schemaVersion: 1, tables: {} })
  state.download.mockReset()
  state.deleteAccount.mockReset().mockResolvedValue({ ok: true, deleted: true })
  state.setSitting
    .mockReset()
    .mockImplementation(async (id) => useExamStore.getState().setSitting(id))
  state.setCoach
    .mockReset()
    .mockImplementation(async (coach) => useCoachStore.getState().setCoach(coach))
  state.setMode.mockReset().mockImplementation(async (mode) => useUiStore.setState({ mode }))
  state.setPalette
    .mockReset()
    .mockImplementation(async (palette) => useUiStore.setState({ palette }))
  state.setSmartDrill
    .mockReset()
    .mockImplementation(async (smartDrill) => useUiStore.setState({ smartDrill }))
  useUiStore.setState({ mode: 'light', palette: 'spalt', smartDrill: true, folioPreview: true })
  useCoachStore.setState({ coach: 'taktiker' })
  useExamStore.setState({ sittingId: null })
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false
    },
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Folio Konto', () => {
  it('renders real identity, upcoming dates, plan and support without prototype placeholders', () => {
    mount()
    expect(screen.getByTestId('konto-identity')).toHaveTextContent('Test Läsare')
    expect(screen.getByTestId('konto-email')).toHaveTextContent('reader@example.test')
    expect(screen.getByText('169 dagar · vårprov 27')).toBeInTheDocument()
    expect(screen.getByText('Ett val gäller så fort du gör det.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Betalning kommer när HP-Coach blir en betald tjänst – inget att göra här ännu.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Inloggning: lösenord och tvåfaktor')).toBeInTheDocument()
    expect(
      screen.getByText('Vi svarar inom en dag — det är en person, inte ett team.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Prov:/ })).toHaveLength(2)
    expect(screen.getByText('lördag 10 april 2027')).toBeInTheDocument()
    expect(screen.getByTestId('folio-konto').textContent).not.toMatch(
      /Förhandsvisning|dogfood|styckeljus/,
    )
  })
  it('never displays a sample identity while Clerk is loading', () => {
    state.user = null
    mount()
    expect(within(screen.getByTestId('konto-identity')).queryByText('Namn')).not.toBeInTheDocument()
    expect(screen.getByTestId('konto-email')).toBeEmptyDOMElement()
  })
  it('shows an email only once when Clerk has no real name', () => {
    state.user = {
      fullName: ' ',
      firstName: ' ',
      primaryEmailAddress: { emailAddress: 'reader@example.test' },
    }
    mount()
    const identity = within(screen.getByTestId('konto-identity'))
    expect(identity.queryByText('Namn')).not.toBeInTheDocument()
    expect(identity.getAllByText('reader@example.test')).toHaveLength(1)
  })
  it.each([
    ['Prov: Höstprov 27', 'setSitting', 'host-2027', 'Prov'],
    ['Slumpat', 'setSmartDrill', false, 'Frågeurval'],
    ['Kompis', 'setCoach', 'kompis', 'Coach'],
    ['Mörkt', 'setMode', 'dark', 'Tema'],
    ['Salvia', 'setPalette', 'sage', 'Färg'],
  ] as const)('saves %s and reports a refused save beside its choice', async (label, setter, value, legend) => {
    state[setter].mockRejectedValueOnce(new Error('offline'))
    mount()
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(state[setter]).toHaveBeenCalledExactlyOnceWith(value)
    const group = screen.getByRole('group', { name: legend })
    expect(
      await within(group).findByText('Det gick inte att spara – försök igen.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: label }))
    await waitFor(() =>
      expect(
        within(group).queryByText('Det gick inte att spara – försök igen.'),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true')
  })
  it('keeps the coach blurb visible and shows the selected date and selection hint', async () => {
    mount()
    for (const [coach, blurb] of Object.entries(COACH_BLURBS)) {
      expect(screen.getByText(blurb)).toBeVisible()
      expect(
        screen.getByRole('button', { name: new RegExp(`^${coach}$`, 'i') }),
      ).toHaveAccessibleDescription(blurb)
    }
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Professor' }))
    expect(screen.getByText(COACH_BLURBS.professor)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Prov: Höstprov 27' }))
    expect(screen.getByText('söndag 24 oktober 2027')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Slumpat' }))
    expect(screen.getByText('Helt slumpade frågor.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Smart' }))
    expect(state.setSmartDrill).toHaveBeenLastCalledWith(true)
  })
  it('prevents overlapping preference writes until the current save settles', async () => {
    const saving = deferred<void>()
    state.setMode.mockReturnValueOnce(saving.promise)
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Mörkt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ros' }))
    expect(state.setPalette).not.toHaveBeenCalled()
    await act(async () => saving.resolve())
    fireEvent.click(screen.getByRole('button', { name: 'Ros' }))
    await waitFor(() => expect(state.setPalette).toHaveBeenCalledExactlyOnceWith('rose'))
  })
  it('wires every colour, theme and coach word to its own synced value', async () => {
    mount()
    const user = userEvent.setup()
    for (const [label, value] of [
      ['Spalt', 'spalt'],
      ['Sand', 'sand'],
      ['Salvia', 'sage'],
      ['Bläck', 'ink'],
      ['Ros', 'rose'],
    ]) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(state.setPalette).toHaveBeenLastCalledWith(value)
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true')
    }
    for (const [label, value] of [
      ['Ljust', 'light'],
      ['Mörkt', 'dark'],
    ]) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(state.setMode).toHaveBeenLastCalledWith(value)
    }
    for (const [label, value] of [
      ['Kompis', 'kompis'],
      ['Professor', 'professor'],
      ['Taktiker', 'taktiker'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(state.setCoach).toHaveBeenLastCalledWith(value)
      expect(screen.getByText(COACH_BLURBS[value])).toBeInTheDocument()
    }
  })
  it('shows an honest empty calendar when all published dates have passed', () => {
    vi.setSystemTime(new Date(2027, 9, 25))
    mount()
    expect(screen.queryByRole('button', { name: /^Prov:/ })).not.toBeInTheDocument()
    expect(screen.getByText('Nästa provdatum är inte publicerat här än.')).toBeInTheDocument()
    expect(screen.queryByText(/dagar ·/)).not.toBeInTheDocument()
    expect(screen.queryByText(/höstprov 27/i)).not.toBeInTheDocument()
  })
  it('keeps the last sitting countdown through the whole exam day', () => {
    vi.setSystemTime(new Date(2027, 9, 24, 23, 59))
    mount()
    expect(screen.getByText('0 dagar · höstprov 27')).toBeInTheDocument()
  })
  it('uses a device-local design choice', async () => {
    mount()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Klassisk' }))
    expect(useUiStore.getState().folioPreview).toBe(false)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Ny design (förhandsvisning)' }))
    expect(useUiStore.getState().folioPreview).toBe(true)
    expect(screen.getByText(/den här enheten/)).toBeInTheDocument()
  })
  it('opens Mer at Övningen and keeps account exit actions exclusive to Konto', () => {
    mount('mer')
    expect(screen.getByRole('heading', { name: 'Övningen' })).toHaveFocus()
    expect(window.scrollTo).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Logga ut' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('konto-delete')).not.toBeInTheDocument()
  })
  it('scrolls the document when the real shell main has visible overflow', () => {
    const { container, rerender } = render(
      <main className="fa-main" style={{ overflowY: 'visible' }}>
        <FolioKonto entry="konto" navigateHref={navigateHref} />
      </main>,
    )
    const main = container.querySelector('main')!
    main.scrollTo = vi.fn()
    rerender(
      <main className="fa-main" style={{ overflowY: 'visible' }}>
        <FolioKonto entry="mer" navigateHref={navigateHref} />
      </main>,
    )
    expect(main.scrollTo).not.toHaveBeenCalled()
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
    expect(screen.getByRole('heading', { name: 'Övningen' })).toHaveFocus()
  })
  it.each([
    'studio',
    'phone',
  ])('places the Mer heading 24px below the document viewport on %s', (viewport) => {
    state.viewport = viewport
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(180)
    const measure = HTMLElement.prototype.getBoundingClientRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.id === 'fa-kt-ovningen' ? new DOMRect(0, 420, 500, 42) : measure.call(this)
    })
    mount('mer')
    // Absolute heading Y is 600; scrolling to 576 leaves its top visible at 24.
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 576, behavior: 'instant' })
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Övningen' })).toHaveFocus()
  })
  it.each(['studio', 'phone'])('focuses each indexed part on %s', (viewport) => {
    state.viewport = viewport
    mount()
    const index = screen.getByRole('navigation', { name: 'På den här sidan' })
    expect(index).not.toHaveTextContent('·')
    for (const button of within(index).getAllByRole('button')) {
      fireEvent.click(button)
      expect(screen.getByRole('heading', { name: button.textContent! })).toHaveFocus()
    }
  })
  it('keeps real tool, help and legal links with native modified-click behavior', async () => {
    mount('mer')
    for (const path of ['diagnostik', 'prov', 'avancerat', 'coach']) {
      const link = screen.getByTestId(`mer-tool-${path}`)
      expect(link).toHaveAttribute('href', `/${path}`)
      fireEvent.click(link)
      expect(navigateHref).toHaveBeenLastCalledWith(`/${path}`)
    }
    expect(screen.getByTestId('mer-support')).toHaveAttribute('href', '/hjalp')
    expect(screen.getByTestId('konto-legal-integritet')).toHaveAttribute('href', '/integritet')
    expect(screen.getByTestId('konto-legal-villkor')).toHaveAttribute('href', '/villkor')
    navigateHref.mockClear()
    fireEvent.click(screen.getByTestId('mer-support'), { ctrlKey: true })
    fireEvent.click(screen.getByTestId('mer-support'), { metaKey: true })
    expect(navigateHref).not.toHaveBeenCalled()
    screen.getByTestId('mer-support').focus()
    await userEvent.setup().keyboard('{Enter}')
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/hjalp')
  })
  it('owns Konto navigation behind the lazy screen boundary', () => {
    render(<FolioKonto entry="konto" />)
    fireEvent.click(screen.getByTestId('mer-support'))
    expect(state.navigate).toHaveBeenCalledExactlyOnceWith({ to: '/hjalp', search: {}, hash: '' })
  })
  it('preserves search and hash through the lazy navigation helper', () => {
    function Navigation() {
      const k = useKontoExtras()
      return (
        <KontoLink href="/hjalp?from=konto#kontakt" navigateHref={k.navigateHref}>
          Hjälp
        </KontoLink>
      )
    }
    render(<Navigation />)
    fireEvent.click(screen.getByRole('link', { name: 'Hjälp' }))
    expect(state.navigate).toHaveBeenCalledExactlyOnceWith({
      to: '/hjalp',
      search: { from: 'konto' },
      hash: 'kontakt',
    })
  })
  it('exports, downloads and reports success; a failed export offers retry', async () => {
    state.exportData.mockRejectedValueOnce(new Error('offline'))
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Exportera min data →' }))
    expect(
      await screen.findByText('Kunde inte exportera just nu. Försök igen om en stund.'),
    ).toBeInTheDocument()
    expect(state.download).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    expect(await screen.findByText('Filen laddas ned.')).toBeInTheDocument()
    expect(state.download).toHaveBeenCalledExactlyOnceWith({ schemaVersion: 1, tables: {} })
  })
  it('signs out explicitly to the public home', async () => {
    mount()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Logga ut' }))
    expect(state.signOut).toHaveBeenCalledExactlyOnceWith({ redirectUrl: '/' })
  })
  it.each([
    'success',
    'failure',
  ])('disables deletion during ordinary sign-out until %s settles', async (outcome) => {
    const signingOut = deferred<void>()
    state.signOut.mockReturnValueOnce(signingOut.promise)
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Logga ut' }))
    const opener = screen.getByTestId('konto-delete')
    expect(opener).toBeDisabled()
    fireEvent.click(opener)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await act(async () =>
      outcome === 'success' ? signingOut.resolve() : signingOut.reject(new Error('offline')),
    )
    expect(opener).toBeEnabled()
  })
  it('reports a download failure and does not claim success', async () => {
    state.download.mockImplementationOnce(() => {
      throw new Error('download unavailable')
    })
    mount()
    fireEvent.click(screen.getByTestId('konto-export'))
    expect(
      await screen.findByText('Kunde inte exportera just nu. Försök igen om en stund.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Filen laddas ned.')).not.toBeInTheDocument()
  })
  it('runs one export while both export controls are available', async () => {
    const exporting = deferred<{ schemaVersion: number; tables: object }>()
    state.exportData.mockReturnValueOnce(exporting.promise)
    mount()
    fireEvent.click(screen.getByTestId('konto-export'))
    const { dialog } = openSlip()
    expect(screen.getByTestId('konto-delete-export')).toBeDisabled()
    fireEvent.click(screen.getByTestId('konto-delete-export'))
    expect(state.exportData).toHaveBeenCalledTimes(1)
    await act(async () => exporting.resolve({ schemaVersion: 1, tables: {} }))
    expect(within(dialog).getByText('Filen laddas ned.')).toBeInTheDocument()
  })
})

describe('Folio deletion slip', () => {
  it('preserves warning → export → exact-word input → grave act → cancel', () => {
    mount()
    const { dialog } = openSlip()
    const nodes = [
      within(dialog).getByText(/Allt raderas direkt/),
      screen.getByTestId('konto-delete-export'),
      screen.getByTestId('konto-delete-confirm'),
      screen.getByTestId('konto-delete-submit'),
      within(dialog).getByRole('button', { name: 'Avbryt' }),
    ]
    for (let i = 1; i < nodes.length; i++)
      expect(
        nodes[i - 1].compareDocumentPosition(nodes[i]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeGreaterThan(0)
    expect(nodes[0]).toHaveTextContent(
      'Säkerhetskopior tunnas ut inom 30 dagar. Det går inte att ångra.',
    )
    expect(screen.getByLabelText('Skriv radera för att bekräfta.')).toBe(nodes[2])
    expect(nodes[2]).toHaveFocus()
    expect(nodes[3]).toBeDisabled()
    for (const word of ['Radera', ' radera', 'radera ']) {
      fireEvent.change(nodes[2], { target: { value: word } })
      expect(nodes[3]).toBeDisabled()
    }
    expect(arm()).toBeEnabled()
    expect(dialog).not.toHaveTextContent(/förhandsvisning/i)
  })
  it('never deletes on Enter in the input or on the grave act', async () => {
    mount()
    openSlip()
    const button = arm()
    const user = userEvent.setup()
    await user.keyboard('{Enter}')
    button.focus()
    await user.keyboard('{Enter}')
    expect(state.deleteAccount).not.toHaveBeenCalled()
    await user.keyboard(' ')
    await waitFor(() => expect(state.deleteAccount).toHaveBeenCalledTimes(1))
  })
  it.each(['cancel', 'escape', 'backdrop'])('closes through %s and returns focus', (kind) => {
    mount()
    const { opener, dialog } = openSlip()
    if (kind === 'cancel') fireEvent.click(within(dialog).getByRole('button', { name: 'Avbryt' }))
    if (kind === 'escape') fireEvent(dialog, new Event('cancel', { cancelable: true }))
    if (kind === 'backdrop') fireEvent.click(dialog, { clientX: -1, clientY: -1 })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
  it('does not close when dialog content or its interior is clicked', () => {
    mount()
    const { dialog } = openSlip()
    fireEvent.click(dialog, { clientX: 0, clientY: 0 })
    fireEvent.click(within(dialog).getByText(/Allt raderas direkt/))
    expect(dialog).toBeInTheDocument()
  })
  it('requires a fresh confirmation after cancelling and reopening', () => {
    mount()
    openSlip()
    arm()
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    openSlip()
    expect(screen.getByTestId('konto-delete-confirm')).toHaveValue('')
    expect(screen.getByTestId('konto-delete-submit')).toBeDisabled()
  })
  it('exports before deletion and makes the download status visible inside the slip', async () => {
    mount()
    const { dialog } = openSlip()
    fireEvent.click(screen.getByTestId('konto-delete-export'))
    expect(await within(dialog).findByText('Filen laddas ned.')).toBeInTheDocument()
    expect(state.download).toHaveBeenCalledTimes(1)
    expect(state.deleteAccount).not.toHaveBeenCalled()
  })
  it('sends once across double clicks and disables reopening until deletion and sign-out settle', async () => {
    const deletion = deferred<{ ok: true; deleted: true }>()
    const signingOut = deferred<void>()
    state.deleteAccount.mockReturnValueOnce(deletion.promise)
    state.signOut.mockReturnValueOnce(signingOut.promise)
    mount()
    openSlip()
    const button = arm()
    fireEvent.click(button)
    fireEvent.click(button)
    expect(state.deleteAccount).toHaveBeenCalledTimes(1)
    expect(state.signOut).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    const opener = screen.getByTestId('konto-delete')
    expect(opener).toBeDisabled()
    fireEvent.click(opener)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(state.deleteAccount).toHaveBeenCalledTimes(1)
    await act(async () => deletion.resolve({ ok: true, deleted: true }))
    expect(state.signOut).toHaveBeenCalledExactlyOnceWith()
    expect(opener).toBeDisabled()
    fireEvent.click(opener)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('konto-delete-done')).not.toBeInTheDocument()
    await act(async () => signingOut.resolve())
    expect(screen.getByTestId('konto-delete-done')).toHaveTextContent('Kontot är raderat.')
    expect(screen.getByTestId('konto-delete-done')).toHaveTextContent(
      'Allt är borta. Tack för att du testade HP-Coach.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('re-arms a refused deletion and keeps the existing failure copy', async () => {
    state.deleteAccount.mockRejectedValueOnce(new Error('offline'))
    mount()
    const { dialog } = openSlip()
    fireEvent.click(arm())
    expect(
      await within(dialog).findByText('Kunde inte radera kontot. Inget raderades — försök igen.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('konto-delete-submit')).toBeEnabled()
    expect(screen.getByTestId('konto-delete')).toBeEnabled()
    expect(state.signOut).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('konto-delete-submit'))
    await screen.findByTestId('konto-delete-done')
    expect(state.deleteAccount).toHaveBeenCalledTimes(2)
  })
  it('never repeats a successful deletion when Clerk sign-out fails', async () => {
    state.signOut.mockRejectedValueOnce(new Error('Clerk unavailable'))
    mount()
    const { dialog } = openSlip()
    fireEvent.click(arm())
    const retry = await within(dialog).findByRole('button', { name: 'Försök logga ut igen' })
    expect(dialog).toHaveTextContent('Kontot är raderat, men det gick inte att logga ut.')
    expect(dialog).not.toHaveTextContent('Inget raderades')
    expect(screen.getByTestId('konto-delete-submit')).toBeDisabled()
    expect(screen.getByTestId('konto-delete')).toBeDisabled()
    fireEvent.click(retry)
    await screen.findByTestId('konto-delete-done')
    expect(state.deleteAccount).toHaveBeenCalledTimes(1)
    expect(state.signOut).toHaveBeenCalledTimes(2)
  })
  it.each(['konto', 'mer', 'slip'] as const)('has no axe violations for %s', async (entry) => {
    const { container } = mount(entry === 'mer' ? 'mer' : 'konto')
    if (entry === 'slip') openSlip()
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([])
  })
})
