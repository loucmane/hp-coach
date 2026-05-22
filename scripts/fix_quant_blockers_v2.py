#!/usr/bin/env python3
"""Pass-3 quant blocker fixes — the 5 questions deferred from PR #70.

Each was confirmed via pdfplumber render + visual inspection (PNGs in
/tmp/qblockers/). Corpus answer letter used as ground truth for
verifying reconstructed math.

1. host-2024-kvant1-XYZ-002 — `√3·x = 6`, answer C = 2√3. Was
   parsing_status: "answer_only" with null prompt/options.

2. var-2026-kvant1-XYZ-012 — `(2√3)/(3√2) = √(2/3)`, answer C. Prior
   prompt `Vilket svarsalternativ motsvarar ? 3 2` and option C
   `\\frac{2}{3}` rewritten to surd form.

3. host-2020-kvant1-KVA-015 — Rectangle ABCE 4×2 cm, D = midpoint of
   CE. Compare angle v (at D between DA and DB) with 90°. Vectors DA
   and DB are perpendicular → v = 90°. Answer C. Prompt fragment +
   duplicate-D bug fixed.

4. host-2020-kvant2-KVA-015 — Two stacked fractions. I: (1/6)/(6/1) =
   1/36. II: (6/1)/(1/6) = 36. Answer B. Replaces the garbled
   `\\frac{6}{1} \\frac{6}{1}`.

5. host-2017-kvant1-KVA-018 — `x/3 - y/3 < 372/12` (i.e. x-y < 93).
   Doesn't constrain ordering of x and y. Answer D (otillräcklig).
   Replaces the garbled prompt.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

E0 = ""
E1 = ""


def m(latex: str) -> str:
    return f"{E0}{latex}{E1}"


# ── Fixes ──────────────────────────────────────────────────────────

# host-2024-kvant1-XYZ-002
XYZ_002_NEW_PROMPT = f"{m('\\sqrt{3} \\cdot x = 6')}  Vilket värde har x?"
XYZ_002_NEW_OPTIONS = [
    {"letter": "A", "text": "2"},
    {"letter": "B", "text": m("3\\sqrt{2}")},
    {"letter": "C", "text": m("2\\sqrt{3}")},
    {"letter": "D", "text": "4"},
]
XYZ_002_SOLUTION = (
    "Vi har ekvationen "
    + m("\\sqrt{3} \\cdot x = 6")
    + " och söker x.\n\n"
    + "Dela båda sidor med "
    + m("\\sqrt{3}")
    + ": x = 6 / "
    + m("\\sqrt{3}")
    + ". Förläng med "
    + m("\\sqrt{3}")
    + ": x = "
    + m("6\\sqrt{3} / 3 = 2\\sqrt{3}")
    + ".\n\n"
    + "Svaret är C."
)

# var-2026-kvant1-XYZ-012
XYZ_012_NEW_PROMPT = f"Vilket svarsalternativ motsvarar {m('\\frac{2\\sqrt{3}}{3\\sqrt{2}}')}?"
XYZ_012_NEW_OPTIONS = [
    {"letter": "A", "text": "1"},
    {"letter": "B", "text": m("\\frac{\\sqrt{3}}{6}")},
    {"letter": "C", "text": m("\\sqrt{\\frac{2}{3}}")},
    {"letter": "D", "text": m("\\sqrt{\\frac{3}{2}}")},
]
XYZ_012_SOLUTION = (
    "Vi förenklar "
    + m("\\frac{2\\sqrt{3}}{3\\sqrt{2}}")
    + ". Kvadrera först: "
    + m("\\left(\\frac{2\\sqrt{3}}{3\\sqrt{2}}\\right)^{2} = \\frac{4 \\cdot 3}{9 \\cdot 2} = \\frac{12}{18} = \\frac{2}{3}")
    + ".\n\n"
    + "Roten ur "
    + m("\\frac{2}{3}")
    + " är alltså värdet vi söker: "
    + m("\\sqrt{\\frac{2}{3}}")
    + ".\n\n"
    + "Svaret är C."
)

# host-2020-kvant1-KVA-015
KVA_015_K1_NEW_PROMPT = (
    "Fyrhörningen ABCE är en rektangel där AB = 4 cm och BC = 2 cm. "
    "D är mittpunkten på sträckan CE. "
    "v är vinkeln vid D mellan DA och DB.  "
    "Kvantitet I: v  Kvantitet II: 90°"
)
KVA_015_K1_NEW_OPTIONS = [
    {"letter": "A", "text": "I är större än II"},
    {"letter": "B", "text": "II är större än I"},
    {"letter": "C", "text": "I är lika med II"},
    {"letter": "D", "text": "informationen är otillräcklig"},
]
KVA_015_K1_SOLUTION = (
    "Sätt koordinater: A=(0,0), B=(4,0), C=(4,2), E=(0,2). "
    "D är mittpunkten på CE, alltså D=(2,2).\n\n"
    "Vektorn från D till A är (−2,−2) och från D till B är (2,−2). "
    "Skalärprodukten: (−2)·2 + (−2)·(−2) = −4 + 4 = 0.\n\n"
    "Skalärprodukten är noll precis när vektorerna är vinkelräta, så v = 90°.\n\n"
    "Kvantitet I = Kvantitet II. Svaret är C."
)

# host-2020-kvant2-KVA-015
KVA_015_K2_NEW_PROMPT = (
    "Kvantitet I: "
    + m("\\dfrac{\\frac{1}{6}}{\\frac{6}{1}}")
    + "  Kvantitet II: "
    + m("\\dfrac{\\frac{6}{1}}{\\frac{1}{6}}")
)
KVA_015_K2_NEW_OPTIONS = [
    {"letter": "A", "text": "I är större än II"},
    {"letter": "B", "text": "II är större än I"},
    {"letter": "C", "text": "I är lika med II"},
    {"letter": "D", "text": "informationen är otillräcklig"},
]
KVA_015_K2_SOLUTION = (
    "Kvantitet I är "
    + m("\\frac{1/6}{6/1}")
    + " = "
    + m("\\frac{1}{6} \\cdot \\frac{1}{6} = \\frac{1}{36}")
    + " ≈ 0,028.\n\n"
    + "Kvantitet II är "
    + m("\\frac{6/1}{1/6}")
    + " = "
    + m("6 \\cdot 6 = 36")
    + ".\n\n"
    + "Kvantitet II är mycket större (36 mot 1/36). Svaret är B."
)

# host-2017-kvant1-KVA-018
KVA_018_NEW_PROMPT = f"{m('\\dfrac{x}{3} - \\dfrac{y}{3} < \\dfrac{372}{12}')}  Kvantitet I: x  Kvantitet II: y"
KVA_018_NEW_OPTIONS = [
    {"letter": "A", "text": "I är större än II"},
    {"letter": "B", "text": "II är större än I"},
    {"letter": "C", "text": "I är lika med II"},
    {"letter": "D", "text": "informationen är otillräcklig"},
]
KVA_018_SOLUTION = (
    "Förenkla olikheten: multiplicera båda sidor med 3 så blir "
    + m("x - y < 3 \\cdot \\frac{372}{12} = \\frac{372}{4} = 93")
    + ". Det säger bara att x − y < 93, inte vilket av x och y som är störst.\n\n"
    "Konkret motexempel: x=10, y=5 ger x − y = 5 < 93 (uppfyllt) och då är I större. "
    "Men x=−10, y=5 ger x − y = −15 < 93 (också uppfyllt) och då är II större. "
    "Båda fallen passar, så informationen räcker inte.\n\n"
    "Svaret är D."
)


# (qid, exam, prompt, options, solution_path)
FIXES = [
    ("host-2024-kvant1-XYZ-002", "host-2024",
     XYZ_002_NEW_PROMPT, XYZ_002_NEW_OPTIONS, XYZ_002_SOLUTION),
    ("var-2026-kvant1-XYZ-012", "var-2026",
     XYZ_012_NEW_PROMPT, XYZ_012_NEW_OPTIONS, XYZ_012_SOLUTION),
    ("host-2020-kvant1-KVA-015", "host-2020",
     KVA_015_K1_NEW_PROMPT, KVA_015_K1_NEW_OPTIONS, KVA_015_K1_SOLUTION),
    ("host-2020-kvant2-KVA-015", "host-2020",
     KVA_015_K2_NEW_PROMPT, KVA_015_K2_NEW_OPTIONS, KVA_015_K2_SOLUTION),
    ("host-2017-kvant1-KVA-018", "host-2017",
     KVA_018_NEW_PROMPT, KVA_018_NEW_OPTIONS, KVA_018_SOLUTION),
]


def patch_data(dry_run: bool) -> int:
    touched = 0
    by_exam: dict[str, list] = {}
    for qid, exam, prompt, options, _ in FIXES:
        by_exam.setdefault(exam, []).append((qid, prompt, options))

    for exam, items in by_exam.items():
        for parent in [REPO_ROOT / "data" / "parsed",
                       REPO_ROOT / "app" / "public" / "data"]:
            path = parent / f"{exam}.json"
            if not path.exists():
                continue
            data = json.loads(path.read_text())
            changed = False
            for entry in data:
                qid = entry.get("qid")
                for fix_qid, prompt, options in items:
                    if qid != fix_qid:
                        continue
                    entry["prompt"] = prompt
                    entry["options"] = options
                    # Flip parsing_status to complete if it was answer_only
                    if entry.get("parsing_status") == "answer_only":
                        entry["parsing_status"] = "complete"
                    print(f"  {qid} patched in {parent.name}/{path.name}")
                    touched += 1
                    changed = True
            if changed and not dry_run:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return touched


def patch_explanations(dry_run: bool) -> int:
    touched = 0
    by_exam: dict[str, list] = {}
    for qid, exam, _, _, solution in FIXES:
        by_exam.setdefault(exam, []).append((qid, solution))

    for exam, items in by_exam.items():
        for parent in [REPO_ROOT / "data" / "explanations",
                       REPO_ROOT / "app" / "public" / "explanations"]:
            path = parent / f"{exam}.json"
            if not path.exists():
                continue
            data = json.loads(path.read_text())
            changed = False
            for qid, solution in items:
                entry = data.get(qid)
                if not entry:
                    # Create a minimal entry
                    entry = {
                        "_meta": {"generated_at": 0, "model": "manual-fix-v2"},
                        "framework_id": None,
                        "solution_path": solution,
                    }
                    data[qid] = entry
                    changed = True
                    print(f"  {qid}.explanation created in {parent.name}")
                    touched += 1
                    continue
                if entry.get("solution_path"):
                    # Already has one — replace only if it's null/empty
                    if entry["solution_path"]:
                        continue
                entry["solution_path"] = solution
                changed = True
                print(f"  {qid}.solution_path written in {parent.name}")
                touched += 1
            if changed and not dry_run:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return touched


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    print("Patching prompts + options...")
    n_data = patch_data(args.dry_run)
    print("\nPatching explanations...")
    n_expl = patch_explanations(args.dry_run)
    print(f"\nTotals: {n_data} data patches · {n_expl} explanation patches")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
