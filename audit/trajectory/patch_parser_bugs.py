"""
Hand-patch parsed entries with parser-extraction bugs surfaced by the
trajectory simulation. Each fix is hand-verified against the
question's existing answer + explanation.

Two bug classes handled here:

1. PAREN_PATCHES — `(` misread as `b`, `)` as `l` (font-shape confusion
   in Times-style PDFs). 12 entries.

2. MISSING_OPERAND_PATCHES — math operand or sqrt symbol stripped
   from the prompt, leaving the question literally missing its core
   expression. 3 entries surfaced by step 3 (full-seed50 trajectory).

The parser bugs are at the PDF-extraction level. Until the parser is
fixed at source, this script patches the parsed JSON in-place.

IMPORTANT: `data/parsed/` is gitignored (parser-regeneratable). The
patched JSON files do NOT get committed. This script IS committed —
re-run it after any `bygg_hp_databas.py` / parser regeneration to
re-apply the fixes.

    python3 audit/trajectory/patch_parser_bugs.py --apply

After running, the affected qids appear in known_broken.json's
*_patched annotations for audit.
"""
import json
import sys
from pathlib import Path


# qid → (original prompt, corrected prompt, exam_file)
# All corrections cross-checked against the explanation's solution_path
# and the answer key. See _v3_findings.md for full reasoning.
PAREN_PATCHES = {
    'host-2014-kvant2-XYZ-002': {
        # Answer C = -125/8 = (-5/2)^3. Prompt lost the fraction body
        # and the exponent. Reconstructed as standard HP form.
        'old_prompt': 'Vad är b- l ? 2',
        'new_prompt': 'Vad är \\left(-\\frac{5}{2}\\right)^{3}?',
        'file': 'data/parsed/host-2014.json',
    },
    'host-2017-kvant1-XYZ-011': {
        # |x/4 + 1/2| · |x/4 - 1/2| is wrong — actual answer is
        # x^2/16 - 1/4 (conjugate, NOT abs-value).
        # 'b ... lb ... l' = '(...)( ... )'.
        # Trailing '? 1 x^{2}' is bleed from option line.
        'old_prompt': 'Vad är b \\frac{x}{4} + \\frac{1}{2} lb \\frac{x}{4} - \\frac{1}{2} l? 1 x^{2}',
        'new_prompt': 'Vad är \\left(\\frac{x}{4} + \\frac{1}{2}\\right)\\left(\\frac{x}{4} - \\frac{1}{2}\\right)?',
        'file': 'data/parsed/host-2017.json',
    },
    'host-2020-kvant1-XYZ-004': {
        # f(1/3) with f(x) = 3x+1. 'fb ... l' = 'f( ... )'.
        'old_prompt': 'f(x) = 3x+1 Vilket svarsalternativ motsvarar fb \\frac{1}{3} l?',
        'new_prompt': 'f(x) = 3x+1 Vilket svarsalternativ motsvarar f\\left(\\frac{1}{3}\\right)?',
        'file': 'data/parsed/host-2020.json',
    },
    'host-2021-kvant2-KVA-013': {
        # 3(2/x - 1/6) = 3/2.
        'old_prompt': '3b \\frac{2}{x} - \\frac{1}{6} l = \\frac{3}{2} Kvanttiet I: x Kvanttiet II: \\frac{1}{3}',
        'new_prompt': '3\\left(\\frac{2}{x} - \\frac{1}{6}\\right) = \\frac{3}{2}  Kvantitet I: x  Kvantitet II: \\frac{1}{3}',
        'file': 'data/parsed/host-2021.json',
    },
    'host-2025-kvant2-KVA-022': {
        # (1+1/2)(1-1/3)(1+1/4)(1-1/5). Multi-paren run.
        'old_prompt': 'Kvanttiet I: b1+ \\frac{1}{2} lb1- \\frac{1}{3} lb1+ \\frac{1}{4} lb1- \\frac{1}{5} l Kvanttiet II: 1',
        'new_prompt': 'Kvantitet I: \\left(1+\\frac{1}{2}\\right)\\left(1-\\frac{1}{3}\\right)\\left(1+\\frac{1}{4}\\right)\\left(1-\\frac{1}{5}\\right)  Kvantitet II: 1',
        'file': 'data/parsed/host-2025.json',
    },
    'var-2014-kvant2-XYZ-009': {
        # 100·(1/10 - 1/1000) per explanation. Fraction body also
        # has extra space → 'frac{1 1}{10 1000}' should be two
        # separate fractions 1/10 and 1/1000.
        'old_prompt': 'Vad är  100b\\frac{1 1}{10 1000}- l?',
        'new_prompt': 'Vad är 100\\left(\\frac{1}{10} - \\frac{1}{1000}\\right)?',
        'file': 'data/parsed/var-2014.json',
    },
    'var-2019-kvant1-XYZ-006': {
        # f(2/3) = 0, find m. f(x) = 3/2 x + m.
        'old_prompt': 'f(x) = \\frac{3}{2} x+m f b \\frac{2}{3} l = 0 Vad är m?',
        'new_prompt': 'f(x) = \\frac{3}{2}x + m,  f\\left(\\frac{2}{3}\\right) = 0.  Vad är m?',
        'file': 'data/parsed/var-2019.json',
    },
    'var-2023-kvant2-XYZ-005': {
        # (1/2 + 2/5)(1/2 - 2/5) — conjugate, NOT abs-value as I
        # first hypothesised. Explanation confirms "Konjugatregel".
        'old_prompt': 'Vad är b \\frac{1}{2} + \\frac{2}{5} lb \\frac{1}{2} - \\frac{2}{5} l?',
        'new_prompt': 'Vad är \\left(\\frac{1}{2} + \\frac{2}{5}\\right)\\left(\\frac{1}{2} - \\frac{2}{5}\\right)?',
        'file': 'data/parsed/var-2023.json',
    },
    'var-2024-kvant2-XYZ-003': {
        # 1/3 - (1/2 + 1/6).
        'old_prompt': 'Vad är \\frac{1}{3} -b \\frac{1}{2} + \\frac{1}{6} l?',
        'new_prompt': 'Vad är \\frac{1}{3} - \\left(\\frac{1}{2} + \\frac{1}{6}\\right)?',
        'file': 'data/parsed/var-2024.json',
    },
    'var-2025-kvant2-KVA-020': {
        # 2x + 1 = 2(x + 1/2) — identity.
        'old_prompt': '2x+1 = 2bx+ \\frac{1}{2} l Kvanttiet I: x Kvanttiet II: - \\frac{1}{2}',
        'new_prompt': '2x + 1 = 2\\left(x + \\frac{1}{2}\\right)  Kvantitet I: x  Kvantitet II: -\\frac{1}{2}',
        'file': 'data/parsed/var-2025.json',
    },
    'var-2026-kvant1-KVA-019': {
        # I = 1/3 - 1/2 = -1/6. II = 1/2 · (-1/3) = -1/6. Equal → C.
        'old_prompt': 'Kvanttiet I: \\frac{1}{3} - \\frac{1}{2} Kvanttiet II: \\frac{1}{2} ·b- \\frac{1}{3} l',
        'new_prompt': 'Kvantitet I: \\frac{1}{3} - \\frac{1}{2}  Kvantitet II: \\frac{1}{2} \\cdot \\left(-\\frac{1}{3}\\right)',
        'file': 'data/parsed/var-2026.json',
    },
    'var-2026-kvant1-XYZ-002': {
        # f(5/3) with f(x) = 1/5 x + 3/5.
        'old_prompt': 'f(x) = \\frac{1}{5} x+ \\frac{3}{5} Vilket svarsalternativ är lika med fb \\frac{5}{3} l?',
        'new_prompt': 'f(x) = \\frac{1}{5}x + \\frac{3}{5}.  Vilket svarsalternativ är lika med f\\left(\\frac{5}{3}\\right)?',
        'file': 'data/parsed/var-2026.json',
    },
}


# Missing-operand/sqrt parser bugs — surfaced by step 3
# (full-seed50 trajectory). Math operand or sqrt wrapper stripped from
# prompt or option. Some entries also have option-text bleed from
# neighboring questions. Supports an optional `options` list for
# letter-specific text fixes.
MISSING_OPERAND_PATCHES = {
    'var-2014-kvant2-XYZ-002': {
        # Solution: (x^2)^4 / x^5 = x^8/x^5 = x^3. The (x^2)^4 numerator
        # was stripped, leaving "Vad blir ? x^5". Option D has bleed from
        # a NOG sampling-occasions question.
        'old_prompt': 'Vad blir ? \xee\x80\x80x^{5}\xee\x80\x81',
        'new_prompt': 'Vad blir \xee\x80\x80\\frac{(x^{2})^{4}}{x^{5}}\xee\x80\x81?',
        'options': [
            {
                'letter': 'D',
                'old_text': '\xee\x80\x80x^{11}\xee\x80\x81 Senare delen av april3. Senare delen av maj 6. Slutet av september Provtagningstillf\xc3\xa4llen:',
                'new_text': '\xee\x80\x80x^{11}\xee\x80\x81',
            },
        ],
        'file': 'data/parsed/var-2014.json',
    },
    'host-ver2-2019-kvant1-XYZ-010': {
        # Solution: sqrt(12 x y^4 z^3) = 2 y^2 z sqrt(3 x z).
        # Prompt is missing the outer \sqrt{} wrapper. Option D has
        # bleed about "av arean av cirkeln B".
        'old_prompt': 'x, y och z \xc3\xa4r positiva tal. Vilket svarsalternativ motsvarar 12\xee\x80\x80xy^{4}\xee\x80\x81 \xee\x80\x80z^{3}\xee\x80\x81 ?',
        'new_prompt': 'x, y och z \xc3\xa4r positiva tal. Vilket svarsalternativ motsvarar \xee\x80\x80\\sqrt{12xy^{4}z^{3}}\xee\x80\x81?',
        'options': [
            {
                'letter': 'D',
                'old_text': '6\xee\x80\x80y^{2}\xee\x80\x81 z 2xz 1  av arean av cirkeln B. 4',
                'new_text': '6\xee\x80\x80y^{2}z\\sqrt{2xz}\xee\x80\x81',
            },
        ],
        'file': 'data/parsed/host-ver2-2019.json',
    },
    'var-2026-kvant2-XYZ-005': {
        # Solution: (1/4 + 1/5) / (1/6) = (9/20) * 6 = 54/20 = 27/10.
        # Prompt is missing the compound-fraction numerator.
        'old_prompt': 'Vad \xc3\xa4r ? \xee\x80\x80\\frac{1}{6}\xee\x80\x81',
        'new_prompt': 'Vad \xc3\xa4r \xee\x80\x80\\frac{\\frac{1}{4} + \\frac{1}{5}}{\\frac{1}{6}}\xee\x80\x81?',
        'file': 'data/parsed/var-2026.json',
    },
}


def normalize(s):
    """Strip PUA wrap chars for logical equality across round-trips."""
    return s.replace('\ue000', '').replace('\ue001', '')


def apply_patch_dict(patches_dict, label, dry_run, today='2026-05-11'):
    """Apply a dict of patches. Each entry: {old_prompt, new_prompt, file,
    optional options: [{letter, old_text, new_text}, ...]}.
    Returns (n_applied, n_skipped_already_patched).
    """
    by_file = {}
    for qid, info in patches_dict.items():
        by_file.setdefault(info['file'], []).append((qid, info))

    n_applied = 0
    n_skipped = 0
    for file_path, patches in by_file.items():
        path = Path(file_path)
        data = json.loads(path.read_text())
        qid_to_idx = {q['qid']: i for i, q in enumerate(data)}
        changed = 0
        for qid, info in patches:
            idx = qid_to_idx.get(qid)
            if idx is None:
                print(f'  \u2717 {qid}: not found in {file_path}')
                continue
            entry = data[idx]
            current_prompt = entry.get('prompt', '')

            prompt_match = normalize(current_prompt) == normalize(info['new_prompt'])
            opts_match = True
            if 'options' in info:
                opts = entry.get('options', [])
                for op in info['options']:
                    current_text = next(
                        (o.get('text', '') for o in opts if o.get('letter') == op['letter']),
                        '',
                    )
                    if normalize(current_text) != normalize(op['new_text']):
                        opts_match = False
                        break
            if prompt_match and opts_match:
                print(f'  \u00b7 {qid}: already patched (skip)')
                n_skipped += 1
                continue

            if current_prompt != info['old_prompt']:
                print(f'  \u2717 {qid}: current prompt does not match expected')
                print(f'    current : {current_prompt!r}')
                print(f'    expected: {info["old_prompt"]!r}')
                continue

            if not dry_run:
                entry['prompt'] = info['new_prompt']
                if 'options' in info:
                    for op_patch in info['options']:
                        for o in entry.get('options', []):
                            if o.get('letter') == op_patch['letter']:
                                if o.get('text', '') == op_patch['old_text']:
                                    o['text'] = op_patch['new_text']
                                break
                meta = entry.setdefault('_meta', {})
                meta[f'{label}_patched_at'] = today
                meta[f'{label}_source'] = 'trajectory_audit'
            changed += 1
            n_applied += 1
            print(f'  \u2713 {qid}: patched')

        if changed and not dry_run:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
            print(f'  \u2192 wrote {file_path} ({changed} entries)')

    return n_applied, n_skipped


def main():
    dry_run = '--apply' not in sys.argv
    print(f'Mode: {"DRY RUN" if dry_run else "APPLY"}')

    print('\n\u2501\u2501\u2501 Class 1: paren-corruption \u2501\u2501\u2501')
    a1, s1 = apply_patch_dict(PAREN_PATCHES, 'paren_corruption', dry_run)
    print(f'  ({a1} new, {s1} already patched)')

    print('\n\u2501\u2501\u2501 Class 2: missing-operand/sqrt \u2501\u2501\u2501')
    a2, s2 = apply_patch_dict(MISSING_OPERAND_PATCHES, 'missing_operand', dry_run)
    print(f'  ({a2} new, {s2} already patched)')

    print()
    if dry_run:
        print(f'Dry run: {a1+a2} new patches ready. Re-run with --apply.')
    else:
        print(f'Applied: {a1+a2} new patches.')


if __name__ == '__main__':
    main()
