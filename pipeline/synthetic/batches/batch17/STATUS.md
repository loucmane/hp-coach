# Batch 17 — status: PACKAGE REOPENED (append-forward) — 3 stale-stems G-STEM re-reviews pending, ruling 2026-08-31

> **Återöppnad 2026-08-31 (append-forward, ägardom):** den nya arkssynk-grinden fann att stems-arken för elf-b17-003, las-b17-001 och las-b17-002 bar för-reparationslydelser — G-STEM-benen läste inaktuella byten för de tre enheterna. Arken är regenererade ur slutliga kandidatbyten; tre oberoende G-STEM-granskningar routas genom Gas City. Paketgodkännandet kvarhålls INTE förrän alla tre är dispositionerade. Historisk rad före återöppningen: »Batch 17 — status: COMPLETE — 7/7 units (20q) shipped, promote CLEAN«.


> **Paketdom 2026-08-31 (bead hpf-y8ra):** ägaren dömde »GODKÄNN PAKETET as 7/7 GODKÄNN_NOTED«. Båda verkställda enhetsdomarna (Q2/D motsagd-ej-medgiven, hpf-y75e; »komma ifrån«, hpf-hzks) accepterade. G-STEM PARTIALLY_ANSWERABLE bevaras som kalibreringsevidens — ingen ny redigeringsloop. Historisk statusrad före domen: »PIPELINE COMPLETE — 7/7 promote PASS 2026-08-26 (round 2), awaiting owner adjudication«.


**7 units, 20 questions** — the canonical P5 shape (LÄS 4+2+2, ELF 5+5+1+1), authored under
`BRIEF-ADDENDUM.md`: batch16's rule set 1–10 (key shuffle, ”…” quotes, spaced en dash never em
dash, law-16 with exact-phrase-first and honest tool logging, LÄS option register + short-breath
floor, ELF byline, RULE 8 bank-wide given-name uniqueness, RULE 9 full-pair exclusion, RULE 10
hedge balance ≤ half) with batch17's updated exclusions — **107 families, 231 given names, 274
pairs**, plus RULE 8's new near-duplicate-surname clause.

| unit | title | q | family |
|---|---|---|---|
| las-b17-001 | Fem millimeter paraffin (match manufacture, paraffin depth, afterglow) | 4 | tandstickstillverkning-facktext-long |
| las-b17-002 | Vad som händer mellan två farthinder (speed humps, kommun debate) | 2 | farthinder-villagator-debatt-short |
| las-b17-003 | Tjugo sidor anvisningar (school-chart teacher guides) | 2 | skolplanschernas-handledningar-essa-short |
| elf-b17-001 | Two Thousand Feet (contrail avoidance, ice-supersaturated layers) | 5 | contrail-avoidance-ice-supersaturation-science-journalism-long |
| elf-b17-002 | Ninety Days (lost-property office, counter trust) | 5 | ELF-CLOZE-001 |
| elf-b17-003 | Loose at the Foot (canal lock mitre gate, unanchored heel pin) | 1 | ELF-TYPE-001 |
| elf-b17-004 | Selling the Doorstep (milk-round sale, thirteen-week deduction) | 1 | ELF-TYPE-002 |

## Rounds

| round | what ran | outcome |
|---|---|---|
| **Round 1 — gate fleet** (`verdicts/`, `report.json`) | mech ×5 gates, G-KEY ×2 legs, G-STEM, G-DISTRACTOR, G-REGISTER, G-SPRÅK ×3, G-ENG ×3 | **0 kills — no unit died at the fleet.** mech 35/35 · G-KEY 2 legs × 20, every answer matching · G-STEM 12 pass / **8 flag** · G-DISTRACTOR 19 pass / 1 flag (las-b17-003 q:2/D) · G-REGISTER 7/7 with zero findings · G-SPRÅK 9 legs → 1 unit flagged (las-b17-003: 1 major + 2 minors, leg 3 only) · G-ENG 12 legs → **0 findings** |
| **Round 1 — reviews + V-FINAL** (`reviews/`, `audits/`, `verdicts-vfinal/`) | language, pedagogy, integrated, 7 meta-audits, G-KEY ×2 + G-DISTRACTOR on shipping bytes | **1 REFUTED** (elf-b17-001, 1 audit major: paragraph 5 treated the control flights' no-detection results as having established that the forecast was wrong, and booked that finding as a product of centre paperwork). Round-1 tally: **6 PASS / 1 HOLD / 0 DEAD** — the strongest first pass in P5 (batch15 round 1: 2 DEAD + 1 REFUTED + 1 INCONSISTENT; batch16 round 1: 4 REFUTED of 7) |
| **Repairs** (`generator_meta.repair_log`, append-forward) | 1 unit, 2 tickets | **Round 2** (repair-agent): ¶5 epistemics — three sentences inserted after the four-causes list plus `Both of those` → `The second of those … and needed no picture at all`; ¶3 now names both effects; Q3 refiled ELF-TYPE-001 → ELF-TYPE-002 in question, `question_families` and `question_geometry` together; five rationale repairs. **Round 2b** (orchestrator, declared): G-ENG's 3-of-3 major (`spend room on` → `give room to`) plus the fault-partition clause and `points the same way` → `reads it the same way`. Separately, **elf-b17-003's option B** was rewritten at the corrected→final step to answer its G-STEM flag — the batch's only option change. **No key letter changed in any unit, in any round** |
| **Round 2 — re-leg** (`verdicts-r2/`, `report-final.json`) | G-KEY ×2 legs, G-DISTRACTOR, G-ENG ×3 — elf-b17-001 only | **0 kills.** G-KEY 2 legs × 5 = 10, every answer matching · G-DISTRACTOR 5/5 pass · G-ENG 3 legs → 15 findings: **1 major, identical in all three legs**, applied in 2b; 14 minors, **12 of them 1-of-3 and unapplied** |
| **Round 2 — fresh audit + fold** (`audits/elf-b17-001.json` re-issued, `reviews/final_verify.jsonl`) | meta-audit on the post-2b bytes; vote-stamped legs mirrored into `verdicts-vfinal/` as `*-zr2.jsonl` | **7× CONFIRMED_NOTES** (0 majors; 30 findings total) · fold **7× VERIFIED_NOTES** · **promote 7 PASS / 0 HOLD** |

## Final state

- **Promote: 7 PASS / 0 HOLD.** Aggregate `report-final.json`: 5× SURVIVED_FLAGGED,
  2× SURVIVED_CLEAN, 0 DEAD, 0 INCOMPLETE. (`report.json` is the round-1 fleet aggregate;
  `report-final.json` adds elf-b17-001's three round-2 G-ENG flag blocks.)
- **Fold: 7× VERIFIED_NOTES** (`reviews/final_verify.jsonl`), `audit_major=0` on every unit,
  `audit_minor` 11 / 2 / 3 / 2 / 5 / 3 / 4.
- **Blind-solve agreement: 90/90 across 6 unique legs.** G-KEY ran 2 legs × 20 questions in the
  fleet (`verdicts/verdicts-gkey-{1,2}.jsonl`), 2 legs × 20 in V-FINAL on shipping bytes
  (`verdicts-vfinal/verdicts-gkey-{1,2}.jsonl`), and 2 legs × 5 in the elf-b17-001 re-leg
  (`verdicts-r2/verdicts-gkey-{1,2}.jsonl`). **Every committed answer matched the key** — no
  deviation in any leg, any round, any question, before or after repair. Counted from the raw
  leg files: the merged `verdicts.jsonl` carries 45 G-KEY records where disk holds 50, a
  consequence of the vote-field dedup (see open item 7).
- **Canonical mech: 35/35** — M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM
  (`verdicts/verdicts-mech.jsonl`). **M-ECHO was not in the fleet run** (same gap as batch15);
  all seven generators self-ran it clean against 107 shipped units pre-assembly, and the
  elf-b17-001 auditor re-ran all five gates on the post-2b bytes (5/5).
- **0 self-kills:** G-DISTRACTOR 0 kills / 1 flag; G-STEM 0 kills / 8 flags. 8 of 20 questions
  carry a live G-STEM major, each self-defended by the gate as *flag, not kill*; **2 of the 8
  have a written disposition downstream of the gate** (elf-b17-003 q:1 — option B actually
  rewritten; las-b17-001 q:4 — audited and recorded). G-STEM was **not** re-run on elf-b17-001
  after its paragraph-3 repair.
- **Real-entity (law 16): degraded batch-wide and not discharged.** WebSearch was exhausted
  (200/200) before the first name query in **every** generator lane. The addendum's two-index
  fallback was largely unavailable: Mojeek 403 (JS captcha in one lane), DuckDuckGo/lite 403,
  Startpage/Ecosia bot challenges, SearXNG 403/429, Brave 403 in two lanes and 429 in two more,
  **Firecrawl search HTTP 401 in every lane**. Positive-control discipline held: **Bing was
  discarded on a false zero** for the real village *Fengersfors*, and **Marginalia was discarded**
  for returning the help page on the real surname *Pargeter*. Kept indexes each passed a control
  (Nominatim / forebears.io / Libris xsearch / Wikipedia CirrusSearch `insource:` / sv.wikipedia
  exact-phrase / Exa). **Exactly one of seven units was re-verified at audit** — elf-b17-001,
  whose `cleared` block carries a `REAL-ENTITY SURFACE (law 16 standing audit duty)` item reading
  CLEAR for all three names. The other six units' ~15 full names and 2 toponyms still rest on
  generation-time evidence; several full-name pairs were never searched as pairs and are logged
  as inference. No unit ran the eight-phrase Tier-2 sweep from `elf/anti-plagiarism.md`.

## Assembly notes carried into adjudication

- **Intra-batch and bank name sweep clean:** zero given-name duplicates inside the batch, zero
  bank given-name reuse (rule 8) — second consecutive batch fully clean at assembly. Generators
  ran live sibling sweeps while authoring and dropped names on real-neighbour grounds
  (`Ryndahl` on Rikard Ryndal; `Ternhage` on Gunnar Ternhag; `Idris` as a one-letter variant of
  listed `Iris`).
- **Declared residuals, named before any gate ran:** las-b17-003 Q2/D as the option most likely
  to draw MULTIPLE_DEFENSIBLE; elf-b17-003's length (179 vs blueprint 160) and fk_grade 7.2;
  `Skedvall` one letter from real `Sedvall` and `Bräddlund` two from real `Brattlund`;
  las-b17-002's three street names inside an invented kommun as unverified ordinary formations
  with no uniqueness claim.
- **Anti-leak at authoring time** (the las-b15-003 lesson institutionalised): las-b17-003 spreads
  its thematic keyword across distractors in both questions; las-b17-001 rewrote Q3 to remove a
  cross-question trap repetition; elf-b17-001 killed a two-true-options defect in self-solve.
- **Hedge maps (rule 10):** heuristic hit-rate 1/4, 0/2, 0/2, ≤1/5, 0/5, 0/1, 0/1 — all at or
  below half.
- **Audit severity contract** (standing): `findings[].severity` only from {minor, note, info};
  history in `resolved_findings` / `cleared`. Honoured on all seven audits.
- **Written dispositions owed for any named adjacency** per the 2026-08-26 process rule. No
  named adjacency was carried this batch, so nothing was owed.

## Pointers

- **Owner surface:** `ADJUDICATION.md` — full passages, all 20 questions with keys marked, flags
  file-attributed, and the seven **ÄGARBLICK** decisions.
- Aggregate: `report-final.json` (with round-2 G-ENG) · `report.json` (round-1 fleet)
- Merged verdicts: `verdicts.jsonl` — **a convenience merge, not the tally**; the per-leg files are
- Gate rounds: `verdicts/` (round-1 fleet) → `verdicts-vfinal/` (round-1 V-FINAL on shipping
  bytes, plus the `*-zr2.jsonl` mirrors of the round-2 legs) → `verdicts-r2/` (round-2 re-leg,
  with `-1v` / `-2v` vote-stamped copies and `verdicts-gkey-resolved-v.jsonl`)
- Reviews: `reviews/{language,pedagogy,integrated,final_verify}.jsonl`
- Meta-audits: `audits/*.json` (7) — elf-b17-001's is **re-issued 2026-08-26** and carries the
  paragraph-4 reconciliation plus verification of the three 2b edits
- Gate input sheets: `blind/` (passage, no keys), `stems/` (no passage), `distractor/`
- Briefs and assembly: `BRIEF-ADDENDUM.md`, `ASSEMBLY.md`, `gen-*.json` + `gen-*.NOTES.md`
- Shipping artifacts: `candidates-final/*.json` — **`candidates/` and `candidates-corrected/`
  are stage evidence, not the shipping bytes.** ADJUDICATION.md's passages, prompts and options
  are injected byte-identically from `candidates-final/` and machine-verified against it.

## Open items for the owner (detail in `ADJUDICATION.md`)

1. **elf-b17-001's paragraph-4 population** — 406 − 96 = 310 traded away, yet the audit sentence
   counts 141 unmoved crossings. Reconciled two ways on the page (disjoint arms / nested), both
   licensed, no key exposed under either; both fresh blind legs returned the key with the same
   chain. Recommend approve with the note.
2. **Twelve unapplied 1-of-3 G-ENG stylistic minors** — all in the rationale layer bar one
   (which the flagging leg itself concedes defensible), none touching a stem, option, key or
   factual claim. Recommend approve, no churn; if a batch-level copy pass is ever run, take the
   two with substance.
3. **AmE/BrE quotation-punctuation layer seam** — the passage sets terminal marks inside the
   quote (AmE), the rationale layer outside (BrE logical). The audit partially refutes G-ENG's
   characterisation: each layer is internally consistent, so this is a seam between layers, not
   a drift inside one, and no quotation in the teaching payload is misrepresented. Recommend
   approve plus a Layer-2 render-spec note, set batch-wide.
4. **Law-16 name verification** — degraded batch-wide, 6 of 7 units never re-verified, ~17
   entities still on generation-time evidence, several full-name pairs inferred rather than
   searched, and the eight-phrase sweep absent. Recommend approve the units and run one
   exact-phrase sweep before import, on the batch15 precedent (that sweep found a collision the
   whole generation stage had missed).
5. **las-b17-003 Q2/D** — the declared MULTIPLE_DEFENSIBLE candidate: flagged by G-DISTRACTOR in
   both runs as *beatable, not defensible*, flagged by G-STEM in the other direction, 4 of 4
   blind answers on that question went to the key, and the audit does not re-raise it. Recommend
   approve as it stands; add las-b17-001 Q1/A to the declared-residual list.
6. **`Skedvall` / `Bräddlund` real-neighbour residuals and the unnamed street names** — both
   surnames recorded, not convicted; the same lanes did drop other names on exactly this ground
   when the neighbour had a bearer in an adjacent field. Recommend approve, fold `Sedvall`,
   `Brattlund` and the two full-name pairs into the sweep, and write the street-name doctrine
   (ordinary formations inside an invented kommun are not law-16 surface) into the next brief.
7. **Process gaps** — (a) the **fold vote-field dedup**: `vfinal_fold.py` de-duplicates on
   `(gate, target, vote)` and the round-2 legs shipped without `vote`, so two independent legs
   would have collapsed to one record per question; fixed operationally by vote-stamping, but
   the failure direction is **fail-open** in a fail-closed chain, and the merged `verdicts.jsonl`
   still under-counts. Recommend a permanent fold/leg contract line in the next batch's
   instructions. (b) M-ECHO absent from the fleet run. (c) Review journals carry duplicate and
   contradictory verdict lines with no `round` / `run_ts` / supersedes field, and the round-1
   REFUTED line was overwritten in place. (d) Fifteen undischarged metadata/rationale minors,
   notably las-b17-003's G-SPRÅK major shipping on passage text with no disposition from the
   language stage. (e) G-STEM's 8 live major flags, 2 of 8 dispositioned — batch15's open
   question, still open.

**On owner approval**, the 7 units enter the product-bank import.
