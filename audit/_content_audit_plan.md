# Phase C — Post-audit content + display fixes

**Date:** 2026-05-19
**Status:** Round 1 in progress
**Audit sources:**
- `audit/_ux_audit/` — agent 1, information architecture + layer-1↔layer-2 link gap
- `audit/_ux_audit_2/` — agent 2, content register + ExplanationPanel + eyebrows (returned inline)

## TL;DR

Two independent audits converged on a small handful of high-leverage fixes
that touch the **display layer of existing authored content** — no new
content authoring required, just surface what's already in the JSON. Three
findings stand out:

1. **`pregrade_tactic` is dark on the post-miss surface.** Every recent
   Variant-C explanation authors a named handle + move
   (`"Linjärekvationsreceptet"` / "Subtrahera den mindre x-termen…"), but
   `ExplanationPanel` (phone) and `PedagogyPanel.PostGradeBody` (desktop)
   never render it after grading. The most quotable, drill-friendly piece
   of the corpus is invisible on the surface seen most often.
2. **The three-layer architecture is two layers in parallel.** 4034/4034
   explanations have `framework_id: null` despite the schema reserving it
   for the Layer-1 backlink. When a student misses a KVA question that's
   literally listed in `KVA-TRAP-001.example_questions`, the post-mortem
   can't say "this is the trap you read last week."
3. **The non-trap families are visually thinner than the trap families.**
   `ProtocolCard` and `LexiconCard` don't render `example_questions`
   inline, eyebrows like DTK's bare `NÄR` are weak next to TrapCard's
   `IGENKÄNNINGSTECKEN`, and the drill side uses a fourth label
   (`FÄLLA`) for the same concept TrapCard names as `FÄLLANS TANKE` /
   `NÄR FÄLLAN INTE GÄLLER`.

## Round 1 — display layer (one PR)

All fixes touch existing components or are mechanical data backfills. No
new content. Bundle in one branch (`content-audit-round-1`) since they
share surfaces and verification.

1. **Surface `pregrade_tactic` post-grade** —
   `app/src/components/drill/ExplanationPanel.tsx:153` (Body)
   and `app/src/components/drill/PedagogyPanel.tsx:250` (PostGradeBody).
   Add a `<PregradeTactic>` block above `StepList`. Eyebrow: `STRATEGI`.
   Handle as h3, move as body. Skip if the field is null on legacy entries.
2. **Backfill `framework_id` for KVA + NOG explanations** — write a
   script that inverts the `example_questions[]` index in
   `frameworks/kva_traps.json` + `frameworks/nog_traps.json`, walks
   `data/explanations/*.json`, and sets `framework_id` on each matching
   qid. Then sync to `app/public/data/`. NOG/XYZ deferred until they're
   retrofitted to the rich schema (XYZ has no rich content yet anyway).
3. **Render `framework_id` link in ExplanationPanel** — when present,
   add a small line below the pitfall: "Detta är [KVA-TRAP-001] →" with
   a deep link to `/lektion?section=KVA#KVA-TRAP-001`. Lektion route
   accepts the hash and scrolls + opens that `<details>` block.
4. **Eyebrow rename** — `FÄLLA` → `FÄLLAN HÄR` in
   `ExplanationPanel.tsx` and `PedagogyPanel.tsx`. Trap vocabulary
   consistency with TrapCard.
5. **DTK + MEK eyebrow fixes** —
   `ProtocolCard.tsx:122` DTK `NÄR` → `IGENKÄNNINGSTECKEN`;
   `ProtocolCard.tsx:125` MEK `REGEL` split by `constraint_type`
   (`SYNTAKTISK REGEL` / `LEXIKAL REGEL` / `SEMANTISK REGEL`).

**Verification:** dev server + Playwright at 390×844 (phone) and
1440×900 (desktop). Walk through: KVA missed-question post-grade →
expect STRATEGI handle visible → expect "Detta är KVA-TRAP-N" link →
click link → land on opened lektion entry. Then visit `/lektion?section=DTK`
and `/lektion?section=MEK` to confirm the new eyebrows.

**Test suite:** existing 146 vitest + e2e green. Add no tests yet —
this is display surface; visual verification is the proof.

## Round 2 — content surfacing + framing (one PR)

6. **Inline `example_questions` for non-trap families** — port
   `TrapCard.tsx:335-429`'s `<ExampleQuestions>` block to `ProtocolCard`
   and `LexiconCard`. Same shape: qid kicker, prompt rendered with
   MathText, answer letter badge. Mechanical pattern lift.
7. **Section picker copy reframe** — `app/src/routes/lektion.tsx:40-49`.
   Today's copy reads as a glossary (`ORD: synonymer från riktiga prov.`).
   Reframe to sell by the section's biggest leverage trap, by convention
   the first entry of each framework JSON. Example direction: `KVA — den
   vanligaste fällan är att glömma att kvadrater inte låser tecken.`

## Round 3 — content register cleanup (one PR + authoring rule)

8. **ELF handle/move language consistency** — sweep
   `data/explanations/*.json` for ELF entries where
   `pregrade_tactic.handle` is Swedish but `pregrade_tactic.move` is
   English. Translate the handle to English to match ("Kausalitetskontrollen"
   → "The cause-check"). Per PRD: ELF stays English by exam design.
9. **Authoring rule update** — edit `audit/_explanation_recipes.md` (or
   equivalent doc) to encode:
   - `pregrade_tactic.handle` = definite Swedish noun ending in `-(e)t/-(e)n`
     for non-ELF sections
   - ELF `pregrade_tactic.handle` = English (matching `move`)
   - Reject hyphenated imperative handles (the `var-2026.json:98`
     `"Enhet-först-multiplicera-sist"` outlier)

## Deferred — content workstreams

10. **XYZ trap-catalog retrofit to richer schema** — 55 entries get the
    KVA/NOG treatment (tldr, recognition_cue, worked_example, counter_example,
    inline corpus examples). Already on the roadmap; sequenced behind
    Round 1 so `framework_id` backfill includes XYZ too.
11. **Pre-Variant-C explanation regen** — entries lacking
    `_meta.recipe === "variant-c-ultra-granular"` (host-2013, host-2014,
    host-2015, early NOG/KVA/XYZ) have no `steps[]` or `pregrade_tactic`.
    Regen pass; bigger content lift.
12. **Distractor opener decalcification** — most `why_tempting` strings
    start with one of 5 templates ("Det är lätt att…", "Många stannar
    vid…", "Snabbsvar är ofta…", "Det är frestande att tro…", "Första
    instinkten är att…"). Update the authoring rule to lead with the
    concrete misread; cap meta-openers at 1 per entry.
13. **"Vad vi tror nu" post-diagnostic report** — replace the generic
    DrillResult after `/diagnostik` with a one-page coached summary
    (weakest section + weakest trap family + one specific lesson to read).
    Blocked behind #2 (needs `framework_id` to cluster misses by trap).

## Rejected — not pursuing

- **Render ORD `notes` field.** Audit 1 thought load-bearing teaching
  was hidden in `notes`. Verified false alarm: 29/41 entries have notes,
  but the strings are authoring meta ("Densest prefix-cluster in corpus
  (freq 187)", "Merged from extractor clusters bes/beg/bet") — not
  student-facing pedagogy. Surfacing these would confuse, not enlighten.
- **`pitfall` ↔ `distractors[].why_wrong` collision rewrite.** Audit 2
  flagged ~40% overlap between these fields. Real but invasive — defer
  until Round 1 ships and we see whether the redundancy still bites
  once `pregrade_tactic` carries weight on the post-grade surface.

## Open editorial questions

- **`"Perfect game."`** in `DailyPlanCard.tsx:205` — only English string
  in the home flow. Audit 2 flagged as inconsistent; default position is
  to keep it (deliberate editorial — the all-or-nothing tone matches the
  "no more to do today" moment). Revisit if it nags during dogfood.

## Sequencing rationale

- Round 1 first because: every fix touches a surface the user sees
  multiple times per session (post-grade ExplanationPanel + lektion
  reader), the fixes don't depend on each other, and they share
  verification (one Playwright sweep covers all of them).
- Round 2 second because: it depends on Round 1's component patterns
  (the inline-examples block already exists in TrapCard, but we want
  the eyebrow + framework_id conventions settled before porting it).
- Round 3 last because: it's an authoring rule + a content sweep, less
  display-side leverage per minute of work.
- Deferred items 10–13 are sized as their own content workstreams; they
  shouldn't gate Round 1.
