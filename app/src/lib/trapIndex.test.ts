// Trap index — the qid → Layer 1 framework id map Repetera uses to repeat a
// miss through a NEW question with the same trap (hpf-bz6f.2). Covers:
//   1) The committed app/public/trap-index.json is exactly what
//      scripts/build_trap_index.mjs derives from the explanations, so the
//      index can never drift from the corpus it is built from.
//   2) The file carries ids only — it is served as a public static asset,
//      unlike the gated explanations it is derived from.
//   3) buildTrapIndex lookups in both directions.
//   4) loadTrapIndex: one memoised static fetch, 404 = no traps, a failed
//      load is dropped so the next call retries.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  __resetTrapIndexCache,
  buildTrapIndex,
  loadTrapIndex,
  TRAP_INDEX_URL,
  type TrapIndexFile,
} from './trapIndex'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..')
const INDEX_FILE = path.join(REPO, 'app', 'public', 'trap-index.json')
const GENERATOR = path.join(REPO, 'scripts', 'build_trap_index.mjs')

describe('committed trap index', () => {
  it('equals what scripts/build_trap_index.mjs derives from the explanations', () => {
    // The generator's own --check exits non-zero when the committed file is
    // stale. It runs as a child process: Vitest will not import a module
    // from outside app/ by file URL.
    expect(() =>
      execFileSync(process.execPath, [GENERATOR, '--check'], { stdio: 'pipe' }),
    ).not.toThrow()
  })

  it('maps question ids to trap ids and nothing else (the file is public)', () => {
    const file = JSON.parse(readFileSync(INDEX_FILE, 'utf-8')) as TrapIndexFile
    expect(Object.keys(file).sort()).toEqual(['generator', 'traps', 'version'])
    expect(file.version).toBe(1)
    const entries = Object.entries(file.traps)
    expect(entries.length).toBeGreaterThan(0)
    for (const [qid, trap] of entries) {
      expect(qid).toMatch(/^[a-z0-9-]+-(ORD|LÄS|MEK|ELF|XYZ|KVA|NOG|DTK)-\d{3}$/)
      expect(trap).toMatch(/^[A-Z]{3}-[A-Z]+-\d{3}$/)
    }
  })
})

describe('buildTrapIndex', () => {
  const index = buildTrapIndex({ c: 'T1', a: 'T1', b: 'T2' })

  it('gives the trap a question carries, or null', () => {
    expect(index.trapOf('a')).toBe('T1')
    expect(index.trapOf('b')).toBe('T2')
    expect(index.trapOf('zzz')).toBeNull()
  })

  it('lists the questions of a trap in qid order', () => {
    expect(index.qidsFor('T1')).toEqual(['a', 'c'])
    expect(index.qidsFor('T2')).toEqual(['b'])
    expect(index.qidsFor('nope')).toEqual([])
  })
})

describe('loadTrapIndex', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    __resetTrapIndexCache()
  })

  function serve(...responses: Array<() => Response>) {
    const fetchMock = vi.fn(async () => {
      const next = responses.shift()
      if (!next) throw new Error('unexpected fetch')
      return next()
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  const file = (traps: Record<string, string>): TrapIndexFile => ({
    version: 1,
    generator: 'scripts/build_trap_index.mjs',
    traps,
  })

  it('fetches the static index once and shares it', async () => {
    const fetchMock = serve(() => Response.json(file({ q1: 'T1', q2: 'T1' })))
    const [a, b] = await Promise.all([loadTrapIndex(), loadTrapIndex()])
    expect(a).toBe(b)
    expect(await loadTrapIndex()).toBe(a)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(TRAP_INDEX_URL)
    expect(a.qidsFor('T1')).toEqual(['q1', 'q2'])
    expect(a.trapOf('q2')).toBe('T1')
  })

  it('reads a missing index (404) as no traps at all', async () => {
    serve(() => new Response('not found', { status: 404 }))
    const index = await loadTrapIndex()
    expect(index.trapOf('q1')).toBeNull()
    expect(index.qidsFor('T1')).toEqual([])
  })

  it('drops a failed load so the next call retries', async () => {
    const fetchMock = serve(
      () => new Response('boom', { status: 503 }),
      () => Response.json(file({ q1: 'T9' })),
    )
    await expect(loadTrapIndex()).rejects.toThrow(/503/)
    const index = await loadTrapIndex()
    expect(index.trapOf('q1')).toBe('T9')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('rejects a payload that is not a trap index', async () => {
    serve(() => Response.json({ hello: 'world' }))
    await expect(loadTrapIndex()).rejects.toThrow(/trap index/)
  })
})
