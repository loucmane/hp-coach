// Rough drill-time estimates per section. Matches the section's pacing
// from real exams so any time hint shown to the user (idle screen,
// daily plan card, etc.) isn't lying. ORD is fastest (single headword);
// reading/quant sections take longer per question.
//
// Imported by both drill.tsx (idle-screen hint) and scheduler.ts
// (daily plan estimatedMinutes). Single source of truth.

import type { Section } from '@/data/questions'

export const SECTION_DURATIONS: Record<Section, number> = {
  ORD: 3,
  LÄS: 10,
  MEK: 5,
  ELF: 10,
  XYZ: 8,
  KVA: 6,
  NOG: 12,
  DTK: 15,
}
