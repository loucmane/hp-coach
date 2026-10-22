import type { LessonProgress } from '@/api/hooks/useLessonProgress'
import { EXCLUDED_QUESTIONS } from '@/data/figureOverrides'
import { entryHeadword, type Framework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { WORKED_EXAMPLE_QIDS } from '@/data/workedExamples.generated'
import { inWords } from '@/folio/lib/format'
import { formatSitting } from '@/lib/examNames'
import { computeSectionScore, rankWeakness, type SectionStats } from '@/lib/scoring'
import { sectionLongLabel } from '@/lib/sectionRailLabel'

type Entry = Framework['entries'][number]
type Bookmark = Pick<LessonProgress, 'section' | 'frameworkId'> | null
export type CatalogState = { data?: Framework | null; isPending?: boolean; isError?: boolean }
export type Kind = { one: string; many: string; practice: string; gloss: string }
const TYPE = {
  one: 'frågetyp',
  many: 'frågetyper',
  practice: 'Öva denna frågetyp',
  gloss: 'med angreppsprotokoll',
}
const TRAP = { one: 'fälla', many: 'fällor', practice: 'Öva detta mönster' }
const KINDS: Record<Framework['family'], Kind> = {
  las_taxonomy: TYPE,
  elf_taxonomy: TYPE,
  mek_protocol: {
    one: 'regel',
    many: 'regler',
    practice: 'Öva denna regel',
    gloss: 'för luckorna i en mening',
  },
  dtk_tactics: {
    one: 'taktik',
    many: 'taktiker',
    practice: 'Öva denna taktik',
    gloss: 'för figursidor',
  },
  xyz_traps: { ...TRAP, gloss: 'i problemlösning' },
  kva_traps: { ...TRAP, gloss: 'i jämförelser' },
  nog_traps: { ...TRAP, gloss: 'i datasufficiens' },
  ord_roots: {
    one: 'rot',
    many: 'ordrötter',
    practice: 'Öva ord med denna rot',
    gloss: 'och deras betydelser',
  },
}
export const capitalised = (s: string) => s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)
export const slug = (s: string) =>
  s.toLocaleLowerCase('sv-SE').replace(/[äå]/g, 'a').replace(/ö/g, 'o')
export const lessonHref = (section: Section, id?: string) =>
  `/lektion?section=${encodeURIComponent(section)}${id ? `#${encodeURIComponent(id)}` : ''}`
export const RETRY_LINE = 'Gick inte att hämta just nu. Försök igen genom att ladda om sidan.'

export function decodeHash(hash: string): string {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''))
  } catch {
    return ''
  }
}

export function resolveEntry(
  fw: Framework,
  hash: string,
  bookmark: Bookmark,
  isRead: (id: string) => boolean,
): Entry | null {
  return (
    fw.entries.find((e) => e.id === decodeHash(hash)) ??
    (bookmark?.section === fw.section
      ? fw.entries.find((e) => e.id === bookmark.frameworkId)
      : undefined) ??
    fw.entries.find((e) => !isRead(e.id)) ??
    fw.entries[0] ??
    null
  )
}

export function nextUnread<T extends { id: string }>(
  entries: readonly T[],
  id: string,
  isRead: (id: string) => boolean,
): T | null {
  const at = entries.findIndex((e) => e.id === id)
  for (let step = 1; step < entries.length; step++) {
    const e = entries[(at + step + entries.length) % entries.length]
    if (!isRead(e.id)) return e
  }
  return null
}

export function readingMinutes(entry: Entry): number {
  const texts: string[] = []
  const add = (value: unknown) => {
    if (typeof value === 'string') texts.push(value)
    else if (Array.isArray(value)) value.forEach(add)
    else if (value && typeof value === 'object') Object.values(value).forEach(add)
  }
  for (const [key, value] of Object.entries(entry))
    if (key !== 'id' && key !== 'example_questions') add(value)
  return Math.max(1, Math.round(texts.join(' ').split(/\s+/).filter(Boolean).length / 200))
}

export type UppslagEntry = {
  id: string
  title: string
  summary: string | null
  read: boolean
  minutes: number
  href: string
  entry: Entry
  family: Framework['family']
  kind: Kind
  examples: { qid: string; label: string; href: string }[]
  practiceHref: string | null
}
export type UppslagChapter = {
  section: Section
  number: number
  half: 'verbal' | 'kvant'
  name: string
  state: 'ready' | 'loading' | 'error' | 'empty'
  entries: UppslagEntry[]
  readCount: number
  allRead: boolean
  kind: Kind | null
  description: string
  href: string
  practiceHref: string
  weakHref: string | null
}
export type UppslagInput = {
  catalogs: Partial<Record<Section, CatalogState>>
  isRead: (id: string) => boolean
  section?: Section
  hash?: string
  bookmark?: Bookmark
  bySection?: Partial<Record<Section, SectionStats>>
  dueCount?: number
  trapSections?: readonly Section[]
}
export type UppslagView = ReturnType<typeof buildUppslagView>

export function buildUppslagView(input: UppslagInput) {
  const chapters: UppslagChapter[] = SECTION_KEYS.map((section, index) => {
    const query = input.catalogs[section]
    const fw = query?.data
    const kind = fw ? KINDS[fw.family] : null
    const entries: UppslagEntry[] = fw
      ? fw.entries.map((entry) => {
          const examples = [...new Set(entry.example_questions)]
            .filter((qid) => !WORKED_EXAMPLE_QIDS.has(qid) && !EXCLUDED_QUESTIONS.has(qid))
            .map((qid) => {
              const match = /^(.+)-(?:verb|kvant)[12]-[A-ZÄÖÅ]+-(\d+)$/.exec(qid)
              return {
                qid,
                label: match ? `${formatSitting(match[1])} · fråga ${Number(match[2])}` : qid,
                href: `/drill?qid=${encodeURIComponent(qid)}`,
              }
            })
          return {
            id: entry.id,
            title: entryHeadword(entry, fw) ?? entry.id,
            summary: 'tldr' in entry ? entry.tldr || null : null,
            read: input.isRead(entry.id),
            minutes: readingMinutes(entry),
            href: lessonHref(section, entry.id),
            entry,
            family: fw.family,
            kind: KINDS[fw.family],
            examples,
            practiceHref: examples.length
              ? `/drill?section=${encodeURIComponent(section)}&framework=${encodeURIComponent(entry.id)}&start=1`
              : null,
          }
        })
      : []
    const state = fw
      ? entries.length
        ? 'ready'
        : 'empty'
      : query?.isError
        ? 'error'
        : query?.isPending || query?.data === undefined
          ? 'loading'
          : 'empty'
    const readCount = entries.filter((e) => e.read).length
    return {
      section,
      number: index + 1,
      half: index < 4 ? 'verbal' : 'kvant',
      name: sectionLongLabel(section),
      state,
      entries,
      readCount,
      allRead: entries.length > 0 && entries.length === readCount,
      kind,
      description: kind
        ? `${capitalised(inWords(entries.length))} ${entries.length === 1 ? kind.one : kind.many} ${kind.gloss}`
        : '',
      href: lessonHref(
        section,
        fw ? resolveEntry(fw, '', input.bookmark ?? null, input.isRead)?.id : undefined,
      ),
      practiceHref: `/drill?section=${encodeURIComponent(section)}&start=1`,
      weakHref: input.trapSections?.includes(section)
        ? `/drill?section=${encodeURIComponent(section)}&weak=1`
        : null,
    }
  })
  const chapter = chapters.find((c) => c.section === input.section) ?? null
  const framework = input.section ? input.catalogs[input.section]?.data : null
  const resolved = framework
    ? resolveEntry(framework, input.hash ?? '', input.bookmark ?? null, input.isRead)
    : null
  const open = chapter?.entries.find((e) => e.id === resolved?.id) ?? null
  const next = open && chapter ? nextUnread(chapter.entries, open.id, input.isRead) : null
  const primaryLabel = !open
    ? ''
    : !open.read
      ? next
        ? `Läst – nästa ${open.kind.one}`
        : 'Läst – slutför kapitlet'
      : next
        ? `Nästa ${open.kind.one}`
        : 'Till kapitlets slut'
  const scores = SECTION_KEYS.flatMap((section) => {
    const stats = input.bySection?.[section]
    return stats ? [computeSectionScore(section, stats)] : []
  })
  const suggested = rankWeakness(scores)[0]?.section ?? null
  return {
    chapters,
    chapter,
    open,
    next,
    primaryLabel,
    suggested,
    position:
      open && chapter
        ? `${capitalised(open.kind.one)} ${chapter.entries.indexOf(open) + 1} av ${chapter.entries.length}`
        : '',
    provteknikHref: '/lektion?chapter=provteknik',
    mixedHref: '/drill?mixed=1&start=1',
    repetitionHref: (input.dueCount ?? 0) > 0 ? '/repetition' : null,
  }
}
