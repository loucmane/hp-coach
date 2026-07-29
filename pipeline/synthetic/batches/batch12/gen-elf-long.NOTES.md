# gen-elf-long — authoring notes (Batch 12)

**Unit:** ELF `long_passage_5q`, 5 questions.
**Family tag:** `dark-sky-observatory-lighting-policy-science-journalism-long`
**Title:** *Full Cutoff*
**Topic:** dark-sky preservation around an observatory — why a town can pass its
lighting audit outright while the sky over the telescope becomes less usable.

---

## 1. Genre and topic rationale

**Genre:** `science_journalism` (the ≈45% modal genre). **AmE** held throughout
(*percent, color, kilometers, nanometers, program, greenhouse*; no BrE
single-word intrusions — an early draft used *glasshouse* and it was replaced for
exactly this reason). Arc: **phenomenon → evidence → complication → verdict**.

**Why this framing.** The assigned pool (light pollution, dark-sky policy) has an
obvious lazy shape — "we have lost the stars, shield your lamps" — which is a
frictionless parable and precisely what law 9 kills, and whose questions a
knowledgeable solver answers without reading (law 1). So the piece is built on a
**mismatch of units**. Brackwell is audited on *fixtures*: poles photographed,
fixture types logged, ninety-four percent full cutoff, installed output down a
fifth, a DARK SKY COMMUNITY sign at the town line. The observatory is hurt by
*photons*, and specifically by their spectrum. Low-pressure sodium put nearly
everything it emitted inside a two-nanometer band that one piece of glass could
remove at a cost of under one percent of the working range; the shielded, dimmer,
white light that replaced it is spread across the whole visible spectrum and
cannot be filtered at all. So the ridge's headline sky-brightness number improved
slightly *and* the faint-galaxy program lost twenty-three nights a season, over
the same ten seasons. That is a genuine argument with a real antagonist, and it
resists the parable: the town is not the villain and did nothing wrong.

**Law 1 check — no famous-thesis anchoring.** Every entity is invented: the
observatory **Vellin Ridge**, the towns **Brackwell** and **Ashcombe**, the
astronomer **Nuria Feltrin**, the lighting modeler **Malcolm Rieger**, the byline
**Owen Frisk**. The physical situation is recognizable, but no key is reachable
from outside knowledge: every one rests on invented particulars — 94 percent,
a fifth, three percent, 61→38 nights, two nanometers, two hectares of greenhouse,
thirty kilometers to Ashcombe. A reader who knows real light-pollution science
still has to read; indeed general knowledge actively *misleads* here (q2 A, q3 B,
q5 A and q5 D are all built from what such a reader would assume).

**Law 6 — credited-excerpt frame.** Title lives in the `title` field only; byline
`— Owen Frisk` on its own line at the end of the final paragraph; glossary at the
very tail, defining **only** two terms that literally occur in the passage
(*full cutoff*, ¶1; *zenith*, ¶2 and ¶3).

**Law 9 — no manufactured tidiness.** The passage concedes a great deal to the
side it argues against (Feltrin grants Rieger his half "without hedging", and
Ashcombe is evidence *for* him); it carries genuine unresolved uncertainty
(Feltrin refuses to credit the three-percent improvement to anyone, because a
recalibration and two dry autumns would each move it on their own); it carries
residue that serves no question (the sign under the elevation, thirty years of
resident complaints, the red-to-blue ratio on December nights); and it declines a
resolution — she does not expect the sign to come down and says she would not
ask.

---

## 2. Planted trap architecture

The passage was written **with** the items. Each hedge, scope and quantity the
distractors operate on was planted on purpose:

| planted in passage | operated on by |
|---|---|
| "**Ninety-four percent** of the **street lighting**" | q1 A (→ every light in the valley) |
| "Every pole … has been **photographed and logged**" | q1 B (audit "never established" the share) |
| Ashcombe: "no code was ever adopted, **uplight rose**" | q1 D (relocated to Brackwell) |
| "in **total no brighter**" / "**Fewer photons** now arrive" | q2 C (direction reversal), q5 D (total rose) |
| "cost of **well under one percent** of the range" | q2 D (→ most of the blue end) |
| "**either of those** … would move a three percent figure" | q3 A (picks one), q3 B (credits the code) |
| Ashcombe's series moving together under no code | q3 C (monitoring "cannot establish… anywhere") |
| Rieger's quote vs. Feltrin's half-concession | q4 B (attribution swap) |
| "the **worst single source** now visible from the dome" | q4 D (→ minor exception), q5 B (→ the one thing) |
| installed output **down** a fifth over the decade | q5 A (population and lighting "both grew") |

**Block budget** (`families.md`): 2× TYPE-001, 1× TYPE-002, 1× TYPE-005,
1× TYPE-004 at an **edge** position. Main idea placed at position **5** (the other
legal edge); local items q1–q4 follow passage order (¶1 → ¶3 → ¶2/¶3 bridge → ¶4).

| q | family | position | anchor | key | trap set |
|---|---|---|---|---|---|
| 1 | ELF-TYPE-001 detail | 1 | ¶1 | **C** | quantifier_upgrade+scope / over-hedged contradiction / wrong_location |
| 2 | ELF-TYPE-001 detail | 2 | ¶3 | **B** | outside_knowledge / direction reversal / surface_word_match |
| 3 | ELF-TYPE-002 inference | 3 | ¶2 | **D** | too_literal(+commitment) / confident misattribution / too_far |
| 4 | ELF-TYPE-005 stance | 4 | ¶4 | **A** | role_or_attribution_swap / polarity overshoot / measured weight-reversal |
| 5 | ELF-TYPE-004 main idea | edge (5) | whole text | **C** | outside_knowledge / scope_error(distorted) / surface_word_match |

**Key spread:** C, B, D, A, C — no column, no adjacent repeat, no positional tell.

### Law 10 — breaking the hedged-key correlation

Across the sheet only **two of five** keys are the more measured option (q3, q4),
and on **both** of those a distractor is written at least as measured as the key:

- **q1 is the inversion.** The key is the flat, numeric, confident claim ("Nearly
  all of it is shielded now… total installed output has come down"); the
  *cautious-sounding* option B ("the council reports progress, but its audit has
  never established…") is **wrong**, and contradicted by ¶1's opening sentences.
- **q2** likewise keys the confident technical claim; no option there is hedged.
- **q3 C** ("cannot establish whether a lighting code has worked anywhere") is
  *more* absolute-cautious than the key, and q3 B carries its own "though by less
  than…" hedge — so "pick the careful one" does not converge on the key.
- **q4 D** was written to feel exactly as qualified as the key ("broadly borne
  out", "a minor exception") and is wrong on weight.
- **q5** keys a flat declarative against three equally confident rivals.

### Cross-question corroboration guard

Checked as a **sheet**, not item by item. The five keys assert five different
propositions: (1) a source-side audit fact about Brackwell; (2) a spectral fact
about the old lamps; (3) an epistemic claim about one measurement's
attributability; (4) the writer's stance toward a named antagonist; (5) the
whole-text mismatch of units. No key is the "qualified/inclusive" option twice in
a row, and no two keys are the same thesis in different dresses.

No question's options reveal another's key. Concretely: Rieger's position was
deliberately **removed** from the q5 option set (an early draft had "codes should
be scored on uplight" as the main-idea decoy) because q4's key already
adjudicates it, and leaving it in would have let q4 dispose of a q5 distractor.
Where q1's key and q5's D touch the same passage fact (installed output fell),
q5 D is independently defeatable from ¶1 and ¶3 without q1, so nothing is
smuggled between items.

### Law 11 / distractor plausibility

No distractor is verbatim-true; each carries one flaw a careful reader can point
at — a percentage upgraded to "every" (q1 A), a total run backwards (q2 C), "well
under one percent" inflated to "most of the blue end" (q2 D), one of two candidate
causes promoted to the cause (q3 A), a weighting reversed (q4 D), a sub-point made
"the one thing" (q5 B). And none is a caricature: q2 A (lamps swapped for
efficiency), q3 B (the code bought a small real improvement), q5 A (the valley grew)
and q5 D (total light kept rising) are all *the ordinary real-world explanations* a
passage-blind reader would default to — they fail only against what this text says.

### Stem law

Every stem names a setup without entailing an answer. q3's stem restates the
three-percent figure so that the item asks what the text *makes* of it — it fixes
the target without indicating the direction, and A, B and C are all answers to the
question as asked. q4's stem names Rieger's case in his own terms ("shielding is
what counts") so that endorsement, rejection and partial concession are all live.

---

## 3. Self-blind-solve (skeptical, arguing *for* each non-key)

Solved from the passage alone, defending each distractor in turn.

- **q1 → C, single.** A is the strongest rival — the sign and the exhaustive audit
  invite "every light" — but ¶1 gives ninety-four percent and restricts it to
  street lighting, and ¶4 produces a lit installation the code never reached. B is
  flatly contradicted by the pole-by-pole logging. D is Ashcombe's story, and the
  survey plane measured *less* light leaving the valley.
- **q2 → B, single.** A is the item's real risk: efficiency is why lamps get
  replaced in the world, and the passage supplies a motive (thirty years of
  complaints) without supplying a reason. It dies only because the text is silent —
  which is the correct way for an outside_knowledge trap to die. C reverses the
  passage's own comparison; D contradicts "well under one percent" and puts the
  removed band at the wrong end of the spectrum (sodium is described as orange).
- **q3 → D, single.** B is the tempting confident reading and was the one that
  needed the most care: ¶2 says outright "Feltrin will not credit that to
  Brackwell", and the semicolon clause explains why, so B has no footing. A takes
  one of two candidates the passage explicitly holds as *either*. C over-generalizes
  to the method, which Ashcombe's converging series refutes inside the same piece.
- **q4 → A, single.** B is the signature swap and the quote is the most memorable
  sentence in the passage — but it is introduced with "he says" twice. C overshoots
  a text that concedes Rieger his half "without hedging" and adds its own
  endorsement sentence ("Where the fixtures are unshielded the fixtures are the
  story"). D reverses the weight the paragraph gives the greenhouse.
- **q5 → C, single.** B was the item's other risk — the greenhouse is vivid and
  late — but it is a sub-point of the coverage argument, and "the one thing" ignores
  ¶3, where compliant street lighting itself costs the ridge nights. A is never
  stated and is contradicted in direction. D is contradicted three ways (installed
  output, the survey plane, "Fewer photons now arrive at the dome").

**Rewrites forced by this pass:** (i) q5's Rieger-as-thesis distractor was replaced
by the population/lighting-growth option, to close a cross-question leak from q4;
(ii) q2's key was shortened from 19 to 18 words so it no longer tied for longest;
(iii) *glasshouse* → *greenhouse* throughout, to hold one spelling/lexical variety
(AmE); (iv) q4 D's "uncoded" → "unregulated" (coinage removed).

**Result: no two-way item remains.**

---

## 4. Band compliance (measured with `mech.py`)

`run_mech.py` — **M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass,
M-PLAGIARISM pass** (zero findings on all five).

| stat | value | band |
|---|---|---|
| passage words | **791** | ELF long_passage 332–873 (blueprint 550–825) |
| sentences | 35 | — |
| mean sentence words | **22.60** | 14.9–35.4 (blueprint 16–30) |
| sentence-length sd | **16.81** | ≥ 7 |
| shortest / longest sentence | 4 / 85 | high variance by design; the 85 is the byline+glossary fold noted in law 6 |
| paragraph blocks | 5 paragraphs + glossary block | long: 3–6 logical paragraphs |
| prompt words | 11 / 14 / 23 / 15 / 6 | 3–30 |
| option words | 14–20 | 0–31 |
| option length ratio | 1.06 / 1.19 / 1.36 / 1.19 / 1.11 | cap 2.36 |
| key is longest option | **never** (0 of 5) | M-TELL |
| key letters | C, B, D, A, C | spread |

Spelling variety: **AmE**, single, verified by read-through.
