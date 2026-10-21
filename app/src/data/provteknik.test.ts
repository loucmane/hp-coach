import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadProvteknik, PROVTEKNIK, wiredSections } from './frameworks'
import { SECTION_KEYS } from './questions'

describe('Provteknik content', () => {
  it('has unique stable IDs, plain text and valid optional lists and tables', () => {
    const chapter = PROVTEKNIK
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
    expect(chapter.entries.map((entry) => entry.delprov)).toEqual([
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
    const entry = PROVTEKNIK.entries.find((e) => e.delprov === 'NOG')
    expect(entry?.table).toEqual(
      nog.options.map((option: { letter: string; text: string }) => [option.letter, option.text]),
    )
  })

  it('quotes the question bank’s printed KVA D option verbatim', () => {
    const bank = JSON.parse(readFileSync(path.resolve('public/data/host-ver1-2019.json'), 'utf8'))
    const kva = bank.find((q: { qid: string }) => q.qid === 'host-ver1-2019-kvant1-KVA-013')
    expect(kva).toBeDefined()
    const option = kva.options.find((o: { letter: string }) => o.letter === 'D')
    expect(option).toBeDefined()
    const entry = PROVTEKNIK.entries.find((e) => e.delprov === 'KVA')
    const quotedOption = entry?.body.match(/D \(([^)]+)\)/)?.[1]
    expect(quotedOption).toBe(option.text)
  })
})

describe('loadProvteknik', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('provides the chapter synchronously offline without changing the wired sections', () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 404 }))
    vi.stubGlobal('fetch', fetcher)
    expect(loadProvteknik()).toBe(PROVTEKNIK)
    expect(loadProvteknik()).toBe(PROVTEKNIK)
    expect(fetcher).not.toHaveBeenCalled()
    expect(wiredSections().sort()).toEqual([...SECTION_KEYS].sort())
  })
})
