#!/usr/bin/env python3
"""
Build data/parsed/{exam_id}.json for every exam in CATALOG.

Pulls PDFs (idempotent — already-cached files are skipped) and parses
them through the same per-exam pipeline as build.py. Per-exam failures
are caught and reported in the summary; the rest of the run continues.

Also writes data/parsed/_index.json — a manifest of successfully-built
exams + their per-section coverage. The SPA can use it to know which
exams are available without scanning the filesystem.

CLI:
  python3 parser/build_all.py              # all 27 exams, skip already-built
  python3 parser/build_all.py --force      # rebuild every exam from scratch
  python3 parser/build_all.py var-2026 ... # subset
"""
from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bygg_hp_databas import CATALOG  # type: ignore  # noqa: E402

from parser.build import OUT_ROOT, build  # noqa: E402
from parser.fetch_pdfs import fetch  # noqa: E402

INDEX_PATH = OUT_ROOT / "_index.json"


def _resolve_targets(args: list[str]) -> tuple[list[str], bool]:
    """Returns (exam_ids, force_rebuild)."""
    force = "--force" in args
    explicit = [a for a in args if not a.startswith("-")]
    targets = explicit if explicit else list(CATALOG.keys())
    return targets, force


def main() -> None:
    targets, force = _resolve_targets(sys.argv[1:])
    print(f"== building {len(targets)} exam(s) {'(forced)' if force else ''} ==\n")

    successes: list[dict] = []
    failures: list[tuple[str, str]] = []

    for i, exam_id in enumerate(targets, 1):
        print(f"[{i:>2}/{len(targets)}] {exam_id}")
        out_path = OUT_ROOT / f"{exam_id}.json"
        if out_path.exists() and not force:
            print(f"  skip — already built ({out_path.relative_to(ROOT)})")
            # Still record it in the index so the SPA sees it.
            try:
                rows = json.loads(out_path.read_text(encoding="utf-8"))
                by_section: dict[str, tuple[int, int]] = {}
                for q in rows:
                    done, tot = by_section.get(q["section"], (0, 0))
                    by_section[q["section"]] = (
                        done + (1 if q["parsing_status"] == "complete" else 0),
                        tot + 1,
                    )
                successes.append(
                    {
                        "exam_id": exam_id,
                        "out_path": str(out_path.relative_to(ROOT)),
                        "total": len(rows),
                        "with_answer": sum(1 for q in rows if q.get("answer")),
                        "complete": sum(
                            1 for q in rows if q.get("parsing_status") == "complete"
                        ),
                        "by_section": by_section,
                    }
                )
            except Exception as exc:  # corrupt JSON; force rebuild on next run
                print(f"  warn: failed to read existing JSON ({exc}); skipping index entry")
            continue

        try:
            fetch(exam_id)  # idempotent: already-downloaded PDFs are skipped
            stats = build(exam_id)
            successes.append(stats)
            print(
                f"  ✓ {stats['complete']}/{stats['total']} fully parsed, "
                f"{stats['with_answer']}/{stats['total']} keys"
            )
        except Exception as exc:
            failures.append((exam_id, str(exc)))
            print(f"  ✗ {exc}")
            if "--verbose" in sys.argv:
                traceback.print_exc()
        print()

    # Write the manifest. Drop tuple by_section to JSON-friendly format.
    INDEX_PATH.write_text(
        json.dumps(
            {
                "exams": [
                    {
                        **s,
                        "by_section": {k: list(v) for k, v in s["by_section"].items()},
                    }
                    for s in successes
                ],
                "failed": [{"exam_id": eid, "error": err} for eid, err in failures],
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    # Final summary
    total_q = sum(s["total"] for s in successes)
    total_complete = sum(s["complete"] for s in successes)
    total_keys = sum(s["with_answer"] for s in successes)

    print(f"== summary ==")
    print(f"  exams built:     {len(successes)} / {len(targets)}")
    if failures:
        print(f"  exams failed:    {len(failures)}")
        for eid, err in failures:
            print(f"    ✗ {eid}: {err.splitlines()[0][:100]}")
    print(f"  total questions: {total_q}")
    print(f"  fully parsed:    {total_complete}")
    print(f"  answer keys:     {total_keys}")
    print(f"  manifest:        {INDEX_PATH.relative_to(ROOT)}")

    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
