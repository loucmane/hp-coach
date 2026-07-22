# gen-las-short-2 — generator notes

**Unit:** LÄS short, ESSÄ kulturhistorisk (sakprosa / reflective essay). `family: kyrkorgelhistoria-essa-short`.
**Title:** *Vems röst en orgel bär* · byline *Sigrid Hallefors, musikhistoriker* · glossary: `principal`, `stråkstämma`.
**candidate_id:** `PLACEHOLDER` (orchestrator renumbers).

## Topic rationale
A cultural-historical essay comparing two fictional church organs in neighbouring parishes and
what each records about how its congregation imagined music: Björkedal's organ (built 1889 by
invented builder Anders Wessman) made **powerful for congregational hymn-singing**, and Töreby's
organ (rebuilt in the 1930s by invented builder Ivar Sjösten) **softened for the organist's own
playing / listening**. Passage-specific throughout — two invented builders, two invented parishes,
one dated rebuild — so the comparison axis and the whole-text thesis are **internal to the essay**,
not recoverable from general knowledge (law 1; G-STEM). Deliberately avoids anchoring on any famous
real thesis about time/labour discipline or instrument sociology. Distinct from every Batch-1 topic
and from Batch-1's own essä (two herbaria): different domain (organ-building, not botany) and a
different comparison axis — **who music is *for* (the singing crowd vs the listening circle)**,
not precision-vs-memory.

Register: reflective **essä** voice, first person ("Jag har stått på båda läktarna"), moderate LIX,
nominal register with two glossed domain terms that actually appear (`principal`, `stråkstämma`).
**Anti-tidiness (law 9):** the essayist explicitly refuses the neat binary ("Jag ska inte göra
kontrasten renare än den är") — Björkedal also hosted solo concerts, Töreby still fills with song
at Christmas — leaving residue that cuts against the thesis. Ends signed, on a declarative
reflective sentence, not a question.

## Trap architecture (passage and questions are one design — law 2)
- **Q1 `huvudbudskap_syfte` (key C).** Thesis distributed across all four paragraphs ("En orgel är
  inget neutralt redskap"; the sung-vs-listened contrast; the two "svar från en tid"). Key C
  paraphrases the whole-text claim (no verbatim lift — law 3); only C spans **both** organs.
  Distractors:
  - A `detail_as_main` — a true single-paragraph fact about **Töreby** only.
  - D `detail_as_main` — a true single-paragraph fact about **Björkedal** only.
  - B `overgeneralisation` — "varje … aldrig för att lyssnas till"; contradicted by Töreby being
    rebuilt precisely *to be listened to*.
  (Two general options B/C + two specific A/D → no 3-vs-1 form cluster for G-STEM to exploit.)
- **Q2 `jamforelse_relation` (key A).** Directional contrast planted (Björkedal → carry the
  congregation's song; Töreby-after-rebuild → serve the organist). Key A attributes each correctly.
  Distractors:
  - B `reversed_causality` — cross the attributions (concert-play → Björkedal, congregation → Töreby).
  - C `overgeneralisation` — absolutise ("inte längre spela några psalmer över huvud taget"); the
    text says only that it no longer *leads* a hymn with the same power, and the church still sings.
  - D `half_right_conjunction` — "för skilda församlingar" true, "en och samme byggmästare" false
    (Wessman vs Sjösten).

## Self-blind-solve (skeptical, argued each option; rationale hidden)
- **Q1 → C.** A and D are true but single-organ (fail "överensstämmer bäst med texten"); B is
  absolutised and contradicted by Töreby. Only C spans the whole essay. ✔
- **Q2 → A.** B reverses the attribution; C over-absolutises (organ still plays, church still sings);
  D's first clause is false (two different builders). Only A survives. ✔
No item had two defensible options; no rewrite of a two-way question needed.

## Mechanical self-check (run_mech.py, PLACEHOLDER id, full corpus)
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-PLAGIARISM pass.
passage_words 304 (target 290–500), 20 sentences, mean 15.2 w (band [10.1, 36.5]), 4 body
paragraphs + signed/glossed tail. Q1 option words [15,15,13,13] key C not longest; Q2 [15,17,13,12]
key A not longest — no pick-the-longest tell. All options within a question hold one declarative
shape. No option shares a ≥5-token run with the passage (paraphrase-not-copy).
Keys **C, A**; combined with Unit 1 (B, D) the batch spreads A/B/C/D with no positional tell.
