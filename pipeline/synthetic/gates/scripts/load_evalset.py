#!/usr/bin/env python3
"""Materialise the eval set into candidate-item JSON for a gate run.

Authentic items are loaded from the question bank at runtime and adapted into
the candidate-item shape (they are NOT stored in the repo — UHR copyright).
Seeded-defect items are read from seeded/*.json with their `_seed` block
STRIPPED (gate agents must never see it).

Usage:
    python3 load_evalset.py --out-dir /tmp/evalrun [--parsed-dir data/parsed] [--keep-seed]

Writes one <candidate_id>.json per item plus expectations.json (the answer
key for scoring the eval: candidate_id -> {expected, intended_kill_gate,
authentic_answer}). The gate stack runs against --out-dir exactly like a real
batch; score with score_eval.py.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

GATES_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = Path(__file__).resolve().parents[4]


def load_bank(parsed_dir: Path) -> dict:
    bank = {}
    for f in sorted(parsed_dir.glob("*.json")):
        if f.name.startswith("_"):
            continue
        for q in json.loads(f.read_text(encoding="utf-8")):
            bank[q["qid"]] = q
    return bank


def authentic_to_candidate(q: dict, idx: int) -> dict:
    """Adapt an authentic bank item into the candidate-item schema.

    The intended key is INCLUDED (as key). For G-KEY the orchestrator withholds
    it just as it does for synthetic candidates — the eval must exercise the
    identical dispatch path, so authentic items carry their real answer and the
    same stripping logic applies at dispatch time, not here.
    """
    sec = q["section"]
    prefix = "las" if sec == "LÄS" else "elf"
    # batch "b00" reserved for eval-authentic so ids satisfy the schema pattern
    # and never collide with seeded ids (which use b0).
    return {
        "candidate_id": f"{prefix}-b00-{idx:03d}",
        "section": sec,
        "family": "evalset-authentic",
        "title": (q.get("context", "").strip().split("\n", 1)[0] or q["qid"])[:120],
        "passage": q.get("context", ""),
        "questions": [{
            "q_index": 1,
            "prompt": q["prompt"],
            "options": [{"letter": o["letter"], "text": o["text"]} for o in q["options"]],
            "key": q["answer"],
        }],
        "generator_meta": {"source_qid": q["qid"], "origin": "authentic-bank"},
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out-dir", type=Path, required=True)
    ap.add_argument("--parsed-dir", type=Path, default=REPO_ROOT / "data" / "parsed")
    ap.add_argument("--keep-seed", action="store_true",
                    help="DEBUG ONLY: keep _seed blocks. Never use for a real gate run.")
    args = ap.parse_args(argv)

    manifest = json.loads((GATES_DIR / "evalset" / "manifest.json").read_text(encoding="utf-8"))
    args.out_dir.mkdir(parents=True, exist_ok=True)
    bank = load_bank(args.parsed_dir)
    expectations = {}

    idx = 0
    for sec in ("LÄS", "ELF"):
        for qid in manifest["authentic_pass"][sec]:
            if qid not in bank:
                raise SystemExit(f"authentic qid not in bank: {qid}")
            cand = authentic_to_candidate(bank[qid], idx)
            (args.out_dir / f"{cand['candidate_id']}.json").write_text(
                json.dumps(cand, ensure_ascii=False, indent=2), encoding="utf-8")
            expectations[cand["candidate_id"]] = {
                "kind": "authentic", "expected": "SURVIVED",
                "intended_kill_gate": None, "source_qid": qid,
                "authentic_answer": bank[qid]["answer"],
            }
            idx += 1

    for item in manifest["seeded_defects"]["items"]:
        cid = item["candidate_id"]
        cand = json.loads((GATES_DIR / "evalset" / "seeded" / f"{cid}.json").read_text(encoding="utf-8"))
        seed = cand.get("_seed", {})
        if not args.keep_seed:
            cand.pop("_seed", None)
        (args.out_dir / f"{cid}.json").write_text(
            json.dumps(cand, ensure_ascii=False, indent=2), encoding="utf-8")
        expectations[cid] = {
            "kind": "seeded",
            "expected": "DEAD" if item["expected"] == "kill" else "SURVIVED",
            "intended_kill_gate": item["intended_kill_gate"],
            "secondary": item.get("secondary"),
            "defect": seed.get("defect"),
        }

    (args.out_dir / "expectations.json").write_text(
        json.dumps(expectations, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {idx} authentic + {len(manifest['seeded_defects']['items'])} seeded items to {args.out_dir}")
    print(f"expectations.json written ({len(expectations)} entries)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
