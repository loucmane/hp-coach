import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import type { OrdDeck } from './ordDeck'
import { __resetOrdWordsCache, loadOrdWords, type OrdWord, pickOrdWords } from './ordWords'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const readJson = (file: string) => JSON.parse(readFileSync(path.join(REPO, file), 'utf8'))

describe('public ORD index', () => {
  it('matches the deterministic generator in a child process', () => {
    expect(() =>
      execFileSync(
        process.execPath,
        ['--max-old-space-size=3072', path.join(REPO, 'scripts/build_ord_words.mjs'), '--check'],
        { stdio: 'inherit' },
      ),
    ).not.toThrow()
  })

  it('contains only IDs, covering 540 questions as 520 headwords with all roots', () => {
    const file = readJson('app/public/ord-words.json')
    expect(Object.keys(file).sort()).toEqual(['generator', 'version', 'words'])
    expect(file.version).toBe(1)
    expect(file.generator).toBe('scripts/build_ord_words.mjs')
    const words = file.words as OrdWord[]
    const manifest = readJson('app/public/data/_index.json') as { exams: { exam_id: string }[] }
    const questions = manifest.exams
      .flatMap(({ exam_id }) => readJson(`app/public/data/${exam_id}.json`) as Question[])
      .filter((q) => q.section === 'ORD')
    const roots = readJson('app/public/frameworks/ord_roots.json') as {
      entries: { id: string; example_questions: string[] }[]
    }
    expect(words).toHaveLength(520)
    expect(questions).toHaveLength(540)
    expect(words.flatMap((w) => w.qids).sort()).toEqual(questions.map((q) => q.qid).sort())
    expect(words.map((w) => w.id)).toEqual(words.map((w) => w.id).sort())
    const byId = new Map(questions.map((q) => [q.qid, q]))
    const prompts = new Set<string>()
    for (const word of words) {
      expect(Object.keys(word).sort()).toEqual(['id', 'qids', 'roots'])
      expect(word.id).toBe([...word.qids].sort()[0])
      expect(word.qids).toEqual([...new Set(word.qids)].sort())
      const normalized = word.qids.map((qid) => {
        expect(qid).toMatch(/^[a-z0-9-]+-ORD-\d{3}$/)
        return byId.get(qid)?.prompt?.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
      })
      expect(new Set(normalized).size).toBe(1)
      const prompt = normalized[0] as string
      expect(prompts.has(prompt)).toBe(false)
      prompts.add(prompt)
      expect(word.roots).toEqual(
        roots.entries
          .filter((root) => root.example_questions.some((qid) => word.qids.includes(qid)))
          .map((root) => root.id)
          .sort(),
      )
      for (const root of word.roots) expect(root).toMatch(/^ORD-ROOT-\d{3}$/)
    }
  })
})

function question(qid: string, section: Question['section'] = 'ORD'): Question {
  return {
    qid,
    section,
    exam_id: 'host-2024',
    provpass: 'verb1',
    number: 1,
    prompt: 'Gated headword',
    options: [{ letter: 'A', text: 'Gated answer' }],
    answer: 'A',
    context: null,
    parsing_status: 'complete',
  }
}
const word = (id: string, qids = [id]): OrdWord => ({ id, qids, roots: [] })

describe('word round picker', () => {
  it('puts oldest due words first, then new words, excluding future reviews', () => {
    const words = ['new', 'later', 'recent', 'old'].map((id) => word(id))
    const deck: OrdDeck = {
      later: { box: 1, dueAt: 101, seenQids: [] },
      recent: { box: 0, dueAt: 100, seenQids: [] },
      old: { box: 2, dueAt: 50, seenQids: [] },
    }
    expect(
      pickOrdWords(
        words,
        words.map((w) => question(w.id)),
        deck,
        100,
      ).map((q) => q.qid),
    ).toEqual(['old', 'recent', 'new'])
  })

  it('takes ten distinct words and prefers unseen question variants', () => {
    const words = [word('a', ['a', 'a2']), ...Array.from({ length: 12 }, (_, i) => word(`b${i}`))]
    const bank = words.flatMap((w) => w.qids.map((qid) => question(qid)))
    const deck = { a: { box: 1, dueAt: 0, seenQids: ['a'] } }
    const picked = pickOrdWords(words, bank, deck, 100)
    expect(picked).toHaveLength(10)
    expect(picked[0]).toBe(bank[1])
    expect(picked.some((q) => q.qid === 'a')).toBe(false)
    expect(new Set(picked.map((q) => q.qid)).size).toBe(10)
  })

  it('skips stale, wrong-section and incomplete variants without shortening a viable round', () => {
    const words = [
      word('missing'),
      word('wrong'),
      word('broken'),
      word('a', ['stale', 'a']),
      ...Array.from({ length: 10 }, (_, i) => word(`b${i}`)),
    ]
    const bank = [
      question('wrong', 'MEK'),
      { ...question('broken'), options: null },
      question('a'),
      ...Array.from({ length: 10 }, (_, i) => question(`b${i}`)),
    ]
    const picked = pickOrdWords(words, bank, {}, 100)
    expect(picked).toHaveLength(10)
    expect(picked[0].qid).toBe('a')
    expect(picked.every((q) => q.section === 'ORD' && q.options !== null)).toBe(true)
  })

  it('returns empty when all words are scheduled in the future', () => {
    expect(
      pickOrdWords(
        [word('a')],
        [question('a')],
        { a: { box: 1, dueAt: 101, seenQids: ['a'] } },
        100,
      ),
    ).toEqual([])
  })
})

describe('word index loader', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    __resetOrdWordsCache()
  })
  const file = { version: 1, generator: 'scripts/build_ord_words.mjs', words: [word('a')] }

  it('shares a memoized fetch of the IDs-only public file', async () => {
    const fetchMock = vi.fn(async () => Response.json(file))
    vi.stubGlobal('fetch', fetchMock)
    const [a, b] = await Promise.all([loadOrdWords(), loadOrdWords()])
    expect(a).toBe(b)
    expect(a).toEqual(file.words)
    expect(await loadOrdWords()).toBe(a)
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/ord-words.json')
  })

  it('retries HTTP failures instead of caching an empty deck', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(Response.json(file))
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadOrdWords()).rejects.toThrow(/404/)
    await expect(loadOrdWords()).resolves.toEqual(file.words)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('rejects malformed data and lets the next call recover', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ ...file, words: [{ id: 'a' }] }))
      .mockResolvedValueOnce(Response.json(file))
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadOrdWords()).rejects.toThrow(/word index/)
    await expect(loadOrdWords()).resolves.toEqual(file.words)
  })
})
