#!/usr/bin/env python3
"""Build per-batch task packets for the Variant-C regen wave.

Each packet contains the QUESTION (from data/parsed/) plus the
existing THIN explanation (from app/public/explanations/).
The subagent reads the packet, produces a v3 explanation, and
writes it back to a staging output file.

Batches are size-capped (~22 per batch) and section-homogenous
when possible (same prompt template). Output:
  audit/_variant_c_regen/batch_NN_<section>.json
"""
from __future__ import annotations
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path("/home/loucmane/dev/hpfetcher")
PARSED_DIR = ROOT / "data" / "parsed"
EXPL_DIR = ROOT / "app" / "public" / "explanations"
OUT_DIR = ROOT / "audit" / "_variant_c_regen"


def load_questions_index() -> dict:
    idx: dict[str, dict] = {}
    for path in sorted(PARSED_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        d = json.loads(path.read_text())
        if isinstance(d, dict):
            d = d.get("questions", [])
        for q in d:
            if isinstance(q, dict) and q.get("qid"):
                idx[q["qid"]] = q
    return idx


def section_of(qid: str) -> str:
    for p in qid.split("-"):
        if p in ("XYZ","KVA","NOG","DTK","ORD","LÄS","MEK","ELF"):
            return p
    return "?"


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    questions = load_questions_index()

    explanations_by_exam: dict[str, dict] = {}
    for path in sorted(EXPL_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        explanations_by_exam[path.stem] = json.loads(path.read_text())

    thin = []
    for exam, exam_data in explanations_by_exam.items():
        for qid, entry in exam_data.items():
            if not entry.get("steps") and not entry.get("pregrade_tactic"):
                q = questions.get(qid)
                if q is None:
                    print(f"  WARN: no parsed question for {qid}")
                    continue
                thin.append((exam, qid, entry, q))

    print(f"Found {len(thin)} thin entries with parsed questions")

    by_section: dict[str, list] = defaultdict(list)
    for t in thin:
        by_section[section_of(t[1])].append(t)

    BATCH_SIZE = 22
    batch_num = 0
    for section, items in sorted(by_section.items()):
        items.sort(key=lambda x: x[1])
        for i in range(0, len(items), BATCH_SIZE):
            batch_num += 1
            chunk = items[i:i + BATCH_SIZE]
            packet = {
                "batch_id": f"batch_{batch_num:02d}_{section}",
                "section": section,
                "count": len(chunk),
                "tasks": [
                    {
                        "exam": exam,
                        "qid": qid,
                        "question": q,
                        "thin_entry": thin_entry,
                    }
                    for exam, qid, thin_entry, q in chunk
                ],
            }
            out_path = OUT_DIR / f"batch_{batch_num:02d}_{section}.json"
            out_path.write_text(json.dumps(packet, ensure_ascii=False, indent=2))
            print(f"  wrote {out_path.name}: {len(chunk)} tasks")

    print(f"\nTotal batches: {batch_num}")


if __name__ == "__main__":
    main()
