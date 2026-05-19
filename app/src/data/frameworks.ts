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
  /** One-line TLDR pulled out as a kicker above the body. Optional —
   *  TrapCard hides the block when missing. ~10–15 words ideal. */
  tldr?: string
  /** "When to suspect this trap" — the textual or structural cue in
   *  the question that should trigger an alarm bell. Optional. */
  recognition_cue?: string
  /** Concrete instance of the trap firing + the correct resolution.
   *  Authored as a four-beat narrative so cards render consistently. */
  worked_example?: {
    /** The problem premise (numbers, figure, etc.). */
    setup: string
    /** The seductive wrong reasoning a student walks into. */
    trap_thinking: string
    /** The corrected reasoning that exits the trap. */
    correct_thinking: string
    /** The right answer letter / value. */
    answer: string
  }
  /** Edge condition where this pattern does NOT trap — usually an
   *  added constraint that pins the ambiguity. Optional. */
  counter_example?: string
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
  common_distractors: Array<{ pattern: string; why_it_traps: string }>
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

/** The human-readable headword for a framework entry — each family
 *  puts its summary on a different field (root for ORD, tactic for
 *  DTK, etc.). Used by the drill idle screen + the daily-plan card
 *  to render "NOG-lektion · 2×2-tabellen" instead of bare IDs. */
export function entryHeadword(
  entry: Framework['entries'][number],
  framework: Framework,
): string | null {
  switch (framework.family) {
    case 'ord_roots':
      return 'root' in entry ? entry.root : null
    case 'dtk_tactics':
      return 'tactic' in entry ? entry.tactic : null
    case 'mek_protocol':
      return 'constraint_type' in entry ? entry.constraint_type : null
    case 'las_taxonomy':
    case 'elf_taxonomy':
      return 'question_type' in entry ? entry.question_type : null
    case 'nog_traps':
    case 'kva_traps':
    case 'xyz_traps':
      return 'pattern_description' in entry ? entry.pattern_description : null
  }
}

/** Test-only: clear the cache. */
export function __resetFrameworkCache(): void {
  cache.clear()
}
