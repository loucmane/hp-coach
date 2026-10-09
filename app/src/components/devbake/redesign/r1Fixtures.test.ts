// Pins the round-1 redesign bake-off fixture to its sources: the P5 unit to
// the committed sample export, its explanations to the pilot shard, the
// disclosure copy to the approved design, framework names and trap patterns
// to the taxonomies, and the invented Home state to the unit and the exam
// calendar — so the bake-off can never show drifted content or a Home that
// contradicts the drill it resumes.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  ESTIMATE_CAVEAT,
  EXAM,
  EXPLANATIONS,
  FRAMEWORK_NAMES,
  OVNINGSTEXT_BADGE,
  OVNINGSTEXT_NOTE,
  PLAN,
  RESUME,
  SESSION,
  TODAY,
  TRAPS,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import { EXAM_SITTINGS } from '@/lib/dates'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..', '..', '..')
const read = (rel: string) => readFileSync(path.join(REPO, rel), 'utf8')

type BankRow = {
  qid: string
  unit_id: string
  revision: number
  section: string
  number: number
  title: string
  context: string
  prompt: string
  options: unknown
  answer: string
}

type TaxonomyEntry = {
  id: string
  question_type: string
  common_distractors?: { pattern: string }[]
}

function taxonomy(file: string): TaxonomyEntry[] {
  return (JSON.parse(read(`app/public/frameworks/${file}`)) as { entries: TaxonomyEntry[] }).entries
}

describe('redesign round-1 fixture', () => {
  it('uses the approved disclosure copy verbatim', () => {
    const design = read('docs/p5-infold-design.md')
    expect(design).toContain(`**${OVNINGSTEXT_BADGE.toLocaleUpperCase('sv-SE')}**`)
    expect(design).toContain(`»${OVNINGSTEXT_NOTE}«`)
    expect(design).toContain(`»${ESTIMATE_CAVEAT}«`)
  })

  it('copies the unit verbatim from the committed sample export', () => {
    const bank = JSON.parse(
      read('pipeline/synthetic/infold/preview/sample/p5-bank-sample.json'),
    ) as { questions: BankRow[] }
    const rows = bank.questions.filter((r) => r.unit_id === UNIT.unitId)
    expect(rows.map((r) => r.qid)).toEqual(UNIT.questions.map((q) => q.qid))
    rows.forEach((row, i) => {
      const q = UNIT.questions[i]
      expect(row.title).toBe(UNIT.title)
      expect(row.context).toBe(UNIT.context)
      expect(row.section).toBe(UNIT.section)
      expect(row.revision).toBe(UNIT.revision)
      expect({ number: q.number, prompt: q.prompt, options: q.options, answer: q.answer }).toEqual({
        number: row.number,
        prompt: row.prompt,
        options: row.options,
        answer: row.answer,
      })
    })
  })

  it('copies the reviewed explanations verbatim from the pilot shard', () => {
    const shard = JSON.parse(read('data/explanations/p5-pilot.json')) as Record<string, unknown>
    const qids = UNIT.questions.map((q) => q.qid)
    expect(Object.keys(EXPLANATIONS).sort()).toEqual([...qids].sort())
    for (const qid of qids) expect(EXPLANATIONS[qid]).toEqual(shard[qid])
  })

  it('names frameworks and trap patterns as the taxonomies do', () => {
    const all = [...taxonomy('las_taxonomy.json'), ...taxonomy('elf_taxonomy.json')]
    const byId = new Map(all.map((f) => [f.id, f]))
    for (const [id, name] of Object.entries(FRAMEWORK_NAMES)) {
      expect(byId.get(id)?.question_type).toBe(name)
    }
    for (const trap of TRAPS.filter((t) => t.section === 'LÄS' || t.section === 'ELF')) {
      const fw = byId.get(trap.frameworkId)
      expect(fw?.question_type).toBe(trap.name)
      expect(fw?.common_distractors?.map((d) => d.pattern)).toContain(trap.pattern)
    }
    // Every explanation's framework resolves to a name the feedback can show.
    for (const e of Object.values(EXPLANATIONS)) {
      if (e.framework_id) expect(FRAMEWORK_NAMES[e.framework_id]).toBeDefined()
    }
  })

  it('resumes the drill it opens, at a wrong pick that exists', () => {
    expect(RESUME.title).toBe(UNIT.title.split(':')[0])
    expect(RESUME.subtitle).toBe(UNIT.title.split(': ')[1])
    expect(RESUME.total).toBe(UNIT.questions.length)
    expect(RESUME.position).toBe(SESSION.startIndex + 1)
    expect(RESUME.answered).toBe(SESSION.earlier.length)
    for (const [qid, pick] of Object.entries(SESSION.wrongPick)) {
      const q = UNIT.questions.find((x) => x.qid === qid)
      expect(q?.options.map((o) => o.letter)).toContain(pick)
      expect(pick).not.toBe(q?.answer)
      // The wrong pick has a distractor explanation to show.
      expect(EXPLANATIONS[qid].distractors.map((d) => d.letter)).toContain(pick)
    }
  })

  it('counts down to the next sitting from the fixture day', () => {
    const sitting = EXAM_SITTINGS.find((s) => s.id === EXAM.id)
    expect(sitting?.label).toBe(EXAM.label)
    const today = new Date(TODAY.iso)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const days = Math.round(
      ((sitting as { date: Date }).date.getTime() - startOfToday.getTime()) / 86_400_000,
    )
    expect(days).toBe(EXAM.daysLeft)
    expect(PLAN.items.reduce((n, item) => n + item.minutes, 0)).toBe(PLAN.minutes)
    expect(PLAN.items.filter((item) => item.primary)).toHaveLength(1)
  })
})
