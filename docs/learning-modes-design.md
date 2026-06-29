# Learning-modes IA — the user-friendly layout of "ways to learn"

**Status:** design recommendation (analysis only, no code changed)
**Date:** 2026-06-28
**Surfaces touched:** Home (unchanged in spirit) · `/lektion` reader + picker · drill deep-links
**Author:** design synthesis, adversarially reviewed (verdict: ship-with-fixes)

---

## 1. The question

> What is the optimal, user-friendly way to lay out the different "ways to learn"
> so the dogfood user can fluidly move between **reading** and **targeted practice**?

The owner's hypothesis: *"different types of ways to learn is the best — but we need
it laid out in a user-friendly way."*

That hypothesis is **half right**, and the half it gets wrong is the whole design.

The rich set of modes is genuine product value — each maps to a distinct cognitive
operation (read a countermeasure / retrieve one pattern / interleave / re-test a miss).
They must all stay reachable. **But they are not co-equal choices to lay out side by
side.** They are an **ordered loop** the scheduler already sequences correctly:

```
read-new  →  blocked-drill (one pattern)  →  interleave (mixed)  →  spaced-repeat (your misses)
```

So the answer to "how do we lay out the modes" is **hierarchy, not a menu**. The
moment you render a 6–8 tile grid of co-equal modes, you have built the literal
ADHD-PI choice-overload failure the product exists to avoid (PRD NF6.1.1; Screen 4:
"single big Fortsätt button, no choice, no section tiles").

**The engine is complete. Only the doors are hidden.** The scheduler deep-links every
mode; all 201 framework entries resolve to real drillable questions; the drill route
validates `?section&framework` and `pickFrameworkQuestions` plays an entry's
`example_questions`. The gap is purely surfacing / information architecture.

---

## 2. The three-tier rule (the spine of the whole design)

Every analytical lens independently arrived at the same three constraints. Treat these
as invariant; everything below is an application of them.

**Tier 1 — Exactly ONE prescribed next action is visible at any moment.**
Home's promoted `Fortsätt` (the first incomplete plan item) is the ADHD-PI keystone and
a hard PRD requirement. The number of *visible primary choices* must be 1, even though
the number of *discoverable modes* is all of them. Never add modes to Home. Never render
a mode grid anywhere.

**Tier 2 — The rich modes live ONE level down, framed as "pick an AREA," never "pick a
mode."** The user wakes up with a goal ("get better at KVA" / "fix my mistakes"), not a
desire to choose a cognitive operation. Expose only the **grain axis** (trap → section →
mixed) as navigable. Make the **source axis** (random vs your-misses vs prescribed vs
placement) a *system* decision — the user never picks "mixed vs section vs repetition,"
the scheduler and due-gating pick the source.

**Tier 3 — Read and drill are TWO PHASES OF ONE ACT, fused on the pattern object.**
Reading a trap is the worked example; drilling it is the test. The practice verb must
sit *on the pattern itself*, in-flow, with zero navigation — not in a parallel "Övning"
tab that implies read-vs-drill is a real dichotomy.

**Hard "do NOT" list (shared by every lens):**
- Never render a 6–8 tile grid of co-equal modes.
- Never add the modes to Home.
- Never promote repetition or diagnostik to permanent top-level nav peers
  (keep them invisible-until-due / once-only; a visible empty backlog is anti-focus and
  mildly shaming — PRD Screen 8 forbids streak/shame language).
- Never lean on ⌘K to carry mode discoverability (⌘K is a power accelerator, not primary nav).
- Never un-collapse the lesson bodies to "fix" discovery — lift only the *verb*.

---

## 3. Final recommendation — the optimal layout

Three surfaces, never a mode grid.

### HOME — the 90% path (unchanged in spirit)
The scheduler's `DailyPlanCard` owns the screen. The first incomplete plan item is the
single focal `Fortsätt` CTA (`Börja: Repetition · 10 missar →` /
`Börja: KVA · kvadrat-likhet låser inte tecken →`). Items 2–3 are quiet hairline rows;
the rest folds under "visa hela dagens plan." `TopTrapsCard` stays below (it already
taps through to `/drill?framework=ID`). **No tiles. One obvious start.**

### LEKTION — the deliberate path, where the richness lives
This is the only surface that holds the rich set, and it holds it as a *reading surface
with practice fused onto each object* — not as a menu.

- **Picker** ("Läs först."): the existing weakness-ranked section list (svagast badge +
  score tail). Below the 8 sections, the **system-chosen sources** appear as two quiet
  lines, NOT tiles:
  - `Blandad övning · alla sektioner →` (always present, subordinate)
  - `Repetera dina N missar →` (rendered **only when `due > 0`** — never a dead control)

- **Reader** (a section's pattern catalog): each pattern stays a collapsed
  `<details>` (the anti-fatigue collapse the dogfood user needs — prose stays hidden).
  **The fix (Tier 3): lift the practice verb out of the collapsed body onto the
  always-visible summary row**, as a quiet, *subordinate* hairline affordance, so
  scanning the collapsed list reads:

  ```
  [ pattern headline ........................  läs ▸ ]   ← expand affordance is primary
                                               öva →     ← practice is a quiet tertiary
  ```

  Expanding still reveals the full lesson and, after the `worked_example`, the in-flow
  primary CTA (`Testa det här mönstret → N frågor`). That in-body CTA is the canonical
  "I just read it, now drill it" close; the summary-row `öva →` is the express lane for a
  pattern you already know.

### ESCAPE HATCH
Section drill / mixed / repetition reachable from the picker footer lines above and from
⌘K (as a *secondary* path, never the only one). Diagnostik leaves the daily loop entirely
(once-only placement, not a recurring mode).

### Entry-point map
| From | To |
|---|---|
| Home `Fortsätt` | the exact prescribed mode (scheduler decides source) |
| Lektion picker | section reader → read \| drill per pattern |
| Pattern summary row `öva →` | `/drill?section=X&framework=id` (one tap, no expand) |
| Expanded pattern in-body CTA | same drill, after reading |
| Drill result | "Öva fler av detta mönster →" (`framework_id` already on the question) |
| ⌘K | power moves only |

This delivers all three tiers with the least code and **zero PRD conflict**. It is the
floor, not the ceiling (see §6 phasing).

---

## 4. The immediate win — surfacing practice from lektion

**The single highest-leverage leak in the product:** targeted retrieval practice on a
just-read pattern is *already wired and resolves to real questions for all 201 framework
entries*, but the `Öva …` link is the **last child inside a collapsed `<details>` body**
in all three lesson cards — so it is two interactions deep and reads as read-only.

Verified locations:
- `app/src/components/lesson/TrapCard.tsx:210` — `<Link to="/drill" search={{section, framework: entry.id}}>Öva detta mönster →</Link>`, inside the `<details>` body (the `<details>` opens at line 46, `<summary>` is the toggle target at 55–109).
- `app/src/components/lesson/LexiconCard.tsx:135` — `Öva ord med denna rot →` (same structure).
- `app/src/components/lesson/ProtocolCard.tsx:199` — link present, but **mislabeled** (see copy fix below).

**The fix:** render a quiet, right-aligned, *subordinate* `öva →` affordance on the
summary row beside the eyebrow/toggle, so any pattern is one tap from a drill **without
expanding**. Keep the existing in-body CTA as the post-read close. Keep the collapse
intact — surface only the verb, never the prose. Style it as a hairline/mono display
link, not a button (stays M3-calm).

### This is NOT "~10 lines, behavior-free." Must-fix engineering (verified in source):

1. **`<summary>` is the native toggle target.** Nesting an interactive TanStack `<Link>`
   inside `<summary>` (TrapCard.tsx:55–109) means a tap on the link *both navigates AND
   toggles the accordion*. The `öva →` anchor MUST `stopPropagation()` + `preventDefault()`
   on the toggle so it navigates **without** opening the details, and must remain
   independently keyboard-focusable. Re-test: headline-tap still expands; `öva`-tap does
   not; focus order summary-vs-link is sane; Enter/Space behave.

2. **Spurious-bookmark coupling.** `LessonReader.tsx:121–143` installs a **capture-phase
   `toggle` listener** that PUTs an "I read this lesson" bookmark on *every* details open.
   If the `öva →` tap accidentally toggles the details open (exactly the bug in #1), every
   targeted-drill tap also writes a spurious `lesson_reads` bookmark — corrupting the very
   read-state signal a future adaptive layer (§6 Phase 3) depends on. The fix in #1 *is*
   the fix here; this is why #1 is non-negotiable, not cosmetic.

3. **Subordinate prominence (pedagogy guard).** Surfacing `öva →` on a *collapsed, unread*
   pattern lets the user drill a trap whose countermeasure they have never read — which
   inverts the page's own "Läs först." thesis (`lektion.tsx:183`). The brief's whole frame
   is read→practice interleave. Therefore the summary-row `öva →` must be visually
   **subordinate** to the expand/read affordance (a quiet tertiary, never a peer of the
   headline). The full version of this guard is Phase 3 read-state gating; the cheap
   version is strict visual hierarchy now.

4. **Copy + dead-control fixes to bundle:**
   - `ProtocolCard.tsx:212` says `Öva denna sektion →` but deep-links `framework: entry.id`
     — that is a **pattern drill, not a section drill** (confirmed: `pickFrameworkQuestions`
     plays only that entry's `example_questions`). Rename to `Öva detta mönster →` to match
     TrapCard. **Audit:** there is currently *no* whole-section-drill entry point anywhere
     on the lektion page, so no other copy may imply section scope.
   - Gate the picker's `Repetera N missar` line on `due > 0` so no dead control ever shows.

5. **Verify visually at phone + desktop before claiming done** (project verify-visual rule).
   Specifically check: the verb repeated down a 41-row ORD list does not read as noise;
   the tap target does not double-fire the accordion on touch.

### Honest scope note
Ship this on the **existing EDITION `<details>` cards** — that is the real shipped chrome.
Do **not** describe it as an "M3 `.m3-row` rail-anchor": that chassis is unbuilt
(`devbake/l12/M3.tsx` is a fixture; the section apparatus is task #156 / M4). The cheap
win must not quietly drag in the M4 rebuild.

### Honest overload note
This fixes **discoverability**, but it does **not reduce overload on the lektion surface** —
it relocates it. The reader goes from "25 collapsed titles, practice hidden" to "25–41
always-visible drill triggers." That is *more* simultaneous micro-decisions on the one
surface that already had the most. This is an acceptable trade because lektion is a
**deliberate** power-path the user reaches after opting out of the prescription, and the
"one obvious start" guarantee still holds on Home where it matters. But do not claim the
change reduces overload there — it trades *hidden-but-calm* for *visible-but-busier*, on
purpose. Strict subordinate styling (#3) is what keeps that trade calm.

---

## 5. Open questions — only the owner can decide

1. **Unread-drill stance.** Do we *allow* drilling a pattern the user has never read
   (express lane, trusts the user), or *gate* the summary-row `öva →` prominence on
   read-state so the page's "Läs först." thesis is enforced? The cheap-now answer is
   "allow, but style subordinate"; the principled answer is the Phase-3 read-state gate.
   Which is the product's stance — accelerator or guardrail?

2. **Per-row verb density on long catalogs.** ORD has 41 roots, XYZ 55 traps. Is a quiet
   `öva →` on *every* collapsed row acceptable, or should the express lane appear only on
   (a) the weakest N patterns, (b) already-read patterns, or (c) on hover/focus only? This
   is the difference between "calm" and "wall of verbs."

3. **When does Lektion+Övning merge into one "Öva" hub?** The destination design collapses
   the read-vs-drill dichotomy at the nav level (5 tabs → 3 doors: Hem · Öva · Framsteg).
   That is a real refactor that re-homes Feedback + Diagnostik and churns e2e/muscle memory.
   The natural landing spot is the pending M3H/M4 rebuild (#155/#156). Confirm we sequence
   it *after* the cheap seam proves out — or commit to doing it inside M4.

4. **Adaptive read-fade timing.** Per-pattern lifecycle chips (untaught→learning→
   practicing→mastered) would fade the read step on mastered patterns to dodge
   expertise-reversal, and self-prune the catalog as mastery grows. This depends on the
   unbuilt `framework_progress` table (PRD Phase 0). Ship on noisy error-count
   approximation now (risk: dimming the very patterns the user should practice), or defer
   until real state exists? Recommended: **defer.**

---

## 6. Phased plan

**Phase 0 — Immediate win (this PR).** Lift the `öva →` verb onto the summary row in
TrapCard / LexiconCard / ProtocolCard with the must-fix event handling (§4.1), fix the
ProtocolCard copy and `due>0` gating (§4.4), and verify visually phone+desktop (§4.5).
Ship on the existing EDITION `<details>` cards. No new component, route, or data model.

**Phase 1 — Source lines on the picker.** Add the two subordinate footer lines under the
section list (`Blandad övning · alla sektioner →`; `Repetera dina N missar →` gated on
`due>0`). This gives mixed + repetition a visible, *subordinate* home so they stop
depending on ⌘K — without becoming tiles or nav peers.

**Phase 2 — Fuller IA: the unified "Öva" hub** (lands inside M3H/M4, #155/#156). Merge
Lektion + Övning into one section-indexed "Öva" tab (5 → 3 doors). Per-section page stacks
a *new* "Öva hela X → ~10 frågor" header CTA (broad scope — note this is new surface, the
lektion page has no section-drill entry today) above the drill-on-every-row pattern
catalog, now rebuilt on the real M3 `.m3-row` rail|spine|content grammar. Re-home Feedback
+ Diagnostik out of primary nav. This kills the read-vs-drill dichotomy at the nav level,
not just per-pattern.

**Phase 3 — Adaptive read-fade (deferred, gated on `framework_progress`).** Per-pattern
lifecycle chips drive the affordance: unread → `Läs →` primary; read-but-missing → `Öva`
primary; mastered → dimmed `repetera` (no nagging, self-pruning list). Correct learning
science (dodges expertise-reversal) but depends on real per-pattern state; do NOT ship on
noisy error-count signal — a wrong "mastered" guess hides exactly what the user should
practice.

---

## 7. Verified-fact appendix (so the implementer doesn't re-derive)

- Drill deep-link plumbing is solid: `drill.tsx` `validateSearch` handles `?section&framework`;
  `pickFrameworkQuestions` resolves `example_questions` against the bank with a
  `parsing_status==='complete'` filter; the hash→details-open effect already round-trips
  from a drill miss (`LessonReader.tsx:92–104`).
- All 201 framework entries resolve to drillable questions (XYZ/KVA/NOG verified this session).
- The three lesson cards are EDITION-era inline-styled `<details>`, NOT M3 `.m3-row`.
  `devbake/l12/M3.tsx` is a fixture, not shipped chrome.
- `LessonReader.tsx:121–143` writes a `lesson_reads` bookmark on *any* details open
  (capture-phase, debounced 400ms) — couples to the summary-row tap; handle with care.
- `ProtocolCard.tsx:212` copy ("Öva denna sektion →") mislabels a pattern-scope drill.
- PRD anchors: NF6.1.1 (one primary CTA on Home) and Screen 4 ("single big Fortsätt
  button, no choice, no section tiles") both verified; Screen 8 forbids streak/shame language.
