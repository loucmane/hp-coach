---
name: integrated-review
description: Use as the FINAL whole-unit correctness sweep of a generated HP item after it has passed the mechanical gates, the blind gates, and both expert reviews — the integrated read that cross-checks passage, stems, options, keys, rationales, glossary, and metadata against EACH OTHER for consistency and correctness that no single-dimension gate can see (a rationale that no longer matches an edited option, a number that won't reconcile, a rationale that contradicts itself, a distractor that is actually defensible once you read everything together, a cross-question leak).
---

# Integrated review — the final whole-unit sweep

## Overview

Every earlier check looks at ONE dimension: G-KEY solves the key, G-DISTRACTOR
checks for a second answer, language-review checks register, pedagogy-review
checks teaching value and rationale *facts*. **None holds the whole unit at once
and checks its parts against each other.** So cross-cutting errors fall between
the cracks — and the language/pedagogy *corrections* edit passages and options,
which can silently orphan a rationale that quotes the old wording.

**Core principle: read the unit as one integrated artifact; every part must be
consistent with every other part.** You have **full visibility** — keys,
rationales, metadata, all of it — precisely so you can cross-check. This is the
last gate before a unit is eligible to ship; nothing else does this job.

RED (run on units that had already passed everything) found: a rationale that
contradicts itself ("erosion, i.e. eating them away" describing a *sudden
overnight* effect), trap-label metadata that misnames the trap, and a
cross-question premise leak. Minor there — but at batch scale this is the net
that catches the edited-option-orphans-its-rationale error before a student sees
it.

## The cross-consistency checklist (work every row, with the whole unit open)

| # | check | the failure it catches |
|---|---|---|
| 1 | **Passage internal consistency** | numbers/quantities/facts reconcile across paragraphs; no contradiction (e.g. "14 meadows, paired two-by-two" must equal 7+7) |
| 2 | **Stem ↔ passage** | each question is genuinely about something the passage contains |
| 3 | **Key ↔ passage fidelity** | the key faithfully reflects what the passage *says* — not merely "the best of four" |
| 4 | **Rationale ↔ CURRENT option + passage** | every phrase a rationale quotes/names actually appears in the **current** option text and the passage (corrections edit text — a rationale can now reference wording that changed) |
| 5 | **Rationale internal coherence** | the rationale does not contradict itself (the *erosion = sudden* case) |
| 6 | **Distractor ↔ passage** | each distractor is genuinely wrong **per the passage**, not just weaker; and none is accidentally *more* faithful to the passage than the key |
| 7 | **Glossary** | defines words that appear, correctly, in base form |
| 8 | **Cross-question** | no question gives away another's answer; no two questions contradict; shared-passage overlap stays within tolerance |
| 9 | **Metadata accuracy** | trap labels name the actual trap; spelling-variety / family / key fields match the content |

## Output contract (per unit)

```
candidate_id, section
sweep_verdict: CONSISTENT | MINOR_NOTES | INCONSISTENT | BLOCKED_SHIP
findings: [ { severity: blocker|major|minor,
              check: "<row # / name from the table>",
              locus_a: "<where>", quote_a: "<text>",
              locus_b: "<the part it conflicts with>", quote_b: "<text>",
              fix: "<concrete change>", regate: true|false,
              why: "<one sentence naming the inconsistency>" } ]
```
A finding always names **two loci** — the point of this gate is that A and B
disagree. `BLOCKED_SHIP` for any real correctness break (a wrong number, a
rationale that describes a different option, a genuine second answer, a key the
passage doesn't support). `INCONSISTENT` for a fixable mismatch; `MINOR_NOTES`
for cosmetic/metadata; `CONSISTENT` if it all coheres. Mark `regate:true` for
any fix touching a key/option/stem.

## Scope

You are the integration check, not a re-run of the others. Overlap is fine
(defense in depth) — if you catch a language or pedagogy defect they missed,
report it — but your *unique* job is consistency **between** parts. Do not
re-litigate settled design (cloze format, the 5-question cap). Do not rewrite for
style; report what does not cohere.

## Common mistakes

- **Reading dimension-by-dimension.** The whole point is A-vs-B: check the
  rationale *against* the current option, the number *against* the other number,
  the key *against* the passage. A finding without two conflicting loci is not an
  integration finding.
- **Passing because each part is individually fine.** They must agree with each
  other. An internally-perfect rationale that describes the pre-edit option is a
  defect.
- **Skipping the re-quote check after corrections** — that is the highest-yield
  row; corrections are exactly when rationale↔option drift is introduced.
- **A blocker with no `regate` flag** when the fix touches an answer.
