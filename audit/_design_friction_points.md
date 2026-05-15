# Design friction inventory — May 2026 dogfood pass

Captured 2026-05-13/14, before the Wave-1 corpus explanation regen
kicks off. The regen runs for hours; this file makes sure the visual
+ UX feedback collected in the same session doesn't fall into the void
while the prompts run.

Format: each entry is a friction the dogfood user (or a design
specialist memo) named, with a one-line description of where it
lives, a "fix" sketch, and a status pin so we know what's already
shipping vs. still pending vs. deliberately deferred.

Status codes
- **`SHIPPED`** — already on `main` (or a merged PR), but documented
  here so future Claudes can see the reasoning.
- **`IN PR`** — branch open + PR filed, awaiting review/merge.
- **`PENDING`** — agreed friction, no fix in flight yet.
- **`DEFERRED`** — known but parked until after a bigger blocker.
- **`OPEN QUESTION`** — design unresolved; needs a decision before
  any code can move.

---

## 1. The haiku machine — pedagogy floor crushes prompt column

**Where:** `app/src/components/drill-variants/StyleA.tsx`,
`StyleB.tsx`, `StyleC.tsx` (`gridTemplateColumns`).

**What:** Pre-fix, the desktop grid was
`minmax(0, 0.65fr) minmax(640px, 0.95fr)`. The `minmax(640px, …)`
floor on the pedagogy column meant that at 1080–1279px viewports
the prompt column was getting crushed to ~75px wide — about 6–8
characters per line on MEK ("**Det är /**"). Chrome-devtools
confirmed: at 1265px the question column measured 68px.

**Fix:** Flip to `minmax(0, 1fr) minmax(0, 0.85fr)` so both columns
participate in the squeeze instead of pedagogy hoarding pixels. Also
cap the question prose with `maxWidth: '60ch'` (70ch for Cockpit
mono) — the same column on a 1600px monitor was rendering 130-char
lines, way past the ergonomic reading measure.

**Status:** `IN PR` (#18, branch `prompt-haiku-fix`).

**Lesson for future grids:** *Never put a hard pixel floor on the
secondary column.* If pedagogy gets a `minmax(640px, …)`, the prompt
column is left fighting for the remaining viewport — and at
1080–1279 (the most common laptop range below studio width) the
remainder is < 100px. Use proportional `fr` with `minmax(0, …)` so
both sides shrink together; let `maxWidth: 'Xch'` enforce the
upper bound for ergonomics.

---

## 2. Pre-Variant-C content — clunky/dated Swedish phrasings

**Where:** `data/explanations/*.json` (all 26 files except
`host-2013.json` which has the Variant-C pilot content).

**What:** The dogfood user spotted on MEK-021:

> *"Stäm av betydelsenyans: infusion (vätska-extrakt) ≠
> inkarnation (kroppsligande) ≠ induktion (slutledning) ≠ inversion
> (omkastning) — fyra '-sion'-lånord, helt olika fält."*

`stäm av` is correct Swedish ("cross-check") but reads dated and
office-memo-ish for a 17-year-old studying for HP. The Variant-C
prompt was tuned to drop this register (warmer, more direct, less
"do this then this then this"), but only `host-2013.json` was
regenerated under it. The other 26 exam files still contain
v1-prompt prose.

**Fix:** Wave-1 corpus regen with the locked Variant-C prompt at
`pipeline/explanations/prompts.py` — 27-subagent fan-out across
XYZ/KVA/NOG/DTK in non-`host-2013` exams. This is the immediately
upcoming work.

**Status:** `PENDING` — starting now, blocks ship of any
content-facing improvements until done.

**Sister phrasings worth grepping for once the regen finishes** (to
spot residue from any subagent that drifted):
- `Stäm av` (formal "cross-check")
- `Givet att` ("Given that…" lecturer voice)
- `Det följer att` ("It follows that…" textbook voice)
- `Således` (academic "thus")
- `Närmare bestämt` ("More specifically…" — over-formal in
  coaching context)

---

## 3. Pre-grade pedagogy column = dead air

**Where:** Right column of StyleA/B/C while the user is still
reading the question and hasn't picked an option yet.

**What:** Specialist memo (Wave 2, Editorial direction) flagged it:
*"50% of pixels on a desktop drill screen are blank until the user
clicks an option."* The dogfood user has not complained about this
explicitly yet, but it's the largest unused real estate on the page,
and it reads as broken/buggy on first encounter.

**Fix sketches (deferred to post-regen UX wave):**
- (a) Coaching note in right column pre-grade — e.g. *"Läs den
  feta delen först. Vad är det egentligen som efterfrågas?"*
  Generic 1-2 lines per section family (KVA gets one note, XYZ
  another, NOG another).
- (b) Compact section primer — what the section tests, scoring
  rules, common traps. Same content as Layer 1 frameworks, just
  surfaced in the right column.
- (c) Apparatus criticus — the right column shows the question's
  "register" (year, exam half, section, difficulty if available)
  + a small running stat ("13 av 80 klara").
- (d) Leave it empty but treat it as deliberate negative space —
  add a single editorial flourish (mono eyebrow + thin hairline
  rule + qid) so it reads as intentional rather than unfinished.

**Status:** `OPEN QUESTION` — needs dogfood user pick among (a)–(d)
before coding.

---

## 4. Pedagogy reveal dumps all 10+ steps at once

**Where:** `app/src/components/drill/PedagogyPanel.tsx` `StepList`
component, after grading.

**What:** Variant-C explanations now run 7–14 steps with
zero-knowledge framing. When the panel reveals post-grade, the user
gets the whole accordion expanded as a single tall column. On a 13"
laptop this is ~3-4 viewport heights of scroll. Specialist memo
(Wave 1, Progressive direction) recommended a *tiered reveal*:
show the first 3 steps + a "fortsätt med nästa steg" affordance,
expand on click.

**Fix:** Wrap `StepList` in a progressive container that:
1. Renders the first 3 steps eagerly.
2. Shows the remaining N–3 steps behind a single mono button
   ("Visa resterande N steg ↓").
3. On click, reveals the rest with a 200ms staggered fade.
4. Phone fallback: accordion-per-step (already shipped in PR
   `a6v-phone-steps-rendering`).

**Status:** `DEFERRED` — wait until post-regen so we tune the reveal
threshold against the actual step counts produced by Variant C at
scale, not the 5 pilot questions.

---

## 5. ORD specimen — single headword wastes wide canvas

**Where:** ORD questions in StyleA/B/C — `host-2013-verb1-ORD-002`
("kapital" → 4 options). The headword is one word; the layout
treats it like a paragraph.

**What:** Specialist memo (Wave 1, Editorial) called for an *ORD
specimen layout*: headword centered at hero scale (8rem display
serif), four options arranged as a 2×2 grid with hairline rules,
margin notes (etymology / register / part-of-speech) in the right
column. Currently the prompt block is just `<p>kapital</p>` in 18px
serif, which looks like a typo on a 1440px viewport.

**Fix:** Add an ORD-specific specimen layout that detects
`section === 'ORD'` and renders the headword at display-scale with
2×2 options. Hook into the existing variant dispatch so it works
across A/B/C.

**Status:** `PENDING` — needs ~1 day of work, lands after regen.

---

## 6. NOG apparatus — Statement 1 / Statement 2 not structurally distinct

**Where:** NOG questions in StyleA/B/C — `host-2013-kvant1-NOG-026`.

**What:** NOG is data-sufficiency. Every question has the form:
*"Question? (1) Statement 1. (2) Statement 2."* The current layout
treats the two statements as inline prose, but pedagogically the
student needs to evaluate each statement in isolation, then jointly.
The variants don't surface this structure.

**Fix sketch:** Render `(1)` and `(2)` as two mini-panels with mono
labels (`PÅSTÅENDE I`, `PÅSTÅENDE II`), hairline-separated. Mirror
the explanation panel's per-statement reasoning structure when it
unfolds (Variant C already breaks NOG into "Test påstående 1 i
isolation" / "Test påstående 2 i isolation" / "Test påståendena
tillsammans" — leverage that on the question side too).

**Status:** `PENDING` — design-out-loud needed first; not urgent
but cleanly bounded.

---

## 7. LÄS book-width — works, but specialist wanted more apparatus

**Where:** StyleA/B/C LÄS rendering of `question.context`.

**What:** SHIPPED in `be16def` — long passages now render in a
single book-width column. Each variant has its own treatment
(serif marginalia hairline, panel-bordered tile, terminal frame).
But specialist memo (Wave 2, Editorial) wanted more:
- Folio numbers in the margin per paragraph (`¶ 1`, `¶ 2`…).
- Drop cap on the first paragraph.
- Smart-quote French spacing for the passage (current build
  uses plain straight quotes).
- An apparatus block in the right column showing the source
  (year/exam) + a one-line gloss of what the passage is about.

**Status:** `SHIPPED` (basic), `DEFERRED` (apparatus polish).
Plain-language summary: the long-passage layout works; the
specialist polish is a "phase 2 editorial pass" item.

---

## 8. Parser figure label clipping — `_largest_y_cluster` bug

**Where:** `parser/parse_figures.py` `_largest_y_cluster`.

**What:** SHIPPED in PR #17. Diagonal strokes (e.g. the AC line on
the XYZ-006 triangle) have midpoints that sit at the geometric
center of the figure. The old code clustered by midpoint-Y with a
60pt gap threshold, so the diagonal's midpoint was 60.5pt away from
the top labels → split into a separate cluster → discarded as
"not the largest cluster" → A/B labels dropped. Fix uses bbox-edge
clustering (sort by `y0`, gap measured against running
`max(y1)`).

**Status:** `IN PR` (#17, branch
`parser-figure-bbox-padding`). Recovers 7 figures' labels + 1
previously-unextracted figure (`var-2026-kvant1-KVA-014`).

**For posterity:** any future cluster code should use bbox-edge
gaps, never midpoints. Midpoints lie about whether two pieces of
geometry are actually adjacent.

---

## 9. Mobile picker reachability — Edition Strip not phone-validated

**Where:** `app/src/components/EditionStrip.tsx`, embedded in
RunningHeadBand on Page.tsx and in each variant's header.

**What:** Edition Strip shipped on desktop in `e598e54`. On the
390×844 phone artboard the three picker chips (mode / palette /
edition / egen) overflow the 24px horizontal padding and wrap to a
second line, which crashes into the folio. Specialist memo (Wave 1,
Phone direction) flagged: *"the picker is a desktop tool; on phone
it should collapse to a single edition glyph that opens a sheet."*

**Fix sketch:** At viewport ≤ 600px, render only the active edition
glyph + a tap target; tap opens a bottom sheet with the full
picker. Reuse Clerk's modal pattern (centered card, scrim) or
shadcn's `Sheet` if shipped.

**Status:** `PENDING` — won't block desktop dogfooding; mobile is a
phase-B audience anyway. Tag it before any new user joins.

---

## 10. Cockpit (StyleC) identity question — keep / de-cockpit / retire

**Where:** StyleC overall. The cockpit aesthetic (monospace
prompts, terminal-frame passages, hard-edged status bars) is the
most divergent of the three variants.

**What:** Specialist memos split on this. Two said *"retire it —
A and B both serve the actual user; C is design playground."*
Two said *"keep it as the muscle-memory training mode for power
users."* The dogfood user has not commented either way since the
viewport fix in `be16def`.

**Fix sketches:**
- (a) Keep C as-is; just make sure haiku-machine fix + content
  rendering works at parity with A and B.
- (b) De-cockpit: drop the mono prompts (use the same serif as
  A) but keep the terminal-frame eyebrows and hairline
  separators. "Cockpit" becomes a typographic accent, not a
  whole aesthetic.
- (c) Retire and absorb best features into A (mono eyebrows,
  hairline density) and B (panel-bordered tiles).

**Status:** `OPEN QUESTION` — needs dogfood user pick after the
regen-tuned content lets the variants be fairly compared.

---

## 11. The 14-PR specialist menu (synthesized, deferred)

**Where:** Specialist memos, both waves.

**What:** Two waves of 6 specialists each (12 memos total)
produced a coherent "critical edition" direction. The full menu of
14 follow-up PRs is preserved here so we can pull individual items
without re-running specialists:

| #  | PR title                                          | Leverage | Effort |
|----|---------------------------------------------------|----------|--------|
| 1  | Haiku machine fix (column floor + measure cap)    | high     | S      | *(in PR #18)*
| 2  | 4-layout system (collapse A/B/C from 3 styles to A=editorial, B=workbook, C=cockpit + new D=reader-collapse for 1080-1279px) | high | M |
| 3  | Picker recut (smaller glyph row + grouped chips)  | high     | S      |
| 4  | Page-turn transition between questions            | medium   | M      |
| 5  | Colophon DONE state (end-of-session, replaces "klart") | medium | S |
| 6  | Chrome trim (drop dual-folio, dual-status duplication) | high | S    |
| 7  | NOG apparatus (#6 above)                          | medium   | M      |
| 8  | ORD specimen (#5 above)                           | medium   | M      |
| 9  | Figure bleed-flush (figures escape the column gutter on studio width) | low | M |
| 10 | Progressive step reveal (#4 above)                | medium   | S      |
| 11 | LÄS apparatus polish (#7 above)                   | low      | M      |
| 12 | Mobile picker sheet (#9 above)                    | low      | M      |
| 13 | Pre-grade pedagogy slot (#3 above)                | high     | S      |
| 14 | Cockpit decision (#10 above)                      | n/a      | n/a    |

**Status:** Items #1 in PR, #7/#8/#10/#9 referenced individually
above, the rest are reference for future planning sessions.

**Plain-language summary for the dogfood user:** these are 14
discrete chunks of design polish. Most are 1-2 days each. We pick
the next 3-4 after the regen ships and run them in sequence
based on actual content quality (some items, like #4 progressive
reveal, only make sense once the new content's actual step counts
are known).

---

## 12. "Critical edition" framing — the design metaphor we landed on

**Where:** Across StyleA/B/C aesthetic decisions made this session.

**What:** Specialist synthesis converged on framing the drill page
as a *critical edition* of a classical text. Concretely:

- **Recto/verso layout** — left page is the question (text being
  read), right page is the apparatus (editorial notes, glosses,
  cross-references).
- **Editor in the margins** — the coach voice never breaks into
  the question column; it lives in the right column with its own
  typographic register.
- **Apparatus criticus** — small, set in mono, hairline-separated.
  Lists section/year/qid as if cataloging an artifact.
- **Folio numbers + edition selector** — the running head treats
  the question like a leaf in a book; the Edition Strip is the
  "which printing am I reading" picker.

**Status:** `SHIPPED` (concept embedded across A/B/C). The
metaphor is what holds the three variants together — each is the
same edition concept in a different typographic dialect:
- **A = scholarly press** (serif prose, generous margins, hairline
  rules, editor's-note marginalia)
- **B = museum gallery label** (panel-bordered tiles, mono eyebrows,
  precise spacing, didactic register)
- **C = power-user reading room / terminal** (mono everywhere,
  hard-edged frames, dense status apparatus)

**Lesson:** when a future design specialist memo arrives, ask
which dialect of the critical edition it speaks. If it doesn't
speak any of them, either the memo is off-direction or we're
about to add a fourth dialect — both need an explicit call.

---

## What ships next, in order

1. **Wave-1 corpus regen** (XYZ/KVA/NOG/DTK across the 26
   non-`host-2013` exams) — kicks off after this doc lands.
   Tasks #79-#81.
2. PR #18 (haiku fix) — merge once regen runs.
3. PR #17 (parser figure fix) — merge once regen runs.
4. **Lint pass on regen output** — grep for the sister phrasings
   in §2 of this doc; spot-check 5% sample per section.
5. **Next UX block** — pick 3 from the 14-PR menu (§11) based on
   what the regen-content actually highlights as next bottleneck.
   Most likely candidates given current friction: #2 (pre-grade
   pedagogy slot), #6 (chrome trim), #10 (progressive step reveal).
