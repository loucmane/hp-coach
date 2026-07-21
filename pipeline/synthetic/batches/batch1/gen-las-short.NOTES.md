# P5 Batch-1 LÄS short — generator notes

Two original LÄS short units (2 questions each), authored against the corpus portrait and
the M-BANDS / M-PLAGIARISM contract. All entities, studies, works and people are **fictional**.

## Unit 1 — `las-b1-001` — DEBATT / opinion sakprosa
**Title:** *Räkna inte bara huvuden i kulturkvarteret* · byline *Ingrid Vallmark* · glossary: `besöksekonomi`.

**Topic rationale.** An op-ed by a fictional resident against her municipality's habit of measuring a
new "kulturkvarter" (culture quarter) by a single visitor-count metric. Chosen because it is a
*passage-specific particular*, not a textbook thesis: the whole item turns on one invented survey
finding (Tärnviksenkäten) and one named metric, so nothing here is answerable from world knowledge.
Edited op-ed register (first person + normative *bör/bedömas*), not blog/chat register.

**Trap architecture.**
- Q1 `forfattarens_hallning` (key **B**). Planted an explicit stance *with a concession* ("kaféerna
  hör hemma", "utställningarna inte misslyckade") so distractors can (A) invert her stance by turning
  a thing she praises into a criticism [reversed_causality], (C) absolutise her scepticism into
  "aldrig går att mäta" [overgeneralisation], and (D) promote her concession to her main point
  [detail_as_main]. Matches the family's top-3 trap profile exactly.
- Q2 `enligt_texten_detalj` (key **C**). Planted one hedged/directional/scoped target: *tycks* +
  kaféer→återkomst (not utställningar→återkomst) + scoped to *återkommande* besökare. Distractors are
  the pure reversal (B), the absolutised/de-hedged version (D, "enbart/helt"), and a group-swap
  scope shift to förstagångsbesökare (A).

## Unit 2 — `las-b1-002` — ESSÄ (kulturhistorisk)
**Title:** *Två herbarier och två sätt att minnas* · byline *Alma Ekwall* · glossary: `herbarium`, `ståndort`.

**Topic rationale.** A cultural-historical essay comparing two fictional 19th-century herbaria — one
ordered by the Linnaean system (knowledge), one by memory and place (remembrance). Passage-specific
throughout (two invented collectors, Selma Wideen / Hedda Molander); the comparison axis and the
whole-text thesis are internal to the essay, not recoverable from general knowledge. Reflective essä
voice, moderate LIX, nominal register with two glossed domain terms.

**Trap architecture.**
- Q1 `huvudbudskap_syfte` (key **A**). Thesis distributed across all four paragraphs and *hedged* in
  the close ("tycks påminna mig om"). Distractors: (B) inverts the essay's own direction — the author
  grows *less* sure the line holds, not more [reversed_causality]; (C) pushes the thesis past its hedge
  into "ingenting ... bara" [overgeneralisation]; (D) lifts a single-paragraph detail (Selma's Latin
  labels) and adds an unstated reliability ranking [detail_as_main].
- Q2 `jamforelse_relation` (key **D**). Directional contrast planted (Selma: system→ordning;
  Hedda: minne/plats→ordning) plus a scoped detail (Hedda "nämner sällan vad blomman heter").
  Distractors: (A) swaps the attributions [reversed_causality]; (B) is half-right — correct on Selma,
  false on Hedda writing Latin names [half_right_conjunction]; (C) absolutises the very
  vetenskap/känsla boundary the essay explicitly dissolves [overgeneralisation].

## Self-solve results (blind, skeptical, rationale hidden)
Solved each item from passage + options only, then checked against the key. Every distractor is a
*named operation on a planted target*, and in each item exactly one option survives:
- **U1Q1 → B.** A praised-not-criticised; C over-absolute ("aldrig"); D is a stated concession, not her
  objection. Single defensible key. ✔
- **U1Q2 → C.** Text says kaféer *not* utställningar (kills B); scoped to återvändande (kills A);
  never says utställningarna worthless (kills D). ✔
- **U2Q1 → A.** Close fuses the two impulses; B contradicts "mindre säker"; C over-absolute; D a
  paragraph detail + unstated ranking. ✔
- **U2Q2 → D.** A reverses the attribution; B false second clause (Hedda seldom names the plant);
  C absolutises a boundary the text resists. ✔
No item had two arguable options; no rewrite needed after self-solve.

## Band compliance (mech.py-equivalent tokeniser)
| item | passage_words | band [188,588] / spec 290–500 | mean_sent_words [10.1,36.5] | prompt_words [3,31] | option_words ≤23 | option_ratio ≤5.25 | key |
|---|---|---|---|---|---|---|---|
| las-b1-001 | 319 | OK | 15.9 | 5 / 12 | max 13 | 1.86 / 2.00 | B, C |
| las-b1-002 | 304 | OK | 16.2 | 6 / 8 | max 15 | 1.36 / 1.50 | D... A/D |

Key letters vary across the four questions (B, C, A, D) — no positional tell.

**Plagiarism.** All prose is original fiction; no verbatim corpus lift. Idioms kept short
("sätta … på kartan") — well under the 17-token n-gram kill threshold; no long shared runs.
Options paraphrase the passage (synonym-shift / re-clausing); no passage sentence is copied verbatim
into any option.

**Native-Swedish pass.** Read aloud as a native: BIFF correct in subordinate clauses
("jag tvivlar inte på att", "att gränsen håller"), noun/adjective agreement checked, no anglicisms,
no calques. Register is edited sakprosa/essä throughout — no blog/chat markers.
