import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..')

// The seven catalogs that carry question titles (LJ-C1b) are edited in
// repo-root frameworks/ and copied by hand to app/public/frameworks/.
// frameworkCopies.test.ts compares whatever the canonical directory holds;
// this pins the seven by name, so losing one from both copies fails too.
const TITLED_CATALOGS = [
  'kva_traps.json',
  'xyz_traps.json',
  'nog_traps.json',
  'las_taxonomy.json',
  'elf_taxonomy.json',
  'mek_protocol.json',
  'dtk_tactics.json',
]

describe('titled framework catalog copies', () => {
  it.each(TITLED_CATALOGS)('serves %s byte for byte as authored in frameworks/', (file) => {
    const canonical = readFileSync(path.join(REPO, 'frameworks', file))
    const served = readFileSync(path.join(REPO, 'app', 'public', 'frameworks', file))
    expect(served.equals(canonical)).toBe(true)
  })
})
