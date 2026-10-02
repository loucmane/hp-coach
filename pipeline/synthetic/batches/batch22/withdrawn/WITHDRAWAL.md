# las-b22-001 — withdrawn from batch22 (2026-09-15)

**Unit:** `las-b22-001` "Spårvägen i Nävstuna", LÄS long facktext, 4 questions, keys C B D A.
**sha256 of the withdrawn bytes:** `3d2114750791f8a5a88f7129b23ad4cae348693419d2019d566f2d99083bdadd`
**Decision:** coordinator, under a stopping rule recorded in the hpf-l77g worklog on 2026-09-09,
BEFORE round 4 ran: "if las-b22-001 takes a G-STEM kill in round 4, it is withdrawn from batch22
and the batch closes at six units with the withdrawal disclosed in RESUME.md for the owner."

## Why

**1. It was killed in every gate round, on a different question each time.**

| round | G-STEM kills | other kills |
|---|---|---|
| 1 | q3, q4 | — |
| 2 | q1, q3, q4 | — |
| 3 | q2 | — |
| 4 | q1, q4 | G-KEY q2 (multiply defensible); G-SPRÅK vote 2 |

Every question has been killed at least once; q1 and q4 twice each. In round 4, three of its four
questions were dead simultaneously. Its stems-only floor is ≈59 % — the four stems read as the
article's section headings (working day / winter operation / gradient curve / concession terms),
which is a property of the design, not of any one option set.

**2. Its passage is internally impossible, on two independent measures, each found by a different
gate that was not looking for it.**

- *Route squeeze* (G-SPRÅK r4, in copy no repair round had edited and no earlier gate had read):
  the station is `nära två kilometer från torget`; the whole line station → Bangatan → Kyrkogatan
  → torget → lasarettet is `2,3 kilometer lång`; and the torget–lasarettet leg is an arc whose
  straight alternative is `trehundra meter kortare`. That leaves ≈0,3 km for the leg and ≈0 m for
  a straight route the text gives a 1:16 gradient, a two-horse förspann, and stops at the foot and
  the crest and nowhere between. The three figures cannot all be true.
- *Service level vs fleet and stable* (G-KEY leg 2 and G-DISTRACTOR r4, independently, with the
  same arithmetic): 22 turer/day = 50.6 car-km ≈ 2.8 horse-shifts ≈ three horses, against a stable
  sized at 34 horses for six cars plus seven winter absentees. Six cars actually working 07–21
  would give ≈164 turer/day. The two pictures differ by ≈7.5×.

Both figures are quoted verbatim by rationales in three of the four questions. Correcting them is a
passage rewrite, and a passage rewrite is a new unit wearing a repair_log.

**3. It generated repair damage at a rate no instruction lowered.** It produced 8 of round 1's 14
new defects, 10 of round 2's 17, and 8 of round 3's 14 — the last under an explicit fewest-strings
instruction, from 16 changed strings. Round 3 also introduced an undisclosed LAW 3 tell into it: the
rebuilt key `Halmen byttes en gång i veckan` is a five-token verbatim lift, the sole highest in its
set.

## What is NOT being claimed

The unit is not bad work and its withdrawal is not a quality judgement on the lane. G-DISTRACTOR
passed all four of its questions in round 4; G-REGISTER found it the only unit in the batch carrying
six of six CURRENT sibling digests, and its two corrected registry entries re-derive exactly across
three populations. The prose is good. The unit fails on a structural property — a four-question
long facktext over one subject whose stems collectively rebuild that subject — plus a passage whose
numbers were never checked against each other at generation.

## Disposition

- The unit file and its three sheets are preserved here, unmodified.
- Its verdict lines remain in `../verdicts/*.jsonl` as the record of four rounds.
- It is NOT retired, NOT promoted, and NOT in the bank. It does not bar names or families.
- The owner may revive it as a batch24 candidate with a rewritten passage; that would be a fresh
  generation against the batch23/24 brief, not a repair.
- Batch22 closes at SIX units / 16 questions.
