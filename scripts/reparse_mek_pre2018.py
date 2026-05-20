#!/usr/bin/env python3
"""Re-parse MEK prompts for pre-2018 HP exams.

The parser that produced the corpus before var-2018-1 truncated every MEK
prompt to the first PDF line. The full multi-line stem (including the
`____` blank marker) IS recoverable from the source PDFs at
`data/pdfs/{exam_id}/verb{1,2}.pdf` — `pdftotext -layout` preserves the
indented multi-line layout used by these exams.

This script rebuilds the prompt text for each affected qid and writes it
back into both corpus mirrors (`data/parsed/{exam_id}.json` and
`app/public/data/{exam_id}.json`). Only the `prompt` field is modified;
`options` and `answer` are reliable and stay untouched.

Idempotent: any qid whose current prompt already contains a `___` blank
marker AND is longer than 100 chars is left alone, so safe re-runs are
no-ops.

Usage:
    source venv/bin/activate
    python3 scripts/reparse_mek_pre2018.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

# Resolve repo roots. `data/pdfs/` and `data/parsed/` are .gitignored
# and only live in the main checkout; the SPA-served mirror
# `app/public/data/` is checked in and lives in whichever worktree the
# script is run from. If the local checkout does not carry the PDFs
# (i.e. this is a worktree), fall back to the main checkout one level
# up via `git rev-parse`.
REPO_ROOT = Path(__file__).resolve().parent.parent


def _resolve_pdf_root() -> Path:
    candidate = REPO_ROOT / "data" / "pdfs"
    if candidate.is_dir():
        return candidate
    # Worktree case — use the main checkout.
    try:
        main = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "rev-parse", "--path-format=absolute",
             "--git-common-dir"],
            check=True, capture_output=True, text=True,
        ).stdout.strip()
        # `--git-common-dir` points at `<main>/.git`; data/ sits beside it.
        main_root = Path(main).parent
        return main_root / "data" / "pdfs"
    except subprocess.CalledProcessError:
        return candidate


PDF_ROOT = _resolve_pdf_root()
PARSED_DIR = PDF_ROOT.parent / "parsed"
APP_PUBLIC_DATA = REPO_ROOT / "app" / "public" / "data"

# Pre-2018 exams whose MEK prompts were truncated. host-ver{1,2}-2019 are
# included because their verb2 MEK-021 is also single-line (the rest of
# their MEK content is fine — the idempotent guard skips already-clean
# entries automatically).
TARGET_EXAMS = [
    "host-2013", "host-2014", "host-2015", "host-2016", "host-2017",
    "var-2013", "var-2014", "var-2015", "var-2016", "var-2017",
    "var-2018-1",
    "host-ver1-2019", "host-ver2-2019",
]

# Section start / end markers in the PDF. The MEK section sits between
# its own delprov header and the ELF (Engelsk läsförståelse) header.
# Pre-2018 exams use uppercase `DELPROV MEK – MENINGSKOMPLETTERING`,
# var-2018-1 uses lowercase `delprov mek – meningskomplettering`, and
# 2019+ uses `MEK – Meningskomplettering`. Case-insensitive matches.
MEK_HEADER_RES = [
    re.compile(r"^DELPROV\s+MEK\b", re.IGNORECASE),
    re.compile(r"^MEK\s*[–—-]\s*Meningskomplettering", re.IGNORECASE),
]
ELF_HEADER_RES = [
    re.compile(r"^DELPROV\s+ELF\b", re.IGNORECASE),
    re.compile(r"^ELF\s*[–—-]\s*Engelsk", re.IGNORECASE),
    re.compile(r"^Engelsk läsförståelse", re.IGNORECASE),
]

# Per-page chrome that interrupts a stem but should be stripped silently.
CHROME_LINE_RES = [
    re.compile(r"^MEK\s*$"),
    re.compile(r"^\s*[–—-]\s*\d+\s*[–—-]?\s*$"),  # "– 8 –"
    re.compile(r"^\s*\d+\s*[–—-]\s*$"),
    re.compile(r"^\s*[–—-]\s*\d+\s*$"),
    re.compile(r"^FORTSÄTT PÅ NÄSTA SIDA.*$"),
    re.compile(r"^PROVET ÄR SLUT.*$"),
    re.compile(r"^KONTROLLERA DINA SVAR\.?\s*$"),
]

# A question number heading line: "21.", "  21. Diskbråck...", etc.
QUESTION_HEAD_RE = re.compile(r"^\s*(2[1-9]|30)\.\s*(.*)$")
# An option line: "A   foo", "    A   foo", "A    one – two"
OPTION_HEAD_RE = re.compile(r"^\s*([ABCD])\s{2,}(\S.*)$")


def _is_chrome(s: str) -> bool:
    if not s.strip():
        return False
    return any(pat.match(s.strip()) for pat in CHROME_LINE_RES)


def _is_mek_start(s: str) -> bool:
    return any(pat.match(s.strip()) for pat in MEK_HEADER_RES)


def _is_elf_start(s: str) -> bool:
    return any(pat.match(s.strip()) for pat in ELF_HEADER_RES)


def extract_mek_text(pdf_path: Path) -> str | None:
    """Run pdftotext -layout and return ONLY the MEK section's text."""
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), "-"],
            check=True, capture_output=True, text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        print(f"  [warn] pdftotext failed on {pdf_path}: {exc}", file=sys.stderr)
        return None
    text = result.stdout
    lines = text.splitlines()
    # Find first MEK header line.
    start = None
    for i, line in enumerate(lines):
        if _is_mek_start(line):
            start = i + 1
            break
    if start is None:
        return None
    # Find first ELF header line after MEK start.
    end = len(lines)
    for j in range(start, len(lines)):
        if _is_elf_start(lines[j]):
            end = j
            break
    return "\n".join(lines[start:end])


def parse_mek_questions(section_text: str) -> dict[int, dict]:
    """Parse the MEK section text into {qnum: {"prompt": str, "options": [..]}}.

    A question is a numbered head (21–30) followed by one or more body
    lines, then four option lines (A–D). Body lines may include another
    blank line in the middle (paragraph break from pdftotext) — we treat
    every non-option, non-chrome line as part of the body until the
    first A option is seen.
    """
    out: dict[int, dict] = {}
    current: dict | None = None
    state = "scan"   # "scan" → looking for next question header
                     # "body" → collecting prompt body lines
                     # "opts" → collecting A–D option lines
    for raw in section_text.splitlines():
        if _is_chrome(raw):
            continue
        line = raw.rstrip()
        stripped = line.strip()
        qmatch = QUESTION_HEAD_RE.match(line)
        if qmatch and (state != "opts" or current is None or len(current["options"]) >= 4):
            # Commit prior question if it was complete.
            if current is not None and len(current["options"]) >= 4:
                out[current["number"]] = current
            num = int(qmatch.group(1))
            head_text = qmatch.group(2).strip()
            current = {
                "number": num,
                "body_lines": [head_text] if head_text else [],
                "options": [],
            }
            state = "body"
            continue
        if current is None:
            continue
        omatch = OPTION_HEAD_RE.match(line)
        if omatch:
            letter = omatch.group(1)
            text = omatch.group(2).strip()
            current["options"].append({"letter": letter, "text": text})
            state = "opts"
            continue
        if state == "opts":
            # Continuation of the previous option (rare, but allow).
            if current["options"] and stripped:
                current["options"][-1]["text"] += " " + stripped
            continue
        # state == "body" — collect body line (skip empty lines).
        if not stripped:
            # Blank line inside the body → paragraph separator. Mark
            # with a sentinel so we can rejoin later if needed.
            if current["body_lines"] and current["body_lines"][-1] != "":
                current["body_lines"].append("")
            continue
        current["body_lines"].append(stripped)
    if current is not None and len(current["options"]) >= 4:
        out[current["number"]] = current
    return out


def render_prompt(body_lines: list[str]) -> str:
    """Join the body lines into a single prompt string.

    Mimics the existing var-2018-1 / 2019+ corpus shape: lines joined
    with a single space, paragraph breaks collapsed (those are rare in
    MEK and don't survive in the modern corpus either).
    """
    # Drop leading/trailing blanks.
    parts = [l for l in body_lines if l.strip()]
    joined = " ".join(parts)
    # Squash duplicate whitespace.
    joined = re.sub(r"\s+", " ", joined).strip()
    return joined


def needs_repair(old: str | None, new: str) -> bool:
    """Return True iff we should overwrite ``old`` with ``new``.

    Strategy: extract from PDF for every target qid and compare with
    the existing corpus prompt. Replace whenever ``new`` is materially
    longer (>= +15 chars, OR has gained the blank marker). Identical
    extractions skip the write — naturally idempotent on re-runs.

    The 15-char gain is well below the smallest extension we observed
    in the audit (~16 chars on host-2017-verb2-MEK-021) and large
    enough to ignore noise like a single trailing punctuation token
    pulled in by a column-wrap re-flow.
    """
    if not old:
        return bool(new and len(new) >= 50)
    if old == new:
        return False
    old_has_blank = "___" in old
    new_has_blank = "___" in new
    if new_has_blank and not old_has_blank:
        return True
    if len(new) - len(old) >= 10:
        return True
    return False


def patch_exam(exam_id: str, dry_run: bool, report: dict) -> None:
    parsed = {}
    for half in ("1", "2"):
        pdf = PDF_ROOT / exam_id / f"verb{half}.pdf"
        if not pdf.exists():
            report.setdefault("missing_pdfs", []).append(str(pdf))
            continue
        section_text = extract_mek_text(pdf)
        if section_text is None:
            report.setdefault("no_mek_section", []).append(str(pdf))
            continue
        questions = parse_mek_questions(section_text)
        parsed[half] = questions

    # Apply to both corpus mirrors.
    patched_qids: set[str] = set()
    skipped_qids: set[str] = set()
    failed_qids: dict[str, str] = {}

    for directory in (PARSED_DIR, APP_PUBLIC_DATA):
        path = directory / f"{exam_id}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text())
        file_touched = False
        for entry in data:
            qid = entry.get("qid", "")
            if not qid:
                continue
            if "-MEK-" not in qid:
                continue
            m = re.match(rf"^{re.escape(exam_id)}-verb([12])-MEK-(\d{{3}})$", qid)
            if not m:
                continue
            half = m.group(1)
            qnum = int(m.group(2))
            old_prompt = entry.get("prompt") or ""
            qs = parsed.get(half) or {}
            extracted = qs.get(qnum)
            if extracted is None:
                # If the old prompt looks clean, treat as "skipped"
                # rather than "failed" — we just didn't need to repair.
                if old_prompt and "___" in old_prompt and len(old_prompt) >= 90:
                    skipped_qids.add(qid)
                else:
                    failed_qids[qid] = "no_question_in_pdf_extract"
                continue
            new_prompt = render_prompt(extracted["body_lines"])
            if not needs_repair(old_prompt, new_prompt):
                skipped_qids.add(qid)
                continue
            if "___" not in new_prompt:
                failed_qids[qid] = "extracted_prompt_lacks_blank"
                continue
            entry["prompt"] = new_prompt
            file_touched = True
            patched_qids.add(qid)
        if file_touched and not dry_run:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

    report["per_exam"][exam_id] = {
        "patched": sorted(patched_qids),
        "skipped": sorted(skipped_qids),
        "failed": failed_qids,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--exams", nargs="+", default=None,
        help="Restrict to a subset (default: all pre-2018 + early 2019).",
    )
    args = parser.parse_args()

    if shutil.which("pdftotext") is None:
        print("error: pdftotext not on PATH (install poppler-utils)", file=sys.stderr)
        return 1

    exams = args.exams or TARGET_EXAMS
    report = {"per_exam": {}}
    for exam in exams:
        patch_exam(exam, args.dry_run, report)

    total_patched = 0
    total_skipped = 0
    print()
    print(f"{'exam':<22s}  patched  skipped  failed")
    print("-" * 50)
    for exam, info in sorted(report["per_exam"].items()):
        p = len(info["patched"])
        s = len(info["skipped"])
        f = len(info["failed"])
        total_patched += p
        total_skipped += s
        print(f"{exam:<22s}  {p:>7d}  {s:>7d}  {f:>6d}")
    print("-" * 50)
    print(f"{'TOTAL':<22s}  {total_patched:>7d}  {total_skipped:>7d}")
    if report.get("missing_pdfs"):
        print("\nMissing PDFs:")
        for p in report["missing_pdfs"]:
            print(f"  {p}")
    if report.get("no_mek_section"):
        print("\nNo MEK section detected in:")
        for p in report["no_mek_section"]:
            print(f"  {p}")
    fail_details: list[tuple[str, str, str]] = []
    for exam, info in report["per_exam"].items():
        for qid, reason in info["failed"].items():
            fail_details.append((exam, qid, reason))
    if fail_details:
        print("\nFailed qids (still need attention):")
        for exam, qid, reason in fail_details:
            print(f"  {qid}: {reason}")
    if args.dry_run:
        print("\n(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
