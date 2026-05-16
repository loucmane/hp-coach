// Section extraction from a qid.
//
// Question IDs are shaped `host-2014-kvant1-NOG-026` or similar. The
// section code is always between the provpass token and the trailing
// number. Until we add a `section` column to the attempts table, we
// derive section in TS by regex.

export const SECTIONS = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK'] as const
export type Section = (typeof SECTIONS)[number]

const SECTION_RE = /-(KVA|XYZ|NOG|DTK|MEK|ELF|ORD|L[ÄA]S)-\d+$/

export function extractSection(qid: string): Section | null {
  const m = SECTION_RE.exec(qid)
  if (!m) return null
  // Normalise LAS → LÄS (a corpus-import quirk where the Ä got dropped).
  const raw = m[1] === 'LAS' ? 'LÄS' : m[1]
  return raw as Section
}

// Verbal vs quant half — needed for the projected-total calc that
// matches the HP exam structure (each half is a separate 0.0–2.0
// subscore, total is the mean).
export const VERBAL_SECTIONS: ReadonlySet<Section> = new Set(['ORD', 'LÄS', 'MEK', 'ELF'])
export const QUANT_SECTIONS: ReadonlySet<Section> = new Set(['XYZ', 'KVA', 'NOG', 'DTK'])
