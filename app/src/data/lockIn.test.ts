import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'
import { describe, expect, it } from 'vitest'

import { loadLockIn, lockInFor } from './lockIn'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const CATALOGS = [
  'kva_traps',
  'xyz_traps',
  'nog_traps',
  'las_taxonomy',
  'elf_taxonomy',
  'mek_protocol',
  'dtk_tactics',
]
const trapIds = CATALOGS.flatMap((name) => {
  const catalog = JSON.parse(readFileSync(path.join(REPO, `frameworks/${name}.json`), 'utf8'))
  return (catalog.entries as { id: string }[]).map((entry) => entry.id)
})
const DATA = path.join(REPO, 'app/public/data')
const normalize = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').trim()
const bankPrompts = new Set(
  readdirSync(DATA)
    .filter((file) => file.endsWith('.json') && file !== '_index.json')
    .flatMap((file) => {
      const questions = JSON.parse(readFileSync(path.join(DATA, file), 'utf8'))
      return (questions as { prompt: string }[]).map((q) => normalize(q.prompt))
    }),
)

describe('Lås in det catalog', () => {
  const items = loadLockIn()

  it('covers every entry in the seven catalogs exactly once, without extras', () => {
    expect(items.map((item) => item.id).sort()).toEqual([...trapIds].sort())
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length)
  })

  it.each(trapIds)('%s has three distinct options, one answer and an explanation', (id) => {
    const item = lockInFor(id)
    expect(item).not.toBeNull()
    if (!item) throw new Error(`Missing ${id}`)
    expect(item.options).toHaveLength(3)
    expect(new Set(item.options.map(normalize)).size).toBe(3)
    for (const text of [item.prompt, item.why, ...item.options]) {
      expect(text.trim().length).toBeGreaterThan(0)
      expect(text).not.toMatch(/[\r\n]/)
    }
    expect(Number.isInteger(item.answer)).toBe(true)
    expect([0, 1, 2]).toContain(item.answer)
    expect(item.options[item.answer]).toBeTruthy()
  })

  it('uses new prompts rather than an existing exam or another retrieval item', () => {
    expect(bankPrompts.size).toBeGreaterThan(1000)
    for (const item of items) expect(bankPrompts.has(normalize(item.prompt)), item.id).toBe(false)
    expect(new Set(items.map((item) => normalize(item.prompt))).size).toBe(items.length)
  })

  it.each(trapIds)('%s has balanced, renderable math and Swedish number typography', (id) => {
    const item = lockInFor(id)
    if (!item) throw new Error(`Missing ${id}`)
    if (/^(KVA|XYZ|NOG|DTK)-/.test(id)) expect(item.prompt).toContain('\uE000')
    for (const text of [item.prompt, ...item.options, item.why]) {
      let open = false
      for (const char of text) {
        if (char === '\uE000') {
          expect(open, `${id}: nested math`).toBe(false)
          open = true
        } else if (char === '\uE001') {
          expect(open, `${id}: stray closing delimiter`).toBe(true)
          open = false
        }
      }
      expect(open, `${id}: unclosed math`).toBe(false)
      for (const match of text.matchAll(/\uE000([^\uE001]*)\uE001/g)) {
        expect(match[1].trim().length).toBeGreaterThan(0)
        expect(() => katex.renderToString(match[1], { throwOnError: true })).not.toThrow()
      }
      const prose = text.replace(/\uE000[^\uE001]*\uE001/g, '')
      expect(prose, `${id}: unwrapped expression`).not.toMatch(/[0-9=<>+−]|\\[a-zA-Z]+/)
      expect(text, `${id}: ASCII minus or decimal point`).not.toMatch(/-\s*\d|\d\.\d/)
    }
  })

  it('returns null for unsupported ids without modifying the catalog', () => {
    for (const id of ['', 'ORD-ROOT-001', 'KVA-TRAP-999', 'toString', '__proto__']) {
      expect(lockInFor(id)).toBeNull()
    }
    expect(lockInFor(trapIds[0])).toEqual(items.find((item) => item.id === trapIds[0]))
    expect(Object.isFrozen(items)).toBe(true)
    expect(Object.isFrozen(items[0])).toBe(true)
    expect(Object.isFrozen(items[0].options)).toBe(true)
  })
})

describe('lock-in copies', () => {
  it('keeps the served copy byte-identical to the canonical file', () => {
    const canonical = readFileSync(path.join(REPO, 'frameworks/lock-in/lock_in.json'))
    const served = readFileSync(path.join(REPO, 'app/public/frameworks/lock-in/lock_in.json'))
    expect(served.equals(canonical)).toBe(true)
  })
})
