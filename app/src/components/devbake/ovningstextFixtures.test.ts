// Pins the ÖVNINGSTEXT bake-off fixture to its sources: the four
// disclosure strings to the approved design, the units to the committed
// sample export, the explanations to the pilot shard and the retired unit
// to the registry — so the bake-off can never show reworded copy or
// content that drifted from what an export would ship.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  ELF_CLOZE_UNIT,
  ELF_SHORT_UNIT,
  ESTIMATE_CAVEAT,
  EXPLANATIONS,
  LAS_UNIT,
  OVNINGSTEXT_BADGE,
  OVNINGSTEXT_NOTE,
  RETIRED_NOTICE,
  RETIRED_UNIT,
} from '@/components/devbake/ovningstextFixtures'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..', '..')
const read = (rel: string) => readFileSync(path.join(REPO, rel), 'utf8')

const UNITS = [LAS_UNIT, ELF_CLOZE_UNIT, ELF_SHORT_UNIT]

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

describe('ÖVNINGSTEXT bake-off fixture', () => {
  it('uses the approved disclosure copy verbatim', () => {
    const design = read('docs/p5-infold-design.md')
    expect(design).toContain(`**${OVNINGSTEXT_BADGE.toLocaleUpperCase('sv-SE')}**`)
    expect(design).toContain(`»${OVNINGSTEXT_NOTE}«`)
    expect(design).toContain(`»${ESTIMATE_CAVEAT}«`)
    expect(design).toContain(`“${RETIRED_NOTICE}”`)
  })

  it('copies every unit verbatim from the committed sample export', () => {
    const bank = JSON.parse(
      read('pipeline/synthetic/infold/preview/sample/p5-bank-sample.json'),
    ) as { questions: BankRow[] }
    for (const unit of UNITS) {
      const rows = bank.questions.filter((r) => r.unit_id === unit.unitId)
      expect(rows.map((r) => r.qid)).toEqual(unit.questions.map((q) => q.qid))
      rows.forEach((row, i) => {
        const q = unit.questions[i]
        expect(row.title).toBe(unit.title)
        expect(row.context).toBe(unit.context)
        expect(row.section).toBe(unit.section)
        expect(row.revision).toBe(unit.revision)
        expect({
          number: q.number,
          prompt: q.prompt,
          options: q.options,
          answer: q.answer,
        }).toEqual({
          number: row.number,
          prompt: row.prompt,
          options: row.options,
          answer: row.answer,
        })
      })
    }
  })

  it('copies the reviewed explanations verbatim from the pilot shard', () => {
    const shard = JSON.parse(read('data/explanations/p5-pilot.json')) as Record<string, unknown>
    const qids = UNITS.flatMap((u) => u.questions.map((q) => q.qid))
    expect(Object.keys(EXPLANATIONS).sort()).toEqual([...qids].sort())
    for (const qid of qids) expect(EXPLANATIONS[qid]).toEqual(shard[qid])
  })

  it('takes the retired unit and its keys from the registry and its candidate', () => {
    const registry = JSON.parse(read('pipeline/synthetic/RETIRED.json')) as {
      retired: Record<string, unknown>
    }
    expect(registry.retired[RETIRED_UNIT.unitId]).toBeDefined()
    const candidate = JSON.parse(
      read('pipeline/synthetic/batches/batch5/candidates-final/las-b5-001.json'),
    ) as { candidate_id: string; questions: { key: string }[] }
    expect(candidate.candidate_id).toBe(RETIRED_UNIT.unitId)
    expect(candidate.questions.map((q) => q.key)).toEqual(RETIRED_UNIT.keys)
  })
})
