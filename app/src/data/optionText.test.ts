import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import type { Question } from './questions'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const DATA = path.join(ROOT, 'app/public/data')
const EXAMS = readdirSync(DATA)
  .filter((file) => file.endsWith('.json') && file !== '_index.json')
  .sort()
  .map((file) => ({
    file,
    questions: JSON.parse(readFileSync(path.join(DATA, file), 'utf8')) as Question[],
  }))
const BANK = EXAMS.flatMap(({ questions }) => questions)
const FIXES = JSON.parse(
  readFileSync(path.join(ROOT, 'audit/corpus_lint/typo_fixes.json'), 'utf8'),
) as { option_fix: { qid: string; letter: string; text: string; correct: string }[] }
const KVA_OPTIONS = [
  { letter: 'A', text: 'I är större än II' },
  { letter: 'B', text: 'II är större än I' },
  { letter: 'C', text: 'I är lika med II' },
  { letter: 'D', text: 'informationen är otillräcklig' },
]

// PDF page chrome has paired dashes, unlike signed numbers, ranges,
// thousands groups, years, and multi-column numerical answer choices.
const PAGE_FOOTER = /(?:\s[–—−-]\s*\d{1,2}\s*[–—−-]|PROVET ÄR SLUT\..*)\s*$/u

describe('bank option text', () => {
  it('scans every served exam, including every manifest entry', () => {
    const manifest = JSON.parse(readFileSync(path.join(DATA, '_index.json'), 'utf8')) as {
      exams: { exam_id: string }[]
    }
    expect(manifest.exams.length).toBeGreaterThan(0)
    for (const { exam_id } of manifest.exams) {
      expect(EXAMS.map(({ file }) => file)).toContain(`${exam_id}.json`)
    }
    for (const { file, questions } of EXAMS) expect(questions.length, file).toBeGreaterThan(0)
  })

  it('uses exactly the four KVA answer templates throughout the bank', () => {
    const questions = BANK.filter((q) => q.section === 'KVA')
    expect(questions.length).toBeGreaterThan(0)
    const offenders = questions
      .filter(
        (q) =>
          q.options?.length !== KVA_OPTIONS.length ||
          KVA_OPTIONS.some(
            (expected, index) =>
              q.options?.[index]?.letter !== expected.letter ||
              q.options?.[index]?.text !== expected.text,
          ),
      )
      .map((q) => ({ qid: q.qid, options: q.options }))
    expect(offenders).toEqual([])
  })

  it('keeps the NOG final template free of trailing prompt fragments', () => {
    const questions = BANK.filter((q) => q.section === 'NOG')
    expect(questions.length).toBeGreaterThan(0)
    const offenders = questions
      .filter(
        (q) =>
          q.options?.find((option) => option.letter === 'E')?.text !==
          'ej genom de båda påståendena',
      )
      .map((q) => ({ qid: q.qid, option: q.options?.find((option) => option.letter === 'E') }))
    expect(offenders).toEqual([])
  })

  it('has no orphan PDF page footer at the end of any option', () => {
    const offenders = BANK.flatMap((q) =>
      (q.options ?? [])
        .filter((option) => PAGE_FOOTER.test(option.text))
        .map((option) => ({ qid: q.qid, ...option })),
    )
    expect(offenders).toEqual([])
  })

  it.each([
    '–3',
    '– 0,3',
    '1 200',
    'x > 2',
    '1987 och 1988',
    '27 0,42',
    'Båt 2',
  ])('allows the legitimate numeric option %s', (text) =>
    expect(PAGE_FOOTER.test(text)).toBe(false))

  it('keeps every verified correction, including bare numeric tails, in the served bank', () => {
    expect(FIXES.option_fix.length).toBeGreaterThan(0)
    const byQid = new Map(BANK.map((q) => [q.qid, q]))
    for (const fix of FIXES.option_fix) {
      expect(
        byQid.get(fix.qid)?.options?.find((option) => option.letter === fix.letter)?.text,
        `${fix.qid} ${fix.letter}`,
      ).toBe(fix.correct)
    }
  })

  it('reapplies exact post-parse fixes without touching other fields or numeric options', () => {
    // Exercise the real Python walker with an in-memory Path double: no
    // PDFs, network, test scratch, or modifications to the served corpus.
    const result = execFileSync(
      'python3',
      [
        '-B',
        '-c',
        `
import copy
import json
from collections import defaultdict
from pathlib import Path
from unittest.mock import Mock
from audit.corpus_lint.apply_typo_fixes import (
    build_option_replacements, build_phrase_replacements,
    build_replacements, walk_json_file,
)

fixes = json.loads(Path('audit/corpus_lint/typo_fixes.json').read_text())
rules = build_option_replacements(fixes['option_fix'])
for fix in fixes['option_fix']:
    q = {'qid': fix['qid'], 'section': fix['qid'].split('-')[-2],
         'prompt': fix['text'], 'options': [
             {'letter': fix['letter'], 'text': fix['text']},
             {'letter': 'A', 'text': fix['text']},
             {'letter': 'B', 'text': '1 200'},
         ]}
    other = {**copy.deepcopy(q), 'qid': 'unrelated-question'}
    different_text = {**q, 'options': [
        {'letter': fix['letter'], 'text': fix['text'] + ' extra'}]}
    before = [q, other, different_text]
    expected = copy.deepcopy(before)
    expected[0]['options'][0]['text'] = fix['correct']
    source = Mock(spec=Path)
    source.read_text.return_value = json.dumps(before)
    assert walk_json_file(source, [], defaultdict(int), option_fixes=rules)
    source.write_text.assert_not_called()
    counts = defaultdict(int)
    assert walk_json_file(source, [], counts, dry_run=False, option_fixes=rules)
    assert json.loads(source.write_text.call_args.args[0]) == expected, fix['qid']
    assert sum(counts.values()) == 1
    source.reset_mock()
    source.read_text.return_value = json.dumps(expected)
    assert not walk_json_file(source, [], counts, dry_run=False, option_fixes=rules)
    source.write_text.assert_not_called()
    assert sum(counts.values()) == 1

# Parser spelling is normalized before matching the exact option rule.
source = Mock(spec=Path)
source.read_text.return_value = json.dumps([{
    'qid': 'host-2014-kvant2-KVA-020', 'section': 'KVA',
    'options': [{'letter': 'D', 'text': 'informationen är otlilräcklig 0,4'}],
}])
replacements = build_phrase_replacements(fixes['phrase_fix']) + build_replacements(fixes['fix'])
assert walk_json_file(source, replacements, defaultdict(int), dry_run=False, option_fixes=rules)
assert json.loads(source.write_text.call_args.args[0])[0]['options'][0]['text'] == 'informationen är otillräcklig'
print('exact option fixes, dry-run, spelling order, and idempotence: PASS')
`,
      ],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    expect(result).toContain('idempotence: PASS')
  })
})
