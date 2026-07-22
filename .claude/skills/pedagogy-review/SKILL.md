---
name: pedagogy-review
description: Use when adjudicating generated HP exam items (LÄS / ELF) for pedagogical and psychometric soundness — before approving a unit for students, to check whether a test-wise student could score without reading, whether each distractor teaches a real misconception, and whether the rationale (the teaching payload) is factually correct — beyond what the mechanical gates and language review already verify.
---

# Pedagogy review (HP LÄS / ELF item quality)

## Overview

The gate stack proves an item is well-*formed* (one solvable key, no double-key,
comprehension-not-recall, authentic register). The language review proves it
*reads* native. Neither audits whether the item **teaches well** or whether a
**test-wise student can beat it without reading**. Two defects slipped through
both on Batch 1: a cloze whose *rationales* stated false collocation facts
(`dilute` doesn't take `margins` — it does), and a LÄS unit where the key was the
**longest option in all four questions** (pick-the-longest scores 4/4 blind).

**Core principle: probe the item as a psychometrician and a teacher, not a
proofreader.** Work the required probes below; a fluent read that says "good
question" is not review.

## Scope

Judge: comprehension integrity, distractor pedagogical value, **rationale
factual accuracy**, surface tells / construct validity, and difficulty fit. You
**own item design** — you may propose edits to keys, distractors, stems, and
rationales (unlike the language review, which must not touch traps). But any fix
to an answer or distractor must **preserve exactly one defensible key** — say so,
and flag it for a G-KEY / G-DISTRACTOR re-gate. **Do NOT** re-do language
(separate skill) or re-litigate settled design decisions (the ELF cloze format
is a deliberate `CLOZE-001` family; the schema question cap is **5**, not 4 —
ignore any stale `schema_note` in a candidate).

## Required probes (work every one, per unit)

1. **Comprehension, not recall.** Each question must be answerable *only* by
   reading this passage — not by world knowledge, and not by recalling a fact.
   The passage must genuinely license exactly one answer.
2. **Distractor pedagogical value.** Each distractor must map to a *real, named*
   misconception a student could hold — reversed causality, overgeneralisation,
   scope-shift, detail-as-main, true-but-peripheral (LÄS); collocation-misfit,
   polarity-mirror, sense-misfit (cloze). Falling for it should be *instructive*.
   Filler distractors (obviously wrong, no misconception) are a defect.
3. **Rationale accuracy — fact-check the teaching payload.** The `rationale` is
   shown to students; treat every factual claim in it as a claim to verify, not
   plausible prose. A rationale that rejects a distractor for a *false* reason
   (e.g. "X doesn't collocate with Y" when it does) teaches a false fact — that
   is a real defect even when the key is correct. Name the true reason.
4. **Surface tells / construct validity.** Can a test-wise student score without
   reading? Check *across the unit's questions*: is the key systematically the
   **longest** option, the most-hedged, or always in the same position? Are
   distractors length-matched to the key? A per-unit length/position tell is a
   construct-validity leak (M-TELL flags the length case mechanically; you catch
   the subtler ones — hedging, position, register of the key).
5. **Difficulty & authenticity fit.** Is it a fair HP-level item — neither
   trivially eliminable nor unfairly obscure? Does it read as a genuine HP task
   (folds in G-REGISTER's signal)?

## Output contract (per unit)

```
candidate_id, section
pedagogy_verdict: SOUND | MINOR_FIXES | NEEDS_REDESIGN | REJECT
findings: [ { severity: lethal|major|minor,
              dimension: comprehension|distractor|rationale|surface-tell|difficulty,
              locus: "<q_index / gap / whole-unit>",
              quote: "<the claim or option at issue>",
              suggested_fix: "<the concrete change>",
              regate: true|false,   // does the fix need a G-KEY/G-DISTRACTOR re-check?
              why: "<one sentence>" } ]
construct_validity: one line — key-length pattern, position pattern, any blind-solvable tell.
```
`REJECT` / `NEEDS_REDESIGN` only for items that mis-teach or are gameable
without reading. A wrong rationale or a length-tell is typically `major` →
`MINOR_FIXES` with the fix supplied.

## Common mistakes

- **Passing because the answer is correct.** Correct ≠ well-taught ≠
  un-gameable. The point is the other three.
- **Reading a rationale for plausibility instead of fact-checking it** — the
  Batch-1 cloze read fine and was false.
- **Missing the cross-question tell** — one question's key being longest is
  noise; the key being longest in *most* questions is a construct-validity leak
  and a generator habit worth fixing before it compounds.
- **Re-doing language** (that's `expert-language-review`) or **re-opening
  settled design** (cloze format, the 5-question cap).
- **A "fix" that creates a second defensible answer** — always mark `regate:true`
  when you touch a key or distractor, and never assume the item still has one key.
