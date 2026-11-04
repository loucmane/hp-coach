import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import type { ConstraintCatalog, ProtocolCatalog, TacticCatalog, TrapCatalog } from './frameworks'

// LJ-C1b: a trap's title shows before the student guesses (Idag, Dina fällor,
// the Kapitel sidebar, next to "Gissa först"), so it is a question that names
// the situation without the answer. `tldr` states the answer, so it can't stand in.

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SERVED = path.resolve(HERE, '..', '..', 'public', 'frameworks')

const TRAP_FILES = ['kva_traps.json', 'xyz_traps.json', 'nog_traps.json']
const TITLED_FILES = [
  ...TRAP_FILES,
  'las_taxonomy.json',
  'elf_taxonomy.json',
  'mek_protocol.json',
  'dtk_tactics.json',
]
const MAX_TITLE_CHARS = 60

type TitledCatalog = TrapCatalog | TacticCatalog | ConstraintCatalog | ProtocolCatalog

function load<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(SERVED, file), 'utf8')) as T
}

describe('framework question titles', () => {
  it.each(TITLED_FILES)('gives every %s entry a short, distinct question title', (file) => {
    const { entries } = load<TitledCatalog>(file)
    expect(entries.length).toBeGreaterThan(0)
    const titles = entries.map((entry) => {
      const title = entry.question_title?.trim() ?? ''
      expect(title, entry.id).not.toBe('')
      expect(title.endsWith('?'), `${entry.id}: ${title}`).toBe(true)
      expect([...title].length, `${entry.id}: ${title}`).toBeLessThanOrEqual(MAX_TITLE_CHARS)
      if ('tldr' in entry) expect(title, entry.id).not.toBe(entry.tldr?.trim())
      return title
    })
    expect(new Set(titles).size).toBe(titles.length)
  })
})

describe('quant trap families', () => {
  it.each(TRAP_FILES)('puts every %s trap in one of 3–6 named families', (file) => {
    const { entries, families = [] } = load<TrapCatalog>(file)
    const names = families.map((family) => family.name.trim())
    expect(names.length).toBeGreaterThanOrEqual(3)
    expect(names.length).toBeLessThanOrEqual(6)
    expect(names.every(Boolean)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
    for (const family of families) {
      if (family.description !== undefined) expect(family.description.trim()).not.toBe('')
    }
    for (const entry of entries) {
      expect(names, `${entry.id}: ${entry.family}`).toContain(entry.family)
    }
    for (const name of names) {
      expect(
        entries.some((entry) => entry.family === name),
        name,
      ).toBe(true)
    }
    // Listed in the order of each family's first trap, so the UI can follow the array.
    expect([...new Set(entries.map((entry) => entry.family))]).toEqual(names)
  })
})
