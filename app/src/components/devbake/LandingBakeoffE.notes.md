# LandingBakeoffE — landing-page bake-off, editorial lens (P2-2.1)

Two full phone-first landing concepts in the M3 Boksidan idiom.
Fixtures: `LAND_E1`, `LAND_E2` in `LandingBakeoffE.tsx`. No routes here —
the orchestrator stitches `/dev/landing-bakeoff`.

## E1 · "Första lektionen" — demonstration-led

**Thesis:** the landing IS the first lesson. Nobody at 23:00 on a phone
wants to be sold pedagogy — so the page *performs* it. The hero states
the product's actual claim ("Högskoleprovet är inte ett kunskapsprov.
Det är ett mönsterprov.") and then, before asking for anything, teaches
one real thing in five seconds: the morphological decomposition of
REVIDERA (re- / vid / -era, roots-before-glosses). If that moment lands,
the three-layer section that follows is explanation, not marketing.

- **Signature motion:** the hero sets like ink in three reading-pace
  beats (opacity only, Arket-lawful — nothing travels), then the accent
  rule draws under the claim. One moment, on load, never again.
- **Marginalia** carry the coach's voice (mono, accent-left-rule). On
  phone they sit inline under the paragraph; ≥900px they move into a
  true 200px margin column (`.lde-annotated` grid).
- **Honesty as ledger:** "Vad vi inte lovar." includes the anti-user
  line (1,5+ finslipare hänvisas vidare) — the PRD's non-user list made
  into a trust signal.
- **ADHD section** names the builder ("byggd av en person med ADHD-PI
  som själv pluggar mot 2,0") — the dogfood story is the credibility.

## E2 · "Kursplanen" — transparency-led

**Thesis:** the landing is the course's front matter. A paid-only
product with no free tier earns the purchase by showing the whole road:
a title page, a real table of contents where the ToC is the exam's own
anatomy (8 delprov, dotted leaders, question counts — the numbering IS
the information, not decoration), the reading arc (koncept → exempel →
drill → repetition → prov, a genuine sequence so numbers are earned),
and terms as a plain ledger ("Villkor, i klartext") with price, promise
scope, non-fit and accountability in one place — the back cover.

- **Signature motion:** the ToC prints row by row at counting cadence
  (90ms tick, opacity only) after the title has set.
- The ledger deliberately co-locates price with the no-promise line and
  the "passar inte" line — transparency as the sales argument.

## Shared decisions

- **Copy voice:** plain, specific, no marketing theater. Short verbs,
  concrete numbers (550 kr anmälan, 160 frågor, 4 timmar). The one
  permitted flourish is the hero thesis itself.
- **Price placeholder:** "X kr" set in display serif with the X in
  accent + mono note "priset sätts före öppningen"; anchored against
  the 550 kr exam fee ("förberedelsen är ett köp, en gång — ingen
  prenumeration som tickar medan du tvekar").
- **Interactive taste:** two ORIGINAL questions written for this page
  in HP style — ORD "premiss" (distractor B slutsats, explanation
  references the prae- root, i.e. Layer 2 voice) and a NOG biobiljett
  item (correct C; explanation teaches the NOG mindset: bedöm
  lösbarhet, lös inte). Both concepts share the fixtures. Labeled
  "Övningsexempel … inte från något riktigt högskoleprov" in the card
  footer AND the colophon. **Do not swap in corpus questions (© UHR).**
- **Accountability:** colophon "HP-Coach drivs av [namn] · orgnr [—]"
  + "Högskoleprovet ges av UHR. HP-Coach är fristående."
- **CTA:** "Skapa konto" → `/sign-up`, accent pill; the page's only
  accent-filled surface (plus the X of the price and hairline accents).
- **Reduced motion:** `useMountGo(rm)` starts true under RM → final
  frame on first paint; CSS transitions collapse via media query.
- **Self-contained:** no auth, no router imports — plain `<a>` links;
  one scoped `<style>` block (`lde-` prefix), tokens only.

## Tried / rejected

- Morpheme glosses at 4px gap ran together into one mono line at 390px
  ("åter se · lat. videre verbändelse") — widened to 22px and shortened
  glosses ("se (videre)", "ändelse").
- "Hela vägen till 2,0" in the hero — reads as a results promise;
  softened to "med siktet på 2,0" to stay consistent with the honest
  section.
- A third sample question — cut; two questions with real distractor
  explanations beat three with thin ones, and the page is already long.
