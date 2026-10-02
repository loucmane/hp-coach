# Batch21 — resume point (2026-09-02, GATES COMPLETE, tracked as hpf-mjml)

## Status

All 7 units generated, repaired across up to 3 rounds, and re-gated 4 times.
**Zero kills across every gate since r2.** Sheets current, mech 42/42,
genuinely student-visible lint = 0. Nothing committed (batch21/ untracked).

| gate | r1 | r2 | r4 spot-check (4 changed units) |
|---|---|---|---|
| G-KEY | 40/0 | 40/0 | 10/10 both votes, match keys |
| G-STEM kills | 5 (+1 pair kill) | **0** (both pairs flag) | all 12 pass |
| G-DISTRACTOR | 20/20/0 | 19/1/0 | all 10 pass |
| G-SPRAK | 1 unit DEAD | 0 kills | 2 units pass |
| G-ENG | 2 units DEAD | 0 kills | 1 pass, 1 flag |
| G-REGISTER | 0k/7f | 0k/7f | n/a |

**Batch21 reached zero G-STEM kills in ONE repair round; batch20 needed three.**

## Outstanding

- `elf-b21-001` fleet-repair-3 COMPLETE (2026-09-02 18:45): jet direction corrected to
  "the wall below it" (matches the passage's own geometry); para-5 sentence re-worded and
  re-screened at n>=5 over 141 units (zero hits); `flood` -> `spate`; six false
  self-attestations corrected incl. a mechanism-verification note that had been certifying
  the physics error; one NEW finding recorded for the owner package (a one-word register
  swap in fleet-repair-2 created an unscreened 7-token collision with elf-b13-001). All
  four r4 spot-checked units are now ready to leave the gate loop. Do not repeat.
- r4 G-KEY legs RESOLVED 2026-09-02 (`verdicts/verdicts-gkey-r4-resolved.jsonl`, 20/0).
- Canonical `verdicts.jsonl` NOT yet assembled — package step 0 (`assemble_verdicts.py`,
  digest-bound, proven byte-reproducible on batch20; dry projection 152 records / 0 kills).
- Tracking: **hpf-mjml** (blocked-by hpf-ldjj). Worklog GasCity/hpfetcher/Docs/worklogs/
  hpf-mjml.md. Digests `DIGESTS-completion-hpf-mjml.json`. Package
  `../GC-COMPLETION-PACKAGE-b20-b21.md`. Delegation-authorization gap recorded, not excused.
- After that: reviews (language/pedagogy/integrated) -> V-FINAL audits x7 ->
  fresh V-FINAL legs -> vfinal_fold -> promote --require-clean -> stage-11
  fresh-eyes x7 + adjudication-flags + adjudicate_fold -> STATUS.md +
  ADJUDICATION.md -> signed commit. NO bank import; owner PAKETDOM required.

## Owner-package items (measured, disclosed, NOT chased)

- **Main-idea structural floor**, now confirmed across three batches by three
  different surface mechanisms. elf-b21-001 q5 and las-b21-001 q4 both leak via
  sibling stems acting as a table of contents (~45-48%). batch20's elf-b20-001
  q5 measured ~50% after three rounds. POLICY QUESTION: accept a disclosed
  ~2-in-5 floor on main-idea/heading items over multi-voice texts, or drop them
  from long passages that also carry four detail questions.
- **RULE 15 pair flags**, both one-way q2->q1, both measured: las-b21-002 lifts
  q1-D 0.25 -> ~0.40; las-b21-003 lifts q1 to ~0.42. Both were kills or flags at
  r1 and are now flags. r4 additionally found las-b21-003's surviving proposition
  is already supplied by q1's OWN stem, so it adds nothing - arguably not a leak.
- **Two coinages at exactly the RULE 16 floor** with the general-web legs VOID:
  Kelsingham~Wellingham (elf-b21-001) and Dunnicott~Hunnicutt (elf-b21-002).
  Both confirmed live as real surnames with notable bearers. Compliant as the
  rule is written; a sibling unit dropped five names at the same distance, so the
  asymmetry is a coordinator/owner call.
- **RULE 21 leg (b) is unrunnable** in this harness (no working general-web
  index: WebSearch exhausted, DuckDuckGo refusing, Mojeek captcha, all confirmed
  against the brief's own control). An ordinary name cannot be introduced at all
  under the rule as written. elf-b21-001 declined a rename for this reason.
- **elf-b21-003 quotation ratio**: 70.9% -> 45.4% -> 42.9%. Benchmarked against
  the AUTHENTIC corpus (221 real ELF blocks: max 54.7, p95 22.4, median 0), not
  the synthetic bank. Paragraph 2 remains at 79% after one interleave beat; the
  break position was forced by two rationale quotations needing an unbroken
  213-char run. Disclosed.
- **Successor monoculture**: 5 of 7 units close on something deliberately
  unresolved, after batch20's flat-administrative coda was retired.
- elf-b21-004 numeric title keeps the ELF numeric-title run at 6.

## Lessons for the batch22 brief

1. **Generator self-reports are not gate substitutes.** las-b21-003 self-reported
   the best RULE 15 floor in the run (~7%) by measuring LEXICAL overlap; G-STEM
   measured 70% and killed the pair, because the leak was PRESUPPOSITIONAL.
2. **Repairs generate defects** - in 5 of 7 rounds across b20/b21, including one
   caused by DELETING a sentence that was silently licensing two references.
   Re-gate everything after every repair; read two sentences either side of every
   edit. The one round that caught its own collateral pre-write did so by reading
   changed spans aloud.
3. **A "defects that have shipped" section is owed.** `textforfattare` and the
   `lagga ut/lagga fram` particle class were carried into the batch21 GATE
   prompts but not the generator brief, so a generator reproduced them in good
   faith.
4. **Self-attestation is a defect class of its own.** Across the batch, claims of
   the form "X does not occur anywhere in the file" were false in five units -
   one whose own text was the only occurrence of the string it denied. Per-file
   counts also drift when sibling units are repaired afterwards. Prefer path
   partitions to raw counts; never assert a count a later round increments.
5. **The `\uXXXX` escape claim is scaffold-level**, not a per-unit slip: all
   seven units claimed escapes; all seven store literal characters.
6. **Retired families must be annotated** in the exclusion list so a generator
   can tell a live bar from a ghost (see the COORDINATOR RULING in the brief).
7. **Convergent-generation collisions need a prose sweep**, not just a name
   sweep: three LAS units independently closed on `star/finns kvar`, and three of
   seven opened on the same received-explanation template.
8. **Three times this session an agent caught a GATE prescribing an incorrect
   fix** (a replacement that described an option backwards; a phrasing false of
   one distractor; a wording that would reintroduce the repetition it was
   fixing). Repair agents should be told to check a prescription before applying
   it, and to report rather than silently widen scope when they find a defect
   outside their ticket - which is how two coordinator errors were caught here.
