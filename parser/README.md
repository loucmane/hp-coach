# parser/

Parses HP exam PDFs into a unified question bank for the drill engine.

## Pipeline

```
data/pdfs/{exam_id}/{facit,verb1,verb2,kvant1,kvant2}.pdf
        │
        ├── parse_facit.py          → answer key per provpass
        ├── parse_section.py        → ORD, MEK (others TODO)
        │
        └── build_var2026.py        → data/parsed/var-2026.json
```

Each PDF is downloaded once via `fetch_pdfs.py` (idempotent) and read
locally with PyMuPDF (`fitz`) — we don't rely on `hp_databas.json`'s
flat text dump because it loses column structure on multi-column pages
(ORD, KVA).

## Run

```bash
source venv/bin/activate
pip install pymupdf requests           # if missing
python3 parser/fetch_pdfs.py var-2026  # download PDFs (skips if cached)
python3 parser/build_var2026.py        # produce data/parsed/var-2026.json
python3 parser/test_parser.py          # smoke tests
```

## Coverage (var-2026, this MVP)

| Section | Coverage   | Notes                                          |
|---------|------------|------------------------------------------------|
| ORD     | 20/20 ✅   | Block-based 2-column geometry recovery         |
| MEK     | 20/20 ✅   | Single-column long stems                       |
| LÄS     | 0/20 (key) | Multi-page Swedish reading passages — TODO     |
| ELF     | 0/20 (key) | Multi-page English reading passages — TODO     |
| XYZ     | 0/24 (key) | Math typography (formulas) — TODO              |
| KVA     | 0/20 (key) | Two-column quantitative comparisons — TODO     |
| NOG     | 0/12 (key) | Data sufficiency — TODO                        |
| DTK     | 0/24 (key) | Diagrams + image extraction — TODO (task 32)   |
| **All** | **160 answer keys** | facit.pdf is fully parsed              |

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

## Adding more exams (task 36)

The build script is per-exam by design. To extend, create
`build_<exam_id>.py` (or refactor to take `exam_id` as an argument once
section parsers cover all sections — there's no point generalizing
before the parser is feature-complete).
