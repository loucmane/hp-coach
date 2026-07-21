---
name: expert-language-review
description: Use when adjudicating generated HP exam reading content (LÄS Swedish or ELF English) for native-expert language quality — before approving a unit for students, when a fluent read says "looks fine," or when reviewing a batch's Swedish/English for calques, register, agreement, spelling-variety, and answer-key language.
---

# Expert language review (HP LÄS / ELF)

## Overview

A fluent read of generated exam prose produces a confident "ship it" that
**misses subtle native-level defects** — the exact failure that matters for paid
student content. On the Batch-1 unit `las-b1-001`, an unguided expert review
called the Swedish "authentic-HP level" and cleared it, yet missed both defects
three independent gate votes caught: the passive infinitive
*"tvilling att jämföras med"* (native takes the **active** — *att jämföra med*)
and the calque *"betjänar grödorna."*

**Core principle: do not read for a verdict — hunt for the known defect
classes.** Fluency is not review. You are a senior HP exam editor. Work the
hunt-list below explicitly, quote every finding, propose the exact fix, and stay
in your lane: **language only.**

## Scope — language only

Review: idiom, register, grammar, agreement, word order, collocation,
spelling-variety, and the **language** of stems/options/keys. **Do NOT** judge
difficulty, pedagogy, content accuracy, or trap design (separate gates own
those) — and never propose an edit that would change which option is correct or
weaken a distractor's trap. If a fix would touch the answer design, flag it for
the trap gate instead of editing.

## Output contract (produce exactly this, per unit)

```
candidate_id, section
language_verdict: PUBLISH_READY | MINOR_EDITS | NEEDS_WORK | REJECT_LANGUAGE
findings: [ { severity: lethal|major|minor,
              quote: "<exact text>",
              defect_class: "<from the hunt-list>",
              suggested_edit: "<the corrected text>",
              why: "<one sentence>" } ]
register_authenticity: one line vs the corpus portrait (populärvetenskaplig
  sakprosa for LÄS; mid-Atlantic magazine for ELF) — authentic-formal and
  literary-colloquial registers are NOT defects.
answer_key_language: confirm each key/option is grammatical and unambiguous as
  language (not whether the key is correct — that is G-KEY's job).
```
`REJECT_LANGUAGE` only for lethal defects (real errors that mislead). Calques,
agreement slips, and passive-infinitive misuse are typically `major` →
`MINOR_EDITS` with the fix supplied. Give a `suggested_edit` for **every**
finding.

## Swedish hunt-list (LÄS) — work every row

| class | what to catch | native fix |
|---|---|---|
| verb calque | anthropomorphic verb+object: *betjänar grödorna*, *spenderade tid*, *ta plats framför* | *pollinerar*, *ägnade/lade tid*, *gå före* |
| **passive infinitive** in the *N att V-inf* purpose frame | *en tvilling att jämföras med* (cf. *en bok att **läsa***) | active: *att jämföra med* |
| BIFF word order | negation/adverb after the verb in a subordinate clause: *eftersom laven växer **inte*** | *eftersom laven **inte** växer* |
| gender / definiteness | *det stora tystnaden*, *det tyst läsande* | *den stora tystnaden*, *det tysta läsandet* |
| non-word / wrong derivation | *slipen* for the grinding process | *slipningen / sliprörelsen* |
| register break | blog/chat in sakprosa: *sjukt*, *typ*, *polare*, direct reader address | rewrite to edited sakprosa |
| frame | glossary defines a word absent from the passage; missing byline/title | define only present words; restore the excerpt frame |

Do **not** flag: authentic formal/archaic register, the bare-noun literary
variant (*det svaga horisontljus*), or deliberate figurative language.

## English hunt-list (ELF) — work every row

| class | what to catch | fix |
|---|---|---|
| Swedish interference | preposition calque *on a conference*; countable *informations/evidences* | *at a conference*; *information/evidence* |
| false friend | *eventually*←*eventuellt* (=possibly); *actual*←*aktuell*; *control*←*kontrollera* | the true English sense |
| spelling-variety drift | one of BrE/AmE held throughout: *sat a test* (BrE) inside AmE; *-ise/-ize*, *colour/color* | match the unit's declared variety |
| collocation | *drive up moths*, *make a research* | *stir/flush up moths*, *do research* |
| ESL / AI tell | symmetric paragraph openers, *delve*, over-hedging, mechanical parallelism | vary; read as edited magazine prose |
| register | clickbait/listicle or textbook-flat, not mid-Atlantic magazine (Economist/New Scientist/SciAm) | recast to the corpus register |
| stem idiom | generic test-bank phrasing — *"Which statement is supported by the passage?"* occurs **0/405** in the corpus | content-anchored stem |

## Grounding

Calibrate register against the measured corpus portraits before judging:
`pipeline/synthetic/las/corpus-analysis.md` and
`pipeline/synthetic/elf/corpus-analysis.md`. The gates you complement live in
`pipeline/synthetic/gates/prompts/G-SPRAK.md` and `G-ENG.md` — this review is
deeper (constructive edits, whole-unit verdict), not a re-run of them.

## Common mistakes

- **"Reads fine" without working the hunt-list** — the calque you skip is the
  one the gates caught. Quote-check every row.
- **Scope drift into difficulty/pedagogy** — both baselines did this; delete it.
- **Flagging authentic formal/literary register as error** — over-firing is a
  failure too; the corpus is often formal and old-fashioned.
- **Suggesting an edit that changes the correct answer or defuses a trap** —
  that is not a language fix; escalate to the trap gate.
- **A finding with no `suggested_edit`** — the deliverable is the fix, not the
  complaint.
