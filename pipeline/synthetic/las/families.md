# LÄS item-family taxonomy

The machine-readable taxonomy is **`families.json`** (built by
`scripts/build_families.py` from the type / genre / trap outputs). This document is
its human-readable companion: what each family is, how often it occurs, the trap anatomy
mined from the Layer-2 explanations, and authentic exemplar qids to ground generation.

**A family = a question TYPE.** Type is the reliably-classifiable axis; genre and trap are
carried as *distributions within* each family (`genre_distribution`, `trap_profile`, and the
`type_x_macrogenre_crosstab`). The full item space is therefore *type × macro-genre × trap*,
but the corpus does not fill that cube uniformly — the crosstab shows which cells actually
occur, and the trap profile shows which distractor moves each type actually uses.

**All items have exactly 4 options** (A–D). No LÄS item in the corpus has 5. (Contrast ORD,
which has 5 — do not carry a 5-option assumption into LÄS generation.)

**Difficulty is `unknown` for every family** — the repo has no Elo / per-item stats (only
exam-half normering bands). Marked explicitly in `families.json`.

---

## The trap glossary (the reusable distractor machinery)

Trap tags are mined from `distractors[].why_tempting` / `why_wrong` in the Layer-2 corpus
(`question_taxonomy.py`, keyword proxies — spot-validated against source, see below). Counts
are **distractor-instances** (each item has 3 distractors; 540 items → ~1620 distractors).

| trap tag | instances | gloss |
|---|---|---|
| `overgeneralisation` | 372 | Text says something nuanced/hedged; distractor makes it absolute (*alla / alltid / aldrig / bara / enbart*). |
| `reversed_causality` | 295 | Right elements, **wrong direction** — cause/effect or subject/object swapped ("texten gör *tvärtom*"). |
| `scope_shift` | 127 | Right theme, wrong scope/paragraph — answer belongs to another part, or widens/narrows the claim. |
| `detail_as_main` | 90 | A sub-point or example is presented as the passage's main point. |
| `plausible_worldknowledge` | 75 | Sounds right from general knowledge but unsupported by *this* text. |
| `true_but_irrelevant` | 57 | True in itself but doesn't answer the stem. |
| `surface_lexical_echo` | 53 | Re-uses words/phrases present in the text to feel familiar. |
| `half_right_conjunction` | 36 | Two-part distractor: one clause correct, the other wrong. |

**The single most important finding for generation:** the top two traps —
**overgeneralisation** and **reversed_causality** — dominate *every* family and together
account for ~40 % of all distractors. LÄS difficulty is manufactured chiefly by (a) planting
a **hedged, directional** claim in the passage and (b) offering distractors that either
**absolutise** it or **flip its direction**. This is validated against source: e.g.
`host-2013-verb1-LÄS-014` why_wrong: *"Tvärtom — Rabe klagar på att biblioteken redan har
breddat bort från litteraturen … B inverterar hennes riktning."* A generator that cannot plant
a directional claim and invert it cannot make an authentic-hard LÄS distractor.

---

## Family frequency table

| family_id | label (sv) | count | share | dominant traps |
|---|---|---|---|---|
| `enligt_texten_detalj` | Detaljhämtning (text-ankrad) | 206 | 38.1 % | overgen, reversed, scope |
| `detalj_ospecificerad` | Detaljhämtning (innehålls-ankrad) | 202 | 37.4 % | overgen, reversed, scope |
| `inference_slutsats` | Inferens / slutsats | 30 | 5.6 % | reversed, overgen, scope |
| `huvudbudskap_syfte` | Huvudbudskap / syfte / bästa rubrik | 30 | 5.6 % | overgen, reversed, scope |
| `forfattarens_hallning` | Författarens hållning / värdering | 29 | 5.4 % | overgen, reversed, detail-as-main |
| `jamforelse_relation` | Jämförelse / relation (fler-texts) | 26 | 4.8 % | overgen, reversed, true-but-irrelevant |
| `struktur_funktion` | Struktur / funktion av textelement | 13 | 2.4 % | overgen, reversed, scope |
| `hallning_stamning_ton` | Ton / stämning / stil | 2 | 0.4 % | overgen, detail-as-main |
| `ordbetydelse_i_kontext` | Ordbetydelse i kontext | 2 | 0.4 % | detail-as-main, lexical-echo |

**Reading the distribution:** LÄS is **detail-retrieval-dominant (~75 %)**. The two detail
families differ only in stem surface — `enligt_texten_detalj` cites the text explicitly
("Enligt texten …", "Vad var enligt texten …"); `detalj_ospecificerad` anchors on content or a
named person/study ("Vad framställs som svagheten med Baselreglerna?"). For generation they are
the same task: *the answer is locatable in one place in the passage; the difficulty is entirely
in the distractors.* The higher-order families (inference, huvudbudskap, hållning, jämförelse,
struktur) are individually small (2–6 %) but collectively ~25 % and are what separate strong
readers — they cannot be answered by locating a single sentence.

### type × macro-genre crosstab (where each family lives)

| family | sakprosa | juridik | litterär |
|---|---|---|---|
| enligt_texten_detalj | 183 | 17 | 6 |
| detalj_ospecificerad | 174 | 14 | 14 |
| inference_slutsats | 26 | 1 | 3 |
| huvudbudskap_syfte | 29 | 0 | 1 |
| forfattarens_hallning | 28 | 0 | 1 |
| jamforelse_relation | 23 | 0 | 3 |
| struktur_funktion | 12 | 0 | 1 |
| hallning_stamning_ton | 2 | 0 | 0 |
| ordbetydelse_i_kontext | 1 | 0 | 1 |

Note the literary passages skew toward `detalj_ospecificerad` (14) and carry the few
`inference`/`jämförelse`/`ton` items — i.e. literary passages ask "what is the narrator feeling /
what does this image mean", not "enligt texten". Juridik passages are almost purely detail
retrieval. `författarens_hållning` and `huvudbudskap` live essentially only in sakprosa (that is
where an author *argues*).

---

## Family detail (with authentic exemplars & trap anatomy)

Exemplar qids reference authentic items; full distractor anatomy per exemplar is in
`families.json → families[].exemplars[]`. Below, one exemplar per major family with its
pregrade "handle" (the reader tactic the Layer-2 corpus attaches to it) and the trap it plants.

### `enligt_texten_detalj` / `detalj_ospecificerad` — detail retrieval (75.5 % combined)

- **Task:** locate a single fact/claim in the passage. Answer is derivable from one sentence.
- **Exemplars:** `var-2026-verb1-LÄS-011` (huvudsyftet med studien; handle *Syftesmeningen*),
  `host-2013-verb1-LÄS-011` (handle *Citatdefinitionen*), `host-2013-verb1-LÄS-013`
  (handle *Receptmeningen*).
- **Trap anatomy:** the correct answer paraphrases the target sentence; distractors are built by
  (1) **reversing the direction** of the target claim (reform→engagemang stated as
  engagemang→kunskap), (2) **absolutising** a hedged statement, (3) **lifting a sub-point**
  (a *delspår*) and dressing it as the whole, (4) **echoing** salient surface vocabulary from a
  *different* sentence. See `var-2026-verb1-LÄS-011`: distractor A takes one of two research
  sub-tracks and presents it as the whole aim (`detail_as_main`); C inverts the causal arrow
  (`reversed_causality`).
- **Generation rule:** plant exactly one directional, hedged, scoped target sentence; derive the
  key by paraphrase; derive 3 distractors by applying invert / absolutise / sub-point-swap /
  echo to that same sentence.

### `huvudbudskap_syfte` — main message / best summary / best title (5.6 %)

- **Task:** identify the passage's overarching point, or the option/title that best summarises it.
- **Exemplars:** `host-2014-verb2-LÄS-012` ("Vilket påstående överensstämmer bäst med texten?",
  handle *Kärnmeningen*), plus items asking for the best alternative rubrik.
- **Trap anatomy:** distractors are **true-but-partial** — they state something the passage does
  say, but as a *detail* rather than the whole (`detail_as_main`), or **overgeneralise** the thesis
  beyond what the text supports. Key discriminator: the correct option spans the whole passage;
  each distractor spans only one paragraph.
- **Generation rule:** the passage needs a genuine thesis distributed across paragraphs; distractors
  = individually-true paragraph-level claims that fail as a whole-text summary.

### `forfattarens_hallning` — author's stance / evaluation / criticism (5.4 %)

- **Task:** what does the author/reviewer *think* — their attitude, the criticism they level.
- **Exemplars:** `host-2013-verb2-LÄS-012` ("Vilken kritik riktar recensenten mot …", handle
  *Stort-vs-litet*). Lives almost entirely in debatt/recension/essä sakprosa.
- **Trap anatomy:** distractors attribute to the author a **plausible but unheld** position
  (`plausible_worldknowledge`), **invert** their stance (they praise X → distractor says they
  criticise X, `reversed_causality`), or take a **concession** the author makes and treat it as
  their main claim (`detail_as_main`).
- **Generation rule:** passage must carry an explicit evaluative stance with at least one concession;
  distractors weaponise the concession and the inversion.

### `inference_slutsats` — inference beyond the literal (5.6 %)

- **Task:** what can reasonably be concluded / what lies behind / what does the text imply.
- **Exemplars:** `host-2013-verb2-LÄS-015` ("Vad talar … för att man kan få fram en röd allergifri
  jordgubbe?", handle *Negationen-som-öppnar*).
- **Trap anatomy:** **reversed_causality is the #1 trap here** — the tempting wrong answer draws a
  valid-looking but backwards inference. Also `plausible_worldknowledge` (a real-world-true
  conclusion the text doesn't license) and `overgeneralisation` (a sound inference pushed too far).
- **Generation rule:** the key must require combining two passage facts; distractors combine the
  same facts with a flipped arrow or an over-strong quantifier.

### `jamforelse_relation` — comparison / relation, often multi-text (4.8 %)

- **Task:** likeness/difference between two things, two texts, two inlägg, or two dikter.
- **Note:** this family is the natural home of the recent **"Två inlägg / Två texter / Två dikter"**
  paired-passage format (e.g. `var-2026-verb1-LÄS-013` "Två inlägg i debatten om ljudboken").
- **Trap anatomy:** distractors attribute a trait to the **wrong one** of the pair
  (`reversed_causality`/swap), claim a shared trait that only one holds (`half_right_conjunction`),
  or state a `true_but_irrelevant` similarity.
- **Generation rule:** for paired passages, define each text's position on the shared axis; distractors
  = crossed attributions and false-shared claims.

### `struktur_funktion` (2.4 %), `hallning_stamning_ton` (0.4 %), `ordbetydelse_i_kontext` (0.4 %)

- **struktur_funktion:** "why does the author mention X / what is the function of this paragraph /
  how is the text best characterised." Distractors give a plausible-but-wrong rhetorical function.
- **ton/stämning:** rare; mostly on literary passages — identify mood/register. Very small sample.
- **ordbetydelse_i_kontext:** rare in LÄS (contrast ORD/MEK). "Vad menas med uttrycket …",
  "Vilken innebörd lägger X i begreppet …". Distractors = dictionary-plausible senses that don't
  fit the passage context (`surface_lexical_echo`).

---

## Honest residue

- Trap tags are **lexical proxies** over Swedish explanation text, not adjudicated labels; they
  under-count traps phrased without the trigger vocabulary and could double-count. They were
  spot-validated (reversed_causality confirmed on 4 sampled items) and the *rank order* is robust,
  but absolute instance counts are approximate.
- Two detail families were kept separate for stem-surface transparency; pedagogically they are one
  family. Merge them if a single "detaljfaktafråga" family is more useful downstream.
- Small families (`ton`, `ordbetydelse`, n=2 each) have too little data for confident trap profiles.
