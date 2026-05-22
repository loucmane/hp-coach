# DTK audit — pass 2

## Method
- Sampled 15 qids across 10 exams (var-2026, var-2025, var-2024, host-2025, host-2024, host-2023, var-2022-1, host-2022, host-2017, var-2018-1) plus full-corpus sweeps for figures and option-D bleeds.
- Spot-checked explanations against prompts/answers for 3 qids.

## Findings

### Severity: blocker

- **No DTK question in the corpus has a `figure`.** Full sweep across all 27 exams: `total=648 with_figure=0`. Every sampled qid (e.g. `var-2026-kvant1-DTK-029`, `host-2025-kvant2-DTK-040`, `var-2024-kvant2-DTK-038`) shows `"figure": null`. DTK is by definition "diagram, tabeller och kartor" — without the figure the question is unanswerable in the SPA. This is the dominant defect for the section.

### Severity: cosmetic

- **Option D contamination by page-break / section-end footers** persists in 38 DTK questions across the older corpus (host-2013, host-2014, host-2015, host-2016, host-2017, host-2018, var-2013, var-2014, var-2015, var-2016, var-2017, var-2018-1). Two distinct patterns:
  - End-of-half footer on q40: `D=320 gram/vecka och person – 23 – PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR.` (`host-2013-kvant1-DTK-040`, `host-2018-kvant2-DTK-040`, `var-2014-kvant1-DTK-040`, etc. — 16 hits, all on q40 of each provpass).
  - Page-break footer on mid-block qs (31/33/34/36/37/38): `D=1,8 – 17 – Fortsätt på nästa sida »` (`var-2016-kvant1-DTK-031`, `var-2017-kvant1-DTK-031`, `host-2017-kvant1-DTK-031`, `var-2018-1-kvant1-DTK-031`, etc. — 22 hits).
  - PR #63 cleaned 86; these 38 appear to be a missed cohort (only host-2013→var-2018-1 affected; host-2020+ and var-2019+ are clean).

- **Soft-hyphen / linebreak artifacts in prompts.** `var-2026-kvant1-DTK-029`: `"...lade kvinnor på Diskning, avduk­ ning 1990..."` — U+00AD inside a word. Not a blocker, but visible in render.

### Severity: clean

- 12/15 sampled prompts read cleanly with no LaTeX, no PUA leakage, correct Swedish.
- Sampled explanations (`var-2026-kvant1-DTK-029`, `host-2017-kvant1-DTK-031`, `host-2013-kvant1-DTK-040`) all have `answer_letter` consistent with `data/`'s `answer`, and `solution_path` references the figure indirectly with plausible values (e.g. "Diskning, avdukning Kv-staplar minskar ca 9 → ca 0–1 minut per dag").
- No raw LaTeX detected across 648 DTK prompts.

## Patterns

- **Figures are the section-blocker, not the text.** Prompts and explanations are corpus-quality; the SPA needs the vector graphics (or a fallback image asset) wired in before DTK is usable. Even a clean prompt like `host-2024-kvant1-DTK-035` ("I vilket land förändrades andelen sysselsatta inom lågkvalificerade yrken minst?") is unanswerable without the country bars.
- **D-bleed is exam-cohort-shaped.** All 38 residual bleeds fall in host-2013…var-2018-1; nothing from host-2020 forward. A targeted re-run of the PR #63 cleaner over that cohort should close the gap.
- **q40 bleed is structural.** Every kvant1 and kvant2 q40 in the affected cohort drags the "PROVET ÄR SLUT" footer — the parser splits on next-question boundary, and q40 has none, so the half-end footer lands inside D.
- **Page-break bleed is also positional**: qids ending in 31, 33–34, 36–38 — i.e. last DTK question on each printed page. Same root cause as q40 but for inter-page boundaries.
- Explanations correctly anchor on the parsed `answer` letter, so even on contaminated rows the coaching content stays valid; only the rendered D-option text is dirty.
