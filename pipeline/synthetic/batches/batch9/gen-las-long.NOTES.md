# gen-las-long — authoring notes (Batch 9)

**Unit:** LÄS long, 4 questions. `candidate_id` left as `PLACEHOLDER` for the orchestrator.
**Family tag (whole unit):** `folkbildningshistoria-facktext-long`
**Topic pool:** folkrörelsernas studiecirklar — den svenska studiecirkelns historia och pedagogik.

## Genre / topic rationale

- `macro_genre: sakprosa`, `fine_genre: facktext_larobok`, `opening_move: result-lede` — the
  corpus-dominant LÄS regime (~86 % sakprosa), and the register that carries nominalisation and
  `-s`-passives without effort (*slogs fast*, *betalades*, *lästes*, *byttes*, *anges*).
- The topic is deliberately handled as **archival social history**, not as folkbildningens
  received story. The one genuinely famous thesis in this domain — the study circle's origin in
  the temperance movement and its named father — is **not anchored anywhere**: no real person,
  organisation or publication is mentioned, and the temperance *bokskåp* appears only as one line
  of background flavour that no question turns on. Everything a question tests is invented and
  passage-internal: the 1921 district *cirkelstadga*, the 41-locality count, the leader-origin
  finding, the Brandt protocol book.
- All named entities fictional: Signe Ödmark, Tjärndalens bruksbygd, Kvarnfors, Alsjö,
  Elis Brandt, Ruben Hasselgren, Wibergs geografi, Ester Wahlbom (byline).
- Frame: title line separate from `passage`; byline `— Ester Wahlbom, idéhistoriker` last;
  two-line glossary at the tail defining only words that actually occur (`logelokal` →
  *logelokalen* in §4; `cirkelstadga` → *cirkelstadga 1921* in §2).
- Law 9 (no manufactured tidiness): the passage carries residue that does **not** serve the
  thesis — the brokig reading list (biodling, bokföring, andelsmejeriets ekonomi, the Sydamerika
  travelogue the secretary called a mistake), the admission that the lists rarely record who
  proposed what, the Alsjö circle that changed leader four times without effect, nine localities
  with no difference at all, and two where the *sent* leader's circles lasted longest.

## Planted target (passage and questions as one design)

The load-bearing claim is planted in §1 and paid off in §4, hedged + directional + scoped:

> *"I de cirklar där ledaren var hämtad ur den egna kretsen **tycks** arbetet ha hållit i sig fler
> terminer än där distriktet skickade ut någon — men **framför allt** i de cirklar som samlades
> hemma hos deltagarna."*

Direction: leader-drawn-from-the-group → survival (never the reverse). Scope: the kitchens; §4
states explicitly that in the *logelokal* no difference at all could be established. Mechanism:
responsibility was distributed (*laget runt*, each member answering to the others), and in a home
an absence is visible. That gives every distractor a named operation to perform.

## Trap architecture per question

| q | family | key | distractor plan |
|---|---|---|---|
| 1 | `enligt_texten_detalj` | C | A `reversed_causality` (long-lived circles swapped out the sent leader — arrow flipped) · B `overgeneralisation` (strips the *hemmen/logelokal* scope) · D `scope_shift` + distortion (the stadga's book-grant promoted to "the finding", and falsified: the text never says it turned into cash) |
| 2 | `detalj_ospecificerad` | A | B `plausible_worldknowledge` (an approved leader + a fixed reading plan is what a regulating statute "should" require — the text says the statute was silent on how the work was done) · C `surface_lexical_echo` (*timmar* lifted from the closing paragraph about today's reporting, back-dated to 1921) · D `plausible_worldknowledge` (a public term-end examination fits the period's school world, but appears nowhere) |
| 3 | `struktur_funktion` | D | A `detail_as_main` (promotes the anecdote to the study's strongest evidence — contradicted by *"varnar för att göra ett enskilt hushåll till bevis"*, and it also invents that Brandt led the circle) · B `surface_lexical_echo` (the entries really do shrink to one line, but the reliability verdict is the reader's, not the text's) · C `reversed` (frames the case as an exception to the pattern rather than an illustration of it) |
| 4 | `huvudbudskap_syfte` | B | A `detail_as_main` **with a distortion** (the grant exists, but is never claimed to have decided survival) · C `overgeneralisation` + unheld prescription (*genomgående*; contradicted by the nine null localities and the two reversed ones) · D true-caveat **overstated** into a verdict the text resists (*"mönstret återkommer i för många orter för att avfärdas"*) |

Law 11 check on q4 (*"överensstämmer bäst"*): no distractor is verbatim-true. A distorts a true
detail into a causal claim; C absolutises and adds a recommendation the author never makes; D
inflates an acknowledged limitation into a global rejection. Each flaw is pointable.

Distractor-plausibility check (would a smart non-reader consider it live?): yes for all twelve —
each is a mechanism that could plausibly hold in this domain (statutes usually do vet leaders;
grants usually do decide survival; a shrinking record usually does signal decay; long-lived
groups often do grow their own leaders). None is absurd, circular, or off-topic.

## Hedge balance (law 10)

The key is hedged in q1 and q4 but **confident and specific** in q2 and q3, so "pick the qualified
option" does not score. In q1 the reversed-causality distractor carries the same hedge as the key
(*"tycks oftare ha …"*), and in q4 distractor D is measured too (*"inte säger något säkert"*).
M-FORM passes; no question has every distractor absolutised while the key is measured.

## Self-blind-solve

Solved all four from the passage alone, arguing actively for each non-keyed option before rejecting
it. Result: **Q1 = C, Q2 = A, Q3 = D, Q4 = B**, one defensible answer each.

- q1: B dies on the explicit *logelokal* sentence; A on the absence of any swap narrative; D on the
  passage's own statement that the grant was paid in books (no change is ever reported).
- q2: the statute's three conditions are enumerated in one sentence; B is directly countered by
  *"Vad den däremot inte sade något om var hur arbetet skulle gå till"*.
- q3: A is refuted by the explicit warning against making one household evidence; C by the fact that
  the passage never says who led the Kvarnfors circle and presents the book as illustration.
- q4: D is the closest rival, but the author holds the pattern recurs in too many localities to be
  dismissed, and a methodological caveat is not the text's message.

Key letters spread C · A · D · B (all four used, no positional or length tell).

## Band compliance (self-run of `run_mech.py`, all five gates)

M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass.

- passage words **917** (LÄS long band 215–1260; blueprint target 750–1135) ✅
- sentences 47, mean sentence length **19.5** (band 8.2–30.9; blueprint 14–25), range 4–42 words —
  short verdict sentences (*"Materialet har sina hål."*, *"Den räknade möten, medlemmar och böcker,
  inte samtal."*) set against long subordinated ones ✅
- paragraphs 10 (band 1–35) ✅
- prompt words 6–13 (band 3–31) ✅; option words 12–22 (band 0–23) ✅
- longest/shortest option ratio well under the 5.25 cap; the key is **never** the strictly longest
  option in any of the four questions ✅
- M-PLAGIARISM: no shared 17-token run and containment under 0.01 against `data/parsed/` ✅
