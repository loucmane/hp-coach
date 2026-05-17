"""Rebuild ord_roots.json example_questions by prefix-matching prompts.

The original framework was authored with random ORD qids in each
root's example_questions array — only ~15% of links actually pointed
at words containing the root's prefix. The lesson→drill deep-link
needs the qids to match the root, or the user reads about "för-"
then drills "amnesti".

Strategy:
  1. Load every parsed ORD question (parsing_status='complete').
  2. For each root entry, prefix-match prompt.lower() against the
     root with its trailing dash stripped.
  3. Cap at 12 example_questions per root to keep the deep-link drill
     focused. Sort by qid for deterministic output.
  4. Roots that yield zero matches keep their existing array (a
     too-rare prefix is better-served by a curated list than an empty
     drill).

The example_words field is untouched — that's hand-authored copy.

Run:
    python3 scripts/regen_ord_root_examples.py
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
FRAMEWORK_PATH = REPO_ROOT / "app" / "public" / "frameworks" / "ord_roots.json"
DATA_DIR = REPO_ROOT / "app" / "public" / "data"
MAX_EXAMPLES_PER_ROOT = 12


def collect_ord_questions() -> list[dict]:
    out: list[dict] = []
    for path in sorted(DATA_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        for q in json.loads(path.read_text()):
            if q.get("section") != "ORD":
                continue
            if q.get("parsing_status") != "complete":
                continue
            if not q.get("prompt"):
                continue
            out.append(q)
    return out


def main() -> int:
    framework = json.loads(FRAMEWORK_PATH.read_text())
    questions = collect_ord_questions()
    print(f"Loaded {len(questions)} parsed ORD questions")
    print(f"Loaded {len(framework['entries'])} root entries")

    # Pre-bucket by lowercase prefix so each root is one fast pass.
    by_prompt_prefix: dict[str, list[str]] = defaultdict(list)
    for q in questions:
        prompt = q["prompt"].lower().strip()
        # Index by every prefix length so we can answer "prefix X" in O(1).
        # Roots are 1–6 chars; bound the prefix space accordingly.
        for n in range(1, min(len(prompt), 7) + 1):
            by_prompt_prefix[prompt[:n]].append(q["qid"])

    total_before = 0
    total_after = 0
    empty_roots: list[str] = []
    for entry in framework["entries"]:
        before = len(entry.get("example_questions", []))
        total_before += before
        prefix = entry["root"].rstrip("-").lower()
        # Prefer the shortest prefix lookup that still matches the
        # root pattern. For "för-" → "för"; "be-" → "be"; "o-" → "o".
        matches = sorted(set(by_prompt_prefix.get(prefix, [])))
        # Cap at MAX_EXAMPLES_PER_ROOT, deterministic sort by qid.
        capped = matches[:MAX_EXAMPLES_PER_ROOT]
        if capped:
            entry["example_questions"] = capped
            total_after += len(capped)
        else:
            empty_roots.append(f"{entry['id']} {entry['root']}")
            total_after += before  # kept original
        print(
            f"  {entry['id']} {entry['root']:15s} "
            f"{before:2d} → {len(capped):2d} matches "
            f"({'fallback to original' if not capped else 'replaced'})"
        )

    FRAMEWORK_PATH.write_text(
        json.dumps(framework, ensure_ascii=False, indent=2) + "\n"
    )
    print()
    print(f"Total example_questions: {total_before} → {total_after}")
    if empty_roots:
        print(
            f"\n{len(empty_roots)} roots had zero corpus matches "
            f"(kept original example_questions):"
        )
        for r in empty_roots:
            print(f"  {r}")
    print(f"\nWrote {FRAMEWORK_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
