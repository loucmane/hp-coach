// /api/explanations/feedback — "Hjälpte förklaringen?" on the server (LJ-16).
//
// Real SQL over the in-memory D1 harness, sent through the production worker,
// so the mount under the authed API and its Clerk check are what these tests
// reach. Only Clerk's token verification and Sentry are stubbed.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import worker from '../index'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env } from '../types'

const verifyToken = vi.hoisted(() => vi.fn())
vi.mock('@clerk/backend', () => ({ verifyToken, createClerkClient: vi.fn() }))
vi.mock('@sentry/cloudflare', () => ({
  withSentry: (_options: unknown, handler: unknown) => handler,
  captureException: vi.fn(),
}))

const ORD = 'var-2024-verb1-ORD-001'
// Not ASCII, so it travels percent-encoded in the path.
const LAS = 'var-2024-verb1-LÄS-011'
// The corpus-import spelling lib/section.ts still reads as LÄS.
const LEGACY_LAS = 'var-2024-verb1-LAS-011'
const P5 = 'p5-las-b19-002-r1-LÄS-001'
const NOG = 'var-2018-1-kvant1-NOG-026'

const T0 = new Date('2026-11-23T10:00:00Z')
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000)

let d1: ShimD1
let env: Env

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(T0)
  d1 = makeTestD1()
  env = { DB: d1, ENVIRONMENT: 'dev' } as unknown as Env
  verifyToken.mockReset().mockImplementation(async (token: string) => {
    if (token !== 'user_a' && token !== 'user_b') throw new Error('Invalid token')
    return { sub: token }
  })
})

afterEach(() => vi.useRealTimers())

function call(method: string, path: string, token: string | null, body?: unknown) {
  const headers: Record<string, string> = {}
  if (token !== null) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  return worker.fetch!(
    new Request(`https://test.invalid${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
    {} as ExecutionContext,
  )
}

const put = (qid: string, body: unknown, token: string | null = 'user_a') =>
  call('PUT', `/api/explanations/feedback/${encodeURIComponent(qid)}`, token, body)

const list = (token: string | null = 'user_a', query = '') =>
  call('GET', `/api/explanations/feedback${query}`, token)

type Listed = {
  feedback: Array<{
    qid: string
    verdict: string
    note: string | null
    model: string | null
    createdAt: string
  }>
}

async function listed(token = 'user_a', query = ''): Promise<Listed['feedback']> {
  const res = await list(token, query)
  expect(res.status).toBe(200)
  return ((await res.json()) as Listed).feedback
}

type Row = {
  user: string
  qid: string
  verdict: string
  note: string | null
  model: string | null
  created_at: number
}

/** Every stored answer, with its owner's Clerk id, in insertion order. */
async function stored(): Promise<Row[]> {
  const { results } = await d1
    .prepare(
      `SELECT u.clerk_user_id AS user, f.qid, f.verdict, f.note, f.model, f.created_at
       FROM explanation_feedback f JOIN users u ON u.id = f.user_id ORDER BY f.id`,
    )
    .all<Row>()
  return results
}

const seconds = (d: Date) => Math.floor(d.getTime() / 1000)

describe('PUT /api/explanations/feedback/:qid', () => {
  it('stores the answer for the signed-in user and returns it', async () => {
    const res = await put(ORD, { verdict: 'delvis', note: 'Delvis', model: 'claude-opus-4-7' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      feedback: {
        qid: ORD,
        verdict: 'delvis',
        note: 'Delvis',
        model: 'claude-opus-4-7',
        createdAt: T0.toISOString(),
      },
    })
    expect(await stored()).toEqual([
      {
        user: 'user_a',
        qid: ORD,
        verdict: 'delvis',
        note: 'Delvis',
        model: 'claude-opus-4-7',
        created_at: seconds(T0),
      },
    ])
  })

  it('a second PUT replaces the first: one row, the later answer and its time', async () => {
    expect(
      (await put(ORD, { verdict: 'nej', note: 'Steg 3 hoppar över', model: 'claude-fable-5' }))
        .status,
    ).toBe(200)
    vi.setSystemTime(at(5))
    expect((await put(ORD, { verdict: 'ja' })).status).toBe(200)
    // The later answer replaces the whole row: a note or model it leaves out
    // is gone, not carried over from the earlier answer.
    expect(await stored()).toEqual([
      {
        user: 'user_a',
        qid: ORD,
        verdict: 'ja',
        note: null,
        model: null,
        created_at: seconds(at(5)),
      },
    ])
  })

  it('takes every question id shape the bank uses, LÄS percent-encoded included', async () => {
    for (const qid of [ORD, LAS, LEGACY_LAS, P5, NOG]) {
      const res = await put(qid, { verdict: 'ja' })
      expect(res.status).toBe(200)
      expect(((await res.json()) as { feedback: { qid: string } }).feedback.qid).toBe(qid)
    }
    expect((await stored()).map((r) => r.qid)).toEqual([ORD, LAS, LEGACY_LAS, P5, NOG])
  })

  it('takes a note of exactly 500 characters', async () => {
    const note = 'x'.repeat(500)
    expect((await put(ORD, { verdict: 'delvis', note })).status).toBe(200)
    expect((await stored())[0].note).toBe(note)
  })

  it('refuses a body it does not know, writing nothing', async () => {
    for (const body of [
      {}, // no verdict
      { verdict: 'kanske' }, // not Ja, Delvis or Nej
      { verdict: 'Ja' }, // the button label, not the stored value
      { verdict: 'approved' }, // the client's status, unmapped
      { verdict: 'ja', note: 'x'.repeat(501) }, // a note over 500 characters
      { verdict: 'ja', note: 17 },
      { verdict: 'ja', note: null },
      { verdict: 'ja', model: '' },
      { verdict: 'ja', model: 'm'.repeat(101) },
      { verdict: 'ja', userId: 2 }, // no field picks the owner
      { verdict: 'ja', qid: NOG }, // nor the question
      null,
      'ja',
      ['ja'],
    ]) {
      expect((await put(ORD, body)).status).toBe(400)
    }
    expect(await stored()).toEqual([])
  })

  it('refuses anything but a question id in the path, writing nothing', async () => {
    for (const qid of [
      'q1', // a seed id, not a qid
      `${ORD}~${NOG}`, // a Repetera plan link
      'host-2022-kvant2-KVA-17', // a two-digit number
      'host-2022-kvant2-kva-017', // a lower-case section
      'host-2022-kvant2-ABC-017', // not a section
      'KVA-017', // no sitting
      ` ${ORD}`, // padded
      `${'a'.repeat(73)}-ORD-001`, // 81 characters
    ]) {
      expect((await put(qid, { verdict: 'ja' })).status).toBe(400)
    }
    expect(await stored()).toEqual([])
  })

  it('keeps one answer per user and question: another user’s PUT never touches yours', async () => {
    await put(ORD, { verdict: 'nej' }, 'user_a')
    await put(ORD, { verdict: 'ja' }, 'user_b')
    await put(ORD, { verdict: 'delvis', note: 'Delvis' }, 'user_b')
    expect((await stored()).map(({ user, verdict, note }) => [user, verdict, note])).toEqual([
      ['user_a', 'nej', null],
      ['user_b', 'delvis', 'Delvis'],
    ])
  })
})

describe('GET /api/explanations/feedback', () => {
  it('lists only the signed-in user’s answers, newest first', async () => {
    await put(ORD, { verdict: 'nej' })
    vi.setSystemTime(at(1))
    await put(LAS, { verdict: 'delvis', note: 'Delvis', model: 'claude-fable-5' })
    vi.setSystemTime(at(2))
    await put(NOG, { verdict: 'ja' }, 'user_b')
    vi.setSystemTime(at(3))
    await put(P5, { verdict: 'ja', model: 'claude-opus-4-7' })
    vi.setSystemTime(at(4))
    // A changed answer is the newest answer.
    await put(ORD, { verdict: 'ja' })

    expect(await listed('user_a')).toEqual([
      { qid: ORD, verdict: 'ja', note: null, model: null, createdAt: at(4).toISOString() },
      {
        qid: P5,
        verdict: 'ja',
        note: null,
        model: 'claude-opus-4-7',
        createdAt: at(3).toISOString(),
      },
      {
        qid: LAS,
        verdict: 'delvis',
        note: 'Delvis',
        model: 'claude-fable-5',
        createdAt: at(1).toISOString(),
      },
    ])
    expect(await listed('user_b')).toEqual([
      { qid: NOG, verdict: 'ja', note: null, model: null, createdAt: at(2).toISOString() },
    ])
  })

  it('is empty for a user with no answers, and ignores a forged user in the query', async () => {
    await put(ORD, { verdict: 'nej' }, 'user_a')
    expect(await listed('user_b')).toEqual([])
    const { results } = await d1
      .prepare("SELECT id FROM users WHERE clerk_user_id = 'user_a'")
      .all<{ id: number }>()
    expect(await listed('user_b', `?userId=${results[0].id}`)).toEqual([])
  })
})

describe('authentication', () => {
  it('refuses both routes without a bearer token, or with an invalid one, writing nothing', async () => {
    for (const token of [null, 'invalid']) {
      const message = token === null ? 'Missing bearer token' : 'Invalid token'
      for (const res of [await put(ORD, { verdict: 'ja' }, token), await list(token)]) {
        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: { code: 'unauthenticated', message } })
      }
    }
    expect(await stored()).toEqual([])
    // Not even a user row is provisioned for a refused request.
    expect((await d1.prepare('SELECT id FROM users').all()).results).toEqual([])
  })
})

// The qid pattern is the one a Provpass mark is checked with (routes/sessions.ts,
// LJ-12). It is module-local there, so this route repeats it; this test keeps
// the two in step by sending the same ids to both routes.
describe('the question id pattern', () => {
  it('takes exactly the ids a Markera mark takes', async () => {
    const started = await call('POST', '/api/sessions', 'user_a', { kind: 'mock', plan: [ORD] })
    expect(started.status).toBe(201)
    const { session } = (await started.json()) as { session: { id: number } }
    for (const qid of [
      ORD,
      LAS,
      LEGACY_LAS,
      P5,
      NOG,
      'host-2014-kvant1-DTK-026',
      'host-2022-kvant2-XYZ-001',
      'var-2026-verb2-MEK-020',
      'var-2026-verb2-ELF-040',
      'q1',
      `${ORD}~${NOG}`,
      'host-2022-kvant2-KVA-17',
      'host-2022-kvant2-KVA-0170',
      'host-2022-kvant2-kva-017',
      'Host-2022-kvant2-KVA-017',
      'host-2022-kvant2-ABC-017',
      'host_2022-kvant2-KVA-017',
      'host--2022-kvant2-KVA-017',
      'KVA-017',
      ` ${ORD}`,
      `${ORD} `,
      `${'a'.repeat(72)}-ORD-001`,
      `${'a'.repeat(73)}-ORD-001`,
    ]) {
      const marked = await call('PATCH', `/api/sessions/${session.id}`, 'user_a', {
        marks: [qid],
      })
      const answered = await put(qid, { verdict: 'ja' })
      expect([qid, answered.status]).toEqual([qid, marked.status])
    }
  })
})
