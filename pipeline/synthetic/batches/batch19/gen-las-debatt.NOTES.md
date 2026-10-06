# gen-las-debatt (batch19) — LÄS short debatt, 2 questions

**Unit:** `batches/batch19/gen-las-debatt.json` · `candidate_id: "PLACEHOLDER"`
**Family:** `badbrygga-avgift-debatt-short`
**Title:** Vässlingsbadet och Stångklippan
**Topic:** brief option (b) — the municipal bathing jetty is to be charged for
in order to finance lifesaving equipment.
**Keys:** q1 = **D** (`forfattarens_hallning`) · q2 = **A** (`enligt_texten_detalj`)

---

## 1. Genre / topic rationale

`sakprosa / debatt_opinion`, `short` (2 questions), opening move =
framing-claim delivered as a self-implication. Signed local column with a
**stated stake that cuts against the author**: Bengta Ödgren sits on the bathing
association's board, voted for the fee in the association's own remissvar, and
discloses in the second sentence of paragraph 1 that the association would be
*paid* for the inspection work the fee finances. She is recanting her own vote.
That frame does three jobs at once — it supplies the stake without a
credential, it seeds the `plausible_worldknowledge` distractor for q1, and it
supplies the passage's non-tidy residue (law 9).

Topic clearance: option (a) *hundrastgård* was rejected because
`hundrastgardar-delade-ytor-debatt-short` is already shipped; option (c)
*gatuträdens löv* was rejected as grazing batch18's
`street-tree-root-cells-pavement-heave-science-journalism-long`. Option (b)
checked against the shipped debatt-short list (skolbibliotek, grannsamverkan,
offentliga toaletter, läxor, flaggsed, föreningslokaler, skolmat, nattåg,
medborgarforskning, dialekt, hemberedskap, cykelpendling, kontantfria,
gatunamn, skolskjuts, farthinder, elljusspår) — no overlap — and against
`folkbadhus-institutionshistoria-popularvetenskap-long`, which is indoor
bath-house institutional history in another genre, not a fee dispute.

## 2. Surface / structure compliance (brief-specific)

| requirement | how it is met |
|---|---|
| reorder the five-move skeleton vs batch18 | batch18 = scene → stake → facts → teardown → **concession**. Here: **stake (self-implication)** → **concession** → proposal-facts → teardown A (precedent) → teardown B (geography) + proposal → **scene close**. Opening and closing moves are both swapped; the concession moves from last to second. |
| no announced objection | no voiced-then-rebutted opponent objection anywhere; no "invändningen…", no "det vore lätt att…". The concession is asserted flat ("Att åtgärder behövs är ingen stridsfråga") rather than staged. |
| no years-credential | the stake is a *role plus a disclosed conflict of interest*, never a duration ("Jag har X i N år" absent). |
| gender/temperament independent of stance | author is a woman with a brisk, unhedging, technical voice who is **arguing against her own earlier position** — breaks the bank's careful-woman / overconfident-man mould and decouples temperament from the stance she now holds. |
| no named-month nämnd-deadline close | the passage closes on a **scene** and stops ("Förra torsdagskvällen räknade jag från bryggan… Bojen hängde där den hänger, med linan kapad"). No month is named anywhere in the closing move; no meeting date, no ärende reference. |
| law 15 title quota | flat **place-pair** title, no "The + modifier + noun", no negation headline, no colon. |
| law 15 numeric register | mixed: spelled-out (tjugo, tvåhundra, fjorton, elva, arton, sex, två) and digits (4 800, 61 000, 9 000, 31 %, 2,3 km, 2021). |
| glossary / byline | glossary **dropped** (no term needs glossing); byline kept, en-dash form, inside the `passage` string. |
| batch16 rule 2/3 | no quotations used; spaced en dash only — em dash absent from the whole file (asserted mechanically). |
| batch16 rule 5 | every option ≤ 11 words, no semicolons; **q2 is the short-breath question** (8-word stem, options 5–6 words). |

**Law-12 clone diff vs batch18's debatt.** batch18's spine is an *arithmetic
teardown*: the nämnd's kalkyl uses obsolete lamps, so recompute it. This unit's
spine is a **placement/displacement argument**: the money is raised at the
place where the incidents are not, and the fee is expected to push bathers to
the place where they are. The numeric strand is deliberately compressed to a
single precedent (one figure, no re-derivation of a corrected total) so the
unit does not read as "recompute the municipality's sum" a second time.
M-ECHO passes against all **114** shipped `candidates-final` units as well as
against batch18's candidates.

## 3. Planted trap architecture

Planted target for q1 (whole-text stance, distributed): concession in ¶2
("Att åtgärder behövs är ingen stridsfråga" + cut line, short ladder,
defibrillator 2,3 km away) **plus** the rejection in ¶5 ("Köp bojarna,
badstegen och hjärtstartaren över driftsbudgeten"). The stance is therefore
two-part and *both parts are explicit*.

| q1 option | trap operation |
|---|---|
| A | `scope_shift` — treats the numeric criticism as an objection to the fee's *level*; the text wants the fee gone, and a higher fee would strengthen the displacement it warns about. |
| B | `reversed_causality` against the concession — the text names two upkeep failures, which tempts "upkeep is enough"; but the demand is for *new* buoys, a *new* ladder and a defibrillator, i.e. supplementation. |
| C | `plausible_worldknowledge` / `detail_as_main` — the author's own association is mentioned as being paid for inspection, which makes "let the association do it" feel supported; the text raises that fact as grounds for *distrusting her own remissvar*, and points the financing at the kommun's driftsbudget. |
| **D (key)** | paraphrase spanning both halves of the stance, with neither half sharpened. |

Planted target for q2 (single sentence, ¶4): *"Kommunens egen uppföljning
landade på en betalningsgrad om 31 procent av gästnätterna."*

| q2 option | trap operation |
|---|---|
| **A (key)** | the complement of the planted figure (31 % paid ⇒ ≈ 7 in 10 unpaid) — a paraphrase that requires the flip, not a lift. |
| B | over-hedged and false in substance — the follow-up produced a definite figure. This is the deliberate rule-10 break (see §5). |
| C | `reversed_causality` / quantifier inversion — right quantity, wrong pole. |
| D | `surface_lexical_echo` — *skylten* recurs in the passage (at the landfäste, at the ställplats), so the sentence feels familiar; nothing in the text says any sign was removed. |

Law 11 (no verbatim-true distractor): every q1 and q2 distractor carries a
locatable flaw; none is a faithfully quoted true detail.

## 4. RULE 11 — cross-question lemma audit (mechanical)

Computed over the two **option sets alone** (passage and stems excluded),
Swedish function words and words ≤ 2 characters stripped:

- q1 option lemmas: anger, avgiften, behövs, bekosta, fel, finansiera, finns,
  förbättras, föreningen, förslaget, godtas, högre, räcker, skötseln, sätt,
  sättas, utrustning, utrustningen
- q2 option lemmas: betalda, betalningsviljan, efter, mäta, ned, nästan,
  nätter, obetalda, sju, skylten, svår, säsong, tio, togs, visade

**Content lemmas appearing in ≥ 2 questions' option sets: none (empty
intersection).** No survivors to justify. The stems do not bridge either
(q1 names *avgiftsförslaget*, q2 names *ställplatsen för husbilar*; no shared
content word).

**Paraphrase-level concept check (the part the lemma diff cannot see).** q2's
content (a payment scheme that mostly went unpaid) is evidence *against fees in
general*, so a blind solver who has read q1's option field can use it to
disfavour q1's option A. It is reported here rather than removed, because it
**cannot separate C from D** — both of those concede the need and reject the
fee — and C vs D is the entire discrimination q1 asks for. The bridge therefore
does not improve on the stated q1 floor. This is the cross-question stance
correlation the batch16 owner ruling (dom 1) classifies as *reportable at note
severity, non-blocking*, and it is reported at that severity here.

## 5. RULE 13 / rule 10 — hedge and absolutizer balance

| question | key form | is the key the sole qualified option? | absolutizers |
|---|---|---|---|
| q1 | two-part qualified ("Utrustningen behövs, men…") | **No** — A ("kan godtas, men…") and C ("Utrustningen behövs, men…") share the same qualified two-part shape; C is a deliberate formal twin of the key. B is the only single-clause option and is wrong. | none in any option |
| q2 | **flat, unhedged, numeric** ("Sju av tio nätter blev obetalda") | **No** — the cautious-sounding option B ("svår att mäta") is the *wrong* one. This is the required rule-10 break. | only C ("Nästan **alla**") |

"Pick the qualified/hedged option" therefore selects the key in **0 of 2**
questions on q2's design and is undecidable on q1 — inside rule 10's ≤ ½ bound.
M-FORM passes: no question has an unabsolutized key facing three absolutized
distractors.

## 6. RULE 12 — stem-entailment check

Each stem read alone, and what it gives away:

- **q1 — "Vad anser textförfattaren om avgiftsförslaget?"** Gives away only the
  presupposition that a fee has been proposed (which the title does not even
  reveal). It predicates nothing contested about the proposal and entails no
  option's claim; all four options are answers of the same type.
- **q2 — "Vad sägs i texten om ställplatsen för husbilar?"** Purely
  referential: names the ställplats without asserting anything about it. It does
  not even reveal that the matter at issue is payment — the solver must get that
  from the options. No entailment.

## 7. Self-blind-solve (passage withheld, then re-solved with passage)

**q1, blind (title + stem + options only).** B reads as a do-nothing position
and is unlikely for a signed column; A supports the fee. C and D are formally
indistinguishable — both concede the need and reject the fee, differing only in
who pays instead. Adversarial blind field = {C, D}.
→ **Honest adversarial blind floor: 1-in-2.** (At the policy line, not better
than it.)

**q1, with passage.** D is the only defensible answer. C fails on two explicit
sentences: the financing is pointed at the kommun's driftsbudget ("Köp bojarna,
badstegen och hjärtstartaren över driftsbudgeten"), and the association's own
payment for tillsyn is introduced as a reason for the author to distrust her
earlier vote, never as a proposal. A fails because the remedy sought is removal,
not adjustment. B fails because new equipment, not better upkeep, is demanded.
Single defensible key confirmed.

**q2, blind.** The stem carries no stance cue. A, B and D are all compatible
with a critical column; C with a supportive one. A solver who has inferred the
column's direction from q1's option field is left with three candidates.
→ **Honest adversarial blind floor: 1-in-3.**

**q2, with passage.** 31 % of gästnätterna paid ⇒ ≈ 7 in 10 unpaid: A. B is
contradicted by the existence of the figure; C inverts the pole; D is
unsupported. Single defensible key confirmed.

**Key spread:** D, A — two distinct letters, no A-default column, and not
batch18's (C, B) pair.

### fleet-repair-4 correction (2026-09-01) — floors restated on the shipping bytes

*Appended, not substituted. Everything above this line is left exactly as it was
written so the record shows what was believed and when. Sources:
`audits/las-b19-002.json` **floors_assessment** ("FLOORS RULING") with findings
**F1**, **F2**, **F13**, and `reviews/pedagogy.jsonl` las-b19-002 **FIX 1** and
**FIX 2**. Both corrections are now also carried in the unit's own bytes at
`generator_meta.adversarial_blind_floors`, because a floor stated only in a NOTES
file does not travel with the unit (F13).*

- **q1 — floor 1-in-2 STANDS, its derivation above does NOT.** The paragraph above
  builds the field on **{C, D}** — "C and D are formally indistinguishable — both
  concede the need and reject the fee". That describes the **pre-repair** option C,
  *"Utrustningen behövs, men föreningen bör bekosta den själv"*, which
  `fleet-repair-1` deleted. The shipping C is *"Förslaget bör genomföras som det
  ligger, eftersom badgästerna har nytta av utrustningen"* — a flat causal
  **endorsement**, a contrary of D rather than its twin. Re-derived on the shipping
  stems sheet: B falls to scope, and the two **concessive two-part** options are now
  **A** (*"kan godtas, men …"*) and **D** (*"Utrustningen behövs, men …"*).
  **Honest adversarial blind field = {A, D}. Floor = 1-in-2 — same number, different
  pair.**
- **q1, with passage — the refutation of C above is also stale.** It kills C on the
  driftsbudget sentence and on the association's payment for tillsyn, which is the
  refutation of the OLD C. The shipping C needs the author's retraction plus the
  geography defeat of the benefit principle, which the unit's shipping q1 rationale
  does supply correctly.
- **q2 — declared floor 1-in-3 is FALSIFIED; honest floor is 1-in-2.** The
  derivation above reaches {A, B, D} by "inferring the column's direction from q1's
  option field" — the very cross-question channel `fleet-repair-1` was built to
  close, so it argues against that repair's own recorded success. It never considers
  that **A** (*"Sju av tio nätter blev obetalda."*) and **C** (*"Nästan alla nätter
  blev betalda."*) are **direct contradictories on the payment rate**, which both
  G-STEM rounds named at major severity. B is a meta-claim and a non-answer to a
  *"Vad sägs i texten om X?"* stem; D concerns a sign, not payment.
  **Honest adversarial blind field = {A, C}. Floor = 1-in-2**, and a **single
  survivor** for a solver who also strips C's absolutizer *"Nästan alla"*.
- **Position against policy.** Both questions sit **exactly AT** the 1-in-2 ceiling
  of BRIEF-ADDENDUM efterhandstillägg 1 (ägardom batch16 dom 1) — **at it, not above
  it and not better than it**. Condition (a) therefore holds on the honest numbers;
  condition (b) was re-verified on the shipping bytes ("pick the qualified option" is
  *undecidable* on q1 and picks a *distractor* on q2). **Not blocking.**
- **Counterweight, recorded and not suppressed.** G-STEM r2's live blind reader
  reached the {A, C} pair and then picked **C — the wrong member**. The q2 chain is
  heuristic, not deterministic. The same audit converts the open G-STEM r2 q:2
  **major** to a **note** under the same owner ruling; that disposition is recorded
  in the bytes at `generator_meta.gate_dispositions`.

## 8. LAW 16 / RULE 14 — real-entity verification (search log)

Full re-runnable log lives in `generator_meta.originality_note`. Summary:

- **Positive control first, same endpoints, same session:** `"Flarken"` →
  sv.wikipedia CirrusSearch exact phrase `totalhits=56` (*Flarken, Luleå
  kommun*; *Flarken, Robertsfors kommun*); Nominatim `countrycodes=se` → 10
  results incl. the hamlet at Rutvik. Control passing on **both** endpoints, so
  a zero below is informative.
- `"Bengta Ödgren"` → sv.wiki 0 · Nominatim 0. Surname alone `"Ödgren"` →
  sv.wiki 0 · Nominatim 0. Exact-quoted web search returned no bearer of the
  phrase (only fuzzy fallbacks onto unrelated *Bengt* articles).
- `"Vässlingen"` (lake) → sv.wiki 0 · Nominatim 0. Diacritic-variant probe
  `"Vesslingen"` → sv.wiki 0 · Nominatim 0. Web search returned no bearer.
- `"Vässlingsbadet"` → sv.wiki 0 · Nominatim 0.
- `"Stångklippan"` → sv.wiki 0 · Nominatim 0; exact-quoted web search returned
  no bearer.
- **Evidence that the Nominatim zeros are meaningful against near-variants:** a
  rejected candidate, `"Slädtjärnen"`, came back with the *real* **Sladtjärnen,
  Tanums kommun** — a one-letter variant — and was discarded on that basis. The
  fuzzy matcher was demonstrably live in the same session.
- No institution, firm or authority is named: *badföreningen*, *förvaltningen*,
  *räddningstjänsten*, *badvärdarna* are common nouns. No street name is used.
- Name-list compliance: **Bengta** is absent from the 231-name USED GIVEN NAMES
  list and from batch17's and batch18's additions; **Ödgren** is absent from the
  274 full-name pairs and is not a one-letter variant of any of them;
  **Vässlingen / Vässlingsbadet / Stångklippan** are absent from the excluded
  toponym list (Myrsjövägen, Tunbergsvägen, Vrantebo, Hyllemåla, Rossmåla,
  Sölvinge, Flarkbro, Brantmyr-, Näversved-, Bjässemon, Klyvinge, Härkilsnäs,
  Ylmaren, Stintbury).
- **NOT CERTIFIED FICTIONAL.** The above is the log of the checks actually run,
  nothing more. All four coined names are **flagged for V-FINAL
  re-verification**.

## 9. Measured stats (mech tokenizer)

| stat | value | band |
|---|---|---|
| passage words | 390 | blueprint short 290–500 (target ~400); M-BANDS short 188–588 ✔ |
| sentences | 24 | blueprint 15–29 ✔ |
| mean sentence words | 16.25 | blueprint 14–25; M-BANDS short 10.1–36.5 ✔ |
| sentence-length spread | 6 … 29 words | varied, not uniform ✔ |
| paragraphs | 7 (byline its own block) | blueprint short 3–13 ✔ |
| LIX | 44.7 | sakprosa 44–58 ✔ (debatt preset 46–56 — authoring heuristic only, law 7; kept at the low edge because the column is first-person and scene-anchored) |
| prompt words | q1 = 5, q2 = 8 | M-BANDS 3–31 ✔ |
| option words | 5 … 11 | M-BANDS 0–23 ✔; batch16 rule 5 cap ≤ 21 ✔ |
| option length ratio | q1 11/8 = 1.38, q2 6/5 = 1.20 | cap 5.25 ✔ |
| key-longest questions | 0 of 2 (q1 key ties A at 11; q2 key ties at 6) | M-TELL ✔ |

## 10. Mechanical self-check result

```
python3 gates/scripts/run_mech.py batches/batch19/gen-las-debatt.json \
  --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed \
  --p5-corpus-dir auto batches/batch18/candidates
```

```
M-ECHO: indexed 7 shipped unit(s)
M-SCHEMA      pass  []
M-BANDS       pass  []
M-TELL        pass  []
M-FORM        pass  []
M-ECHO        pass  []
M-PLAGIARISM  pass  []
```

Re-run with `--p5-corpus-dir auto` alone (114 indexed `candidates-final`
units): all six gates **pass** as well.

## 11. Residue / honest flags for the adjudicator

1. **Cross-question stance correlation is present** (§4) at the severity the
   batch16 ruling assigns it. Stated floors: **q1 = 1-in-2, q2 = 1-in-3**.
   q1 sits exactly at the 1-in-2 policy line, not better than it.
2. **LIX 44.7** is at the bottom of the sakprosa band and below the
   debatt preset's 46. Deliberate: the column is first-person, scene-anchored
   and locally concrete. G-SPRÅK / G-REGISTER own the call.
3. **Four coined names flagged for V-FINAL** (§8) — Bengta Ödgren, Vässlingen,
   Vässlingsbadet, Stångklippan. No mechanical gate can verify these.
4. **The self-undercut in ¶5** ("Badvärdarna för visserligen dagbok bara under
   skolloven") weakens the author's own 14/11 incident split on purpose (law 9).
   It is not load-bearing for either key, and no option turns on it.

---

## 12. Post-repair audit — round `fleet-repair-1` (2026-09-01)

Repair round after the full gate fleet. Unit `las-b19-002`. Passage touched at
five listed points (`lade min röst för` → `röstade för`; `ta tillbaka rösten` →
`ta tillbaka min röst`; the `linan`-anaphora sentence; `sattes upp` → `infördes`;
`sätt` → `sätt upp`); **q1's option C was rewritten** to clear the G-STEM
containment defect (old C was a special case of key D) and, in the same move, to
close the stance leak by giving the set a genuine pro-proposal position. q1's
C-rationale rewritten, D-rationale destalked (`formuleras som att` → `är att`).
Full old→new list in the unit's `repair_log`.

### RULE 11 — cross-question option-lemma sweep (re-run on the repaired sheet)

Option sets read ALONE. Content lemmas appearing in ≥2 questions' option sets,
exact and by 5-character prefix: **none**.

q1 now runs on `avgiften` / `förslaget` / `utrustningen` / `badgästerna` /
`skötseln`; q2 on `nätter` / `betalda` / `obetalda` / `betalningsviljan` /
`skylten`. The new C was deliberately built on the *benefit* axis
(`badgästerna har nytta av utrustningen`) rather than on the revenue axis: a
draft arguing that "intäkterna räcker" would have put the payment-rate concept
into q1's option set while q2's set is entirely about payment rates — a
concept-level bridge of exactly the kind rule 11 exists to stop, even though no
word would have repeated.

### RULE 12 — stem-entailment check (each stem read alone)

| q | what the stem gives away, read alone | entails an option? |
|---|---|---|
| 1 | that the author holds *some* view of the fee proposal — no direction, no sign | no. This is the stem that matters after the repair: previously the *option set* leaked the direction (two options opened `Utrustningen behövs`, none defended the proposal). Post-repair the set spans accept-but-raise (A), deny-the-need (B), implement-as-written (C) and need-but-wrong-route (D), so the stance is no longer recoverable before the passage is opened |
| 2 | that the passage says something about the motorhome stopover — nothing about payment, direction or outcome | no — the rule-12 preferred referential shape |

### Mechanical re-run

`run_mech.py` over the repaired candidate, `--parsed-dir data/parsed`,
`--p5-corpus-dir auto` (114 shipped units indexed), exit 0:

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass   (0 findings)
```

Stats after repair: 390 passage tokens · 24 sentences · mean 16.25 w/s ·
7 paragraphs · option ratios 1.50 (q1) / 1.20 (q2) · key longest 0/2.
Note for the adjudicator: §11's residue item 1 (cross-question stance
correlation, floors q1 = 1-in-2, q2 = 1-in-3) is **improved, not merely
restated** — q1's set no longer discloses the author's direction, which was the
cross-question half of the G-STEM q2 flag.
