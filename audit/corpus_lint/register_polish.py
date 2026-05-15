"""Scan Variant-C explanations for prose-register patterns to retire.

Sister pass to `apply_typo_fixes.py`, but at the prose level (multi-word
register patterns) instead of single-token typos. Operates on the
locked Variant-C corpus (`_meta.recipe == 'variant-c-ultra-granular'`)
and routes each flagged entry to a subagent batch for contextual
rewrite — not a blind regex replace, because the same phrase needs
different fixes in different contexts.

Workflow:

  1. python3 audit/corpus_lint/register_polish.py
     → scans data/explanations/, writes:
        - audit/corpus_lint/register_flags.json
            per-entry list of flagged phrases + surrounding snippet
        - audit/corpus_lint/register_batches.json
            grouped by exam-section, ready for Agent-tool fan-out
        - prints summary table

  2. (manual) inspect register_flags.json; confirm flags look like
     real targets, not false positives.

  3. (manual / orchestration) spawn one subagent per non-empty
     exam-section batch. Prompt directives in
     audit/corpus_lint/prompts/register_polish.md. Each agent writes
     audit/_regen_polish/<exam>-<section>.json.

  4. python3 audit/corpus_lint/register_polish.py --merge
     → merges audit/_regen_polish/*.json back into
       data/explanations/<exam>.json, validates against schema,
       reports any drift.

Pattern source: audit/corpus_lint/patterns_register.txt
Authoritative recipe: pipeline/explanations/prompts.py (Variant C)
Schema: pipeline/explanations/schema.py
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from pipeline.explanations.schema import validate_explanation  # noqa: E402

SCRIPT_DIR = Path(__file__).parent
PATTERNS_FILE = SCRIPT_DIR / 'patterns_register.txt'
FLAGS_OUT = SCRIPT_DIR / 'register_flags.json'
BATCHES_OUT = SCRIPT_DIR / 'register_batches.json'
POLISH_DIR = ROOT / 'audit' / '_regen_polish'
DATA_DIR = ROOT / 'data' / 'explanations'

VARIANT_C_RECIPE = 'variant-c-ultra-granular'


def load_patterns() -> list[tuple[str, re.Pattern]]:
    """Read patterns_register.txt → list of (label, compiled_regex)."""
    out: list[tuple[str, re.Pattern]] = []
    for line in PATTERNS_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        # Label is the regex source minus word-boundaries / escapes,
        # rendered as a human-readable tag.
        label = re.sub(r'\\b|\\s\*', '', line).replace('\\', '')
        out.append((label, re.compile(line, re.IGNORECASE)))
    return out


def iter_variant_c() -> list[tuple[Path, str, dict]]:
    """Yield (file, qid, entry) for every Variant-C explanation."""
    for f in sorted(DATA_DIR.glob('*.json')):
        data = json.loads(f.read_text())
        for qid, entry in data.items():
            if qid.startswith('_') or not isinstance(entry, dict):
                continue
            meta = entry.get('_meta', {})
            if not isinstance(meta, dict) or meta.get('recipe') != VARIANT_C_RECIPE:
                continue
            yield f, qid, entry


def entry_prose(entry: dict) -> str:
    """Concatenate all prose fields of an entry for grepping."""
    parts = [
        entry.get('solution_path', '') or '',
        entry.get('technique', '') or '',
        entry.get('pitfall') or '',
    ]
    for step in entry.get('steps', []) or []:
        parts.append(step.get('title', '') or '')
        parts.append(step.get('text', '') or '')
    for d in entry.get('distractors', []) or []:
        parts.append(d.get('why_tempting', '') or '')
        parts.append(d.get('why_wrong', '') or '')
    return '\n'.join(parts)


def section_of(qid: str) -> str:
    """Extract the section code from a qid."""
    for sec in ('MEK', 'LÄS', 'ELF', 'ORD', 'XYZ', 'KVA', 'NOG', 'DTK'):
        if sec in qid:
            return sec
    return 'UNK'


def exam_of(file: Path) -> str:
    return file.stem


def snippet_around(text: str, match: re.Match, span: int = 50) -> str:
    """Return a snippet with ~span chars on each side of the match."""
    start = max(0, match.start() - span)
    end = min(len(text), match.end() + span)
    snip = text[start:end].replace('\n', ' ')
    return snip.strip()


def scan() -> tuple[dict, dict]:
    """Return (flags_json, batches_json)."""
    patterns = load_patterns()
    print(f'Loaded {len(patterns)} prose-register patterns from {PATTERNS_FILE.name}')

    flags: dict[str, list] = defaultdict(list)  # qid → [{pattern, snippet}, …]
    batches: dict[str, list[str]] = defaultdict(list)  # f"{exam}-{section}" → [qid…]
    pattern_counts: dict[str, int] = defaultdict(int)
    exam_section_qids: dict[tuple[str, str], list[str]] = defaultdict(list)

    n_entries = 0
    n_flagged = 0
    for file, qid, entry in iter_variant_c():
        n_entries += 1
        prose = entry_prose(entry)
        hits: list[dict] = []
        for label, regex in patterns:
            for m in regex.finditer(prose):
                hits.append(
                    {
                        'pattern': label,
                        'snippet': snippet_around(prose, m),
                    }
                )
                pattern_counts[label] += 1
        if hits:
            n_flagged += 1
            flags[qid] = hits
            exam = exam_of(file)
            section = section_of(qid)
            exam_section_qids[(exam, section)].append(qid)

    for (exam, section), qids in exam_section_qids.items():
        batches[f'{exam}-{section.lower()}'] = sorted(qids)

    summary = {
        'total_variant_c_entries': n_entries,
        'flagged_entries': n_flagged,
        'pattern_counts': dict(sorted(pattern_counts.items(), key=lambda x: -x[1])),
        'batches': {k: len(v) for k, v in sorted(batches.items())},
    }

    flags_doc = {'summary': summary, 'flags': dict(flags)}
    batches_doc = {'summary': summary, 'batches': dict(batches)}
    return flags_doc, batches_doc


def print_summary(summary: dict) -> None:
    print()
    print('━' * 60)
    print('Register-polish scan summary')
    print('━' * 60)
    print(f"  Scanned: {summary['total_variant_c_entries']:>5,} Variant-C entries")
    print(f"  Flagged: {summary['flagged_entries']:>5,} ({summary['flagged_entries']*100//max(1, summary['total_variant_c_entries'])}%)")
    print()
    print('  Pattern occurrences:')
    for pat, n in summary['pattern_counts'].items():
        print(f'    {n:>4}× · {pat}')
    print()
    print(f"  Subagent batches: {len(summary['batches'])} non-empty exam-sections")
    for key, n in list(summary['batches'].items())[:8]:
        print(f'    {key:<32} {n:>3} entries')
    if len(summary['batches']) > 8:
        print(f"    … +{len(summary['batches']) - 8} more")
    print('━' * 60)


def merge() -> None:
    """Merge audit/_regen_polish/*.json into data/explanations/."""
    if not POLISH_DIR.exists():
        print(f'No polish directory at {POLISH_DIR}; nothing to merge.')
        return

    polish_files = sorted(POLISH_DIR.glob('*.json'))
    if not polish_files:
        print(f'No polish files in {POLISH_DIR}; nothing to merge.')
        return

    merged_total = 0
    errors_total = 0
    for pf in polish_files:
        # Filename: <exam>-<section>.json — exam keeps its own dashes
        m = re.search(r'-(mek|las|elf|ord|xyz|kva|nog|dtk)$', pf.stem, re.IGNORECASE)
        if not m:
            print(f'  skip {pf.name}: cannot parse section')
            continue
        exam = pf.stem[: m.start()]
        target = DATA_DIR / f'{exam}.json'
        if not target.exists():
            print(f'  skip {pf.name}: target {target.name} missing')
            continue

        polish = json.loads(pf.read_text())
        existing = json.loads(target.read_text())

        merged_this = 0
        for qid, entry in polish.items():
            if qid.startswith('_') or not isinstance(entry, dict):
                continue
            errs = validate_explanation(entry)
            if errs:
                print(f'  ✗ {pf.name}::{qid} fails schema:')
                for e in errs:
                    print(f'      {e}')
                errors_total += len(errs)
                continue
            existing[qid] = entry
            merged_this += 1

        if merged_this:
            target.write_text(
                json.dumps(existing, indent=2, sort_keys=True, ensure_ascii=False)
            )
            merged_total += merged_this
            print(f'  ✓ {pf.name} → {target.name} ({merged_this} entries)')

    print()
    print(f'Merged: {merged_total} entries · Errors: {errors_total}')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--merge', action='store_true',
                    help='Merge audit/_regen_polish/*.json into data/explanations/')
    args = ap.parse_args()

    if args.merge:
        merge()
        return

    flags_doc, batches_doc = scan()
    FLAGS_OUT.write_text(json.dumps(flags_doc, indent=2, ensure_ascii=False))
    BATCHES_OUT.write_text(json.dumps(batches_doc, indent=2, ensure_ascii=False))
    print_summary(flags_doc['summary'])
    print(f'\nWrote {FLAGS_OUT.relative_to(ROOT)} '
          f'({FLAGS_OUT.stat().st_size // 1024} KB)')
    print(f'Wrote {BATCHES_OUT.relative_to(ROOT)} '
          f'({BATCHES_OUT.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
