# gen-elf-long-1 — "Buoy 43, Off Cleyburn"

**Slot:** batch-14 replacement for **elf-b6-001 (seed banks)**, retired by the
whole-bank audit as a paragraph-level clone of `elf-b5-001` (glass cullet).
**Anti-model (binding):** `batches/batch5/candidates-final/elf-b5-001.json`.

**Topic (exclusive):** lightship and buoy tending — the maintenance craft of
floating navigation aids. Invented waters (Cleyburn approaches, the Gaunt
Shoal), invented tender (*Marram*), invented crew.
**Block:** `long_passage_5q`. **Genre:** society commentary in the form of
first-hand working reportage (a ride-along), not science journalism.
**Spelling variety:** BrE throughout (metres, harbour, tonne, grey, practice).

---

## 1. Law 12 — architectural divergence from the anti-model

The anti-model's move sequence, listed explicitly, and mine beside it:

| # | `elf-b5-001` (anti-model) | this unit |
|---|---|---|
| opening | states a received "pitch" in order to undercut it ("For years the pitch has run the same way… What the story mostly skips…") | opens inside an action at 06:20 — a buoy on the crane, mud, chain on deck — with no framing claim and nothing to undercut |
| second move | a designed field experiment: matched melting campaigns at a named works, one variable held free | mechanism exposition: what actually holds a floating aid in place (slack, scope, swing circle, where wear concentrates). No study, no experiment |
| third move | the second metric splits from the first at a numeric threshold (~60 %), producing the reversal | a **historical digression** — the lightship withdrawn in 1968 — carrying residue that serves no thesis (the fog bell, the twice-yearly painting, logs that are "mostly weather"). The anti-model has no digression at all |
| objection slot | ONE overconfident practitioner quoted with an absolute rule; the careful woman scientist corrects him and wins | **TWO practitioners who disagree with each other**: a long-service tender master (m) with a mechanical argument, and a mooring engineer (f) with instrument data. The challenger is a woman, she is **partly right**, and she wins a real concession on the inshore aids |
| closing | verdict paragraph + aphoristic two-sentence chiasmus ("The number that matters… is not how full the batch is. It is how clean.") | **genuinely unresolved** — two losses in ten years is too thin a series, and no grounding has been traced to the measured wander. Each side states a wish, the buoy goes back over the side, the deck is hosed down. The passage simply stops |
| thesis shape | "the metric everyone quotes measures the wrong thing" (saturated) | **mechanism-is-the-point + genuinely unresolved**; no metric is debunked and nothing is reframed |
| furniture | byline **and** glossary; title "The + modifier + noun" | byline kept, **glossary dropped** (scope, sinker, swivel glossed inline); title is a place-and-number label ("Buoy 43, Off Cleyburn") |
| question geometry | main idea at **position 1**, stance item at position 5 | main idea at **position 5**, and the fifth family is **TYPE-006 purpose** at position 3, not a stance item |
| numeric register | percentages throughout | mixed on purpose: digits (43, 1911, 1968, 2019, 35 metres), spelled-out numerals (thirty-one, two hundred and fourteen, five men), a fraction (a fifth), a bare duration (forty minutes) |

Gender pattern: the bank was 18-for-18 careful-woman / overconfident-man. Here
the cautious long-service voice is a man (Cadell), the data-bearing challenger
is a woman (Prigent), and the third voice (Fewtrell, retired keeper) is a man
with no stake in the argument.

## 2. Law 13 — registry check

Grepped against `batches/*/candidates-final/*.json` before committing:
`Cadell`, `Prigent`, `Fewtrell`, `Osian`, `Naomi`, `Rufus`, `Fenella`, `Moye`,
`Marram`, `Gaunt`, `Cleyburn`, `Shoal` — **zero hits**. Rejected during
drafting for collisions: *Bray* (elf-b10-001), *Ryd* (7 units), *Vale*,
*Marguerite*. The first draft used "the Gaunt **Bank**"; M-ECHO flagged `Bank`
as name reuse against `elf-b11-002` (bank vaults), so the feature was renamed
to the **Gaunt Shoal** and M-ECHO now passes clean. No banned surname, no
"Hal-" prefix, no "Ingrid".

## 3. Law 14 / 15 — phrases and surface

No burned phrase family or close variant. Specifically avoided: the "story /
pitch" opener, "…like to admit", "the number that matters", "there is no such
thing as too…", "more divided than X's rule allows", and any "not A, but B"
close. Title is not "The + modifier + noun". Sentence rhythm alternates long
subordinated sentences with four short verdict sentences ("Cadell would like a
February." / "The chain runs out fast.").

## 4. Trap architecture per question

| q | family | anchor | key | planted traps |
|---|---|---|---|---|
| 1 | ELF-TYPE-001 | ¶2, wear sentence | **B** | A quantifier_upgrade (real "fifth of its diameter" spread over *every link* and pinned to the cycle); C outside_knowledge (salt corrosion — true-sounding, never stated); D wrong_location (the "inshore, water is narrow" clause belongs to ¶4's position concession) |
| 2 | ELF-TYPE-002 | ¶2, swing circle | **C** | A too_literal (chain-exceeds-depth restatement, true of every aid, answers nothing); B quantifier_upgrade ("hours together" in the spring floods → "most of the year"); D too_far (an early lift the text never mentions) |
| 3 | ELF-TYPE-006 | ¶3, the digression | **A** | B too_far/unsupported comparison (the paragraph in fact says the lightship *also* wandered); C wrong_location + outside_knowledge (one vessel's costed withdrawal generalised into a post-war decline); D **hedged decoy** ("may have watched their position more closely") — planted so that "pick the qualified option" cannot score |
| 4 | ELF-TYPE-001 | ¶4 close | **D** | A polarity overshoot (partial concession → full surrender); B substituted reason (cost, which is Cadell's argument nowhere; his reason is mechanical); C invented causality (the storm is real but is the closing paragraph's *unsettled evidence*, not the origin of his practice) |
| 5 | ELF-TYPE-004 (edge, pos 5) | whole text | **B** | A scope_error (the ¶3 digression promoted to subject); C surface_word_match (loggers turned into a recommendation the writer never makes); D outside_knowledge/over-broad (crew cost appears once, in 1968; nothing tracks costs rising) |

Family budget: 2 × TYPE-001, 1 × TYPE-002, 1 × TYPE-004 at an edge, 1 ×
TYPE-006 — the blueprint's long-passage budget.

**Hedge balance (law 10).** Only the Q2 key is hedged ("may be riding the
edge"); Q1, Q3 and Q4 keys are confident and specific, and Q3 carries a hedged
*distractor*. "Correct" and "qualified" therefore do not line up.

**Length tell (law 10).** No key is the longest option in its question
(Q1 18>15, Q2 17>15, Q3 not sole longest, Q4 17>12, Q5 17>14). Measured option
ratios: 1.29 / 1.21 / 1.21 / 1.42 / 1.21, all under the 2.36 cap.

**Key letters:** B, C, A, D, B — all four used, no monotonic run, no
alternation.

## 5. Self-blind-solve (whole sheet, passage-blind then passage-only)

*Passage-blind pass first:* no stem gives its answer away by form; no option is
selectable on world knowledge (every figure is invented); and no key can be
recovered from a sibling key — Q1 asserts where chain wear concentrates, Q2
that an off-station light may be inside its swing circle, Q3 what the
historical paragraph is *for*, Q4 how far one man has moved, Q5 the whole-text
focus. Five different propositions; none corroborates another. The nearest
adjacency (Q2 mechanism vs Q5 focus) was checked and rejected as a leak: Q5's
key names the craft and the unsettled scope argument, which does not entail the
swing-circle inference, and Q2's key does not name the argument at all.

*Passage-only pass, arguing actively for every non-keyed option:* Q1=B, Q2=C,
Q3=A, Q4=D, Q5=B — **5/5**, one defensible option each. Closest calls:
Q3 B vs A (settled by "a moored ship does not sit still either", which blocks
the "manned station held position better" reading) and Q4 A vs D (settled by
the final sentence, "On the outer stations he has not moved").

## 6. Mechanical self-check

`run_mech.py … --p5-corpus-dir auto` (87 shipped units indexed):
**M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass, M-ECHO pass,
M-PLAGIARISM pass.**
Passage stats: 781 words (`str.split`) / 787 mech tokens, 5 paragraphs,
mean sentence 24.5 words, sentence-length sd ≈ 19 — inside the ELF
`long_passage` bands (332–873 words; mean sentence 14.9–35.4) and inside the
brief's 550–800 window.
