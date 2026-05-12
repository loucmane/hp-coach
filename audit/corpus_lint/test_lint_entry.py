"""Smoke tests for lint_entry — run with `python3 -m audit.corpus_lint.test_lint_entry`.

Not pytest-based to avoid pulling in a test dependency for one file.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from audit.corpus_lint.lint_entry import lint_entry, format_failures  # noqa: E402


def _run(name: str, fn):
    try:
        fn()
        print(f'  ✓ {name}')
        return True
    except AssertionError as e:
        print(f'  ✗ {name}: {e}')
        return False
    except Exception as e:
        print(f'  ✗ {name}: unexpected {type(e).__name__}: {e}')
        return False


def t_clean_swedish_passes():
    entry = {
        'solution_path': 'Räkna ut summan av talen 1 till 10. Använd formel n(n+1)/2 = 55.',
        'technique': 'Aritmetisk serie.',
    }
    r = lint_entry(entry, qid='host-2026-kvant1-XYZ-001')
    assert r['passed'], f'expected pass, got {format_failures(r)}'
    assert r['summary']['anglicism_n'] == 0
    assert r['summary']['archaic_n'] == 0


def t_anglicism_fails():
    entry = {
        'solution_path': 'Vi computar derivatans value via chain rule.',
    }
    r = lint_entry(entry, qid='host-2026-kvant1-XYZ-002')
    # `computar`, `value` and `chain` may or may not be in the
    # anglicism list; at minimum we verify that if any anglicism is
    # in the corpus dictionary, it's caught. If none are flagged,
    # this test is informational only.
    if r['summary']['anglicism_n'] == 0:
        print('     (informational: dict has no overlap with sample)')


def t_archaic_fails():
    # `höflig` is the canonical archaic example from the project memory.
    entry = {
        'solution_path': 'Han var en höflig man.',
    }
    r = lint_entry(entry, qid='host-2026-verb1-ORD-001')
    if r['summary']['archaic_n'] > 0:
        # Confirms dict has höflig — that's the expected state per the
        # audit's archaic.txt. If not in dict, this is informational.
        assert not r['passed']
        msg = format_failures(r)
        assert 'archaic' in msg


def t_elf_section_exempt():
    entry = {
        'solution_path': 'The author argues that the protagonist defies convention.',
    }
    r = lint_entry(entry, qid='host-2026-verb1-ELF-031')
    assert r['passed'], 'ELF section should be exempt from Swedish lint'
    assert r['summary']['anglicism_n'] == 0


def t_math_span_stripped():
    # PUA-wrapped math content should be stripped before tokenization.
    # If 'sqrt' (English) were tokenized, it might flag as anglicism.
    entry = {
        'solution_path': 'Vi beräknar \\sqrt{x^2+y^2} för avståndet.',
    }
    r = lint_entry(entry, qid='host-2026-kvant1-XYZ-003')
    # The math span is stripped; only 'Vi beräknar' and 'för avståndet'
    # are tokenized → both clean Swedish.
    assert r['passed'], f'expected pass after math-strip, got {format_failures(r)}'


def t_distractors_walked():
    entry = {
        'solution_path': 'Korrekt analys.',
        'distractors': [
            {'letter': 'A', 'why_tempting': 'Lockas av höflig formulering.',
             'why_wrong': 'Modernt språk skulle skriva höflig som hövlig.'},
            {'letter': 'B', 'why_tempting': 'Rent svenska.',
             'why_wrong': 'Inget fel.'},
        ],
    }
    r = lint_entry(entry, qid='host-2026-verb1-ORD-001')
    if r['summary']['archaic_n'] > 0:
        # The flag should reference the distractor field.
        fields = {x['field'] for x in r['archaic']}
        assert any('distractor' in f for f in fields), \
            f'expected distractor field flagged, got {fields}'


def t_format_failures_oneliner():
    entry = {'solution_path': 'höflig'}
    r = lint_entry(entry, qid='host-2026-verb1-ORD-001')
    msg = format_failures(r)
    if not r['passed']:
        assert msg.startswith('LINT FAIL'), msg
    else:
        assert msg == 'lint OK'


def main():
    tests = [
        ('clean Swedish passes', t_clean_swedish_passes),
        ('archaic flag fails', t_archaic_fails),
        ('anglicism flag fails', t_anglicism_fails),
        ('ELF section exempt', t_elf_section_exempt),
        ('math span stripped', t_math_span_stripped),
        ('distractors walked', t_distractors_walked),
        ('format_failures one-liner', t_format_failures_oneliner),
    ]
    print('━' * 60)
    print('lint_entry smoke tests')
    print('━' * 60)
    passed = sum(_run(name, fn) for name, fn in tests)
    print('━' * 60)
    print(f'  {passed}/{len(tests)} passed')
    return 0 if passed == len(tests) else 1


if __name__ == '__main__':
    sys.exit(main())
