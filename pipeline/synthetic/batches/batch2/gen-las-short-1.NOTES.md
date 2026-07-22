# gen-las-short-1 — generator notes

**Unit:** LÄS short, DEBATT / opinion (sakprosa). `family: skolmatslogistik-debatt-short`.
**Title:** *Vad centralköket inte kan väga* · byline *Birgitta Åkerlund, skolkock i Kvarnby* · glossary: `tillagningskök`, `mottagningskök`.
**candidate_id:** `PLACEHOLDER` (orchestrator renumbers).

## Topic rationale
An op-ed by a fictional school cook against her municipality's decision to close the
seven local school kitchens (*tillagningskök*) and cook everything in one central kitchen
(*mottagningskök*) that delivers meals. Chosen because the whole item turns on
**passage-specific particulars** — an invented municipal decision (Kvarnby → centralköket i
Almvik), one invented cost figure (fyra kronor per portion), and one invented neighbouring-
municipality trial (Rörsta) — so nothing is answerable from world knowledge (law 1; G-STEM).
Distinct from every Batch-1 topic (culture-quarter metrics, light-pollution/moths, herbaria,
board-game cafés, bat-timing owls, lantern-keepers, late-life cognition). Register is **edited
op-ed sakprosa**: first person + normative modality (*bör*, *borde*), an explicit stance with a
genuine concession, no blog/chat markers (G-SPRÅK class 5).

**Anti-tidiness (law 9):** the passage grants real ground to the other side (central kitchen is
cleaner, allergy labelling *safer*), leaves the Rörsta cause openly unexplained ("Ingen vet säkert
varför"), and carries concrete residue (smell of fried onion at ten, cold sandwiches "don't matter
where packed") that does not all point at the answer. Ends signed, on a declarative normative
sentence — **not** on a rhetorical question (blueprint: 0 % of authentic passages close on a
question).

## Trap architecture (passage and questions are one design — law 2)
- **Q1 `forfattarens_hallning` (key B).** Planted an explicit stance ("kommunen räknar på fel sak";
  "något som ingen kalkyl fångar") **with a concession** (hygiene/allergy safety improve; cold food
  fine anywhere), so distractors are named operations on the stance:
  - A `overgeneralisation` — absolutise ("aldrig ... i varje skolas eget kök"); contradicted by her
    stated refusal to demand a kitchen per school.
  - C `reversed_causality` — invert a **conceded** point: she says allergy labelling gets *säkrare*;
    C claims she calls the central kitchen *less* safe for allergic pupils.
  - D `detail_as_main` / `true_but_irrelevant` — the 4 kr figure is real (she writes "fyra kronor är
    fyra kronor"); D promotes "the saving is too small" to her main claim, which she never argues.
- **Q2 `enligt_texten_detalj` (key D).** Planted one **hedged + directional + scoped** target: waste
  *tycktes* rise (hedge), delivery → more waste (direction), "framför allt hos de lägre klasserna …
  nästan bara … varm mat" (scope). Key D paraphrases it (no verbatim lift — law 3). Distractors:
  - A `reversed_causality` — flip the arrow (high waste → the switch).
  - B `overgeneralisation` — strip the scope ("alla elever, oavsett rätt").
  - C `scope_shift` — answer Kvarnby's cost projection, not the Rörsta waste trial.

## Self-blind-solve (skeptical, argued each option; rationale hidden)
- **Q1 → B.** A contradicted (she doesn't demand a kitchen per school); C contradicted (allergy
  safety conceded as *better*); D unsupported (she accepts the saving, disputes what is optimised,
  not the amount). Only B survives. ✔
- **Q2 → D.** A reverses the causal arrow; B deletes the passage's explicit scope; C imports the
  cost metric from Kvarnby's projection (never claimed of Rörsta). Only D survives. ✔
No item had two defensible options; no rewrite of a two-way question needed.

## Mechanical self-check (run_mech.py, PLACEHOLDER id, full corpus)
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-PLAGIARISM pass.
passage_words 320 (target 290–500), 20 sentences, mean 16.0 w (band [10.1, 36.5]), 5 paragraphs.
Q1 option words [16,15,12,13] key B not longest; Q2 [16,13,11,14] key D not longest — no
pick-the-longest tell. Options per question hold one grammatical shape (Q1 all *Att…*; Q2 all
declarative). No option shares a ≥5-token run with the passage (paraphrase-not-copy).
Keys **B, D**; combined with Unit 2 (C, A) the batch spreads A/B/C/D with no positional tell.
