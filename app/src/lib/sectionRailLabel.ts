// Section → margin-rail metadata for the Boksidan (M3) drill chassis.
//
// Single source of truth mapping a corpus section code to the cobalt mono
// rail labels (STRUCTURE, per docs/design-system-conventions.md) and the
// structural flags that drive per-section apparatus (passage column, NOG
// statements, wide prose options).
//
// Labels are stored in their human title-case form; the rail renders them
// uppercase via CSS (text-transform), matching the M3 mockup.

import type { Section } from '@/data/questions'

export type SectionRailMeta = {
  /** Rail label for the prompt/question row. */
  promptLabel: string
  /** Rail label for the passage/underlag row, or null when the section has none. */
  contextLabel: string | null
  /** Whether the prompt carries the NOG (1)/(2) sufficiency apparatus. */
  hasStatements: boolean
  /** Whether option rows use the wider prose treatment (long verbal answers). */
  optionsProse: boolean
}

// Shared labels for the answer + outcome rows (same across every section).
export const RAIL_CHOOSE = 'Välj svar'
export const RAIL_OUTCOME = 'Utfall'
export const RAIL_STATEMENTS = 'Påståenden'

const ORD_META: SectionRailMeta = {
  promptLabel: 'Frågan',
  contextLabel: null,
  hasStatements: false,
  optionsProse: false,
}

export const SECTION_RAIL: Record<Section, SectionRailMeta> = {
  ORD: ORD_META,
  MEK: { promptLabel: 'Frågan', contextLabel: null, hasStatements: false, optionsProse: false },
  // LÄS / ELF read a passage; ELF passages stay English by exam design but the
  // rail label is the Swedish UI chrome, so 'Texten' is correct for both.
  LÄS: { promptLabel: 'Frågan', contextLabel: 'Texten', hasStatements: false, optionsProse: true },
  ELF: { promptLabel: 'Frågan', contextLabel: 'Texten', hasStatements: false, optionsProse: true },
  XYZ: { promptLabel: 'Frågan', contextLabel: null, hasStatements: false, optionsProse: false },
  KVA: { promptLabel: 'Frågan', contextLabel: null, hasStatements: false, optionsProse: false },
  NOG: { promptLabel: 'Uppgiften', contextLabel: null, hasStatements: true, optionsProse: false },
  DTK: {
    promptLabel: 'Frågan',
    contextLabel: 'Underlaget',
    hasStatements: false,
    optionsProse: false,
  },
}

/** Rail metadata for a section, defaulting to the ORD shape for unknown codes. */
export function railMeta(section: Section): SectionRailMeta {
  return SECTION_RAIL[section] ?? ORD_META
}
