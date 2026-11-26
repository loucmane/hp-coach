"""Apply curated parser-typo fixes across the corpus.

Reads `audit/corpus_lint/typo_fixes.json` (hand-curated word, phrase,
and exact option-text corrections). Applies
each replacement across:

- data/parsed/*.json (gitignored — local-only changes)
- data/explanations/*.json (committed)
- app/public/explanations/*.json (served copy)
- frameworks/*.json (committed)
- app/public/frameworks/*.json (served copy)
- app/public/data/*.json (committed app bank)

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

Exact option fixes run after spelling corrections. They require a matching
question id, option letter, and complete old text; prompts, numeric answers
on other questions, and already-corrected options are left alone.
Exact prompt fixes likewise require a matching qid and complete old prompt.
Passage fixes match a reviewed boundary (or complete damaged context) only
inside the named questions' context fields. They never guess at paragraphs
from casing or punctuation during a re-parse.

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
        # A variable such as y has different adjective agreement from a
        # compound such as y-skärning. Never rewrite that compound prefix.
        boundary = r'[\w-]' if fix.get('exclude_hyphenated') else r'\w'
        pat = re.compile(r'(?<!' + boundary + ')' + re.escape(phrase)
                         + r'(?!' + boundary + ')', re.IGNORECASE)
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
                replacement = ""
            elif matched.isupper() and len(matched) > 1:
                replacement = _correct.upper()
            elif matched and matched[0].isupper():
                replacement = _correct[0].upper() + _correct[1:]
            else:
                replacement = _correct
            # Matches of an already-correct casing (av Gud) are not edits.
            if replacement != matched:
                counts[label] += 1
            return replacement
        text = pat.sub(_repl, text)
    return text


# qid format across the corpus: `<exam>-<provpass>-<SECTION>-<number>`,
# where <exam> can carry hyphens (`host-ver1-2019`, `var-2018-1`).
# Section is always the second-to-last segment when split by `-`.
_QID_SECTION_RE = re.compile(r'-(KVA|XYZ|NOG|DTK|MEK|L[ÄA]S|ELF|ORD)-\d+$')


def _section_from_qid(qid: str) -> str | None:
    m = _QID_SECTION_RE.search(qid)
    return m.group(1).upper().replace('LAS', 'LÄS') if m else None


def build_option_replacements(option_list: list[dict]) -> dict:
    """Index exact corrections; reject duplicate keys rather than overwrite."""
    out = {}
    for fix in option_list:
        key = (fix['qid'], fix['letter'], fix['text'])
        if key in out:
            raise ValueError(f'Duplicate option fix: {key!r}')
        out[key] = fix['correct']
    return out


def apply_option_fixes(question: dict, option_fixes: dict, counts: dict) -> dict:
    """Return a corrected question without mutating its other fields."""
    qid = question.get('qid')
    if not isinstance(qid, str) or not isinstance(question.get('options'), list):
        return question
    options = []
    for option in question['options']:
        if not isinstance(option, dict):
            options.append(option)
            continue
        key = (qid, option.get('letter'), option.get('text'))
        correct = option_fixes.get(key)
        if correct is not None and correct != option.get('text'):
            counts[f'{qid} option {option["letter"]}'] += 1
            options.append({**option, 'text': correct})
        else:
            options.append(option)
    return {**question, 'options': options}


def build_prompt_replacements(prompt_list: list[dict]) -> dict:
    """Index complete source-verified prompts without broad text matching."""
    out = {}
    for fix in prompt_list:
        key = (fix['qid'], fix['text'])
        if key in out:
            raise ValueError(f'Duplicate prompt fix: {key!r}')
        out[key] = fix['correct']
    return out


def apply_prompt_fixes(question: dict, prompt_fixes: dict, counts: dict) -> dict:
    qid, prompt = question.get('qid'), question.get('prompt')
    if not isinstance(qid, str) or not isinstance(prompt, str):
        return question
    correct = prompt_fixes.get((qid, prompt))
    if correct is None or correct == prompt:
        return question
    counts[f'{qid} prompt'] += 1
    return {**question, 'prompt': correct}


def build_passage_replacements(passage_list: list[dict]) -> dict:
    """Index source-verified context edits, rejecting ambiguous duplicates."""
    out = {}
    for fix in passage_list:
        if not fix['text'] or fix['text'] in fix['correct']:
            raise ValueError('Passage fixes must remove their nonempty source pattern')
        for qid in fix['qids']:
            rules = out.setdefault(qid, {})
            if fix['text'] in rules:
                raise ValueError(f'Duplicate passage fix: {qid}')
            rules[fix['text']] = fix['correct']
    return out


def apply_passage_fixes(question: dict, passage_fixes: dict, counts: dict) -> dict:
    """Join only explicitly reviewed text in its original reading passage."""
    qid, context = question.get('qid'), question.get('context')
    if question.get('section') not in ('LÄS', 'ELF') or not isinstance(context, str):
        return question
    corrected = context
    for text, replacement in passage_fixes.get(qid, {}).items():
        occurrences = corrected.count(text)
        if occurrences > 1:
            raise ValueError(f'Ambiguous passage boundary: {qid}')
        if occurrences:
            corrected = corrected.replace(text, replacement, 1)
            counts[f'{qid} passage'] += 1
    return {**question, 'context': corrected} if corrected != context else question


def build_citation_replacements(citation_list: list[dict]) -> dict:
    """Index exact explanation-field edits; never renumber citations blindly."""
    out = {}
    for fix in citation_list:
        key = tuple(fix['path'])
        if not key or fix['text'] == fix['correct']:
            raise ValueError('Citation fixes need a field path and changed text')
        rules = out.setdefault(fix['qid'], {})
        if key in rules:
            raise ValueError(f'Duplicate citation fix: {fix["qid"]} {key}')
        rules[key] = (fix['text'], fix['correct'])
    return out


def apply_citation_fixes(explanation, rules: dict, counts: dict, qid: str):
    def replace_at(obj, keys, old, new):
        if not keys:
            return new if obj == old else obj
        key, *remaining = keys
        if isinstance(obj, dict) and key in obj:
            return {**obj, key: replace_at(obj[key], remaining, old, new)}
        if isinstance(obj, list) and isinstance(key, int) and 0 <= key < len(obj):
            return [replace_at(v, remaining, old, new) if i == key else v
                    for i, v in enumerate(obj)]
        return obj

    for keys, (old, new) in rules.items():
        corrected = replace_at(explanation, keys, old, new)
        if corrected != explanation:
            counts[f'{qid} citation'] += 1
            explanation = corrected
    return explanation


def walk_json_file(path: Path, replacements, counts, dry_run=True, option_fixes=None,
                   prompt_fixes=None, passage_fixes=None, citation_fixes=None):
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
    source = path.read_text()
    data = json.loads(source)
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
            result = {k: recurse(v, inner_section) for k, v in obj.items()}
            corrected = apply_option_fixes(result, option_fixes or {}, counts)
            corrected = apply_prompt_fixes(corrected, prompt_fixes or {}, counts)
            corrected = apply_passage_fixes(corrected, passage_fixes or {}, counts)
            if corrected != result:
                file_changed[0] = True
            return corrected
        return obj

    # Top level: if it's a dict-by-qid (data/explanations), parse the
    # section per key. Otherwise recurse generically with section=None.
    if isinstance(data, dict) and data and all(
        isinstance(k, str) and _section_from_qid(k) for k in data
    ):
        new_data = {k: recurse(v, _section_from_qid(k)) for k, v in data.items()}
        for qid, explanation in new_data.items():
            corrected = apply_citation_fixes(
                explanation, (citation_fixes or {}).get(qid, {}), counts, qid)
            if corrected != explanation:
                file_changed[0] = True
                new_data[qid] = corrected
    else:
        new_data = recurse(data, None)

    if file_changed[0] and not dry_run:
        # Canonical explanations use one-space indentation; the bank uses
        # two. Keep each store's layout instead of rewriting every line.
        indentation = re.search(r'(?m)^([ \t]+)\S', source)
        serialized = json.dumps(new_data, ensure_ascii=False,
                                indent=indentation.group(1) if indentation else 2)
        serialized = serialized.replace('\uE000', r'\uE000').replace('\uE001', r'\uE001')
        if source.endswith('\n'):
            serialized += '\n'
        path.write_text(serialized)
    return file_changed[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='Write changes (default: dry run)')
    ap.add_argument('--fix-list', default=str(SCRIPT_DIR / 'typo_fixes.json'))
    ap.add_argument('--options-only', action='store_true',
                    help='Apply only exact option fixes, without the word/phrase sweep')
    ap.add_argument('--passages-only', action='store_true',
                    help='Apply only the source-verified passage and citation repairs')
    args = ap.parse_args()
    if args.options_only and args.passages_only:
        ap.error('--options-only and --passages-only are mutually exclusive')

    fixes = json.loads(Path(args.fix_list).read_text())
    fix_list = fixes['fix']
    phrase_list = fixes.get('phrase_fix', [])
    option_fixes = build_option_replacements(fixes.get('option_fix', []))
    prompt_fixes = build_prompt_replacements(fixes.get('prompt_fix', []))
    passage_fixes = build_passage_replacements(fixes.get('passage_fix', []))
    citation_fixes = build_citation_replacements(fixes.get('citation_fix', []))
    print(f'Loaded {len(fix_list)} verified word fixes + {len(phrase_list)} phrase fixes '
          f'+ {len(option_fixes)} option fixes + {len(prompt_fixes)} prompt fixes '
          f'+ passage fixes for {len(passage_fixes)} questions '
          f'from {args.fix_list}')

    # Phrase replacements run FIRST (greedy multi-token match), then
    # single-word replacements. Order matters because a phrase like
    # "sluten system" must be caught as a phrase before the word-level
    # `sluten` check (which wouldn't fire here anyway, but principle).
    replacements = build_phrase_replacements(phrase_list) + build_replacements(fix_list)
    if args.options_only:
        replacements = []
        prompt_fixes = {}
        passage_fixes = {}
        citation_fixes = {}
    if args.passages_only:
        replacements = []
        option_fixes = {}
        prompt_fixes = {}

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
        ('app/public/explanations', '*.json'),
        ('data/parsed', '*.json'),
        ('frameworks', '*.json'),
        ('app/public/frameworks', '*.json'),
        ('app/public/data', '*.json'),
    ]
    for dirpath, pattern in targets:
        d = ROOT / dirpath
        if not d.exists():
            continue
        for f in sorted(d.glob(pattern)):
            if f.name.startswith('_'):
                continue
            if walk_json_file(f, replacements, counts, dry_run=not args.apply,
                              option_fixes=option_fixes, prompt_fixes=prompt_fixes,
                              passage_fixes=passage_fixes, citation_fixes=citation_fixes):
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
    for filename in files_changed:
        print(f'  {filename}')
    if args.apply:
        print('Mode: APPLIED (writes complete)')
    else:
        print('Mode: DRY RUN (no writes; re-run with --apply)')


if __name__ == '__main__':
    main()
