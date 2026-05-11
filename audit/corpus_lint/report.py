"""Generate a human-readable summary of /tmp/corpus_lint/flags.json.

Writes audit/corpus_lint/_report.md (gitignored — regenerated per run).

Usage:
    python3 audit/corpus_lint/report.py
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
SECTION_RX = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid: str) -> str:
    m = SECTION_RX.search(qid)
    return m.group(1) if m else '?'


def main():
    flags_path = Path('/tmp/corpus_lint/flags.json')
    if not flags_path.exists():
        raise SystemExit(f'No flags.json at {flags_path} — run lint.py first')

    data = json.loads(flags_path.read_text())
    summary = data['summary']
    flags = data['flags']

    lines = ['# Corpus lint report', '']
    lines.append(f'Generated from `/tmp/corpus_lint/flags.json`.')
    lines.append(f'Source corpus: `data/explanations/`, `data/parsed/`, `frameworks/` (ELF section excluded).')
    lines.append('')

    lines.append('## Summary')
    lines.append('')
    lines.append('| Classification | Count |')
    lines.append('|---|---|')
    for cls in ('ok', 'whitelist', 'archaic', 'anglicism', 'low_freq', 'zero_freq'):
        n = summary.get(cls, 0)
        lines.append(f'| {cls} | {n:,} |')
    lines.append(f'| **Total unique tokens** | {summary["total_unique_tokens"]:,} |')
    lines.append('')

    # ── Archaic ────────────────────────────────────────────────────────
    lines.append('## Archaic flags')
    lines.append('')
    archaic = flags.get('archaic', [])
    if not archaic:
        lines.append('_None._')
    else:
        lines.append('| Token | Corpus freq | wordfreq zipf | Reason |')
        lines.append('|---|---|---|---|')
        for f in archaic:
            lines.append(f'| `{f["token"]}` | {f["corpus_frequency"]} | {f["zipf"]} | {f["reason"]} |')
    lines.append('')

    # ── Anglicism (with caveat) ────────────────────────────────────────
    lines.append('## Anglicism flags (regex-based — may have false positives)')
    lines.append('')
    lines.append('Single-word regex match. Real English quotes in Swedish text (e.g. ')
    lines.append('LÄS passages naming English book titles) will register as false positives ')
    lines.append("here. Use Phase F's contextual Opus audit to filter.")
    lines.append('')
    angl = flags.get('anglicism', [])
    if angl:
        lines.append('| Token | Corpus freq | zipf |')
        lines.append('|---|---|---|')
        for f in angl[:20]:
            lines.append(f'| `{f["token"]}` | {f["corpus_frequency"]} | {f["zipf"]} |')
        if len(angl) > 20:
            lines.append(f'| _… and {len(angl) - 20} more_ | | |')
    lines.append('')

    # ── Zero-freq ──────────────────────────────────────────────────────
    lines.append('## Zero-frequency tokens (highest-priority signal)')
    lines.append('')
    zero = flags.get('zero_freq', [])
    lines.append(f'{len(zero)} unique tokens that wordfreq scores at zipf=0 (not in modern Swedish corpus).')
    lines.append('Expected mix:')
    lines.append('- Systematic parser typos (letter-swap bugs in `data/parsed/`)')
    lines.append('- LLM-malformed compounds (the `inflytanderik` class)')
    lines.append('- Legitimate Swedish compounds wordfreq does not know')
    lines.append('- Proper nouns (people, places, work titles)')
    lines.append('')
    lines.append('### Top 50 by corpus frequency')
    lines.append('')
    lines.append('| Token | Corpus freq | Sample qid |')
    lines.append('|---|---|---|')
    for f in zero[:50]:
        sample = f.get('sources_sample', [])
        sample_qid = sample[0].get('qid', '?') if sample else '?'
        lines.append(f'| `{f["token"]}` | {f["corpus_frequency"]} | `{sample_qid}` |')
    lines.append('')

    # ── Per-section zero-freq breakdown ───────────────────────────────
    lines.append('### Zero-freq token distribution by section')
    lines.append('')
    sec_counts = Counter()
    for f in zero:
        for src in f.get('sources_sample', [])[:1]:  # use first source for section
            sec_counts[section_of(src.get('qid', ''))] += 1
    lines.append('| Section | Zero-freq unique tokens (first-source) |')
    lines.append('|---|---|')
    for sec, n in sec_counts.most_common():
        lines.append(f'| {sec} | {n} |')
    lines.append('')

    # ── Suspected parser-typo cluster ─────────────────────────────────
    lines.append('### Suspected parser-typo cluster (letter-swap pattern)')
    lines.append('')
    lines.append('These zero-freq tokens look like adjacent-letter swaps of real Swedish words:')
    lines.append('')
    suspects = []
    typo_signatures = {
        'kvanttiet': 'kvantitet (ti↔tt swap)',
        'otlilräcklig': 'otillräcklig (il↔li swap)',
        'tlilsammans': 'tillsammans (il↔li swap)',
        'tlil': 'till (il↔li swap)',
        'olika': '— (real word; not a typo)',
    }
    for f in zero:
        if f['token'] in typo_signatures:
            suspects.append((f['token'], f['corpus_frequency'], typo_signatures[f['token']]))
    if suspects:
        lines.append('| Suspect token | Freq | Likely correct |')
        lines.append('|---|---|---|')
        for tok, freq, correct in suspects:
            lines.append(f'| `{tok}` | {freq} | {correct} |')
    else:
        lines.append('_None matched this seed list (extend seed list to find more)._')
    lines.append('')

    lines.append('## Next steps (per the plan)')
    lines.append('')
    lines.append('1. Auto-classify zero-freq tokens by heuristic (proper-noun, compound, typo, malformed)')
    lines.append('2. Build per-class whitelist + fix list')
    lines.append('3. Apply mechanical fixes (find-replace for typos, regen for malformed compounds)')
    lines.append('4. Phase F multi-pass Opus audit catches context-dependent errors')
    lines.append('5. Iterate until convergence')

    out_path = SCRIPT_DIR / '_report.md'
    out_path.write_text('\n'.join(lines))
    print(f'Wrote: {out_path}')


if __name__ == '__main__':
    main()
