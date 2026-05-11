"""
Pre-compute a qid → similar-qid map by clustering on the `technique`
field. Used for transfer tests: after a student studies question X
(whose explanation names technique T), pick question Y from the same
T-cluster and test whether the student can solve it.

Output: /tmp/trajectory/technique_index.json
    {
      "by_qid": { qid: { "technique": str, "similar_qids": [...] } },
      "clusters": { technique_key: [qid, qid, ...] }
    }

The technique-key is a normalized form (lowercased, deaccented,
collapsed whitespace, truncated to first 60 chars). Two techniques
cluster together if they have ≥0.7 token-set overlap on content
words (length ≥ 4). This is intentionally fuzzy — the corpus has
techniques like "Pythagoras: a² + b² = c²" and "Pythagoras-test för
rätvinklig triangel" that should cluster.
"""
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path


SECTION_RE = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid):
    m = SECTION_RE.search(qid)
    return m.group(1) if m else None


def deaccent(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if not unicodedata.combining(c))


def normalize_technique(s):
    """Lowercase + deaccent + collapse whitespace + cap length."""
    s = (s or '').lower()
    s = deaccent(s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s[:120]


def content_tokens(s, min_len=4):
    """Set of content words ≥min_len chars."""
    s = normalize_technique(s)
    words = re.findall(r"[a-z]+", s)
    return {w for w in words if len(w) >= min_len}


def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def main():
    # Load all explanations
    explanations = {}
    for p in sorted(Path('data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        for qid, e in json.loads(p.read_text()).items():
            explanations[qid] = e

    print(f'Loaded {len(explanations)} explanations')

    # Extract techniques + tokens
    by_qid = {}
    for qid, e in explanations.items():
        tech = e.get('technique') or ''
        if not tech.strip():
            continue
        by_qid[qid] = {
            'section': section_of(qid),
            'technique': tech,
            'tokens': content_tokens(tech),
        }

    # Cluster within section (transfer tests should stay in-section —
    # we don't want to "transfer" from XYZ to ORD)
    qids_by_sec = defaultdict(list)
    for qid, info in by_qid.items():
        qids_by_sec[info['section']].append(qid)

    similar = defaultdict(list)
    for sec, qids in qids_by_sec.items():
        print(f'  {sec}: {len(qids)} entries — clustering...')
        for i, qa in enumerate(qids):
            tokens_a = by_qid[qa]['tokens']
            for qb in qids[i+1:]:
                tokens_b = by_qid[qb]['tokens']
                score = jaccard(tokens_a, tokens_b)
                if score >= 0.5:
                    similar[qa].append((qb, round(score, 2)))
                    similar[qb].append((qa, round(score, 2)))

    # Save: for each qid, sorted similar list (highest jaccard first)
    out = {'by_qid': {}}
    for qid, info in by_qid.items():
        sims = similar.get(qid, [])
        sims.sort(key=lambda x: -x[1])
        out['by_qid'][qid] = {
            'section': info['section'],
            'technique': info['technique'][:100],
            'similar_qids': [s[0] for s in sims[:5]],  # top-5 similar
        }

    out_dir = Path('/tmp/trajectory')
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / 'technique_index.json').write_text(
        json.dumps(out, ensure_ascii=False, indent=2)
    )

    # Stats
    coverage = sum(1 for v in out['by_qid'].values() if v['similar_qids'])
    print(f'\nQids with ≥1 similar partner: {coverage}/{len(out["by_qid"])}')
    print(f'Saved: /tmp/trajectory/technique_index.json')


if __name__ == '__main__':
    main()
