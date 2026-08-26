# Batch16 — stage 2 assembly record (2026-08-26)

Seven generators (claude-opus-5, parallel, disjoint lanes) under
`BRIEF-ADDENDUM.md` rules 1–10 (first batch under the owner's 2026-08-26
policies: bank-wide given-name uniqueness, hedge balance). All seven self-ran
mech clean. Canonical shape: 7 units, 20 questions (LÄS 4+2+2, ELF 5+5+1+1).

## Id map

| candidate_id | source | family | q |
|---|---|---|---|
| las-b16-001 | gen-las-long | tegelbrukshistoria-facktext-long | 4 |
| las-b16-002 | gen-las-short-1 | skolskjuts-landsbygd-debatt-short | 2 |
| las-b16-003 | gen-las-short-2 | midsommarstangens-lokalformer-essa-short | 2 |
| elf-b16-001 | gen-elf-long | smoke-taint-volatile-phenol-glycosides-science-journalism-long | 5 |
| elf-b16-002 | gen-elf-cloze | ELF-CLOZE-001 / landmark-directions-etiquette-society-commentary-cloze | 5 |
| elf-b16-003 | gen-elf-short-1 | ELF-TYPE-001 / cavity-wall-open-joint-drainage-wind-pressure-building-science-short | 1 |
| elf-b16-004 | gen-elf-short-2 | ELF-TYPE-002 / village-pound-stray-fines-weekly-notice-history-essay-short | 1 |

## Name sweep

- Intra-batch given-name dups: NONE. Bank given-name reuse (rule 8): NONE —
  first batch fully clean on both axes at assembly. Three collisions were
  prevented DURING generation by the generators' own sibling sweeps
  (Boel→Gertrud; Aveline Brindlow→Hemblow; Corin Brindlow→Pemberdine).
- **Metadata inaccuracy to correct at review**: gen-elf-long's originality_note
  says Brindlow was renamed "after a sibling took that surname" — no sibling
  took it; elf-b16-003's generator REJECTED it on a live in-domain collision
  (Vent-Axia). Outcome right, stated reason wrong.
- **Cross-batch near-pair (register echo, disposition owed, no rename)**:
  batch15's elf-b15-002 now ships *Verity Quennerby* (post-approval law-16
  rename) and elf-b16-001 ships *Tamsin Quennerly* — one letter apart, both
  invented. Bank precedent tolerates closer (Karin Löfgren / Karin Lövgren,
  shipped). Recorded for G-REGISTER/audit written disposition.
- "Corin Pemberdine" was never searched as a full pair (inference from parts,
  logged as such) — V-FINAL re-check.

## Flags carried to the fleet and V-FINAL

1. **Law-16 ran degraded again batch-wide** (WebSearch exhausted; Exa +
   sv.wikipedia API; all kept names FLAGGED not certified). V-FINAL must
   re-run exact-phrase checks. Proven transport from the batch15 sweep:
   Mojeek result pages via Exa web_fetch (`https://www.mojeek.com/search?q=%22Name%22`),
   validated with positive controls — AND screen on a second index (Brave):
   Mojeek returned a false zero for "Pelbridge" that Brave falsified.
2. **Same-batch material adjacency**: las-b16-001 (brickworks history, SV)
   and elf-b16-003 (cavity-wall drainage physics, EN) — disjoint mechanism,
   cross-language; one written disposition owed per the 2026-08-26 process
   rule. Also cross-batch: landmark-directions cloze vs batch15 noticeboard
   (both village-communication—distinct mechanism; disposition owed).
3. **Declared shortfalls (elf-b16-003)**: fk_grade 8.7 vs blueprint 11.0–15.0
   (shipped shorts span 7.0–16.2; no gate enforces it); two-phrase
   originality probe with four post-probe register clauses never re-probed.
4. **Generator-declared residual edges**: elf-b16-001 Q4 stance item is the
   engineered hedge-break (flattest option keyed); las-b16-003 Q2-C agnostic
   option argued hardest in self-solve.
5. **Audit severity contract** (standing): findings[].severity ONLY from
   {minor, note, info}; history in resolved_findings/cleared.
6. **Hedge maps declared per unit** (rule 10): heuristic hit-rate 1/4, 1/2,
   0/2, 1/5, 0/5, 0/1, 0/1 — all at or below half; verify in review.
