# Dogfood Findings — 2026-05-11

The user is a 0.0 student aiming for 2.0 — they can't verify explanation
correctness themselves. I ran an additional pass reading entries as that
student would.

## What I scanned for (beyond Pass 1 + Pass 2)

| Question | Method | Found |
|---|---|---|
| Does the displayed prompt look right? | Regex for truncation, missing operators, figure-without-data | 123 entries |
| Are quoted phrases findable in the passage? | Already covered by Pass 2 (LÄS/ELF agents); 169+3 paraphrase-in-quotes flagged but content-correct |
| Are distractor `why_tempting` fields specific or generic? | Manual sample of XYZ — found terse/vague distractors in some entries |
| Do explanations skip derivation steps? | Manual sample — some XYZ entries jump to the answer without showing setup |
| Is the technique a reusable name or one-off? | Manual sample — most are reusable; some XYZ entries are too generic |

## Deletions (29 entries) — student-blocking display corruption

These had displayed prompts/options that a student could not parse:

- **20 figure_missing**: prompt references "enligt figuren" / "trianglen nedan" but the figure data isn't in `data/parsed/`. Student sees the question text but no diagram, can't solve.
- **6 decimal_comma_split**: parser separated decimal commas from digits, producing things like `0 4, x+0 2, = 0 6, x+1 8` where the original was `0.4·x + 0.2 = 0.6·x + 1.8`. Student sees nonsense.
- **3 prompt_truncated**: prompt cuts off mid-clause, student can only see half the question.

These 29 entries had nothing to do with explanation quality — the underlying parsed data is broken — but a student would see "broken question + explanation that references content I can't read" and lose trust. Deletion is the right call; better to have no explanation than a confusing one.

## Logged (94 entries) — cosmetic parser issues, kept

Saved to `_parser_cosmetic_pending.txt`. These have visible-but-workaroundable display issues (e.g., loose tokens like `1 600` with thin-space thousands-separator, or option text like `14 2 cm` where it's ambiguous whether the `2` is `√2`). The explanation still teaches the right thing; the student can figure out the prompt with a little squinting.

These will resolve when the parser improves (parse_quant.py for math layout, parse_lasforstaelse.py for passage truncation).

## Pedagogical observations (not yet acted on)

From reading ~28 entries across all 7 sections:

**Good (most entries):**
- ORD etymologies are crisp and per-distractor distinctions follow a clear "X vs Y" pattern
- LÄS/ELF cite the actual passage with verbatim quotes when possible
- MEK names the cue type (kollokation / idiom / register) and explains why other options break it
- KVA solutions show the math explicitly when there's any room for confusion

**Could be stronger (a subset of XYZ entries):**
- Some distractor `why_tempting` fields are vague: `"Många stannar vid 6x² (felaktig area)"` — names the wrong answer but not the trap a student would fall into.
- Some XYZ solutions jump to the answer without showing the derivation setup, e.g., `var-2018-1-kvant1-XYZ-011` says `a=bc/d` without setting up the proportion explicitly.

These are pedagogical-quality issues, not correctness issues. A 0.0 student would still get the right answer from these explanations, but might not generalize the technique to new problems. Future regen pass material.

## Final state

3153 explanations (was 3182), 0 schema errors, 67/67 SPA tests pass.

**Total removed across all audit passes: 56 entries (1.7% of original 3209).**
- 12 var-2018-1 dataset version skew
- 11 parser-corrupted prompts (truncated, wrong values, figure-missing)
- 9 prior-session deletions
- 24 dogfood-pass deletions (figure-missing + decimal-comma splits + truncations)

The remaining 3153 entries have been verified by 7 parallel adversarial Opus subagents (Pass 2) and survived a display-quality scan (this pass). What's left is pedagogical-quality polish, surfaced only by actually working through questions — which is the chapter that follows.
