# gen-elf-long — batch22 lane elf-b22-001 (ELF long passage, 5 questions)

**Title** “Reading the Floor” · **family** `riding-arena-waxed-surface-temperature-science-journalism-long`
· **genre** science journalism · **spelling** BrE · **origin** batch22-generator · **date** 2026-09-09
· **candidate_id** `PLACEHOLDER` (the coordinator renumbers).

---

## 1. Genre and subject: why this one

The lane bars were: inland; science journalism or society commentary; **not** water, fish, ferries or
transport statistics; **not** a multi-voice research dispute; one load-bearing hedged expert quote; no
“neutral reporter” attitude distractor; a phrase-level diff against the three predecessors in this lane.

The three predecessors are a grain-dryer fire study (b19), a ferry timetable (b20) and a fish pass (b21).
Two of the three are water, all three are multi-voice or dispute-shaped, and all three run the same thesis
family: a familiar account demoted by a new measurement. The subject chosen here — how a **waxed
sand-and-fibre indoor riding surface** behaves, and what a drop tester can say about it — is inland, dry,
has no vehicle and no statistics office in it, and lets the piece be built the other way round: there is no
rival account to demote, because nobody in the piece disagrees with anybody. One expert measures a floor,
finds two things, states plainly what his instrument cannot reach, and the yard changes two settings.

Freshness was checked against every family-exclusion list in the brief (107 + 14 + 7 + 14 + the batch16/17
additions) and against the seven retired families. Nothing equestrian, nothing about arena surfaces, and
nothing about wax appears anywhere in them. The unit grazes no retired family, so the batch21 coordinator
ruling about ghost bars did not need to be invoked.

**Thesis shape** (also in `generator_meta`): mechanism-is-the-point with a resolved outcome — a floor turns
out to be governed by two settings nobody was looking at, the room’s temperature (through the wax that
coats the sand) and the depth the tines reach, and the yard changes both; while the question riders
actually care about, whether a better floor keeps a horse sound, is shown to sit outside what the
instrument can reach.

## 2. The frame

Five paragraphs, 824 words, byline inside the passage string on the last line (`– Bridget Tullis`). No
glossary: the three technical words the passage needs — tines, harrowing, a bed of sand — are all defined
by the sentence they stand in, and a glossary that repeated them would be padding.

Sentence rhythm is deliberately uneven: `The bed is 130.` (4 tokens) and `The waxed ones move, whatever
their age.` sit beside 40-token subordinated sentences; measured sd is 11.1 on a mean of 22.9.

**Opening** is a scene at half past six, not the received-explanation template that RULE 24 bars for every
unit this batch. **Coda** is a concrete image and a resolved fact — the tine marks in even rows and the
thermometer reading nine. RULE 24 allows at most two unresolved codas in batch22 and this unit does not
spend one of them.

## 3. Trap architecture, question by question

Family mix: TYPE-001, TYPE-001, TYPE-002, TYPE-005, TYPE-003. **No main-idea (TYPE-004) item** — see §5.

**Q1 (key C) — what the readings showed.** Four options on four different variables, so there is no
contradictory dyad to keep and no pair to split 50/50. A halves the instrument (the passage names both of
its outputs in one sentence). B blames a hand release (the foot is “released from a fixed height”). D takes
the comparison inside the quotation and turns it upside down: the expert says the gap between his February
morning and his July afternoon is *wider* than the gap between this school and any other, and D says the
reverse. Every death is on a printed span.

**Q2 (key D) — what the cores showed.** The key is the 8 per cent / 3 per cent split above and below the
tine depth. A moves a real finding to the wrong end of the bed — the wax from the bottom came up in *better*
condition than the wax at the top. B is the ageing story a nine-year-old floor invites, refused by the
sieve. C reverses the direction: the untouched layer is packed, not loose, “firm enough to lean a spade
on”. Two decay claims, one state claim, one distribution claim, so the key is not the odd one out.

**Q3 (key B) — the schools kept damp rather than waxed.** One passage sentence licenses three deaths at
once: the other arenas are the same age or older (kills A), are “laid on plain sand and fibre” (kills C),
and are read on “the same pair of grids” (kills D). What is left is the wax, which is the inference the
item wants. Note the hedge/absolutizer inversion here: the KEY carries the absolutizer (“all day”) and so
does one distractor (“never”), so strip-the-absolutes selects nothing.

**Q4 (key A) — the writer’s attitude.** Four different objects rather than four points on one line: the
expert’s own caution (A), the status of one specific association (B), the value of the whole enterprise
(C), the credibility of the riders (D). **No neutral-reporter option** — the lane bars it, and three
consecutive units in this lane had shipped one. B is the role-and-attribution swap the family is built on:
the one association the expert will argue for, upgraded to “settled” and handed to the writer, when he says
he would argue it “from the veterinary literature rather than from his own figures”. D was rebuilt in
drafting so that it *sounds* even-handed — “readier to doubt the riders’ account than to doubt his figures”
— which stops “pick the measured option” from selecting the key.

**Q5 (key C) — the whole-text conclusion.** Two options are modalised (A “probably”, D “may”) and both are
wrong; the key is a flat assertion. That is the law-10 break, and it is the only set in the unit with any
hedging in it, which satisfies RULE 23’s “two hedged options or none”. Three of the four options name
temperature or cold, so temperature-lexis cannot pick the key out; two of the four name two factors, so the
two-factor shape cannot either.

## 4. Blind solve

An author cannot honestly blind-solve his own sheet. What was run is law 4’s adversarial pass: an argument
was built *for* each of the twenty options from the passage alone, and each non-key argument was required to
die on a span that can be quoted. All five items came out single-answerable; the deaths are listed
per option in `generator_meta.planted_traps` and cited in the rationales.

Stems-only floors, estimated with the passage covered: q1 0.30, q2 0.25, q3 0.25, q4 0.40, q5 0.25. The q4
figure is the honest cost of a stance item: option C is an overshoot a test-wise reader discards, which
leaves three live options rather than four. The residual on q1 is that C is the only option stating an
outcome of the day’s two grids, so a solver who assumes the item wants a finding is one step ahead of
chance.

## 5. Why there is no main-idea item

RULE 23 records a measured structural floor of roughly 0.40–0.50 for main-idea items, and all three
predecessors in this lane carried one. Rather than incur that cost and disclose it, the fifth slot is a
TYPE-003 whole-text **conclusion** item whose options are four rival explanations, not four scopes. RULE
23’s two conditions were applied to it anyway: no sibling stem names the nouns the key names (“temperature”,
“tines” and “wax” appear in no other stem), so the sibling stems do not read as a table of contents; and the
stem, “What can be concluded from this text?”, is a corpus-attested form that announces no shape.
`generator_meta.main_idea_sibling_stem_floor` carries 0.30 as my own blind estimate for that item, with a
note saying plainly that it is not a main-idea floor.

## 6. Names (law 16, RULE 16/17/20(d)/21)

Two named people, no toponym, no institution — the smallest real-entity surface this format allows, on the
precedent of elf-b19-001’s unnamed county.

- **Mervyn Pallenmoor** — the coinage. Every quoted word and every contested claim is his.
- **Bridget Tullis** — the RULE 17 ordinary figure. Byline only: no quoted words, no attributed act.

Legs actually run: en.wikipedia CirrusSearch exact phrase (with the positive control “Pellew” → totalhits
701 in the same session), the general web via WebSearch, a repo grep and a grep of the authentic UHR
corpus. OSM Nominatim was not run because there is no coined toponym to check.

**The general-web leg WAS available in this harness**, contrary to the lane brief, and it earned its keep:
it withdrew the otherwise clean ordinary name *Bridget Tarrant* (encyclopaedia pair = 0) because the web
index returns **Team Tarrant Equestrian** — a bearer of the surname standing in this unit’s own trade,
which is RULE 21 leg (b) exactly as batch20 applied it to *Trevor Dodd*. The next brief should be corrected
on this point.

Ten candidate names were withdrawn before these two survived; each withdrawal, with its probe and count, is
listed in `generator_meta.rule16_distances._withdrawn_during_this_run`. Three are worth repeating here:

- *Trimlow* — pair query clean at 0, but the one-letter variant **Tremlow** returns 9 real hits. This is the
  RULE 16 failure mode in its pure form: the pair query looked clean and the name was still a collision.
- *Pallenhurst* — withdrawn at distance 2 from **Pallinghurst** (15 hits: a West Sussex estate and an
  investment firm). RULE 20(d) would have permitted it with the probe pasted; a cleaner name existed.
- *Pallenshaw* — every probe clean, withdrawn on the **mechanical bank screen**: the bank already holds
  three ‑shaw surnames (Ardenshaw elf-b10-002, Orrenshaw elf-b16-002, Dabbershaw elf-b18-002). Ardenshaw is
  in none of the brief’s registries, which is the RULE 18 gap again — the screen over all 260 shipped and
  queued unit files caught what the inherited list could not.

Disclosed rather than solved: **Pallenmoor is the third ‑moor token in the bank** (after Gaddermoor and
Larkmoor). The computed distance is 4 and the first elements are unrelated, but a reviewer counting endings
should be told rather than left to find it.

## 7. Convergence and clone checks

- **Move sequence** diffed against all three lane predecessors. This unit has one voice, no operator, no
  rule-writer and no adjudication paragraph; the sceptic slot is empty by design.
- **Phrase level**, all four layers plus rationales, n ≥ 5, against 142 units in
  `batches/*/candidates-final` and `batches/batch18..21/candidates`: **zero shared runs at n ≥ 5**; longest
  shared run anywhere is **4** (“to the writer the”, elf-b1-001). Against the lane predecessors: b19 4,
  b20 0, b21 4. Nine drafting collisions at 5–6 tokens were rewritten, including two question stems.
- **Same-slot hedge echo**, caught at n = 4 and fixed anyway: the expert’s refusal to quantify first read
  “two winters of readings is not enough for that”, which is the same move as b21’s “Ask me again when I’ve
  had five more springs of it” and b20’s “I’ll give you a range, not a number”. It now hedges on transfer
  instead — a number is more than these readings will carry, because the blend under the sand differs
  between suppliers.
- **Sibling sweep and cross-lane thesis check, re-run on the siblings' own bytes** once the other six
  batch22 files existed. No sibling uses any of my four name tokens and none has a capitalised token within
  Levenshtein 2 of them. Phrase level: longest shared run with any sibling is **4** (`gen-elf-cloze`), zero
  with the other five. Two thesis convergences are disclosed in
  `generator_meta.rule24_convergence_note.thesis_cross_lane_check`: `gen-las-essa` and `gen-elf-cloze` both
  label themselves mechanism-is-the-point, and `gen-elf-short-1` (pneumatic-tube haemolysis) shares the
  skeleton at one-line-summary level — routine plant, instrumented investigation, overlooked moment, fitted
  remedy, resolved concrete coda. The separator, stated plainly rather than argued away: that unit's point
  is a demotion (the remedy goes where nobody was looking rather than to the blamed variable), while this
  one demotes no rival account and spends a fifth of its length and two of its five questions on what the
  instrument *cannot* reach.

## 8. Mechanical result

`python3 gates/scripts/run_mech.py batches/batch22/gen-elf-long.json --parsed-dir …/data/parsed
--no-plagiarism` → **4/4 pass** (M-SCHEMA, M-BANDS, M-TELL, M-FORM), exit 0. With M-PLAGIARISM enabled:
**5/5 pass**; longest run shared with the authentic corpus is 7 tokens (an attested stem), against a kill
threshold of 17.

Passage 824 words · 5 paragraphs · 36 sentences · mean 22.9 · sd 11.1. Option-length ratios 1.15–1.31,
inside the 2.36 cap. The key is the strictly longest option in **0 of 5** questions. Key letters **C D B A
C**. Every figure in `generator_meta.measured_stats` was recomputed on the final bytes with `mech.py`’s own
tokenizer in the last step (RULE 19/22), and every absence claim there is scoped to the five student-facing
paths rather than written as a whole-file count. The file stores literal curly quotes and en dashes
(`ensure_ascii=False`); no `\uXXXX` escaping is claimed.
