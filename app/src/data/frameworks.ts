// Layer 1 framework bank — types + lazy loader.
//
// Mirrors `data/explanations.ts`. Framework JSON files live under
// `app/public/frameworks/` (canonical source: repo-root `frameworks/`;
// copied into SPA public dir for runtime fetch). One file per section.
//
// Each call to `loadFramework(section)` returns a memoised Promise of
// that section's framework. Five schema families, three reader cards:
//
//   - **TrapCatalog** (NOG, KVA, XYZ): pattern → why → countermeasure
//   - **TacticCatalog** (DTK): tactic → when_to_apply
//   - **ConstraintCatalog** (MEK): constraint_type → rule
//   - **ProtocolCatalog** (LÄS, ELF): question_type → attack_protocol[]
//                                     + common_distractors[]
//   - **Lexicon** (ORD): root → origin → meaning → example_words[]
//
// The reader dispatches on `family` to pick the right card. Schema
// validation lives upstream in `frameworks/*.json` authoring.
//
// **Naming note**: PRD § 5.16 reserves "lesson" for LLM-curated
// pedagogy (Phase B5). What this loader serves today is the raw
// framework JSON, surfaced to the user as a "Lektion". The route
// stays the same when B5 swaps the content source.

import type { Section } from './questions'

/** Trap catalog entry (NOG, KVA, XYZ). */
export type TrapEntry = {
  id: string
  pattern_description: string
  why_it_occurs: string
  common_distractor_signature: string
  countermeasure: string
  example_questions: string[]
  notes?: string
}

export type TrapCatalog = {
  section: Section
  family: 'nog_traps' | 'kva_traps' | 'xyz_traps'
  version: number
  authored_at: string
  notes?: string
  entries: TrapEntry[]
}

/** Tactic catalog entry (DTK). */
export type TacticEntry = {
  id: string
  tactic: string
  when_to_apply: string
  example_questions: string[]
  notes?: string
}

export type TacticCatalog = {
  section: Section
  family: 'dtk_tactics'
  version: number
  authored_at: string
  notes?: string
  entries: TacticEntry[]
}

/** Constraint protocol entry (MEK). */
export type ConstraintEntry = {
  id: string
  constraint_type: string
  rule: string
  example_questions: string[]
  notes?: string
}

export type ConstraintCatalog = {
  section: Section
  family: 'mek_protocol'
  version: number
  authored_at: string
  notes?: string
  entries: ConstraintEntry[]
}

/** Question-type protocol entry (LÄS, ELF). */
export type ProtocolEntry = {
  id: string
  question_type: string
  attack_protocol: string[]
  common_distractors: string[]
  example_questions: string[]
  notes?: string
}

export type ProtocolCatalog = {
  section: Section
  family: 'las_taxonomy' | 'elf_taxonomy'
  version: number
  authored_at: string
  notes?: string
  entries: ProtocolEntry[]
}

/** Lexicon entry (ORD). */
export type LexiconEntry = {
  id: string
  root: string
  origin: string
  meaning: string
  example_words: string[]
  example_questions: string[]
  corpus_frequency?: number
  notes?: string
}

export type Lexicon = {
  section: Section
  family: 'ord_roots'
  version: number
  authored_at: string
  notes?: string
  entries: LexiconEntry[]
}

export type Framework = TrapCatalog | TacticCatalog | ConstraintCatalog | ProtocolCatalog | Lexicon

const FILENAMES: Partial<Record<Section, string>> = {
  NOG: 'nog_traps.json',
  KVA: 'kva_traps.json',
  XYZ: 'xyz_traps.json',
  MEK: 'mek_protocol.json',
  DTK: 'dtk_tactics.json',
  ORD: 'ord_roots.json',
  LÄS: 'las_taxonomy.json',
  ELF: 'elf_taxonomy.json',
}

const cache = new Map<Section, Promise<Framework | null>>()

/**
 * Load a section's Layer 1 framework. Returns null when the section
 * isn't wired yet. The 404 path is treated as "not wired" rather than
 * an error so the reader can render an empty-state instead of crashing.
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
