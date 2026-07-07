# DTK content quality audit (vision-grounded)

**Date:** 2026-07-06 · **Status:** in progress — **80 of 216** figure pages
audited (240 of 648 questions, **37 %**). Remaining 136 pages queued for
resume; progress is gated by ~5-hourly usage windows (~10–26 pages each).

## Why this audit

All 648 DTK explanations were generated 2026-05-17 (`claude-opus-4-7`,
recipe `variant-c-ultra-granular`) and stored in
`app/public/explanations/{exam}.json`. DTK is the dogfood user's measured
**worst** section. The suspicion going in: the generator may not have had
the figure image in context, so its *visual* claims (legend colours,
segment widths, pie-slice counts, axis scales, which bar is which) could be
fabricated even where the numbers are right.

## Method

One vision agent per figure **page** reads the actual raster
(`app/public/figures/dtk/{exam}-{pass}-p{NN}.jpg`) plus every question +
explanation on that page, then, working from the figure itself:

- re-solves each question to check the facit answer (`answerVerdict`),
- scrutinises every figure-claim in `solution_path` / `steps` /
  `distractors` against what the image actually shows,
- checks the prompt is complete, coherent Swedish.

Machine-readable results: `audit/dtk/audit_run1_result.json`.

## Headline findings (70-page sample)

| Metric | Result (80-page sample) |
|---|---|
| Questions audited | 240 / 648 (37 %) |
| **Wrong facit answers** | **0** ✅ (see note) |
| **High severity** (fabrication steers a solver to the *wrong* option) | **9** |
| Medium (false visual claim, answer unaffected) | 97 |
| Low (muddled/cosmetic, not actually false) | 19 |
| — of all defects: hallucinated figure-claim / garbled-prompt / other | ~93 % / ~5 % / ~2 % |
| Pages read as "written WITH sight of the figure" | **21 / 80 (26 %)** |
| — WITHOUT sight (numbers right, visuals wrong/invented) | 15 |
| — MIXED | 44 |

**Answer key is intact.** The audit surfaced *one* "likely-wrong answer"
(`host-2018-kvant2-DTK-036`); on manual inspection of the figure this was a
**false positive** — the audit agent misread the 3-D depth ordering. The
correct reading is Svensk+förgymnasial (back bar) = 47, Utländsk-född+gymnasial
(mid) = 31, |47−31| = **16 = facit C ✓**. (The *explanation* did misread the
same chart; it has been rewritten — see below.) No confirmed wrong answers
across all 240 audited questions.

**Diagnosis (confirmed at scale):** the explanations are text-grounded, not
figure-grounded. They reproduce OCR-extractable numbers reliably (that's why
**no answer is actually wrong**), but anything requiring sight of the graphic
— legend colours, which bar/slice is which, dual-axis scales, bubble
positions — is frequently fabricated. Half of all audited questions carry at
least one false visual claim.

**Why it matters for a learner:** the answers are safe, but the *reasoning* a
student is meant to internalise is often anchored to features that aren't
there ("look for the white box" when it's grey; "read ● on the 0–100 scale"
when it's the 0–500 scale). On the user's weakest section, that teaches the
wrong reading habit. This is a **prose-correctness** problem, not an
answer-key problem.

## High-severity defects (user-facing — fix first)

These are `parsing_status: complete` (drillable). In each, the explanation's
fabricated figure-reading would lead a solver who *checks the figure* to the
**wrong** option, even though the facit answer is correct.

| qid | figure | the fabrication | status |
|---|---|---|---|
| `host-2018-kvant2-DTK-036` | p20 | Misreads the tall back bar (Svensk/förgymnasial) as 26 (it's 47) → "\|26−31\|=5 → option A"; correct is \|47−31\|=16 = facit C. | **✅ fixed** (rewritten against the figure) |
| `host-2014-kvant2-DTK-034` | p18 | Invents 85+ as *rising* ("1999 ~150 → 2008 ~230, enda med stigande trend"); figure shows 85+ **falling** (~205→~158). Its own numbers point to wrong option B. | **✅ fixed** |
| `host-2017-kvant1-DTK-037` | p20 | Names the two evenest-gender bubbles as "personliga tjänster + post/tele" and puts post/tele "far right"; figure shows post/tele mid-left and the real even pair is personliga tjänster + samhällsvetare. | **✅ fixed** |
| `host-2017-kvant1-DTK-038` | p22 | Reads luftstrupe 1991 bar as "~25 000 (>15 000 ✓)"; it's ~13 300 (**below** 15 000) — the exact disqualifier is inverted. | **✅ fixed** |
| `host-2017-kvant1-DTK-040` | p22 | Step 4 readings contradict the figure: luftstrupe called *decrease* (actually +15 400), ljumskbråck +3 000 (actually −10 900). | **✅ fixed** |
| `host-2017-kvant2-DTK-031` | p16 | Reverses the dual-axis legend: instructs reading Total-kväve (●) on the 0–100 scale (→ ~50, wrong) when ● is the 0–500 scale (→ ~250, option D). | **✅ fixed** |
| `host-2017-kvant2-DTK-040` | p22 | Misreads the "Pedagogisk högskoleexamen saknas" row as 130 (it's 482) → 17 % (lowest) when the true 62 % is the **highest**. | **✅ fixed** |
| `host-2022-kvant1-DTK-035` | p20 | Småland ironworks map: misidentifies the westernmost pappersbruk (names circle/triangle towns; the real one, Skeen ◇, is never named) and mislabels Glasbruk's symbol. Answer C right by luck. | deferred (dense symbol map — separate careful pass) |
| `host-2022-kvant1-DTK-036` | p20 | Claims the 90-km-south endpoint is Midingsbråte (a glasbruk ◇dome ~148 km away); the real endpoint is Kårestad (pappersbruk ◇). A solver reading Midingsbråte's real symbol answers C (wrong). | deferred (dense symbol map — separate careful pass) |
| `host-2022-kvant1-DTK-037` | p20 | Fabricates the entire glasbruk inventory (lists 9 towns that are triangles/circles); the only glasbruk are 3 far-south domes. Mislabels Glasbruk symbol. | deferred (dense symbol map — separate careful pass) |
| `host-2023-kvant1-DTK-039` | p22 | Understates the 30–34 line ("1990 ~12–13 %, 2004 ~25 %"); figure shows ~15 % → ~30 %. A solver tracing the real line to 24–26 % lands at ~1998 = wrong answer A (not D=14 yr). | **✅ fixed** |

**Non-user-facing:** `host-2021-kvant1-DTK-033` (flagged high) is
`parsing_status: answer_only` (null prompt+options) and is already excluded
from drilling by `questionsInSection`. Its boilerplate explanation (references
an unrelated "nettoomsättning" figure) never renders. Same for the other 11
`answer_only` DTK stubs — data hygiene only, not a learner-facing bug.

## Medium / low

97 medium + 19 low defects (qids in `audit/dtk/audit_run2_result.json`).
Medium = a demonstrably false visual claim that doesn't change the answer
(wrong legend colour, invented slice, off-by-one rank, a misread digit like
"139 016" for the figure's "139 036"). Low = muddled/self-contradictory
prose that isn't strictly false. Both are worth fixing for reasoning quality
but are not urgent.

## Remediation plan

1. **Finish the audit** — resume the workflow (`resumeFromRunId`,
   figure-find only) after the usage window resets to cover the remaining
   146 pages / ~438 questions. Cached pages replay free.
2. **Fix wave (systemic):** regenerate the flagged explanations **with the
   figure image in context** (vision-grounded), so the visual claims are
   grounded rather than inferred from OCR text. This is the clean fix for
   all `hallucinated-figure-claim` defects — do the 7 high-severity first,
   then the mediums. Piecemeal prose surgery is discouraged: in the
   high-severity cases the *entire* derivation is built on the misreading, so
   each needs re-deriving from the figure anyway.
3. **Authoring-rule update:** the DTK generation recipe must require the
   figure image as input. Record this so future regens don't reintroduce the
   defect.
4. **Data hygiene (minor):** prune or stub the boilerplate explanations on the
   12 `answer_only` DTK questions (never shown, but noise).

## Reproduce / resume

- Per-page bundles: `scratchpad/dtk_audit/pages/*.json` (built from the served
  bank + explanations + figure index).
- Workflow script: `.../workflows/scripts/dtk-content-audit-wf_160b9d92-c8f.js`
  (find-only; verify phase removed after it proved redundant + costly).
- Resume: `Workflow({scriptPath, resumeFromRunId: 'wf_4f304ca2-63d', args})`
  — 70 completed pages replay from cache; the 146 remaining run live.
