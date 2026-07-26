# gen-las-short-1 — "Vem äger skylten på hörnet"

**Topic (batch9 exclusive):** gatunamnens historia och namngivningsstrider.
**Unit type:** LÄS short (2 questions). **family:** `gatunamnsstrider-debatt-short`.

## Genre and topic rationale

`sakprosa / debatt_opinion`, opening move = framing-claim, first-person present,
normative modality (*bör*), explicit stance with a real concession — the preset
the blueprint attaches to debatt. The topic is far from every batch 1–8 subject
(nearest neighbours are the urban-renewal and dialect/language-change units;
neither touches naming, municipal decision procedure, or the toponymy angle).
Street naming was chosen because it lets a passage carry a *counter-intuitive
empirical finding* (protests are about the lost name, not the honoured person)
inside an argumentative frame — the finding funds the detail question and the
stance funds the hållning question, so the two families do not compete for the
same sentence.

The passage deliberately resists tidiness (law 9): it concedes real cases where
renaming is necessary (duplicate names costing an ambulance minutes; a name
whose honoured deed has been re-evaluated), and it closes by letting the
researcher be *more cautious than the writer* — an unresolved residue rather
than a resolved argument. It ends signed, not on a flourish or question.

**Frame:** title line separate from `passage`; byline `— Arvid Hammarlund,
ledarskribent` last; one glossary entry (`namnberedning`) for a word that does
appear in the passage. All entities fictional: Ekesta (kommun), Kerstin
Löwendahl (ortnamnsforskare), Arvid Hammarlund. No famous thesis is anchored —
in particular the passage does not lean on any invented-tradition / memory-politics
thesis a knowledgeable solver could answer from.

## Planted targets

- **P2 finding** (hedged, directional, scoped): protests concerned *sällan* the
  honoured person, *nästan undantagslöst* the loss of the old name; clearest in
  **older** districts where the name was still in spoken use; in new districts
  almost no objections. Direction (name-loss → protest, not person → protest)
  and scope (district age) are both invertible.
- **P4 concession** and **P5 stance**: the objection is *not* renaming as such
  but renaming without stated reasons. The concession is deliberately strong
  enough to be weaponised as a distractor.

## Trap architecture

**Q1 — `enligt_texten_detalj`** ("Vad visade … Löwendahls genomgång …?"); key **B**.
- A `overgeneralisation` — flattens the district-age scope ("lika starkt … alla gator");
  directly contradicted by the new-district sentence.
- C `reversed_causality` — swaps the two halves of the finding (person ↔ name).
  This is the strongest distractor: a passage-blind reader's default model of a
  naming dispute *is* a fight about the honoured person, so it is live without
  the text and only the P2 sentence kills it.
- D `scope_shift` — imports the duplicate-name paragraph, which is a reason to
  rename, never a stated cause of disputes. Plausible (emergency-response
  confusion is a real driver of renaming) but text-unsupported as a *finding*.

**Q2 — `forfattarens_hallning`** ("Vilken kritik riktar skribenten mot namnberedningen?"); key **D**.
- A `reversed_causality` on stance level — blanket opposition to renaming, the
  position the text explicitly disowns ("Därmed inte sagt att namn aldrig bör ändras").
  Tempting because the rest of the prose defends old names.
- B `detail_as_main` — turns the concession (a name that can no longer be defended)
  into the accusation, i.e. accuses the committee of inertia when the text accuses
  it of haste.
- C `plausible_worldknowledge` — "listens to petitions more than to research" is a
  standard municipal complaint; the text shows a committee *surprised* by protests
  and faulted for not asking who uses the name.

No distractor in either item is verbatim-true (law 11): each carries one nameable
flaw — an absolutised scope, a swapped direction, a wrong paragraph, a disowned
position, an inverted accusation, an unheld complaint.

**Hedge balance (law 10):** Q1's key is measured ("oftast") but so is distractor C
("sällan"), and Q1's absolutised option (A) is not alone in form. Q2's key carries
no hedge at all while distractor A is the sweeping one — so across the unit
"pick the qualified option" and "pick the correct option" do not line up.
M-FORM passes.

## Self-blind-solve

Solved both from the passage alone, arguing actively for every non-keyed option.

- **Q1 = B, single.** A dies on "I nybyggda områden … kom det knappt några
  invändningar alls". C dies on "handlade sällan om den person som skulle hedras".
  D dies because the duplicate-name material sits in the concession paragraph and
  is never presented as a survey result.
- **Q2 = D, single.** A dies on the explicit disclaimer; B dies because the writer
  attacks how renaming is done, not that names are left standing; C dies because
  the committee is described as not consulting users at all. D restates the
  writer's own formulated objection.

Neither item was two-way on re-read; no rewrite was needed after the first
skeptical pass (the earlier draft of Q1's D was a generic "protests are getting
rarer" claim — replaced because it was unfalsifiable from the passage rather than
identifiably flawed).

## Band compliance (measured with `mech.tokenize` / `mech.sentences`)

| stat | value | band |
|---|---|---|
| passage words | 362 | LÄS short 188–588 (blueprint 290–500) ✓ |
| sentences | 25 | blueprint 15–29 ✓ |
| mean sentence words | 14.5 | 10.1–36.5 ✓ |
| paragraphs | 7 | 1–20 (blueprint 3–13) ✓ |
| prompt words | 10 / 6 | 3–31 ✓ |
| option words | 14–19 | 0–23 ✓ |
| option length ratio | 1.36 / 1.29 | ≤ 5.25 ✓ |
| key longest? | no (Q1 max = A/C 19; Q2 max = B 18) | M-TELL ✓ |
| key letters | B, D | spread ✓ |

`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM all **pass**.
