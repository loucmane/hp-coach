# parser/

Parses HP exam PDFs into a unified question bank for the drill engine.

## Pipeline

```
data/pdfs/{exam_id}/{facit,verb1,verb2,kvant1,kvant2}.pdf
        │
        ├── parse_facit.py          → answer key per provpass (layouts A + B)
        ├── parse_section.py        → ORD, MEK (others TODO)
        │
        ├── build.py                → data/parsed/{exam_id}.json   (one exam)
        └── build_all.py            → all 27 exams + manifest
```

Each PDF is downloaded once via `fetch_pdfs.py` (idempotent) and read
locally with PyMuPDF (`fitz`) — we don't rely on `hp_databas.json`'s
flat text dump because it loses column structure on multi-column pages
(ORD, KVA).

## Run

```bash
source venv/bin/activate
pip install pymupdf requests           # if missing
python3 parser/fetch_pdfs.py var-2026  # one exam
python3 parser/build.py     var-2026   # → data/parsed/var-2026.json
python3 parser/build_all.py            # all 27 exams + manifest
python3 parser/test_parser.py          # smoke tests
./app/scripts/sync-dataset.sh          # push parsed JSONs to the SPA
```

## Coverage (all 27 exams in CATALOG)

**27/27 exams ✅** — 1,080 fully-parsed Qs (ORD + MEK), 4,320 answer keys.

By section, across all 27 exams:

| Section | Coverage   | Notes                                                |
|---------|------------|------------------------------------------------------|
| ORD     | 540/540 ✅ | Block-based 2-column geometry recovery               |
| MEK     | 540/540 ✅ | Single-column long stems                             |
| LÄS     | 0/540 (key)| Multi-page reading passages — TODO                   |
| ELF     | 0/540 (key)| Multi-page English passages — TODO                   |
| XYZ     | 0/648 (key)| Math typography — TODO                               |
| KVA     | 0/540 (key)| 2-col quantitative comparisons — TODO                |
| NOG     | 0/324 (key)| Data sufficiency — TODO                              |
| DTK     | 0/648 (key)| Diagrams + image extraction — TODO                   |
| **All** | **4,320 answer keys** | every facit parsed across the corpus       |

Stub records carry `parsing_status: "answer_only"` so the drill engine
can still grade attempts even before prompt extraction lands.

## Output schema

```ts
interface Question {
  qid: string                  // "var-2026-verb1-ORD-001"
  exam_id: string              // "var-2026"
  provpass: "verb1" | "verb2" | "kvant1" | "kvant2"
  section: "ORD" | "LÄS" | "MEK" | "ELF" | "XYZ" | "KVA" | "NOG" | "DTK"
  number: number               // 1..40 within the provpass
  prompt: string | null
  options: { letter: string; text: string }[] | null
  answer: "A" | "B" | "C" | "D" | "E"
  parsing_status: "complete" | "answer_only"
}
```

## Facit layouts

Four extraction strategies, tried in increasing cost order:

- **Layout A** (var-2026 era): 4-column grid — header rows declare the
  4 columns (Verbal del al / Kvantitativ del ny / Verbal del ne /
  Kvantitativ del if), body is 40 rows × 4 cols of `<n> <letter>`.
- **Layout B** (host-2021 era): per-provpass blocks — each provpass
  gets its own header (`Provpass 2 (= DYS 1)`) followed by its section
  type and 40 question/answer pairs in a single column.
- **Layout C** (host-2022, host-2023): bbox-aware — text reflow places
  numbers and letters on non-adjacent runs; we use `get_text("words")`
  positions to pair each digit token with its row-mate letter token.
- **OCR fallback** (host-2016/17/18): some PDFs have a broken ToUnicode
  CMap that returns +29-shifted glyph codes. PyMuPDF and pdftotext
  both choke. We render each page at 300 DPI and run tesseract
  (`-l swe+eng`); the OCR'd text usually parses cleanly via Layout A.

Older exams (var-2018-1 and earlier) also skip the per-page section
header on ORD / MEK pages; the section parser detects those
structurally by question-number range.

## Future branches

| Branch | Scope |
|---|---|
| `parser-las-elf` | LÄS + ELF prompts/options + multi-page passage extraction |
| `parser-quant`   | XYZ + KVA + NOG prompts; LLM cleanup pass for math typography |
| `parser-dtk-images` | DTK images via `page.get_images()` + clip rendering |
