# gen-las-essa — LÄS short, essä/kulturhistoria (batch19)

**Family:** `telefonkatalogens-yrkestitlar-essa-short`
**Title:** Yrket efter namnet i Ledingsbos katalog
**Size/genre:** short (2 questions) · sakprosa · essa_kulturhistoria · opening move = result-lede
**Mech self-check:** all six gates PASS (M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-ECHO, M-PLAGIARISM),
both against `batches/batch18/candidates` (7 units) and against the full bank
(`--p5-corpus-dir auto`, 114 shipped units). 395 passage tokens · 26 sentences ·
mean 15.19 w/sentence · 7 paragraph blocks · option ratios 1.27 / 1.33.

---

## 1. Topic and lane

**Topic (brief option a):** the occupational titles subscribers put after their names
in a small telephone association's directories, 1907–1931, and why the titles inflated.
The essayist notices the inflation, suspects an *administrative* cause (an approved-title
list on the form, a per-word fee, a cashier with opinions), tests it against the surviving
subscription slips — and the ordinary explanation (people chose grander words for
themselves) survives intact.

**Why (a) and not (b) or (c):**

- **(b) väntsalarnas ordningsregler** — *rejected.* Grazes two shipped lanes at once:
  `ELF-CLOZE-001 / queueing-culture-unwritten-rules` and
  `ELF-CLOZE-001 / village-noticeboard-pruning` are both "posted rules and who they are
  really aimed at"; the railway frame also sits beside `nattagssubvention-debatt-short`
  and `ELF-TYPE-001 / welded-rail-ballast-resistance`.
- **(c) gravstenarnas yrkesangivelser** — *rejected on motif saturation, not exclusion.*
  Nothing in the 121 excluded families names churchyards, but batch18's essä
  (`kyrkbatslag-roddordning-essa-short`) and the earlier `kyrkorgelhistoria-essa-short`
  already put two church-parish essäs in the bank; a third would be the third
  church-adjacent LÄS short in a row. Also: occupational inscriptions on stones is the
  same *payload* as (a) — occupational self-description in a printed/carved register —
  so taking (a) keeps the better-differentiated of the two.
- **(a) telefonkatalogens yrkestitlar** — *taken.* Bank-wide word-boundary grep for
  `telefonkatalog`, `telefonförening`, `yrkestitel`, `abonnent` over `batches/`, `las/`,
  `elf/`, `adjudication/` returns **0 hits**. Nearest shipped neighbours are
  `ELF-CLOZE-001 / decline-of-the-personal-phone-call` (telephone *calls*, social
  etiquette — different payload, different section) and
  `postvasende-landsbygdshistoria-facktext-long` (rural postal logistics — no overlap with
  self-description in a subscriber register). Deliberately avoided the brief's fenced
  topics: no kyrkbåtar, skolplanscher, midsommarstänger, brevlådor/posthistoria,
  namnsdagar.

## 2. Architecture (law 12 + the brief's architecture directive)

Required shape: **conventional-view-confirmed** (rare in the bank), **skeptic = an
archivist who turns out right**, **flat factual coda**. Diff against the nearest mould,
batch18's essä `Sätena i kyrkbåten`:

| axis | batch18 essä | this unit |
|---|---|---|
| thesis shape | genuinely unresolved — both readings left standing | **conventional-view-confirmed** — the essayist's clever hypothesis is tested and dies; the plain explanation stands |
| skeptic slot | the essayist doubts *herself*; no external challenger | **external archivist (Enar Rämnestad) holds the ordinary view from the first visit and is proved right**; the essayist misreads his brevity as ignorance ("Där hade jag fel") |
| opening move | scene (Sunday rowing) | **result-lede** with counts (eleven directories, 14→3 handlande, 2→11 fabrikörer) |
| evidence pattern | one archival study + the essayist's counterexamples | **three named candidate mechanisms, each falsified by a different feature of the same document series** (blank title line / flat fee / handwriting comparison) |
| concession phrasing | "går inte att lägga undan", "går inte heller att belägga" | "Där hade jag fel." · "Jag får ge Rämnestad rätt, och den förklaring som från början låg närmast är också den som står kvar." — no »komma ifrån«, no blocklist variant |
| coda | archive-silence gesture (the minutes skip the last rowing) | **flat inventory close** — the column vanished in 1938, the page then had three columns, the last own directory was 1949 with 412 subscribers. No silence motif, no aphorism, no chiasmus, no closing question |
| residue | oscillating suspicions | four largest farmers wrote nothing; two widows kept dead husbands' titles; the strike-throughs stay undecidable — **all sub-questions, none touching the settled main question** |

Blocklist (law 14) scanned mechanically over title + passage + stems + options: **no hit**
on any burned family or close variant. Saturated motifs avoided: no wedge-gauge /
measurement-book coda, **no document-reading present tense** (the whole archive paragraph
is narrated in past tense: *låg kvar, var tom, trycktes om, gick att jämföra, hade
strukits över*), no washing-up/kitchen politics.

Gender: byline **female** essayist with the overreaching hypothesis; **male** archivist who
is careful and right. This inverts both the bank's saturated careful-woman /
overconfident-man default (18 of 18 in the 2026-07-30 scan) and batch18's male-byline /
female-researcher arrangement.

Surface variety (law 15): flat descriptive place-name title (no "Den/Det"-lead, no
negation headline, no colon — batch18 used a noun+prep title, this is noun+prep+place);
mixed numeric register (digit years 1907/1931/1919/1926/1938/1949 beside spelled-out
*fjorton, två, tre, nio, elva, trehundra, tjugotal, fyra, fyrahundratolv*); byline kept,
glossary trimmed to **2** entries (batch18 used 3). Swedish curly quotes ”änka efter”;
spaced en dash only (em dash count = 0, verified mechanically).

## 3. Question design

| q | family | trap plan | key |
|---|---|---|---|
| 1 | `detalj_ospecificerad` | A reversed_causality (actor swap, *hedged*) · B overgeneralisation (scope deleted) · C plausible_worldknowledge, text-contradicted | **D** |
| 2 | `forfattarens_hallning` | A surface_lexical_echo + stance inversion · C detail_as_main (sub-question's undecidability promoted) · D plausible_worldknowledge (the standard essay synthesis) | **B** |

Corpus-right mix for a short unit: one detail-retrieval + one higher-order.

**Q1 planted target** (¶4, one sentence): *"Där skriften gick att jämföra med annat i
mappen var yrkesordet i regel abonnentens eget."* — hedged (*i regel*), directional
(subscriber → word, not cashier → word), scoped (only where the handwriting could be
compared). Key D paraphrases it and keeps **both** qualifiers. A flips the actor to the
cashier *and wears the same cautious clothing as the key* (i de flesta fall, tycks) — this
is deliberate, see §6. B deletes the scope ("varje bevarad blankett") — the passage
restricts the finding twice and says nothing about the rest, so B is identifiably flawed,
not verbatim-true (law 11). C names the approved-title list, which is one of the
essayist's own three hypotheses and is refuted in the same paragraph ("ingen lista över
godkända ord") — tempting for a reader who remembers the hypothesis but not the test.

**Q2 planted target** (¶2 + ¶3 + ¶5 span): suspicion stated → archivist contradicts →
all three mechanisms falsified → concession. Key B is the only option spanning that arc.
A quotes back the passage's own "höll fast vid misstanken länge" (true of the period
*before* the test, false as a verdict). C borrows the passage's one genuine admission of
ignorance, which is about the strike-throughs — a residue detail, not the main question.
D is the reflexive "both explanations are needed" synthesis, which the text forecloses:
none of the three mechanisms existed, so there is no second explanation left to combine.

## 4. RULE 11 lemma audit (option sets ALONE — no stems, no passage)

Content lemmas per set:

- **Q1:** titel/titlarna/titeln · fall · tycks · nedskriven · förening/föreningens ·
  kassör · abonnent/abonnenten/abonnentens · bevarad · blankett/blanketten · skriven/skriften ·
  räkna · yrkesbeteckning · rätt · välja · yrkesord · regel · egen/eget · jämföra
- **Q2:** stå fast · avfärda · arkivarie · överge · godta · vanlig · förklaring ·
  anse · fråga · omöjlig · avgöra · mena · båda · behövas

**Content lemmas appearing in ≥2 questions' option sets: ZERO.** Every material noun
(titel, blankett, abonnent, kassör, yrkesord, skrift) lives only in Q1; every stance verb
(överge, godta, avfärda, avgöra, mena) lives only in Q2. Q2's option set deliberately
never *names* either explanation — it says "den vanliga förklaringen", not "fåfänga" or
"föreningens regler" — so Q1's key cannot corroborate Q2's key even conceptually: a blind
solver reading Q2 alone cannot tell which explanation is "den vanliga", and reading Q1
alone learns nothing about the essayist's verdict. Exempt as function words / unavoidable
topic word: *att, den, som, av, i, på, hon*. The batch17 `glöd`-chain defect shape (a key's
word family re-entering another question's options) is absent.

## 5. RULE 12 stem check (what each stem gives away, read alone)

- **Q1** *"Vad fann textförfattaren när hon gick igenom de bevarade anmälningarna?"* —
  presupposes only what the passage states flatly (she went through the surviving
  slips). It predicates nothing about the title line, the cashier, the fee or the
  handwriting, and entails no option's claim. Neutral referential.
- **Q2** *"Vad anser textförfattaren om sin egen misstanke?"* — presupposes she has a
  suspicion (stated in ¶2) and nothing about its fate. It entails neither "keeps" nor
  "abandons"; all four options are grammatically and semantically available from the stem.

## 6. RULE 13 / rule 10 — hedge balance, form tells, blind floor

- **Q1:** qualified options = **A** (*i de flesta fall, tycks*) and **D** (*i regel*, plus
  the scope clause). B and C are flat assertions. So the key is **not** the sole
  measured option; the "pick the hedged one" heuristic narrows to {A, D} = **1-in-2**.
  The one hard absolutizer token in the unit (*varje*, in B) sits on a distractor while
  the key has none — the reverse of the M-FORM shape, and only one distractor carries it.
- **Q2:** the key **B** is a **flat, unhedged assertion** ("Hon överger den och godtar den
  vanliga förklaringen"), while the cautious-sounding option **C** ("omöjlig att avgöra")
  and the moderate synthesis **D** ("båda förklaringarna behövs") are both **wrong**. This
  is the law-10 break the rule demands: on this question "qualified" and "correct" point
  in opposite directions.
- **Hedge map across the unit:** key hedged in 1 of 2 questions = exactly half, at the
  rule-10 ceiling and not over it.
- **Stated adversarial blind floor: 1-in-2 per question.** Q1 style alone cannot separate
  {A, D}; Q2 style alone cannot separate {A, B} (the two flat options). No cross-question
  bridge exists (§4), so the sheet cannot be walked from 1-in-2 to better.
- **Length:** Q1 A=13 B=11 C=14 D=12 — the key is *not* the longest (C is). Q2 A=8 B=8
  C=6 D=6 — the key ties for longest, so it is never the *strict* longest. M-TELL passes
  with key-longest 0/2.
- Key letters **D** and **B** — spread, no A default, no positional pattern.

### fleet-repair-4 correction (2026-09-01) — bridge claim and floors, restated on the final bytes

*Appended, not substituted. Everything above this line is left exactly as it was
written. Sources: `audits/las-b19-003.json` (the **note** at stage `blind`, its
`blind_solve.stems_only_walk`, and the **minor** at stage `integrated`) and
`reviews/pedagogy.jsonl` las-b19-003 **NOTE 1** and **NOTE 2**. The corrected
statements now also live in the unit's own bytes at
`generator_meta.adversarial_blind_floors`.*

- **The bridge claim above is too strong.** §6 states *"No cross-question bridge
  exists (§4), so the sheet cannot be walked from 1-in-2 to better."* A bridge does
  exist: **q1's own distractors A and C name the two association-control
  hypotheses** — the cashier who wrote the titles (A) and the printed form that
  listed the permitted designations (C) — so a solver who has taken **q1 = D**
  (subscriber control) can reconstruct what the *misstanke* in q2's stem must have
  been, and the only stance consistent with a subscriber-control finding is
  abandonment, i.e. **q2 = B**. §4's sentence is scoped to reading **Q2 alone** and
  is correct at that scope; it does not bound the sheet read whole.
  **Honest form: the bridge is WALKABLE but NOT COMPELLING.** Three independent legs
  walked it and defaulted **WRONG** on q2 — G-STEM r1 declared the routes to
  *disagree* ("the item is not decided blind"), G-STEM r2's blind leg recorded
  *"NOT_ANSWERABLE / pick null (soft lean D)"*, and the V-FINAL's own stems-only walk
  also landed on **D**, a distractor. Held at **note** severity under BRIEF-ADDENDUM
  efterhandstillägg 1 (ägardom batch16 dom 1): the floors are stated, neither is
  better than 1-in-2, rule 10 holds, and on the passage both keys are uniquely
  defensible — so the leak costs **discrimination, not correctness**.
- **Q1 floor = 1-in-2 on {A, D}, and q1 is form-walkable to the key.** A and D are
  explicit **contradictories** on one axis (who the occupational word came from);
  B and C sit off that axis. Within the pair **D carries two qualifiers** (*i regel*
  plus the scope clause *där skriften gick att jämföra*) against A's single
  perception hedge (*tycks*), and a doubly-qualified, methodologically-scoped
  statement is the canonical key shape for a *"what did she find in the archive"*
  stem. The V-FINAL's cold options-only pick was **D at roughly 70 percent
  confidence**, reproducing G-STEM r1 (*"BLIND: PARTIALLY, pick=D"*) and G-STEM r2
  post-rebuild. The floor number above is right; what §6 does not say, and what is
  said here, is that **the channel points AT the key** on q1.
- **Q2 floor = 1-in-2 on the flat pair {A, B}, and the blind walk MISSES the key.**
  Style alone cannot separate A and B; C (*omöjlig att avgöra*) and D (*båda
  förklaringarna behövs*) are both wrong, which is the rule-10 break. The stems-only
  walk landed on **D — a distractor** — at low confidence. That miss is the
  question's protection; it is not evidence that no route exists.
- **Correction inside the Q1 bullet above.** *"The one hard absolutizer token in the
  unit (`varje`, in B)"* describes the **retired** q1-B, *"Att titeln på varje bevarad
  blankett var skriven av abonnenten själv"*, which `fleet-repair-1` replaced with
  *"Att de överstrukna orden i ett tjugotal fall var rättelser av felläsningar."*
  The shipping sheet carries **no `varje`**, so that sentence cannot support the
  restated floor and is superseded here. (`reviews/pedagogy.jsonl` NOTE 1 records the
  same staleness in the trap-plan table and in §7's self-blind-solve; those two were
  outside this round's brief and remain stale — see the `carried[]` array of the
  `fleet-repair-4` entry in `candidates/las-b19-003.json`.)
- **Passage note.** These floors are stated on the **final** bytes, i.e. after this
  round's single authorised passage insertion in ¶2, *"tillfället kom **ungefär**
  vartannat år"*. That word touches no option, key, stem or rationale and changes no
  floor.

## 7. Self-blind-solve (passage only, arguing for every non-key)

- **Q1.** *A* — could the cashier have written the titles? The passage names a
  hypothetical cashier "med bestämda uppfattningar" in ¶2, but ¶4 compares the
  handwriting against other material in the folder and lands on the subscriber; A asserts
  the falsified branch. Rejected. *B* — is the finding general? The passage attaches it to
  a condition ("där skriften gick att jämföra") and to a hedge ("i regel"); "varje bevarad
  blankett" asserts precisely what the passage declines to. Rejected. *C* — was there a
  list? "ingen lista över godkända ord" is explicit. Rejected. **D stands alone.**
- **Q2.** *A* — does she keep the suspicion? "Ingen av mina tre mekanismer fanns alltså.
  Jag får ge Rämnestad rätt" and, earlier, "Där hade jag fel". Rejected. *C* — does she
  call it undecidable? The one thing she calls unanswerable is the strike-throughs, in the
  residue list, after the main question is settled. Rejected. *D* — are both explanations
  needed? There is no surviving second explanation: all three mechanisms were absent.
  Rejected. **B stands alone.**

## 8. LAW 16 name-check log (RULE 14 transport)

Endpoints: sv.wikipedia CirrusSearch **exact phrase**
(`action=query&list=search&srsearch=%22NAME%22&format=json`) + **OSM Nominatim**
(`countrycodes=se`, UA header, ≥1.2 s spacing); second index = **exact-quoted WebSearch**.
**POSITIVE CONTROL RUN FIRST, same session, same endpoints:** `"Flarken"` →
sv.wiki **56 hits** (Flarken, Luleå kommun / Robertsfors kommun / Ytterhogdals socken),
Nominatim **5 SE places**, WebSearch → real Västerbotten village + a tourism operator.
**Control PASS**, so the zeros below are informative.

| name | sv.wiki exact | Nominatim SE | variant probes | 2nd index (quoted WebSearch) | verdict |
|---|---|---|---|---|---|
| **Ledingsbo** (town) | 0 | 0 | Ledingbo 0/0 · Lidingsbo 0/0 · Lädingsbo 0/0 · Ledingsbro 0/0 · Ledingsboda 0/0 · "Ledingsbo telefonförening" 0/0 | no bearer; nearest real neighbour = the hamlet **Leding / Ledings**, Björna, Örnsköldsvik (shared stem, not the string, +3 chars) | **kept, flag V-FINAL** |
| **Margit Torpenius** (byline) | 0 (pair) / 0 (surname) | 0 | Torphenius 0/0 | no bearer of the pair or the surname; neighbours surfaced: **Torpadius** (real surname) and **Torpensis** (17th-c. Petrus Petri Torpensis) — distinct strings | **kept, flag V-FINAL** |
| **Enar Rämnestad** (archivist) | 0 (pair) / 0 (surname) | 0 | Ramnestad 0/0 · Rämnstad 0/0 | no bearer; nearest hits were Norwegian *Ramstad* / *Stenestad* — different strings | **kept, flag V-FINAL** |

**Rejected during the search (honest log of what the probes killed):**

- **Snarhult** (first town candidate) — sv.wiki 0, but Nominatim returned the real
  **Snärhult**, Älmhults kommun: a one-diacritic variant. Rejected under the
  batch16 Rossmåla/Rössmåla ruling.
- **Ormsäter** (second town candidate) — itself 0/0, but the one-letter probe
  **Ormsätter** returned a real place in Norrköpings kommun (sv.wiki *Jonsbergs socken* +
  Nominatim). Rejected.
- **Nyhamre** (first byline surname) — sv.wiki 0 but Nominatim returned **Nyhamre skola**,
  Bollnäs: the exact string inside a real Swedish name. Rejected.
- **Ternevall**, **Lyckhage**, **Norlinger** — each returned 1 sv.wiki hit indicating a
  probable real bearer (Masthuggskyrkan / Sjuksköterska / a film credit). Rejected without
  further probing.

**No real institution is named anywhere in the passage.** The telephone association, the
directory, the archive and the subscription slips are all fictional and local to
Ledingsbo; the historical state telegraph administration is deliberately *not* referenced,
so no real body is credited with invented decisions (the 2026-07-30 "real 1913 insurer"
failure mode).

**Registry check (rules 8 / 9 / 13):** word-boundary grep of `batches/`, `las/`, `elf/`,
`adjudication/` for *Margit*, *Torpenius*, *Enar*, *Rämnestad*, *Ledingsbo* → **0 files
each**. Neither given name appears in the 231 + 14 (batch17) + 11 (batch18) used-given-name
lists, nor in any excluded full pair. Neither surname is a one-letter or near-duplicate
variant of a listed pair, and the saturated surname suffixes were avoided on purpose
(-mark: Vidmark/Rådmark/Ödmark/Ranmark/Vallmark; -lund: Hammarlund/Selmerlund/Renlund;
-strand: Ekstrand/Kettlestrand). No excluded toponym stem (Brantmyr-, Näversved-, Vrantebo,
Hyllemåla, Rossmåla, Sölvinge, Flarkbro, Bjässemon, Klyvinge, Härkilsnäs, Ylmaren) is
reused; -inge and -bo/-måla suffix reuse was avoided in the final pick beyond the neutral
`-sbo` compound.

## 9. Morphology guard (brief's explicit requirement)

Every past / passive form in the passage checked individually, with attention to the
geminate-simplification class (bränna → **brändes**, not \*bränndes):

*gav ut · fick · rörde · upptog · hade öppnat · satte · gavs · kom · skulle **fyllas** ·
misstänkte · höll · såg · hade styrt · tryckt · gjorde · var · ordnades · sade · **valda**
(välja → vald/valda, not \*väljda) · tilldelade · hade prövat · låg · **fylldes**
(fylla → fyllde → fylldes, single -d-) · **trycktes** (trycka → tryckte → trycktes) · gick ·
hade **strukits** över (stryka → strukit) · hade **skrivits** ovanför · fanns · får · låg ·
står · behöll (behålla → behöll, strong) · svarar · försvann · hade · tryckte.*

No verb in the passage belongs to the -nn-/-mm-/-ll- + -de class in a form that could
double the consonant; `fylldes` is the one -ll- stem and is correctly `-lld-`. BIFF word
order verified in every subordinate clause with negation ("att han **aldrig hade** prövat
saken", "utan att särskilt många nya rörelser **hade** öppnat"). En/ett and definiteness
agreement read aloud clause by clause.

## 10. Honest residue for the downstream gates

- **Ledingsbo** shares its stem with the real hamlet **Leding/Ledings** (Björna). Zero
  bearers of the full string on three indices, but V-FINAL should re-run the probe rather
  than take this note as a certificate.
- **Torpenius** sits in the same Latinate -enius/-adius family as the real Swedish
  surnames *Torpadius* and *Torpensis*. That makes it natural rather than colliding, but
  it is the closest neighbour found and is logged for V-FINAL.
- The **rank/status axis is the unit's unavoidable topic word** and is intentionally kept
  out of both option sets (Q1 is about *who wrote*, Q2 about *what she concludes*); a
  G-STEM reviewer should confirm the sheet still cannot be walked.
- **Second-index note:** Mojeek was not used this session (batch17's recipe); the second
  index was exact-quoted WebSearch, whose own "Flarken" control passed. All three kept
  names remain flagged for V-FINAL per rule 14 regardless of the clean result.
- Institutional framing kept internally consistent: a **local telefonförening** (the
  pre-monopoly Swedish pattern) that printed its own directory until 1949. Worth an
  expert-review glance; it is deliberate, not incidental.

---

## 11. Post-repair audit — round `fleet-repair-1` (2026-09-01)

Repair round after the full gate fleet. Unit `las-b19-003`, which G-SPRÅK had
killed. Passage touched at the two listed points (`sin sista egen katalog` →
`sin sista egna katalog`; the ¶4 target sentence de-garden-pathed); **q1's
option B was rewritten** to clear the G-STEM entailment defect (old B entailed
key D and carried `varje`); q1's rationale rebuilt (`paraphraserar` →
`parafraserar`, quoted target sentence re-synced, B's explanation replaced);
q2's A-label de-anglicised and its C-sentence de-elided. Full old→new list in
the unit's `repair_log`.

### RULE 11 — cross-question option-lemma sweep (re-run on the repaired sheet)

Option sets read ALONE. Content lemmas appearing in ≥2 questions' option sets,
exact and by 5-character prefix: **none**.

q1 runs on `titlarna` / `kassör` / `överstrukna` / `rättelser` / `felläsningar`
/ `blanketten` / `yrkesbeteckningar` / `yrkesordet` / `abonnentens` /
`skriften`; q2 on `arkivarien` / `misstanke`-adjacent stance verbs
(`står fast`, `avfärdar`, `överger`, `godtar`) / `förklaringen` / `avgöra`.
§4's original finding still holds: the who-wrote axis (q1) and the
what-she-concludes axis (q2) share no content vocabulary. The new B was built
on the strike-outs — a residual detail the passage explicitly declines to
settle — and the strike-outs appear in **no** q2 option, only in q2's
rationale, which is not part of the sweep's surface.

### RULE 12 — stem-entailment check (each stem read alone)

| q | what the stem gives away, read alone | entails an option? |
|---|---|---|
| 1 | that she went through the preserved applications and found *something* | no. That is a presupposition, not an entailment: it does not choose between the cashier writing the titles (A), the strike-outs being corrections (B), the form listing permitted words (C) and the word being the subscriber's own where the hand could be compared (D) |
| 2 | that she had a suspicion and holds a view of it — no direction, no outcome | no |

The rewritten B stays on the stem's axis (it reports a finding from the
preserved forms, so it is genuinely keyable), while being refuted by the
passage's own `materialet svarar inte på det`. It is not a strength variant of
D and carries no absolutizer, which was the whole of the G-STEM complaint.

### Mechanical re-run

`run_mech.py` over the repaired candidate, `--parsed-dir data/parsed`,
`--p5-corpus-dir auto` (114 shipped units indexed), exit 0:

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass   (0 findings)
```

Stats after repair: 399 passage tokens · 26 sentences · mean 15.35 w/s ·
7 paragraphs · option ratios 1.17 (q1) / 1.33 (q2) · key longest 0/2.

## 12. Post-repair audit — round `fleet-repair-3` (2026-09-01)

Round-2 fleet read of the `fleet-repair-1` output. Unit `las-b19-003`. This
round is **rationale-only**: the passage, every option and both keys are
byte-identical to the `fleet-repair-1` text, so the
`batches/batch19/{blind,stems,distractor}/las-b19-003.json` sheets are
unchanged and were not regenerated. Full old→new list in the unit's
`repair_log`.

### What changed

| # | Where | Change |
|---|---|---|
| 1 | q2 rationale, A-label | **Wrong paragraph reference, wrong twice.** It read *"vilket lockar den som läser tredje stycket och stannar där."* The *misstanke* clause — *"Jag misstänkte något annat och höll fast vid misstanken länge"* — is in **¶2**, not ¶3; and ¶3 is the paragraph that *ends* **"Där hade jag fel"**, so a reader who stops at the end of ¶3 has just read the correction and is not tempted by A at all. The label now points each half of the option at its own paragraph (the suspicion at ¶2, the dismissal of the archivist at ¶3) and at the place where a reading can actually stop: just before ¶3's last sentence. |
| 2 | q2 rationale, D | `en sammanjämkning ”båda behövs” är…` → `en sammanjämkning av typen ”båda behövs” är…`. Bare quote in apposition to a noun with no connective; `av typen` is the standard Swedish joint. |
| 3 | q1 rationale, A | `men jämförelsen av skrift pekar åt motsatt håll` → `…av skriften…`. The head noun was left bare and indefinite after the *av*-genitive although the referent is individuated — it is the writing *in the folder* that is compared, and the passage has already introduced it definitely. |

**The surrounding claim on item 1 was re-checked and still holds.** Both halves
of option A do belong to the time before the test: the suspicion is stated in
¶2, the archivist is written off at the end of ¶3, the test itself is ¶4
(*"Anmälningarna låg kvar…"*) and the conclusion is ¶5 (*"Ingen av mina tre
mekanismer fanns alltså. Jag får ge Rämnestad rätt…"*). The rest of the
rationale's paragraph map was audited at the same time and is correct as
written: q2-B's *"formuleras i andra stycket … prövas i fjärde och avskrivs i
femte"* checks out sentence by sentence, and q1's target sentence is indeed in
¶4.

**Carried, with reasons, in the unit's `repair_log`:** `skriften` for
*handstilen* in ¶4, in the key q1-D and in q1's rationale. *Skrift* in the sense
of handwriting is attested and sits right in the register of an essay about
1907–1931 archival paper; the ambiguity is theoretical rather than
student-visible; and the fix is **not cheap** — it would have to be made in
three places at once, one of which is the **key option's text** and one the
quoted target sentence in the passage, and it would force a regeneration of this
unit's three sheets, which the round's brief explicitly scoped out
("cheap fixes only"). No trap depends on the word: q1-A reverses the *actor*,
not the writing medium. The replacement, if a later round wants it, is
mechanical: `handstilen` in all three places, then regenerated sheets. The q2
G-STEM flag (A/B polarity plus the `omöjlig` strip in C) is carried on round
1's reasoning unchanged.

### RULE 11 — cross-question option-lemma sweep

**No option text changed in this round**, so §4's and §11's sweeps stand
verbatim: content lemmas appearing in ≥2 questions' option sets, exact and by
five-character prefix, remain **none**. Re-run mechanically anyway as a
regression check and it returned the same empty list. Note that all three edits
landed in rationales, which are not part of the sweep's surface — the
strike-outs and the archivist continue to appear in q1/q2 rationales without
appearing in any option.

### RULE 12 — stem-entailment check (each stem read alone)

Both stems and all eight options are unchanged, so §5's and §11's table stands:

| q | what the stem gives away, read alone | entails an option? |
|---|---|---|
| 1 | that she went through the preserved applications and found *something* — a presupposition, not an entailment | no |
| 2 | that she had a suspicion and holds a view of it — no direction, no outcome | no |

Re-read once more against the corrected rationales to confirm the fix did not
smuggle a claim into the student-visible surface: the corrected A-label lives
entirely in the answer-key text, and the two G-SPRÅK edits change no
proposition anywhere.

### Mechanical re-run

`run_mech.py` over the repaired candidate,
`--parsed-dir /home/loucmane/dev/hpfetcher/data/parsed`, exit 0, with
`--p5-corpus-dir auto` (114 shipped units) and again with all seventeen
`batches/*/candidates-final` plus `batches/batch18/candidates` (121 units):

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass   (0 findings)
```

Stats unchanged, as expected for a rationale-only round: **399** passage tokens
· 26 sentences · mean **15.35** w/s · 7 paragraphs · option lengths q1
13/12/14/12 and q2 8/8/6/6 · ratios **1.17** and **1.33** (LÄS cap 5.25) · key
is the strict-longest option in **0 of 2**.
