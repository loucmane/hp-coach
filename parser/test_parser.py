#!/usr/bin/env python3
"""
Smoke tests for the parser MVP. Run with:
    python3 -m pytest parser/test_parser.py
or just `python3 parser/test_parser.py` (asserts in __main__).

These tests assume var-2026 PDFs are present at data/pdfs/var-2026/
(via `python3 parser/fetch_pdfs.py var-2026`). They run against real
PDFs because layout regressions only show up against the real bytes;
synthetic fixtures would defeat the purpose.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "parsed" / "var-2026.json"


def test_dataset_built():
    """build.py must have been run on var-2026 before this test executes."""
    assert OUT.exists(), f"Run `python3 parser/build.py var-2026` first ({OUT})"


def test_total_question_count():
    data = json.loads(OUT.read_text(encoding="utf-8"))
    assert len(data) == 160, f"Expected 160 questions, got {len(data)}"


def test_every_question_has_answer():
    data = json.loads(OUT.read_text(encoding="utf-8"))
    for q in data:
        assert q["answer"] in {"A", "B", "C", "D", "E"}, q


def test_qids_unique_and_well_formed():
    data = json.loads(OUT.read_text(encoding="utf-8"))
    qids = [q["qid"] for q in data]
    assert len(set(qids)) == len(qids), "duplicate qid detected"
    for qid in qids:
        # var-2026-<provpass>-<SECTION>-NNN
        assert qid.startswith("var-2026-")
        parts = qid.split("-")
        assert len(parts) == 5
        assert parts[3] in {"ORD", "LÄS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"}
        assert parts[4].isdigit() and len(parts[4]) == 3


def test_ord_and_mek_fully_parsed():
    """Both ORD and MEK should have prompt + options for every question."""
    data = json.loads(OUT.read_text(encoding="utf-8"))
    for q in data:
        if q["section"] in {"ORD", "MEK"}:
            assert q["parsing_status"] == "complete", q["qid"]
            assert q["prompt"], q["qid"]
            assert q["options"], q["qid"]
            expected_opts = 5 if q["section"] == "ORD" else 4
            assert len(q["options"]) == expected_opts, (
                f"{q['qid']}: {len(q['options'])} options, expected {expected_opts}"
            )
            letters = [o["letter"] for o in q["options"]]
            assert letters == ["A", "B", "C", "D", "E"][:expected_opts], q["qid"]


def test_known_ord_answer():
    """Pin a single known-good (Q→answer→option) tuple to catch silent shuffles."""
    data = json.loads(OUT.read_text(encoding="utf-8"))
    q = next(x for x in data if x["qid"] == "var-2026-verb1-ORD-001")
    assert q["prompt"] == "prognos"
    assert q["answer"] == "D"
    assert next(o["text"] for o in q["options"] if o["letter"] == "D") == "förutsägelse"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"  ✓ {name}")
    print("all tests passed")
