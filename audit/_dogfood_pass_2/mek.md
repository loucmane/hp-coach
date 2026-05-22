# MEK audit — pass 2

## Method
- Sampled 15 qids across 5 exams: var-2026 (3), host-2024 (3), var-2019 (3), host-2017 (3), var-2014 (3). Spot-checked total MEK counts across all 27 exams for the truncation pattern below.

## Findings

### Severity: blocker

- `host-2017-verb1-MEK-025` — prompt is truncated mid-second-clause and ends with a soft-hyphen split word; the parafras the explanation hinges on is gone from what the student sees.
  - Prompt: `"Risken finns ju också att man som journalist på en liten ort ____, att man självcensu­"`
  - Explanation text references "när saker blir för känsliga eller kommer för nära" — never visible to the user. The picker becomes guesswork (D "tar bladet från munnen" reads as plausible without the missing self-censorship parafras).

- `host-2017-verb2-MEK-021` — prompt cut off before the contrast clause that pins the answer.
  - Prompt: `"Edith Södergrans expressionistiska diktning ger i högre grad prov på ____ livsyttringar"`
  - Answer D ("kontinentala") only makes sense because the original continues "...än på inhemska" (per the explanation). User can't see that anchor; ALL 4 options grammatically fit "____ livsyttringar".

- `host-2017-verb2-MEK-030` — prompt truncated; the contrast "mer effektiv, mindre ___ och mer ___" is half-shown.
  - Prompt ends at: `"...bli mer effektiv, mindre"`. The second blank and the rest of the sentence (which the explanation uses) are missing.

- `var-2014-verb1-MEK-024` — prompt truncated; the third clause ("eller genom fräsning till lämpligt sådjup") that the explanation invokes is cut.
  - Prompt: `"Såbädden bereds genom utjämning och ____ av plöjd mark med harv, eller genom"`

- `var-2014-verb1-MEK-030` — prompt completely truncated, blank marker missing entirely. No `____` visible.
  - Prompt: `"De stycken som beskriver äventyren på land är rätt monotona och ibland närmast"`. Student sees no blank.

- `var-2014-verb2-MEK-022` — two-blank item shown with only the first context line; second blank invisible.
  - Prompt: `"Till presskonferensen kommer hon försenad och jetlaggad, men ____ och professio­"`. Soft-hyphen mid-word; second blank elided.

- `host-2013-verb1-MEK-021` (spot-check outside sample) — prompt has NO blank marker at all.
  - Prompt: `"Diskbråck i ländryggen kan påverka nervrötterna i ryggen och ge utstrålande smärta i"`. Student cannot tell where to fill in.

**Scope of pattern (counted, not extrapolated):** MEK prompts ending without sentence terminator (truncation proxy): host-2013 19/20, host-2014 20/20, host-2015 20/20, host-2016 19/20, host-2017 20/20, var-2013 20/20, var-2014 19/20, var-2015 20/20, var-2016 20/20, var-2017 18/20. host-2018 onward + var-2019 onward: 0–1/20 (clean). MEK prompts that lack any `____` blank marker: host-2013 10/20, var-2014 11/20, host-2017 6/20 — these are unanswerable as displayed. 30 soft-hyphens (U+00AD) survive across MEK prompts, all in the pre-2018 cohort.

### Severity: cosmetic
- Soft hyphens (`­` / U+00AD) remain in pre-2018 prompts at line-wrap points (e.g. `självcensu­`, `professio­`, `Till­`). Renders invisibly in most browsers but breaks search and looks broken in monospace.

### Severity: clean
- All 6 sampled qids from var-2026 + host-2024 + the 3 modern host-2024 / var-2019 items I read: prompts complete, blanks present, å/ä/ö clean, options grammatically parallel, answer letters consistent with explanations. Multi-blank items (e.g. `var-2026-verb2-MEK-028` three-blank legal-prose, `host-2024-verb1-MEK-022` two-blank) are well-formed.
- Explanations across all 15 sampled qids: Swedish, coherent, justify answer with grammar/collocation/semantics, no language mixing, no decalcified distractor openers (each `why_tempting` is genuinely item-specific).

## Patterns
- Single dominant issue: the parser truncated MEK prompts to roughly the first text line of the PDF block for all pre-2018 exams. Item is single-line in the PDF + a fold → cutoff at fold. Modern exams parse cleanly. This affects roughly 200+ MEK items (10 exams x ~20 items, severity varying from "missing follow-up clause" to "no blank marker at all").
- The explanations were written against the FULL sentence (they quote the missing tail verbatim in `solution_path` / `steps[0]`), so the question bank and explanation corpus are out of sync for this slice — the explanations are usable as raw reference but the picker is broken.
- Fix shape: re-run MEK parser on host-2013..host-2017, var-2013..var-2017 with a multi-line block extractor; preserve the full sentence; normalize U+00AD out. No content regeneration needed if the answer-key and options are intact (they appear to be).
