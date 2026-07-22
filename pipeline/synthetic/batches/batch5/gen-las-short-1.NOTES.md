# NOTES — gen-las-short-1 (klimatanpassning: snöhantering)

## Topic & genre rationale
- **Topic:** everyday climate adaptation in a Swedish town — the *snow-logistics* angle
  from the exclusive pool. Concretely: where a municipality dumps plowed snow and what its
  meltwater carries into the receiving lake. Chosen because it is distinct from every
  batch 1–4 topic and from the pool's other angles (heat waves, stormwater); it is not a
  neighbour of the used "urban-quarter renewal" or "living walls" items.
- **Genre:** sakprosa / populärvetenskap reportage, `result-lede` opening. Register inherits
  from genre: nominalisation (`slitagepartiklar`, `sedimentfälla`, `mätserien`), an `-s`-passive
  (`flyttades`, `leddes`), one glossed domain word (`recipient`, which appears in the passage).
- **Frame:** title line (not repeated in passage), fictional byline last (Karin Löfgren),
  glossary at the very tail defining a word that actually occurs.

## Planted trap architecture

### Q1 — `enligt_texten_detalj` (key C)
Planted target (para 3): a **hedged, directional, scoped** finding — the sediment trap held
back *coarse particles and their bound metals* while *dissolved road salt passed through
nearly unchanged* (crystallised in the fictional quote "Vi fångar gruset, inte kloriden").
- **B = reversed_causality**, deliberately **hedged in form but false in content** (a direction
  reversal: it says the basin mainly caught the *salt* and let the coarse particles through).
  This is the batch-3 lesson applied — the key is NOT the sole qualified/hedged option; the
  hedge lives on a wrong distractor.
- **A = overgeneralisation** — "helt från både salt och grova partiklar" absolutises the scoped
  result the text explicitly limits.
- **D = scope_shift** — moves the finding from the basin outflow to the whole lake's salt level,
  which the text says explicitly *cannot yet be established*.
- Key C is the confident, specific claim (not a bare hedge) → breaks the "pick the qualified
  answer" shortcut (Law 10).

### Q2 — `huvudbudskap_syfte` (key A, "bäst"-item)
Whole-text thesis: *where you put the snow affects meltwater quality, though the benefit is
partial and disputed* — spans lede + finding + caveats.
- **B = detail_as_main + distortion** — cost is a real sub-point, but the text says cost went
  *up*, so "done mainly to cut costs" is both a promoted detail and factually reversed (Law 11:
  not verbatim-true).
- **C = overgeneralisation** — "single largest pollution source for all the town's lakes"; the
  text never ranks sources.
- **D = reversed inference** — "salt is harmless as long as the coarse particles are caught"
  contradicts the text's point that the dissolved salt is precisely the *unsolved* problem.
- No distractor is verbatim-true (Law 11 satisfied).

## Self-blind-solve (skeptical, from passage alone)
- Q1 → **C** only. Argued for B: killed by "Vi fångar gruset, inte kloriden" (direction is the
  opposite). A killed by the explicit statement that salt passed through. D killed by the
  explicit "går ännu inte att belägga att salthalten skulle ha sjunkit". Single defensible answer.
- Q2 → **A** only. B contradicted (cost rose; motive was water quality). C unsupported ranking.
  D contradicted. Single defensible answer.
- Key spread: C, A (no positional/column tell). Key is not the longest option in either question
  (Q1 longest = B; Q2 longest = D).

## Mechanical self-check
`run_mech.py` on both files: M-SCHEMA / M-BANDS / M-TELL / M-PLAGIARISM all **pass**.
