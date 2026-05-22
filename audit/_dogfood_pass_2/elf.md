# ELF audit — pass 2

## Method
- Sampled 15 qids across 8 exams: host-2013, host-2020, host-2021, host-2022, host-2025, var-2013, var-2024, var-2026
- Inspected: context body integrity, cloze gap markers (31..35), prompt + options, answer letter, pregrade_tactic language
- Cross-scanned all 27 exams for ELF `pregrade_tactic.move` containing Swedish characters/morphemes

## Findings

### Severity: blocker
- `host-2013-verb1-ELF-031..050` (20/20), `host-2021-verb1-ELF-031..050` (19/20), `host-2022-verb1-ELF-031..040` (10/10), `var-2014` (15/15), `var-2015` (20/20), `var-2016` (20/20), `var-2017` (19/20), `var-2019` (20/20), `var-2026` (5/6 non-null) — `pregrade_tactic.handle` + `move` are in **Swedish**, violating the R3 ELF-stays-English contract. Example `host-2013-verb1-ELF-031`: `handle: "Pivot-jakten"`, `move: "Hitta meningen där författaren vänder från då till nu …"`. Example `host-2022-verb1-ELF-031`: `handle: "Although-meningen"`, `move: "På frågor om vad man trodde eller visste före händelse X, leta efter den motsägande \"although\"-meningen …"`. Example `var-2026-verb1-ELF-040`: `handle: "Rapporteringsfrasen"`, `move: "Vid ELF-cloze om allmän opinion — leta efter rapporterande verb …"`. Total ELF qids with Swedish pregrade: **148** (across the 9 affected exams). Other 18 exams are clean English (e.g. host-2020, host-2025, var-2024, var-2013).

### Severity: cosmetic
- Hyphenation artifacts persist from PDF OCR across ELF passages — mid-word spaces survive into the rendered body. Examples: `host-2020-verb1-ELF-031` context: `"the re- ligiosity of twins"`, `"adult- hood"`, `"statis- tical"`; `host-2020-verb2-ELF-031` context: `"com- mon"`, `"for- mation"`, `"Pre- vious"`, `"haemor- rhagic"` (implied via line break); `host-2025-verb1-ELF-040` option A `"develop­ ments"` (soft-hyphen U+00AD + space); `var-2024-verb1-ELF-038` prompt `"depres­ sion"`. These reduce readability but don't change meaning. Same pattern showed up in earlier audits — parser cosmetic backlog.
- `var-2024` has only 6 ELF explanations (vs typical 20) and `host-ver2-2019` has 15. Coverage gap, not a content bug — confirms via `audit/_elf_skipped.txt` likely.

### Severity: clean
- **Context bodies (PR #65 restoration)**: `host-2020-verb2-ELF-031..035` ("Two Drinks a Day?") now has the full 1871-char multi-paragraph body with byline `Chris Smyth, The Times`. No empty or sub-200-char ELF contexts found across all 27 exams.
- **Cloze gap markers**: integers 31/32/33/34/35 are preserved as plain digits inline (e.g. `"any more than that 31 the risk"`, `"the blood 33 to the brain"`, `"No 35 has so far been found"`). Empty `prompt` on qids 031..035 of cloze provpass is by design (gap embedded in body).
- **Prompt/options/answer**: all 15 sampled items have coherent English prompts, 4 options A–D, single-letter answer. Examples: `host-2020-verb2-ELF-031 → A (enhances)`, `host-2025-verb1-ELF-031 → A`, `var-2024-verb1-ELF-040 → D`, `host-2020-verb1-ELF-040 → B`. No mis-letter, no truncation.
- **Explanation steps**: prose mixes English concept names with Swedish framing per convention; `pregrade_tactic` is the only language-contract field, and 18/27 exams comply.

## Patterns
- The R3 ELF→English fix landed on later/regenerated content (host-2014..2018, 2020, 2023..2025, var-2013, 2018-1, 2022-x, 2023, 2025) but skipped a cohort of older regenerations: host-2013, host-2021, host-2022 plus var-2014/15/16/17/19. A spot of regression in `var-2026-verb1-ELF-040` (5 of 6 non-null entries Swedish) suggests the regeneration pipeline still produces Swedish pregrade for ELF in some configurations. Re-run R3 normalization scoped to ELF qids with Swedish characters in `pregrade_tactic.move`.
- Hyphenation artifacts are systemic to ELF (and other) PDF-derived passages — worth a one-pass cleanup script (regex: `\w- \w` → join) before next dogfood round, but no semantic risk.
- No empty/short contexts remain post-PR #65; passage integrity is fully restored.
