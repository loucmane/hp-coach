"""
Pedagogy scan — Phase 1 of the dogfood pass.

Applies 10 rule-checks per explanation entry against the pedagogy rules
locked in `pipeline/explanations/prompts.py`. Outputs a weighted-score
queue of entries that need a closer LLM look.

Weighted scoring:
- HIGH precision (2 pts each): objective text-pattern violations
- MEDIUM precision (1 pt each): verdict / failure-mode language gaps
- LOW precision (0.5 pt): subjective "insight-first" check

Enter regen queue at ≥3 weighted points.

Output: /tmp/pedagogy/scan.json + a per-section console summary.
"""
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

# ─── Constants ───────────────────────────────────────────────────────

MO = ''
MC = ''

CHECK_WEIGHTS = {
    'technique_too_operational': 2.0,
    'distractor_opener_repeat': 2.0,
    'distractor_circular': 2.0,
    'xyz_no_work_shown': 2.0,
    'pitfall_paraphrases_technique': 2.0,
    'solution_too_long': 2.0,
    'kva_no_verdict': 1.0,
    'lasmek_no_failure_mode': 1.0,
    'nog_no_letter_sufficiency': 1.0,
    'solution_not_insight_first': 0.5,
}

ENTRY_QUEUE_THRESHOLD = 3.0  # weighted points

# Vocab banks — extracted from prompts.py addenda

# KVA verdict vocab (technique must reference the comparison outcome)
KVA_VERDICT_VOCAB = {
    'större', 'mindre', 'lika', 'otillräcklig', 'tecken',
    'jämför', 'jämförelse', 'specialfall', 'verdict', 'ordning',
    'testfall', 'olikhet', 'identitet',
}

# Failure-mode vocabulary for LÄS / MEK / ELF distractor why_wrong
FAILURE_MODE_VOCAB_SV = {
    'motsäger', 'motsätter', 'övergeneraliserar', 'övertolkar',
    'inverterar', 'snävar', 'snävar in', 'importerar', 'flyttar',
    'saknar', 'missar', 'paraphraser', 'paraphraserar', 'fel rektion',
    'fel källa', 'fel kategori', 'fel fokus',
}

FAILURE_MODE_VOCAB_EN = {
    'contradicts', 'overreaches', 'overgeneralizes', 'over-generalizes',
    'inverts', 'narrows', 'misses', 'lacks', 'misattributes',
    'misrepresents', 'over-extends', 'under-reaches',
}

FAILURE_MODE_VOCAB = FAILURE_MODE_VOCAB_SV | FAILURE_MODE_VOCAB_EN

# Mechanics openers (sentence-initial verbs that violate INSIGHT-FIRST)
MECHANICS_OPENERS_SV = (
    'räkna ut', 'sätt in', 'beräkna', 'multiplicera', 'dela',
    'dra', 'addera', 'subtrahera', 'lägg ihop', 'skriv om',
    'sätta in', 'räkna fram', 'utför',
)
MECHANICS_OPENERS_EN = (
    'compute', 'calculate', 'add up', 'multiply', 'divide',
    'subtract', 'plug in',
)
MECHANICS_OPENERS = MECHANICS_OPENERS_SV + MECHANICS_OPENERS_EN

# Sufficiency vocab — NOG distractor why_tempting must name the
# sufficiency mistake (ensam / tillsammans / otillräcklig / etc.)
NOG_SUFFICIENCY_VOCAB = {
    'ensam', 'ensamt', 'räcker', 'tillsammans', 'var för sig',
    'otillräcklig', 'tillräcklig', 'kombinera', 'kombinerat',
    'en av', 'båda', 'bägge',
}

# Operational-only technique markers (technique is JUST naming the
# operation, not the transferable pattern). Flag when technique is
# very short AND contains no rule/conditional/principle words.
TECHNIQUE_PATTERN_WORDS = {
    'regel', 'princip', 'mönster', 'formel', 'när', 'om',
    'för', 'vid', 'eftersom', 'alltså', 'fall', 'metod', 'teknik',
    'tekniken', 'identifiera', 'använd', 'sök', 'kontroll',
    'rule', 'pattern', 'principle', 'when', 'if', 'method',
    'technique', 'check', 'use', 'identify',
}

# Step-glue keywords for XYZ — proves the solution shows work
XYZ_STEP_GLUE = (
    '→', 'alltså', 'först', 'sen', 'sedan', 'därför',
    'eftersom', 'följaktligen', 'så ', 'får vi', 'ger',
    'leder till', '⇒',
)

# Empathy openers (canonical list from prompts.py — used for repeat
# detection). We don't list ALL openers, just normalize the leading
# 3-4 word fragment of each distractor why_tempting.

# ─── Helpers ─────────────────────────────────────────────────────────

SECTION_RE = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid):
    m = SECTION_RE.search(qid)
    return m.group(1) if m else None


def strip_markers(s):
    return re.sub(re.escape(MO) + '.*?' + re.escape(MC), '', s, flags=re.S)


def sentence_count(s):
    """Approximate sentence count — splits on `. ` or `! ` or `? `."""
    if not s:
        return 0
    # Treat each terminal punctuation that is followed by space + capital
    # as a sentence boundary.
    boundaries = re.findall(r'[.!?](?:\s+[A-ZÅÄÖÜ]|$)', s)
    # Account for sentences ending at the end of the string
    return max(1, len(boundaries))


def content_words(s, min_len=4):
    """Lowercase content words (longer than min_len) for overlap calc."""
    if not s:
        return set()
    s = strip_markers(s.lower())
    # Strip diacritics for matching (so 'över' matches 'over')
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if not unicodedata.combining(c))
    words = re.findall(r"[a-zA-Z]+", s)
    return {w for w in words if len(w) >= min_len}


def overlap_ratio(a, b):
    """|a ∩ b| / min(|a|, |b|). 0 if either is empty."""
    if not a or not b:
        return 0.0
    return len(a & b) / min(len(a), len(b))


def opener_fragment(s, n=4):
    """First n words of a string, lowercased + diacritic-stripped."""
    if not s:
        return ''
    s = s.strip().lower()
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if not unicodedata.combining(c))
    words = re.findall(r"[a-z]+", s)
    return ' '.join(words[:n])


def first_sentence(s):
    if not s:
        return ''
    m = re.match(r'^[^.!?]+', s.strip())
    return m.group(0) if m else s.strip()


# ─── Per-check functions ─────────────────────────────────────────────

def check_technique_too_operational(e, q, section):
    """Technique is too narrow/operational. Flag when it's short AND
    contains no rule/conditional/pattern words."""
    t = (e.get('technique') or '').strip()
    if not t:
        return None
    if len(t) >= 80:
        return None  # long enough to likely have substance
    # Strip leading word and look for pattern signals
    t_lower = t.lower()
    has_pattern_word = any(w in t_lower for w in TECHNIQUE_PATTERN_WORDS)
    has_colon = ':' in t  # technique often introduces rule via "X: Y"
    if has_pattern_word or has_colon:
        return None
    return f'short technique with no pattern/rule signal: {t[:80]!r}'


def check_kva_no_verdict(e, q, section):
    if section != 'KVA':
        return None
    t = (e.get('technique') or '').lower()
    if not t:
        return None
    if any(w in t for w in KVA_VERDICT_VOCAB):
        return None
    return f'KVA technique missing verdict vocab: {(e.get("technique") or "")[:100]!r}'


def check_distractor_opener_repeat(e, q, section):
    distrs = e.get('distractors') or []
    if len(distrs) < 2:
        return None
    openers = [opener_fragment(d.get('why_tempting') or '', n=4)
               for d in distrs]
    openers = [o for o in openers if o]
    counts = Counter(openers)
    repeats = [(o, n) for o, n in counts.items() if n >= 2]
    if not repeats:
        return None
    return f'repeated opener: {repeats[0][0]!r} ×{repeats[0][1]}'


def check_lasmek_no_failure_mode(e, q, section):
    """LÄS/MEK/ELF distractor why_wrong must name the failure mode."""
    if section not in ('LÄS', 'MEK', 'ELF'):
        return None
    distrs = e.get('distractors') or []
    if not distrs:
        return None
    misses = 0
    for d in distrs:
        wr = (d.get('why_wrong') or '').lower()
        if any(v in wr for v in FAILURE_MODE_VOCAB):
            continue
        misses += 1
    if misses >= 2:  # at least 2 distractors miss → systematic
        return f'{misses}/{len(distrs)} distractors lack failure-mode language'
    return None


def check_distractor_circular(e, q, section):
    distrs = e.get('distractors') or []
    high_overlap = []
    for d in distrs:
        wt = content_words(d.get('why_tempting') or '')
        ww = content_words(d.get('why_wrong') or '')
        if len(wt) < 4 or len(ww) < 4:
            continue
        ratio = overlap_ratio(wt, ww)
        if ratio >= 0.7:
            high_overlap.append((d.get('letter'), round(ratio, 2)))
    if len(high_overlap) >= 2:  # systematic across the entry
        return f'circular distractors: {high_overlap}'
    return None


def check_xyz_no_work_shown(e, q, section):
    if section != 'XYZ':
        return None
    sp = e.get('solution_path') or ''
    if not sp:
        return None
    # Count math markers (each pair = 1 markered expression)
    n_markers = sp.count(MO)
    n_step_glue = sum(sp.lower().count(g) for g in XYZ_STEP_GLUE)
    if n_markers >= 1 or n_step_glue >= 2:
        return None
    return f'no markers ({n_markers}) and no step-glue ({n_step_glue}): {sp[:100]!r}'


def check_nog_no_letter_sufficiency(e, q, section):
    if section != 'NOG':
        return None
    distrs = e.get('distractors') or []
    if not distrs:
        return None
    misses = 0
    for d in distrs:
        wt = (d.get('why_tempting') or '').lower()
        if any(v in wt for v in NOG_SUFFICIENCY_VOCAB):
            continue
        misses += 1
    if misses >= 2:
        return f'{misses}/{len(distrs)} distractors lack sufficiency vocab'
    return None


def check_solution_not_insight_first(e, q, section):
    sp = e.get('solution_path') or ''
    if not sp:
        return None
    first = first_sentence(sp).strip().lower()
    for opener in MECHANICS_OPENERS:
        if first.startswith(opener):
            return f'mechanics opener: {first[:80]!r}'
    return None


def check_pitfall_paraphrases_technique(e, q, section):
    p = e.get('pitfall')
    t = e.get('technique') or ''
    if not p or not isinstance(p, str):
        return None
    pw = content_words(p)
    tw = content_words(t)
    if len(pw) < 4 or len(tw) < 4:
        return None
    ratio = overlap_ratio(pw, tw)
    if ratio >= 0.6:
        return f'pitfall overlaps technique {round(ratio, 2)}'
    return None


def check_solution_too_long(e, q, section):
    sp = e.get('solution_path') or ''
    n = sentence_count(sp)
    if n > 5:
        return f'solution_path has {n} sentences (>5)'
    return None


CHECKS = [
    ('technique_too_operational', check_technique_too_operational),
    ('kva_no_verdict', check_kva_no_verdict),
    ('distractor_opener_repeat', check_distractor_opener_repeat),
    ('lasmek_no_failure_mode', check_lasmek_no_failure_mode),
    ('distractor_circular', check_distractor_circular),
    ('xyz_no_work_shown', check_xyz_no_work_shown),
    ('nog_no_letter_sufficiency', check_nog_no_letter_sufficiency),
    ('solution_not_insight_first', check_solution_not_insight_first),
    ('pitfall_paraphrases_technique', check_pitfall_paraphrases_technique),
    ('solution_too_long', check_solution_too_long),
]


# ─── Driver ──────────────────────────────────────────────────────────

def main():
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

    print(f'Scanning {len(explanations)} entries '
          f'against {len(CHECKS)} pedagogy checks...')

    by_qid = {}
    by_check = defaultdict(list)

    for qid, e in explanations.items():
        section = section_of(qid)
        q = parsed.get(qid, {})
        findings = []
        score = 0.0
        for check_id, check_fn in CHECKS:
            try:
                msg = check_fn(e, q, section)
            except Exception as ex:
                msg = f'(check error: {ex})'
            if msg:
                weight = CHECK_WEIGHTS[check_id]
                findings.append({
                    'check_id': check_id,
                    'weight': weight,
                    'message': msg,
                })
                score += weight
                by_check[check_id].append(qid)
        if findings:
            by_qid[qid] = {
                'section': section,
                'score': round(score, 2),
                'findings': findings,
            }

    # Build queue (≥3 weighted points)
    queue_by_section = defaultdict(list)
    watch_by_section = defaultdict(list)  # 1-2 points
    for qid, info in by_qid.items():
        if info['score'] >= ENTRY_QUEUE_THRESHOLD:
            queue_by_section[info['section']].append(qid)
        else:
            watch_by_section[info['section']].append(qid)

    out_dir = Path('/tmp/pedagogy')
    out_dir.mkdir(parents=True, exist_ok=True)

    output = {
        'totals': {
            'audited': len(explanations),
            'with_findings': len(by_qid),
            'in_queue': sum(len(v) for v in queue_by_section.values()),
            'in_watch': sum(len(v) for v in watch_by_section.values()),
            'threshold': ENTRY_QUEUE_THRESHOLD,
        },
        'check_weights': CHECK_WEIGHTS,
        'check_counts': {k: len(v) for k, v in by_check.items()},
        'queue_by_section': dict(queue_by_section),
        'watch_by_section': dict(watch_by_section),
        'by_qid': by_qid,
    }
    (out_dir / 'scan.json').write_text(
        json.dumps(output, ensure_ascii=False, indent=2))

    # Also write per-section queue files (one qid per line, for agents)
    for sec, qids in queue_by_section.items():
        (out_dir / f'queue_{sec}.json').write_text(
            json.dumps(qids, ensure_ascii=False))

    # Print summary
    print()
    print('=' * 60)
    print(f'Pedagogy Scan Summary')
    print('=' * 60)
    print(f'Audited:          {len(explanations)}')
    print(f'With findings:    {len(by_qid)}')
    print(f'In regen queue:   {output["totals"]["in_queue"]} '
          f'(score ≥ {ENTRY_QUEUE_THRESHOLD})')
    print(f'On watch list:    {output["totals"]["in_watch"]} '
          f'(1-2 pts)')
    print()
    print('Per-check hit counts:')
    for check_id, _ in CHECKS:
        n = len(by_check.get(check_id, []))
        w = CHECK_WEIGHTS[check_id]
        print(f'  [{w:.1f}pt] {check_id}: {n}')
    print()
    print('Regen queue per section:')
    for sec in ['XYZ', 'KVA', 'NOG', 'ORD', 'LÄS', 'MEK', 'ELF']:
        n = len(queue_by_section.get(sec, []))
        w = len(watch_by_section.get(sec, []))
        print(f'  {sec}: {n} in queue, {w} on watch')
    print()
    print(f'Output written to: {out_dir / "scan.json"}')


if __name__ == '__main__':
    main()
