# Evalset run — 2026-07-30 — M-ECHO

- Date: 2026-07-30
- Git SHA: 479108494c0833ac41c2f484ef9a29e3b67621f9
- Model: claude-opus-4-8
- Report: `report.json` (this directory)

## What changed

- `mech.py`: new **M-ECHO** self-corpus echo gate — detects reuse of invented
  names across units (law 13). **Flag-only** (never kills), **opt-in** via
  `--p5-corpus-dir`.
- `run_mech.py`: pass-through flag for `--p5-corpus-dir`.
- Verdict schema: `M-ECHO` added to the gate-name enum.

## M-ECHO verdicts observed on eval items

30 of the 31 eval candidates received an M-ECHO verdict (`las-b0-010` died on
M-SCHEMA before the echo check). 27 `pass`, 3 `flag`:

| candidate | verdict | finding |
|---|---|---|
| las-b0-003 | flag | name reuse `Lindqvist` — already in las-b3-003, las-b4-002, las-b5-001 (3 findings, major) |
| las-b00-007 | flag | name reuse `Bank` — already in elf-b11-002 (major) |
| elf-b00-009 | flag | name reuse `Office` — already in elf-b7-002 (major) |

All other candidates: `verdict: pass`, no findings.

Note: the two authentic flags (`Bank`, `Office`) are common-noun false
positives from the name extractor; because M-ECHO is flag-only they did not
produce authentic false kills.

## Aggregate

SURVIVED_CLEAN: 8 · SURVIVED_FLAGGED: 8 · DEAD: 15 · INCOMPLETE: 0

## score_eval stdout (verbatim)

```
candidate        kind      result           detail
------------------------------------------------------------------------------
las-b00-000      authentic PASS             status=SURVIVED_CLEAN killed_by=-
las-b00-001      authentic PASS             status=SURVIVED_CLEAN killed_by=-
las-b00-002      authentic PASS             status=SURVIVED_CLEAN killed_by=-
las-b00-003      authentic PASS             status=SURVIVED_CLEAN killed_by=-
las-b00-004      authentic PASS             status=SURVIVED_CLEAN killed_by=-
las-b00-005      authentic PASS             status=SURVIVED_FLAGGED killed_by=-
las-b00-006      authentic PASS             status=SURVIVED_CLEAN killed_by=-
las-b00-007      authentic PASS             status=SURVIVED_FLAGGED killed_by=-
elf-b00-008      authentic PASS             status=SURVIVED_CLEAN killed_by=-
elf-b00-009      authentic PASS             status=SURVIVED_FLAGGED killed_by=-
elf-b00-010      authentic PASS             status=SURVIVED_FLAGGED killed_by=-
elf-b00-011      authentic PASS             status=SURVIVED_FLAGGED killed_by=-
elf-b00-012      authentic PASS             status=SURVIVED_FLAGGED killed_by=-
elf-b00-013      authentic PASS             status=SURVIVED_CLEAN killed_by=-
elf-b00-014      authentic PASS             status=SURVIVED_FLAGGED killed_by=-
las-b0-001       seeded    PASS             want=G-KEY got=G-DISTRACTOR,G-KEY status=DEAD
elf-b0-002       seeded    PASS             want=G-KEY got=G-DISTRACTOR,G-KEY status=DEAD
las-b0-003       seeded    PASS             want=G-STEM got=G-STEM status=DEAD
elf-b0-004       seeded    PASS             want=G-DISTRACTOR got=G-DISTRACTOR,G-KEY status=DEAD
las-b0-005       seeded    PASS             want=G-SPRAK got=G-SPRAK status=DEAD
las-b0-006       seeded    PASS             want=G-SPRAK got=G-SPRAK status=DEAD
las-b0-007       seeded    PASS             want=G-SPRAK got=G-REGISTER,G-SPRAK status=DEAD
las-b0-008       seeded    PASS             want=G-SPRAK got=G-SPRAK status=DEAD
elf-b0-009       seeded    PASS             want=G-ENG got=G-ENG status=DEAD
las-b0-010       seeded    PASS             want=M-SCHEMA got=M-SCHEMA status=DEAD
las-b0-011       seeded    PASS             want=M-PLAGIARISM got=M-PLAGIARISM status=DEAD
elf-b0-012       seeded    PASS             want=G-REGISTER got=G-REGISTER status=DEAD
elf-b0-016       seeded    PASS             want=G-REGISTER got=G-REGISTER status=DEAD
las-b0-013       hard-neg  PASS             status=SURVIVED_FLAGGED killed_by=-
las-b0-014       seeded    PASS             want=G-DISTRACTOR got=G-DISTRACTOR,G-KEY status=DEAD
las-b0-015       seeded    PASS             want=G-SPRAK got=G-SPRAK status=DEAD
------------------------------------------------------------------------------
authentic false kills: 0 (max allowed 0)
seeded kill-by-right-gate rate: 15/15 = 100% (min 100%)
EVAL PASS
```

Exit code: **0**

## Conclusion

**PASS.** 0 authentic false kills (max 0), 15/15 seeded items killed by the
right gate (min 100%), hard-negative `las-b0-013` survived. M-ECHO shipped
flag-only and did not alter any kill decision. Stack not frozen.

## Addendum 2026-07-30 — M-ECHO name-stoplist extension (post-certification)

This eval surfaced two M-ECHO **false positives** on authentic items: `las-b00-007`
flagged "Bank" against elf-b11-002, and `elf-b00-009` flagged "Office" against
elf-b7-002 — bare common nouns caught inside capitalized runs. `ECHO_NAME_STOP`
was extended with generic institution/place-feature nouns (EN+SV) and a
regression test added (suite 78/78).

**Why this does NOT require a fresh full eval run.** M-ECHO is flag-only: it can
emit `pass` or `flag`, never `kill`. The eval's two pass criteria are
*authentic false kills = 0* and *seeded kill-by-intended-gate = 100%* — both
defined purely over KILL verdicts, which M-ECHO cannot produce. The change was
verified mechanically rather than asserted: `run_mech.py` was re-run over the
same materialized eval set and the verdict sets diffed.

```
kill verdicts before: 2 | after: 2 | IDENTICAL: True
changed verdicts: 2
   elf-b00-009 M-ECHO flag -> pass
   las-b00-007 M-ECHO flag -> pass
```

Only the two false positives changed; every other verdict, including both
mechanical seed kills (las-b0-010 M-SCHEMA, las-b0-011 M-PLAGIARISM), is
unchanged. The genuine law-13 collision (`las-b0-003`, surname "Lindqvist"
reused in three shipped units) still flags. Re-validated on the shipped bank:
all five known architectural clones still caught, phrase findings unchanged
(12), name findings unchanged (40 — the real surname families).

**Conclusion: the 2026-07-30 PASS stands for the stack including this
stoplist.** The LLM gate prompts were not touched by either change.
