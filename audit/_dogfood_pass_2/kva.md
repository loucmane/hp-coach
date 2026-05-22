# KVA audit — pass 2

## Method: 15 qids across [var-2026, host-2024, var-2023, host-2017, var-2015, host-2020, host-2025, var-2025]

Sampled 15 KVA questions; cross-checked corpus prompt + 4 options + answer letter against the matching `app/public/explanations/<exam>.json` entry. Also scanned all 300 KVA prompts across 15 exams for `\frac{?}` placeholders, page-footer leakage, raw-LaTeX outside U+E000/U+E001 PUA wrappers, options-count drift, and answer-letter mismatch with `solution_path`.

## Findings

### Blocker (renders broken)

- **host-2020-kvant1-KVA-015** — options array has 5 entries with duplicate letter `D`. First "D" is parser-bleed continuation of the prompt: `"är mittpunkten på sträckan CE. Kvantitet I: v Kvantitet II: 90°"`. The real prompt (`"Fyrhörningen ABCE är en rektangel."`) is truncated; the missing context bled into the options array. Frontend will render two D rows. Explanation entry is `null`.
- **host-2020-kvant2-KVA-015** — explanation entry is `null`; prompt also looks corrupt: `"Kvantitet I: \frac{6}{1} \frac{6}{1} Kvantitet II: \frac{1}{6}"`. The duplicated `6/1` is almost certainly source `6^{-1} · 6^{-1}` mis-extracted; with `answer: B` (II > I) and no explanation, the student gets nothing renderable.
- **host-2017-kvant1-KVA-018** — prompt is garbled multi-column math collapsed onto one line: `"\frac{x y 372}{3 3 12}- < Kvantitet I:\t x Kvantitet II:\t y"`. PUA wrappers absent on the raw `\frac`. Unrenderable.

### Cosmetic

- **var-2026-kvant1-KVA-019**, **host-2024-kvant1-KVA-016**, **var-2025-kvant2-KVA-020**, **var-2026-kvant2-KVA-020** — parser extracted PDF left/right paren glyphs as the literal letters `b` and `l`. E.g. host-2024-kvant1-KVA-016: `"Kvantitet I: b \frac{3}{5} - \frac{4}{7} l·32"` should be `"((3/5) - (4/7))·32"`. Math is correct after mental substitution `b→(`, `l→)`; KaTeX still renders the frac but the surrounding parens are wrong.
- **var-2023-kvant1-KVA-015** — coordinates extracted into a `\frac` accidentally: `"\frac{A = (1, 1)}{B = (1, 5)} \frac{C = (-2, 1)}{D = (-2, -3)}"`. Inside PUA wrappers so KaTeX will try to render `A = (1, 1)` over a fraction bar.
- **5 qids with `parsing_status: "answer_only"` and `prompt: null`** across the corpus (host-2017-kvant1-KVA-016, var-2015-kvant1-KVA-021, host-2020-kvant1-KVA-022, host-2013-kvant2-KVA-013, var-2019-kvant1-KVA-021). Plus 7 more with `options: []` (var-2025-kvant1-KVA-019, var-2018-1-kvant1-KVA-014/022, host-2014-kvant1-KVA-022, host-2014-kvant2-KVA-017/019/022). These are flagged by the parser and skipped by the UI — known degradation, not a regression.

### Clean

- 13 of 15 sampled qids inspected end-to-end clean: prompt PUA-wrapped where math present, 4 valid options, `answer` letter matches `solution_path` conclusion (e.g. var-2026-kvant1-KVA-013 B, var-2026-kvant1-KVA-019 C, host-2024-kvant1-KVA-014 B, host-2024-kvant1-KVA-019 A, var-2023-kvant1-KVA-016/017 C, host-2017-kvant2-KVA-017 A, var-2015-kvant1-KVA-020 B, host-2020-kvant1-KVA-013 A, host-2025-kvant1-KVA-018 A, var-2025-kvant1-KVA-016 C, var-2025-kvant2-KVA-020 D, var-2026-kvant2-KVA-022 D).
- Zero `\frac{?}` placeholders across all 300 KVA prompts inspected.
- Zero page-footer ("FORTSÄTT", "Provet är slut") contamination in any KVA option.
- Zero raw LaTeX commands (`\frac`, `\cdot`, `\sqrt`) outside U+E000/U+E001 PUA wrappers in any KVA prompt across the 9 exams scanned for that pattern (the host-2017-KVA-018 garbled-math case is the only exception, captured above).
- Every sampled `answer` letter matched the explanation's `solution_path` conclusion.

## Patterns

- KVA math is consistently wrapped in U+E000/U+E001 PUA delimiters around inline LaTeX — convention holds across all 15 exams.
- The remaining parser failures cluster on layouts where the PDF used a single horizontal bracket spanning a multi-line column of equations: the parser flattens the column into one line and either inserts garbled `\frac{...}{...}` (host-2017-KVA-018, host-2020-kvant2-KVA-015) or smuggles prompt text into the options array (host-2020-kvant1-KVA-015).
- "b ... l" pseudo-paren bug is a recurring glyph-extraction issue worth a corpus-wide sweep: every KVA prompt containing `" b "` or `" l "` adjacent to a `\frac` is probably a paren miss.
- `answer_only` skipped entries are concentrated in older exams (2013–2019) and host-2014 in particular (4 of its 24 KVA blanked).
