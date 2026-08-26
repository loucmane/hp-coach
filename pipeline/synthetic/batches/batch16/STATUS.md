# Batch 16 — status: PIPELINE COMPLETE — 7/7 promote PASS 2026-08-26 (round 3), awaiting owner adjudication

**7 units, 20 questions** — the same shape as batch15 (LÄS 4+2+2, ELF 5+5+1+1), but the
first P5 batch that needed **three rounds**. All seven were authored under
`BRIEF-ADDENDUM.md`, the binding tells addendum that collects every gate conviction and
owner flag from batches 1–14, and batch16 is the first batch written under the owner
policies of 2026-08-26: **bank-wide given-name uniqueness** (rule 8) and **declared hedge
balance** (rule 10).

| unit | title | q | family |
|---|---|---|---|
| las-b16-001 | Tegel från Sölvinge (19th-c. brickworks) | 4 | tegelbrukshistoria-facktext-long |
| las-b16-002 | Sextioen elever och tjugotre turer (rural school transport) | 2 | skolskjuts-landsbygd-debatt-short |
| las-b16-003 | Måtten på en midsommarstång (local maypole forms) | 2 | midsommarstangens-lokalformer-essa-short |
| elf-b16-001 | Smoke in the Skins (smoke taint / bound phenols) | 5 | smoke-taint-…-science-journalism-long |
| elf-b16-002 | Past the Brewery (landmark directions) | 5 | ELF-CLOZE-001 |
| elf-b16-003 | Open Joints (cavity-wall drainage) | 1 | ELF-TYPE-001 |
| elf-b16-004 | Sixpence a Night (village pound / stray fines) | 1 | ELF-TYPE-002 |

## Rounds

| round | what ran | outcome |
|---|---|---|
| **Round 1 — fleet + reviews + V-FINAL** (`verdicts-round1/`, `verdicts-vfinal-round1/`, `reviews-round1/`, `audits-round1/`, `report-round1.json`) | mech 35, G-KEY ×2 fleet + ×2 V-FINAL, G-STEM, G-DISTRACTOR, G-REGISTER, G-SPRÅK ×3, G-ENG ×3, 7 meta-audits | **0 gate kills.** **3 PASS** (elf-b16-001, elf-b16-004, las-b16-001) and **4 V-FINAL REFUTED**: elf-b16-002 (passage self-contradiction one sentence apart), elf-b16-003 (key was the sole wind-bearing option against a wind-framed stem), las-b16-002 (a one-grep-falsifiable originality claim carrying the whole name decision), las-b16-003 (q:2 still blind-solvable from q:1's stem + option form) |
| **Round 2 — repairs + full fresh fleet + reviews + V-FINAL** (`verdicts/`, `verdicts-vfinal/`, `reviews/`, `audits/`, `report.json`) | the whole fleet re-run on **all seven** units; 7 fresh meta-audits | All four tickets discharged — but **3 new holds**: las-b16-001 **INCONSISTENT** at integrated (chronology: the magasin wall dated by the passage's own arithmetic to 1879, five years before the 1884 ring kiln whose chamber effect is the entire support for q:2's key); las-b16-002 audit **REFUTED**, 2 majors (round 3's own closure of the open G-STEM q:2 flag was false against the bytes round 3 installed, and the repair_log contradicted itself round-3-vs-round-4); elf-b16-003 blocked on a **crash seam** — `reviews/pedagogy.jsonl` carried 8 lines but only 6 distinct ids (elf-b16-004 and las-b16-003 duplicated), so the option set a pedagogy MAJOR had forced a rewrite of was never re-reviewed by the stage that adjudicates blind answerability |
| **Round 3 — repairs + leg wave + re-issued audits** (`verdicts-r3/`, `candidates-final/`, `audits/{elf-b16-003,las-b16-001,las-b16-002}.json`) | 3 units repaired; G-KEY ×2, G-STEM, G-DISTRACTOR, G-SPRÅK ×3 (`target: unit`), G-ENG; 3 re-issued meta-audits | **0 kills.** G-KEY **14/14**. G-DISTRACTOR 7/7 pass. G-SPRÅK 3 runs × 2 units, **zero findings** (the two rebuilt Swedish option strings finally read by a language leg). G-ENG 1 run on elf-b16-003, pass. G-STEM 3 flags, all self-defended as *flag, not kill*. All three re-issued audits **CONFIRMED_NOTES, 0 majors** |

**Repairs** are append-forward in each candidate's `generator_meta.repair_log`
(elf-b16-003 reached round 5, las-b16-002 round 5). **No key letter changed in any unit,
in any round.** Passage edits: elf-b16-002 (two ¶3 sentences), elf-b16-003 (one pronoun
clause), las-b16-001 (the wall date `tjugofem år`→`femton år`, one ¶5 routing sentence,
plus an unlogged language fix `vidgade`→`utvidgade`), las-b16-002 (municipality rename
`Ödsmyra`→`Flarkbro`, opening clause, glossary POS match). Option-set rebuilds:
elf-b16-003 q:1 A/B/C (round 2) and B (round 5), las-b16-002 q:2 B/D (rounds 3 and 5),
las-b16-003 q:2 A/B/C/D and q:1 A/B (round 2).

## Final state

- **Promote: 7 PASS / 0 HOLD.** Aggregate `report-final.json`: 5× SURVIVED_FLAGGED,
  2× SURVIVED_CLEAN, 0 DEAD, 0 INCOMPLETE.
- **Fold: 7× VERIFIED_NOTES** (`reviews/final_verify.jsonl`, re-folded 14:42:58 after the
  three audit re-issues), `audit_major=0` on every unit.
- **Blind-solve agreement: 174/174 across 10 unique legs.** G-KEY ran two fleet legs and
  two V-FINAL legs in each of rounds 1 and 2 (4 × 20 = 80 + 80), plus two fresh legs in
  round 3 over the 7 re-legged questions (14). **Every committed answer matched the key** —
  no deviation in any leg, any round, any question, before or after any repair. Counted on
  legs, not files: `*-resolved*` files merge the round's two legs, `*-1v`/`*-2v` are the
  same legs with `vote` applied, and `verdicts-vfinal/verdicts-gkey-zr3.jsonl` is
  **byte-identical** to `verdicts-r3/verdicts-gkey-resolved-v.jsonl`. Beyond the fleet, the
  three re-issued audits cold-solved their units independently, defending every non-key
  first: **7/7 against the key** (las-b16-001 4/4, las-b16-002 2/2, elf-b16-003 1/1).
- **Merged `verdicts.jsonl`: 157 records** — G-STEM 10 pass / **10 flags**, G-SPRÅK 11 pass
  / 4 flags, G-REGISTER 6 pass / 1 flag, G-DISTRACTOR 20/20 pass, G-ENG 13/13 pass, mech
  35/35. *Note: the file's raw G-KEY count is 47, but only 40 are distinct — round 3's
  leg 2 appears twice, once with `vote: 2` and once without a `vote` field, with identical
  `justification` bytes. Verified record by record; no verdict or answer differs. See
  `ADJUDICATION.md` § 8b.*
- **Canonical mech: 35/35** — M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM
  (`verdicts/verdicts-mech.jsonl`, 12:47). **M-ECHO was not in the fleet run** (same gap as
  batch15), and the run predates the shipping bytes of three units. Mitigations are uneven:
  the elf-b16-003 auditor re-ran **all six gates on the exact shipping bytes** (all pass,
  114 units indexed); las-b16-002 round 5 and las-b16-001 round 3 both report six-gate
  re-runs but left no verdict file.
- **0 self-kills in any round:** G-DISTRACTOR 0 kills (one ARGUABLE on elf-b16-001 q:4 in
  V-FINAL, explicitly "the key remains clearly best"), G-STEM 0 kills. **10 of 20 questions
  carry a live G-STEM major flag**, each self-defended as *flag, not kill*; **3 of the 10
  have a written stage disposition** (elf-b16-003 N1, las-b16-002 F3, las-b16-001 F4).
- **Sheet integrity: 21/21 machine-verified.** All seven units' `blind/`, `stems/` and
  `distractor/` sheets byte-match `candidates-final/` on passage, prompt, every option text
  and key. This is the check whose absence let las-b16-002's false closure survive two
  rounds — at commit 935f0e4 its `stems/` sheet was stale, so no G-STEM leg had ever read
  the option set the closure was about.
- **Real-entity (law 16): degraded batch-wide again, partly discharged.** The session's
  WebSearch budget was exhausted (200/200) before name checking; all generation-time checks
  ran through Exa semantic search plus, in some units, a direct sv.wikipedia search-page
  fetch. No generator certified. **Two of seven units were re-verified in round 3**:
  elf-b16-003 (`"Pellowden"` — zero bearers of the exact string; nearest neighbours
  Pellow/Pellowe/Pellew/Pellen, none in building or surveying; rules 8 and 9 clear) and
  las-b16-002 (`Flarkbro` / `Brantmyr` / `Näversved` — sv.wikipedia CirrusSearch exact
  phrase 0/0/0 **with a positive control on the same endpoint in the same session**,
  `"Flarken"` → 56 hits; OSM Nominatim 0; 0 in-bank; 0 across the 27-exam authentic
  corpus). **Five units had no re-check at all**, and elf-b16-001's `originality_note`
  still carries a false provenance sentence (it credits `gen-elf-short-2` with taking
  "Brindlow"; elf-b16-004's byline is Aveline Hemblow, and it was elf-b16-003's generator
  that rejected Brindlow on a live in-trade collision, Robert Brindlow of Vent-Axia).

## Assembly notes carried into adjudication

- **Cross-batch near-pair, no written disposition:** batch15's elf-b15-002 ships *Verity
  **Quennerby*** and elf-b16-001 ships *Tamsin **Quennerly*** — one letter apart, both
  invented. `ASSEMBLY.md` handed it to G-REGISTER deliberately; **G-REGISTER's disposition
  is a bare pass with zero findings, in both rounds.** Second batch in a row with that
  pattern (batch15 § 3).
- **Intra-batch name sweep clean** on both axes at assembly: zero given-name dups, zero
  bank given-name reuse. Three collisions were prevented *during* generation by the
  generators' own sibling sweeps (Boel→Gertrud; Aveline Brindlow→Hemblow; Corin
  Brindlow→Pemberdine).
- **Same-batch material adjacency** las-b16-001 (brickworks, SV) vs elf-b16-003
  (cavity-wall drainage, EN) was flagged for a written disposition; the elf-b16-003 auditor
  supplied one under `cleared` ("Different section, different language, different subject —
  kiln practice versus water movement through a modern cavity wall. M-ECHO passes.").
- **`_ABSOLUTIZERS` gap found at gate source.** `gates/scripts/mech.py:333–341` lists
  `none` but not `nothing` (nor Swedish `ingenting`), which is why M-FORM passed a round-1
  option set where strip-the-absolutes in the flag-word form students are taught left the
  key as the sole survivor. Measured additively for this package: across the whole shipped
  bank (114 units, 333 questions) M-FORM flags **0** today and **0** with `nothing` +
  `ingenting` added — but the same extension **would** have flagged elf-b16-003's round-1
  bytes.

## Pointers

- **Owner surface:** `ADJUDICATION.md` — full passages, all 20 questions with keys marked,
  flags file-attributed, and the eight **ÄGARBLICK** decisions. Passages and questions are
  injected from `candidates-final/` and byte-verified against it.
- Aggregate: `report-final.json` (canonical, round 3) · `report.json` (round 2) ·
  `report-round1.json` (round 1)
- Merged verdicts: `verdicts.jsonl` (157 records) · `verdicts-round1.jsonl` (143)
- Gate rounds: `verdicts-round1/` → `verdicts-vfinal-round1/` → `verdicts/` →
  `verdicts-vfinal/` → `verdicts-r3/`
- Reviews: `reviews/{language,pedagogy,integrated,final_verify}.jsonl` · round 1 in
  `reviews-round1/`. The `reviews/` files are append-forward across rounds 2 and 3; the
  **last** record per unit is canonical (las-b16-001's integrated INCONSISTENT is superseded
  by MINOR_NOTES; elf-b16-003's pedagogy record was added in round 3 at 14:13:12).
- Meta-audits: `audits/*.json` (7; **elf-b16-003, las-b16-001 and las-b16-002 are re-issued,
  dated 2026-08-26, and carry the dispositions, cold solves, source verifications and law-16
  re-checks**) · round 1 in `audits-round1/`
- Gate input sheets: `blind/` (passage, no keys), `stems/` (no passage), `distractor/`
- Briefs and assembly: `BRIEF-ADDENDUM.md`, `ASSEMBLY.md`, `gen-*.json` + `gen-*.NOTES.md`
- Shipping artifacts: `candidates-final/*.json` — **`candidates/`,
  `candidates-corrected/`, `candidates-final-round1/` and `candidates-corrected-round1/`
  are stage evidence, not the shipping bytes.**

## Open items for the owner (detail in `ADJUDICATION.md`)

1. **Stance-composition channel (las-b16-002)** — ruled TOLERABLE on an empirical corpus
   measurement (5 of 8 authentic LÄS stance items skew the same way, key on the skewed side
   in all five); the auditor asks for it to be **lifted to bank policy**.
2. **mech `_ABSOLUTIZERS` gap** — `none` present, `nothing` absent, verified at gate source;
   fixing it is a gate change needing its own bank-wide run.
3. **Quennerby / Quennerly** — cross-batch near-pair, bare G-REGISTER pass twice.
4. **las-b16-002 F2 and F4** — the stycke-6 surface support for distractor C (carried, not
   repaired, to avoid a G-SPRÅK + G-REGISTER re-gate) and the honest adversarial blind floor
   of 1-in-2 rather than the leg's 1-in-3.
5. **elf-b16-003** — a live G-STEM WORLD_KNOWLEDGE flag and a live G-REGISTER genre major,
   both dispositioned SHIP in the re-issued audit. Confirm or overrule. (The gate itself
   said the passage "sits at the edge of the exemplar genre range rather than outside it;
   adjudication decides.")
6. **Layer-2 render spec** — strip snake_case taxonomy labels (112/114 units), replace
   *hedgat* (30/114), and strip gate-internal heuristic/meta commentary from `rationale`
   before student prose. The shipped explanation store already carries none of them; the
   property is undocumented.
7. **Law 16 degraded (Exa era)** — 2 of 7 units re-verified live; ~20 full names across the
   other five still rest on generation-time Exa, plus one false provenance sentence to
   correct and one full name (*Corin Pemberdine*) never searched as a pair.
8. **Batch-wide process gaps** — M-ECHO absent from the fleet run and mech predating three
   shipping files; 7 duplicate G-KEY records in the merged `verdicts.jsonl`; a stale
   G-SPRÅK quote in `report-final.json` plus one shipped student-facing repair with no
   `repair_log` line; two carried round-1 items in elf-b16-001; one G-STEM major whose blind
   pick lands on a distractor (elf-b16-001 q:2, pick A, key D); and las-b16-003's three live
   G-SPRÅK minors on the same sentence ("Stommen bär bara skelettet.") — the one item the
   package recommends **changing**.

**On owner approval**, the 7 units enter the product-bank import.
