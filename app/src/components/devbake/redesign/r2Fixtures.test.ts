// Pins the round-2 fixtures to their sources: the authentic pass, the
// Kvantfråga and DTK questions and their explanations to the served bank
// (as data/questions.ts loadBank serves it), the ELF unit to the committed
// sample export and its explanation to the pilot shard, the catalogs'
// index to the framework files (headwords by the app's own entryHeadword),
// normering and pass sizes to their files, and the copy the view model
// repeats to the components that own it. Then the reader's invented state
// is checked against itself and against that content: the pile holds real
// questions, the days add up to the weeks, every pass result adds up, the
// running pass agrees with its own result, and the halves take turns.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { HALF_SECTIONS, PROV_RULES } from '@/components/devbake/redesign/directionData'
import { RECENT, UNIT } from '@/components/devbake/redesign/r1Fixtures'
import {
  DAYS,
  DTK_PAGES,
  DTK_QID,
  ELF_EXPLANATIONS,
  ELF_UNIT,
  FRAMEWORK_INDEX,
  FRAMEWORK_PROGRESS,
  HISTORY,
  IDENTITY,
  LESSON_READS,
  MOCK_PRESCRIPTION,
  MOCK_RESULTS,
  NORMERING,
  NOW_ISO,
  OPEN_LESSON,
  OPEN_LESSON_ID,
  PASS_EXPOSURE,
  PASS_ID,
  PASS_QUESTIONS,
  PASS_RESULT,
  PASS_SEEN,
  PASS_SIZES,
  PILE,
  PILE_PROMPTS,
  PREFS,
  QUANT_EXPLANATIONS,
  QUANT_QIDS,
  QUANT_QUESTIONS,
  RUNNING_PASS,
  STATS,
} from '@/components/devbake/redesign/r2Fixtures'
import { SUPPRESSED_FIGURES } from '@/data/figureOverrides'
import { entryHeadword, type Framework } from '@/data/frameworks'
import type { Question } from '@/data/questions'
import { sectionOfQid } from '@/lib/dueBySection'
import { DEFAULT_THEME } from '@/lib/tokens'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..', '..', '..')
const read = (rel: string) => readFileSync(path.join(REPO, rel), 'utf8')
const readJson = <T>(rel: string) => JSON.parse(read(rel)) as T

type DtkIndex = Record<string, { figure: string; width: number; height: number }>

const bank = (examId: string) => readJson<Question[]>(`app/public/data/${examId}.json`)
const DTK_INDEX = readJson<DtkIndex>('app/public/figures/dtk/_index.json')
const complete = (q: Question) => q.parsing_status === 'complete' && q.options != null

/** A bank row as loadBank serves it: its DTK page patched in, a
 *  suppressed figure dropped. */
function served(q: Question): Question {
  const row = { ...q }
  const page = DTK_INDEX[q.qid]
  if (page) {
    row.figure = {
      src: `figures/dtk/${page.figure}`,
      aspect_ratio: page.width / page.height,
      kind: 'raster',
    }
  }
  if (SUPPRESSED_FIGURES.has(q.qid)) row.figure = null
  return row
}

function examOf(qid: string): string {
  return qid.slice(0, qid.search(/-(verb|kvant)[12]-/))
}

/** The bank's math markers, U+E000 and U+E001 (built from their codes so no
 *  editor can strip a private-use character from this file). */
const PUA = new RegExp(`[${String.fromCharCode(0xe000, 0xe001)}]`)

describe('round-2 fixtures: the authentic questions', () => {
  it('copies Hösten 2025 kvant1 whole, in printed order, as loadBank serves it', () => {
    const rows = bank('host-2025')
      .filter((q) => q.provpass === 'kvant1' && complete(q))
      .sort((a, z) => a.number - z.number)
    expect(PASS_QUESTIONS).toHaveLength(40)
    expect(PASS_QUESTIONS).toEqual(rows.map(served))
    expect(PASS_ID).toBe('host-2025:kvant1')
    expect(PASS_QUESTIONS.map((q) => q.number)).toEqual(PASS_QUESTIONS.map((_, i) => i + 1))
  })

  it('copies the Kvantfråga questions — XYZ with math, KVA, NOG — and the DTK question', () => {
    const all = bank('host-2025')
    expect(QUANT_QUESTIONS.map((q) => q.qid)).toEqual([...QUANT_QIDS])
    expect(QUANT_QUESTIONS).toEqual(
      QUANT_QIDS.map((qid) => served(all.find((q) => q.qid === qid) as Question)),
    )
    const [xyz, kva, nog] = QUANT_QUESTIONS
    expect([xyz.section, kva.section, nog.section]).toEqual(['XYZ', 'KVA', 'NOG'])
    // The XYZ question carries math in its prompt and its options.
    expect(xyz.prompt).toMatch(PUA)
    expect(xyz.options?.some((o) => PUA.test(o.text))).toBe(true)
    // KVA's four fixed options; NOG's five.
    expect(kva.options?.map((o) => o.text)).toEqual([
      'I är större än II',
      'II är större än I',
      'I är lika med II',
      'informationen är otillräcklig',
    ])
    expect(nog.options?.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D', 'E'])
    // The DTK question is in the pass, on a figure page from app/public.
    const d = PASS_QUESTIONS.find((q) => q.qid === DTK_QID)
    expect(d?.section).toBe('DTK')
    expect(d?.figure).toMatchObject({ src: 'figures/dtk/host-2025-kvant1-p16.jpg', kind: 'raster' })
    expect(existsSync(path.join(REPO, 'app/public', d?.figure?.src ?? ''))).toBe(true)
    expect(DTK_PAGES).toEqual(
      Object.fromEntries(
        PASS_QUESTIONS.filter((q) => DTK_INDEX[q.qid]).map((q) => [q.qid, DTK_INDEX[q.qid]]),
      ),
    )
  })

  it('copies their reviewed explanations verbatim, without the generator’s _meta', () => {
    const source = readJson<Record<string, Record<string, unknown>>>(
      'app/public/explanations/host-2025.json',
    )
    const qids = [...QUANT_QIDS, DTK_QID]
    expect(Object.keys(QUANT_EXPLANATIONS)).toEqual(qids)
    for (const qid of qids) {
      const { _meta, ...rest } = source[qid]
      expect(QUANT_EXPLANATIONS[qid]).toEqual(rest)
      const e = QUANT_EXPLANATIONS[qid]
      const q = [...QUANT_QUESTIONS, ...PASS_QUESTIONS].find((x) => x.qid === qid)
      // Shaped as the app's Explanation type says, and clean of artifacts.
      expect(typeof e.framework_id).toBe('string')
      for (const s of e.steps ?? []) expect(['essential', 'detail']).toContain(s.tier)
      expect(JSON.stringify(e)).not.toMatch(/\{MO\}|\{MC\}/)
      expect(e.distractors.map((d) => d.letter).sort()).toEqual(
        (q?.options ?? []).map((o) => o.letter).filter((l) => l !== q?.answer),
      )
    }
  })
})

describe('round-2 fixtures: the ELF unit', () => {
  it('copies the unit verbatim from the committed sample export', () => {
    const sample = readJson<{
      questions: (Question & { unit_id: string; revision: number; title: string })[]
    }>('pipeline/synthetic/infold/preview/sample/p5-bank-sample.json')
    const rows = sample.questions.filter((r) => r.unit_id === ELF_UNIT.unitId)
    expect(rows.length).toBe(ELF_UNIT.questions.length)
    rows.forEach((row, i) => {
      const q = ELF_UNIT.questions[i]
      expect(row.section).toBe('ELF')
      expect(row.title).toBe(ELF_UNIT.title)
      expect(row.context).toBe(ELF_UNIT.context)
      expect(row.revision).toBe(ELF_UNIT.revision)
      expect({
        qid: q.qid,
        number: q.number,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
      }).toEqual({
        qid: row.qid,
        number: row.number,
        prompt: row.prompt,
        options: row.options,
        answer: row.answer,
      })
    })
  })

  it('copies its reviewed explanation verbatim from the pilot shard', () => {
    const shard = readJson<Record<string, unknown>>('data/explanations/p5-pilot.json')
    for (const q of ELF_UNIT.questions) expect(ELF_EXPLANATIONS[q.qid]).toEqual(shard[q.qid])
  })
})

describe('round-2 fixtures: frameworks, normering, passes and copy', () => {
  const FILES: Record<string, string> = {
    ORD: 'ord_roots.json',
    LÄS: 'las_taxonomy.json',
    MEK: 'mek_protocol.json',
    ELF: 'elf_taxonomy.json',
    XYZ: 'xyz_traps.json',
    KVA: 'kva_traps.json',
    NOG: 'nog_traps.json',
    DTK: 'dtk_tactics.json',
  }

  it('indexes every catalog in exam order with the app’s own headwords', () => {
    expect(FRAMEWORK_INDEX.map((c) => c.section)).toEqual(Object.keys(FILES))
    for (const cat of FRAMEWORK_INDEX) {
      const framework = readJson<Framework>(`app/public/frameworks/${FILES[cat.section]}`)
      expect(cat.family).toBe(framework.family)
      expect(cat.entries).toEqual(
        framework.entries.map((e) => ({
          id: e.id,
          headword: entryHeadword(e, framework),
          ...('tldr' in e && e.tldr ? { kicker: e.tldr } : {}),
          examples: e.example_questions.length,
        })),
      )
    }
  })

  it('opens the lesson verbatim from its catalog', () => {
    const las = readJson<Framework>('app/public/frameworks/las_taxonomy.json')
    expect(OPEN_LESSON.id).toBe(OPEN_LESSON_ID)
    expect(OPEN_LESSON).toEqual(las.entries.find((e) => e.id === OPEN_LESSON_ID))
  })

  it('copies the normering of the scored sittings and counts the listed passes', () => {
    for (const [examId, sitting] of Object.entries(NORMERING)) {
      expect(sitting).toEqual(readJson(`app/public/normering/${examId}.json`))
    }
    for (const [id, n] of Object.entries(PASS_SIZES)) {
      const [examId, provpass] = id.split(':')
      expect(n).toBe(bank(examId).filter((q) => q.provpass === provpass && complete(q)).length)
    }
    expect(Object.keys(PASS_EXPOSURE).sort()).toEqual(Object.keys(PASS_SIZES).sort())
  })

  it('copies the prompts of the pile’s other questions', () => {
    for (const [qid, prompt] of Object.entries(PILE_PROMPTS)) {
      expect(bank(examOf(qid)).find((q) => q.qid === qid)?.prompt).toBe(prompt)
    }
  })

  it('repeats the Provpass rules and quotas the app’s own code holds', () => {
    const sheet = read('app/src/components/mock/ConfirmSheet.tsx')
    for (const rule of PROV_RULES) expect(sheet).toContain(`'${rule}'`)
    const mock = read('app/src/lib/mock.ts')
    for (const s of [...HALF_SECTIONS.verbal, ...HALF_SECTIONS.kvant]) {
      expect(mock).toContain(`['${s.section}', ${s.count}]`)
    }
    // The pass on the running screen has the same composition.
    for (const s of HALF_SECTIONS.kvant) {
      expect(PASS_QUESTIONS.filter((q) => q.section === s.section)).toHaveLength(s.count)
    }
  })

  it('uses AccountMenu’s own sample identity and the default preferences', () => {
    const menu = read('app/src/components/account/AccountMenu.tsx')
    expect(menu).toContain(`name: '${IDENTITY.name}'`)
    expect(menu).toContain(`email: '${IDENTITY.email}'`)
    expect(menu).toContain(`initials: '${IDENTITY.initials}'`)
    expect(PREFS).toMatchObject({
      palette: DEFAULT_THEME.palette,
      mode: DEFAULT_THEME.mode,
      font: DEFAULT_THEME.font,
      density: DEFAULT_THEME.density,
    })
    expect(read('app/src/stores/coachStore.ts')).toContain(`'${PREFS.coach}'`)
  })
})

describe('round-2 fixtures: the reader’s state', () => {
  const now = new Date(NOW_ISO).getTime()
  const known = new Set([
    ...PASS_QUESTIONS.map((q) => q.qid),
    ...QUANT_QUESTIONS.map((q) => q.qid),
    ...UNIT.questions.map((q) => q.qid),
    ...ELF_UNIT.questions.map((q) => q.qid),
    ...Object.keys(PILE_PROMPTS),
  ])

  it('adds the days up to the weeks, and ends the days on the fixture day', () => {
    expect(DAYS).toHaveLength(STATS.weekly.length)
    DAYS.forEach((days, i) => {
      expect(days.reduce((a, b) => a + b, 0)).toBe(STATS.weekly[i].attempts)
    })
    const daily = STATS.attemptsDaily ?? []
    expect(daily).toHaveLength(84)
    expect(daily[daily.length - 1].date).toBe(NOW_ISO.slice(0, 10))
    // The run: Tuesday to today, Monday empty.
    expect(daily.slice(-5).map((d) => d.n > 0)).toEqual([false, true, true, true, true])
    expect(STATS.streakDays).toBe(4)
    expect(STATS.attempts.thisWeek).toBe(STATS.weekly[STATS.weekly.length - 1].attempts)
    expect(Object.values(STATS.bySection).reduce((n, s) => n + s.attemptsToday, 0)).toBe(
      STATS.attempts.today,
    )
  })

  it('piles real questions: eight due now, missed in Historik’s drills, the rest this morning', () => {
    expect(PILE).toHaveLength(23)
    for (const m of PILE) {
      expect(known.has(m.questionId)).toBe(true)
      expect(sectionOfQid(m.questionId)).not.toBeNull()
    }
    const due = PILE.filter((m) => new Date(m.nextReviewAt as string).getTime() <= now)
    expect(due.map((m) => m.id)).toEqual(PILE.slice(0, 8).map((m) => m.id))
    expect(STATS.mistakes.due).toBe(due.length)
    // The server's order: next review first.
    const next = PILE.map((m) => new Date(m.nextReviewAt as string).getTime())
    expect(next).toEqual([...next].sort((a, b) => a - b))
    for (const m of PILE.slice(8)) {
      expect(new Date(m.lastErrorAt as string).toDateString()).toBe(new Date(now).toDateString())
    }
    // The six from the running pass are all it has been seen of.
    const fromPass = PILE.filter((m) => m.questionId.startsWith('host-2025-kvant1-'))
    expect(PASS_EXPOSURE[PASS_ID].seenBefore).toBe(fromPass.length)
    expect(Object.keys(PASS_SEEN)).toEqual(fromPass.map((m) => m.questionId))
    expect(Object.values(PASS_SEEN).reduce((n, e) => n + e.n, 0)).toBe(
      PASS_EXPOSURE[PASS_ID].totalExposure,
    )
  })

  it('starts Historik with round 1’s recent passes', () => {
    expect(
      HISTORY.slice(0, 3).map((h) => ({
        label: h.kind === 'adaptive_review' ? 'Repetition' : h.sections,
        correct: h.correct,
        total: h.total,
      })),
    ).toEqual(RECENT.map(({ label, correct, total }) => ({ label, correct, total })))
    const ended = HISTORY.map((h) => new Date(h.endedAt as string).getTime())
    expect(ended).toEqual([...ended].sort((a, b) => b - a))
  })

  it('adds every pass result up, and its misses are real questions of that pass', () => {
    for (const r of [PASS_RESULT, ...MOCK_RESULTS]) {
      const parts = Object.entries(r.breakdown.perSection)
      expect(parts.reduce((n, [, s]) => n + s.correct, 0)).toBe(r.correct)
      expect(parts.reduce((n, [, s]) => n + s.presented, 0)).toBe(r.presented)
      expect(parts.reduce((n, [, s]) => n + s.timeMs, 0)).toBe(r.durationMs)
      expect(parts.map(([s, x]) => [s, x.presented])).toEqual(
        HALF_SECTIONS[r.half].map((s) => [s.section, s.count]),
      )
      expect(r.breakdown.missedQids).toHaveLength(r.presented - r.correct)
      const pass = bank(r.examId as string).filter((q) => q.provpass === r.provpass)
      for (const qid of r.breakdown.missedQids) {
        expect(pass.map((q) => q.qid)).toContain(qid)
      }
      for (const [section, s] of parts) {
        expect(r.breakdown.missedQids.filter((qid) => sectionOfQid(qid) === section)).toHaveLength(
          s.presented - s.correct,
        )
      }
    }
    // Newest first, the halves taking turns, the rhythm naming the next.
    const created = MOCK_RESULTS.map((r) => new Date(r.createdAt as string).getTime())
    expect(created).toEqual([...created].sort((a, b) => b - a))
    expect(MOCK_RESULTS.map((r) => r.half)).toEqual(['verbal', 'kvant', 'kvant'])
    expect(MOCK_PRESCRIPTION.half).toBe('kvant')
  })

  it('runs the pass its result hands in: blanks only after the current question', () => {
    expect(RUNNING_PASS.passId).toBe(PASS_ID)
    expect(`${PASS_RESULT.examId}:${PASS_RESULT.provpass}`).toBe(PASS_ID)
    expect(RUNNING_PASS.missed).toEqual(PASS_RESULT.breakdown.missedQids)
    expect(RUNNING_PASS.current).toBe(RUNNING_PASS.answered)
    expect(PASS_QUESTIONS[RUNNING_PASS.current].qid).toBe(QUANT_QIDS[1])
    const unanswered = PASS_RESULT.presented - PASS_RESULT.answered
    const blanks = PASS_RESULT.breakdown.missedQids.slice(-unanswered)
    for (const qid of blanks) {
      expect(PASS_QUESTIONS.findIndex((q) => q.qid === qid)).toBeGreaterThan(RUNNING_PASS.current)
    }
    for (const qid of RUNNING_PASS.flags) expect(PASS_QUESTIONS.map((q) => q.qid)).toContain(qid)
    expect(PASS_RESULT.seenBefore).toBe(PASS_EXPOSURE[PASS_ID].seenBefore)
  })

  it('reads and progresses only frameworks the catalogs hold', () => {
    const ids = new Set(FRAMEWORK_INDEX.flatMap((c) => c.entries.map((e) => e.id)))
    for (const id of LESSON_READS) expect(ids.has(id)).toBe(true)
    for (const row of FRAMEWORK_PROGRESS) expect(ids.has(row.layer1Id)).toBe(true)
    expect(LESSON_READS).not.toContain(OPEN_LESSON_ID)
    for (const m of PILE) {
      for (const id of m.layer1Ids ?? []) expect(ids.has(id)).toBe(true)
    }
  })
})
