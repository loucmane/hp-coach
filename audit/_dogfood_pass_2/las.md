# LÄS audit — pass 2

## Method
- Sampled 15 qids across 10 exams (var-2026, host-2025, var-2024, host-2023, var-2022-1, host-2021, var-2019, host-2017, var-2015, host-2013).
- Spread across passages (verb1 + verb2 provpass; questions 11/12/16/17 i.e. both short-passage and long-passage anchors).
- Corpus-wide sweeps for: short contexts, encoding mojibake, DELPROV bleeds, hyphen-break artifacts (`word- word`), soft hyphens (U+00AD).
- Cross-checked answer letter in `data/.answer` vs explanation `steps[-1].text` "Svaret är X" on all 15.

## Findings

### Severity: blocker
- None. All 15 sampled qids have answer-letter alignment between corpus and explanation. Contexts are intact multi-paragraph Swedish articles (lengths 1189–7473 chars; min sampled 1189). No DELPROV / "Fortsätt på nästa sida" / "PROVET ÄR SLUT" bleeds found across the 200 sampled LÄS rows (10 exams × 20). No mojibake (`â€`, `Ã¥`, `�`) — å/ä/ö render cleanly.

### Severity: cosmetic
- **Soft hyphens (U+00AD) embedded inside words, pervasive.** 198/200 sampled LÄS contexts contain at least one. Example `var-2026-verb1-LÄS-011` option D: `"…förändringen av gymnasie­skolan…"` (verified via `od -c` → `g y m n a s i e 302 255 s k o l a n`). These come from PDF column-wrap soft hyphens that survived extraction. Visible in render as a tiny dash inside words or as invisible-but-bad copy/paste output.
- **Hyphen-break-plus-space artifacts (`word- word`) in contexts and options.** 158/200 sampled LÄS contexts contain at least one. Same root cause: PDF column line-breaks like `sko- lan`, `männi- skor`, `medborgar- kompetens` made it through. Examples in `var-2026-verb1-LÄS-011`:
  - Option A: `"…undervisnings- formen har för ämnet samhällskunskap."`
  - Option B: `"…så kallad medborgar- kompetens."`
  - Context: `"…unga männi­ skor till goda medborgare."` (note this is `männi` + U+00AD + ` ` + `skor` — combined defect).
  These also occur in `host-2025-verb1-LÄS-011` context (`pollen­ korn`), `host-2025-verb2-LÄS-011` (`Stock­ holm`, `S.M.`, `tyskregistrerade`), `host-2023-verb2-LÄS-011` (`hen­ nes`), and effectively every passage with multi-column source layout.
- **Same artifact bleeds into AI-generated explanation prose.** Because the explanation generator was fed the dirty text, several `solution_path`/`steps` strings contain re-quoted column-break tokens. Example `var-2026-verb1-LÄS-011` distractor B: `"…samhällskunskap och medborgar­kompetens…"` (U+00AD inside the explanation, not the source). Low impact since the surrounding sentence still reads correctly.

### Severity: clean
- 15/15 sampled qids: answer letter matches between corpus and explanation final step.
- 15/15 sampled qids: 4 options, A–D, all Swedish, coherent and discriminable.
- 15/15 sampled qids: explanations are Swedish throughout, reference the actual passage content (e.g. `host-2025-verb2-LÄS-011` explanation walks tingsrätt → hovrätt → HD exactly as the passage describes; `var-2022-1-verb2-LÄS-011` correctly contrasts "myndighetsperspektiv" vs "patientperspektiv" from the source).
- 0/200 sampled LÄS rows had context <500 chars; smallest was 1189 (`var-2022-1-verb1-LÄS-011/012`, a short passage that drives only 2 questions — by design).
- 0/200 had a single-paragraph context (everything has ≥4 `\n\n` splits).
- No DELPROV header bleed, no page footer bleed, no `©` or `Sida N` leakage.

## Patterns
- The two cosmetic defects (soft hyphens U+00AD and `word- word` line-wrap artifacts) are corpus-wide and originate in the PDF text extraction, not in the explanation pipeline. They co-occur on the same fragments — the PDF emits both a U+00AD and a literal hyphen+space in many cases. A single regex pass over `context`/`options[].text` (drop U+00AD; collapse `([a-zåäö])- (\\s*)([a-zåäö])` → `\\1\\3` only when the joined token is a valid Swedish word) would clean ~all of it.
- The explanation generator inherited some U+00AD via copy/paste from the corpus into `solution_path`/`distractors`. Re-running explanations after the corpus cleanup, or sweeping U+00AD out of `app/public/explanations/*.json` directly, would close the loop.
- No section-structural issues: prompts, options, answers, and explanations are well-formed. LÄS is in good shape on substance; the remaining work is text hygiene.
