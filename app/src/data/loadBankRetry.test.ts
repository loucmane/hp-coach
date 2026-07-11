// Regression test for the memoised-rejected-Promise bug in loadBank.
//
// Before content-gating, loadBank stored its in-flight Promise in
// `cached` and never cleared it. That was harmless while /data/*.json
// was a public static asset that practically always resolved. Once the
// corpus moved behind auth (/api/content), the FIRST boot can fire
// before Clerk is ready and reject (401 / transport). A permanently
// cached rejected Promise meant every later loadBank() — including the
// one triggered after sign-in — resolved to the SAME rejection, so the
// bank never loaded without a hard reload.
//
// The fix drops the memo on rejection. This test proves: first attempt
// rejects, a retry re-fetches and succeeds, and the success is then
// memoised (no third fetch).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetBankCache, loadBank, type Question } from './questions'

const SAMPLE: Question[] = [
  {
    qid: 'var-test-verb1-ORD-001',
    exam_id: 'var-test',
    provpass: 'verb1',
    section: 'ORD',
    number: 1,
    prompt: 'p',
    options: [
      { letter: 'A', text: 'a' },
      { letter: 'B', text: 'b' },
    ],
    answer: 'A',
    context: null,
    parsing_status: 'complete',
  },
]

beforeEach(() => {
  __resetBankCache()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadBank rejected-Promise cache hygiene', () => {
  it('drops the memo on rejection so a retry re-fetches and succeeds', async () => {
    let call = 0
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url
      if (url.includes('/figures/dtk/')) return new Response('', { status: 404 })
      call += 1
      // First _index.json fetch of the whole load fails the ENTIRE run.
      if (url.endsWith('/_index.json')) {
        if (call === 1) throw new Error('boot-before-auth 401')
        return new Response(JSON.stringify({ exams: [{ exam_id: 'var-test' }] }), { status: 200 })
      }
      return new Response(JSON.stringify(SAMPLE), { status: 200 })
    })

    // First attempt rejects — a stale rejected Promise must NOT be cached.
    await expect(loadBank()).rejects.toThrow(/boot-before-auth/)

    // Retry: the memo was cleared, so this re-fetches and resolves.
    const bank = await loadBank()
    expect(bank).toHaveLength(1)
    expect(bank[0].qid).toBe('var-test-verb1-ORD-001')

    // A third call is fully memoised — no further fetches for _index.json.
    const before = spy.mock.calls.length
    await loadBank()
    expect(spy.mock.calls.length).toBe(before)
  })
})
