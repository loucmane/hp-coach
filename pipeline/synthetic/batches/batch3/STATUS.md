# Batch 3 — status: COMPLETE — 5/7 units shipped through the full pipeline incl. V-FINAL, promote CLEAN

First batch through the complete stages 4–10 flow with the V-FINAL verify stage
native (script-derived `final_verify` records, no agent-written verification).
Final: **5 PASS / 0 HOLD, promote exit 0** (verified by orchestrator's own run).

## Result

| unit | title | q | outcome |
|---|---|---|---|
| las-b3-001 | Värme ur ett övergivet berg | 4 | shipped (language fixed a malapropism: 'biografs'→'bisaks') |
| las-b3-002 | Nattåget hör hemma i infrastrukturbudgeten | 2 | shipped |
| las-b3-003 | När ett jämnt brus dämpar det öppna kontoret | 2 | shipped after TWO repair rounds (see below) |
| elf-b3-003 | The Listening Ice | 1 | shipped |
| elf-b3-004 | The Water Cure | 1 | shipped |
| elf-b3-001 | Living Walls | — | **DEAD — G-STEM** (q5 stance item: key = sole hedged option; real leak; slot regenerates in batch 5) |
| elf-b3-002 | Slow Trains Home (cloze) | — | **DEAD — G-REGISTER format-scope conflict** (see below) |

**10 questions shipped** (running total 46 verified + 20 staged in batch 4).

## The las-b3-003 repair story (now generation law 11 + a runbook rule)

V-FINAL refuted q2: option A was VERBATIM-TRUE per the passage — a defensible
second key in a "stämmer bäst" item (third occurrence of this pattern across
batches → GENERATION.md law 11). Round-1 fix absolutised A ("alltid…aldrig"),
which made key C the SOLE hedged option — G-STEM killed it as blind-pickable by
form. The regate kill was initially INVISIBLE to promote (repair lines weren't
merged into the batch verdicts — now a runbook rule: repair re-gates must merge
last-wins into `verdicts.jsonl` before promote). Round 2 solved the dual
constraint: A is now hedged-in-form but false-in-content (a direction reversal —
"oftast är det den jämna trafiken … som stör mest", opposite of the passage).
All four regate judges pass; sweep + audit clean; promote exit 0.

## Open policy item (owner)

`elf-b3-002` died because G-REGISTER judged the numbered-gap cloze FORMAT alien
to authentic HP ELF — but CLOZE-001 is the settled product-design family
(batch 1–2 clozes passed the same gate). Fail-closed: the unit stays dead; no
orchestrator override. Queued fix: scope G-REGISTER's format-authenticity axis
to non-cloze units (judge clozes on language register only) → gate-prompt
change → **eval re-run required** → re-gate the unit. Blocked on the owner's
call: keep the cloze family? (Recommended: yes — recovers ~5q/batch.)
