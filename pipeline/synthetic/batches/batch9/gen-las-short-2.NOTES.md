# gen-las-short-2 — "När staden slutade se upp mot klockan"

**Topic (batch9 exclusive):** offentliga ur — stadens klockor och tidssignaler.
**Unit type:** LÄS short (2 questions). **family:** `offentliga-ur-essa-short`.

## Genre and topic rationale

`sakprosa / essä`, opening move = scene (a stopped school clock showing ten to
four), then an inventory, a mechanism, a dismantled received explanation, a
caveat, and a signed close. Essä rather than populärvetenskap so the register can
carry a reflective voice without becoming a study report — and so it sits apart
from batch 8's `fjallstigsslitage-essa-short` in subject matter while still using
a different rhetorical shape (scene-lede, not framing-claim).

Nearest earlier topics are the church-organ and lighthouse units; neither touches
timekeeping, public infrastructure signalling, or the social-coordination angle,
and no shared entity, place or mechanism is reused.

**No manufactured tidiness (law 9):** the passage keeps concrete residue that does
*not* serve the thesis — well-kept clocks on squares with no departures at all,
maintained by a merchants' association that simply dislikes a wrong time, plus
Ekvall's own limitation (three towns are not the country; industrial towns may
differ). The sawmill whistle is a genuine digression that also happens to fund a
distractor.

**Frame:** title separate from `passage`; byline `— Petra Sundelius, essäist`
last; two glossary entries (`färjeläge`, `torgur`), both for words that actually
occur. All entities fictional: Sörby läroverk, Marianne Ekvall, Petra Sundelius.
No famous thesis anchored — the "clock time and industrial discipline" literature
is deliberately *not* invoked; the passage's claim is a local inventory finding,
and its explanation is stated in passage-specific terms.

## Planted targets

- **P2 finding**, quantified and directional: of the 32 clocks still showing the
  right time, 27 stood by a ferry berth, bus station, schoolyard or factory gate;
  the costly clocks (church towers, bank façades, gilded hands) went wrong
  *oftare*. The hedge ("oftare fel") and the 27-of-32 count are both absolutisable.
- **P3 mechanism**: repair follows daily use, not money.
- **P4 turn**: the wristwatch/phone explanation is stated and then rejected
  ("Den räcker inte"), with the sawmill whistle as counter-evidence (it never
  replaced the clock; it presupposed it, and it ran into the sixties).
- **P6 thesis**: the public clock was primarily an *agreement*, and agreements
  decay when nobody needs them.

## Trap architecture

**Q1 — `enligt_texten_detalj`** ("Vad framkom … vid Ekvalls inventering …?"); key **C**.
- A `reversed_causality` — same two categories, inverted outcome (prestige →
  maintenance). The hardest distractor: "expensive things are better maintained"
  is a strong prior a passage-blind reader cannot dismiss, and A is phrased in the
  *measured* register ("oftare hade stannat") so form gives nothing away.
- B `overgeneralisation` — upgrades "oftare fel" to "varje … hade stannat" and
  27-of-32 to "alltid rätt"; also contradicted by the square clocks in P5.
- D `scope_shift` with surface echo — the sawmill whistle really is in the text,
  but distorted twice (it never took over; it ran into the sixties, not the
  interwar years), so it is identifiably flawed rather than verbatim-true.

**Q2 — `huvudbudskap_syfte`** ("Vilket påstående överensstämmer bäst med texten?"); key **A**.
- B `detail_as_main` **with a planted distortion (law 11)** — the survey's stated
  purpose was deciding which clocks were *worth repairing*, not which should be
  heritage-listed. Both a wrong detail and a method sub-track promoted to thesis.
- C `overgeneralisation` — absolutises exactly the explanation the passage rejects
  ("Den räcker inte") and is contradicted by the clocks still repaired by their
  daily users.
- D `reversed_causality` — flips the passage's causal order: the text has the
  vanished *need* come first and neglected maintenance follow; D makes neglect the
  cause of abandoned timetables. Measured in form, wrong in direction.

**Hedge balance (law 10):** Q1's key is a plain, confident locational claim while
the measured-sounding option (A) is wrong; Q2's key is the hedged one ("främst").
Correct and qualified therefore do not correlate across the unit. M-FORM passes.

## Self-blind-solve

Solved both from the passage alone, arguing actively for every non-keyed option.

- **Q1 = C, single.** A is refuted by the 27-of-32 sentence plus "De påkostade uren
  … gick oftare fel". B is refuted by the same two numbers (five working clocks
  stood elsewhere) and by "oftare", not "varje". D is refuted inside its own
  source sentence ("visslan ersatte aldrig uret — den förutsatte det") and by the
  decade.
- **Q2 = A, single.** B is refuted by the stated purpose in P2. C is refuted by
  "Den räcker inte" and by P3. D survives longest — it uses real passage elements —
  but the text's order is need → neglect, never neglect → timetable change. A is
  the only option that spans P2 (finding), P3 (mechanism) and P6 (thesis) while
  keeping the P5 caveat via "främst".

Both items were re-read skeptically for a second defensible key; none found. The
first draft of Q2's B was an undistorted method statement — rewritten with the
heritage-listing error so it cannot be verbatim-true (law 11).

## Band compliance (measured with `mech.tokenize` / `mech.sentences`)

| stat | value | band |
|---|---|---|
| passage words | 384 | LÄS short 188–588 (blueprint 290–500) ✓ |
| sentences | 24 | blueprint 15–29 ✓ |
| mean sentence words | 16.0 | 10.1–36.5 ✓ |
| paragraphs | 7 | 1–20 (blueprint 3–13) ✓ |
| prompt words | 11 / 6 | 3–31 ✓ |
| option words | 13–21 | 0–23 ✓ |
| option length ratio | 1.40 / 1.46 | ≤ 5.25 ✓ |
| key longest? | no (Q1 max = A 21; Q2 max = D 19) | M-TELL ✓ |
| key letters | C, A | spread ✓ (batch pair: B, D / C, A) |

`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM all **pass**.
