import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Question } from '@/data/questions'
import { toDrillQuestion } from '@/folio/screens/drill/toDrillQuestion'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
type ScopedText = { qids: string[]; text: string; reason?: string; correct?: string }
type CitationFix = {
  qid: string
  path: (string | number)[]
  text: string
  correct: string
  paragraphs: number[]
}
const fixes = JSON.parse(
  readFileSync(path.join(ROOT, 'audit/corpus_lint/typo_fixes.json'), 'utf8'),
) as {
  passage_fix: ScopedText[]
  paragraph_allow: ScopedText[]
  boundary_allow: ScopedText[]
  citation_fix: CitationFix[]
}
const bank: Question[] = readdirSync(path.join(ROOT, 'app/public/data'))
  .filter((name) => /^(host|var)-.*\.json$/.test(name))
  .sort()
  .flatMap((name) => JSON.parse(readFileSync(path.join(ROOT, 'app/public/data', name), 'utf8')))

describe('reading passage paragraphs', () => {
  it('does not split the reported Swedish sentences across paragraphs', () => {
    const examples = [
      ['var-2022-1-verb1-LÄS-017', 'grubbleriets ekorrhjul'],
      ['var-2013-verb2-LÄS-017', 'och när detta kyls av ökar dess densitet'],
      ['var-2013-verb2-LÄS-017', 'Hur djupt detta vatten med hög salthalt'],
    ]
    for (const [qid, sentence] of examples) {
      expect(bank.find((q) => q.qid === qid)?.context, qid).toContain(sentence)
    }
  })

  it('preserves source paragraphs within a column when joining column breaks', () => {
    const question = bank.find((q) => q.qid === 'var-2019-verb1-LÄS-017')
    expect(question).toBeDefined()
    if (!question) return
    const paragraphs = toDrillQuestion(question).passage?.paragraphs ?? []
    expect(paragraphs[3]).toMatch(/^Demokrati är ett honnörsord/)
    expect(paragraphs[4]).toContain('formella strukturer och lära sig sådant som mötesformalia')
    expect(paragraphs[5]).toMatch(/^För det andra så speglar inte styrdokumenten/)
  })

  it('has no unreviewed lowercase openings or unfinished prose at a boundary', () => {
    const seen = new Set<string>()
    const suspicious: string[] = []
    for (const q of bank) {
      if (!['LÄS', 'ELF'].includes(q.section) || !q.context) continue
      const key = `${q.exam_id}/${q.provpass}/${q.context}`
      if (seen.has(key)) continue
      seen.add(key)
      const paragraphs = toDrillQuestion(q).passage?.paragraphs ?? []
      for (const [index, paragraph] of paragraphs.entries()) {
        // Numerals are valid openings; punctuation before a letter is not
        // a way to hide a lowercase continuation (quotes and parentheses).
        const allowed = fixes.paragraph_allow.some(
          (rule) => rule.qids.includes(q.qid) && rule.text === paragraph && rule.reason,
        )
        if (/^[^\p{L}\p{N}]*\p{Ll}/u.test(paragraph) && !allowed) {
          suspicious.push(`${q.qid} ¶${index + 1}: ${paragraph.slice(0, 65)}`)
        }
        const previous = paragraphs[index - 1]
        if (
          previous?.length > 150 &&
          paragraph.trim() &&
          !/[.!?:…][\s”"’')\]]*$/u.test(previous) &&
          !allowed
        ) {
          const boundary = `${previous.slice(-80)}\n\n${paragraph.slice(0, 80)}`
          if (
            !fixes.boundary_allow.some(
              (rule) => rule.qids.includes(q.qid) && rule.text === boundary && rule.reason,
            )
          ) {
            suspicious.push(`${q.qid} ¶${index + 1}: unfinished previous paragraph`)
          }
        }
      }
    }
    expect(suspicious).toEqual([])
  })

  it('has replayed every scoped repair, including uppercase continuations', () => {
    for (const rule of fixes.passage_fix) {
      for (const qid of rule.qids) {
        const question = bank.find((q) => q.qid === qid)
        expect(question, qid).toBeDefined()
        expect(question?.context, qid).not.toContain(rule.text)
        expect(question?.context, qid).toContain(rule.correct)
      }
    }
  })

  it('serves each reviewed citation at the same field in both stores', () => {
    for (const rule of fixes.citation_fix) {
      const question = bank.find((q) => q.qid === rule.qid)
      expect(question, rule.qid).toBeDefined()
      if (!question) continue
      for (const directory of ['data/explanations', 'app/public/explanations']) {
        const entries = JSON.parse(
          readFileSync(path.join(ROOT, directory, `${question.exam_id}.json`), 'utf8'),
        ) as Record<string, unknown>
        let value: unknown = entries[rule.qid]
        for (const key of rule.path) value = (value as Record<string | number, unknown>)[key]
        expect(value, `${directory}/${rule.qid}/${rule.path.join('.')}`).toBe(rule.correct)
      }
      const paragraphs = toDrillQuestion(question).passage?.paragraphs ?? []
      for (const number of rule.paragraphs) {
        expect(paragraphs[number - 1]?.length, rule.qid).toBeGreaterThan(100)
      }
    }
  })

  it('replays all repairs idempotently without changing other questions or fields', () => {
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
from unittest.mock import Mock, patch
from audit.corpus_lint import apply_typo_fixes as sweep
fixes = json.loads(Path('audit/corpus_lint/typo_fixes.json').read_text())
passages = sweep.build_passage_replacements(fixes['passage_fix'])
citations = sweep.build_citation_replacements(fixes['citation_fix'])
for fix in fixes['passage_fix']:
    qid = fix['qids'][0]
    question = {'qid': qid, 'section': qid.split('-')[-2], 'context': fix['text'],
                'prompt': fix['text'], 'answer': 'C', 'options': [{'letter': 'C', 'text': fix['text']}]}
    original = copy.deepcopy(question)
    counts = defaultdict(int)
    corrected = sweep.apply_passage_fixes(question, passages, counts)
    assert corrected == {**question, 'context': fix['correct']}, qid
    assert question == original
    assert sum(counts.values()) == 1
    counts.clear()
    assert sweep.apply_passage_fixes(corrected, passages, counts) == corrected
    assert sweep.apply_passage_fixes({**question, 'qid': 'unrelated'}, passages, counts) == {**question, 'qid': 'unrelated'}
    assert sweep.apply_passage_fixes({**question, 'section': 'MEK'}, passages, counts) == {**question, 'section': 'MEK'}
    assert not counts
for fix in fixes['citation_fix']:
    value = fix['text']
    for key in reversed(fix['path']):
        value = [None] * key + [value] if isinstance(key, int) else {key: value}
    value['unrelated'] = fix['text']
    original = copy.deepcopy(value)
    source = Mock(spec=Path)
    source.read_text.return_value = json.dumps({fix['qid']: value, 'unrelated-LÄS-001': value}, indent=1)
    counts = defaultdict(int)
    assert sweep.walk_json_file(source, [], counts, dry_run=False, citation_fixes=citations)
    output = source.write_text.call_args.args[0]
    parsed = json.loads(output)
    actual = parsed[fix['qid']]
    assert actual['unrelated'] == fix['text']
    assert parsed['unrelated-LÄS-001'] == original
    assert value == original
    for key in fix['path']: actual = actual[key]
    assert actual == fix['correct']
    counts.clear()
    source.reset_mock()
    source.read_text.return_value = output
    assert not sweep.walk_json_file(source, [], counts, dry_run=False, citation_fixes=citations)
    source.write_text.assert_not_called()
    assert not counts
for builder, rules in ((sweep.build_passage_replacements, fixes['passage_fix']),
                       (sweep.build_citation_replacements, fixes['citation_fix'])):
    try:
        builder([rules[0], rules[0]])
    except ValueError:
        pass
    else:
        raise AssertionError('duplicate repair accepted')
with patch('sys.argv', ['apply_typo_fixes.py', '--options-only']), patch.object(sweep, 'walk_json_file', return_value=False) as walker:
    sweep.main()
    assert walker.call_count > 0
    for call in walker.call_args_list:
        assert call.kwargs['passage_fixes'] == {}
        assert call.kwargs['citation_fixes'] == {}
print('passage/citation replay, isolation and idempotence: PASS')
`,
      ],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    expect(result).toContain('PASS')
  })
})
