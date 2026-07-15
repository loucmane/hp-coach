// /konto — the deletion surface at the bottom of the account page.
//
// Owner law: "Radera konto" lives ONLY here (never in a menu), deep on the
// page. Covers: the section renders; the export-first prompt sits ABOVE the
// destructive control; the delete button is gated by a typed "radera"
// confirmation (disabled until the exact word is entered); and confirming
// runs endpoint → sign-out. Never asserts a real deletion executes end to
// end — only the gating and wiring.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── provider stubs (this surface is Clerk + router + query connected) ──

const navigate = vi.fn()
vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => navigate,
    createFileRoute: () => (opts: unknown) => ({ options: opts }),
  }
})

const signOut = vi.fn(() => Promise.resolve())
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: { fullName: 'Loucmane Benali', primaryEmailAddress: { emailAddress: 'l@example.com' } },
    isLoaded: true,
  }),
  useClerk: () => ({ signOut }),
}))

const exportMutate = vi.fn(() => Promise.resolve({ schemaVersion: 1 }))
const downloadExport = vi.fn()
vi.mock('@/api/hooks/useDataExport', () => ({
  useExportData: () => ({ mutateAsync: exportMutate, isPending: false }),
  downloadExport: (...args: unknown[]) => downloadExport(...args),
}))

const deleteMutate = vi.fn(() => Promise.resolve({ ok: true, deleted: true }))
let deletePending = false
vi.mock('@/api/hooks/useDeleteAccount', () => ({
  useDeleteAccount: () => ({ mutateAsync: deleteMutate, isPending: deletePending }),
}))

import { Route } from './konto'

// The route module default-exports its component via createFileRoute in
// production; pull the component off the mocked Route options.
const KontoRoute = (Route as unknown as { options: { component: () => JSX.Element } }).options
  .component

beforeEach(() => {
  navigate.mockClear()
  signOut.mockClear()
  exportMutate.mockClear()
  downloadExport.mockClear()
  deleteMutate.mockClear()
  deletePending = false
})

describe('/konto — deletion section', () => {
  it('renders the "Radera konto" section at the bottom of the page', () => {
    render(<KontoRoute />)
    const section = screen.getByTestId('konto-delete')
    expect(section).toBeInTheDocument()
    // House-voice honesty about what deletion means.
    expect(within(section).getByText(/allt raderas direkt/i)).toBeInTheDocument()
    expect(within(section).getByText(/inom 30 dagar/i)).toBeInTheDocument()
    expect(within(section).getByText(/går inte att ångra/i)).toBeInTheDocument()
  })

  it('offers the export-first prompt ABOVE the destructive control', () => {
    render(<KontoRoute />)
    const exportEl = screen.getByTestId('konto-delete-export')
    const submitEl = screen.getByTestId('konto-delete-submit')
    expect(exportEl).toHaveTextContent(/exportera min data först/i)
    // DOM order: the export prompt precedes the delete button (export FIRST).
    expect(
      exportEl.compareDocumentPosition(submitEl) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeGreaterThan(0)
  })

  it('runs the existing export flow when the prompt is clicked', async () => {
    render(<KontoRoute />)
    fireEvent.click(screen.getByTestId('konto-delete-export'))
    expect(exportMutate).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(downloadExport).toHaveBeenCalledTimes(1))
  })

  it('disables the delete button until the exact word "radera" is typed', () => {
    render(<KontoRoute />)
    const button = screen.getByTestId('konto-delete-submit') as HTMLButtonElement
    const input = screen.getByTestId('konto-delete-confirm')

    expect(button).toBeDisabled()

    // A near-miss does NOT arm the button.
    fireEvent.change(input, { target: { value: 'rader' } })
    expect(button).toBeDisabled()
    fireEvent.change(input, { target: { value: 'Radera' } })
    expect(button).toBeDisabled()

    // The exact word arms it.
    fireEvent.change(input, { target: { value: 'radera' } })
    expect(button).not.toBeDisabled()

    // Clearing it disarms again.
    fireEvent.change(input, { target: { value: '' } })
    expect(button).toBeDisabled()
  })

  it('does not call the delete endpoint while the button is disabled', () => {
    render(<KontoRoute />)
    fireEvent.click(screen.getByTestId('konto-delete-submit'))
    expect(deleteMutate).not.toHaveBeenCalled()
  })

  it('on confirm: calls the endpoint, then signs out, then shows a goodbye state', async () => {
    render(<KontoRoute />)
    fireEvent.change(screen.getByTestId('konto-delete-confirm'), { target: { value: 'radera' } })
    fireEvent.click(screen.getByTestId('konto-delete-submit'))

    await vi.waitFor(() => expect(deleteMutate).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(signOut).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(screen.getByTestId('konto-delete-done')).toBeInTheDocument())
    expect(screen.getByTestId('konto-delete-done')).toHaveTextContent(/kontot är raderat/i)
  })
})
