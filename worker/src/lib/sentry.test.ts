// Unit tests for the worker Sentry helper: the beforeSend scrubber and
// the inert-by-default posture (no DSN → sentryOptions carries no dsn, so
// withSentry initialises inert — zero behaviour change).

import type { ErrorEvent } from '@sentry/cloudflare'
import { describe, expect, it } from 'vitest'

import type { Env } from '../types'
import { scrubEvent, sentryOptions } from './sentry'

describe('scrubEvent (worker)', () => {
  it('drops request headers, cookies, and body data', () => {
    const event = {
      request: {
        url: 'https://api.example/api/attempts',
        headers: { authorization: 'Bearer jwt', cookie: '__session=x' },
        cookies: { __session: 'x' },
        data: { answer: 'B', token: 'secret' },
      },
    } as unknown as ErrorEvent

    const out = scrubEvent(event)

    expect(out?.request?.headers).toBeUndefined()
    expect(out?.request?.cookies).toBeUndefined()
    expect(out?.request?.data).toBeUndefined()
  })

  it('strips the query string from the URL and query_string', () => {
    const event = {
      request: { url: 'https://api.example/api/content?tok=abc', query_string: 'tok=abc' },
    } as unknown as ErrorEvent

    const out = scrubEvent(event)

    expect(out?.request?.url).toBe('https://api.example/api/content')
    expect(out?.request?.query_string).toBeUndefined()
  })

  it('drops breadcrumb data bodies', () => {
    const event = {
      breadcrumbs: [{ category: 'http', data: { url: 'https://x/y?s=1', method: 'POST' } }],
    } as unknown as ErrorEvent

    const out = scrubEvent(event)

    expect(out?.breadcrumbs?.[0]?.data).toEqual({ url: 'https://x/y' })
  })
})

describe('sentryOptions', () => {
  const baseEnv = { ENVIRONMENT: 'staging', GIT_SHA: 'abc123' } as unknown as Env

  it('is inert (no dsn) when SENTRY_DSN is unset', () => {
    const opts = sentryOptions(baseEnv)
    expect(opts.dsn).toBeUndefined()
  })

  it('carries the DSN, release, and errors-only posture when configured', () => {
    const opts = sentryOptions({ ...baseEnv, SENTRY_DSN: 'https://k@o.ingest.sentry.io/1' } as Env)
    expect(opts.dsn).toBe('https://k@o.ingest.sentry.io/1')
    expect(opts.release).toBe('abc123')
    expect(opts.environment).toBe('staging')
    expect(opts.tracesSampleRate).toBe(0)
    expect(opts.sendDefaultPii).toBe(false)
    expect(opts.beforeSend).toBe(scrubEvent)
  })
})
