"""Generate deterministic lesson leverage from the local authentic corpus.

Run from any directory: python3 pipeline/frameworks/leverage.py [--check]
No network, model calls, timestamps, or changes to catalog/exam inventories.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSET = Path("app/public/leverage/framework_leverage.json")
AUTHENTIC_QID = re.compile(r"^(?:host|var)-.+-(\d+)$")


def generate(root: Path = ROOT) -> dict:
    """One record per catalog id; duplicate qids count only once per id."""
    catalogs = [
        json.loads(path.read_text(encoding="utf-8"))
        for path in sorted((root / "frameworks").glob("*.json"))
        if path.name != "framework_prereqs.json"
    ]
    entries = {
        entry["id"]: {"coverage": 0, "position": None}
        for catalog in catalogs
        for entry in catalog["entries"]
    }
    questions: dict[str, dict[str, int]] = {entry_id: {} for entry_id in entries}
    for path in sorted((root / "data/explanations").glob("*.json")):
        if path.name.startswith(("_", "p5-")):
            continue
        for qid, explanation in json.loads(path.read_text(encoding="utf-8")).items():
            entry_id = explanation.get("framework_id")
            match = AUTHENTIC_QID.fullmatch(qid)
            if entry_id in questions and match:
                questions[entry_id][qid] = int(match.group(1))
    for entry_id, positions in questions.items():
        if positions:
            entries[entry_id] = {
                "coverage": len(positions),
                "position": sum(positions.values()) / len(positions),
            }
    for catalog in catalogs:
        if catalog["section"] == "ORD":
            for entry in catalog["entries"]:
                entries[entry["id"]] = {
                    "coverage": entry.get("corpus_frequency", 0),
                    "position": None,
                }
    return {
        "version": 1,
        "generated_from": (
            "frameworks/*.json; distinct authentic qids tagged by framework_id in "
            "data/explanations/*.json (excluding _* and p5-*); position is the mean "
            "qid question number; ORD coverage uses ord_roots.json corpus_frequency"
        ),
        "entries": dict(sorted(entries.items())),
    }


def render(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if the committed asset is stale")
    args = parser.parse_args(argv)
    expected = render(generate())
    target = ROOT / ASSET
    if args.check:
        if not target.exists() or target.read_text(encoding="utf-8") != expected:
            print(f"Stale or missing {ASSET}; run python3 pipeline/frameworks/leverage.py")
            return 1
        print(f"{ASSET} is up to date")
        return 0
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(expected, encoding="utf-8")
    print(f"Wrote {ASSET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
