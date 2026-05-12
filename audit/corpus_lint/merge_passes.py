"""Merge Pass-1 + Pass-2 + Pass-3 outputs into the authoritative fix list.

Reads `/tmp/quality/pass{1,2,3}_output_NNN.json` for all batches and
produces `audit/corpus_lint/expert_fix_list.json` plus a human-readable
summary at `audit/corpus_lint/_pass_report.md`.

# Tiering (LOCKED per plan)

Per the corpus-quality plan, every candidate fix that survives drift-
filtering goes through Pass-4 (fix-verifier) before apply. The merge
output groups fixes into channels rather than auto-apply tiers:

- **to_pass4**: Pass-3 confirmed at HIGH confidence + Pass-3 added at
  HIGH confidence — sent to Pass-4 for in-context verification.
- **review_medium**: Pass-3 confirmed at MEDIUM, or Pass-3 added at
  MEDIUM. Still flows through Pass-4 but at lower priority; if Pass-4
  rejects, the flag is logged not applied.
- **log_low**: Pass-3 confirmed/added at LOW. Logged for residual
  catalog, not applied.
- **rejected**: Pass-3 explicitly rejected. Dropped with reason.

# Drift-filtering

The corpus has changed between Pass-1 and now (~13,800 early-harvest
corrections applied). Pass-1 references stale snippets that no longer
exist. The drift-filter does a single corpus-wide grep per candidate
snippet; if 0 hits, the flag is silently dropped (drift artifact).

# Pattern aggregation

Fixes that share (class, normalized suggested_fix) are grouped. Groups
with ≥3 instances surface as "systemic patterns" in the report — useful
for understanding which corpus-wide bug-classes survived three passes.

# Cascade-risk flagging

Fixes adjacent to determiners (den/det/de/en/ett), modal verbs (kan/
ska/skall/måste/borde/får/vill), or particle verbs are marked as
cascade-risk. Pass-4 should pay these extra attention; Pass-5 should
re-audit the surrounding sentence.

Usage:
    python3 audit/corpus_lint/merge_passes.py
    python3 audit/corpus_lint/merge_passes.py --quality-dir /tmp/quality
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent

OUT_FIX_LIST = SCRIPT_DIR / 'expert_fix_list.json'
OUT_REPORT = SCRIPT_DIR / '_pass_report.md'


# ── Cascade-risk patterns ────────────────────────────────────────────

DETERMINERS = {
    'den', 'det', 'de', 'en', 'ett', 'denna', 'detta', 'dessa',
    'denne', 'min', 'mitt', 'mina', 'din', 'ditt', 'dina',
    'sin', 'sitt', 'sina', 'hans', 'hennes', 'deras', 'vår', 'vårt', 'våra',
    'någon', 'något', 'några', 'all', 'allt', 'alla', 'ingen', 'inget', 'inga',
}
MODAL_VERBS = {
    'kan', 'kunde', 'ska', 'skall', 'skulle',
    'måste', 'borde', 'får', 'fick', 'vill', 'ville',
    'bör', 'lär', 'tör',
}


def cascade_risk(snippet: str, suggested_fix: str) -> list[str]:
    """Identify cascade-risk patterns in a fix.

    Returns list of risk tags (empty if no risk detected).
    """
    risks = []
    # Tokenize snippet by whitespace; check first/last tokens
    snip_toks = re.findall(r"\b[\wåäöÅÄÖ\-]+\b", snippet.lower())
    fix_toks = re.findall(r"\b[\wåäöÅÄÖ\-]+\b", suggested_fix.lower())

    # Snippet contains or is adjacent to a determiner
    if snip_toks and snip_toks[0] in DETERMINERS:
        risks.append('determiner-prefix')
    if any(t in DETERMINERS for t in snip_toks):
        risks.append('determiner-internal')

    # Modal verbs
    if any(t in MODAL_VERBS for t in snip_toks):
        risks.append('modal-verb')

    # Particle verb pattern (verb + bort/ut/upp/in/på/av/till etc.)
    PARTICLES = {'bort', 'ut', 'upp', 'in', 'på', 'av', 'till', 'om', 'efter', 'fram'}
    if len(snip_toks) >= 2 and snip_toks[-1] in PARTICLES:
        risks.append('particle-verb')

    # Definite-form swap (snippet ends in -en/-et/-na; fix ends differently)
    def_suffixes = ('en', 'et', 'na', 'erna', 'orna', 'arna')
    if snip_toks and fix_toks:
        snip_def = any(snip_toks[-1].endswith(s) for s in def_suffixes)
        fix_def = any(fix_toks[-1].endswith(s) for s in def_suffixes)
        if snip_def != fix_def:
            risks.append('definite-form-swap')

    return risks


# ── Corpus loading for drift-filter ──────────────────────────────────

def load_corpus_text(root: Path) -> str:
    """Concatenate all corpus text into a single string for fast grep."""
    parts = []
    for dirpath in ('data/explanations', 'data/parsed', 'frameworks'):
        d = root / dirpath
        if not d.exists():
            continue
        for f in sorted(d.glob('*.json')):
            if f.name.startswith('_'):
                continue
            parts.append(f.read_text())
    return '\n'.join(parts)


def snippet_in_corpus(snippet: str, corpus_text: str) -> int:
    """Return literal occurrence count of snippet in corpus. 0 = drift."""
    if not snippet:
        return 0
    return corpus_text.count(snippet)


# ── Pass loading ─────────────────────────────────────────────────────

def load_pass(quality_dir: Path, pass_num: int) -> dict[str, dict]:
    """Return {qid: entry_output} for a given pass across all batches."""
    out: dict[str, dict] = {}
    for p in sorted(quality_dir.glob(f'pass{pass_num}_output_*.json')):
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            print(f'WARN: could not parse {p.name}; skipping')
            continue
        for entry in data.get('entries', []) or data.get('results', []) or []:
            qid = entry.get('qid')
            if qid:
                out[qid] = entry
    return out


# ── Merge ────────────────────────────────────────────────────────────

def merge(quality_dir: Path, corpus_text: str) -> dict:
    p1 = load_pass(quality_dir, 1)
    p2 = load_pass(quality_dir, 2)
    p3 = load_pass(quality_dir, 3)

    all_qids = set(p1) | set(p2) | set(p3)

    to_pass4 = []
    review_medium = []
    log_low = []
    rejected = []
    drift_dropped = []

    for qid in sorted(all_qids):
        p3_entry = p3.get(qid)
        if not p3_entry:
            # Pass-3 hasn't covered this qid yet. Collect Pass-1/Pass-2
            # flags into review_medium pending verification.
            for e in (p1.get(qid), p2.get(qid)):
                if not e:
                    continue
                for issue in e.get('issues', []) or []:
                    snip = issue.get('snippet') or ''
                    count = snippet_in_corpus(snip, corpus_text)
                    rec = {
                        **issue, 'qid': qid,
                        'source': f"pass{e.get('pass', '?')}",
                        'corpus_count': count,
                        'cascade_risks': cascade_risk(snip, issue.get('suggested_fix') or ''),
                    }
                    if count == 0:
                        drift_dropped.append({**rec, 'drift_reason': 'snippet not in current corpus'})
                    else:
                        review_medium.append(rec)
            continue

        for c in p3_entry.get('confirmed') or []:
            snip = c.get('snippet') or ''
            fix = c.get('suggested_fix') or ''
            count = snippet_in_corpus(snip, corpus_text)
            rec = {
                **c, 'qid': qid, 'verified_by': 'pass3',
                'corpus_count': count,
                'cascade_risks': cascade_risk(snip, fix),
            }
            if count == 0:
                drift_dropped.append({**rec, 'drift_reason': 'pass3-confirmed but snippet not in current corpus'})
                continue
            fc = (c.get('final_confidence') or '').lower()
            if fc == 'high':
                to_pass4.append(rec)
            elif fc == 'medium':
                review_medium.append(rec)
            else:
                log_low.append(rec)

        for r in p3_entry.get('rejected') or []:
            rejected.append({**r, 'qid': qid})

        for a in p3_entry.get('added') or []:
            snip = a.get('snippet') or ''
            fix = a.get('suggested_fix') or ''
            count = snippet_in_corpus(snip, corpus_text)
            rec = {
                **a, 'qid': qid, 'source': 'pass3_added',
                'corpus_count': count,
                'cascade_risks': cascade_risk(snip, fix),
            }
            if count == 0:
                drift_dropped.append({**rec, 'drift_reason': 'pass3-added but snippet not in current corpus'})
                continue
            conf = (a.get('confidence') or '').lower()
            if conf == 'high':
                to_pass4.append(rec)
            elif conf == 'medium':
                review_medium.append(rec)
            else:
                log_low.append(rec)

    # Pattern aggregation: group by (class, normalized suggested_fix)
    patterns: dict[tuple[str, str], list] = defaultdict(list)
    for rec in to_pass4 + review_medium:
        key = (rec.get('class', '?'), (rec.get('suggested_fix') or '').strip().lower())
        patterns[key].append(rec)
    # Keep groups with ≥ 3 instances
    big_patterns = [
        {'class': k[0], 'suggested_fix': k[1], 'instances': len(v),
         'qids_sample': [r['qid'] for r in v[:5]],
         'snippets_sample': list({r.get('snippet') for r in v[:5]})}
        for k, v in patterns.items() if len(v) >= 3
    ]
    big_patterns.sort(key=lambda x: -x['instances'])

    return {
        'summary': {
            'to_pass4': len(to_pass4),
            'review_medium': len(review_medium),
            'log_low': len(log_low),
            'rejected': len(rejected),
            'drift_dropped': len(drift_dropped),
            'systemic_patterns_count': len(big_patterns),
            'qids_with_flag': sum(
                1 for q in all_qids
                if any([
                    p3.get(q, {}).get('confirmed'),
                    p3.get(q, {}).get('added'),
                    (q not in p3 and (p1.get(q, {}).get('issues') or p2.get(q, {}).get('issues'))),
                ])
            ),
        },
        'to_pass4': to_pass4,
        'review_medium': review_medium,
        'log_low': log_low,
        'rejected': rejected,
        'drift_dropped': drift_dropped,
        'systemic_patterns': big_patterns,
    }


# ── Report ───────────────────────────────────────────────────────────

def write_report(merged: dict, out_path: Path):
    s = merged['summary']
    by_class_p4: dict[str, int] = defaultdict(int)
    by_class_review: dict[str, int] = defaultdict(int)
    cascade_count = 0
    for f in merged['to_pass4']:
        by_class_p4[f.get('class', '?')] += 1
        if f.get('cascade_risks'):
            cascade_count += 1
    for f in merged['review_medium']:
        by_class_review[f.get('class', '?')] += 1

    lines = []
    lines.append('# 3-pass audit merge report\n')
    lines.append('## Summary\n')
    lines.append(f"- **To Pass-4 verification (HIGH-confidence)**: {s['to_pass4']:,}")
    lines.append(f"- **Review queue (MEDIUM-confidence)**:           {s['review_medium']:,}")
    lines.append(f"- **Log only (LOW-confidence)**:                  {s['log_low']:,}")
    lines.append(f"- **Drift-dropped (stale snippets)**:             {s['drift_dropped']:,}")
    lines.append(f"- **Pass-3 explicitly rejected**:                 {s['rejected']:,}")
    lines.append(f"- **Systemic patterns (≥3 instances)**:           {s['systemic_patterns_count']:,}")
    lines.append(f"- **Cascade-risk flags in Pass-4 queue**:         {cascade_count:,}")
    lines.append(f"- **Qids with any flag**:                         {s['qids_with_flag']:,}")
    lines.append('')

    lines.append('## To Pass-4 — by class\n')
    for cls, n in sorted(by_class_p4.items(), key=lambda x: -x[1]):
        lines.append(f"- `{cls}`: {n}")
    lines.append('')

    lines.append('## Review queue — by class\n')
    for cls, n in sorted(by_class_review.items(), key=lambda x: -x[1]):
        lines.append(f"- `{cls}`: {n}")
    lines.append('')

    lines.append('## Top systemic patterns (≥ 3 instances)\n')
    for p in merged['systemic_patterns'][:30]:
        sample_snips = ', '.join(f'`{s}`' for s in p['snippets_sample'][:3] if s)
        lines.append(f"- [{p['class']}] × **{p['instances']}** → `{p['suggested_fix'][:50]}` "
                     f"(samples: {sample_snips})")
    lines.append('')

    lines.append('## Sample HIGH-confidence (first 30 of to-Pass-4)\n')
    for f in merged['to_pass4'][:30]:
        snip = (f.get('snippet') or '').replace('\n', ' ')[:80]
        fix = (f.get('suggested_fix') or '').replace('\n', ' ')[:80]
        risks = ','.join(f.get('cascade_risks') or [])
        risk_tag = f' ⚠ {risks}' if risks else ''
        lines.append(f"- `{f.get('qid')}` [{f.get('class')}] {snip} → {fix} (×{f.get('corpus_count', 0)}){risk_tag}")
    lines.append('')

    lines.append('## Sample drift-dropped (first 10)\n')
    for f in merged['drift_dropped'][:10]:
        snip = (f.get('snippet') or '').replace('\n', ' ')[:80]
        reason = f.get('drift_reason', '')
        lines.append(f"- `{f.get('qid')}` [{f.get('class')}] {snip} ({reason})")
    lines.append('')

    out_path.write_text('\n'.join(lines))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--quality-dir', default='/tmp/quality')
    ap.add_argument('--corpus-root', default=str(ROOT))
    args = ap.parse_args()

    print('Loading corpus for drift-filter...')
    corpus_text = load_corpus_text(Path(args.corpus_root))
    print(f'  corpus text size: {len(corpus_text)/1024/1024:.1f} MB')

    print('Merging passes...')
    merged = merge(Path(args.quality_dir), corpus_text)
    OUT_FIX_LIST.write_text(json.dumps(merged, ensure_ascii=False, indent=2))
    write_report(merged, OUT_REPORT)

    s = merged['summary']
    print('━' * 60)
    print('Three-pass merge complete')
    print('━' * 60)
    print(f"  To Pass-4 verification (HIGH):     {s['to_pass4']:>5}")
    print(f"  Review queue (MEDIUM):             {s['review_medium']:>5}")
    print(f"  Log only (LOW):                    {s['log_low']:>5}")
    print(f"  Drift-dropped (stale snippets):    {s['drift_dropped']:>5}")
    print(f"  Pass-3 explicitly rejected:        {s['rejected']:>5}")
    print(f"  Systemic patterns (≥ 3 instances): {s['systemic_patterns_count']:>5}")
    print(f"  Qids with any flag:                {s['qids_with_flag']:>5}")
    print()
    print(f"  Fix list: {OUT_FIX_LIST}")
    print(f"  Report:   {OUT_REPORT}")


if __name__ == '__main__':
    main()
