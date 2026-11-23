// The explanation feedback seam, v2 (LJ-16): localStorage stays the offline
// cache and the source of every read; each answer is also PUT to the worker,
// fire-and-forget, and a PUT that failed gets one retry on the next submit or
// app load. The exported API is what Facit.tsx, ExplanationPanel.tsx,
// PedagogyPanel.tsx and coach.tsx use, so it must not change.

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  type MockInstance,
  vi,
} from 'vitest'

import { __resetContentAuth, registerContentAuth } from '@/data/contentSource'
import * as feedback from './feedback'
import {
  clearFeedback,
  type FeedbackEntry,
  type FeedbackStatus,
  getAllFeedback,
  getFeedback,
  submitFeedback,
} from './feedback'

const ORD = 'var-2024-verb1-ORD-001'
const LAS = 'var-2024-verb1-LÄS-011'
const NOG = 'host-2014-kvant1-NOG-026'
const USER_A = 'user_a'
const USER_B = 'user_b'
const MODEL = 'claude-opus-4-7'

/** A Clerk-shaped session JWT. Only its `sub` claim matters to the seam. */
function tokenFor(sub: string): string {
  const part = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${part({ alg: 'RS256', typ: 'JWT' })}.${part({ sub })}.signature`
}

function signIn(sub: string) {
  registerContentAuth(async () => tokenFor(sub))
}

function entry(qid: string, over: Partial<FeedbackEntry> = {}): FeedbackEntry {
  return {
    qid,
    status: 'approved',
    model: MODEL,
    generated_at: 1_762_000_000,
    reviewed_at: 1_795_450_000_000,
    ...over,
  }
}

/** Let the fire-and-forget sync run to its end. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

let fetchSpy: MockInstance<typeof fetch>

const PATH = '/api/explanations/feedback/'

/** Every request the seam sent, decoded. */
function sent() {
  return fetchSpy.mock.calls.map(([input, init]) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    )
    expect(url.pathname.startsWith(PATH)).toBe(true)
    const headers = new Headers(init?.headers)
    return {
      method: init?.method,
      qid: decodeURIComponent(url.pathname.slice(PATH.length)),
      authorization: headers.get('Authorization'),
      contentType: headers.get('Content-Type'),
      body: JSON.parse(String(init?.body)) as unknown,
    }
  })
}

const qidsSent = (from = 0) =>
  sent()
    .slice(from)
    .map((s) => s.qid)
    .sort()

const offline = () => Promise.reject(new TypeError('Failed to fetch'))

beforeEach(() => {
  localStorage.clear()
  __resetContentAuth()
  fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => Response.json({ feedback: null }))
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('the exported API', () => {
  it('is unchanged: the same four functions with the same signatures', () => {
    expect(Object.keys(feedback).sort()).toEqual([
      'clearFeedback',
      'getAllFeedback',
      'getFeedback',
      'submitFeedback',
    ])
    expectTypeOf<FeedbackStatus>().toEqualTypeOf<'approved' | 'rejected'>()
    expectTypeOf<FeedbackEntry>().toEqualTypeOf<{
      qid: string
      status: FeedbackStatus
      notes?: string
      model: string
      generated_at: number
      reviewed_at: number
    }>()
    expectTypeOf(submitFeedback).toEqualTypeOf<(entry: FeedbackEntry) => void>()
    expectTypeOf(getFeedback).toEqualTypeOf<(qid: string) => FeedbackEntry | null>()
    expectTypeOf(getAllFeedback).toEqualTypeOf<() => FeedbackEntry[]>()
    expectTypeOf(clearFeedback).toEqualTypeOf<(qid?: string) => void>()
  })

  it('submitFeedback still returns nothing, synchronously', async () => {
    signIn(USER_A)
    expect(submitFeedback(entry(ORD))).toBeUndefined()
    await settle()
  })
})

describe('submitFeedback, signed in', () => {
  it('still writes localStorage at once, and every read comes from it', async () => {
    signIn(USER_A)
    const answer = entry(LAS, { status: 'rejected', notes: 'Delvis' })
    submitFeedback(answer)
    // Before any PUT has run.
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(localStorage.getItem(`hpc:explanation-feedback:${LAS}`)).toBe(JSON.stringify(answer))
    expect(getFeedback(LAS)).toEqual(answer)
    expect(getAllFeedback()).toEqual([answer])
    await settle()
    // A server reply changes nothing locally.
    expect(getAllFeedback()).toEqual([answer])
  })

  it('PUTs the answer with the session token and the verdict mapped, nothing lost', async () => {
    signIn(USER_A)
    // What the Facit stores for Ja, Delvis and Nej, the QA bar's 👎, and the
    // missing-explanation flag.
    const answers: Array<[FeedbackEntry, unknown]> = [
      [entry(ORD, { notes: undefined }), { verdict: 'ja', model: MODEL }],
      [
        entry(LAS, { status: 'rejected', notes: 'Delvis' }),
        { verdict: 'delvis', note: 'Delvis', model: MODEL },
      ],
      [entry(NOG, { status: 'rejected', notes: undefined }), { verdict: 'nej', model: MODEL }],
      [
        entry('var-2024-verb1-MEK-004', { status: 'rejected', model: 'unknown' }),
        { verdict: 'nej', model: 'unknown' },
      ],
      [
        entry('var-2024-verb1-ELF-031', { status: 'rejected', model: 'missing-explanation' }),
        { verdict: 'nej', model: 'missing-explanation' },
      ],
    ]
    for (const [answer] of answers) submitFeedback(answer)
    await settle()
    expect(sent()).toEqual(
      answers.map(([answer, body]) => ({
        method: 'PUT',
        qid: answer.qid,
        authorization: `Bearer ${tokenFor(USER_A)}`,
        contentType: 'application/json',
        body,
      })),
    )
  })

  it('sends a note verbatim, cut to the 500 characters the server takes, and a known model only', async () => {
    signIn(USER_A)
    // The Facit falls back to '' when the explanation names no model.
    submitFeedback(entry(ORD, { model: '' }))
    submitFeedback(entry(NOG, { status: 'rejected', notes: `${'x'.repeat(500)}yyy` }))
    submitFeedback(entry(LAS, { model: 'm'.repeat(101) }))
    await settle()
    expect(sent().map((s) => s.body)).toEqual([
      { verdict: 'ja' },
      { verdict: 'nej', note: 'x'.repeat(500), model: MODEL },
      { verdict: 'ja' },
    ])
  })

  it('still PUTs when localStorage refuses the write', async () => {
    signIn(USER_A)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    expect(() => submitFeedback(entry(ORD))).not.toThrow()
    await settle()
    expect(qidsSent()).toEqual([ORD])
  })

  it('sends two quick answers to one question one after the other, so the later one stays', async () => {
    signIn(USER_A)
    let reply!: (res: Response) => void
    fetchSpy.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          reply = resolve
        }),
    )
    submitFeedback(entry(ORD, { status: 'rejected' }))
    submitFeedback(entry(ORD, { status: 'rejected', notes: 'Delvis' }))
    submitFeedback(entry(NOG))
    await settle()
    // Another question goes at once; the second ORD answer waits for the first.
    expect(sent().map((s) => [s.qid, s.body])).toEqual([
      [ORD, { verdict: 'nej', model: MODEL }],
      [NOG, { verdict: 'ja', model: MODEL }],
    ])
    reply(Response.json({ feedback: null }))
    await settle()
    expect(sent().map((s) => [s.qid, s.body])[2]).toEqual([
      ORD,
      { verdict: 'delvis', note: 'Delvis', model: MODEL },
    ])
  })
})

describe('a failed PUT', () => {
  it('is swallowed: nothing reaches the UI and the local answer stands', async () => {
    signIn(USER_A)
    fetchSpy.mockImplementationOnce(offline)
    fetchSpy.mockImplementationOnce(async () => new Response('down', { status: 503 }))
    expect(() => submitFeedback(entry(ORD))).not.toThrow()
    expect(() => submitFeedback(entry(NOG))).not.toThrow()
    await settle()
    expect(qidsSent()).toEqual([ORD, NOG].sort())
    expect(getFeedback(ORD)).toEqual(entry(ORD))
    expect(getFeedback(NOG)).toEqual(entry(NOG))
  })

  it('is swallowed when the token getter itself fails', async () => {
    registerContentAuth(async () => {
      throw new Error('Clerk is down')
    })
    expect(() => submitFeedback(entry(ORD))).not.toThrow()
    await settle()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getFeedback(ORD)).toEqual(entry(ORD))
  })

  it('is retried once on the next submit, with the answer stored locally', async () => {
    signIn(USER_A)
    fetchSpy.mockImplementationOnce(offline)
    const nej = entry(ORD, { status: 'rejected' })
    submitFeedback(nej)
    await settle()
    expect(qidsSent()).toEqual([ORD])

    submitFeedback(entry(NOG))
    await settle()
    expect(qidsSent(1)).toEqual([ORD, NOG].sort())
    expect(sent().find((s, i) => i > 0 && s.qid === ORD)?.body).toEqual({
      verdict: 'nej',
      model: MODEL,
    })

    // Sent: the next submit retries nothing.
    submitFeedback(entry(LAS))
    await settle()
    expect(qidsSent(3)).toEqual([LAS])
  })

  it('is retried only once: a retry that fails as well is not sent again', async () => {
    signIn(USER_A)
    fetchSpy.mockImplementationOnce(offline)
    submitFeedback(entry(ORD))
    await settle()
    // The next submit fails too: ORD's one retry is spent, NOG's first try fails.
    fetchSpy.mockImplementationOnce(offline).mockImplementationOnce(offline)
    submitFeedback(entry(NOG))
    await settle()
    expect(qidsSent(1)).toEqual([ORD, NOG].sort())

    submitFeedback(entry(LAS))
    await settle()
    // NOG gets its retry; ORD does not come back.
    expect(qidsSent(3)).toEqual([LAS, NOG].sort())
    expect(sent().filter((s) => s.qid === ORD)).toHaveLength(2)
  })

  it('is retried once on the next app load, as soon as a token getter is registered', async () => {
    signIn(USER_A)
    fetchSpy.mockImplementationOnce(offline)
    submitFeedback(entry(ORD, { status: 'rejected', notes: 'Delvis' }))
    await settle()
    expect(sent()).toHaveLength(1)

    // A fresh page load: the seam loads before <ContentAuthBridge> mounts.
    vi.resetModules()
    const source = await import('@/data/contentSource')
    await import('./feedback')
    await settle()
    expect(sent()).toHaveLength(1)
    source.registerContentAuth(async () => tokenFor(USER_A))
    await settle()
    expect(sent()).toHaveLength(2)
    expect(sent()[1]).toMatchObject({
      method: 'PUT',
      qid: ORD,
      authorization: `Bearer ${tokenFor(USER_A)}`,
      body: { verdict: 'delvis', note: 'Delvis', model: MODEL },
    })

    // The retry was spent: the load after that sends nothing.
    vi.resetModules()
    const next = await import('@/data/contentSource')
    next.registerContentAuth(async () => tokenFor(USER_A))
    await import('./feedback')
    await settle()
    expect(sent()).toHaveLength(2)
  })

  it('is replaced by a new answer to the same question, which is sent instead', async () => {
    signIn(USER_A)
    fetchSpy.mockImplementationOnce(offline)
    submitFeedback(entry(ORD, { status: 'rejected' }))
    await settle()
    submitFeedback(entry(ORD))
    await settle()
    expect(sent().map((s) => [s.qid, s.body])).toEqual([
      [ORD, { verdict: 'nej', model: MODEL }],
      [ORD, { verdict: 'ja', model: MODEL }],
    ])
    submitFeedback(entry(NOG))
    await settle()
    expect(qidsSent(2)).toEqual([NOG])
  })

  it('goes only to the account that gave the answer, never under another token', async () => {
    let session: string | null = tokenFor(USER_A)
    registerContentAuth(async () => session)
    fetchSpy.mockImplementationOnce(offline)
    submitFeedback(entry(ORD))
    await settle()

    // Someone else signs in on this device: their submit sends only theirs.
    session = tokenFor(USER_B)
    submitFeedback(entry(NOG))
    await settle()
    expect(
      sent()
        .slice(1)
        .map((s) => [s.qid, s.authorization]),
    ).toEqual([[NOG, `Bearer ${tokenFor(USER_B)}`]])

    // Back as the first account: its answer gets its retry, under its token.
    session = tokenFor(USER_A)
    submitFeedback(entry(LAS))
    await settle()
    expect(qidsSent(2)).toEqual([LAS, ORD].sort())
    expect(
      new Set(
        sent()
          .slice(2)
          .map((s) => s.authorization),
      ),
    ).toEqual(new Set([`Bearer ${tokenFor(USER_A)}`]))
  })

  it('is not brought back once the answer is cleared locally', async () => {
    signIn(USER_A)
    fetchSpy.mockImplementationOnce(offline)
    submitFeedback(entry(ORD))
    await settle()
    clearFeedback(ORD)
    submitFeedback(entry(NOG))
    await settle()
    expect(qidsSent(1)).toEqual([NOG])
  })

  it('is never listed by getAllFeedback, and clearFeedback() drops it too', async () => {
    signIn(USER_A)
    fetchSpy.mockImplementationOnce(offline)
    submitFeedback(entry(ORD))
    await settle()
    expect(getAllFeedback()).toEqual([entry(ORD)])
    clearFeedback()
    expect(getAllFeedback()).toEqual([])
    submitFeedback(entry(NOG))
    await settle()
    expect(qidsSent(1)).toEqual([NOG])
  })
})

describe('without a token', () => {
  it('keeps the local save only while signed out, and sends nothing for it later', async () => {
    let session: string | null = null
    registerContentAuth(async () => session)
    submitFeedback(entry(ORD))
    await settle()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getFeedback(ORD)).toEqual(entry(ORD))

    session = tokenFor(USER_A)
    submitFeedback(entry(NOG))
    await settle()
    expect(qidsSent()).toEqual([NOG])
  })

  it('keeps the local save only when no Clerk ever registers a token getter', async () => {
    submitFeedback(entry(ORD))
    await settle()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getFeedback(ORD)).toEqual(entry(ORD))
  })
})
