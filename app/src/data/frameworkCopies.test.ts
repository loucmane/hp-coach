import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..')
const CANONICAL_DIR = path.join(REPO, 'frameworks')
const SERVED_DIR = path.join(REPO, 'app', 'public', 'frameworks')

function jsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
}

const files = jsonFiles(CANONICAL_DIR)

describe('framework catalog and prerequisite graph copies', () => {
  it('serves the same JSON file inventory as the canonical directory', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(jsonFiles(SERVED_DIR)).toEqual(files)
  })

  it.each(files)('serves a byte-identical copy of %s', (file) => {
    const canonical = readFileSync(path.join(CANONICAL_DIR, file))
    const served = readFileSync(path.join(SERVED_DIR, file))
    expect(served.equals(canonical)).toBe(true)
  })
})
