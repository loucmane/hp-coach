import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetFrameworkCache, loadProvteknik, wiredSections } from './frameworks'
import { SECTION_KEYS } from './questions'

function chapterData() {
  return JSON.parse(readFileSync(path.resolve('..', 'frameworks/provteknik.json'), 'utf8'))
}

describe('Provteknik content', () => {
  it('has unique stable IDs, plain text and valid optional lists and tables', () => {
    const chapter = chapterData()
    expect(chapter.chapter).toBe('provteknik')
    expect(chapter.entries).toHaveLength(6)
    const ids = new Set<string>()
    for (const entry of chapter.entries) {
      expect(entry.id).toMatch(/^PROV-\d{3}$/)
      expect(ids.has(entry.id)).toBe(false)
      ids.add(entry.id)
      expect(entry.delprov === null || SECTION_KEYS.includes(entry.delprov)).toBe(true)
      expect(entry.headline).toEqual(expect.any(String))
      expect(entry.headline.trim().length).toBeGreaterThan(0)
      expect(entry.body).toEqual(expect.any(String))
      expect(entry.body.trim().length).toBeGreaterThan(0)
      expect(JSON.stringify(entry)).not.toMatch(/valens|agnostisk|angreppsprotokoll/i)
      if (entry.steps !== undefined) {
        expect(Array.isArray(entry.steps)).toBe(true)
        expect(entry.steps.length).toBeGreaterThan(0)
        for (const step of entry.steps) expect(step).toEqual(expect.stringMatching(/\S/))
      }
      if (entry.table !== undefined) {
        expect(Array.isArray(entry.table)).toBe(true)
        for (const row of entry.table) {
          expect(row).toHaveLength(2)
          for (const cell of row) expect(cell).toEqual(expect.stringMatching(/\S/))
        }
      }
    }
    expect(chapter.entries.map((entry: { delprov: string | null }) => entry.delprov)).toEqual([
      null,
      null,
      'LÄS',
      'DTK',
      'NOG',
      'KVA',
    ])
  })

  it('uses the question bank’s printed NOG options verbatim and in A–E order', () => {
    const bank = JSON.parse(readFileSync(path.resolve('public/data/host-ver1-2019.json'), 'utf8'))
    const nog = bank.find((q: { qid: string }) => q.qid === 'host-ver1-2019-kvant1-NOG-023')
    expect(nog).toBeDefined()
    const entry = chapterData().entries.find((e: { delprov: string }) => e.delprov === 'NOG')
    expect(entry.table).toEqual(
      nog.options.map((option: { letter: string; text: string }) => [option.letter, option.text]),
    )
  })
})

describe('loadProvteknik', () => {
  beforeEach(() => __resetFrameworkCache())
  afterEach(() => vi.unstubAllGlobals())

  it('memoises a separate static request without changing the wired sections', async () => {
    const data = chapterData()
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)))
    vi.stubGlobal('fetch', fetcher)
    const results = await Promise.all([loadProvteknik(), loadProvteknik()])
    expect(results).toEqual([data, data])
    await loadProvteknik()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('/frameworks/provteknik.json')
    expect(wiredSections().sort()).toEqual([...SECTION_KEYS].sort())
  })

  it('returns null for a missing chapter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))
    await expect(loadProvteknik()).resolves.toBeNull()
  })

  it('reports server and network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    await expect(loadProvteknik()).rejects.toThrow('503')
    __resetFrameworkCache()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(loadProvteknik()).rejects.toThrow('offline')
  })
})
