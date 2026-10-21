import { type Question, questionsInSection } from '@/data/questions'
import { decodeTreatedMarker } from '@/lib/adaptiveReview'
import { ORD_WORDS_SECTIONS } from '@/lib/ordWords'
import { uhrTimeMs } from '@/lib/uhrPacing'

export type TimedDrillSection = 'ORD' | 'LÄS'

/** Stored mode identity: a plain ORD plan can have the same size as a timed one. */
export function timedSections(section: TimedDrillSection): string {
  return `${section} · PÅ TID`
}

export function parseTimedSections(raw: string | null | undefined): TimedDrillSection | null {
  const marker = raw?.toUpperCase()
  if (marker === timedSections('ORD')) return 'ORD'
  if (marker === timedSections('LÄS')) return 'LÄS'
  return null
}

/** For section-based links/display only. Adoption must compare the full marker. */
export function sessionSectionCode(raw: string | null | undefined): string {
  const detour = decodeTreatedMarker(raw ?? null)
  if (detour) return detour.section.toUpperCase()
  const marker = raw?.toUpperCase() ?? ''
  if (marker === ORD_WORDS_SECTIONS) return 'ORD'
  return parseTimedSections(marker) ?? marker
}

export function timedDrill(section: string): {
  section: TimedDrillSection
  count: number
  budgetMs: number
} | null {
  if (section !== 'ORD' && section !== 'LÄS') return null
  const count = section === 'ORD' ? 10 : 4
  return { section, count, budgetMs: uhrTimeMs(section, count) as number }
}

// A passage is local to its exam and provpass. Identical text in another
// booklet must not turn two short passages into one four-question drill.
function passageKey(q: Question): string {
  return JSON.stringify([q.exam_id, q.provpass, q.context])
}

export function isTimedDrillPlan(questions: readonly Question[], section: TimedDrillSection) {
  const spec = timedDrill(section)
  if (!spec || questions.length !== spec.count) return false
  if (new Set(questions.map((q) => q.qid)).size !== spec.count) return false
  if (questionsInSection(questions, section).length !== spec.count) return false
  if (section === 'ORD') return true
  const first = questions[0]
  return !!first.context?.trim() && questions.every((q) => passageKey(q) === passageKey(first))
}

/** Exact-size practice: no shorter ORD set or partial LÄS passage. */
export function pickTimedDrillQuestions(
  bank: readonly Question[],
  section: TimedDrillSection,
  rng: () => number = Math.random,
): Question[] {
  if (section === 'ORD') {
    const pool = [...new Map(questionsInSection(bank, section).map((q) => [q.qid, q])).values()]
    if (pool.length < 10) return []
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, 10)
  }

  const groups = new Map<string, Question[]>()
  // Group BEFORE filtering playable questions: a longer passage with one
  // broken member is not a complete four-question passage either.
  for (const q of bank) {
    if (q.section !== 'LÄS' || !q.context?.trim()) continue
    const key = passageKey(q)
    const group = groups.get(key)
    if (group) group.push(q)
    else groups.set(key, [q])
  }
  const passages = [...groups.values()].filter((group) => isTimedDrillPlan(group, section))
  if (passages.length === 0) return []
  return [...passages[Math.floor(rng() * passages.length)]].sort((a, b) => a.number - b.number)
}

/** Missing telemetry is unknown, never a zero-time claim. */
export function attemptTimeMs(
  attempts: readonly { timeTakenMs?: number | null }[] | undefined,
): number | null {
  if (!attempts) return null
  let total = 0
  for (const attempt of attempts) {
    const time = attempt.timeTakenMs
    if (time == null || !Number.isFinite(time) || time < 0) return null
    total += time
  }
  return total
}

export function formatDrillTime(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
