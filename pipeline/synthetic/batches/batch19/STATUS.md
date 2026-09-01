# Batch 19 — status: PIPELINE COMPLETE — 7/7 promote PASS 2026-09-01, awaiting owner PAKETDOM

> **No bank import has happened, and none is prepared.** There is no `candidates-final/` in this
> batch, `pipeline/synthetic/RETIRED.json` carries zero batch19 entries, no batch19 id occurs
> anywhere under `data/` or `app/`, and `batches/batch19/` is still untracked on
> `p5/batch18-19`. The seven units stand at the owner-package boundary: the ruling recorded in
> `ADJUDICATION.md` is what releases them, and nothing merges, imports or deploys before it.

**7 units, 20 questions** — the canonical P5 shape (LÄS 4+2+2, ELF 5+5+1+1), authored under
`BRIEF-ADDENDUM.md`: batch17's addendum, the 2026-08-31 efterhandstillägg, the batch19
supplement's four binding rules — **RULE 11** (no cross-question lexical or conceptual bridges),
**RULE 12** (a stem must not entail any option), **RULE 13** (style-tell clustering; the M-FORM
absolutizer family declared complete), **RULE 14** (the proven law-16 transport with one-letter
variant probing and positive controls in the same session) — plus batch18's additions to the
given-name, full-pair, toponym and family exclusion lists.

| unit | title | q | family |
|---|---|---|---|
| las-b19-001 | Ugnen, luppen och släggan (blästbruk, myrmalm, solid-state reduction) | 4 | myrmalm-blastbruk-facktext-long |
| las-b19-002 | Vässlingsbadet och Stångklippan (bathing-jetty fee, kommun debate) | 2 | badbrygga-avgift-debatt-short |
| las-b19-003 | Yrket efter namnet i Ledingsbos katalog (telephone-directory trade titles) | 2 | telefonkatalogens-yrkestitlar-essa-short |
| elf-b19-001 | Sixty-One Fires (grain-dryer fire clustering, AmE) | 5 | grain-dryer-fire-clustering-shutdown-versus-harvest-schedule-science-journalism-long |
| elf-b19-002 | Somebody Else's Rhubarb *(cloze, 5 gaps)* | 5 | ELF-CLOZE-001 / allotment-waiting-list-inheritance-society-commentary-cloze |
| elf-b19-003 | Counting Pots from the Pavement *(short, 1 q)* | 1 | ELF-TYPE-001 / chimney-pot-height-per-flue-draught-building-science-short |
| elf-b19-004 | Before the Pillar Boxes *(short, 1 q)* | 1 | ELF-TYPE-002 / receiving-house-window-hours-versus-collection-time-history-essay-short |

## Rounds

| round | what ran | outcome |
|---|---|---|
| **Generation** (`gen-*.json` + `gen-*.NOTES.md`, 2026-09-01) | seven lanes authored against the supplement; every unit's `generator_meta` carries `origin: batch19-generator`, `date: 2026-09-01` | 7 candidates. ELF spelling variety declared per unit: elf-b19-001 **AmE**, the other three **BrE** |
| **Round 1 — gate fleet** (`verdicts/verdicts-*.jsonl`, no suffix) | mech ×6 gates, G-KEY ×2 legs, G-STEM, G-DISTRACTOR, G-REGISTER, G-SPRÅK ×3, G-ENG ×3 | **4 kill records, on 2 of 7 units.** G-KEY 2 legs × 20, every committed answer matching · **G-SPRÅK 3-of-3 unanimous kill on las-b19-003** — two lethals, `sin sista egen katalog` (a possessive-determined NP with an intervening adjective requires the weak form *egna*) and `paraphraserar` in the student-visible q1 rationale (English orthography; corpus 890 `parafras*` against 2, both in this unit) · **G-STEM 1 kill** on las-b19-001 q:3 (`i alla stycken`, `varje bygd`, `den viktigaste källan` — three of four options carrying an over-claim marker; blind STRUCTURAL_LEAK, pick=D) · G-STEM otherwise 14 flag / 5 pass · G-DISTRACTOR 14 pass / 6 flag · G-ENG 4 pass / 8 flag (elf-b19-001/002/003) · G-REGISTER 4 pass / 3 flag, majors on las-b19-001 (the cross-batch lane clone), elf-b19-001 (×2) and elf-b19-002 |
| **Repairs** (`repair_log`, append-forward) | **fleet-repair-1, -3, -4, -5.** There is **no round labelled fleet-repair-2**, and the absence is explained, not lost: round 2 was a gate READ over the fleet-repair-1 output, and its findings were discharged in fleet-repair-3 (`audits/las-b19-001.json` → `findings[F11]`, filed at info precisely so a numbered gap is not mistaken for a dropped ticket) | fleet-repair-1 answered the two unanimous/lethal kills and the four G-REGISTER majors (including the withdrawal of the surname *Tarrowfen* at edit distance 2 from shipped *Larrowden*, replaced by *Steadgrove*); fleet-repair-3 took the round-2 findings on elf-b19-001, elf-b19-004, las-b19-001 and las-b19-003; fleet-repair-4 was the final metadata-and-rationale pass discharging the review HOLD and the V-FINAL audit findings, with one authorised passage word on las-b19-003; fleet-repair-5 applied the carried G-ENG / G-SPRÅK r2 minors on elf-b19-004 (one option word) and las-b19-002 (one passage word plus two rationale glosses). **No key letter moved in any unit, in any round** — re-verified here by sweeping every `repair_log` edit path: not one touches `questions[*].key` |
| **Re-legs r2 → r3** (`verdicts/verdicts-*-r2.jsonl`, `-r3.jsonl`) | targeted re-runs after each repair round | **0 kills in any re-leg.** r2 (all seven units): G-KEY 2 × 20 all matching (40 resolved), G-STEM 9 pass / 11 flag, G-DISTRACTOR 18 pass / 2 flag, G-ENG 11 pass / 1 flag, G-REGISTER 6 pass / 1 flag (the lane-clone major re-judged and **strengthened** on current bytes), G-SPRÅK 9 flag · r3 (elf-b19-001 + las-b19-001, 9 questions): G-KEY 2 × 9 all matching (18 resolved), G-DISTRACTOR 9 pass, G-STEM 9 flag |
| **Reviews** (`reviews/{language,pedagogy,integrated}.jsonl`) | language, pedagogy, integrated — append-forward journals, **last record per candidate wins** | **1 HOLD, discharged in-journal.** language: 5× CORRECTED + 2× MINOR_NOTES, the two later superseded to CORRECTED by `coordinator/carry-in-applied` once fleet-repair-5 put the carried minors on bytes · pedagogy: 6× MINOR_FIXES + 1× SOLID, normalised to the promote vocabulary (`SOLID`→`SOUND`, `MINOR_NOTES`→`MINOR_FIXES`) by `coordinator/vocab-normalization` · integrated: 6× MINOR_NOTES and **one HOLD on elf-b19-004** — a `blocker`-severity metadata falsehood in `length_tell_note`, explicitly scoped as non-student-facing — discharged append-forward by `coordinator/hold-discharge` after fleet-repair-4 wrote the correction. No line was overwritten |
| **V-FINAL meta-audits** (`audits/*.json`) | seven adversarial refute-directed audits | **7× CONFIRMED_NOTES, 0 majors, 86 findings** (13 / 13 / 11 / 14 / 11 / 15 / 9), severity contract honoured — every `findings[].severity` is from {minor, note, info}. The heaviest is elf-b19-004's **BLIND-1**: a commissioned uncontaminated blind solver, given stem and options with no passage, returned **A 9 / B 13 / C 16 / D 62** and refused to call the sheet random |
| **fleet-repair-4 / -5 + sheet re-sync** (`candidates/`, `blind/`, `stems/`, `distractor/`) | final metadata pass, carried-minor pass, then a mechanical re-copy of the three gate sheets | **7 units × 3 sheets = 21, byte-parity verified here** against `candidates/*.json` on title, passage, every prompt and every option, plus the key on the distractor sheet (which holds it by design) and its absence from `blind/` and `stems/`. **0 desynced.** Only the three units whose final round touched student-facing bytes needed a re-copy (elf-b19-004 option B, las-b19-002 passage ¶3, las-b19-003 passage ¶2); the other twelve sheets were already identical |
| **Mech r5** (`verdicts-mech-r5.jsonl`) | the six mechanical gates on the final bytes | **42/42 pass** — M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-ECHO / M-PLAGIARISM over seven units, **M-ECHO indexed against 121 shipped units**. Re-run independently for this package against the same corpus and the same parsed authentic bank: 42 records, 42 pass, `M-ECHO: indexed 121 shipped unit(s)`. The earlier `verdicts-mech.jsonl` is the **pre-repair** run and is superseded (`audits/elf-b19-003.json` → M3) |
| **Canonical verdicts assembly** (`verdicts.jsonl`) | merged fleet state across every leg and re-leg | **150 records, 0 kills.** mech 42 (6 × 7, all pass), G-KEY 40 pass, G-STEM 14 flag / 6 pass, G-DISTRACTOR 19 pass / 1 flag, G-ENG 11 pass / 1 flag, G-REGISTER 6 pass / 1 flag, G-SPRÅK 9 flag. Every round-1 kill is repaired and re-legged; the merged file is the final fleet state, not the round-1 tally |
| **Fresh V-FINAL legs** (`verdicts-vfinal/`) | G-KEY ×2 independent legs + G-DISTRACTOR, on the final shipping bytes | **G-KEY 2 legs × 20 = 40 resolved records, both legs unanimous, every solver answer equal to the key, 0 kills 0 flags** (re-verified here against `candidates/*.json`). **G-DISTRACTOR 19 pass / 1 flag / 0 kills** — the single flag is elf-b19-004 q:1 option A, `flag rather than kill … survivable with effort … not defensible as a second correct answer` |
| **Fold + promote** (`reviews/final_verify.jsonl`) | `vfinal_fold.py` then `promote.py --require-clean` | **fold 7× VERIFIED_NOTES** · aggregate: 6× SURVIVED_FLAGGED, 1× SURVIVED_CLEAN (elf-b19-002), 0 DEAD, 0 INCOMPLETE · **promote `--require-clean`: PASS 7 / HOLD 0** (re-run for this package, exit 0) |
| **Stage 11 — fresh-eyes + adjudication fold** (`adjudication-evidence/`, `adjudication-flags.json`, `reviews/adjudication.jsonl`) | seven cold readers on blind sheets with no pipeline history, then triaged flags → `adjudicate_fold.py` | **20/20 cold-solve answers match the shipped keys** (counted independently from `adjudication-evidence/` against `candidates/*.json`) · **0 reader blockers**, all seven `makes_sense: true` · naturalness **natural ×4** (elf-b19-004, las-b19-001, las-b19-002, las-b19-003), **minor_friction ×3** (elf-b19-001, elf-b19-002, elf-b19-003) · fold: **7× GODKANN_NOTED**, and **deterministic** — re-running `adjudicate_fold.py` over the same evidence and flags reproduced `reviews/adjudication.jsonl` byte-for-byte |

## Final state

- **Promote: 7 PASS / 0 HOLD**, re-derived for this package. Aggregate re-derived from
  `verdicts.jsonl` + `candidates/`: 6× SURVIVED_FLAGGED, 1× SURVIVED_CLEAN, 0 DEAD, 0 INCOMPLETE.
  (This batch has no `report-final.json`; the aggregate above is recomputed from the canonical
  merged verdicts, which is the same input `promote.py` uses.)
- **Canonical merged fleet `verdicts.jsonl`: 150 records, 0 kills** — composition as tabled above.
- **Blind-solve agreement: 100 % on every leg that ran.** Round-1 fleet 2 legs × 20, r2 2 × 20,
  r3 2 × 9, and V-FINAL 2 legs × 20 on the shipping bytes. No committed blind answer anywhere in
  the batch disagreed with the key, before or after repair. The stage-11 cold readers add a
  seventh independent pass: 20/20.
- **Canonical mech: 42/42, with M-ECHO in the run**, indexed against 121 shipped units and
  reproduced independently for this package on the final bytes.
- **Live flags carried into adjudication: 113 triaged records** in `adjudication-flags.json` —
  86 audit findings plus 27 gate flags (14 G-STEM, 9 G-SPRÅK, 2 G-DISTRACTOR, 1 G-ENG,
  1 G-REGISTER), each at its verbatim severity. The fold's coded rule treats gate-sourced flags
  on a promoted unit as already adjudicated by the pipeline and surfaces them as notes; nothing
  escalated to ÄGARBLICK mechanically.
- **Audit-coverage boundary, stated plainly.** All seven meta-audits were issued **before**
  fleet-repair-4 and fleet-repair-5 (audits 15:26–15:29 local, candidates last written
  15:47–15:55), and those are precisely the rounds that discharged their findings — so the
  adversarial metadata layer was **not** re-run on the final bytes. It cuts both ways: the audit
  finding `las-b19-002` F5 records the passage zeugma as *shipping unrepaired*, and
  fleet-repair-5 then repaired it with the gate's own prescription, so that finding is stale in
  the item's favour. What **did** read the exact shipping bytes: the three fresh V-FINAL legs
  (G-KEY ×2 + G-DISTRACTOR), mech r5, `vfinal_fold.py`, `promote.py`, and all seven stage-11
  cold readers — so every key, option and passage a student will see has been independently
  solved and judged on the final text. The unrepeated layer is the adversarial metadata audit,
  not the item.
- **Law 16 (real entities):** RULE 14 transport held, with positive controls firing in-session
  (`Pellew` 701, `Flarken` sv.wiki 56 / Nominatim SE 5, both reproduced exactly by the
  re-verification legs). Two log-fidelity defects were found and are recorded rather than
  hidden: elf-b19-004's `originality_note` understates the nearest real neighbours to *Draystow*
  and omits one for *Nabbsworth* (audit LAW16-1/LAW16-2, both minor/note), and elf-b19-001's log
  misstates the *Grendisham* distance (VF-02). No exact-name collision survives on any unit.

## Pointers

- **Owner surface:** `ADJUDICATION.md` — the PAKETDOM request, the eight-item decision ledger,
  the batch20 carry-forwards, and the import boundary.
- Merged verdicts: `verdicts.jsonl` (**a convenience merge**; the per-leg files under `verdicts/`
  are the record)
- Gate rounds: `verdicts/` (round 1 + `-r2` / `-r3` re-legs) → `verdicts-vfinal/` (fresh
  G-KEY ×2 + G-DISTRACTOR on shipping bytes)
- Mech: `verdicts-mech-r5.jsonl` (final bytes) · `verdicts-mech.jsonl` (pre-repair, superseded)
- Reviews: `reviews/{language,pedagogy,integrated,final_verify,adjudication}.jsonl` — the first
  three are append-forward; **read the last record per candidate**
- Meta-audits: `audits/*.json` (7)
- Stage-11 fresh eyes: `adjudication-evidence/*.json` (7) · triaged flags:
  `adjudication-flags.json`
- Gate input sheets: `blind/` (passage, no keys), `stems/` (no passage, no keys), `distractor/`
  (passage + keys, by design)
- Brief and generation: `BRIEF-ADDENDUM.md`, `gen-*.json` + `gen-*.NOTES.md`
- **Tooling note:** `merge_verdicts.py` and `check_sheet_sync.py` — the declared sole merge path
  and the declared sheet-sync gate — are **not present in this worktree**; only their bytecode
  survives under `gates/scripts/__pycache__/`, and neither is tracked on `p5/batch18-19`. Both
  properties were therefore verified directly for this package rather than by re-running the
  tools: the 150-record merge was recounted leg by leg, and all 21 sheets were diffed field by
  field against `candidates/`. Worth restoring before batch20 so the declaration matches the tree.
- **Shipping artifacts: `candidates/*.json`.** This batch has no `candidates-corrected/` and no
  `candidates-final/` — `candidates/` *is* the shipping bytes, and every repair round wrote into
  it append-forward with a `repair_log` ticket.

## Open items for the owner (detail in `ADJUDICATION.md`)

1. **BLIND-1** (elf-b19-004) — three independent measurements agree the blind channel runs above
   the 1-in-2 policy ceiling and points at the key; declared honestly, nothing fixed.
2. **BLIND-2** (las-b19-003) — new at stage 11: the two-question set reads to ~80 % jointly with
   the passage unopened.
3. **Lane-clone / rural fire crafts** — four of the last six LÄS long slots; G-REGISTER major
   recorded, explicitly not adjudicated. **Same item as batch18's #3** — one ruling covers both.
4. **"Vässlinge" registry gap** (las-b19-002) — the shared excluded-toponym registry omits a
   batch15 coinage, so no gate could catch the near-pair honestly.
5. **Margit ~ Marit** (las-b19-003) — invented given name at edit distance 1 from a shipped one,
   compounded on the surname axis against the same shipped pair.
6. **Key-distribution recount** (elf-b19-004) — the HOLD's false claim corrected, and the
   review's own replacement figure found not to sum.
7. **Trade-term slips** (elf-b19-003) — *fillet* for *flaunching*, *behind* for *beneath*; new
   from the stage-11 reader, no gate caught either, no key touched.
8. **Coined-name clustering** (elf-b19-001) — four coined surnames with no ordinary name among
   them; reader note, pairs with batch18's Tebbenholt note.

**On owner PAKETDOM**, and not before, the 7 units enter the product-bank import.

## Addendum 2026-09-01 — Layer-2 rendering leak (found during batch20 gating)

`lint_learner_output.py` (lives only on the unmerged PR #370 branch; never ran on this
batch) reports **11 student-visible hits** in shipped rationales: English snake_case trap
labels inside Swedish LÄS rationales (all SNAKE hits are LÄS), gate/tool names inside ELF
rationales (all GATEREF hits are ELF), and the anglicism *hedgat* in Swedish. Keys, options,
stems and passages are untouched; no re-gate needed. Recorded in ADJUDICATION.md as a new
ledger item with the recommendation ÄNDRA (mechanical rationale scrub before infold).
Reproduce: `lint_learner_output.py candidates | grep '$.questions'`.
