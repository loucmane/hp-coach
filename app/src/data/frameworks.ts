// Layer 1 framework bank — types + lazy loader.
//
// Mirrors `data/explanations.ts`. Framework JSON files live under
// `app/public/frameworks/` (canonical source: repo-root `frameworks/`;
// copied into SPA public dir for runtime fetch). One file per section.
//
// Each call to `loadFramework(section)` returns a memoised Promise of
// that section's framework. v1 ships NOG only; B1.1 adds the rest.
//
// The framework shape is section-family-dependent — trap catalogs
// (KVA/NOG/XYZ), protocol/tactic lists (MEK/DTK/LÄS/ELF), lexicons
// (ORD). For B1.0 we type the NOG/trap shape narrowly; B1.1 widens
// the union once we know what shape the other 7 sections actually
// land at after schema validation.
//
// **Naming note**: PRD § 5.16 reserves "lesson" for LLM-curated
// pedagogy (Phase B5). What this loader serves today is the raw
// framework JSON, surfaced to the user as a "Lektion". The route
// stays the same when B5 swaps the content source.

import type { Section } from './questions'

/** One entry in a trap-catalog framework (NOG, KVA, XYZ). */
export type TrapEntry = {
  id: string
  pattern_description: string
  why_it_occurs: string
  common_distractor_signature: string
  countermeasure: string
  example_questions: string[]
  notes?: string
}

/** Trap catalog (NOG/KVA/XYZ). */
export type TrapCatalog = {
  section: Section
  family: 'nog_traps' | 'kva_traps' | 'xyz_traps'
  version: number
  authored_at: string
  notes?: string
  entries: TrapEntry[]
}

/** Union widens in B1.1 when ProtocolCard + LexiconCard land. */
export type Framework = TrapCatalog

const FILENAMES: Partial<Record<Section, string>> = {
  NOG: 'nog_traps.json',
  // KVA: 'kva_traps.json',  // wired in B1.1
  // XYZ: 'xyz_traps.json',
  // MEK: 'mek_protocol.json',
  // DTK: 'dtk_tactics.json',
  // ORD: 'ord_roots.json',
  // 'LÄS': 'las_taxonomy.json',
  // ELF: 'elf_taxonomy.json',
}

const cache = new Map<Section, Promise<Framework | null>>()

/**
 * Load a section's Layer 1 framework. Returns null when the section
 * isn't wired yet (B1.0 ships NOG only). The 404 path is treated as
 * "not wired" rather than an error so the reader can render an
 * empty-state instead of crashing.
 */
export async function loadFramework(section: Section): Promise<Framework | null> {
  const filename = FILENAMES[section]
  if (!filename) return null
  const cached = cache.get(section)
  if (cached) return cached
  const entry = (async () => {
    const res = await fetch(`/frameworks/${filename}`)
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`failed to load framework ${section}: HTTP ${res.status}`)
    }
    return (await res.json()) as Framework
  })()
  cache.set(section, entry)
  return entry
}

/** Sections wired with a framework today. Drives the section picker. */
export function wiredSections(): Section[] {
  return Object.keys(FILENAMES) as Section[]
}

/** Test-only: clear the cache. */
export function __resetFrameworkCache(): void {
  cache.clear()
}
