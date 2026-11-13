import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const INSTRUCTION = 'Koordinatsystemet kan användas för att lösa uppgiften.'
const RESTORED = [
  'host-ver1-2019-kvant1-KVA-020',
  'var-2022-1-kvant2-KVA-014',
  'var-2023-kvant1-KVA-015',
]
type Fix = {
  typo?: string
  phrase?: string
  correct: string
  swedish_only?: boolean
  exclude_hyphenated?: boolean
}
const fixes = JSON.parse(
  readFileSync(path.join(ROOT, 'audit/corpus_lint/typo_fixes.json'), 'utf8'),
) as { fix: Fix[]; phrase_fix: Fix[] }

function jsonFiles(directory: string) {
  return readdirSync(path.join(ROOT, directory))
    .filter((file) => file.endsWith('.json') && !file.startsWith('_'))
    .sort()
}

// Python's Unicode word boundaries include Swedish letters; JS \b does not.
const rules = [...fixes.phrase_fix, ...fixes.fix].map((fix) => ({
  ...fix,
  pattern: new RegExp(
    `(?<![\\p{L}\\p{N}_${fix.exclude_hyphenated ? '-' : ''}])${(fix.phrase ?? fix.typo ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_${fix.exclude_hyphenated ? '-' : ''}])`,
    'giu',
  ),
}))

function sweep(value: unknown, section?: string): unknown {
  if (typeof value === 'string') {
    return rules.reduce((text, rule) => {
      if (rule.swedish_only && (!section || section === 'ELF')) return text
      return text.replace(rule.pattern, (matched) => {
        if (!rule.correct) return ''
        if (matched.length > 1 && matched === matched.toUpperCase()) {
          return rule.correct.toUpperCase()
        }
        if (matched[0] !== matched[0].toLowerCase()) {
          return rule.correct[0].toUpperCase() + rule.correct.slice(1)
        }
        return rule.correct
      })
    }, value)
  }
  if (Array.isArray(value)) return value.map((item) => sweep(item, section))
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const inner = typeof object.section === 'string' ? object.section : section
    return Object.fromEntries(
      Object.entries(object).map(([key, item]) => [
        key,
        sweep(item, /-(KVA|XYZ|NOG|DTK|MEK|L[ÄA]S|ELF|ORD)-\d+$/.exec(key)?.[1] ?? inner),
      ]),
    )
  }
  return value
}

describe('curated typo sweep', () => {
  it.each([
    'app/public/data',
    'app/public/explanations',
    'app/public/frameworks',
  ])('has zero pending text replacements in %s', (directory) => {
    const pending: string[] = []
    const files = jsonFiles(directory)
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const data: unknown = JSON.parse(readFileSync(path.join(ROOT, directory, file), 'utf8'))
      if (JSON.stringify(sweep(data)) !== JSON.stringify(data)) pending.push(`${directory}/${file}`)
    }
    expect(pending).toEqual([])
  }, 60_000)

  it('serves byte-identical explanations for every canonical exam file', () => {
    const canonical = jsonFiles('data/explanations').filter((file) => /^(host|var)-/.test(file))
    expect(canonical.length).toBeGreaterThan(0)
    expect(jsonFiles('app/public/explanations')).toEqual(canonical)
    for (const file of canonical) {
      expect(readFileSync(path.join(ROOT, 'app/public/explanations', file), 'utf8'), file).toBe(
        readFileSync(path.join(ROOT, 'data/explanations', file), 'utf8'),
      )
    }
  })

  it('restores the instruction to its source question, including 2023 question 15', () => {
    const sources = JSON.parse(readFileSync(path.join(ROOT, 'hp_databas.json'), 'utf8')) as Record<
      string,
      Record<string, string>
    >
    for (const qid of RESTORED) {
      const [exam, part, , number] = /^(.*)-(kvant\d)-(KVA)-(\d+)$/.exec(qid)?.slice(1) ?? []
      const source = sources[exam][part].split(new RegExp(`\\n${Number(number)}\\. `))[1]
      expect(
        source.split(new RegExp(`\\n${Number(number) + 1}\\. `))[0].replace(/\s+/g, ' '),
      ).toContain(INSTRUCTION)
      const bank = JSON.parse(
        readFileSync(path.join(ROOT, 'app/public/data', `${exam}.json`), 'utf8'),
      ) as {
        qid: string
        prompt: string
      }[]
      expect(bank.find((q) => q.qid === qid)?.prompt, qid).toContain(INSTRUCTION)
      if (exam === 'var-2023') {
        expect(bank.find((q) => q.qid === 'var-2023-kvant1-KVA-016')?.prompt).not.toContain(
          INSTRUCTION,
        )
      }
    }
  })

  it('counts actual edits and preserves correct words, mathematics and ELF English', () => {
    const result = execFileSync(
      'python3',
      [
        '-B',
        '-c',
        `
import json
from collections import defaultdict
from pathlib import Path
from audit.corpus_lint.apply_typo_fixes import build_replacements, build_phrase_replacements, apply_to_text
fixes = json.loads(Path('audit/corpus_lint/typo_fixes.json').read_text())
rules = build_phrase_replacements(fixes['phrase_fix']) + build_replacements(fixes['fix'])
counts = defaultdict(int)
text = 'drift kateterna etisk Etisk av Gud AV GUD; 12 · 6 = 72; x-intercept; negativ y-skärning; intercept-teoremet; Intercept-proportioner'
assert apply_to_text(text, rules, counts, 'KVA') == text
assert sum(counts.values()) == 0, dict(counts)
english = 'Athletes peak professionally; a bilingual historian can intercept the cue.'
assert apply_to_text(english, rules, counts, 'ELF') == english
assert sum(counts.values()) == 0
assert apply_to_text('av gud; av Gud; AV GUD', rules, counts, 'MEK') == 'av Gud; av Gud; AV GUD'
assert counts['av gud'] == 1
assert apply_to_text('negativ y; y-intercept; peak; PEAK', rules, counts, 'KVA') == 'negativt y; y-skärning; kulmen; KULMEN'
assert apply_to_text('peak intercept cue', rules, counts, None) == 'peak intercept cue'
print('preservation and actual edit counts: PASS')
`,
      ],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    expect(result).toContain('PASS')
  })

  it('replays exact prompt fixes once, preserves other fields, and escapes math delimiters', () => {
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
from audit.corpus_lint.apply_typo_fixes import build_prompt_replacements, walk_json_file
fixes = json.loads(Path('audit/corpus_lint/typo_fixes.json').read_text())['prompt_fix']
assert {f['qid'] for f in fixes} == {
    'host-ver1-2019-kvant1-KVA-020', 'var-2022-1-kvant2-KVA-014',
    'var-2023-kvant1-KVA-015',
}
rules = build_prompt_replacements(fixes)
for fix in fixes:
    q = {'qid': fix['qid'], 'section': 'KVA', 'prompt': fix['text'],
         'answer': 'D', 'options': [{'letter': 'D', 'text': 'informationen är otillräcklig'}],
         'context': chr(0xe000) + '12 · 6 = 72' + chr(0xe001)}
    before = [q, {**q, 'qid': 'unrelated'}, {**q, 'prompt': fix['text'] + ' extra'}]
    expected = copy.deepcopy(before)
    expected[0]['prompt'] = fix['correct']
    source = Mock(spec=Path)
    source.read_text.return_value = json.dumps(before, indent=1) + chr(10)
    counts = defaultdict(int)
    assert walk_json_file(source, [], counts, prompt_fixes=rules)
    source.write_text.assert_not_called()
    assert sum(counts.values()) == 1
    counts.clear()
    assert walk_json_file(source, [], counts, dry_run=False, prompt_fixes=rules)
    serialized = source.write_text.call_args.args[0]
    assert json.loads(serialized) == expected
    assert serialized.splitlines()[1] == ' {'
    assert serialized.endswith(chr(10))
    assert chr(0xe000) not in serialized and chr(0xe001) not in serialized
    assert sum(counts.values()) == 1
    source.reset_mock()
    source.read_text.return_value = serialized
    counts.clear()
    assert not walk_json_file(source, [], counts, dry_run=False, prompt_fixes=rules)
    source.write_text.assert_not_called()
    assert sum(counts.values()) == 0
try:
    build_prompt_replacements([fixes[0], fixes[0]])
except ValueError:
    pass
else:
    raise AssertionError('duplicate prompt rule accepted')
print('prompt replay, isolation, escapes and idempotence: PASS')
`,
      ],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    expect(result).toContain('PASS')
  })

  it('routes apply through the same walker for canonical and served copies', () => {
    const result = execFileSync(
      'python3',
      [
        '-B',
        '-c',
        `
from pathlib import Path
from unittest.mock import patch
from audit.corpus_lint import apply_typo_fixes as sweep
# Inspect actual CLI routing without writing any corpus files.
with patch('sys.argv', ['apply_typo_fixes.py', '--apply']), patch.object(sweep, 'walk_json_file', return_value=False) as walker:
    sweep.main()
calls = {str(c.args[0].relative_to(sweep.ROOT)): c for c in walker.call_args_list}
for directory in ('data/explanations', 'frameworks'):
    for p in (sweep.ROOT / directory).glob('*.json'):
        if p.name.startswith('_') or p.name == 'p5-pilot.json':
            continue
        canonical = str(p.relative_to(sweep.ROOT))
        served = ('app/public/explanations/' if directory == 'data/explanations' else 'app/public/frameworks/') + p.name
        assert canonical in calls and served in calls, canonical
        assert calls[canonical].kwargs == calls[served].kwargs
        assert calls[canonical].kwargs['dry_run'] is False
        assert calls[canonical].args[1] == calls[served].args[1]
        assert calls[canonical].kwargs['prompt_fixes']
with patch('sys.argv', ['apply_typo_fixes.py', '--options-only']), patch.object(sweep, 'walk_json_file', return_value=False) as walker:
    sweep.main()
assert walker.call_count > 0
for call in walker.call_args_list:
    assert call.args[1] == []
    assert call.kwargs['prompt_fixes'] == {}
    assert call.kwargs['dry_run'] is True
print('canonical/served apply routing and options-only isolation: PASS')
`,
      ],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    expect(result).toContain('PASS')
  })
})
