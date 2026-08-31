# gen-elf-short-2 — "Quarnley Bar" (batch 15)

**Block format:** `short_text_1q` · **Genre:** history_essay · **Spelling variety:** BrE
**Family:** ELF-TYPE-002 (inference / implication) · **Key:** C

## Topic and lane check

Assigned lane: a fresh economic/social-history micro-topic, TYPE-002 inference.
Chosen topic: **the side bar (side gate) on an English turnpike trust's road —
what a gate that never covers its own wages is actually worth.** One trust, one
lane, one season.

Graze check against the 93 shipped families in `BRIEF-ADDENDUM.md`: nothing in
the bank touches roads, tolls, or trust administration. The nearest neighbours
and why this is not them:

- `economic-history-incentives-inference` (elf-b1-004, "Paid by the Ship") —
  explicitly excluded. That unit is about *incentive alignment* (lantern-keepers
  paid per ship vs a salaried neighbouring town) and argues by cross-town
  comparison. This one is a single trust's own before-and-after with no
  incentive story and no comparison town. The word *keeper* is avoided
  throughout in favour of the period term **tollman**, so the two units do not
  even share vocabulary.
- `postvasende-landsbygdshistoria`, `history-of-navigation`,
  `vertical-transport-history`, `cold-chain-logistics`, `sleeper-train-revival`
  — transport-adjacent, none of them road tolls.
- `archival-silence-local-history` (elf-b2-004) — that unit's *subject* is the
  absence in a record. Here the closing silence (Bardsell's report does not
  mention the summer) is texture at the end, not the thing being reasoned
  about; the item turns on three stated quantities, not on a gap.

Also avoided by construction: **ledger / day-book / account-book sourcing**,
which GENERATION.md law 13 lists as a saturated motif (and which carried
elf-b6-003 and elf-b2-004). Nothing here is "the records show".

## Passage architecture (law 12)

The shipped ELF-short mould is *received account says X → a study / collection /
historian found a stranger story → hedged verdict*: elf-b6-003 ("the trade press
assumed the point was speed … Roth … found a stranger story"), elf-b13-003
("that is where most accounts stop … makes it less tidy"), elf-b12-003 ("the
names are not descriptions"). This unit deliberately has **none of that
skeleton**:

- no received view, no corrective pivot, no "however";
- **no interpreting voice at all** — the surveyor proposes, the board agrees,
  the numbers move, and nobody in the text draws a conclusion. The reader is
  the only one who can. That is what makes it a genuine TYPE-002 rather than a
  paraphrase of somebody's stated thesis;
- no aphoristic coda and no "not A, but B" chiasmus. The passage simply stops
  on a page-and-a-half report that says nothing about the summer.

Thesis shape: **straight reconstruction, left unresolved** — not "the metric
measures the wrong thing", which law 12 caps.

Register: flat documentary local history, BrE. Sentence rhythm alternates a
28-word opening with a 5-word verdict ("It never paid for itself."), a 31-word
subordinated sentence, and an 8-word one ("By September a man was back at
Quarnley."). Measured sd 8.6 (blueprint floor 7).

## The inference

Three facts are stated separately and never joined:

1. the bar's best year took **less than the tollman's yearly wage**;
2. with the bar unmanned, the **main gate** fell **by several times that wage**
   — while the trust's other two gates "took what they usually took";
3. the lane "rejoined the turnpike **well beyond the main gate**".

(3) supplies the mechanism (a driver on the lane misses the main gate), the
control in (2) rules out a general bad season, and (1)+(2) give the magnitude.
One logical inch: the summer cost the trust more at a *different* gate than
Quarnley bar had ever collected at its own. The passage never says it.

## Trap architecture

Stem: *What does the text suggest about Quarnley bar?* — attested inference
form (cf. elf-b3-004, elf-b2-004). An earlier draft read "What does the summer
of 1831 suggest…"; it was **cut** because only two of the four options engage
the summer, which handed a blind solver a 50/50 elimination (a G-STEM
`PARTIALLY` flag). The neutral stem leaves all four options equally on-topic.

| opt | role | mechanism |
|---|---|---|
| A | **scope-shift / wrong target** | the two farms are the lane's most visible traffic, and putting a bar where carts go is the obvious reading — but one clause removes them from the bar's business entirely: "carts about the two farms' business went through free, as the Act required" |
| B | **half-right conjunction** | first clause is straight from the text ("It never paid for itself"; the board *did* agree to unman it), which lends the verdict clause borrowed credibility; the verdict is then refuted by the next two sentences (the main gate's fall, and "By September a man was back at Quarnley"). A reader who stops at the comma takes it |
| **C** | **key** | one_inch_inference: joins the bar's best-year take, the size of the main gate's shortfall, and the lane's course past the main gate |
| D | **alternative-cause / confound** | aimed at the *properly* skeptical solver — one bad season explains a great many falls in takings. Defeated by the control planted in the same sentence as the fall: the trust's other two gates, same season, "took what they usually took" |

No distractor is verbatim-true as a whole: A is contradicted, B is true only in
its first conjunct, D is excluded by the control clause.

## Self-blind-solve

Solved from the passage alone, arguing each non-key option in good faith.

- **B** is the strongest rival, and the only one with real textual footing: the
  passage says outright that the bar never paid for itself. The case dies on
  the two sentences after the fall — the trust lost several times the wage and
  put a man back at Quarnley, so "the board was right to do without it" is the
  one thing the episode disproves.
- **D** is the strongest rival for a cautious reader, and it is beaten by a
  single clause rather than by argument: the other two gates were normal in the
  same season.
- **A** is beaten by the statutory exemption clause; the farms are the traffic
  the bar demonstrably did *not* charge.
- **C** is the only option consistent with all of the passage's numbers.

**Result: single defensible answer (C). No rewrite needed.**

Test-wise checks: no option carries an absolutizer (M-FORM clean) and none is
the sole hedged one, so "pick the qualified answer" and "strip the absolutes"
both score nothing; the key is 17 tokens against 17 / 18 / 17 — tied second,
never the longest (M-TELL clean, ratio 1.06 against a 2.36 cap). Key letter
**C**, not A (addendum tell 1).

## Names (law 16 — search log, not a certificate)

The session's WebSearch budget was exhausted before this unit was authored, so
every check below was run through the Exa `web_search_exa` tool on 2026-08-25.
Queries are re-runnable in any engine.

| name | query | outcome |
|---|---|---|
| **Skelbrigg** (trust, toponym) | `"Skelbrigg" exact term` | no exact match; nearest hits Skelsmergh / Skelwith Bridge (Cumbria) and Scots-dictionary *brig*. **Kept** |
| **Quarnley** (bar and lane) | `"Quarnley"` | no place anywhere; one 1800 Wakefield baptism recording a *Hannah Quarnley* (surname), plus procedurally generated OpenTTD town names. **Kept**, with the surname use recorded rather than suppressed |
| **Josiah Bardsell** (surveyor) | `"Bardsell" surname` | britishsurnames.uk: so rare it may be a transcription error for Bardsley/Birdsall; 8 Bardsells in the 1911 Canadian census. No notable bearer in any field; no *Josiah Bardsell*. **Kept** |
| **Bryony Ombleby** (byline) | `"Ombleby"` | no exact match; results were for the unrelated string *Omble*. **Kept** |

**Rejected during this pass, each on a live collision:** *Wintersill*
(Wintershill, Durley, Hampshire — a real hamlet, one Companies House address
literally spelled WINTERSILL); *Kelverton* (National Archives / Verney-memoir
variant of Kelvedon, Essex, plus a Colchester company address); *Ganderleigh*
(Ganderleigh Farm Lane, Chester, Maryland — a real registered US road);
*Ockwold* (John Ockwold of Sutgrove, 1582–83 Gloucestershire pedigree);
*Wraydon* (the Wraydon family of *The Curse of the Wraydons*, 1946, and the
Spring-Heeled Jack story papers).

**Not verified:** no direct check of the Ordnance Survey gazetteer or Companies
House — open web search results only, as listed above.

Registry: no name here appears in the batch15 name registry; no repeated given
name; historical figure male, byline female (law 13 gender randomisation); no
"Hal-" prefix.

## Bands (measured with `mech.py`)

passage **164 tokens** (ELF short_text band 101–368; blueprint target 105–160;
shipped ELF shorts run 130–170) · **1 paragraph** (0–8) · 9 sentences, mean
**18.2 words** (band 12.0–47.2), sd **8.6** (blueprint floor 7) · prompt **8
tokens** (3–30) · options 17 / 18 / 17 / 17 (max 31), ratio **1.06** (cap 2.36).

Dash convention: spaced en dash in the byline, **zero em dashes** anywhere
(addendum tell 3).

`run_mech.py` with `--p5-corpus-dir auto` (93 shipped units indexed) and the
authentic corpus at `data/parsed`:

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass
```
