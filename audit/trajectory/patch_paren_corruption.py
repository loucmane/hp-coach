"""
Hand-patch the 12 parsed entries corrupted by the PDF→text parser
reading `(` → `b` and `)` → `l`. Each fix is hand-verified against
the question's existing answer + explanation.

The parser bug is at the PDF-extraction level (likely font-shape
confusion with certain Times-style PDFs). Until the parser is fixed
at source, this script patches the parsed JSON in-place.

IMPORTANT: `data/parsed/` is gitignored (parser-regeneratable). The
patched JSON files do NOT get committed. This script IS committed —
re-run it after any `bygg_hp_databas.py` / parser regeneration to
re-apply the fixes.

    python3 audit/trajectory/patch_paren_corruption.py --apply

After running, the affected qids are removed from known_broken.json's
core list (kept as a `paren_corruption_qids_patched` annotation for audit).
"""
import json
import sys
from pathlib import Path


# qid → (original prompt, corrected prompt, exam_file)
# All corrections cross-checked against the explanation's solution_path
# and the answer key. See _v3_findings.md and patch_paren_corruption.md
# for full reasoning.
PATCHES = {
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


def main():
    dry_run = '--apply' not in sys.argv
    print(f'Mode: {"DRY RUN" if dry_run else "APPLY"}')
    print()

    # Group by file
    by_file = {}
    for qid, info in PATCHES.items():
        by_file.setdefault(info['file'], []).append((qid, info))

    for file_path, patches in by_file.items():
        path = Path(file_path)
        data = json.loads(path.read_text())
        # Build qid → entry index
        qid_to_idx = {q['qid']: i for i, q in enumerate(data)}
        changed = 0
        for qid, info in patches:
            idx = qid_to_idx.get(qid)
            if idx is None:
                print(f'  ✗ {qid}: not found in {file_path}')
                continue
            entry = data[idx]
            current = entry.get('prompt', '')
            if current != info['old_prompt']:
                print(f'  ✗ {qid}: current prompt does not match expected old_prompt')
                print(f'    current : {current!r}')
                print(f'    expected: {info["old_prompt"]!r}')
                continue
            if not dry_run:
                entry['prompt'] = info['new_prompt']
                # Annotate the meta field for audit trail
                meta = entry.setdefault('_meta', {})
                meta['paren_corruption_patched_at'] = '2026-05-11'
                meta['paren_corruption_source'] = 'trajectory_v3_audit'
            changed += 1
            print(f'  ✓ {qid}: ready to patch')
            print(f'    old: {info["old_prompt"][:120]}')
            print(f'    new: {info["new_prompt"][:120]}')

        if changed and not dry_run:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
            print(f'  → wrote {file_path} ({changed} entries)')
        elif changed:
            print(f'  (dry-run; {file_path} unchanged)')

    print()
    if dry_run:
        print('Dry run complete. Re-run with --apply to write changes.')
    else:
        print('Patches applied. Re-run technique_index.py and trajectory tests.')


if __name__ == '__main__':
    main()
