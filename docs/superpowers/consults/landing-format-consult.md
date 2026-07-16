# Landing format consult — carrying the full pedagogy on the landing page

**Date:** 2026-07-16 · **Branch:** `consult/landing-format` · **Status:** proposal for owner discussion before a v3 bake-off. Nothing here is built.

## The owner's question

> "the exercises doesnt have the authentic pedagogy build with why it wasnt the wrong answers etc. We should apply the full experience for the example. Like all the steps on how to get to the correct answers. Maybe instead of everything being one scrollable experience we can have different screens?"

Two asks in one: (1) the demo questions should carry the **real** post-grade experience — UTFALL (verdict + correct answer), "Så löser du den" (numbered steg), "Varför de andra lockar" (per-distractor *varför det lockar* / *varför det är fel*) — not the current verdict + one-liner; (2) is one scroll still the right container, or should the landing use screens?

## The measurement that shapes everything

What the real `PedagogyPanel` renders for one question (measured against the shipped corpus, e.g. `var-2026-verb1-ORD-001`):

| Beat | Content | Weight |
|---|---|---|
| UTFALL | verdict word + "Rätt svar är a) …" + solution lede | ~40–60 words |
| SÅ LÖSER DU DEN | 3 steg, each with title + tier badge + 60–120-word body | ~250–350 words |
| VARFÖR DE ANDRA LOCKAR | 3–4 distractors × (*varför det lockar* ~40w + *varför det är fel* ~40w), struck option text reprinted | ~250–350 words |

**Total: ~600–800 words ≈ 4–5 phone viewports per question.** The v2 landing has 2–3 demo questions. Full pedagogy inline on all of them turns a ~6-viewport sales page into a ~20-viewport reading assignment. That single number rules out the naive answer and frames every format below.

A second structural fact: the pedagogy is **already beat-shaped**. The panel is three rail sections; the steg are numbered; the distractors are discrete rows. The product's own architecture is a sequence of small units — which is exactly what a stepped format needs. We don't have to invent screens; the content already has them.

## Formats evaluated

Criteria (from the brief): the 23:00 phone visitor's attention arc · time-to-CTA · how much pedagogy converts vs exhausts · ADHD pillar "en sak i taget" (which argues FOR screens) · technical fit (public page, no auth, no router state worth breaking).

### (a) Inline-deep — the full panel expands in the scroll

After grading, the complete three-section panel unrolls in place, exactly as in the drill.

- **Attention arc:** the grading moment is the emotional peak; inline-deep spends that peak on a 4-viewport wall. The visitor who keeps scrolling to "see what else is on this page" must scroll *through* the pedagogy — the sales copy below it (claims, price) recedes behind homework.
- **Time-to-CTA:** the earned mid-page CTA moves 4 viewports further away per answered question. The sticky bar compensates, but the page's rhythm is gone.
- **Converts vs exhausts:** exhausts. In-product, the reader has committed to a session; at 23:00 on a landing page they have committed to ~90 seconds.
- **ADHD pillar:** violated in spirit — everything at once on one canvas is the opposite of "en sak i taget."
- **Technical:** trivial (it's the shipped panel).
- **Verdict: reject as the primary format.** Depth is right; the container is wrong.

### (b) Stepped screens — answering opens a focused sub-experience

Grading navigates to a takeover flow: one screen per beat (verdict → steg 1 → steg 2 → steg 3 → fällor), then returns to the page.

- **Attention arc:** excellent *inside* the flow — tap-tap-tap story pacing, each screen one thought, genuinely how the lesson should feel. Risky at the *boundaries*: a full-screen takeover on a public page is a context switch, and the return trip must restore scroll position perfectly or the visitor is lost. Bail-out mid-flow = the visitor may never see claims/price at all.
- **Time-to-CTA:** the flow suspends the CTA system (sticky bar must hide inside it or it reads as an exit sign).
- **Converts vs exhausts:** converts IF entered; the entry cost is the problem. ~6–7 taps for one question is a real commitment.
- **ADHD pillar:** the purest expression — this is the strongest argument for (b), and why it stays in the bake-off.
- **Technical:** heaviest — history/back-button handling, scroll restoration, mobile address-bar jank on route-like transitions, all on a page that today is a self-contained component with no router.
- **Verdict: runner-up.** Right pacing, expensive frame.

### (c) Hybrid — verdict inline + "Se hela genomgången →" opens the full experience

Keep today's verdict beat; a link opens the full panel in a sheet or sub-screen.

- **Attention arc:** preserves the v2 scroll perfectly. But the differentiator — the thing the owner is asking to *show* — is now behind an unlabeled cost. Most visitors don't tap optional doors; the pedagogy the whole product is built on may go unseen by the majority.
- **Time-to-CTA:** unchanged (best of all formats).
- **Converts vs exhausts:** neither — for non-tappers it simply doesn't participate. The door's existence is weak evidence ("there's more here") but evidence of *quantity*, not *quality*.
- **ADHD pillar:** neutral.
- **Technical:** light (a sheet already exists in the app's vocabulary).
- **Verdict: reject as primary; it's the fallback if the bake-off shows both stepped formats hurt conversion.** The owner's complaint was that the pedagogy isn't in the experience — (c) answers "it's available" when the question was "show it."

### (d) The demo AS the landing — a 3-question guided flow with sales copy woven between beats

- **Attention arc:** maximal ambush, and the strongest version of P1's thesis ("Det här är inte en broschyr"). But it takes the visitor hostage: no skimming, no jumping to price, no answering the visitor's actual 23:00 questions ("will this fix me, what does it cost") without playing through.
- **Time-to-CTA:** hostage to flow completion — the worst of all formats for the ready-to-buy visitor the CTA system was just rebuilt for (round 2.1's early door exists precisely because conversion must not be conditional on playing).
- **Converts vs exhausts:** bimodal — great for players, hostile to evaluators. A landing must serve both.
- **Technical:** a full rebuild; also weak for SEO/scanability (content revealed by interaction).
- **Verdict: reject.** It contradicts the CTA-system decision the owner just made.

### (e) RECOMMENDED — "Scenen" (the in-scroll stage): screens without navigation

A synthesis of (a) and (b) that neither format list contained. After grading the hero question, the pedagogy does **not** unroll and does **not** navigate away. Instead a **fixed-height stage card** appears in the scroll — phone-viewport-proportioned — and the full panel plays *inside it*, one beat per tap:

```
beat 1  UTFALL      picked word struck — fel. · Rätt svar är a) prövning · lede
beat 2  STEG 1/3    Vad betyder vedermöda?          (title + body, tier badge)
beat 3  STEG 2/3    Förledet veder-
beat 4  STEG 3/3    Välj synonymen
beat 5  FÄLLAN      b) belöning — varför det lockar / varför det är fel
                    (YOUR pick's row first if you picked a distractor)
beat 6  KVITTO      "felet taggat: förledsförväxling → repetitionskön"
                    + earned CTA ("Det där var appen · Skapa konto →")
```

One control: **"Nästa →"** (plus a quiet "hoppa över"), a mono progress meter ("GENOMGÅNG · 2 AV 6"). When the stage finishes — or is skipped — it collapses to a one-line receipt in the scroll ("Genomgång klar · 6 beats · felet taggat") and the page continues as v2 does today.

Why this wins each criterion:

- **Attention arc:** the grading peak is answered with *one tap*, not a wall. Each beat is one thought — story pacing (b) without leaving the page. Skipping costs nothing: the visitor just keeps scrolling; the stage never traps.
- **Time-to-CTA:** unchanged. Early door, sticky bar, final block all keep their round-2.1 contract; the stage adds an *extra* earned CTA at beat 6, the strongest possible moment (they just experienced the full loop).
- **Converts vs exhausts:** depth is *legible before it's consumed* — "1 AV 6" tells even the non-player exactly how deep the product goes, which is the quantity-AND-quality evidence (c)'s door can't give. The player gets the real experience; the skimmer gets the receipt.
- **ADHD pillar:** this is the pillar **as a format**. "En sak i taget" stops being a claim in a note block — the landing *behaves* it. No copy can make that argument as well as the mechanism itself. (And the claim note can then point at what the visitor just did.)
- **Technical fit:** one self-contained component, pure local state, no router, no history, no scroll restoration. All beats stay in the DOM (visually one at a time) so crawlers and no-JS readers get the full text; `aria-live` region announces beats; reduced motion renders instant swaps. Public, auth-free.

**Discipline that makes it work — "ett fel, hela vägen":** only the hero ORD question is armed with the full stage. The other demo questions keep the v2 verdict + one-liner, each with a folio line: *"I appen får varje fel den här genomgången."* One complete proof by specimen beats three exhausting ones. This also caps the content cost (see below).

**Detail worth keeping from the drill:** when the visitor picks a distractor, beat 5 leads with *their* letter — the distractor analysis lands hardest when it's about the trap *you* fell into. That's the product's core loop ("felen är läroplanen") demonstrated on the visitor's own mistake.

### Costs and open items for (e)

1. **Content, not just UI:** the demo questions are original (legal: nothing from © UHR data), so the full pedagogy must be **hand-written** for *vedermöda* — 3 steg + 4 distractor rows in corpus voice (the `ExplanationSpecimen` already has the b) *belöning* row; three more rows + steg needed). ~1–2 h of writing, native-quality pass like the round-2 notes.
2. **Stage height:** fixed height must fit the longest beat at 320px width — beats need a max-word budget (~90 words), which the hand-written content can respect by construction.
3. **Replay:** after collapse, the receipt line should reopen the stage (cheap: same state).
4. **Correct-answer path:** a right pick still earns the stage ("Rätt — men kan du fällorna?" framing), with beat 1 as the confirming verdict. Depth is the product even when you're right.

## Recommendation

**Primary: (e) Scenen** — fixed-height in-scroll beat-stepper on the hero question only, full authentic pedagogy (UTFALL → 3 steg → fällor → kvitto), one beat per tap, collapses to a receipt, CTA system untouched.

**Runner-up: (b) Bläddran** — the full-screen stepped takeover. Same beats, same content, but as a focused sub-experience. It is the purest "en sak i taget" and might feel *better* on a phone than the stage despite the navigation cost; that's an empirical question, not one to settle in prose.

## What the v3 bake-off should build

Two chips, both on the P1v2 "Första frågan" base, both consuming the **same** hand-written vedermöda explanation (write the content once, first):

1. **`LAND_P3S` — Scenen:** in-scroll stage as specified above.
2. **`LAND_P3B` — Bläddran:** grading opens the takeover flow (screen per beat, same 6 beats), returns to the page at the claims section.

Judge at 390px on: taps-to-full-pedagogy, whether the sticky-CTA contract survives, scroll length delta vs v2, and the subjective read of the boundary moments (entering/leaving the pedagogy). Do **not** build (a) or (d); keep (c) in reserve as the low-engineering fallback if both stepped formats feel heavy.

## Visual board

`screenshots-consult-format/` — phone-frame beat sequence of Scenen (artboard, not a build): source `docs/superpowers/consults/landing-format-board.html`.
