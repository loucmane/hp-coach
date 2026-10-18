// Framework prerequisite graph (hpf-0026.2) — loader/validator, taught set and
// lesson-pick unit tests.
//
// The shipped graph is validated against the shipped catalogs read straight
// from disk, so a typo in frameworks/framework_prereqs.json or a drifted
// app/public copy fails here instead of quietly switching the gate off at
// runtime (the runtime fails open on an invalid graph).

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FrameworkProgressRow } from './frameworkProgress'
import {
  type PrereqEdge,
  type PrereqGraph,
  pickLessonEntry,
  prereqGraphOrNull,
  taughtEntryIds,
  validatePrereqGraph,
} from './prereqs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..')
const CANONICAL_DIR = path.join(REPO, 'frameworks')
const SERVED_DIR = path.join(REPO, 'app', 'public', 'frameworks')
const GRAPH_FILE = 'framework_prereqs.json'
const CATALOG_FILES = [
  'ord_roots.json',
  'las_taxonomy.json',
  'mek_protocol.json',
  'elf_taxonomy.json',
  'xyz_traps.json',
  'kva_traps.json',
  'nog_traps.json',
  'dtk_tactics.json',
]

function readJson(dir: string, file: string): unknown {
  return JSON.parse(readFileSync(path.join(dir, file), 'utf8'))
}

function catalogIds(dir: string): Set<string> {
  const ids = new Set<string>()
  for (const file of CATALOG_FILES) {
    const catalog = readJson(dir, file) as { entries: Array<{ id: string }> }
    for (const entry of catalog.entries) ids.add(entry.id)
  }
  return ids
}

const shipped = readJson(CANONICAL_DIR, GRAPH_FILE) as { edges: PrereqEdge[] }

function edge(from: string, to: string, strength: PrereqEdge['strength'] = 'hard'): PrereqEdge {
  return { from, to, reason: 'test', strength }
}

/** The joined error list of a graph that must be rejected. */
function rejection(raw: unknown, knownIds: ReadonlySet<string> | null = null): string {
  const result = validatePrereqGraph(raw, knownIds)
  expect(result.ok).toBe(false)
  return result.ok ? '' : result.errors.join('\n')
}

function graphOf(edges: PrereqEdge[]): PrereqGraph {
  const result = validatePrereqGraph({ version: 1, edges }, null)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.graph
}

function edgeCount(byDependent: ReadonlyMap<string, readonly string[]>): number {
  let n = 0
  for (const prereqs of byDependent.values()) n += prereqs.length
  return n
}

describe('validatePrereqGraph — the shipped graph', () => {
  it('validates against the canonical catalogs and the served copies', () => {
    for (const dir of [CANONICAL_DIR, SERVED_DIR]) {
      const result = validatePrereqGraph(shipped, catalogIds(dir))
      expect(result.ok ? [] : result.errors).toEqual([])
    }
  })

  it('indexes every edge by its dependent, split by strength', () => {
    const result = validatePrereqGraph(shipped, catalogIds(CANONICAL_DIR))
    if (!result.ok) throw new Error(result.errors.join('\n'))
    const hard = shipped.edges.filter((e) => e.strength === 'hard').length
    expect(edgeCount(result.graph.hard)).toBe(hard)
    expect(edgeCount(result.graph.soft)).toBe(shipped.edges.length - hard)
    expect(result.graph.hard.get('KVA-TRAP-014')).toEqual(['XYZ-TRAP-005'])
    expect(result.graph.hard.get('XYZ-TRAP-005')).toEqual(['XYZ-TRAP-002'])
    expect(result.graph.soft.get('NOG-TRAP-024')).toEqual(['NOG-TRAP-003'])
  })

  it('serves a byte-identical copy at app/public/frameworks', () => {
    const canonical = readFileSync(path.join(CANONICAL_DIR, GRAPH_FILE))
    const served = readFileSync(path.join(SERVED_DIR, GRAPH_FILE))
    expect(served.equals(canonical)).toBe(true)
  })
})

describe('validatePrereqGraph — rejections', () => {
  const known = new Set(['A-1', 'A-2', 'A-3'])

  it('rejects an id that is in no catalog', () => {
    expect(rejection({ version: 1, edges: [edge('A-1', 'A-9')] }, known)).toMatch(/unknown id A-9/)
  })

  it('rejects a self-loop', () => {
    expect(rejection({ version: 1, edges: [edge('A-2', 'A-2', 'soft')] }, known)).toMatch(
      /self-loop on A-2/,
    )
  })

  it('rejects a duplicate from/to pair, even with a different strength', () => {
    const edges = [edge('A-1', 'A-2'), edge('A-1', 'A-2', 'soft')]
    expect(rejection({ version: 1, edges }, known)).toMatch(/duplicate A-1 -> A-2/)
  })

  it('rejects a strength other than hard or soft', () => {
    const edges = [{ from: 'A-1', to: 'A-2', reason: 'x', strength: 'firm' }]
    expect(rejection({ version: 1, edges }, known)).toMatch(/strength must be hard or soft/)
  })

  it('rejects a cycle that only closes across hard and soft edges together', () => {
    // The hard edges alone are a chain; the soft edge closes the loop.
    const edges = [edge('A-1', 'A-2'), edge('A-2', 'A-3'), edge('A-3', 'A-1', 'soft')]
    expect(rejection({ version: 1, edges }, known)).toMatch(/cycle A-1 -> A-2 -> A-3 -> A-1/)
  })

  it('rejects a payload that is not a graph', () => {
    expect(rejection({ version: 1 }, known)).toMatch(/edges array/)
    expect(rejection('not a graph', known)).toMatch(/edges array/)
    expect(rejection({ version: 1, edges: [{ from: 'A-1' }] }, known)).toMatch(/from and to/)
  })

  it('defers only the unknown-id check while the catalog set is incomplete', () => {
    // null = a catalog failed to load, so its ids cannot be checked; every
    // structural rule still applies.
    expect(validatePrereqGraph({ version: 1, edges: [edge('A-1', 'A-9')] }, null).ok).toBe(true)
    expect(rejection({ version: 1, edges: [edge('A-9', 'A-9')] }, null)).toMatch(/self-loop/)
  })
})

describe('prereqGraphOrNull — fails open', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null with a console warning for an invalid graph', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(prereqGraphOrNull({ version: 1, edges: [edge('A-1', 'A-1')] }, null)).toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toMatch(/invalid.*fail open.*self-loop/)
  })

  it('returns null with a console warning for a missing graph', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(prereqGraphOrNull(null, null)).toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toMatch(/missing.*fail open/)
  })

  it('returns the indexed graph without a warning when the graph is valid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const graph = prereqGraphOrNull(shipped, catalogIds(SERVED_DIR))
    expect(graph?.hard.get('KVA-TRAP-014')).toEqual(['XYZ-TRAP-005'])
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('taughtEntryIds', () => {
  function row(layer1Id: string, status: string): FrameworkProgressRow {
    return { layer1Id, status, lastTransitionAt: null } as FrameworkProgressRow
  }

  it('counts every status past untaught plus the merged read set', () => {
    const rows = [
      row('A', 'learning'),
      row('B', 'practicing'),
      row('C', 'retaining'),
      row('D', 'mastered'),
      row('E', 'untaught'),
      row('F', 'graduated'), // unknown status reads as untaught
    ]
    const taught = taughtEntryIds(rows, new Set(['E', 'G']))
    expect([...taught].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'G'])
  })

  it('falls back to the read set alone when progress is unavailable', () => {
    expect([...taughtEntryIds(undefined, new Set(['A']))]).toEqual(['A'])
  })

  it('lets the newest duplicate row win, like summarizeFrameworkProgress', () => {
    const taught = taughtEntryIds([row('A', 'learning'), row('A', 'untaught')], new Set())
    expect(taught.has('A')).toBe(false)
  })
})

describe('pickLessonEntry', () => {
  const entries = (...ids: string[]) => ids.map((id) => ({ id }))
  const none: ReadonlySet<string> = new Set()

  function pick(
    input: Partial<Parameters<typeof pickLessonEntry>[0]> & { entries: Array<{ id: string }> },
  ) {
    return pickLessonEntry({
      reads: none,
      taught: input.reads ?? none,
      graph: null,
      canShow: () => true,
      ...input,
    })
  }

  it('picks the first unread entry in catalog order when the graph failed open', () => {
    expect(pick({ entries: entries('K-1', 'K-2'), reads: new Set(['K-1']) })).toEqual({
      id: 'K-2',
    })
    expect(pick({ entries: entries('K-1'), reads: new Set(['K-1']) })).toBeNull()
  })

  it('pulls forward the deepest untaught hard prerequisite of a blocked candidate', () => {
    const graph = graphOf([edge('X-2', 'X-5'), edge('X-5', 'K-14')])
    const kva = entries('K-14', 'K-15')
    expect(pick({ entries: kva, graph })).toEqual({ id: 'X-2', blockedId: 'K-14' })
    expect(pick({ entries: kva, graph, taught: new Set(['X-2']) })).toEqual({
      id: 'X-5',
      blockedId: 'K-14',
    })
    // Only the direct prerequisite has to be taught for K-14 to be introduced.
    expect(pick({ entries: kva, graph, taught: new Set(['X-5']) })).toEqual({ id: 'K-14' })
  })

  it('walks several hard prerequisites in file order', () => {
    const graph = graphOf([edge('X-1', 'K-1'), edge('X-2', 'K-1')])
    expect(pick({ entries: entries('K-1'), graph })).toEqual({ id: 'X-1', blockedId: 'K-1' })
    expect(pick({ entries: entries('K-1'), graph, taught: new Set(['X-1']) })).toEqual({
      id: 'X-2',
      blockedId: 'K-1',
    })
  })

  it('never blocks a candidate that is already past untaught', () => {
    const graph = graphOf([edge('X-5', 'K-14')])
    expect(pick({ entries: entries('K-14'), graph, taught: new Set(['K-14']) })).toEqual({
      id: 'K-14',
    })
  })

  it('falls back to the next eligible entry when the prerequisite cannot be shown, else null', () => {
    const graph = graphOf([edge('X-5', 'K-14'), edge('X-6', 'K-15')])
    const canShow = () => false
    expect(pick({ entries: entries('K-14', 'K-15', 'K-16'), graph, canShow })).toEqual({
      id: 'K-16',
    })
    expect(pick({ entries: entries('K-14', 'K-15'), graph, canShow })).toBeNull()
  })

  it('keeps catalog order on the shipped data; only cross-section hard prerequisites intervene', () => {
    // Read each catalog front to back. Every same-catalog edge points forward,
    // so the pick must be the plain next entry, except for an entry with an
    // untaught hard prerequisite in another catalog (the XYZ → KVA twins).
    const result = validatePrereqGraph(shipped, catalogIds(SERVED_DIR))
    if (!result.ok) throw new Error(result.errors.join('\n'))
    let pulled = 0
    for (const file of CATALOG_FILES) {
      const catalog = readJson(SERVED_DIR, file) as { entries: Array<{ id: string }> }
      const ids = catalog.entries.map((e) => e.id)
      ids.forEach((id, k) => {
        const reads = new Set(ids.slice(0, k))
        const got = pick({ entries: catalog.entries, reads, graph: result.graph })
        const crossCatalog = (result.graph.hard.get(id) ?? []).some((p) => !ids.includes(p))
        if (crossCatalog) {
          pulled++
          expect(got?.blockedId).toBe(id)
        } else {
          expect(got).toEqual({ id })
        }
      })
    }
    expect(pulled).toBeGreaterThan(0) // the XYZ → KVA twins
  })

  it('reorders by soft prerequisites but never blocks or pulls one forward', () => {
    // S-3 is a soft prerequisite of S-1, against catalog order.
    const graph = graphOf([edge('S-3', 'S-1', 'soft'), edge('Y-1', 'S-4', 'soft')])
    const section = entries('S-1', 'S-2', 'S-3')
    expect(pick({ entries: section, graph })).toEqual({ id: 'S-2' })
    expect(pick({ entries: section, graph, reads: new Set(['S-3']) })).toEqual({ id: 'S-1' })
    // An untaught soft prerequisite in another section never blocks.
    expect(pick({ entries: entries('S-4'), graph })).toEqual({ id: 'S-4' })
  })
})
