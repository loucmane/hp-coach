// Unit tests for the Sentry helper. Two things matter most:
//   1. The scrubber strips every PII-bearing field (beforeSend contract).
//   2. The INERT path: with no DSN (the vitest default — VITE_SENTRY_DSN
//      unset), initSentry() must NOT call Sentry.init. This is the
//      "zero behaviour change when DSN unset" guarantee, made testable by
//      the module-level `sentryEnabled` guard.

import type { ErrorEvent } from '@sentry/react'
import * as Sentry from '@sentry/react'
import { describe, expect, it, vi } from 'vitest'

import { initSentry, resolveEnvironment, scrubEvent, sentryEnabled } from './sentry'

// Mock only `init` so we can assert the inert guard without a real
// transport. ESM live bindings can't be spied via vi.spyOn (non-
// configurable), so mock the module surface we touch.
vi.mock('@sentry/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sentry/react')>()
  return { ...actual, init: vi.fn() }
})

describe('scrubEvent', () => {
  it('drops request headers and cookies entirely', () => {
    const event = {
      request: {
        url: 'https://app.example/drill',
        headers: { Authorization: 'Bearer secret', Cookie: '__session=abc' },
        cookies: { __session: 'abc' },
      },
    } as unknown as ErrorEvent

    const out = scrubEvent(event)

    expect(out?.request?.headers).toBeUndefined()
    expect(out?.request?.cookies).toBeUndefined()
  })

  it('strips the query string from the request URL and query_string', () => {
    const event = {
      request: {
        url: 'https://app.example/drill?token=abc&answer=B',
        query_string: 'token=abc&answer=B',
      },
    } as unknown as ErrorEvent

    const out = scrubEvent(event)

    expect(out?.request?.url).toBe('https://app.example/drill')
    expect(out?.request?.query_string).toBeUndefined()
  })

  it('drops breadcrumb data bodies, keeping only a de-queried url', () => {
    const event = {
      breadcrumbs: [
        { category: 'fetch', data: { url: 'https://api.example/x?t=secret', body: 'password' } },
        { category: 'ui.click', data: { target: 'button', label: 'Rätt svar' } },
      ],
    } as unknown as ErrorEvent

    const out = scrubEvent(event)
    const crumbs = out?.breadcrumbs ?? []

    expect(crumbs[0]?.data).toEqual({ url: 'https://api.example/x' })
    // A crumb with no url loses its whole data body.
    expect(crumbs[1]?.data).toBeUndefined()
  })

  it('scrubs user PII fields', () => {
    const event = {
      user: { id: 'user_123', email: 'a@b.se', ip_address: '1.2.3.4', username: 'alice' },
    } as unknown as ErrorEvent

    const out = scrubEvent(event)

    expect(out?.user?.email).toBeUndefined()
    expect(out?.user?.ip_address).toBeUndefined()
    expect(out?.user?.username).toBeUndefined()
    // Non-PII id is left intact.
    expect(out?.user?.id).toBe('user_123')
  })

  it('is a no-op on an event with no request/user/breadcrumbs', () => {
    const event = { message: 'boom' } as unknown as ErrorEvent
    expect(scrubEvent(event)).toEqual({ message: 'boom' })
  })
})

describe('resolveEnvironment', () => {
  it('prefers an explicit app env', () => {
    expect(resolveEnvironment('staging', 'whatever')).toBe('staging')
  })
  it('derives development for localhost', () => {
    expect(resolveEnvironment(undefined, 'localhost')).toBe('development')
  })
  it('derives staging for pages.dev previews', () => {
    expect(resolveEnvironment(undefined, 'pr-42.hpc-app.pages.dev')).toBe('staging')
  })
  it('derives production otherwise', () => {
    expect(resolveEnvironment(undefined, 'hp-coach.se')).toBe('production')
  })
})

describe('inert path (no DSN)', () => {
  it('sentryEnabled is false when VITE_SENTRY_DSN is unset', () => {
    // vitest runs with no VITE_SENTRY_DSN → the SDK must be inert.
    expect(sentryEnabled).toBe(false)
  })

  it('initSentry does NOT call Sentry.init when inert', () => {
    initSentry()
    expect(Sentry.init).not.toHaveBeenCalled()
  })
})
