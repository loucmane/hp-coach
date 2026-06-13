# HP-Coach redesign — Round 5: expert panel tier list

*2026-06-11 · 18 candidates · 5 blind judges + panel chair · evidence: `.scratch/redesign/*.png` + scrubbed motion dossiers*

## Method

- **Candidates anonymized.** Judges saw only ids (C0, D, E, F, L1–L14), screenshots
  (home / drill / graded where captured), and a motion dossier scrubbed of thesis and
  service names. They were NOT told which candidate is the live incumbent, nor which
  service seeded which round-4 lab. Judges were forbidden from reading variant source —
  statics + dossier only, the same evidence the owner judges from.
- **Five lenses, one judge each** (identical prompts converge — the round-3 lesson):
  brand & identity · daily-use ergonomics (ADHD-PI) · typography & craft ·
  interaction & motion · owner's advocate (judging strictly against the recorded taste
  signal: round 1 rejected as ornament-heavy, "modern, sleek and clean", round 2 liked).
- **Panel chair** (6th agent, told C0 = incumbent) synthesized agreement, dissent, the
  tier list, and synthesis recipes. Instructed to surface dissent, not average it away.

## Candidate key (de-anonymized — judges never saw this)

| Id | Name / seed | Round | Where to view |
|----|-------------|-------|---------------|
| C0 | **Current live EDITION site** (incumbent) | — | `/` and `/drill?qid=var-2026-verb1-ORD-003` |
| D | Lumen (token-bound) | 2 | `/redesign-bakeoff?dev=1&v=D` |
| E | Mist (token-bound) | 2 | `/redesign-bakeoff?dev=1&v=E` |
| F | Axis (token-bound) | 2 | `/redesign-bakeoff?dev=1&v=F` |
| L1 | Sättarbordet | 3 (blind) | `/redesign-lab?dev=1&v=1` |
| L2 | Observatoriedäck | 3 (blind) | `/redesign-lab?dev=1&v=2` |
| L3 | Läsesalen | 3 (blind) | `/redesign-lab?dev=1&v=3` |
| L4 | Bläckprotokollet | 3 (blind) | `/redesign-lab?dev=1&v=4` |
| L5 | Läsesalen II | 3 (blind) | `/redesign-lab?dev=1&v=5` |
| L6 | Sjökortet | 3 (blind) | `/redesign-lab?dev=1&v=6` |
| L7 | Träningsdagboken · Strava | 4 (seeded) | `/redesign-lab?dev=1&v=7` |
| L8 | Stilla målet · Apple Fitness+ | 4 (seeded) | `/redesign-lab?dev=1&v=8` |
| L9 | Mätinstrumentet · Whoop/Oura | 4 (seeded) | `/redesign-lab?dev=1&v=9` |
| L10 | Andrum · Headspace | 4 (seeded) | `/redesign-lab?dev=1&v=10` |
| L11 | Instrumentet · Linear | 4 (seeded) | `/redesign-lab?dev=1&v=11` |
| L12 | Dagens spalt · NYT Games | 4 (seeded) | `/redesign-lab?dev=1&v=12` |
| L13 | Vitt papper · Things 3 | 4 (seeded) | `/redesign-lab?dev=1&v=13` |
| L14 | Reviderade siffror · Stripe | 4 (seeded) | `/redesign-lab?dev=1&v=14` |

---

# Round 5 Chair Report — HP-Coach Design Jury

*18 candidates · 5 blind lenses (brand, owner's advocate, ADHD-PI ergonomics, typography, interaction/motion) · Chair informed: C0 = current live incumbent.*

---

## 1. Agreement analysis

Four convergences appear across independent lenses, which is what makes them trustworthy — the judges scored blind, with different rubrics, and arrived at the same places:

**D and L13 are the consensus daily-drivers.** D scores 8–9 with the owner's advocate, the ergonomics judge, and the motion judge; L13 scores 8.5–9 with the same three. The ergonomics judge calls D "the only candidate where every ADHD-critical test passes simultaneously"; the motion judge calls L13 "the only candidate whose grading choreography was designed around *both* outcomes of the core loop." Three judges with no shared rubric independently identified the same two designs as fit for a tool used "tens of times daily" — that is convergence on *fitness for use*, the dimension this product lives or dies on.

**L12 owns the typeset verdict.** The brand judge (8.5, "grading as ink, not confetti"), the typography judge (9, "the best pure typography in the field"), and the motion judge (top-3, "the strongest argument that the payoff can be typographic rather than kinetic") all single out the italic cobalt "*Rätt.*" and the Swedish decimal comma in "1,4". Three lenses agree this is a genuinely authored idea, even while disagreeing on whether the design around it is shippable.

**Auto-advance and ambient motion are disqualifying.** The ergonomics and motion judges independently penalized every candidate that takes pacing away from the user (L8's 900ms auto-reveal, L10's 1300ms auto-advance, L14's 750ms, L9's perpetual breathing dial). The motion judge's framing — "the post-grade breath is the user's beat" — and the ergonomics judge's "removes the user's pacing control — risky when the post-grade moment is where learning happens" are the same finding from two directions. Treat this as a hard constraint for the build.

**L7 and L9 fail everywhere.** L7's red-for-RÄTT was flagged as a semantic miscue by ergonomics ("'RÄTT' in a red slab reads as failure at a glance") and as "a state-clarity failure verified directly in the static" by motion; L9's breathing dial drew near-identical critiques from three judges. No lens defends either; both are safely out.

---

## 2. Dissent analysis

### (a) D — brand 4/10 ("faceless") vs owner's advocate 9/10

This is the round's central tension and it is *not* a contradiction — both judges are correct about different questions. The brand judge: "D would never be *wrong*; it would also never be *recognized*… indistinguishable from default shadcn output." The owner's advocate: "the most direct descendant of the round the owner LIKED… token-bound, so zero re-theme gamble… nothing competes with the content, which is what a daily-use training tool needs at minute 400 of usage."

What the tension means for the decision: **D is the right chassis and the wrong soul.** Shipping D as-is buys safety and forfeits the "top-tier serious coach" register's *recognizability* — the brand judge is warning that pure restraint decays into anonymity over months of daily use, and the ergonomics judge echoes the same risk about L13 ("near-zero brand presence could read as sterile rather than serene"). The resolution is not to average 4 and 9 into a 6.5; it is to read the panel as saying *D needs an identity transplant, not a redesign* — which is exactly what four of the five synthesis wishes propose (D's skeleton plus someone else's grading moment, verdict typography, or copy voice). The dissent defines the build task.

### (b) The paper/editorial family (L1, L3, L4, L12 — and C0)

Brand and typography score this family high: L4 8.5 brand ("the most committed identity in the field"), L3 8.5 type ("the richest apparatus that stays functional"), L12 tops both. The owner's advocate scores the same designs 2, 3, 3, and 5 — because the owner's recorded verdict ("modern, sleek and clean," rejecting an ornament-heavy round) lands directly on stamps, ruled paper, and masthead ceremony. On L3: "the stamp is the single most specifically rejected gesture in the record, and here it is the design's signature moment." On L4: "the round-one direction the owner explicitly killed, intensified."

Why this dissent is informative rather than noise: it cleanly separates **craft quality from craft register**. The panel is not saying L3/L4/L12 are badly made — they are among the best-made artifacts in the field — it is saying the owner has already vetoed the *costume* they wear. But the owner's advocate also flags a genuine open question: "whether a serif headword *alone* (F, C0) counts as rejected 'editorial' or acceptable typographic identity is genuinely unresolved — the rejection named ornament systems, not any single serif glyph." That distinction is the salvage path: L12's verdict-as-typeset-word and book-page measure are *typesetting*, not ornament — no stamp image, no ruled paper, no masthead required — and the typography judge's synthesis explicitly shows they rebind to the product's existing tokens ("which F proves can carry this"). The family loses as designs; its typesetting machinery survives as parts.

**C0 sits inside this dissent**: brand 7 and type 7.5 (real editorial voice) vs ergonomics 5 — bottom-3, "fails the resume test outright." The incumbent is a milder case of the same disease: editorial residue praised by the form lenses, punished by the use lenses.

### Smaller live disagreements worth preserving

- **F's drawn-rule axis**: brand's #3 ("the definition of a voice rather than a paint job") vs the owner's advocate's hedge that it "faintly echoes the rejected 'exposed grid apparatus.'" Unresolved on the record; only the owner can rule.
- **L8**: ergonomics #2 (8.5, "the strongest motivation psychology in the field") vs type 5.5 ("reads as Whoop, not as a top-tier educational product"). Resolution: keep the *copy* ("Tre block, 16 minuter — sedan är dagen klar. Inget mer krävs."), discard the visual language. Three judges independently nominated exactly that split.
- **L13's quietness**: motion's #1 vs type's "the headword barely outranks a section label… for a vocabulary specimen product a real miss." L13's grading is a consensus organ; L13-as-whole-design is underexpressed.

---

## 3. Final tier list

**Placement logic.** This is a daily driver for one specific user with a recorded taste verdict, so the owner's advocate and ergonomics lenses set the *floor* of each tier — a candidate cannot rank above its fitness for the 80-rep daily loop and its compatibility with "modern, sleek and clean." Brand, typography, and motion then argue *upside within* that floor: they can lift a candidate a tier when they show authored, token-portable ideas, but cannot rescue a design the owner's record has already vetoed. Evidence gaps (E/F graded never captured; low-res L5/L6/L9) cap candidates rather than excuse them.

### S — ship-family
- **D** — Wins owner record, ergonomics, and motion tempo outright; its brand-4 "facelessness" is the one defect, and it's the defect every synthesis recipe exists to fix.
- **L13** — The consensus grading moment (chip-becomes-drawn-check, no-shake rust X, 1s hold) and the checkbox plan; near-invisible as a brand, which is why it ships as organs inside a chassis, not alone.

### A — challengers with a real claim
- **F** — Only candidate ≥7 on all five lenses; proven dark-mode identity and the best home composition per the type judge — held back by the ungraded-state evidence gap and the unresolved "axis = apparatus?" question.
- **L14** — "Certification, not celebration" lands across owner (8), ergonomics (8), type (7.5); slightly clinical, and its auto-advance must go.
- **L12** — Highest form-lens scores in the field (brand 8.5, type 9) but owner 5: its DNA is the rejected family, so it places as the premier *parts donor*, not a ship candidate.

### B — flawed but contributing
- **L8** — Ergonomics #2 on contract copy and lowest-noise canvas; borrowed Whoop identity and auto-reveal keep it out of A. Donates its sentence.
- **L11** — Right motion philosophy (140ms, no bounce) and the keycap affordance; "a dev-tool's soul… cold where a daily coach needs some warmth."
- **C0** — The incumbent: real voice (brand 7, type 7.5), failing ergonomics (5, bottom-3). See §4.
- **L3** — Type judge's #2 with the best barrier-lowering copy in the set ("Det här räcker idag."); owner 3 because the stamp is its signature. Copy and margin apparatus survive; the design doesn't.
- **L2** — Coherent nocturnal ledger and the only candidate with a visible NÄSTA FRÅGA button; four competing CTAs and vetoed editorial theater.

### C — authored but wrong for this owner
- **E** — Token-bound but "precisely the generic dashboard" (brand 3.5, type 18th); the missing graded capture leaves its most important state unproven.
- **L4** — Brand's most committed world (8.5) and the owner's advocate's hardest veto (2): the rejection verdict, intensified.
- **L1** — Beautiful broadsheet, "exhausting as a tool" — worst quick-glance home in the set.
- **L6** — Distinctive chart metaphor sunk by the lowest verified state contrast and derivative stamp motion.
- **L5** — "A diluted sibling" of L3/L4 with the worst verdict placement in the stamp family; weakest of its lineage on every lens.

### D — out
- **L7** — Red-for-RÄTT is a verified semantic failure; "most likely to *train avoidance* of the grading moment."
- **L10** — Right heart, wrong body: weakest verdict-to-evidence link, auto-advance, meditation-app register that "infantilizes the daily grind toward 2.0."
- **L9** — Perpetual breathing glow on the daily command screen; anonymous beneath the dial; no lens defends it.

---

## 4. Where the incumbent lands

**C0 is beaten. Mid-B, and the panel's verdicts explain exactly how.**

- **Beaten on ergonomics** — the lens that matters most — by D, L13, L8, F, and L14. The ergonomics judge put C0 in the bottom 3 of all 18: the resume is "small mono text with no button affordance, optically weaker than the decorative greeting above it," the score "degrades into dashes," and after grading "your eye has to hunt for whether you were right." For an ADHD-PI daily driver, those are the three moments that matter, and C0 fails all three.
- **Beaten on motion/grading** by D, L13, L12, L14: C0's grading is "state recolor without designed choreography — clarity but zero payoff" (motion, 6/10) for the moment repeated tens of times daily.
- **Beaten on its own home turf** — brand and typography — by F (8 / 8), which proves a token-bound design can have a stronger identity than the incumbent's free-form editorial one, *and* survive dark mode, which C0 never demonstrated. L12 and L3/L4 also out-score it on form, though they're vetoed on register.
- **Not beaten on voice.** What C0 does that every challenger should keep: the serif "God kväll." greeting moment, the mono small-caps eyebrow system, hairline rules over card chrome, and the terse coaching register of "Rätt. Vidare." The brand judge's diagnosis is the fair epitaph: "the identity whispers where a world-class product would speak; restraint shading into under-design." The owner's advocate adds that it "only half-survives 'modern, sleek'" — it is residue of the rejected direction, not a member of the liked one.

**Bottom line for the owner:** the incumbent is not a defensible baseline. It loses to the S-tier on use and to F on form. The decision is which replacement, not whether.

---

## 5. Synthesis recipes

Each recipe is assembled from elements the judges themselves nominated; all five judges' wishes overlap heavily, which is itself a signal.

### Recipe 1 — **"Kvittot"** (the receipt) — *lowest risk, owner's-record-pure*
- **Chassis:** D — home stat row (1.4 / 12 dagar / 16 min), one filled resume button, flat hairline plan, single-axis drill, structured Lösning document. Token-bound; ships as seen.
- **Plan:** L13's checkbox rows, with L8's contract sentence as the plan's closing line ("Tre block, 16 minuter — sedan är dagen klar. Inget mer krävs.").
- **Grading:** L13's chip-becomes-drawn-check + no-shake rust X on wrong + 1s hold before the pedagogy cascade, at D's 150–220ms tempo, keeping D's ring-the-correct-row on a miss.
- **Bonus:** F's dark drill variant for evening sessions.
- **Rationale:** This is literally the owner's advocate's wish with the motion judge's grading transplant — every element is something the record already endorses, and it directly patches D's only scored weakness (the unceremonious grading moment).

### Recipe 2 — **"Boksidan"** (the book page) — *highest upside, fixes D's facelessness*
- **Chassis:** F — hairline axis, left-rail mono margin labels, mono-numeral stat row, proven light/dark inversion.
- **Grading moment:** L12's typeset verdict — italic cobalt-token "*Rätt.*" — but **left-aligned at the picked row** per the motion judge ("not centered"), entering with L13's calm draw rather than L12's scale-and-blur stamp theater.
- **Type system:** L12's reading machinery rebound to the product tokens (Newsreader/Inter Tight/JetBrains Mono): bold serif solution lede between rules, serif step numerals, ~75-char book-page measure for steps and distractor analyses — and the localized "1,4" decimal comma.
- **Copy:** L3's "Det här räcker idag." / L8's contract line.
- **Rationale:** The brand and typography judges' wishes are nearly identical to this; it salvages everything the form lenses loved from the vetoed editorial family while containing zero ornament — no stamp image, no ruled paper, no masthead. Requires the owner to rule on the open serif/axis question first.

### Recipe 3 — **"Instrumentet"** — *the keyboard-first daily machine*
- **Chassis:** D's home + single-axis drill; F's standing "Tangenter a–e väljer" affordance line.
- **Inputs:** L11's visible keycaps on options (the desktop half of the ritual answers a–e) at L11's 140ms no-bounce tempo.
- **Grading:** L13's drawn check / rust X; verdict line in L12's typeset register; **no auto-advance anywhere** (L2/L13 prove fast can still be user-owned).
- **Plan:** L13 checkboxes + L8 contract copy.
- **Rationale:** This is the motion judge's wish verbatim plus the ergonomics judge's keycap addendum — the only combination that satisfies "instant state certainty, a renewable reward, designed kindness on failure, and pacing authority left with the student" while optimizing the actual daily input method.

*(Recipes 1 and 3 differ only by the L11 keycap layer; a sane build path is Recipe 1 → add keycaps → A/B the Recipe-2 verdict typography against the plain check.)*

---

## 6. Bias disclosure

- **Shared aesthetic priors.** All five judges are LLMs, and an earlier blind round demonstrated a shared warm-print/editorial prior. The high brand/typography scores for L1/L3/L4/L12 (and C0) should be partially discounted as that prior expressing itself; the owner's recorded rejection of exactly this register is the corrective, which is why the owner's-advocate lens was weighted in tiering.
- **Motion judged partly from prose.** Every claim about springs, draws, shakes, holds, and easing comes from written motion dossiers, not video. The motion judge capped scores accordingly, but L13's #1 in particular rests partly on described-not-seen choreography; prototype before committing.
- **Missing evidence.** E and F graded states were never captured — the single most important screen for this product — so E's score is genuinely indeterminate (±1 per the owner's advocate) and F's A-tier placement carries an asterisk. L5, L6, and L9 captures were low-res, limiting fine-grained verdicts on the candidates that scored lowest anyway.
- **Unresolved owner questions** the record cannot answer: dark themes were never ruled on; whether a lone serif headword counts as "editorial"; whether F's axis rules read as the rejected "grid apparatus."

**The tier list informs; the owner decides.**

---

# Appendix — full judge reviews (verbatim)

=== JUDGE 1 — BRAND & IDENTITY ===
## Scores

C0: 7/10 — Genuine editorial voice: serif "God kväll.", mono small-caps eyebrows (`TORSDAG · 11 JUNI · 136 DAGAR`), hairline rules, flush-left asymmetry. But the home canvas is mostly empty paper and grading is an unceremonious recolor — the identity whispers where a world-class product would speak; restraint shading into under-design.

D: 4/10 — Clean sans, teal "Fortsätt" button, hairline list rows. Nothing here couldn't be any competent SaaS dashboard; the graded view's green row wash + numbered solution list is pure default. A costume of "minimal," no face you'd recognize tomorrow.

E: 3.5/10 — Pill-shaped option capsules with soft drop shadows and rounded stat cards read as generic wellness/health app. The full-width floating pills on the drill screen are the most anonymous component in the entire field. No identity, just softness.

F: 8/10 — A real system: serif italic greeting, mono numerals (1.4 / 12 / 16) on a hairline axis, left-rail margin labels (PÅBÖRJAD, MÖNSTER, VÄLJ SYNONYM), flat teal resume slab. The dark variant (rdF-drill-dark) holds the identity perfectly with only the eyebrow flipping to gold — proof it's a voice, not a palette. Scholarly instrument; recognizable at a glance.

L1: 7.5/10 — "HP-Coach *sättarbordet*" in red italic plus a true 3-column broadsheet home is a committed print-shop identity; the drill's taktik slab above a serif headword is handsome. Loses ground because the dense home composition (at the size captured) trades the product's calm for newspaper busyness.

L2: 7.5/10 — Nocturnal observatory ledger: blue-black field, ivory serif headword, amber mono eyebrows, gold-ruled taktik panel. The graded view's amber "NÄSTA FRÅGA" against green RÄTT chip is coherent and adult. Distinctive, though dark-by-default narrows it to one mood.

L3: 8/10 — "HP-Coach *Läsesalen*" has soul: warm archival paper, vermilion accents, dashed streak ticks, the rotated double-border RÄTT stamp, and the headline "Det här räcker idag." — copy as brand. The reading-room metaphor matches a coaching register exactly: serious, warm, unhurried.

L4: 8.5/10 — The most committed identity in the field: ruled-paper lines running the full canvas, "God eftermiddag. Dagens pass: *16 minuter*." with red italic emphasis, vermilion 01/02/03 ordinals, "DAGENS ORDINATION", a dark resume slab, a § glyph on the taktik card, boxed A–E letters, stamped RÄTT. Every screen speaks the same protokoll-book language. Memorable and ownable.

L5: 6.5/10 — Same archival family as L3/L4 (oxblood/green inset rules, ledger rows, stamp) but executed with less conviction — the home reads cramped, the drill options are plain bordered boxes the L3 reading room does better. A diluted sibling.

L6: 7/10 — Dark ink-green chart field with visible plot grid, brass/gold type, dotted course line on home — the navigation-chart metaphor is genuinely distinctive and the serif-on-green drill is moody and coherent. Slightly undermined by busy home density and low text contrast in places.

L7: 6/10 — Condensed athletic numerals (8/5/3 MIN, red ×3 counts), ember "FORTSÄTT PASSET", and a full-red RÄTT slab with reversed type. Unmistakably itself — but it's a training-camp poster, and the loud red verdict banner celebrates rather than certifies. Register drifts toward the gamified energy the product forswears.

L8: 5.5/10 — True black, one green 240° arc, green pill RÄTT, rounded numerals: sleek, but it's Whoop/Apple-Fitness borrowed identity. The copy "i rad — håll lugnt tempo" is on-register; the visual language belongs to someone else's brand.

L9: 5/10 — Deep-night teal dial, glowing card edges, teal/amber accents. At every screen it resolves to "dark dashboard with cards" — the readiness-dial hero is the only proprietary gesture and it isn't enough. Anonymous after you close the tab.

L10: 5.5/10 — Warm cream with big soft background orbs, sunshine tactic card, "Ett steg i taget — resten kan vänta." The calm is real but the visual vocabulary (pastel circles, rounded everything) is meditation-app stock; sweet verging on toy, not a top-tier exam coach.

L11: 6/10 — Near-black mono precision with electric-blue accents, visible keycap chips, 140ms mechanical register. It *is* distinctive — an instrument-panel/terminal identity — and internally coherent, but it's a dev-tool's soul transplanted; cold where a daily coach needs some warmth.

L12: 8.5/10 — Examination-paper ceremony done with total conviction: HP-Coach masthead rule, centered serif "God eftermiddag.", the projected score set as "1,4 / 2,0 prognos" — the Swedish decimal comma is the single most brand-literate detail in all 18 — one cobalt accent, boxed resume notice, and the italic cobalt "Rätt." with "Snyggt — taktiken höll hela vägen." Grading as ink, not confetti. This would be recognized.

L13: 5/10 — White, near-invisible chrome, one quiet blue, checkbox-circle plan. Its identity lives almost entirely in the described grading choreography (self-drawing check); the static frames are indistinguishable from a stock iOS-style list. Calm, yes; a brand, no.

L14: 5.5/10 — Audited-document register: `HP-COACH / HEM` breadcrumb, mono 01/02/03 and "TOTALT 16 MIN" tags, thin verdict rule under RÄTT, "Genomgång" header. More spine than L13, but slate/indigo on white with bordered cards still sits one step from a generic admin panel.

## Top 3

1. **L12.** This is the only candidate whose identity comes from the product's own subject matter rather than an imported aesthetic: it looks like the högskoleprov itself, elevated — masthead, ivory paper, ink type, one cobalt accent, centered ceremony around "God eftermiddag." and a Didot-scale "1,4". The Swedish decimal comma in the score is the tell of a designer thinking in the product's language; no other candidate localized its numerals. The graded state is the brand's thesis in one move: an italic cobalt "*Rätt.*" with a quiet coaching line beneath — verdict as ink stamp, motivation without celebration. It is serious, calm, memorable, and impossible to mistake for a generic dashboard. Soul, not costume.

2. **L4.** The protokoll identity is the most thoroughly *built world* of the eighteen: ruled paper lines extend across the entire canvas on every screen, vermilion ordinals number the day's ordination, the paused session sits in a dark ink slab like a clipped-in note, the taktik carries a § glyph, options sit in boxed compositor's letters, and the verdict is a literal stamp. Headline typography does brand work too — "Dagens pass: *16 minuter*." sets the day's contract in red italic. Coherence across home → drill → graded is total. It loses to L12 only on register risk: the stamp/strikethrough/shake theatrics flirt with skeuomorphic noise where L12 stays composed.

3. **F.** Judged as identity-per-constraint, F is remarkable: bound to the existing sage tokens, it still produces a recognizable voice — the hairline axis grid with left-rail margin captions (PÅBÖRJAD, 16 MIN / 3 MOMENT, VÄLJ SYNONYM) gives every screen the same skeletal signature, serif is rationed to exactly two ceremonial moments (greeting, headword), and the mono numerals read as instrument calibration. Critically, rdF-drill-dark shows the identity surviving a full theme inversion with only a gold eyebrow shift — that's the definition of a voice rather than a paint job, and the strongest evidence of long-term brand durability in the field.

## Bottom 3

1. **E.** The floating pill-cards with soft shadows, rounded badge chips, and elevated stat card are the visual lingua franca of every 2023-era health app. Nothing on either screen is proprietary; if you covered the word "eftertrakta" this could be a meditation app, a banking app, or a habit tracker. For a product whose stated bar is "world-class educational product, never a generic dashboard," E is precisely the generic dashboard.

2. **D.** Competent, clean, and faceless. The teal button is the only pigment of personality, and the graded screen — pale green row wash, gray solution card, numbered list — is indistinguishable from default shadcn output. D would never be *wrong*; it would also never be *recognized*, and brand is the lens here.

3. **L9.** Dark mode with glowing teal cards and a dial is the stock "premium dark dashboard" of a thousand landing pages. The breathing readiness dial is the lone authored idea, and on the static evidence it doesn't carry the rest: drill and graded screens collapse into anonymous dark cards. Compare L2 or L6, which prove dark canvases can still have a proper noun attached.

## Synthesis wish

Take **L12's ceremonial register as the brand core** — masthead rule, ivory ink-and-cobalt restraint, the Swedish-localized "1,4" score numeral, and the italic "*Rätt.*" ink-verdict with its quiet coaching subline — and mount it on **F's structural skeleton**: the hairline axis grid with left-rail margin captions and the proven dark-theme inversion (L12 as drawn has no demonstrated dark life, which F supplies). From **L4**, borrow exactly one texture move — the dark ink slab for the paused-session resume — because the resume-of-interrupted-work is this product's most emotionally loaded daily moment for an ADHD-PI user and deserves the heaviest visual weight on the page, which L12's bordered notice underplays. Finish with **L3's copywriting voice** ("Det här räcker idag.") as a brand asset in its own right. The result: an examination-paper identity with an instrument's bones, one localized numeral ritual, and a humane sentence at the top of every day — distinct in a screenshot, durable across themes, and a soul the product already half-owns.
agentId: aa63ec920d986b2c4 (use SendMessage with to: 'aa63ec920d986b2c4' to continue this agent)
<usage>subagent_tokens: 122679
tool_uses: 53
duration_ms: 234178</usage>
=== JUDGE 2 — OWNERS ADVOCATE ===
I have read all 18 candidates' screenshots. Here is my judgment as the owner's advocate.

## Scores

C0: 6/10 — Quiet and hairline-restrained, but the serif display greeting, warm-paper field, and mono-eyebrow apparatus are the residue of the rejected editorial direction. It survives "calm" but only half-survives "modern, sleek."
D: 9/10 — The most direct descendant of the round the owner LIKED: light, all-sans, hairline lists, no card chrome, calm green row-sweep grading. Token-bound, so zero re-theme risk. Reads "serious coach," never dashboard.
E: 7/10 — Clean and calm, but pill-cards with soft shadows on everything drifts toward generic soft-SaaS dashboard — the exact "generic dashboard" the register forbids. Graded screen not captured, so the verdict moment is underdetermined.
F: 8/10 — Sleek, token-bound, serif confined to greeting/headword only; the left axis rail gives identity without ornament. Risk: the drawn rules/axis grid faintly echo the rejected "exposed grid apparatus," and the dark drill bonus is a real plus for evening study.
L1: 3/10 — A 3-col warm-paper broadsheet with an angled double-rule stamp is precisely the ornament-heavy editorial round the owner rejected with "modern, sleek and clean."
L2: 4/10 — Handsome dark-ivory-amber, but serif ceremony, overshoot stamps, and amber mono are editorial theater. The register the owner already vetoed, just dimmed.
L3: 3/10 — Archival paper, vermilion accents, stamp slammed onto the headword — stamps everywhere was the named rejected pattern.
L4: 2/10 — Ruled-paper lines across the whole canvas, rotated blur-clear stamp, "protokoll" italics, dark resume slab: the maximal version of everything the rejection verdict targeted.
L5: 3/10 — Oxblood/green ledger with framed stamp; same rejected archival family, and the dense small-type home is hostile to ADHD-PI quick-glance use.
L6: 5/10 — Dark ink-green with brass serif is moody and serious, but the brass-on-green instrument styling plus drawn course line is ornament by another name; legibility of the dim home suffers.
L7: 4/10 — Condensed athletic numerals, red "RÄTT" verdict slab slam + pulse ring — loud and sporty. Violates "calm" outright and brushes "gamified toy."
L8: 6/10 — True black with one green arc is genuinely sleek, and the graded screen is clean. But the arc-dial + spring pop/shake reads fitness-tracker; the slam of motion contradicts the calm register.
L9: 5/10 — Teal/amber dial with breathing glow on deep night: clean execution but gadget-cockpit register; "breathing glow" is the kind of decoration the owner's record doesn't ask for.
L10: 4/10 — Cream, soft orbs, sunshine accents, exhale pulse, auto-advance — a wellness/meditation app. Calm yes, but not "a top-tier serious coach"; it infantilizes the daily grind toward 2.0.
L11: 7/10 — Near-black mono with electric blue and 140ms mechanical fades is unambiguously modern, sleek, fast, serious. The all-mono keycap aesthetic is a developer-terminal register, though — distinctive but a step colder than anything the owner has affirmed.
L12: 5/10 — The most restrained of the editorial labs (ivory, one cobalt, beautiful type), but masthead ceremony, italic "Rätt." ink-stamp, and centered serif liturgy are still the rejected family's DNA, just better dressed.
L13: 9/10 — White, near-invisible chrome, one quiet blue, checkbox daily plan, calm rust X for misses, self-drawing check that dissolves. This is "modern, sleek and clean" stated as a design. The checkbox plan is also the best ADHD-PI affordance on any home canvas.
L14: 8/10 — White, slate/indigo, document-settle, audited mono figures (01/02/03, ×3 counts), thin rule under the verdict word. Serious and calm; slightly more "report" than "coach," and instant recolor grading is almost too flat a moment.

## Top 3

**1. D.** The owner's record is unusually clear here: an ornamented round was rejected with "modern, sleek and clean," and a restrained token-bound round was liked — D is the strongest member of that liked family. Its home is a clean stat row (1.4 / 12 dagar / 16 min), a hairline plan list with mono section tags, and a single teal Fortsätt button; its graded state is a quiet green row sweep plus a structured Lösning document. Nothing competes with the content, which is what a daily-use training tool needs at minute 400 of usage. Crucially it is already bound to the product's tokens, so what the owner sees is what ships — no re-theme gamble. It is serious without being cold, coach-like without dashboard widgets.

**2. L13.** If the owner's "sleek and clean" verdict is taken as a trajectory rather than a snapshot, L13 is its endpoint: near-invisible chrome, one quiet blue, a checkbox-based daily plan (a genuinely motivating, ADHD-friendly affordance — visible completion state with zero gamification), and grading that is a self-drawing check and a calm "RÄTT Precis så." It is the only candidate where the verdict moment is both felt and quiet. Risk against the record: it is free-color and so minimal that brand identity nearly vanishes — the owner has liked restraint, but has not been shown restraint this total, so this is partially underdetermined.

**3. L14.** Same white-and-slate family as L13 but with a touch more apparatus: audited figures (01/02/03 plan numbering, ×3 trap counts), mono breadcrumbs, thin rule under RÄTT. It reads like a serious training ledger — "top-tier study coach" almost literally. It edges out F only because F's serif headword and axis rules carry residual editorial risk against the rejection verdict; L14 carries none. Its weakness is affect: instant recolor grading plus report-like tone may feel slightly clinical for a motivating coach.

(Near-miss: F — the best of the token-bound trio for identity, and the only candidate with a real dark drill mode, which matters for an evening "God kväll" user; held back because its drawn-rule skeleton is the closest thing in the liked family to the rejected "exposed grid apparatus.")

## Bottom 3

**L4 (2/10).** Violates the rejection verdict on every named axis at once: ruled-paper grid apparatus across the whole canvas, a rotated ink stamp with blur-clear theatrics, strikethrough/shake grading, warm-material everything. This is the round-one direction the owner explicitly killed, intensified.

**L1 (3/10).** The warm-paper 3-column broadsheet with angled double-rule stamp is "editorial drop caps/stamps everywhere" reborn, and its dense multi-column home is the worst quick-glance surface in the set for a phone-first ADHD-PI user who needs "what do I do next" in one second.

**L3 (3/10).** Archival paper, vermilion/moss, and a stamp landing on the headword — the stamp is the single most specifically rejected gesture in the record, and here it is the design's signature moment.

## Synthesis wish

**D's token-bound chassis as the body, L13's two best organs transplanted in, and F's dark theme as the bonus.** Concretely: keep D's all-sans light composition, hairline lists, and structured graded document; replace D's plan rows with L13's checkbox daily plan (completion state is the cheapest honest motivation available — progress without points); replace D's row-sweep grading with L13's self-drawing check + one-line calm verdict ("RÄTT — Precis så."); and adopt F's ink-dark drill variant for evening sessions. Every element of this combination is something the record already endorses — token-bound, minimal, calm, serious — while the checkbox plan and quiet check add the "motivating" note the standing register demands without ever touching stamp, slab, arc, or orb.

**Where the record underdetermines:** (1) E's graded state was never captured, so its verdict-moment register is unjudgeable — its score could move ±1. (2) The owner has never ruled on dark themes (L8/L11/F-dark are clean *and* dark; "sleek and clean" was issued on light designs only). (3) Whether a serif headword *alone* (F, C0) counts as rejected "editorial" or acceptable typographic identity is genuinely unresolved — the rejection named ornament systems, not any single serif glyph.
agentId: acbce489910ece286 (use SendMessage with to: 'acbce489910ece286' to continue this agent)
<usage>subagent_tokens: 122168
tool_uses: 54
duration_ms: 207448</usage>
=== JUDGE 3 — DAILY-USE ERGONOMICS (ADHD-PI) ===
## Scores

C0: 5/10 — The resume affordance is a tiny mono text link ("FORTSÄTT HÄR →") buried in the right column, slower to find than the greeting itself; the score line renders as cryptic dashes ("— / 2.0 · verbal —"), failing the glance test. Graded view splits into two dense serif columns with the verdict ("Rätt. Vidare.") as small text at the top-right of the pedagogy column — no visual anchor tells you the outcome at a glance.

D: 9/10 — Home is a single descending scan path: greeting → three stats (1.4 / 12 dagar / 16 min) → resume card with the page's *only* filled button ("Fortsätt") → flat hairline plan rows. Nothing competes. Drill puts the tactic in a quiet indented block directly between headword and options on one axis; graded shows a green-washed chosen row plus a contained numbered-steps panel that invites reading without burying the verdict.

E: 7.5/10 — Resume card with a filled "Fortsätt här" button sits high and reads fast, and the huge 1.4/streak card is glanceable. But every section is an elevated floating card (visual chrome accumulates), drill options are big bouncy pills with 320–380ms float motion — soft feedback is slower than a daily 80-rep loop wants — and the missing graded capture leaves the most important state unproven.

F: 8/10 — The resume row is a solid teal band with a button, genuinely the fastest thing on the page, and marginal labels (PÅBÖRJAD, 16 MIN / 3 MOMENT, MÖNSTER) give pre-attentive structure. The drill keeps tactic and headword on one axis with the count ("ORD 3/10") parked in the margin; the dark variant (rdF-drill-dark) holds the identical composition, proving an evening-mode daily ritual. Docked points: the left label column adds a second scan track, and no graded state was captured.

L1: 4.5/10 — Broadsheet three-column home crams the resume into a small dark box mid-column among dense newsprint; for an ADHD start moment it demands reading, not glancing. Graded screen is two columns of small serif text with the verdict stamp competing against a long pedagogy cascade — maximal cognitive load of the field.

L2: 6.5/10 — Clear structure (amber-bordered pausad card, plan rows, fällor column), but every plan row carries its own "STARTA" button plus the "FORTSÄTT" button — four competing CTAs on one home screen. Drill itself is clean (dark cards left, tactic panel right), and graded keeps verdict + "NÄSTA FRÅGA" adjacent, but the overshoot-stamp/triple-reveal-wave choreography is ceremony repeated dozens of times a day.

L3: 7/10 — "Det här räcker idag" as the plan header is the best barrier-lowering copy in the set, and the graded view's moss-washed row + tagged steps (Kärna/Fördjupning) invite reading. But the home splits commitment across two columns with two start buttons ("Återuppta där du var" left, "Starta dagens pass" right), and the drill's left-rail tactic card pulls the eye off the question axis.

L4: 6.5/10 — The dark resume slab is the highest-contrast object on the page (genuinely fastest-to-find), and putting "Dagens pass: 16 minuter" in the greeting itself sells the small commitment. But the ruled-paper lines run behind every element including the drill options — permanent background stripes are exactly the visual noise an ADHD daily driver doesn't need — and blur-clearing rotated stamps + shake-on-wrong are punitive theater.

L5: 5.5/10 — The narrow ledger option column is actually a good fixation width, but the whole composition renders small, low-contrast caps labels everywhere, and the graded view returns to dense two-column archival text. As a twice-daily instrument it strains rather than supports.

L6: 5.5/10 — Brass-on-ink-green keeps glare low for evening, but contrast is marginal across the home (the small render shows stat labels nearly dissolving), each plan row again has its own "starta", and the graded verdict is a small yellow box that doesn't pop from the dark field. A self-drawing course line is a spectator feature, not a daily tool.

L7: 6/10 — Structurally one of the most glanceable homes (boxed 1.4/12/16, big 8/5/3 minute numerals per plan row, large red "FORTSÄTT PASSET"). But the graded screen renders the *correct* chosen row AND the verdict slab in alarm red — "RÄTT" in a red slab reads as failure at a glance, a daily-use semantic miscue, and the slam-with-overshoot pulse adds adrenaline to a tool that should be calm.

L8: 8.5/10 — True black with one green accent is the lowest-noise canvas in the set; the plan card's closing line "Tre block, 16 minuter — sedan är dagen klar. Inget mer krävs." is precisely the motivational framing that gets an ADHD-PI student to start. Drill is a single calm column (tactic card → five pills), and graded keeps a green-outlined row, a small RÄTT pill and tagged steps. Deductions: auto-revealing pedagogy removes the user's pacing control, and true black on a desktop afternoon is harsher than on OLED phone.

L9: 5.5/10 — A breathing-glow readiness dial as the home hero is ambient motion in the corner of your eye every single day — the opposite of focus protection. The drill page itself is serviceable (large tactic card, boxed options), but the graded view is dim and dense, and amber-shiver on wrong plus expanding rings keep the choreography louder than the content.

L10: 7/10 — The calmest *tone* of the set: "Ett steg i taget — resten kan vänta," and the graded verdict "RÄTT — Lugnt och säkert, det sitter." is coaching language done right. But decorative background orbs sit behind the drill options (mild but real competition with the question), the three side-by-side fokus cards scan worse than any list, and auto-advance takes pacing away.

L11: 7/10 — Best drill ergonomics for the desktop half of the ritual: visible keycaps on every option, a thin progress bar, 140ms zero-bounce feedback — instant clarity. Graded is dense but rigorously ordered (TRE STEG, then VARFÖR DE ANDRA LOCKAR). The home fails the prime directive though: the resume is a slim row with a small keycap glyph, visually weaker than the stat boxes above it, and the all-mono texture flattens hierarchy at a glance.

L12: 7/10 — The italic cobalt "Rätt." with "Snyggt — taktiken höll hela vägen." is the most dignified verdict in the set, and the numbered serif plan is clean. But the centered masthead ceremony (huge "1,4" display before anything actionable) pushes the resume and plan down a scroll, and the centered drill axis means more eye travel per question; ceremony taxes a 16-minute daily loop.

L13: 8.5/10 — Near-invisible chrome makes the lone resume card the de facto fastest element, and the empty-checkbox plan rows give ADHD-friendly completion affordances. The drill is the quietest in the set — eyebrow, headword, blue tactic panel, five white cards, nothing else — and graded answers with a drawn check, a quiet "RÄTT Precis så.", then a 1s hold before the pedagogy cascade: a designed breath that paces reading without seizing control. Docked half-step: the verdict is *so* quiet that peripheral-glance confirmation is weaker, and the headword loses its specimen presence.

L14: 8/10 — A disciplined document: stats in three labeled columns, an indigo "Återuppta" button on the pausad row, 01/02/03 plan, and a graded view where the green "RÄTT SVAR" row, ruled RÄTT verdict, and "Genomgång · 3 STEG" form an audit trail that's easy to re-enter mid-thought. Slightly generic-dashboard in feel, and the noted auto-advance pedagogy subtracts control; otherwise daily-driver solid on both widths.

## Top 3

1. **D** — This is the only candidate where every ADHD-critical test passes simultaneously. The home screen has exactly one filled button and it's the resume ("Fortsätt" on the paused-session card); the three numbers that matter (1.4, 12 dagar, 16 min) sit in a single labeled row readable in under a second; the plan and fällor are flat hairline rows with zero card chrome to parse. The drill keeps headword → tactic → options on one uninterrupted vertical axis, with the tactic styled as a quiet indented aside rather than a competing panel. The graded state (the screen seen ~80 times a day) is the best in the set: a soft green wash + check on the chosen row gives instant peripheral confirmation, and the numbered pedagogy panel is contained enough to invite reading without feeling like homework. The 150–220ms instant-clarity motion grammar matches the rep cadence: feedback arrives before the next thought, never performs.

2. **L8** — The strongest motivation psychology in the field. The plan card literally closes with "Tre block, 16 minuter — sedan är dagen klar. Inget mer krävs." — a contract that makes starting cheap, which is the entire battle for an ADHD-PI daily ritual. The single 240° arc gives the 1.4→2.0 trajectory one glanceable shape instead of a dashboard of widgets; true black with one green accent is the lowest-visual-noise ground in the set and ideal for the phone half of usage. The drill column is clean and the graded hierarchy (outlined row → RÄTT pill → lösning → tagged steps) holds. It loses to D only on the auto-revealing pedagogy (removes the user's own pacing — risky when the post-grade moment is where learning happens) and on desktop-daylight comfort of pure black.

3. **L13** — The best argument that calm *is* the feature. Chrome is near-invisible, so the resume card and the plan's empty checkboxes carry all the affordance weight — and checkboxes are a genuinely good ADHD device: tomorrow's home screen promises three small, finishable boxes. The drill protects the question completely (nothing on screen but eyebrow, headword, tactic, five cards), and the graded choreography — self-drawing check, dissolving ring, one-second hold, then cascade — is the only design that *paces* the pedagogy reveal without confiscating control. The trade-off is deliberate underexpression: the quiet "RÄTT Precis så." verdict requires foveal reading where D's green wash works peripherally, and across months of daily use the near-zero brand presence could read as sterile rather than serene.

## Bottom 3

1. **L1** — A three-column broadsheet is the wrong instrument for a daily start moment: the resume is one small dark box embedded in dense newsprint columns, so the very first task of the day (find "continue") requires search instead of recognition. The graded view compounds it — long pedagogy cascade across narrow columns, angled verdict stamp competing with strikethroughs — maximum simultaneous stimuli at exactly the moment the student should be processing one explanation. Beautiful as an artifact, exhausting as a tool.

2. **C0** — Fails the resume test outright: "FORTSÄTT HÄR →" is small mono text with no button affordance, optically weaker than the decorative greeting above it, and the score readout degrades into dashes rather than a number you can absorb in a glance. The graded screen's verdict is a two-word text fragment at the top of a dense right-hand pedagogy column — after answering, your eye has to hunt for whether you were right. Quiet reveal fades are fine, but here quiet means underspecified.

3. **L9** — The readiness dial with a breathing glow puts continuous ambient motion on the screen the student opens every day — a standing invitation for attention capture before the session even starts. The deep-night palette plus amber accents leaves the graded view dim and undifferentiated (small render shows verdict and steps merging into the field), and the expanding-ring verdict choreography spends the user's attention on the animation rather than the explanation. It optimizes for atmosphere over the 16 minutes of actual work.

## Synthesis wish

**D's skeleton + L8's contract copy + L13's plan checkboxes and graded pacing + L11's drill keycaps + F's dark adaptability.** Take D's home architecture (one labeled stat row, one filled resume button, flat hairline lists) as the chassis, because it's the only layout where the scan path never forks. Set the plan's closing line from L8 ("Tre block, 16 minuter — sedan är dagen klar. Inget mer krävs.") under L13's checkbox rows — contract framing plus finishable boxes is the strongest start-trigger combination observed. In the drill, keep D's single-axis tactic-above-options composition but adopt L11's visible keycaps on options for the desktop half of the ritual, since a–e keyboard answering is the actual daily input method. For grading, D's instant green wash for peripheral confirmation, followed by L13's one-second hold before the pedagogy cascades — instant verdict, paced learning, no auto-advance. And carry F's proven light/dark dual rendering (rdF-drill vs rdF-drill-dark held composition perfectly) so the same instrument serves morning desktop and late-evening phone without strain.

(Note for the chair: rdE-graded and any rdF-graded were not captured; E and F scores reflect that evidentiary gap.)
agentId: a3a70a058692bde05 (use SendMessage with to: 'a3a70a058692bde05' to continue this agent)
<usage>subagent_tokens: 126576
tool_uses: 53
duration_ms: 283509</usage>
=== JUDGE 4 — TYPOGRAPHY & CRAFT ===
## Scores

C0: 7.5/10 — Real editorial craft: lowercase serif specimen headword, mono eyebrows, hairline rules, and marginal step numerals (01/02/03) beside the option list in the graded view. But the graded pedagogy is squeezed into a narrow right column at small serif sizes — the densest text gets the least generous measure — and the home page leaves a vast dead zone below two items.

D: 7/10 — Disciplined hierarchy: mono eyebrows (PROGNOS/SVIT/IDAG), right-aligned mono minutes, consistent hairline rows; the graded steps use bold sans heads with mono LOCKAR/MEN tags that genuinely aid scanning. But the all-sans headword "eftertrakta" has no specimen character for a vocabulary product, and the whole reads as competent-generic rather than crafted.

E: 5/10 — The pill-card radius is the loudest typographic element on every screen; option rows are airy cards with no rule rhythm, the "12 / dagar i rad" stat floats right with no anchor, and hierarchy is carried almost entirely by size of one number. Costume softness, little type craft; graded (the real test) wasn't even captured.

F: 8/10 — The italic Newsreader display ("God eftermiddag", "eftertrakta") against mono numerals 1.4/12/16 on a hairline axis grid with left-rail mono labels (PÅBÖRJAD, 16 MIN / 3 MOMENT, VÄLJ SYNONYM) is genuine compositional craft, and the dark/ink variant holds the same structure. Docked because the graded state — the typography stress test — is unverified, and an italic headword slightly undercuts dictionary authority.

L1: 7.5/10 — Believable broadsheet: red italic "sättarbordet" flag, serif options on hairlines, mono key hints, big serif step numerals in the graded view. The 3-column home is overset though — at the captured size columns crowd and the resume card competes with the plan column; preciousness risk.

L2: 7/10 — Ivory serif on blue-black with amber mono eyebrows (TAKTIK INNAN DU SVARAR) is a coherent pairing, and the graded steps carry KÄRNA/FÖRDJUPNING tags inline with heads. But long pedagogy paragraphs sit as light small serif on dark inside nested cards — sustained-reading comfort is the weakest part of exactly the screen that matters most.

L3: 8.5/10 — The apparatus is real: dash-tick progress meter, taktik card with a heavy top rule in the margin column, didone-scale "1.4" numerals, red mono running question ("VILKET ORD LIGGER NÄRMAST?") with trailing rule, and in graded — large red serif step numerals 1./2. with mono Kärna/Fördjupning tags and a moss wash on the picked row. Serif/sans/mono roles are cleanly divided; spacing rhythm holds across all three screens.

L4: 7.5/10 — The protokoll conceit lands hard on home: the red italic "16 minuter." inside the serif headline and barcode streak ticks are memorable, and graded steps with big red script numerals read well. But the ruled-paper lines run beneath option rows and body text without baseline agreement — texture crossing live reading text is decorative noise, exactly where the lens says it shouldn't be.

L5: 6.5/10 — Ledger framing with inset-rule option boxes and oxblood headings is tidy, but the headword is timid (smallest hero of the paper-family labs), options sit in hesitant boxed cards, and the graded view (small capture) shows the pedagogy compressed without the confident step apparatus its siblings have.

L6: 6.5/10 — Letterspaced ivory serif headword over brass mono labels has atmosphere, and the chart-grid restraint is consistent. But brass all-caps mono does nearly all hierarchy work (monotone after three screens), and long graded paragraphs in low-contrast ivory-on-ink-green are a fatigue problem for the densest text.

L7: 6.5/10 — Internally consistent athletic system: condensed caps masthead, big condensed 8/5/3 minute numerals, red number rail. But the graded verdict is a full-bleed red slab plus a fully red correct row plus red step numerals — the loudest grading moment of all 18, and the condensed-caps register fights the "serious, calm" brief. Craft present, register wrong.

L8: 5.5/10 — Fitness-tracker typography: rounded sans, green arc dial, pill RÄTT stamp. The graded steps are legible but set as gray-on-true-black cards with tag chips — no typographic hierarchy beyond weight, headword is plain bold sans. Reads as Whoop, not as a top-tier educational product.

L9: 5.5/10 — Generic dark-dashboard type: bold sans headword, teal panel, evenly-weighted option cards. The dial and breathing glow carry the identity; the type carries almost nothing — eyebrows, steps and body are all the same quiet gray sans, and graded density (small capture) shows no step apparatus beyond numbered circles.

L10: 6/10 — The calming-pill verdict ("RÄTT — Lugnt och säkert — det sitter.") and navy lösning band are nice moments, but decorative orbs drift behind text, the cream-circle dial is costume, and hierarchy is mushy — orange eyebrows, slate heads and soft cards all at similar visual temperature. Pleasant, not crafted.

L11: 6.5/10 — The keycap/mechanical system is honest about itself: mono numerals, blue STAMORDSKARTAN panel with rule, restrained 140ms register matches the type. But mono-adjacent everything means the long graded pedagogy is set cold — small gray sans on near-black with color (one blue) as the only hierarchy channel. Precision without warmth.

L12: 9/10 — The best pure typography in the field. Home: didone "1,4 / 2,0 prognos" with the correct Swedish decimal comma, cobalt small-caps delta, serif numerals 1./2./3. on the plan, oldstyle ×3 multipliers. Graded: the verdict is the word itself — "Rätt." in cobalt italic display — then a bold serif lede between rules, then steps with cobalt serif numerals and ~75-char serif body at generous leading. The dense pedagogy is set like a well-made book page; nothing is costume.

L13: 7/10 — Craft-by-restraint: hairlines only, one quiet blue, "RÄTT Precis så." as a whispered verdict, "Så tänker du" steps with comfortable ~70-char sans measure. The sustained-reading setting is genuinely good; the cost is total typographic anonymity — the headword barely outranks a section label, which for a vocabulary specimen product is a real miss.

L14: 7.5/10 — Audited-document discipline: mono breadcrumb (HP-COACH / ÖVNING), hairline stat columns, mono 01/02/03 marginal numerals, tabular figures right-aligned, "Genomgång — 3 STEG" with the thin rule drawn under RÄTT. The graded body is among the most readable of all 18. What's missing is any display register — the headword is a modest bold sans, so hierarchy tops out early.

## Top 3

1. **L12** — This is the only candidate where every typographic decision survives scrutiny at both ends of the scale. At display size: the masthead "God eftermiddag.", the didone score with a locale-correct decimal comma ("1,4"), and a verdict rendered not as a badge or stamp but as a typeset word — "Rätt." in cobalt italic — which is the most confident grading moment in the field precisely because it trusts type alone. At reading size: the graded pedagogy (solution lede in bold serif between rules, cobalt serif step numerals, ~75-character measure, generous leading) is the best sustained-reading setting of all 18 — the steps and distractor analyses read like a book page, not a card stack. One cobalt, ivory, ink: the hierarchy is carried by size, weight, slope and number style, never by chrome.

2. **L3** — The richest apparatus that stays functional. The margin column does real work (taktik card with its heavy top rule, dash-tick progress, "Svara med A–E" hint), the red mono running question with trailing rule is a working editorial device, and the graded view divides labor cleanly: large red serif step numerals for wayfinding, mono Kärna/Fördjupning tags for register, moss wash for state. Serif, sans, and mono each have one job and keep it. It loses to L12 only on body-text setting — its step paragraphs are a notch smaller and tighter than ideal for the four distractor analyses.

3. **F** — The strongest composition among the token-bound candidates and the best home page in the field: italic Newsreader display against mono numerals on a drawn hairline axis, with left-rail mono labels giving every section a typographic address (PÅBÖRJAD, 16 MIN / 3 MOMENT, MÖNSTER). The drill keeps the same axis: marginal "ORD 3/10" and "VÄLJ SYNONYM" make the page self-indexing. The dark variant proves the system is structural, not cosmetic. It ranks third rather than higher because the graded state — where the long pedagogy lives — was not captured, and through this lens that's the screen that decides everything.

## Bottom 3

16. **L9** — The identity lives entirely in the dial and glow; the type is interchangeable dark-dashboard sans. Headword, eyebrows, options, steps — all the same family, weight-only hierarchy, no display register, no numeral craft. Remove the teal and nothing typographic remains.

17. **L8** — Rounded sans + green arc + pill stamp is a fitness tracker's typography transplanted onto a pedagogy product. The graded view sets the densest content as gray cards on true black with chip tags — legible but characterless — and the verdict (spring-pop pill "RÄTT") is gamified register, the explicit anti-goal.

18. **E** — The weakest craft signal of all: pill-radius cards do all the visual work, the stat block has a floating right-aligned "12 dagar i rad" with no compositional anchor, options are shadowed capsules with no rule rhythm, and the one screen this lens cares most about — graded, with steps and distractor analyses — doesn't exist in the submission. What is shown is soft SaaS default.

## Synthesis wish

Take **L12's reading machinery** — the typeset verdict word ("Rätt."), the bold serif solution lede between rules, the serif step numerals and ~75-char book-page measure for steps and distractor analyses — and mount it inside **F's axis composition**: the hairline grid, left-rail mono section labels, and mono-numeral stat row on home (rebinding L12's didone moments to the product's existing Newsreader/Inter Tight/JetBrains Mono tokens, which F proves can carry this). Then borrow **L3's margin apparatus** for the drill: the taktik card with heavy top rule and dash-tick progress living in the left column, so the tactic is spatially distinct from the question instead of stacked above it. The reasoning: L12 wins the sustained-reading problem, F wins the wayfinding/composition problem, and L3 wins the apparatus problem — they are non-overlapping strengths, all achievable in the existing type stack, and none of them depends on costume (no ruled paper, no orbs, no stamps-as-images — the craft stays in the typesetting itself).
agentId: a8932170cd6446261 (use SendMessage with to: 'a8932170cd6446261' to continue this agent)
<usage>subagent_tokens: 124874
tool_uses: 53
duration_ms: 271617</usage>
=== JUDGE 5 — INTERACTION & MOTION ===
## Judge lens: Interaction & motion

**Standing caveat, stated up front:** I judged from static graded screenshots plus written motion notes. Anything about easing, springs, slams, shakes, breathing glows, or stagger feel is *described-not-seen* — I weight what the statics prove (state clarity, verdict placement, keyboard affordance visibility, layout that motion must traverse) above choreography claims. Additionally, **E and F have no graded screenshot at all**, so their grading verdicts rest almost entirely on notes; I cap how high they can score. L5, L6, and L9's graded captures are low-resolution, which limits fine-grained reading.

## Scores

**C0: 6/10** — Statics show legible but whisper-quiet grading: picked row bolded with a tiny mono `RÄTT` tag and "Rätt. Vidare." in the pedagogy column; non-answers fade nicely. For the product's emotional core repeated tens of times daily, "state recolor without designed choreography" gives clarity but zero payoff — correct and serious, never satisfying.

**D: 8/10** — Best-evidenced fast system: graded static shows an unmistakable green-washed picked row with check glyph, `RÄTT` confirmation, and a clearly bounded LÖSNING card; home is a true command center. 150–220ms "instant clarity" timing plus ringing the correct row on a wrong pick is exactly right for high-repetition; pedagogy stagger at 60ms is restrained. Choreography partly described-not-seen, but the static state system already works.

**E: 5/10** — No graded capture: verdict badge, wash, and float-up-correct are *entirely* unverified claims, and I must score accordingly. What I can see — heavy-shadowed pill cards and 320–380ms soft floats — reads slower and softer than a tens-of-times-daily loop wants; springs settling 0.985→1 on every option risk cumulative fatigue.

**F: 7/10** — Also no graded static (drill + dark only), so the grading story is on trust. But the visible evidence is strong for my lens: explicit "Tangenter a–e väljer" affordance under the options, a left meta-spine that gives the described slide-from-spine choreography a real axis, and the letter-spacing headword settle is a signature that costs nothing in repetition. Docked a point for the unverifiable core moment.

**L1: 6/10** — Graded static proves good state discrimination: non-answers at ~38%, picked row carrying `RÄTT SVAR`, angled stamp beside the headword. But a -6° multiply-blend stamp slam plus "long cascade" is theater that will wear thin by the tenth rep of the day; type is also small, so the motion serves a dense page.

**L2: 7/10** — Dark graded static is exemplary on control: green-outlined picked row + `RÄTT SVAR` tag, a `RÄTT` stamp, **and a visible NÄSTA FRÅGA button** — the user owns the next beat. Shake-on-wrong (described) is the one ADHD-unfriendly note; three pedagogy waves at 0.15/0.3/0.45s are sensibly quick.

**L3: 7/10** — Läsesalen graded static is one of the clearest: filled green D-circle, `RÄTT SVAR` tag, tilted stamp near the headword, boxed LÖSNINGEN, and visible `Svara med A–E · Enter för nästa` affordance in the margin. Streak ticks cascading at 45ms is a nice daily-ritual touch; 45% dimming of others is proven in the static. The stamp's back-out overshoot is the only excess.

**L4: 6/10** — Ruled-paper graded static is legible (highlighted D row, tilted stamp, drawn rules), and the keyboard hint "Svara med A–E eller klicka" is visible. But scale 2.1→0.94 with blur-clearing rotation is the heaviest stamp in the set — a once-per-session flourish performed eighty times a day; the ruled lines also mean every entrance redraws a lot of chrome.

**L5: 5/10** — Low-res capture, but visible problem: the `RÄTT` stamp floats in dead whitespace below the options, disconnected from both the picked row and the headword — verdict placement is the weakest of the stamp family. Ink-settle blur rises are described-not-seen; inset oxblood/green rules for wrong/correct sound subtle to the point of ambiguity.

**L6: 5/10** — Dark-green graded static is dim: picked-row highlight and `RÄTT SVAR` tag exist but contrast between idle/picked/dimmed states is the lowest I can verify. Motion notes admit it "reuses the stamp curve" — derivative choreography on top of the weakest state legibility.

**L7: 4/10** — The graded static disqualifies itself: the *correct* row floods full-saturation red with white text, and the verdict slab is also red — red-for-RÄTT fights a near-universal wrong-answer convention, so every grading moment costs a semantic double-take. Add a 1.18→0.97 slab slam plus pulse ring, ~1s cascade, and this is the most exhausting candidate for a daily tool, despite otherwise crisp layout.

**L8: 6/10** — Black graded static is clean (green-ringed picked pill, green `RÄTT` pill) and state clarity is fine. But pedagogy auto-reveals after 900ms — wrong call: the post-grade breath is the user's beat, and in a tens-daily loop forced reveals compound into loss of agency. The 1.2s arc dashoffset on entry is also slow for a screen visited constantly.

**L9: 5/10** — Two pacing violations: a 1.7s dial sweep settling into a *perpetual* 4.4s breathing glow on the daily command center (sustained ambient motion is exactly what an ADHD-PI user doesn't need idling in view), and auto pedagogy at 750ms. Graded capture is too small to fully verify the sonar verdict; what's visible is adequate but dim.

**L10: 4/10** — Weakest verified state clarity of the light themes: the verdict pill ("RÄTT · Lugnt och säkert — det sitter") sits *above the options* where the tactic was, far from the picked row, whose soft green tint barely separates from untouched cream siblings. The calming register is on-brand, but a 900ms exhale plus AUTO-ADVANCE at 1300ms makes the product breathe at its own tempo, not the user's — per rep, per day, that's the wrong owner of time.

**L11: 7/10** — The mechanical thesis (120–140ms snaps, no bounce) is the correct pacing philosophy for high repetition, and the graded static shows a tidy system: green-bordered row with right-aligned check, verdict rail "RÄTT · Vilja ha — exakt.", stacked LÖSNING/TRE STEG cards. Two deductions: non-picked rows on near-black run low-contrast, and the described 650ms dead wait before cards contradicts the instant ethos.

**L12: 7/10** — The big italic cobalt "Rätt." centered under the options is the most *characterful* verdict in the set that still reads serious — certification by typography. Graded static shows clean state separation (indigo-tinted picked row, filled d badge) and solution at 320ms is brisk. The scale-1.45-with-rotation-and-blur stamp entrance is more theater than the register needs; strikethrough-on-wrong is proven legible only in notes.

**L13: 9/10** — Best grading moment on verified evidence: the letter chip *becomes* a drawn check (chip→glyph swap is a state change you cannot misread), blue-bordered row, quiet "RÄTT · Precis så." — and the wrong-answer path is a calm rust X-draw with a 3px settle, **never a shake**. That is the only candidate that designed the failure case as kindly as the success case, which matters most in a tool you fail in daily. The 380ms draw + dissolving ring is a real micro-payoff that won't exhaust; 1s hold before cascade preserves a beat. Ring/draw feel is described-not-seen, but the static state system alone is top of field.

**L14: 7/10** — "Certification, not celebration" lands in the static: green-tinted picked row + mono `RÄTT SVAR` tag, grayed non-answers, `RÄTT` verdict word with a drawn rule beneath, numbered Genomgång — the most institutional, on-register graded page here. One real flaw: pedagogy auto-advances after 750ms, surrendering the user's beat; without that it's an 8.

## Top 3

**1. L13.** It is the only candidate whose grading choreography was designed around *both* outcomes of the core loop. The verified static shows the strongest possible state grammar — the answer chip itself transmutes into a check, so idle/picked/graded are different *objects*, not just different colors — and the written wrong-path (calm rust X drawn, small settle, explicitly never a shake) is the most ADHD-respectful failure treatment in the set. The payoff is small, fast, and renewable: a 380ms self-drawing check inside a scale-pop is satisfying on rep 1 and inoffensive on rep 80, which is precisely the brief. The 1s hold before pedagogy cascades keeps a human beat without stealing control. My main reservation is that the verdict line is typographically quiet; it could borrow a touch more ceremony.

**2. D.** The fastest verified path from keypress to certainty. The graded static demonstrates a complete, unambiguous state system (green sweep row, glyph, RÄTT, bounded LÖSNING), the 150–220ms vocabulary is the right tempo philosophy for a tool used tens of times daily, and ringing the correct row on a wrong pick is the single most pedagogically valuable motion idea among the notes — attention goes where learning happens. Its home is also the best command-center static. It loses to L13 only on emotional character: a color sweep certifies; L13's drawn check *rewards*.

**3. L12.** The strongest argument that the payoff can be typographic rather than kinetic. The italic cobalt "Rätt." is distinctive, serious, and proportionate to the product's register — a verdict you'd respect from a coach. Verified state clarity is solid, solution arrives at 320ms, and steps at +110ms keep momentum. Ranked third because its entrance (scale 1.45, rotation, blur-to-sharp) imports stamp theater the design doesn't need, and the verdict's centered placement sits below the fold of attention relative to the picked row.

## Bottom 3

**L7.** A correct answer that turns blood-red is a state-clarity failure verified directly in the static — the one thing grading feedback must never do is make success look like an alarm. Stack on a slab slam, a pulse ring, and a ~1s cascade, and you get maximal arousal on every repetition of a moment that occurs dozens of times daily. This is the candidate most likely to *train avoidance* of the grading moment.

**L10.** Its heart is in the right place (calm, coaching subline), but the statics show the weakest verdict-to-evidence link in the set — the verdict pill renders far from the picked row, whose tint barely registers against cream — and the motion notes compound it: a 900ms exhale, then auto-advance at 1300ms. A high-repetition tool must let the user set the cadence; L10 sets it for them, slowly, every single question.

**L9.** Penalized chiefly for the home: a 1.7s dial sweep into a *permanent* 4.4s breathing glow puts unending ambient motion on the screen an ADHD-PI user opens daily to orient — the opposite of a calm command center. Auto pedagogy at 750ms repeats the agency error, and the graded capture is too murky to claim compensating state clarity (a judgment partially limited by image quality, noted).

## Synthesis wish

**L13's grading micro-interaction, set into D's tempo and state grammar, with F's keyboard affordance line and L12's typographic verdict.** Concretely: D's 150–220ms instant-clarity reveals and green-sweep/ring-the-correct-row system as the chassis; replace D's check *glyph* with L13's chip-becomes-drawn-check (and L13's no-shake rust X for wrong picks) as the once-per-question payoff; print the verdict as a single set piece of type in the manner of L12's "Rätt." — but left-aligned at the picked row, not centered; and keep F's standing "Tangenter a–e väljer" line under the options so the keyboard contract is always visible. No auto-advance anywhere — L2/L13 prove the next beat can be fast *and* owned by the user. This combination is the only one that satisfies all four of my criteria at once: instant state certainty, a renewable (non-exhausting) reward, designed kindness on failure, and pacing authority left with the student.
agentId: ad6d0bc2a51c07bf8 (use SendMessage with to: 'ad6d0bc2a51c07bf8' to continue this agent)
<usage>subagent_tokens: 119331
tool_uses: 45
duration_ms: 259600</usage>