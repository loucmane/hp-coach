import { act, render } from '@testing-library/react'
import { createElement, type FunctionComponent } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const clerk = vi.hoisted(() => ({
  isSignedIn: false,
  create: vi.fn(),
  setActive: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('@clerk/clerk-react', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: clerk.create },
    setActive: clerk.setActive,
  }),
  useAuth: () => ({ isLoaded: true, isSignedIn: clerk.isSignedIn }),
  useClerk: () => ({ signOut: clerk.signOut }),
}))
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => clerk.navigate,
}))
vi.mock('@/lib/motion', () => ({ useFirstContentSignal: () => {} }))

import { devLoginErrorText, Route } from './dev-login'

const Screen = Route.options.component as FunctionComponent

describe('devLoginErrorText', () => {
  it('reads the long message of a Clerk API error, whose own message is empty', () => {
    const err = Object.assign(new Error(''), {
      errors: [{ message: 'Session exists', longMessage: "You're already signed in." }],
    })
    expect(devLoginErrorText(err)).toBe("You're already signed in.")
  })

  it('falls back to the short Clerk message, then the error message', () => {
    expect(devLoginErrorText({ errors: [{ message: 'Invalid ticket' }] })).toBe('Invalid ticket')
    expect(devLoginErrorText(new Error('HTTP 503'))).toBe('HTTP 503')
  })

  it('never returns an empty string', () => {
    expect(devLoginErrorText(new Error(''))).toBe('okänt fel')
    expect(devLoginErrorText(undefined)).toBe('okänt fel')
  })
})

describe('the dev login screen', () => {
  let release: (value: Response) => void
  beforeEach(() => {
    clerk.isSignedIn = false
    for (const fn of [clerk.create, clerk.setActive, clerk.signOut, clerk.navigate]) fn.mockReset()
    clerk.create.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_1' })
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            release = resolve
          }),
      ),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  const token = () => new Response(JSON.stringify({ token: 'tkt' }), { status: 200 })

  it('exchanges the ticket, activates the session and goes home', async () => {
    render(createElement(Screen))
    await act(async () => release(token()))
    expect(clerk.create).toHaveBeenCalledWith({ strategy: 'ticket', ticket: 'tkt' })
    expect(clerk.setActive).toHaveBeenCalledWith({ session: 'sess_1' })
    expect(clerk.navigate).toHaveBeenCalledWith({ to: '/' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does nothing more once the page is left while the token is pending', async () => {
    const view = render(createElement(Screen))
    view.unmount()
    await act(async () => release(token()))
    expect(clerk.create).not.toHaveBeenCalled()
    expect(clerk.setActive).not.toHaveBeenCalled()
    expect(clerk.navigate).not.toHaveBeenCalled()
  })

  it('signs out an existing session first and fetches no token', async () => {
    clerk.isSignedIn = true
    clerk.signOut.mockResolvedValue(undefined)
    await act(async () => {
      render(createElement(Screen))
    })
    expect(clerk.signOut).toHaveBeenCalledWith({ redirectUrl: window.location.href })
    expect(fetch).not.toHaveBeenCalled()
    expect(clerk.create).not.toHaveBeenCalled()
  })
})
