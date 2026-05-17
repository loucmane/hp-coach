"""Extract DTK question prompts + options from real HP PDFs.

The DTK question pages already have clean structured text from
PyMuPDF — no LLM transcription needed. Each question block is:

    29.\t Question prompt text...
    A\t Option A text
    B\t Option B text
    C\t Option C text
    D\t Option D text
    30.\t Next question prompt...
    ...

Both modern and pre-2019 exam formats use this layout (just with
different whitespace flavor: "29.\\n" vs "29.\\t"). One regex handles
both.

Output: rewrites the question bank JSON at app/public/data/{exam}.json
in place — populates `prompt`, `options`, `parsing_status: 'parsed'`
for every DTK entry whose qid is in the DTK figure index. The facit-
provided `answer` is preserved as-is.

Run:
    python3 parser/parse_dtk_prompts.py
    python3 parser/parse_dtk_prompts.py --exam host-2024  # one exam
    python3 parser/parse_dtk_prompts.py --dry-run         # no writes
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

REPO_ROOT = Path(__file__).resolve().parent.parent
PDF_ROOT = REPO_ROOT / "data" / "pdfs"
DATA_DIR = REPO_ROOT / "app" / "public" / "data"

# Question number: 2 digits + period + ANY whitespace (tab OR space-then-newline).
QUESTION_NUMBER = re.compile(r"(?:^|\n)(\d{2})\.[ \t\n]+", re.MULTILINE)
# Option marker: capital letter A-D after newline + optional leading
# whitespace (some old exams indent options with a leading tab:
# "\n\tA\t opt"), followed by tab or space. The leading-whitespace
# allowance handles both layouts in one regex.
OPTION_MARKER = re.compile(r"(?:^|\n)[ \t]*([A-D])[\t ]+", re.MULTILINE)
# Page-footer noise that sometimes follows the last option (always
# strip): "– 17 –", "Fortsätt på nästa sida »", etc.
FOOTER_NOISE = re.compile(
    r"(?:^|\n)(?:[–-]\s*\d+\s*[–-]|Fortsätt på nästa sida.*|DTK|Uppgifter)\s*$",
    re.MULTILINE,
)


def extract_dtk_questions_from_page(text: str) -> dict[int, dict]:
    """Parse one question page's text into {num: {prompt, options}}.

    Returns an empty dict if no question blocks recognized. The page
    text is segmented by question-number anchors; each block contains
    a prompt followed by exactly four option markers (A-D). Option
    text spans from its marker to the next marker.
    """
    matches = list(QUESTION_NUMBER.finditer(text))
    if not matches:
        return {}

    out: dict[int, dict] = {}
    for i, m in enumerate(matches):
        num = int(m.group(1))
        # DTK question numbers live in 29-40. Skip stray matches (page
        # numbers, table values, etc.).
        if num < 29 or num > 40:
            continue
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end]
        parsed = _parse_block(block)
        if parsed:
            out[num] = parsed
    return out


def _parse_block(block: str) -> dict | None:
    """A question block: prompt then 4 options. Returns dict or None."""
    opt_matches = list(OPTION_MARKER.finditer(block))
    if len(opt_matches) < 4:
        return None
    # Pick the FIRST four options. Trailing text after option D is
    # noise (page footer); strip it.
    first_four = opt_matches[:4]
    if [m.group(1) for m in first_four] != ["A", "B", "C", "D"]:
        return None
    prompt = _clean_text(block[: first_four[0].start()])
    options: list[dict] = []
    for i, m in enumerate(first_four):
        opt_start = m.end()
        opt_end = first_four[i + 1].start() if i + 1 < len(first_four) else len(block)
        opt_text = _clean_text(block[opt_start:opt_end])
        # Strip any trailing footer junk from the LAST option (D).
        if i == 3:
            opt_text = FOOTER_NOISE.sub("", opt_text).strip()
        options.append({"letter": m.group(1), "text": opt_text})
    if not prompt or any(not o["text"] for o in options):
        return None
    return {"prompt": prompt, "options": options}


def _clean_text(s: str) -> str:
    """Collapse whitespace, normalize hyphenation across linebreaks."""
    # PyMuPDF wraps long lines with `-\n` for syllable hyphenation.
    # "miljösanktions-\navgifter" → "miljösanktionsavgifter".
    s = re.sub(r"-\n(\w)", r"\1", s)
    # Tab + newline pairs flatten to single spaces.
    s = re.sub(r"[\t\n ]+", " ", s).strip()
    return s


def find_dtk_question_pages(doc: fitz.Document) -> list[int]:
    """Return 0-indexed page numbers for DTK question pages.

    Same classifier as parse_dtk_figures.py: a page is a question page
    iff it carries the DTK marker AND has at least one 29-40 prompt
    anchor in its text.
    """
    dtk_marker = re.compile(r"\bdtk\b", re.IGNORECASE)
    pages: list[int] = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if not dtk_marker.search(text):
            continue
        nums = [int(m.group(1)) for m in QUESTION_NUMBER.finditer(text)]
        if any(29 <= n <= 40 for n in nums):
            pages.append(i)
    return pages


def process_exam(exam_id: str, *, dry_run: bool) -> tuple[int, int]:
    """Update app/public/data/{exam_id}.json in place.

    Returns (updated_count, total_dtk_count) for this exam.
    """
    json_path = DATA_DIR / f"{exam_id}.json"
    if not json_path.exists():
        return (0, 0)
    bank = json.loads(json_path.read_text())

    # The bank is a flat array; index by qid for fast lookup.
    by_qid: dict[str, dict] = {q["qid"]: q for q in bank}
    dtk_qids = [q for q in bank if q.get("section") == "DTK"]
    if not dtk_qids:
        return (0, 0)

    updated = 0
    for provpass in ("kvant1", "kvant2"):
        pdf_path = PDF_ROOT / exam_id / f"{provpass}.pdf"
        if not pdf_path.exists():
            continue
        doc = fitz.open(pdf_path)
        for page_idx in find_dtk_question_pages(doc):
            parsed = extract_dtk_questions_from_page(doc[page_idx].get_text())
            for num, payload in parsed.items():
                qid = f"{exam_id}-{provpass}-DTK-{num:03d}"
                target = by_qid.get(qid)
                if not target:
                    continue
                target["prompt"] = payload["prompt"]
                target["options"] = payload["options"]
                target["parsing_status"] = "parsed"
                updated += 1

    if updated > 0 and not dry_run:
        json_path.write_text(json.dumps(bank, ensure_ascii=False, indent=2))
    return (updated, len(dtk_qids))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--exam", help="Process only this exam_id. Default: all.")
    parser.add_argument(
        "--dry-run", action="store_true", help="Parse and report without writing"
    )
    args = parser.parse_args()

    exam_dirs = sorted(p for p in PDF_ROOT.iterdir() if p.is_dir())
    if args.exam:
        exam_dirs = [p for p in exam_dirs if p.name == args.exam]
        if not exam_dirs:
            print(f"no such exam: {args.exam}", file=sys.stderr)
            return 2

    total_updated = 0
    total_dtk = 0
    failures: list[str] = []
    for exam_dir in exam_dirs:
        exam_id = exam_dir.name
        try:
            updated, dtk_count = process_exam(exam_id, dry_run=args.dry_run)
        except Exception as e:
            failures.append(f"{exam_id}: {e}")
            continue
        if dtk_count == 0:
            continue
        status = "OK" if updated == dtk_count else f"PARTIAL ({updated}/{dtk_count})"
        print(f"[{exam_id}] {updated}/{dtk_count} {status}")
        total_updated += updated
        total_dtk += dtk_count

    print(f"\nUpdated {total_updated}/{total_dtk} DTK qids across {len(exam_dirs)} exams")
    if failures:
        print(f"FAILURES: {len(failures)}")
        for f in failures:
            print(f"  {f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
