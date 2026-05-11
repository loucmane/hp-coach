"""Scan the corpus for framework candidates.

For each section, produce clustered "candidates" — themes + qids
exhibiting them — ready to feed to the synthesis agent (prompts.py +
schema.py).

Two algorithms here:
- Stem clustering (ORD): morphology-driven, group words by shared
  prefix/root using a small Latin/Greek/Germanic stem list.
- Theme clustering (everything else): Jaccard similarity on content
  tokens (same approach as audit/trajectory/technique_index.py),
  applied to the `technique` + `pitfall` fields of explanations OR
  to question prompts when explanations are sparse.

Usage:
    python3 -m pipeline.frameworks.extract --family ord_roots
    python3 -m pipeline.frameworks.extract --family kva_traps
    ...

Outputs `/tmp/frameworks/candidates_<family>.json` for downstream
synthesis (run via an Opus agent, dispatched per the README).
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path


SECTION_RE = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid):
    m = SECTION_RE.search(qid)
    return m.group(1) if m else None


def deaccent(s: str) -> str:
    return ''.join(
        c for c in unicodedata.normalize('NFD', s)
        if not unicodedata.combining(c)
    )


def content_tokens(s: str, min_len: int = 4) -> set[str]:
    s = deaccent((s or '').lower())
    return {w for w in re.findall(r"[a-z]+", s) if len(w) >= min_len}


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


# ── Loading ───────────────────────────────────────────────────────────

def load_corpus():
    """Returns (parsed_by_qid, explanations_by_qid)."""
    parsed = {}
    for p in sorted(Path('data/parsed').glob('*.json')):
        if p.name.startswith('_'):
            continue
        for q in json.loads(p.read_text()):
            parsed[q['qid']] = q
    explanations = {}
    for p in sorted(Path('data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        for qid, e in json.loads(p.read_text()).items():
            explanations[qid] = e
    return parsed, explanations


# ── ORD: stem clustering ──────────────────────────────────────────────

# A small bootstrap list of well-known roots. The synthesis agent
# will get to expand this — extract.py only proposes candidates.
KNOWN_STEMS = [
    # Latin
    ('curr', 'Latin', 'att löpa, gå'),
    ('dict', 'Latin', 'säga'),
    ('duc', 'Latin', 'leda'),
    ('fer', 'Latin', 'bära'),
    ('mit', 'Latin', 'sända'),
    ('port', 'Latin', 'bära'),
    ('script', 'Latin', 'skriva'),
    ('spec', 'Latin', 'se'),
    ('tract', 'Latin', 'dra'),
    ('vert', 'Latin', 'vända'),
    ('voc', 'Latin', 'kalla, röst'),
    # Greek
    ('graf', 'Greek', 'skriva'),
    ('log', 'Greek', 'ord, lära'),
    ('path', 'Greek', 'känsla, lidande'),
    ('phon', 'Greek', 'ljud'),
    ('psych', 'Greek', 'själ'),
    ('skop', 'Greek', 'se'),
    ('tele', 'Greek', 'fjärran'),
    # Germanic / Swedish
    ('häv', 'Germanic', 'lyfta, försäkra'),
    ('bär', 'Germanic', 'transportera'),
    ('lös', 'Germanic', 'utan, fri från'),
    ('full', 'Germanic', 'full, hel'),
]


def scan_ord_roots(parsed, explanations):
    """Cluster ORD-corpus words by shared stem.

    Returns candidates: list of {stem, words, qids, suggested_origin,
    suggested_meaning} — to be reviewed + extended by the synthesis
    agent.
    """
    # Collect all ORD prompts + options as the source-of-words
    word_sources: dict[str, list[str]] = defaultdict(list)  # word -> [qids]
    for qid, q in parsed.items():
        if section_of(qid) != 'ORD':
            continue
        # Prompt is the test word; options are synonyms
        words = [(q.get('prompt') or '').strip()]
        for o in (q.get('options') or []):
            t = (o.get('text') or '').strip()
            if t:
                words.append(t)
        for w in words:
            w_norm = deaccent(w.lower()).strip()
            if 3 < len(w_norm) < 25 and w_norm.isalpha():
                word_sources[w_norm].append(qid)

    # Match against KNOWN_STEMS — produce a first batch of candidates
    candidates = []
    used_words = set()
    for stem, origin, meaning in KNOWN_STEMS:
        matches = {w: list(set(qids)) for w, qids in word_sources.items() if stem in w}
        if len(matches) < 3:
            continue
        all_qids = sorted({q for qids in matches.values() for q in qids})
        candidates.append({
            'stem': stem,
            'suggested_origin': origin,
            'suggested_meaning': meaning,
            'words': list(matches.keys())[:10],
            'qids': all_qids[:15],
            'corpus_frequency': sum(len(qids) for qids in matches.values()),
        })
        used_words.update(matches.keys())

    # Also propose suffix/prefix-frequency clusters for words not yet matched
    # by KNOWN_STEMS — surfaces potential new stems for the agent to label
    remaining = {w: q for w, q in word_sources.items() if w not in used_words}
    # 3-letter prefix frequency
    prefix_counts = Counter()
    prefix_words: dict[str, list[str]] = defaultdict(list)
    for w in remaining:
        if len(w) < 5:
            continue
        prefix = w[:3]
        prefix_counts[prefix] += len(remaining[w])
        if w not in prefix_words[prefix]:
            prefix_words[prefix].append(w)
    for prefix, count in prefix_counts.most_common(50):
        if count < 4 or len(prefix_words[prefix]) < 3:
            continue
        all_qids = sorted({
            q for w in prefix_words[prefix] for q in remaining[w]
        })[:15]
        candidates.append({
            'stem': prefix,
            'suggested_origin': 'Unknown',
            'suggested_meaning': '?',
            'words': prefix_words[prefix][:10],
            'qids': all_qids,
            'corpus_frequency': count,
        })

    return candidates


# ── Generic theme clustering for traps / MEK / reading / DTK ──────────

def cluster_explanations(
    explanations: dict,
    section: str,
    *,
    field: str = 'technique',
    secondary_field: str = 'pitfall',
    jaccard_threshold: float = 0.5,
):
    """Cluster explanations in `section` by content-token overlap on
    the named fields. Returns a list of {theme, qids, sample_texts}.
    """
    section_entries = [
        (qid, exp) for qid, exp in explanations.items()
        if section_of(qid) == section
    ]

    # Compute tokens per qid
    qid_tokens: dict[str, set[str]] = {}
    qid_text: dict[str, str] = {}
    for qid, exp in section_entries:
        text = f"{exp.get(field) or ''} {exp.get(secondary_field) or ''}"
        toks = content_tokens(text)
        if toks:
            qid_tokens[qid] = toks
            qid_text[qid] = text.strip()

    # Greedy clustering: for each unvisited qid, start a cluster, pull
    # in any other qid with jaccard >= threshold
    visited = set()
    clusters = []
    for seed_qid, seed_toks in qid_tokens.items():
        if seed_qid in visited:
            continue
        members = [seed_qid]
        members_tokens = set(seed_toks)
        visited.add(seed_qid)
        for other_qid, other_toks in qid_tokens.items():
            if other_qid in visited:
                continue
            if jaccard(seed_toks, other_toks) >= jaccard_threshold:
                members.append(other_qid)
                members_tokens.update(other_toks)
                visited.add(other_qid)
        if len(members) >= 3:  # only promote 3+ member clusters
            # Theme = most-frequent content words in the cluster
            tok_counts = Counter()
            for qid in members:
                tok_counts.update(qid_tokens[qid])
            theme_words = [w for w, _ in tok_counts.most_common(8)]
            clusters.append({
                'theme_tokens': theme_words,
                'qids': sorted(members)[:15],
                'qid_count': len(members),
                'sample_texts': [qid_text[m][:200] for m in members[:5]],
            })

    clusters.sort(key=lambda c: -c['qid_count'])
    return clusters


def scan_traps(explanations, section):
    """KVA / NOG / XYZ trap candidates."""
    return cluster_explanations(
        explanations, section, field='technique', secondary_field='pitfall'
    )


def scan_mek(explanations):
    return cluster_explanations(
        explanations, 'MEK', field='technique', secondary_field='solution_path'
    )


def scan_reading(parsed, section):
    """LÄS / ELF question-type candidates from prompt structure.

    Reading questions don't have a tidy `technique` field that
    clusters cleanly, so we cluster on PROMPT structure instead.
    """
    section_entries = [
        (qid, q) for qid, q in parsed.items()
        if section_of(qid) == section
    ]
    qid_tokens = {}
    qid_text = {}
    for qid, q in section_entries:
        prompt = (q.get('prompt') or '').strip()
        if prompt:
            qid_tokens[qid] = content_tokens(prompt, min_len=3)
            qid_text[qid] = prompt[:200]

    visited = set()
    clusters = []
    for seed_qid, seed_toks in qid_tokens.items():
        if seed_qid in visited:
            continue
        members = [seed_qid]
        members_tokens = set(seed_toks)
        visited.add(seed_qid)
        for other_qid, other_toks in qid_tokens.items():
            if other_qid in visited:
                continue
            if jaccard(seed_toks, other_toks) >= 0.4:  # looser for reading
                members.append(other_qid)
                members_tokens.update(other_toks)
                visited.add(other_qid)
        if len(members) >= 5:
            tok_counts = Counter()
            for qid in members:
                tok_counts.update(qid_tokens[qid])
            theme_words = [w for w, _ in tok_counts.most_common(8)]
            clusters.append({
                'theme_tokens': theme_words,
                'qids': sorted(members)[:15],
                'qid_count': len(members),
                'sample_prompts': [qid_text[m] for m in members[:5]],
            })
    clusters.sort(key=lambda c: -c['qid_count'])
    return clusters


def scan_dtk(parsed):
    """DTK tactics candidates. v0: cluster prompts by surface
    structure since no Layer 2 explanations exist.
    """
    # Same approach as scan_reading but flagged as v0
    clusters = scan_reading(parsed, 'DTK')
    for c in clusters:
        c['_v0_caveat'] = 'No Layer 2 explanations for DTK yet'
    return clusters


# ── CLI ───────────────────────────────────────────────────────────────

FAMILY_MAP = {
    'ord_roots':    ('ORD', 'scan_ord_roots'),
    'kva_traps':    ('KVA', 'scan_traps'),
    'nog_traps':    ('NOG', 'scan_traps'),
    'xyz_traps':    ('XYZ', 'scan_traps'),
    'mek_protocol': ('MEK', 'scan_mek'),
    'las_taxonomy': ('LÄS', 'scan_reading'),
    'elf_taxonomy': ('ELF', 'scan_reading'),
    'dtk_tactics':  ('DTK', 'scan_dtk'),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--family', required=True, choices=FAMILY_MAP.keys())
    ap.add_argument('--output', default=None,
                    help='Output JSON path (default: /tmp/frameworks/candidates_<family>.json)')
    args = ap.parse_args()

    section, scanner_name = FAMILY_MAP[args.family]
    parsed, explanations = load_corpus()
    print(f'Loaded {len(parsed)} parsed questions, '
          f'{len(explanations)} explanations')
    print(f'Section {section}: '
          f'{sum(1 for q in parsed if section_of(q) == section)} questions, '
          f'{sum(1 for q in explanations if section_of(q) == section)} explanations')

    if scanner_name == 'scan_ord_roots':
        candidates = scan_ord_roots(parsed, explanations)
    elif scanner_name == 'scan_traps':
        candidates = scan_traps(explanations, section)
    elif scanner_name == 'scan_mek':
        candidates = scan_mek(explanations)
    elif scanner_name == 'scan_reading':
        candidates = scan_reading(parsed, section)
    elif scanner_name == 'scan_dtk':
        candidates = scan_dtk(parsed)
    else:
        raise SystemExit(f'unknown scanner: {scanner_name}')

    out_dir = Path('/tmp/frameworks')
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = Path(args.output or (out_dir / f'candidates_{args.family}.json'))
    out_path.write_text(json.dumps({
        'family': args.family,
        'section': section,
        'candidate_count': len(candidates),
        'candidates': candidates,
    }, ensure_ascii=False, indent=2))

    print(f'Wrote {len(candidates)} candidates → {out_path}')


if __name__ == '__main__':
    main()
