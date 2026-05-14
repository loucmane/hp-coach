# Explanation voice recipes — Phase A.6V bake-off

Three hand-crafted variants of the same two questions
(`host-2013-kvant2-KVA-016` and `host-2013-kvant1-NOG-026`), produced
under three distinct authoring recipes. The dogfood user picks one
from `/dev/explanation-bake-off`, and the winning recipe gets encoded
as the prompt template in `pipeline/explanations/prompts.py` for the
full-corpus regen (~3500 questions).

The recipes are axis-isolated: each varies ONE dimension relative to
Variant A so that the user's pick maps cleanly to a single prompt
directive change. If you find yourself wanting "B but with A's empathy
openers," that's a fourth variant — cheap; the bake-off infra supports
adding more.

## Variant A — Coaching Deep (baseline)

**Profile**
- Voice: warm coaching, second-person ("du"), encouraging
- Step granularity: 7 steps (Förstå problemet → Välj strategi → 3-4
  algebra moves → Jämför → Slutsats)
- Hand-holding: full ("Multiplikation betyder att gångra varje term
  inuti parentesen med a")
- Distractor format: empathy opener ("Det är frestande att…", "Det är
  lätt att…", "Många stannar vid…") + 1-sentence trap + 1-sentence
  corrective
- Technique field: 1-2 sentences naming the strategy
- Pitfall field: present, structurally distinct from technique
- Target word count: 600-1200 per question
- Actual measured: KVA 534 ord, NOG 759 ord

**Prompt directive equivalent**

> Use 7 numbered steps per quant question, each with a question-
> specific title. Audience is zero-knowledge; explain every algebra
> move in first principles (multiplication, exponents, signs). For
> each distractor: open with an empathy phrase from a rotated set
> ("Det är frestande att…", "Snabbsvar är ofta…", "Det är lätt
> att…", "Om du minns regeln som…", "Många stannar vid…"). Always
> emit both `technique` and `pitfall` when they're structurally
> distinct.

This is the recipe the existing pilot was authored under.

## Variant B — Confident Terse

**Profile**
- Voice: confident-direct, second-person, no warmth padding
- Step granularity: **same 7 steps as A** (identical beats; identical
  algebra moves)
- Hand-holding: **full** (same algebra moves shown), but no
  "explainer" prose — the reader sees the move from context, not from
  a meta-description of it
- Distractor format: **"Trap: …" / "Fix: …"** — 1 sentence each, no
  empathy prefix, no rationale
- Technique field: 1 sentence
- Pitfall field: **null** (deferred — most pitfalls just paraphrase
  the technique anyway)
- Target word count: ~40% of A
- Actual measured: KVA 229 ord (43%), NOG 298 ord (39%)

**Prompt directive equivalent**

> Use 7 numbered steps per quant question — same beats as Variant A,
> but cut all explainer prose. Show every algebra move, do not
> describe what the move IS in meta-terms. For each distractor:
> "Trap: <what wrong reasoning lands here>." then "Fix: <what the
> correct reasoning is>." No empathy openers. `pitfall` is always
> null unless TRULY orthogonal to `technique` (rare).

**Isolates**: voice (warmth, empathy framing). If user picks B, the
problem with A wasn't the depth — it was the coaching tone.

## Variant C — Ultra-Granular

**Profile**
- Voice: same coaching warmth as A
- Step granularity: **10+ steps** — each algebra move and each
  vocabulary explanation gets its own step card
- Hand-holding: **maximum first-principles** — when squaring is
  invoked, the step starts with "Kvadrera betyder att gångra ett tal
  med sig självt"; when distributive law applies, the step names it
  and shows it
- Distractor format: empathy opener + extended reasoning that
  cross-references step numbers ("Som steg 6 visar…")
- Technique field: 2-3 sentences naming strategy AND the actionable
  trigger ("villkor + uttryck med flera variabler → substitution")
- Pitfall field: present, with the corrective "botemedlet" pattern
- Target word count: 1500-2000 per question
- Actual measured: KVA 910 ord (170% of A), NOG 1027 ord (135% of A)

**Prompt directive equivalent**

> Use 10+ numbered steps per quant question — every individual
> algebra move and every domain-vocabulary term ("kvadrera",
> "distributiv lag", "koefficient", "liknande termer") gets its own
> step card. When a basic operation appears (squaring, multiplication
> of negative numbers, addition of like terms), the step opens by
> defining it in first-principles ("kvadrera betyder…"). For
> distractors: include cross-references to step numbers where the
> trap would have been caught. `technique` is 2-3 sentences naming
> strategy + actionable trigger. Emit `pitfall` when distinct from
> technique, written as the "botemedlet" / corrective.

**Isolates**: depth (granularity, first-principles density). If user
picks C, the problem with A wasn't the voice — it was that the depth
was under-shot.

## Decision matrix

| User picks | What it means | Prompt directive change |
|---|---|---|
| A | Baseline is right; voice fine, depth fine | None — ship A's recipe verbatim |
| B | Voice was over-warm; depth was right | Drop empathy openers; tighten step prose; set `pitfall: null` by default |
| C | Voice was right; depth was under-shot | Push step count from 7 to 10+; add first-principles re-explainers for basic operations |
| "B-but…" / "C-but…" | Partial pick — keep some dimensions from A | Author one more variant blending dimensions; iterate |

## After the user picks — insurance interstitial

Per the plan's tone-capture concern, DO NOT jump straight from the
picked variant to a 27-subagent fan-out. Steps:

1. Read the winning recipe and any "but…" caveats from the user
2. Draft `pipeline/explanations/prompts.py` encoding the directives
3. Author **3-5 additional sample explanations** by hand using the
   new prompt — one from each major section (KVA, XYZ, NOG, MEK, LÄS).
   Spans the cross-section risk surface.
4. User OKs the sample (or sends one more "but…")
5. Only then: 27-subagent fan-out for the full ~3500-question regen,
   each subagent running the locked prompt template and validating
   via `validate_explanation` + `lint_entry`.

This is a half-hour insurance policy against a 3+-hour subagent
misfire if the prompt translation drifts from the user's intent.
