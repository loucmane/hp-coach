# Batch17 — stage 2 assembly record (2026-08-26)

Seven generators (claude-opus-5, parallel, disjoint lanes) under the batch16
rule set (1–10) with batch17's updated exclusions (107 families, 231 given
names, 274 pairs, near-duplicate-surname refinement). All seven self-ran mech
clean. Canonical shape: 7 units, 20 questions (LÄS 4+2+2, ELF 5+5+1+1).

## Id map

| candidate_id | source | family | q |
|---|---|---|---|
| las-b17-001 | gen-las-long | tandstickstillverkning-facktext-long | 4 |
| las-b17-002 | gen-las-short-1 | farthinder-villagator-debatt-short | 2 |
| las-b17-003 | gen-las-short-2 | skolplanschernas-handledningar-essa-short | 2 |
| elf-b17-001 | gen-elf-long | contrail-avoidance-ice-supersaturation-science-journalism-long | 5 |
| elf-b17-002 | gen-elf-cloze | ELF-CLOZE-001 / lost-property-office-counter-trust-society-commentary-cloze | 5 |
| elf-b17-003 | gen-elf-short-1 | ELF-TYPE-001 / canal-lock-mitre-gate-unanchored-heel-pin-engineering-short | 1 |
| elf-b17-004 | gen-elf-short-2 | ELF-TYPE-002 / milk-round-sale-thirteen-week-deduction-history-essay-short | 1 |

## Name sweep

Zero intra-batch given-name duplicates; zero bank given-name reuse (rule 8) —
second consecutive batch fully clean at assembly. Generators ran live sibling
sweeps during authoring (elf-long dropped a clean surname to avoid growing
the Quilvey/Quillenby/Quennerly cluster; dropped "Idris" as a one-letter
variant of listed "Iris"; las-long dropped "Ryndahl" on a real one-letter
neighbour in a related field).

## Flags carried to the fleet and V-FINAL

1. **Law-16 degraded batch-wide, worse than batch16**: WebSearch exhausted;
   Mojeek/DDG/Brave/Startpage/Ecosia/SearXNG bot-blocked for most units;
   Firecrawl 401. Units used varying validated indexes (Nominatim, Libris
   xsearch, Wikipedia CirrusSearch insource:, forebears.io, Brave when it
   answered, Exa) with POSITIVE CONTROLS — two indexes were discarded on
   failed controls (Bing false zero on "Fengersfors"; Marginalia failed
   "Pargeter"). ALL kept names are FLAGGED for V-FINAL exact-phrase
   re-verification; several full-name pairs were never searched as pairs
   (inference from parts, logged as such per unit).
2. **Declared residuals for reviewers**: las-b17-003 Q2/D is the option most
   likely to draw MULTIPLE_DEFENSIBLE (defeated by an explicit essay
   argument — look first); elf-b17-003 length 179 vs blueprint 160 and
   fk_grade 7.2 (inside shipped spread, declared); "Skedvall" is one letter
   from real "Sedvall", "Bräddlund" two from "Brattlund" (recorded, no
   answer-design dependence); las-b17-002's three street names inside the
   invented kommun are unverified ordinary formations (no uniqueness claim).
3. **Anti-leak at authoring time** (las-b15-003 lesson institutionalized):
   las-b17-003 spreads its thematic keyword across distractors in both
   questions; las-b17-001 rewrote Q3 to remove a cross-question trap
   repetition; elf-b17-001 killed a two-true-options defect in self-solve.
4. **Hedge maps (rule 10)**: heuristic hit-rate 1/4, 0/2, 0/2, ≤1/5, 0/5,
   0/1, 0/1 — all at or below half.
5. **Audit severity contract** (standing): findings[].severity ONLY from
   {minor, note, info}; history in resolved_findings/cleared.
6. Written dispositions owed for any named adjacency per the 2026-08-26
   process rule.
