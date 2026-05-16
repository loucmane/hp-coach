"""Apply curated parser-typo fixes across the corpus.

Reads `audit/corpus_lint/typo_fixes.json` (hand-curated list of 59
verified letter-swap typos with high-confidence corrections). Applies
each replacement across:

- data/parsed/*.json (gitignored — local-only changes)
- data/explanations/*.json (committed)
- frameworks/*.json (committed)

Uses word-boundary regex so substrings within legitimate words don't
get affected. Capitalized variants handled by case-preservation
heuristic: if the source token appears Capitalized, replace with
Capitalized correct form.

Section-aware: rules tagged with `swedish_only: true` skip ELF
entries. The walker tracks qid → section as it recurses through
data/explanations (dict keyed by qid) and data/parsed / app/public/data
(lists where each item has a `section` field). frameworks/ has no
section context — rules without `swedish_only` fire there as
usual; rules with `swedish_only` are skipped to be safe.

USAGE:
    python3 audit/corpus_lint/apply_typo_fixes.py            # dry run
    python3 audit/corpus_lint/apply_typo_fixes.py --apply    # write

Idempotent: re-running on already-fixed corpus is a no-op.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent


def build_replacements(fix_list: list[dict]) -> list[tuple[re.Pattern, str, str, bool]]:
    """Build (pattern, replacement, label, swedish_only) tuples."""
    out = []
    for fix in fix_list:
        typo = fix['typo']
        correct = fix['correct']
        swedish_only = bool(fix.get('swedish_only', False))
        # Use word boundary; allow hyphens within typo (e.g. häs-, mäk-)
        pat = re.compile(r'\b' + re.escape(typo) + r'\b', re.IGNORECASE)
        out.append((pat, correct, typo, swedish_only))
    return out


def build_phrase_replacements(phrase_list: list[dict]) -> list[tuple[re.Pattern, str, str, bool]]:
    """Build phrase-level (multi-word) replacements with case preservation.

    Phrases match boundary-anchored at both ends but allow internal
    spaces and hyphens. Case logic mirrors apply_to_text: ALL CAPS,
    Capitalized, lowercase.
    """
    out = []
    for fix in phrase_list:
        phrase = fix['phrase']
        correct = fix['correct']
        swedish_only = bool(fix.get('swedish_only', False))
        pat = re.compile(r'(?<!\w)' + re.escape(phrase) + r'(?!\w)', re.IGNORECASE)
        out.append((pat, correct, phrase, swedish_only))
    return out


# Section-aware filtering. ELF entries hold English prose; rules
# flagged `swedish_only` are skipped there. None means "no section
# context" (frameworks/, top-level keys we couldn't parse): treat
# conservatively — skip swedish_only rules to avoid the bug class
# entirely, since we can't confirm the text is Swedish.
def _skip_for_section(swedish_only: bool, section: str | None) -> bool:
    if not swedish_only:
        return False
    if section is None:
        return True  # unknown context → skip the risky rule
    return section.upper() == 'ELF'


def apply_to_text(text: str, replacements: list, counts: dict, section: str | None) -> str:
    """Apply each replacement, preserving case based on the match.

    Three cases handled:
    - ALL CAPS (`HÖFLIG` → `HÖVLIG`)
    - Capitalized (`Höflig` → `Hövlig`)
    - lowercase (`höflig` → `hövlig`)
    """
    if not isinstance(text, str):
        return text
    for pat, correct, label, swedish_only in replacements:
        if _skip_for_section(swedish_only, section):
            continue
        def _repl(m, _correct=correct):
            matched = m.group(0)
            # Empty replacement (e.g. page-header bleed stripping) — skip
            # the case-preservation branch since there's no first char.
            if not _correct:
                return ""
            if matched.isupper() and len(matched) > 1:
                return _correct.upper()
            elif matched and matched[0].isupper():
                return _correct[0].upper() + _correct[1:]
            return _correct
        new_text, n = pat.subn(_repl, text)
        if n > 0:
            counts[label] += n
        text = new_text
    return text


# qid format across the corpus: `<exam>-<provpass>-<SECTION>-<number>`,
# where <exam> can carry hyphens (`host-ver1-2019`, `var-2018-1`).
# Section is always the second-to-last segment when split by `-`.
_QID_SECTION_RE = re.compile(r'-(KVA|XYZ|NOG|DTK|MEK|L[ÄA]S|ELF|ORD)-\d+$')


def _section_from_qid(qid: str) -> str | None:
    m = _QID_SECTION_RE.search(qid)
    return m.group(1).upper().replace('LAS', 'LÄS') if m else None


def walk_json_file(path: Path, replacements, counts, dry_run=True):
    """Walk all string fields in a JSON file and apply replacements.

    Tracks section context so rules tagged `swedish_only` skip ELF
    entries:
      - data/explanations/<exam>.json: top-level dict keyed by qid.
        Each value runs with section parsed from the qid.
      - data/parsed/<exam>.json and app/public/data/<exam>.json:
        top-level list of question objects, each with `section`.
        Each item runs with that section.
      - frameworks/*.json and any other shape: no section context;
        swedish_only rules skipped (safer than firing blind).
    """
    data = json.loads(path.read_text())
    file_changed = [False]

    def recurse(obj, section: str | None):
        if isinstance(obj, str):
            new = apply_to_text(obj, replacements, counts, section)
            if new != obj:
                file_changed[0] = True
            return new
        if isinstance(obj, list):
            return [recurse(x, section) for x in obj]
        if isinstance(obj, dict):
            # Per-item section override if the dict itself looks like a
            # question object (data/parsed shape).
            inner_section = obj.get('section') if isinstance(obj.get('section'), str) else section
            return {k: recurse(v, inner_section) for k, v in obj.items()}
        return obj

    # Top level: if it's a dict-by-qid (data/explanations), parse the
    # section per key. Otherwise recurse generically with section=None.
    if isinstance(data, dict) and data and all(
        isinstance(k, str) and _section_from_qid(k) for k in data
    ):
        new_data = {k: recurse(v, _section_from_qid(k)) for k, v in data.items()}
    else:
        new_data = recurse(data, None)

    if file_changed[0] and not dry_run:
        path.write_text(json.dumps(new_data, ensure_ascii=False, indent=2))
    return file_changed[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='Write changes (default: dry run)')
    ap.add_argument('--fix-list', default=str(SCRIPT_DIR / 'typo_fixes.json'))
    args = ap.parse_args()

    fixes = json.loads(Path(args.fix_list).read_text())
    fix_list = fixes['fix']
    phrase_list = fixes.get('phrase_fix', [])
    print(f'Loaded {len(fix_list)} verified word fixes + {len(phrase_list)} phrase fixes from {args.fix_list}')

    # Phrase replacements run FIRST (greedy multi-token match), then
    # single-word replacements. Order matters because a phrase like
    # "sluten system" must be caught as a phrase before the word-level
    # `sluten` check (which wouldn't fire here anyway, but principle).
    replacements = build_phrase_replacements(phrase_list) + build_replacements(fix_list)

    counts = defaultdict(int)
    files_changed = []

    # Walk all corpus sources, including the SPA-served copy.
    #
    # app/public/data was missed by the original Phase D.1 pass (commit
    # 574b88e). The Phase B parser re-run (2ca24eb, "Scale parser to all
    # 27 exams") regenerated those files from scratch without rerunning
    # the typo pass, so 'Kvanttiet' (294 instances) and 'otlilräcklig'
    # (294 instances) came back at the parser source. Cover it here too;
    # parser/build_all.py invokes this script as a post-parse step
    # (Phase D.1.5) so future re-parses stay clean.
    targets = [
        ('data/explanations', '*.json'),
        ('data/parsed', '*.json'),
        ('frameworks', '*.json'),
        ('app/public/data', '*.json'),
    ]
    for dirpath, pattern in targets:
        d = ROOT / dirpath
        if not d.exists():
            continue
        for f in sorted(d.glob(pattern)):
            if f.name.startswith('_'):
                continue
            if walk_json_file(f, replacements, counts, dry_run=not args.apply):
                files_changed.append(str(f.relative_to(ROOT)))

    print()
    print('━' * 60)
    print('Replacement counts (per typo)')
    print('━' * 60)
    total = 0
    for label in sorted(counts, key=lambda k: -counts[k]):
        n = counts[label]
        total += n
        print(f'  {label:25} {n:>5}')
    print('━' * 60)
    print(f'  TOTAL                     {total:>5}')
    print()
    print(f'Files changed: {len(files_changed)}')
    if args.apply:
        print('Mode: APPLIED (writes complete)')
    else:
        print('Mode: DRY RUN (no writes; re-run with --apply)')


if __name__ == '__main__':
    main()
