# gen-las-long — authoring notes (Batch 10)

**Unit:** LÄS long, 4 questions. `family: flottningshistoria-facktext-long`.
**Title:** "Räknat i dagar, inte i stockar".
**Topic (assigned pool):** flottningens historia — timmerflottning på svenska älvar,
flottarnas arbete och epokens slut. All rivers, places and persons invented.

## Genre and topic rationale

`macro_genre: sakprosa`, `fine_genre: facktext_larobok`, `opening_move: result-lede`.
The passage is written as an excerpt from a longer piece of research journalism about
an ethnologist's archive study — the register that lets a passage carry nominalisations,
`-s`-passives (`märktes`, `bokfördes`, `avlönades`, `räknades`) and dated concrete
particulars without reading as an essay. Byline (`— Marit Sundelius, kulturskribent`)
and a three-entry glossary sit inside the `passage` string per law 6; every glossed word
occurs in the text (`brötar`, `efterrensning`, `skiljestället`).

**Why this angle.** The obvious framing of the topic — "the lorry killed log driving" —
is exactly the kind of shared world knowledge a knowledgeable solver could answer from
(law 1). So the era's end is deliberately demoted to the closing paragraph *as the story
the text sets aside*, and no question turns on it. Everything a question does turn on is
passage-internal and invented: Kvarnbergsälvens flottningsförening (1907), the 1912
stadga with its 15 September deadline, nineteen flottleder, ~23 000 day-notes 1908–1962,
"knappt sju procent" brötar vs "nära hälften" efterrensning, the 1941 Frisk dispute.

**Anti-tidiness (law 9).** The passage carries residue that does not point at any answer:
the foreman who logged wind direction for four summers, the drowned horse at Bäckfors
noted with the same tick mark as everything else, the eleven waiting days in June 1936,
one sixth of the notes unclassifiable, five of nineteen leder showing no difference and
Rönnån running the other way. Löfroth's two objections are conceded in part and the
author's own verdict is deflationary ("ett drag förklarar ingenting").

## Planted target and trap architecture

**The planted claim (p1 lede, restated with mechanism in p4):** hedged (`tycks`),
directional (channel clearing → *more* after-clearing days, not fewer), and scoped
(the lowest, flat stretches only; "längre upp, där fallet är brant … ingen skillnad alls").
The counter-intuitive direction is what makes an inversion distractor genuinely tempting.

| Q | family | key | distractor operations |
|---|---|---|---|
| 1 | `enligt_texten_detalj` | **B** | A `reversed_causality` (clearing follows the need instead of preceding it), C `overgeneralisation` (scope stripped: "oberoende av hur brant fallet var"), D `plausible_worldknowledge` (the brötar image everyone brings to the topic — and the expectation the lede overturns) |
| 2 | `detalj_ospecificerad` | **D** | A `plausible_worldknowledge` (compensation per log, unconditional — text makes it conditional on the missed deadline), B `surface_lexical_echo` ("stockar"/"dagar" from the title and close, direction inverted: pay was per dagsverke, *aldrig* per stock), C `plausible_worldknowledge` (a manning duty at the named skiljeställe — the stadga explicitly regulated no working method) |
| 3 | `inference_slutsats` | **A** | B `reversed_causality` (timber value pays for the clearing — text says the opposite: "sällan där timret var värt besväret"), C `overgeneralisation` (deadline absolutised into a stop date; refuted by the recurring post-15-September call-outs and the 1941 month-late stretch), D `plausible_worldknowledge` (salvage revenue outgrowing the flottning fees — never compared in the text) |
| 4 | `huvudbudskap_syfte` | **C** | A `detail_as_main` + distortion (channel clearing promoted from an *explanation of stretch differences* to the cause of the era's end), B `detail_as_main` + quantity upgrade (waiting is "var tionde dagsnotering", not "en tredjedel"), D `overgeneralisation` ("entydigt", "saknade betydelse" — and the text says in so many words that the picture is *not* entydig) |

**Law 11 check (Q4).** No distractor is verbatim-true. Each carries one nameable flaw:
A an unsupported causal claim, B a mangled quantity, D an absolutised verdict the text
explicitly disowns.

**Law 3 check.** No option reproduces a passage sentence. The key in Q1 recasts "än där
älven fått vara som den var" as "än på orörda sträckor"; Q2's key recasts "blivit liggande
på annans strand … bortfört före den femtonde september" with a different verb frame;
Q3's key is a synthesis with no lexical anchor in any one sentence.

## Hedge balance (law 10)

Keys: hedged in Q1 (`tycks`) and Q3 (`tycks`), confident and specific in Q2 and Q4.
Within Q1 the reversed-causality distractor A carries the *same* `tycks` as the key;
within Q3 distractor D is hedged too. So "pick the qualified option" scores at chance
across the unit rather than at 100 %.

Key spread: **B, D, A, C** — no repeated letter, no positional pattern.
Key is never the longest option: option token counts are
Q1 [19, **18**, 17, 16], Q2 [18, 14, 12, **15**], Q3 [**17**, 19, 14, 16],
Q4 [18, 16, **16**, 13].

## Self-blind-solve

Solved all four from the passage alone, arguing actively *for* every non-keyed option
before rejecting it. Each rejection lands on a specific passage sentence:

- **Q1 → B.** A dies on p4 ("som under tjugotalet rensades … steg antalet rensningsdagar
  … under de följande decennierna" — the clearing precedes the rise). C dies on p4's last
  sentence. D dies on "Knappt sju procent". One defensible answer.
- **Q2 → D.** A dies on the conditional "annars kunde markägaren kräva ersättning".
  B dies on "avlönades per dagsverke och aldrig per bärgad stock". C has no textual
  footing at all and is contradicted by "Hur arbetet skulle utföras sade stadgan däremot
  ingenting om." One defensible answer.
- **Q3 → A.** Requires combining p2 (the deadline + liability), p5 (late-salvaged timber
  waterlogged, sold as firewood "när det över huvud taget såldes") and p6 (five men, six
  days, eleven logs; "sällan där timret var värt besväret"). B is that same combination
  with the arrow flipped; C over-absolutises the deadline; D extends beyond the text.
  One defensible answer.
- **Q4 → C.** The only option that spans lede + finding + caveats. One defensible answer.

No two-way item survived to the file; no rewrite of a two-way item was needed after the
Q3 distractor set was fixed (D was hedged rather than absolutised precisely to keep the
hedge signal uninformative).

## Band compliance (measured with `mech.tokenize` / `mech.sentences`)

| stat | value | band |
|---|---|---|
| passage words | 914 | blueprint long 750–1135; `bands.json` 215–1260 |
| sentences | 47 | blueprint ~35–66 |
| mean sentence words | 19.45 | blueprint 14–25; `bands.json` 8.2–30.9 |
| sentence length range | 3–43 | deliberate variance (short verdicts beside long subordinated sentences) |
| paragraphs | 10 (incl. byline/glossary block) | blueprint long 4–17 |
| title words | 6 | ≤12, no terminal punctuation, no article-lead |
| prompt words | 9 / 7 / 10 / 6 | 3–31 |
| option words | max 19 | 0–23 |
| option length ratio | max 1.5 | ≤5.25 |

`run_mech.py`: **M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass,
M-PLAGIARISM pass** (full authentic corpus, no `--no-plagiarism`).
