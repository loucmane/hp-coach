"""One-shot letter-swap typo scanner for app/public/data/.

Walks every Swedish-language string in the SPA-served JSON files,
tokenizes them, finds zipf=0 tokens (i.e. tokens wordfreq has never
seen in any Swedish corpus), then tries every adjacent-character-swap
of that token to see if any swap yields a high-frequency Swedish word.

If yes → likely PARSER_TYPO. Output a candidate fix list grouped by
frequency, ready for hand-curation into typo_fixes.json.

Idempotent: filters out fixes already present in the curated typo_fixes
list so we only see NEW candidates.

Usage:
    python3 audit/corpus_lint/scan_spa_typos.py
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from wordfreq import zipf_frequency


ROOT = Path(__file__).parent.parent.parent
SPA_DATA = ROOT / "app" / "public" / "data"
CURATED = ROOT / "audit" / "corpus_lint" / "typo_fixes.json"

# Tokens that look like Swedish words: at least 5 letters, leading
# letter can be uppercase or lowercase. Earlier regex omitted uppercase
# A-Z from the leading class, which meant tokens like "Vilket" got
# mis-split into "V" + "ilket" — flooding the scan with false-positive
# swap candidates. Be permissive on case; we lowercase before lookup.
TOKEN_RE = re.compile(r"[A-Za-zÅÄÖåäöÉÜéü]{5,}")

# Skip ELF section — it's English, wordfreq sv wouldn't recognise it.
SKIPPED_SECTIONS = {"ELF"}


def adjacent_swaps(token: str):
    """Yield every candidate produced by one adjacent-char swap."""
    for i in range(len(token) - 1):
        yield token[:i] + token[i + 1] + token[i] + token[i + 2:]


def is_letter_swap_typo(token: str, min_zipf: float = 2.0) -> tuple[str, float] | None:
    """If a single adjacent-swap of `token` lands on a real Swedish word
    with zipf >= min_zipf, return (correct, zipf). Else None.

    Threshold 2.0 catches rarer past-participles and conjugations
    that real Swedish text uses but wordfreq's corpus rarely sees
    (e.g. `rabatterade` zipf=2.04, `kvantitet` zipf=3.52). False
    positives at this threshold are uncommon for 5+-char tokens and
    easy to filter in hand-curation.
    """
    for cand in adjacent_swaps(token):
        z = zipf_frequency(cand, "sv")
        if z >= min_zipf:
            return cand, z
    return None


def walk_strings(obj, section: str | None = None):
    """Yield (string, section) tuples from any JSON structure."""
    if isinstance(obj, dict):
        sec = obj.get("section", section)
        for k, v in obj.items():
            yield from walk_strings(v, sec)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_strings(v, section)
    elif isinstance(obj, str):
        yield obj, section


def main():
    # Load curated list — skip tokens already on it.
    curated = json.loads(CURATED.read_text())
    already_fixed = {entry["typo"].lower() for entry in curated.get("fix", [])}

    # Tokenize the SPA corpus.
    token_freq = Counter()
    token_contexts: dict[str, list[str]] = defaultdict(list)
    for f in sorted(SPA_DATA.glob("*.json")):
        d = json.loads(f.read_text())
        qs = d if isinstance(d, list) else d.get("questions", [])
        for q in qs:
            sec = q.get("section")
            if sec in SKIPPED_SECTIONS:
                continue
            for s, _ in walk_strings(q, sec):
                for token in TOKEN_RE.findall(s):
                    low = token.lower()
                    token_freq[low] += 1
                    if len(token_contexts[low]) < 3:
                        token_contexts[low].append(s.strip()[:120])

    # Find zero-freq tokens.
    candidates = []
    for token, freq in token_freq.most_common():
        if token in already_fixed:
            continue
        z = zipf_frequency(token, "sv")
        if z > 0:
            continue
        hit = is_letter_swap_typo(token)
        if hit is None:
            continue
        correct, correct_zipf = hit
        candidates.append({
            "typo": token,
            "correct": correct,
            "freq": freq,
            "correct_zipf": round(correct_zipf, 2),
            "context": token_contexts[token][0] if token_contexts[token] else "",
        })

    candidates.sort(key=lambda c: -c["freq"])

    # Pretty print.
    print(f"Scanned {sum(token_freq.values()):,} tokens across {SPA_DATA.relative_to(ROOT)}/*.json")
    print(f"Unique tokens: {len(token_freq):,}")
    print(f"Already on curated list: {len(already_fixed)}")
    print(f"New letter-swap typo candidates: {len(candidates)}")
    print()
    print(f"{'typo':<22} {'→ correct':<22} {'freq':>5} {'zipf':>5}  context")
    print("─" * 100)
    for c in candidates:
        print(f"{c['typo']:<22} → {c['correct']:<20} {c['freq']:>5} {c['correct_zipf']:>5.2f}  {c['context'][:50]}")
    print()
    print("To merge into typo_fixes.json, add entries like:")
    print('    {"typo": "X", "correct": "Y", "freq": N, "note": "letter-swap"},')


if __name__ == "__main__":
    main()
