"""Extract every Swedish word from the corpus for linting.

Walks `data/explanations/*.json`, `data/parsed/*.json`, and
`frameworks/*.json` and emits a token list with provenance: for each
unique word, where it appears (qid + field).

Exclusions:
- Math spans wrapped in U+E000...U+E001 (the parser's KaTeX wrap)
- LaTeX commands and braces (\\frac, \\sqrt, {…})
- ELF section content (legitimately English) — qids matching -ELF-
- Numbers and pure punctuation
- Single-letter tokens (mostly variable names)
- ALL-CAPS tokens 4 chars or shorter (mostly section codes, units)

Output: /tmp/corpus_lint/tokens.json
{
  "summary": {...},
  "by_token": { "höflig": {"frequency": 3, "sources": [{...}, ...]}, ... }
}
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path


PUA_OPEN = ''
PUA_CLOSE = ''
MATH_SPAN_RX = re.compile(re.escape(PUA_OPEN) + r'.*?' + re.escape(PUA_CLOSE))
LATEX_RX = re.compile(r'\\[a-zA-Z]+|\\[^a-zA-Z]')
BRACE_RX = re.compile(r'[{}]')
WORD_RX = re.compile(r"[a-zåäöüéèáà][a-zåäöüéèáà'-]*", re.IGNORECASE)
NUMBER_RX = re.compile(r'^\d+([.,]\d+)?%?$')

SECTION_RX = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid: str) -> str | None:
    m = SECTION_RX.search(qid)
    return m.group(1) if m else None


def clean_text(s: str | None) -> str:
    """Strip math spans, LaTeX commands, braces from a Swedish text string."""
    if not s:
        return ''
    # Math spans first
    s = MATH_SPAN_RX.sub(' ', s)
    # Lingering LaTeX commands outside spans
    s = LATEX_RX.sub(' ', s)
    s = BRACE_RX.sub(' ', s)
    # Normalize whitespace
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def tokenize(s: str) -> list[str]:
    """Lowercased Swedish words. Returns the original casing too via tuples?
    No — for analysis we just need lowercase tokens.
    """
    s = clean_text(s)
    tokens = []
    for m in WORD_RX.finditer(s):
        w = m.group(0).lower()
        if NUMBER_RX.match(w):
            continue
        if len(w) <= 1:
            continue
        tokens.append(w)
    return tokens


def is_proper_noun_heuristic(token: str, full_text: str) -> bool:
    """Cheap heuristic: token appears Capitalized mid-sentence in full text.

    Doesn't perfectly catch all proper nouns but filters obvious ones
    (people, places). The user / I can whitelist the rest.
    """
    # Token (lowercase). Look for Capitalized form in full text NOT at
    # sentence start.
    cap = token[0].upper() + token[1:]
    # Find Cap forms preceded by lowercase letter or non-sentence-start
    pattern = re.compile(r'(?<=[a-zåäö] )' + re.escape(cap) + r'\b')
    return bool(pattern.search(full_text))


# ── Sources: explanations, parsed, frameworks ─────────────────────────

EXPLANATION_FIELDS = ['solution_path', 'technique', 'pitfall']


def iter_explanation_texts(exp_data: dict):
    """Yield (field, text) tuples for one explanation entry."""
    for f in EXPLANATION_FIELDS:
        v = exp_data.get(f)
        if isinstance(v, str) and v.strip():
            yield (f, v)
    for d in (exp_data.get('distractors') or []):
        letter = d.get('letter', '?')
        for f in ('why_tempting', 'why_wrong'):
            v = d.get(f)
            if isinstance(v, str) and v.strip():
                yield (f'distractor_{letter}_{f}', v)


def iter_parsed_texts(q: dict):
    """Yield (field, text) tuples for one parsed question."""
    if isinstance(q.get('context'), str) and q['context'].strip():
        yield ('context', q['context'])
    if isinstance(q.get('prompt'), str) and q['prompt'].strip():
        yield ('prompt', q['prompt'])
    for o in (q.get('options') or []):
        v = o.get('text')
        letter = o.get('letter', '?')
        if isinstance(v, str) and v.strip():
            yield (f'option_{letter}', v)


# Framework family → list of (field_path, is_list)
FRAMEWORK_FIELDS = {
    'ord_roots':    [('meaning', False), ('notes', False)],
    'kva_traps':    [('pattern_description', False), ('why_it_occurs', False),
                     ('common_distractor_signature', False), ('countermeasure', False),
                     ('notes', False)],
    'nog_traps':    [('pattern_description', False), ('why_it_occurs', False),
                     ('common_distractor_signature', False), ('countermeasure', False),
                     ('notes', False)],
    'xyz_traps':    [('pattern_description', False), ('why_it_occurs', False),
                     ('common_distractor_signature', False), ('countermeasure', False),
                     ('notes', False)],
    'mek_protocol': [('rule', False), ('notes', False)],
    'las_taxonomy': [('question_type', False), ('attack_protocol', True),
                     ('common_distractors', 'reading_distractors'),
                     ('notes', False)],
    'elf_taxonomy': [('question_type', False), ('attack_protocol', True),
                     ('common_distractors', 'reading_distractors'),
                     ('notes', False)],
    'dtk_tactics':  [('tactic', False), ('when_to_apply', False), ('notes', False)],
}


def iter_framework_texts(family: str, entry: dict):
    """Yield (field, text) tuples for one framework entry."""
    spec = FRAMEWORK_FIELDS.get(family, [])
    for field, kind in spec:
        v = entry.get(field)
        if kind is False:
            if isinstance(v, str) and v.strip():
                yield (field, v)
        elif kind is True:
            # list of strings (attack_protocol)
            if isinstance(v, list):
                for i, s in enumerate(v):
                    if isinstance(s, str) and s.strip():
                        yield (f'{field}[{i}]', s)
        elif kind == 'reading_distractors':
            if isinstance(v, list):
                for i, d in enumerate(v):
                    if isinstance(d, dict):
                        for sub in ('pattern', 'why_it_traps'):
                            sv = d.get(sub)
                            if isinstance(sv, str) and sv.strip():
                                yield (f'{field}[{i}].{sub}', sv)


# ── Main collector ────────────────────────────────────────────────────

def collect_all(skip_elf=True, skip_proper_nouns_heuristic=False):
    """Walk the corpus, return a defaultdict[token] = list of sources."""
    by_token: dict[str, list[dict]] = defaultdict(list)
    stats = {
        'explanations_seen': 0,
        'parsed_seen': 0,
        'framework_entries_seen': 0,
        'elf_skipped': 0,
        'tokens_total': 0,
        'tokens_unique': 0,
    }

    # ── Explanations ──────────────────────────────────────────────────
    for p in sorted(Path('data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        exam_data = json.loads(p.read_text())
        for qid, exp in exam_data.items():
            if skip_elf and section_of(qid) == 'ELF':
                stats['elf_skipped'] += 1
                continue
            stats['explanations_seen'] += 1
            for field, text in iter_explanation_texts(exp):
                # For proper-noun heuristic, pass the full text
                for tok in tokenize(text):
                    if skip_proper_nouns_heuristic and is_proper_noun_heuristic(tok, text):
                        continue
                    by_token[tok].append({
                        'source': 'explanation',
                        'qid': qid,
                        'field': field,
                    })
                    stats['tokens_total'] += 1

    # ── Parsed questions ──────────────────────────────────────────────
    for p in sorted(Path('data/parsed').glob('*.json')):
        if p.name.startswith('_'):
            continue
        data = json.loads(p.read_text())
        for q in data:
            qid = q.get('qid', '')
            if skip_elf and section_of(qid) == 'ELF':
                stats['elf_skipped'] += 1
                continue
            stats['parsed_seen'] += 1
            for field, text in iter_parsed_texts(q):
                for tok in tokenize(text):
                    if skip_proper_nouns_heuristic and is_proper_noun_heuristic(tok, text):
                        continue
                    by_token[tok].append({
                        'source': 'parsed',
                        'qid': qid,
                        'field': field,
                    })
                    stats['tokens_total'] += 1

    # ── Frameworks ────────────────────────────────────────────────────
    for p in sorted(Path('frameworks').glob('*.json')):
        if p.name.startswith('_'):
            continue
        fw = json.loads(p.read_text())
        family = fw.get('family', p.stem)
        # Skip ELF-only framework if requested? The framework text itself
        # is Swedish (rules ABOUT English reading, written in Swedish).
        # So we still scan it.
        for i, entry in enumerate(fw.get('entries') or []):
            entry_id = entry.get('id', f'{family}-{i}')
            stats['framework_entries_seen'] += 1
            for field, text in iter_framework_texts(family, entry):
                for tok in tokenize(text):
                    if skip_proper_nouns_heuristic and is_proper_noun_heuristic(tok, text):
                        continue
                    by_token[tok].append({
                        'source': 'framework',
                        'family': family,
                        'entry_id': entry_id,
                        'field': field,
                    })
                    stats['tokens_total'] += 1

    stats['tokens_unique'] = len(by_token)
    return by_token, stats


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-skip-elf', action='store_true',
                    help='Include ELF section (legitimately English)')
    ap.add_argument('--proper-noun-heuristic', action='store_true',
                    help='Skip Capitalized-mid-sentence tokens (likely proper nouns)')
    ap.add_argument('--output', default='/tmp/corpus_lint/tokens.json')
    args = ap.parse_args()

    by_token, stats = collect_all(
        skip_elf=not args.no_skip_elf,
        skip_proper_nouns_heuristic=args.proper_noun_heuristic,
    )

    # Compact output: by_token = {token: {frequency, sources_sample}}
    out = {
        'summary': {
            **stats,
            'skip_elf': not args.no_skip_elf,
            'proper_noun_heuristic': args.proper_noun_heuristic,
        },
        'by_token': {
            tok: {
                'frequency': len(sources),
                'sources_sample': sources[:5],  # cap to keep file size sane
            }
            for tok, sources in by_token.items()
        },
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))

    print(f'Tokens total:  {stats["tokens_total"]:,}')
    print(f'Tokens unique: {stats["tokens_unique"]:,}')
    print(f'Explanations:  {stats["explanations_seen"]:,}')
    print(f'Parsed q:      {stats["parsed_seen"]:,}')
    print(f'Framework:     {stats["framework_entries_seen"]:,}')
    print(f'ELF skipped:   {stats["elf_skipped"]:,}')
    print(f'\nWrote: {out_path} ({out_path.stat().st_size / 1024:.1f} KB)')


if __name__ == '__main__':
    main()
