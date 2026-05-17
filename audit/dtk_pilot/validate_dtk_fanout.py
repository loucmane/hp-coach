"""Post-fanout validation for DTK Option C explanations.

Run after the 27-agent fan-out completes. For every parsed DTK question,
checks that:

  1. An explanation entry exists in data/explanations/{exam}.json
  2. Schema is complete (_meta, distractors, steps, etc.)
  3. The Option C facit-anchoring is visible somewhere in the text
     (i.e., the facit-indicated option's text or value appears in the
     solution_path or the final step).
  4. Step count ≥ 10 (Variant-C ultra-granular floor).
  5. Distractor count == 3.
  6. pregrade_tactic has {handle, move} shape.

Outputs a report listing any failures by qid + reason. Pass rate, missing
qids, and which exams need a re-run.

Usage:
    python3 audit/dtk_pilot/validate_dtk_fanout.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
EXPLANATIONS_DIR = REPO_ROOT / "data" / "explanations"
SPA_DATA = REPO_ROOT / "app" / "public" / "data"

REQUIRED_FIELDS = {
    "_meta",
    "distractors",
    "framework_id",
    "pitfall",
    "pregrade_tactic",
    "solution_path",
    "steps",
    "technique",
}


def validate_explanation(qid: str, payload: dict, facit_letter: str, facit_text: str) -> list[str]:
    """Return a list of validation failures (empty = clean)."""
    fails: list[str] = []

    missing = REQUIRED_FIELDS - set(payload.keys())
    if missing:
        fails.append(f"missing fields: {sorted(missing)}")
        return fails  # short-circuit; the rest will spam

    if not isinstance(payload.get("steps"), list) or len(payload["steps"]) < 10:
        n = len(payload.get("steps", []))
        fails.append(f"steps count {n} < 10 (Variant-C floor)")

    distractors = payload.get("distractors", [])
    if not isinstance(distractors, list) or len(distractors) != 3:
        fails.append(f"distractors count {len(distractors)} != 3")
    else:
        letters = sorted(d.get("letter") for d in distractors)
        expected_letters = sorted(set("ABCD") - {facit_letter})
        if letters != expected_letters:
            fails.append(f"distractor letters {letters} != expected {expected_letters}")

    pg = payload.get("pregrade_tactic")
    if not isinstance(pg, dict) or "handle" not in pg or "move" not in pg:
        fails.append(f"pregrade_tactic malformed: {pg!r}"[:120])

    # Option C facit-anchoring heuristic: the facit option's text (or a
    # significant fragment of it) should appear somewhere in solution_path
    # or the last step. We accept any of: the letter ("A"), the option
    # text first 12 chars, or a tag like "facit" / "Facit" anywhere.
    sol = (payload.get("solution_path") or "").lower()
    last_step_text = ""
    if payload.get("steps"):
        last_step_text = (payload["steps"][-1].get("text") or "").lower()
    blob = f"{sol}\n{last_step_text}"
    facit_short = facit_text[:12].lower().strip()
    has_facit_word = "facit" in blob
    has_facit_text = facit_short and facit_short in blob
    if not (has_facit_word or has_facit_text):
        fails.append(
            f"no facit anchoring found in solution_path or last step "
            f"(expected 'facit' or '{facit_short[:8]}...')"
        )

    return fails


def find_dtk_questions(exam_path: Path) -> list[dict]:
    bank = json.loads(exam_path.read_text())
    out: list[dict] = []
    for q in bank:
        if q.get("section") != "DTK":
            continue
        if q.get("parsing_status") != "complete":
            continue
        if not q.get("options"):
            continue
        out.append(q)
    return out


def main() -> int:
    if not EXPLANATIONS_DIR.is_dir():
        print(f"Missing: {EXPLANATIONS_DIR}", file=sys.stderr)
        return 2

    exam_files = sorted(p for p in SPA_DATA.glob("*.json") if not p.name.startswith("_"))

    total_dtk = 0
    total_missing = 0
    total_failed = 0
    by_exam: dict[str, dict[str, int]] = {}
    failures: list[tuple[str, str, list[str]]] = []
    missing_by_exam: dict[str, list[str]] = {}

    for exam_path in exam_files:
        exam_id = exam_path.stem
        questions = find_dtk_questions(exam_path)
        if not questions:
            continue
        explanations_path = EXPLANATIONS_DIR / f"{exam_id}.json"
        if not explanations_path.exists():
            print(f"[{exam_id}] no explanations file — all {len(questions)} DTK missing")
            total_missing += len(questions)
            missing_by_exam[exam_id] = [q["qid"] for q in questions]
            continue
        explanations = json.loads(explanations_path.read_text())

        exam_total = 0
        exam_missing = 0
        exam_failed = 0
        exam_missing_qids: list[str] = []
        for q in questions:
            exam_total += 1
            qid = q["qid"]
            ans_letter = q.get("answer", "")
            ans_text = ""
            for opt in q.get("options", []):
                if opt.get("letter") == ans_letter:
                    ans_text = opt.get("text") or ""
                    break
            payload = explanations.get(qid)
            if payload is None:
                exam_missing += 1
                exam_missing_qids.append(qid)
                continue
            fails = validate_explanation(qid, payload, ans_letter, ans_text)
            if fails:
                exam_failed += 1
                failures.append((exam_id, qid, fails))
        by_exam[exam_id] = {
            "total": exam_total,
            "missing": exam_missing,
            "failed": exam_failed,
        }
        if exam_missing_qids:
            missing_by_exam[exam_id] = exam_missing_qids
        total_dtk += exam_total
        total_missing += exam_missing
        total_failed += exam_failed

    print(f"\n{'=' * 60}")
    print(f"DTK fan-out validation report")
    print(f"{'=' * 60}")
    print(f"Total parsed DTK qids: {total_dtk}")
    print(f"Missing explanations:  {total_missing}")
    print(f"Schema/anchor fails:   {total_failed}")
    print(
        f"Clean:                 {total_dtk - total_missing - total_failed} "
        f"({(total_dtk - total_missing - total_failed) / max(total_dtk, 1):.1%})"
    )

    print(f"\nPer-exam summary:")
    for exam_id in sorted(by_exam):
        s = by_exam[exam_id]
        status = "OK" if s["missing"] == 0 and s["failed"] == 0 else "ATTN"
        print(
            f"  [{status}] {exam_id}: {s['total']} DTK · "
            f"missing {s['missing']} · failed {s['failed']}"
        )

    if missing_by_exam:
        print(f"\nMissing qids (need re-run):")
        for exam_id, qids in sorted(missing_by_exam.items()):
            print(f"  {exam_id}: {len(qids)} missing")
            for qid in qids[:6]:
                print(f"    {qid}")
            if len(qids) > 6:
                print(f"    ... and {len(qids) - 6} more")

    if failures:
        print(f"\nValidation failures (first 30):")
        for exam_id, qid, fails in failures[:30]:
            print(f"  [{exam_id}] {qid}")
            for f in fails:
                print(f"      · {f}")
        if len(failures) > 30:
            print(f"  ... and {len(failures) - 30} more")

    return 0 if (total_missing + total_failed) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
